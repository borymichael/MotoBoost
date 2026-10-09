// Balisage du formulaire de contact (accessibilité, anti-spam, branchement à un service).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildTemp, readPage, FULL_CONFIG } from './helpers.mjs';

let demo;
let live;
let netlify;
const forms = {};

before(async () => {
  demo = await buildTemp();
  live = await buildTemp({
    production: true,
    overrides: {
      ...FULL_CONFIG,
      form: { endpoint: 'https://forms.exemple-test.fr/f/abc123', extraFields: { access_key: 'cle-publique-test', 'subject': 'Demande "MotoBoost" <test>' } },
    },
  });
  netlify = await buildTemp({ overrides: { form: { endpoint: '/contact/', netlify: true } } });
  for (const [name, site] of Object.entries({ demo, live, netlify })) {
    const { root } = await readPage(site.dir, '/contact/');
    forms[name] = { root, form: root.querySelector('form'), html: root.toString() };
  }
});
after(() => Promise.all([demo, live, netlify].map((s) => s?.cleanup())));

test('chaque champ visible a un libellé relié et un emplacement d’erreur', () => {
  const { root, form } = forms.demo;
  const controls = form.querySelectorAll('input, select, textarea').filter(
    (c) => !['hidden'].includes(c.getAttribute('type')) && c.getAttribute('name') !== 'fax',
  );
  assert.equal(controls.length, 9, 'nom, entreprise, activité, offre, e-mail, téléphone, site, message, consentement');
  for (const control of controls) {
    const id = control.getAttribute('id');
    assert.ok(root.querySelector(`label[for="${id}"]`), `${id} : libellé`);
    const describedBy = control.getAttribute('aria-describedby').split(' ');
    const name = control.getAttribute('name');
    assert.ok(describedBy.includes(`err-${name}`), `${id} : aria-describedby doit citer err-${name}`);
    assert.ok(root.querySelector(`#err-${name}.field__error`), `${id} : zone d'erreur`);
  }
});

test('champs obligatoires marqués required ; facultatifs non', () => {
  const { form } = forms.demo;
  for (const name of ['nom', 'entreprise', 'activite', 'email', 'consentement']) {
    assert.ok(form.querySelector(`[name="${name}"]`).hasAttribute('required'), `${name} requis`);
  }
  for (const name of ['offre', 'telephone', 'site', 'message']) {
    assert.ok(!form.querySelector(`[name="${name}"]`).hasAttribute('required'), `${name} facultatif`);
  }
});

test('attributs de saisie utiles : autocomplete et types', () => {
  const { form } = forms.demo;
  assert.equal(form.querySelector('[name="email"]').getAttribute('type'), 'email');
  assert.equal(form.querySelector('[name="email"]').getAttribute('autocomplete'), 'email');
  assert.equal(form.querySelector('[name="telephone"]').getAttribute('type'), 'tel');
  assert.equal(form.querySelector('[name="nom"]').getAttribute('autocomplete'), 'name');
  assert.equal(form.querySelector('[name="entreprise"]').getAttribute('autocomplete'), 'organization');
});

test('anti-robots : champ piège masqué aux lecteurs d’écran et au clavier, horodatage présent', () => {
  const { form } = forms.demo;
  const trap = form.querySelector('.hp');
  assert.equal(trap.getAttribute('aria-hidden'), 'true');
  const input = trap.querySelector('input[name="fax"]');
  assert.equal(input.getAttribute('tabindex'), '-1');
  assert.equal(input.getAttribute('autocomplete'), 'off');
  assert.ok(form.querySelector('input[type="hidden"][name="form_loaded_at"]'));
});

test('consentement : case obligatoire reliée à la politique de confidentialité', () => {
  const { form } = forms.demo;
  const label = form.querySelector('label[for="f-consentement"]');
  assert.equal(label.querySelector('a').getAttribute('href'), '/confidentialite/');
  assert.equal(form.querySelector('#f-consentement').getAttribute('type'), 'checkbox');
});

test('zones d’état : récapitulatif d’erreurs, erreur d’envoi, succès (focalisables, masqués au départ)', () => {
  const { root } = forms.demo;
  for (const id of ['form-errors', 'form-send-error', 'form-success']) {
    const node = root.querySelector(`#${id}`);
    assert.ok(node.hasAttribute('hidden'), `${id} masqué`);
    assert.equal(node.getAttribute('tabindex'), '-1', `${id} focalisable par script`);
  }
  assert.equal(root.querySelector('#form-errors').getAttribute('role'), 'alert');
  assert.equal(root.querySelector('#form-success').getAttribute('role'), 'status');
  assert.ok(root.querySelector('#form-success [data-variant="demo"]'));
  assert.ok(root.querySelector('#form-success [data-variant="live"]'));
});

test('mode démonstration : pas d’action, avertissement visible, rien n’est présenté comme envoyé', () => {
  const { form, root } = forms.demo;
  assert.equal(form.getAttribute('data-mode'), 'demo');
  assert.equal(form.hasAttribute('action'), false);
  assert.equal(form.getAttribute('data-endpoint'), '');
  assert.match(root.querySelector('#demo-notice').text, /rien n’est transmis/);
});

test('mode live : action, endpoint, champs supplémentaires échappés, pas d’avertissement démo', () => {
  const { form, root, html } = forms.live;
  assert.equal(form.getAttribute('data-mode'), 'live');
  assert.equal(form.getAttribute('action'), 'https://forms.exemple-test.fr/f/abc123');
  assert.equal(form.getAttribute('data-endpoint'), 'https://forms.exemple-test.fr/f/abc123');
  assert.equal(root.querySelector('#demo-notice'), null);
  assert.equal(form.querySelector('input[name="access_key"]').getAttribute('value'), 'cle-publique-test');
  assert.match(html, /name="subject" value="Demande &quot;MotoBoost&quot; &lt;test&gt;"/);
  assert.equal(form.getAttribute('method'), 'post');
});

test('mode live : la CSP autorise uniquement l’origine du service de formulaire', async () => {
  const { readFile } = await import('node:fs/promises');
  const headers = await readFile(`${live.dir}/_headers`, 'utf8');
  assert.match(headers, /connect-src 'self' https:\/\/forms\.exemple-test\.fr;/);
  assert.match(headers, /form-action 'self' https:\/\/forms\.exemple-test\.fr;/);
  const demoHeaders = await readFile(`${demo.dir}/_headers`, 'utf8');
  assert.match(demoHeaders, /connect-src 'self';/);
});

test('Netlify Forms : attributs et champ form-name', () => {
  const { form } = forms.netlify;
  assert.equal(form.getAttribute('data-netlify'), 'true');
  assert.equal(form.getAttribute('netlify-honeypot'), 'fax');
  assert.equal(form.getAttribute('name'), 'contact');
  assert.equal(form.querySelector('input[name="form-name"]').getAttribute('value'), 'contact');
  assert.equal(form.getAttribute('action'), '/contact/');
});

test('l’option ?offre= correspond à des valeurs existantes du sélecteur', () => {
  const { root } = forms.demo;
  const values = root.querySelectorAll('#f-offre option').map((o) => o.getAttribute('value'));
  assert.deepEqual(values, ['mini-audit', 'visibilite', 'presence', 'suivi', 'indecis']);
  const labels = root.querySelectorAll('#f-offre option').map((o) => o.text);
  assert.ok(labels.some((l) => /79 €/.test(l)) && labels.some((l) => /199 €/.test(l)) && labels.some((l) => /49 €\/mois/.test(l)));
});
