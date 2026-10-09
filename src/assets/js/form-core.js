// Logique pure du formulaire de contact : aucune dépendance au DOM.
// Partagée entre le navigateur (form.js), le build (options des listes) et les tests.

export const ACTIVITES = [
  { value: 'atelier', label: 'Atelier / garage moto' },
  { value: 'concession', label: 'Concession' },
  { value: 'location', label: 'Location de motos' },
  { value: 'ecole', label: 'École de conduite moto' },
  { value: 'boutique', label: 'Boutique équipement / accessoires' },
  { value: 'preparateur', label: 'Préparateur / customisation' },
  { value: 'autre', label: 'Autre activité moto' },
];

// Les libellés des packs sont construits à partir de src/content/offers.mjs.
export const OFFRE_AUDIT = 'mini-audit';
export const OFFRE_INDECIS = 'indecis';
export const OFFRE_VALUES = [OFFRE_AUDIT, 'visibilite', 'presence', 'suivi', OFFRE_INDECIS];

export const LIMITS = {
  nom: { min: 2, max: 80 },
  entreprise: { min: 2, max: 100 },
  email: { max: 254 },
  message: { max: 1500 },
};

export const MESSAGES = {
  nom: 'Indiquez votre nom (2 caractères minimum).',
  entreprise: 'Indiquez le nom de votre entreprise ou enseigne.',
  activite: 'Choisissez votre type d’activité.',
  offre: 'Choisissez une option dans la liste.',
  emailRequired: 'Indiquez votre adresse e-mail.',
  emailInvalid: 'Cette adresse e-mail semble incomplète. Exemple : nom@exemple.fr',
  telephone: 'Ce numéro semble incorrect. Exemple : 06 12 34 56 78 (ou laissez vide).',
  site: 'Cette adresse semble incorrecte. Exemple : www.exemple.fr (ou laissez vide).',
  message: `Votre message est trop long (${LIMITS.message.max} caractères maximum).`,
  consentement: 'Cochez la case pour que nous puissions traiter votre demande.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE_RE = /^(https?:\/\/)?([a-z0-9¡-￿-]+\.)+[a-z¡-￿]{2,}(:\d+)?([/?#]\S*)?$/i;

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** Normalise les valeurs saisies (espaces superflus, types). Ne modifie pas le message (retours à la ligne). */
export function normalize(values) {
  return {
    nom: clean(values.nom),
    entreprise: clean(values.entreprise),
    activite: clean(values.activite),
    offre: clean(values.offre),
    email: clean(values.email),
    telephone: clean(values.telephone),
    site: clean(values.site),
    message: String(values.message ?? '').trim(),
    consentement: values.consentement === true || values.consentement === 'oui',
  };
}

export const FIELD_ORDER = [
  'nom',
  'entreprise',
  'activite',
  'offre',
  'email',
  'telephone',
  'site',
  'message',
  'consentement',
];

/** Retourne '' si le champ est valide, sinon le message d'erreur en français. */
export function validateField(name, rawValue) {
  const value = normalize({ [name]: rawValue })[name];
  switch (name) {
    case 'nom':
      return value.length >= LIMITS.nom.min && value.length <= LIMITS.nom.max ? '' : MESSAGES.nom;
    case 'entreprise':
      return value.length >= LIMITS.entreprise.min && value.length <= LIMITS.entreprise.max
        ? ''
        : MESSAGES.entreprise;
    case 'activite':
      return ACTIVITES.some((a) => a.value === value) ? '' : MESSAGES.activite;
    case 'offre':
      return OFFRE_VALUES.includes(value) ? '' : MESSAGES.offre;
    case 'email':
      if (!value) return MESSAGES.emailRequired;
      return value.length <= LIMITS.email.max && EMAIL_RE.test(value) ? '' : MESSAGES.emailInvalid;
    case 'telephone': {
      if (!value) return '';
      const digits = value.replace(/[\s.\-()]/g, '').replace(/^00/, '+');
      return /^\+?\d{9,15}$/.test(digits) ? '' : MESSAGES.telephone;
    }
    case 'site':
      return !value || SITE_RE.test(value) ? '' : MESSAGES.site;
    case 'message':
      return value.length <= LIMITS.message.max ? '' : MESSAGES.message;
    case 'consentement':
      return value === true ? '' : MESSAGES.consentement;
    default:
      return '';
  }
}

/** Valide tous les champs. `errors` ne contient que les champs invalides, dans l'ordre du formulaire. */
export function validateAll(values) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const message = validateField(name, values[name]);
    if (message) errors[name] = message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Protection basique contre les envois automatisés (côté navigateur uniquement :
 * un robot qui n'exécute pas ce code doit être arrêté par le service de formulaire).
 *  - honeypot : champ invisible rempli = robot probable
 *  - too-fast : formulaire envoyé avant `minFillMs` après son affichage
 *  - cooldown : deuxième envoi avant `cooldownMs`
 */
export function assessSubmission({
  honeypot = '',
  elapsedMs,
  minFillMs = 3000,
  lastSubmitAt = 0,
  now = Date.now(),
  cooldownMs = 30000,
}) {
  if (String(honeypot).trim() !== '') return { ok: false, reason: 'honeypot' };
  if (!Number.isFinite(elapsedMs) || elapsedMs < minFillMs) {
    const wait = Number.isFinite(elapsedMs) ? minFillMs - elapsedMs : minFillMs;
    return { ok: false, reason: 'too-fast', retryInMs: wait };
  }
  if (lastSubmitAt && now - lastSubmitAt < cooldownMs) {
    return { ok: false, reason: 'cooldown', retryInMs: cooldownMs - (now - lastSubmitAt) };
  }
  return { ok: true };
}

/** Corps de la requête (application/x-www-form-urlencoded). Le champ piège n'est jamais envoyé. */
export function buildBody(entries, { honeypotName = 'fax', loadedAt } = {}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (key === honeypotName || value == null) continue;
    body.append(key, String(value));
  }
  if (loadedAt) body.set('form_loaded_at', new Date(loadedAt).toISOString());
  return body;
}

export function secondsLabel(ms) {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return `${s} seconde${s > 1 ? 's' : ''}`;
}
