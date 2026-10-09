// Offres MotoBoost — source unique des prix et du contenu des packs.
// Les prix viennent de la demande initiale ; le CONTENU de chaque pack est une
// PROPOSITION à valider (voir README → « Décisions à prendre »).

export const nbsp = ' ';

export const packs = [
  {
    id: 'visibilite',
    name: 'Pack Visibilité',
    price: 79,
    cadence: 'forfait unique',
    unit: '',
    tagline: 'Poser les bases : des informations justes et un plan d’action clair.',
    forWho:
      'Pour une activité qui existe déjà mais dont les informations en ligne sont incomplètes, incohérentes ou peu soignées.',
    features: [
      'Audit de votre présence en ligne (fiche Google, site, annuaires)',
      'Mise en cohérence de vos informations : nom, adresse, téléphone, horaires, services',
      'Optimisation de votre fiche Google Business Profile, ou aide à sa création',
      'Recommandations priorisées, remises par écrit',
      'Conseils pour recueillir des avis et y répondre',
    ],
    cta: 'Choisir le Pack Visibilité',
  },
  {
    id: 'presence',
    name: 'Pack Présence',
    price: 199,
    cadence: 'forfait unique',
    unit: '',
    badge: 'Le plus complet',
    tagline: 'Une vitrine web simple, rapide et lisible sur mobile.',
    forWho:
      'Pour une activité qui veut une page web claire en plus d’une fiche Google à jour.',
    features: [
      'Tout le contenu du Pack Visibilité',
      'Une page web de présentation optimisée pour mobile : services, horaires, accès, contact',
      'Rédaction des textes à partir de vos informations, validés par vous',
      'Bouton d’appel et lien d’itinéraire',
      'Bases du référencement naturel : titres, descriptions, structure de la page',
    ],
    cta: 'Choisir le Pack Présence',
  },
  {
    id: 'suivi',
    name: 'Pack Suivi',
    price: 49,
    cadence: 'par mois',
    unit: '/mois',
    tagline: 'Garder votre présence à jour, mois après mois.',
    forWho:
      'Pour ne plus laisser traîner des horaires périmés ou des avis sans réponse.',
    features: [
      'Mise à jour de vos informations : horaires, jours fériés, services, offres',
      'Publications ponctuelles sur votre fiche Google',
      'Suivi de vos avis et aide à la rédaction des réponses',
      'Point mensuel écrit : ce qui a été fait, ce qui reste à faire',
    ],
    cta: 'Choisir le Pack Suivi',
  },
];

/** « 79 € » ou « 49 €/mois » avec espace insécable. */
export function formatPrice(pack) {
  return `${pack.price}${nbsp}€${pack.unit}`;
}

// Tableau comparatif : true = inclus.
export const comparison = {
  headers: ['Visibilité', 'Présence', 'Suivi'],
  rows: [
    { label: 'Audit de votre présence en ligne', values: [true, true, false] },
    { label: 'Mise en cohérence des informations', values: [true, true, false] },
    { label: 'Fiche Google optimisée', values: [true, true, false] },
    { label: 'Page web de présentation', values: [false, true, false] },
    { label: 'Mises à jour récurrentes', values: [false, false, true] },
    { label: 'Point mensuel écrit', values: [false, false, true] },
  ],
};
