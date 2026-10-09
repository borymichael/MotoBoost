# MotoBoost — site vitrine

Site statique, léger et accessible pour **MotoBoost**, une activité qui aide les professionnels de la moto
(ateliers, concessions, loueurs, écoles, boutiques, préparateurs) à améliorer leur présence en ligne.

- **Objectif** : obtenir des demandes de mini-audit et présenter trois offres : **Pack Visibilité 79 €**,
  **Pack Présence 199 €**, **Pack Suivi 49 €/mois**.
- **Pages** : Accueil, Offres, Méthode, FAQ, Contact (formulaire), Politique de confidentialité (à compléter),
  Mentions légales (à compléter), 404.
- **Pas de paiement en ligne, pas de comptes utilisateurs, pas de cookies, aucune ressource externe.**
- **Contenu** : aucun témoignage, résultat client, chiffre ou certification. L'exemple de mini-audit est fictif et
  signalé « Démo · données fictives ».

> ⚠️ **Avertissement juridique.** Les pages *Mentions légales* et *Politique de confidentialité* sont des **modèles à
> compléter**. Ce dépôt n'affirme aucune conformité juridique : faites relire ces pages (et les offres : TVA, conditions
> de vente, durée d'engagement du Pack Suivi) par un professionnel du droit avant la mise en ligne.

---

## 1. Prérequis

- [Node.js](https://nodejs.org) **20 ou plus** (testé avec Node 20.20.0 / npm 10.8.2)
- Aucun autre outil. Le site produit est du HTML/CSS/JS statique ; Node ne sert qu'à le fabriquer et à le tester.

## 2. Installation et commandes

```bash
npm install          # installe les outils de build et de test (esbuild, html-validate, node-html-parser)
```

| Commande | Effet |
| --- | --- |
| `npm run dev` | Construit le site, le sert sur <http://localhost:3000> et le **reconstruit à chaque modification** (rechargez la page). |
| `npm run build` | Construit le site dans `dist/` (**mode démonstration** par défaut). |
| `npm run build:prod` | Construit en **mode production** : refuse de produire le site tant qu'il reste un repère « À COMPLÉTER », que l'URL du site manque ou qu'aucun service de formulaire n'est configuré. |
| `npm run preview` | Sert `dist/` tel quel (avec les en-têtes de sécurité du fichier `_headers`). |
| `npm test` | Lance les tests automatisés (voir §7). |
| `npm run check` | `npm test` puis `npm run build`. |

Le port se change avec la variable `PORT` (ex. `PORT=3005 npm run preview` ; sous PowerShell : `$env:PORT=3005; npm run preview`).

## 3. Structure

```
site.config.mjs        ← LE fichier à éditer : URL, formulaire, coordonnées, infos légales
src/
  content/             ← textes éditables : offres et prix, méthode, FAQ, exemple d'audit fictif
  pages/               ← une page = un fichier (accueil, offres, méthode, faq, contact, légal, 404)
  templates/           ← layout (en-tête/pied), composants, icônes, illustration du héros
  assets/css/main.css  ← toute la feuille de style (variables de couleurs en tête de fichier)
  assets/js/           ← main.js (menu mobile), form.js (formulaire), form-core.js (validation, testée)
  assets/fonts/        ← Barlow Condensed 700 (licence SIL OFL 1.1 incluse)
  public/              ← fichiers copiés tels quels (favicon)
scripts/               ← build.mjs (fabrication), serve.mjs (aperçu local)
tests/                 ← tests automatisés (node:test)
dist/                  ← résultat prêt à déployer (généré, ignoré par git)
```

### Où modifier quoi

| Je veux changer… | Fichier |
| --- | --- |
| Un prix, le contenu d'un pack | `src/content/offers.mjs` (prix, listes, tableau comparatif) |
| La FAQ | `src/content/faq.mjs` |
| Les étapes de la méthode | `src/content/method.mjs` |
| L'exemple de mini-audit (fictif) | `src/content/audit-demo.mjs` |
| Les textes d'une page | `src/pages/<page>.mjs` |
| Les couleurs | variables `:root` en haut de `src/assets/css/main.css` (les tests vérifient les contrastes WCAG AA) |
| Coordonnées, URL, formulaire, infos légales | `site.config.mjs` |

## 4. Mode démonstration et mode production

| | Démonstration (défaut) | Production |
| --- | --- | --- |
| Bandeau « version de démonstration » | oui | non |
| Indexation (`noindex`, `robots.txt` fermé) | **bloquée** | autorisée + `sitemap.xml` + canonical |
| Formulaire sans service d'envoi | autorisé : valide, réagit, mais **dit clairement que rien n'est transmis** | **refusé** par le build |
| Repères « [À COMPLÉTER : …] » restants | tolérés, listés au build | **build refusé** |

On passe en production avec `npm run build:prod`, ou avec la variable `SITE_MODE=production` (utile sur Netlify /
Cloudflare). Variables prises en compte : `SITE_URL`, `FORM_ENDPOINT`, `BASE_PATH`, `SITE_MODE`.

## 5. Brancher le formulaire

Le formulaire (`src/pages/contact.mjs`, `src/assets/js/form.js`) valide les champs côté navigateur, affiche les erreurs
(récapitulatif + messages par champ), puis envoie les données en `POST` (`application/x-www-form-urlencoded`, en-tête
`Accept: application/json`) à l'URL `form.endpoint` de `site.config.mjs`. Aucun backend à écrire.

1. Créez un compte chez un service de formulaire (**vous seul pouvez le faire**) et récupérez l'URL d'envoi.
2. Renseignez-la dans `site.config.mjs` (`form.endpoint`) ou via la variable `FORM_ENDPOINT`. La CSP du site
   (`_headers`) est régénérée automatiquement pour autoriser **uniquement** cette origine.
3. Si le service demande une clé publique ou un sujet, ajoutez-les dans `form.extraFields`
   (ils sont envoyés comme champs cachés).

Exemples (voir la documentation de chaque service ; **non testés avec un vrai compte ici**) :

```js
// Formspree
form: { endpoint: 'https://formspree.io/f/xxxxxxxx' }

// Web3Forms
form: { endpoint: 'https://api.web3forms.com/submit', extraFields: { access_key: 'VOTRE_CLE_PUBLIQUE' } }

// Netlify Forms (hébergement Netlify uniquement)
form: { endpoint: '/contact/', netlify: true }
```

Le succès est détecté par un statut HTTP 2xx (sauf si la réponse JSON contient `ok: false` ou `success: false`).
En cas d'échec réseau, d'erreur serveur ou de délai dépassé (12 s), l'utilisateur voit un message et **ses saisies sont
conservées**.

### Protection contre les soumissions automatisées (basique)

- **Champ piège** invisible (`fax`) : rempli ⇒ rien n'est envoyé (le robot croit avoir réussi).
- **Durée minimale** (3 s) entre l'affichage et l'envoi, et **délai de 30 s** entre deux envois du même navigateur
  (réglables dans `form.minFillMs` / `form.cooldownMs`).
- Un horodatage `form_loaded_at` est transmis avec la demande.

⚠️ Ces protections s'exécutent dans le navigateur : un robot qui poste directement vers l'endpoint les contourne.
Activez aussi l'anti-spam du service de formulaire (la plupart proposent honeypot, limitation de débit ou captcha). Pour
un captcha (Cloudflare Turnstile, hCaptcha…), il faut créer des clés, ajouter le script du fournisseur et **ouvrir la CSP**
(`script-src`, `frame-src`, `connect-src`) dans `scripts/build.mjs` ; la politique de confidentialité doit alors être mise à jour.

## 6. Décisions à prendre et hypothèses à valider

Ce que j'ai **proposé** faute d'information. Rien de tout cela n'est un fait vérifié : à confirmer ou corriger.

- **Contenu des trois packs** (`src/content/offers.mjs`) : seuls les noms et prix viennent de la demande. Les listes de
  prestations, le fait que le Pack Présence inclue le Pack Visibilité, et le badge « Le plus complet » sont des propositions.
- **Mini-audit** : gratuit ou payant ? sous quel délai ? sous quelle forme (retour écrit supposé) ? Le mot « gratuit »
  n'apparaît nulle part (un test l'interdit) tant que ce n'est pas tranché.
- **TVA** : « HT », « TTC » ou « TVA non applicable… » → champ `pricingNote` (repère visible sous les tarifs sinon).
- **Pack Suivi** : durée d'engagement, résiliation, nombre d'interventions par mois : non précisés sur le site ; à
  définir dans des conditions de vente (non fournies ici).
- **Pack Présence** : hébergement, nom de domaine, délais : « confirmés avant toute prestation » (texte neutre).
- **Zone d'intervention** (France entière ? à distance ?) : non mentionnée.
- **Ton** : le site parle de « nous ». À changer en « je » si vous travaillez seul(e).
- **Modalités de règlement** : « confirmées avec vous avant toute prestation » (aucun paiement sur le site).
- **Image de partage réseaux sociaux** (`og:image`) : absente (nécessite un PNG/JPG à créer).
- **Conditions générales de vente** : pas de page fournie ; à voir avec un professionnel.

## 7. Vérifications réellement effectuées

Exécutées dans cet environnement (Windows 11, Node 20.20.0) lors de la construction du site :

- `npm test` : **134 tests, 134 réussis, 0 échec**. Ils couvrent :
  - la validation du formulaire (e-mail, téléphone, site, listes, consentement, anti-robots, corps de requête) ;
  - la structure de chaque page (h1 unique, hiérarchie des titres, ids uniques, références ARIA, libellés, liens internes et
    ancres, aucune ressource externe, pas de style/script inline hors le drapeau `js` couvert par la CSP) ;
  - les garde-fous de contenu (prix = 79/199/49 uniquement ; aucun témoignage, pourcentage, certification, superlatif,
    « gratuit », affirmation de conformité, paiement ou compte) ;
  - les contrastes WCAG AA calculés depuis `main.css` ; les budgets de poids ;
  - `html-validate` sur les 8 pages, en démonstration et en production ;
  - la bascule démonstration → production (refus en cas de manque, **aucun dossier `dist/` laissé par un build refusé**, sitemap/robots/canonical en production, `basePath`).
- **Navigateur réel** (navigateur intégré à l'application de bureau) :
  - rendu desktop (1280 px) et mobile (375 px), sans débordement horizontal ; menu mobile (ouverture, fermeture par Échap) ;
  - formulaire en mode démo : envoi à vide, e-mail invalide, correction, succès « simulé » (aucune requête réseau) ;
  - formulaire en mode réel contre un **faux endpoint local** : succès (corps reçu vérifié, champ piège absent), erreur
    HTTP 500, réponse `ok:false`, envoi trop rapide, délai entre deux envois, champ piège rempli (aucune requête partie),
    CSP appliquée pendant ces essais ;
  - **axe-core 4.14.0** (règles WCAG 2.0/2.1/2.2 A-AA + bonnes pratiques) : **0 violation** sur les 8 pages et sur les
    états initial / erreurs / succès du formulaire (la règle de contraste est « incomplète » pour les boutons dont le fond est un
    pseudo-élément : ces contrastes sont vérifiés par les tests calculés).

**Non vérifié** : envoi vers un vrai service de formulaire, déploiement sur un hébergeur, Lighthouse, lecteurs d'écran
(NVDA, VoiceOver), Safari et Firefox, validité juridique des textes.

## 8. Déploiement

Voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)** (Netlify, Cloudflare Pages, GitHub Pages).

Le dépôt contient `.github/workflows/pages.yml` : à chaque push sur `main`, GitHub lance les tests, construit le site avec
`BASE_PATH=/MotoBoost` et le publie sur <https://borymichael.github.io/MotoBoost/> (mode démonstration). Réglage unique requis :
**Settings → Pages → Source = GitHub Actions**.

## 9. Licences

Police **Barlow Condensed** © The Barlow Project Authors, licence SIL Open Font License 1.1
(`src/assets/fonts/LICENSE-OFL.txt`).
