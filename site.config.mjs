// =============================================================================
// Configuration de MotoBoost — c'est LE fichier à éditer avant la mise en ligne.
//
// Chaque valeur laissée vide ('') apparaît sur le site sous la forme d'un
// repère « [À COMPLÉTER : …] » bien visible. Le build `npm run build:prod`
// refuse de produire le site tant qu'il reste un repère ou qu'une valeur
// obligatoire manque.
//
// Les valeurs peuvent aussi être fournies par variables d'environnement
// (utile sur Netlify / Cloudflare Pages) : SITE_URL, BASE_PATH, FORM_ENDPOINT,
// SITE_MODE=production.
// =============================================================================

export default {
  brand: {
    name: 'MotoBoost',
    baseline: 'Présence numérique pour les professionnels de la moto',
  },

  // 'demo'       : bandeau « version de démonstration », site non indexable,
  //                formulaire autorisé sans service d'envoi (rien n'est transmis).
  // 'production' : build strict (voir ci-dessus). Activé par `npm run build:prod`.
  mode: 'demo',

  // URL publique finale, sans slash final. Ex. : 'https://www.votredomaine.fr'
  // Obligatoire en production (canonical, sitemap). Aucun domaine n'est supposé par défaut.
  siteUrl: '',

  // Laisser vide si le site est servi à la racine d'un domaine.
  // Sous-dossier (ex. GitHub Pages « projet ») : '/nom-du-depot'
  basePath: '',

  // Mention affichée sous les tarifs (régime de TVA). Ex. : 'Prix HT', 'Prix TTC' ou
  // 'TVA non applicable, art. 293 B du CGI' — à confirmer avec votre comptable.
  pricingNote: '',

  contact: {
    email: '', // Affiché dans le pied de page et les pages légales quand renseigné.
    phone: '', // Facultatif.
  },

  form: {
    // URL du service qui reçoit les demandes (Formspree, Web3Forms, Netlify…).
    // Vide = mode démonstration (aucun envoi). Obligatoire en production.
    // Voir README.md → « Brancher le formulaire ».
    endpoint: '',
    // Champs supplémentaires envoyés tels quels (ex. clé publique Web3Forms).
    // Ex. : { access_key: 'xxxx', subject: 'Nouvelle demande MotoBoost' }
    extraFields: {},
    // Netlify Forms : mettre true et laisser endpoint à '/contact/'.
    netlify: false,
    // Protection anti-automatisation côté navigateur.
    minFillMs: 3000, // durée minimale entre l'affichage et l'envoi
    cooldownMs: 30000, // délai minimal entre deux envois depuis le même navigateur
  },

  // Informations des pages légales. Laisser '' = repère « À COMPLÉTER » visible sur le site.
  // Ces textes sont à faire valider par un professionnel du droit.
  legal: {
    // — Mentions légales —
    publisherName: '', // Nom, ou dénomination sociale
    legalForm: '', // Ex. : entrepreneur individuel, SASU, SAS…
    registration: '', // SIREN / SIRET / RCS / RM selon le cas
    vatMention: '', // N° de TVA, ou mention « TVA non applicable… » si concernée
    address: '',
    publicationDirector: '',
    hostName: '',
    hostAddress: '',
    hostPhone: '',
    reuseTerms: '', // Propriété intellectuelle : conditions de réutilisation des contenus
    liabilityText: '', // Responsabilité et liens externes

    // — Politique de confidentialité —
    legalBasis: '', // Base légale du traitement des demandes
    processors: '', // Prestataires qui reçoivent les données (service de formulaire, hébergeur…)
    retention: '', // Durée de conservation des demandes
    transfers: '', // Transferts hors UE éventuels et garanties
    hostLogs: '', // Journaux techniques conservés par l'hébergeur
    lastUpdate: '', // Date de dernière mise à jour du document
    extraPurposes: '', // Facultatif : autres finalités (laisser vide s'il n'y en a pas)
  },
};
