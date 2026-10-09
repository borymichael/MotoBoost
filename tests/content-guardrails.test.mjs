// Garde-fous éditoriaux : rien d'inventé (témoignages, chiffres, certifications),
// prix cohérents, données de démonstration signalées, pages légales marquées « à compléter ».
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildTemp, readPage, visibleText, EXPECTED_PAGES } from './helpers.mjs';
import { packs, formatPrice } from '../src/content/offers.mjs';

let site;
const pages = new Map();
const text = new Map();

before(async () => {
  site = await buildTemp();
  for (const p of EXPECTED_PAGES) {
    const page = await readPage(site.dir, p);
    pages.set(p, page);
    text.set(p, visibleText(page.root.querySelector('body')));
  }
});
after(() => site?.cleanup());

const allText = () => [...text.values()].join('\n');

test('les trois prix demandés sont affichés : 79 €, 199 €, 49 €/mois', () => {
  assert.deepEqual(
    packs.map((p) => [p.name, p.price, p.unit]),
    [
      ['Pack Visibilité', 79, ''],
      ['Pack Présence', 199, ''],
      ['Pack Suivi', 49, '/mois'],
    ],
  );
  for (const p of ['/', '/offres/']) {
    for (const pack of packs) assert.ok(text.get(p).includes(formatPrice(pack)), `${p} : ${formatPrice(pack)}`);
  }
});

test('aucun autre montant en euros que les trois prix des packs', () => {
  const found = new Set([...allText().matchAll(/(\d[\d\s.,]*)\s?€/g)].map((m) => m[1].replace(/\s/g, '')));
  assert.deepEqual([...found].sort(), ['199', '49', '79']);
});

test('aucun témoignage, chiffre client, pourcentage, certification ou superlatif inventé', () => {
  const banned = [
    [/t[ée]moignage/i, 'témoignage'],
    [/certifi/i, 'certification'],
    [/\blabel(l)?is/i, 'label'],
    [/\b\d+\s?%/, 'pourcentage'],
    [/\b\d+\s+(clients?|motards?|garages?|ateliers?|concessions?|avis)\b/i, 'nombre de clients'],
    [/n°\s?1|numéro\s?1|\bleader\b|\bmeilleur(e|s)?\b/i, 'superlatif'],
    [/satisfait|taux de|résultats? (garantis?|prouvés?)/i, 'résultat revendiqué'],
    [/gratuit/i, 'gratuité (décision à prendre avec le propriétaire, voir README)'],
    [/\b(étoiles?|★)/i, 'note chiffrée'],
  ];
  for (const [p, content] of text) {
    for (const [pattern, label] of banned) assert.doesNotMatch(content, pattern, `${p} : ${label}`);
  }
});

test('aucune affirmation de conformité juridique', () => {
  for (const [p, content] of text) {
    assert.doesNotMatch(content, /(site|nous|ce document|texte|politique)\s+(est|sommes|sont)\s+(100\s?%\s+)?conforme/i, p);
    assert.doesNotMatch(content, /conforme\s+(au\s+|à la\s+)?(rgpd|cnil|loi)/i, p);
    assert.doesNotMatch(content, /rgpd[- ]compliant/i, p);
  }
  for (const p of ['/mentions-legales/', '/confidentialite/']) {
    assert.match(text.get(p), /ne constitue ni un avis juridique ni une garantie de conformité/, p);
  }
});

test('aucun paiement en ligne ni compte utilisateur', () => {
  for (const [p, { html, root }] of pages) {
    assert.doesNotMatch(html, /stripe|paypal|checkout|panier|carte bancaire|mot de passe|password|\blogin\b|se connecter/i, p);
    assert.equal(root.querySelectorAll('input[type="password"]').length, 0, p);
    const forms = root.querySelectorAll('form');
    assert.equal(forms.length, p === '/contact/' ? 1 : 0, `${p} : nombre de formulaires`);
  }
  assert.match(text.get('/'), /Aucun paiement en ligne/);
  assert.match(text.get('/faq/'), /ni paiement en ligne ni création de compte/);
});

test('données de démonstration : exemple d’audit étiqueté fictif', () => {
  const { root } = pages.get('/');
  const card = root.querySelector('figure.audit');
  assert.ok(card, 'carte d’exemple présente sur l’accueil');
  assert.match(card.querySelector('.badge--demo').text, /Démo/);
  assert.match(card.text, /données fictives/);
  assert.match(card.text, /ne correspond à aucun client/);
});

test('bandeau de démonstration visible sur toutes les pages', () => {
  for (const [p, { root }] of pages) assert.match(root.querySelector('.demo-banner').text, /Version de démonstration/, p);
});

test('pages légales : repères « À COMPLÉTER » visibles et avertissement de relecture', () => {
  for (const p of ['/mentions-legales/', '/confidentialite/']) {
    const { root } = pages.get(p);
    assert.ok(root.querySelectorAll('mark.todo[data-todo]').length >= 5, `${p} : repères à compléter`);
    assert.match(text.get(p), /À COMPLÉTER/);
    assert.match(root.querySelector('.alert--warning').text, /modèle de départ/);
  }
  const todos = site.result.todos.map((t) => t.label);
  for (const expected of ['nom ou dénomination sociale de l’éditeur', 'nom de l’hébergeur', 'durée de conservation des demandes']) {
    assert.ok(todos.includes(expected), `repère manquant : ${expected}`);
  }
});

test('politique de confidentialité : champs collectés, droits, CNIL, cookies', () => {
  const t = text.get('/confidentialite/');
  for (const needle of ['adresse e-mail', 'Vos droits', 'effacement', 'CNIL', 'Cookies et traceurs', 'ne dépose aucun cookie']) {
    assert.ok(t.includes(needle), needle);
  }
});

test('mentions légales : éditeur, hébergeur, directeur de publication', () => {
  const t = text.get('/mentions-legales/');
  for (const needle of ['Éditeur du site', 'Hébergeur', 'Directeur de la publication', 'Immatriculation']) {
    assert.ok(t.includes(needle), needle);
  }
});

test('pas de promesse de résultat : la FAQ affirme le contraire', () => {
  assert.match(text.get('/faq/'), /Garantissez-vous des résultats ?\s?\? Non/);
  assert.match(text.get('/methode/'), /Pas de promesse de classement/);
});

test('le CTA principal pointe vers le formulaire de mini-audit sur chaque page', () => {
  for (const p of ['/', '/offres/', '/methode/', '/faq/']) {
    const links = pages.get(p).root.querySelectorAll('a').map((a) => a.getAttribute('href'));
    assert.ok(links.some((href) => href.startsWith('/contact/')), p);
  }
  const hrefs = pages.get('/').root.querySelectorAll('a.btn').map((a) => a.getAttribute('href'));
  for (const id of ['visibilite', 'presence', 'suivi']) {
    assert.ok(hrefs.includes(`/contact/?offre=${id}#formulaire`), `CTA du pack ${id}`);
  }
});
