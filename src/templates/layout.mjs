import { createHash } from 'node:crypto';
import { html, raw, typo } from './html.mjs';
import { logoMark } from './icons.mjs';

// Seul script inline autorisé : il pose la classe « js » avant le premier rendu
// (évite un flash du menu mobile). Son empreinte est injectée dans la CSP.
export const JS_FLAG_SCRIPT = 'document.documentElement.classList.add("js")';
export const JS_FLAG_HASH = `sha256-${createHash('sha256').update(JS_FLAG_SCRIPT).digest('base64')}`;

export const NAV = [
  { id: 'accueil', label: 'Accueil', path: '/' },
  { id: 'offres', label: 'Offres', path: '/offres/' },
  { id: 'methode', label: 'Méthode', path: '/methode/' },
  { id: 'faq', label: 'FAQ', path: '/faq/' },
  { id: 'contact', label: 'Contact', path: '/contact/' },
];

function header(ctx, page) {
  return html`<header class="site-header">
    <div class="container site-header__inner">
      <a class="logo" href="${ctx.url('/')}" aria-label="${ctx.config.brand.name} — accueil">
        ${logoMark}<span class="logo__text">MOTO<span class="logo__accent">BOOST</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">
        <span class="nav-toggle__label">Menu</span><span class="nav-toggle__bars" aria-hidden="true"></span>
      </button>
      <nav class="site-nav" id="menu-principal" aria-label="Navigation principale">
        <ul class="site-nav__list">
          ${NAV.map(
            (item) => html`<li>
              <a href="${ctx.url(item.path)}"${page.nav === item.id ? raw(' aria-current="page"') : ''}>${item.label}</a>
            </li>`,
          )}
        </ul>
        <a class="btn btn--sm" href="${ctx.url('/contact/?offre=mini-audit#formulaire')}"
          ><span class="btn__label">Mini-audit</span></a
        >
      </nav>
    </div>
  </header>`;
}

function footer(ctx) {
  const { config } = ctx;
  return html`<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${ctx.url('/')}" aria-label="${config.brand.name} — accueil">
          ${logoMark}<span class="logo__text">MOTO<span class="logo__accent">BOOST</span></span>
        </a>
        <p>${config.brand.baseline}.</p>
        ${config.contact.email
          ? html`<p><a href="mailto:${config.contact.email}">${config.contact.email}</a></p>`
          : ''}
      </div>
      <nav aria-label="Pied de page">
        <h2 class="footer-title">Le site</h2>
        <ul class="footer-list">
          ${NAV.map((item) => html`<li><a href="${ctx.url(item.path)}">${item.label}</a></li>`)}
        </ul>
      </nav>
      <nav aria-label="Informations légales">
        <h2 class="footer-title">Informations</h2>
        <ul class="footer-list">
          <li><a href="${ctx.url('/mentions-legales/')}">Mentions légales</a></li>
          <li><a href="${ctx.url('/confidentialite/')}">Politique de confidentialité</a></li>
        </ul>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© ${ctx.year} ${config.brand.name}. Tous droits réservés.</p>
      ${ctx.isProd
        ? ''
        : html`<p>Version de démonstration : les pages légales sont des modèles à compléter.</p>`}
    </div>
  </footer>`;
}

/** Enveloppe HTML complète d'une page. */
export function layout(ctx, page, body) {
  const { config } = ctx;
  const title = typo(page.fullTitle ?? `${page.title} — ${config.brand.name}`);
  const description = typo(page.description);
  const canonical = ctx.absolute(page.path);
  const noindex = !ctx.indexable || page.noindex;
  const scripts = [ctx.assets.mainJs, ...(page.scripts ?? []).map((name) => ctx.assets[name])];

  return html`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${ctx.csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#0d0e10">
  <meta name="color-scheme" content="dark">
  ${noindex ? raw('<meta name="robots" content="noindex, nofollow">') : ''}
  ${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
  <meta property="og:site_name" content="${config.brand.name}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${ctx.url('/favicon.svg')}" type="image/svg+xml">
  <link rel="preload" href="${ctx.assets.fontBold}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${ctx.assets.css}">
  <script>${raw(JS_FLAG_SCRIPT)}</script>
</head>
<body${page.bodyClass ? html` class="${page.bodyClass}"` : ''}>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  ${ctx.isProd
    ? ''
    : html`<aside class="demo-banner" aria-label="Avertissement : version de démonstration">
        <div class="container">
          <strong>Version de démonstration.</strong> Contenu des offres, coordonnées et pages légales à valider avant la mise en ligne.
        </div>
      </aside>`}
  ${header(ctx, page)}
  <main id="contenu" tabindex="-1">
    ${body}
  </main>
  ${footer(ctx)}
  ${scripts.map((src) => html`<script type="module" src="${src}"></script>`)}
</body>
</html>
`;
}
