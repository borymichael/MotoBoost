# Déploiement de MotoBoost — étapes exactes

> Ces étapes n'ont **pas été exécutées** (aucun accès à un hébergeur, un domaine ou un service de formulaire n'a été
> fourni). Les commandes locales ont été testées ; les écrans des hébergeurs peuvent avoir changé de libellé.

Le site à publier est le dossier **`dist/`** produit par `npm run build`. Il n'a besoin d'aucun serveur applicatif.

## Ce que vous devez fournir (personne d'autre ne peut le faire à votre place)

1. Un **compte chez un hébergeur** statique (Netlify ou Cloudflare Pages, gratuits pour ce volume).
2. Un **nom de domaine** (ex. chez OVHcloud, Gandi, Cloudflare…) — facultatif pour un premier test, indispensable en production.
3. Un **compte chez un service de formulaire** (Formspree, Web3Forms… ou Netlify Forms) et l'URL d'envoi.
4. Les **informations légales** (éditeur, hébergeur, base légale, durée de conservation…) et leur relecture par un professionnel.

---

## Étape 0 — Vérifier en local

```bash
npm install
npm run check
```

`npm run check` doit se terminer sans erreur (tests, puis build). Aperçu : `npm run preview` → <http://localhost:3000>.

## Étape 1 — Premier déploiement en mode démonstration (recommandé)

Le site est publié **non indexable**, avec le bandeau « version de démonstration » : vous pouvez le montrer sans risque.

### Option A — Netlify, sans Git (le plus rapide)

1. Dans le dossier du projet : `npm run build`.
2. Connectez-vous sur <https://app.netlify.com> → **Add new site** → **Deploy manually**.
3. Glissez-déposez le dossier **`dist`** (le dossier lui-même, pas son contenu) dans la zone indiquée.
4. Netlify affiche une adresse en `*.netlify.app` : ouvrez-la et parcourez les 5 pages.

Pour mettre à jour : relancez `npm run build` puis, dans Netlify, **Deploys** → glisser-déposer le nouveau `dist`.

### Option B — Netlify avec Git (déploiement automatique à chaque modification)

1. Créez un dépôt (GitHub, GitLab ou Bitbucket) et envoyez-y le projet :
   ```bash
   git init
   git add .
   git commit -m "Site MotoBoost"
   git branch -M main
   git remote add origin <URL-DU-DEPOT>
   git push -u origin main
   ```
   (`node_modules/` et `dist/` sont ignorés par `.gitignore`.)
2. Netlify → **Add new site** → **Import an existing project** → choisissez le dépôt.
3. Les réglages sont lus dans `netlify.toml` : commande `npm run build`, dossier de publication `dist`, Node 20.
   Vérifiez-les puis **Deploy**.

### Option C — Cloudflare Pages

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** (dépôt créé comme en B).
2. Réglages de build : **Build command** `npm run build` ; **Build output directory** `dist` ;
   variable d'environnement `NODE_VERSION` = `20`.
3. **Save and Deploy**. Les fichiers `_headers` (sécurité, cache) sont pris en charge nativement.

### Option D — GitHub Pages (déjà configuré dans ce dépôt)

Le fichier `.github/workflows/pages.yml` publie automatiquement le site à **chaque `git push` sur `main`** : il installe les
dépendances (`npm ci`), lance les tests, construit avec `BASE_PATH=/MotoBoost` (le site est dans un sous-dossier :
`https://borymichael.github.io/MotoBoost/`) puis publie `dist/`. Un test en échec bloque la publication.

**Réglage à faire une seule fois** (depuis votre compte GitHub) : dépôt → **Settings** → **Pages** → **Build and deployment** →
**Source** = **GitHub Actions**. Tant que la source est « Deploy from a branch », GitHub affiche le README au lieu du site.

Suivi des publications : onglet **Actions** du dépôt. Pour republier sans modifier le code : **Actions** → **Déploiement GitHub Pages**
→ **Run workflow**.

Limites de GitHub Pages : le fichier `_headers` est ignoré (la CSP reste présente dans chaque page via `<meta>`, mais sans
`frame-ancestors` ni les autres en-têtes de sécurité) ; le dépôt est public, donc le site de démonstration l'est aussi (il reste non
indexable). Pour un autre sous-dossier : `BASE_PATH=/nom-du-depot npm run build`
(PowerShell : `$env:BASE_PATH="/nom-du-depot"; npm run build`).

## Étape 2 — Brancher le formulaire

Exemple avec **Formspree** (même logique pour un autre service ; voir README §5) :

1. Créez un compte sur <https://formspree.io>, puis un nouveau formulaire. Notez l'URL du type `https://formspree.io/f/xxxxxxxx`.
2. Dans les réglages du formulaire, activez les protections anti-spam proposées et indiquez l'e-mail qui reçoit les demandes.
3. Dans `site.config.mjs` : `form: { endpoint: 'https://formspree.io/f/xxxxxxxx', … }`
   **ou** (sans toucher au code) créez la variable d'environnement `FORM_ENDPOINT` chez l'hébergeur
   (Netlify : **Site configuration → Environment variables** ; Cloudflare : **Settings → Variables and secrets**).
4. Redéployez, ouvrez `/contact/` : l'encart « Mode démonstration » a disparu. Envoyez **une vraie demande de test** et
   vérifiez sa réception.
5. Reportez le nom du prestataire, ses transferts éventuels hors UE et la durée de conservation dans
   `site.config.mjs` (`legal.processors`, `legal.transfers`, `legal.retention`).

## Étape 3 — Domaine personnalisé et HTTPS

1. Netlify : **Domain management → Add a domain** ; Cloudflare Pages : **Custom domains → Set up a domain**.
2. Créez chez votre registrar les enregistrements DNS **exactement** tels qu'indiqués par l'hébergeur (en général un `CNAME`
   pour `www` et un enregistrement `A`/`ALIAS` ou la délégation des serveurs de noms pour le domaine nu).
3. Attendez la propagation DNS (de quelques minutes à quelques heures), puis activez/vérifiez le certificat HTTPS (automatique).
4. Choisissez la version canonique (`www` ou domaine nu) et redirigez l'autre vers elle (option proposée par l'hébergeur).

## Étape 4 — Passage en production

1. Complétez **tous** les champs `legal.*`, `pricingNote` et `contact.email` de `site.config.mjs` (les repères
   « [À COMPLÉTER : …] » sont listés par `npm run build`). Faites relire les pages légales.
2. Chez l'hébergeur, définissez les variables d'environnement :

   | Variable | Valeur |
   | --- | --- |
   | `SITE_MODE` | `production` |
   | `SITE_URL` | `https://www.votredomaine.fr` (sans slash final) |
   | `FORM_ENDPOINT` | l'URL du service de formulaire (si non écrite dans `site.config.mjs`) |

3. Redéployez. **Le build échoue volontairement** s'il reste un repère, si `SITE_URL` n'est pas en https ou s'il n'y a pas de
   service de formulaire : le message liste ce qu'il manque. Vous pouvez tester avant : `npm run build:prod`.
4. Le site devient indexable : `sitemap.xml`, `robots.txt` et balises canoniques sont générés, le bandeau de démonstration disparaît.

## Étape 5 — Contrôles après mise en ligne

- [ ] Les 8 URLs répondent (`/`, `/offres/`, `/methode/`, `/faq/`, `/contact/`, `/mentions-legales/`, `/confidentialite/`, une URL inexistante → page 404).
- [ ] **Une vraie demande de test** arrive dans la boîte de réception prévue (et pas dans les indésirables).
- [ ] En-têtes : `curl -sI https://www.votredomaine.fr/` affiche `Content-Security-Policy`, `X-Content-Type-Options`, etc.
- [ ] Aucune erreur dans la console du navigateur (CSP comprise) sur `/contact/`.
- [ ] `https://www.votredomaine.fr/robots.txt` autorise l'indexation et cite le sitemap ; aucune balise `noindex` sur les pages.
- [ ] Aucun texte « À COMPLÉTER » ni bandeau de démonstration.
- [ ] Les pages légales ont été relues par un professionnel du droit.
- [ ] Facultatif : déclarer le sitemap dans Google Search Console (compte à créer par vos soins).

## En cas de problème

| Symptôme | Cause probable |
| --- | --- |
| Le build de production échoue | C'est voulu : lisez la liste affichée (repères, `SITE_URL`, `FORM_ENDPOINT`). |
| Le formulaire affiche « Mode démonstration » | `form.endpoint` / `FORM_ENDPOINT` vide au moment du build. |
| « L'envoi a échoué » en production | URL du service incorrecte, domaine non autorisé côté service, ou CSP : l'origine du service doit être celle de l'endpoint (elle est ajoutée automatiquement). Regardez l'onglet Réseau et la console. |
| Page blanche / styles absents sous GitHub Pages | Sous-dossier sans `BASE_PATH` (voir option D). |
| Le site reste absent de Google | Normal en démonstration (`noindex`) ; en production, patientez et soumettez le sitemap. |
