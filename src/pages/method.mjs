import { html } from '../templates/html.mjs';
import { icons } from '../templates/icons.mjs';
import { button, sectionHeading, stepsList } from '../templates/components.mjs';
import { steps, checklist, commitments } from '../content/method.mjs';

export default {
  path: '/methode/',
  nav: 'methode',
  title: 'Notre méthode',
  description:
    'De la demande de mini-audit à la mise en place : une méthode en quatre étapes, claire et sans promesse irréaliste.',
  render(ctx) {
    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Méthode</p>
          <h1 class="page-title" id="page-title">Une méthode simple, étape par étape.</h1>
          <p class="page-lead">
            Du premier message à la mise en place, vous savez où nous en sommes et ce qui vient ensuite. Rien n’est
            publié sans votre accord.
          </p>
        </div>
      </section>

      <section class="section" aria-labelledby="etapes">
        <div class="container">
          <h2 class="visually-hidden" id="etapes">Les étapes</h2>
          ${stepsList(steps, { detailed: true })}
        </div>
      </section>

      <section class="section section--alt" aria-labelledby="regardons">
        <div class="container split">
          <div class="split__copy">
            ${sectionHeading({
              eyebrow: 'Le mini-audit',
              title: 'Ce que nous regardons.',
              intro: 'Six points, ceux que vos clients voient en premier.',
              id: 'regardons',
            })}
          </div>
          <div class="split__aside">
            <ul class="checklist checklist--large">
              ${checklist.map((item) => html`<li>${item}</li>`)}
            </ul>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="engagements">
        <div class="container">
          ${sectionHeading({
            eyebrow: 'Nos limites',
            title: 'Ce que nous ne ferons pas.',
            intro: 'Une relation claire commence par des promesses tenables.',
            id: 'engagements',
          })}
          <div class="grid grid--3">
            ${commitments.map(
              (item) => html`<article class="card">
                <span class="card__icon">${icons.cross}</span>
                <h3 class="card__title">${item.title}</h3>
                <p>${item.text}</p>
              </article>`,
            )}
          </div>
        </div>
      </section>

      <section class="cta-band" aria-labelledby="cta-methode">
        <div class="container cta-band__inner">
          <div>
            <h2 class="cta-band__title" id="cta-methode">Première étape : votre demande.</h2>
            <p>Quelques informations suffisent pour démarrer.</p>
          </div>
          ${button(ctx, { href: ctx.url('/contact/?offre=mini-audit#formulaire'), label: 'Demander un mini-audit', size: 'lg' })}
        </div>
      </section>
    `;
  },
};
