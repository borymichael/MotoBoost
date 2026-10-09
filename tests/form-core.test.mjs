import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITES,
  FIELD_ORDER,
  LIMITS,
  MESSAGES,
  assessSubmission,
  buildBody,
  normalize,
  secondsLabel,
  validateAll,
  validateField,
} from '../src/assets/js/form-core.js';

const valid = {
  nom: 'Jean Dupont',
  entreprise: 'Garage Exemple Moto',
  activite: 'atelier',
  offre: 'mini-audit',
  email: 'jean.dupont@exemple.fr',
  telephone: '',
  site: '',
  message: '',
  consentement: true,
};

test('un formulaire complet et valide est accepté', () => {
  const result = validateAll(valid);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('un formulaire vide signale les champs obligatoires, dans l’ordre du formulaire', () => {
  const result = validateAll({});
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors), ['nom', 'entreprise', 'activite', 'offre', 'email', 'consentement']);
  assert.equal(result.errors.email, MESSAGES.emailRequired);
});

test('les champs facultatifs vides ne produisent pas d’erreur', () => {
  for (const name of ['telephone', 'site', 'message']) assert.equal(validateField(name, ''), '', name);
});

test('nom : trop court, espaces seuls et trop long sont refusés', () => {
  assert.equal(validateField('nom', 'J'), MESSAGES.nom);
  assert.equal(validateField('nom', '    '), MESSAGES.nom);
  assert.equal(validateField('nom', 'a'.repeat(LIMITS.nom.max + 1)), MESSAGES.nom);
  assert.equal(validateField('nom', 'Jo'), '');
});

test('e-mail : formats valides et invalides', () => {
  for (const ok of ['a@b.fr', 'prenom.nom+tag@sous.domaine.com', 'élodie@exemple.fr']) {
    assert.equal(validateField('email', ok), '', ok);
  }
  for (const bad of ['abc', 'abc@', '@exemple.fr', 'a@b', 'a b@exemple.fr', 'a@b.c', 'a@@b.fr']) {
    assert.equal(validateField('email', bad), MESSAGES.emailInvalid, bad);
  }
  assert.equal(validateField('email', `${'a'.repeat(250)}@b.fr`), MESSAGES.emailInvalid);
});

test('téléphone : formats français et internationaux acceptés, texte refusé', () => {
  for (const ok of ['06 12 34 56 78', '0612345678', '06.12.34.56.78', '+33 6 12 34 56 78', '(02) 12 34 56 78', '0033612345678']) {
    assert.equal(validateField('telephone', ok), '', ok);
  }
  for (const bad of ['abc', '12345', '06 12 34 56 7a', '+++33612345678', '1'.repeat(20)]) {
    assert.equal(validateField('telephone', bad), MESSAGES.telephone, bad);
  }
});

test('site : domaine avec ou sans schéma accepté, valeurs absurdes refusées', () => {
  for (const ok of ['www.exemple.fr', 'exemple.fr', 'https://exemple.fr/page?x=1#a', 'http://sous.exemple.com:8080/', 'https://www.google.com/maps/place/Exemple']) {
    assert.equal(validateField('site', ok), '', ok);
  }
  for (const bad of ['exemple', 'http://', 'ftp://exemple.fr', 'not a url', 'javascript:alert(1)']) {
    assert.equal(validateField('site', bad), MESSAGES.site, bad);
  }
});

test('listes : valeurs inconnues refusées (activité, offre)', () => {
  assert.equal(validateField('activite', ''), MESSAGES.activite);
  assert.equal(validateField('activite', 'pirate'), MESSAGES.activite);
  for (const a of ACTIVITES) assert.equal(validateField('activite', a.value), '');
  assert.equal(validateField('offre', 'gratuit-a-vie'), MESSAGES.offre);
  for (const o of ['mini-audit', 'visibilite', 'presence', 'suivi', 'indecis']) assert.equal(validateField('offre', o), '');
});

test('message : limite de longueur', () => {
  assert.equal(validateField('message', 'x'.repeat(LIMITS.message.max)), '');
  assert.equal(validateField('message', 'x'.repeat(LIMITS.message.max + 1)), MESSAGES.message);
});

test('consentement : doit être coché (booléen strict)', () => {
  assert.equal(validateField('consentement', false), MESSAGES.consentement);
  assert.equal(validateField('consentement', undefined), MESSAGES.consentement);
  assert.equal(validateField('consentement', 'faux'), MESSAGES.consentement);
  assert.equal(validateField('consentement', true), '');
  assert.equal(validateField('consentement', 'oui'), '');
});

test('normalize : espaces superflus supprimés, message conservé tel quel', () => {
  const n = normalize({ ...valid, nom: '  Jean   Dupont ', message: '  Bonjour\n\nMerci  ' });
  assert.equal(n.nom, 'Jean Dupont');
  assert.equal(n.message, 'Bonjour\n\nMerci');
});

test('tous les champs du schéma sont couverts par FIELD_ORDER', () => {
  assert.deepEqual([...FIELD_ORDER].sort(), Object.keys(valid).sort());
});

test('anti-robots : champ piège rempli', () => {
  const r = assessSubmission({ honeypot: 'http://spam.example', elapsedMs: 60000 });
  assert.deepEqual(r, { ok: false, reason: 'honeypot' });
  assert.equal(assessSubmission({ honeypot: '   ', elapsedMs: 60000 }).ok, true, 'espaces seuls = champ vide');
});

test('anti-robots : envoi trop rapide, avec délai restant', () => {
  const r = assessSubmission({ elapsedMs: 800, minFillMs: 3000 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'too-fast');
  assert.equal(r.retryInMs, 2200);
  assert.equal(assessSubmission({ elapsedMs: NaN }).reason, 'too-fast');
  assert.equal(assessSubmission({ elapsedMs: 3000, minFillMs: 3000 }).ok, true);
});

test('anti-robots : délai entre deux envois', () => {
  const now = 1_000_000;
  const r = assessSubmission({ elapsedMs: 9000, lastSubmitAt: now - 10_000, now, cooldownMs: 30_000 });
  assert.equal(r.reason, 'cooldown');
  assert.equal(r.retryInMs, 20_000);
  assert.equal(assessSubmission({ elapsedMs: 9000, lastSubmitAt: now - 31_000, now, cooldownMs: 30_000 }).ok, true);
  assert.equal(assessSubmission({ elapsedMs: 9000, lastSubmitAt: 0, now }).ok, true);
});

test('corps de requête : champ piège exclu, horodatage ajouté, encodage correct', () => {
  const body = buildBody(
    { nom: 'Jean & Co', message: 'Allô ?\nOui', fax: 'spam', vide: null },
    { loadedAt: Date.UTC(2026, 0, 2, 3, 4, 5) },
  );
  assert.equal(body.get('nom'), 'Jean & Co');
  assert.equal(body.get('message'), 'Allô ?\nOui');
  assert.equal(body.has('fax'), false);
  assert.equal(body.has('vide'), false);
  assert.equal(body.get('form_loaded_at'), '2026-01-02T03:04:05.000Z');
  assert.match(body.toString(), /nom=Jean\+%26\+Co/);
});

test('libellé de délai : pluriel', () => {
  assert.equal(secondsLabel(1), '1 seconde');
  assert.equal(secondsLabel(1001), '2 secondes');
  assert.equal(secondsLabel(0), '1 seconde');
});
