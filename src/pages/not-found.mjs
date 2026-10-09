import { html } from '../templates/html.mjs';
import { button } from '../templates/components.mjs';

export default {
  path: '/404.html',
  file: '404.html',
  nav: '',
  noindex: true,
  title: 'Page introuvable',
  description: 'Cette page n’existe pas ou a été déplacée. Retournez à l’accueil de MotoBoost ou écrivez-nous.',
  render(ctx) {
    return html`
      <section class="page-hero page-hero--center" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Erreur 404</p>
          <h1 class="page-title" id="page-title">Page introuvable.</h1>
          <p class="page-lead">Cette adresse n’existe pas ou a été déplacée. Reprenons la route depuis l’accueil.</p>
          <div class="hero__actions hero__actions--center">
            ${button(ctx, { href: ctx.url('/'), label: 'Retour à l’accueil', size: 'lg' })}
            ${button(ctx, { href: ctx.url('/contact/#formulaire'), label: 'Nous écrire', variant: 'ghost', size: 'lg', arrow: false })}
          </div>
        </div>
      </section>
    `;
  },
};
