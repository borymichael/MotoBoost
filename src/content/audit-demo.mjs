// EXEMPLE FICTIF de mini-audit — aucune donnée réelle, aucun client existant.
// Affiché avec la mention « DÉMO · données fictives » partout où il apparaît.

export const demoAudit = {
  business: 'Garage Exemple Moto',
  place: 'Ville Exemple',
  kind: 'Atelier (activité imaginaire)',
  items: [
    {
      label: 'Fiche Google',
      status: 'improve',
      note: 'Catégorie principale à préciser, description absente.',
    },
    {
      label: 'Cohérence nom / adresse / téléphone',
      status: 'improve',
      note: 'Deux numéros de téléphone différents selon les sites.',
    },
    {
      label: 'Horaires',
      status: 'missing',
      note: 'Jours fériés non renseignés.',
    },
    {
      label: 'Avis clients',
      status: 'improve',
      note: 'Des avis sans réponse.',
    },
    {
      label: 'Page web sur mobile',
      status: 'ok',
      note: 'Lisible sur téléphone, bouton d’appel visible.',
    },
    {
      label: 'Accès et itinéraire',
      status: 'ok',
      note: 'Adresse cliquable vers la carte.',
    },
  ],
};

export const statusLabels = {
  ok: 'OK',
  improve: 'À améliorer',
  missing: 'Manquant',
};
