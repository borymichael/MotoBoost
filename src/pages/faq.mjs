import { html } from '../templates/html.mjs';
import { button, faqList } from '../templates/components.mjs';
import { faq } from '../content/faq.mjs';

export default {
  path: '/faq/',
  nav: 'faq',
  title: 'Questions fréquentes',
  description:
    'Mini-audit, offres, paiement, résultats, données personnelles : les réponses aux questions les plus fréquentes sur MotoBoost.',
  render(ctx) {
    const groups = [...new Set(faq.map((item) => item.group))];
    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">FAQ</p>
          <h1 class="page-title" id="page-title">Questions fréquentes.</h1>
          <p class="page-lead">Une question qui n’y figure pas ? Écrivez-nous via le formulaire de contact.</p>
        </div>
      </section>

      <section class="section" aria-label="Questions et réponses">
        <div class="container container--narrow">
          ${groups.map(
            (group, i) => html`<div class="faq-group">
              <h2 class="faq-group__title" id="groupe-${i}">${group}</h2>
              ${faqList(
                ctx,
                faq.filter((item) => item.group === group),
              )}
            </div>`,
          )}
        </div>
      </section>

      <section class="cta-band" aria-labelledby="cta-faq">
        <div class="container cta-band__inner">
          <div>
            <h2 class="cta-band__title" id="cta-faq">Une autre question ?</h2>
            <p>Posez-la dans le formulaire, nous revenons vers vous par e-mail.</p>
          </div>
          ${button(ctx, { href: ctx.url('/contact/#formulaire'), label: 'Nous écrire', size: 'lg' })}
        </div>
      </section>
    `;
  },
};
