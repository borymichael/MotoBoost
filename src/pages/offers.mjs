import { html } from '../templates/html.mjs';
import { icons } from '../templates/icons.mjs';
import { button, sectionHeading, packCard, valueOrTodo } from '../templates/components.mjs';
import { packs, comparison } from '../content/offers.mjs';

export default {
  path: '/offres/',
  nav: 'offres',
  title: 'Offres et tarifs',
  description:
    'Pack Visibilité à 79 €, Pack Présence à 199 € et Pack Suivi à 49 €/mois : le contenu de chaque offre, détaillé et comparé.',
  render(ctx) {
    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Offres et tarifs</p>
          <h1 class="page-title" id="page-title">Choisissez votre rythme.</h1>
          <p class="page-lead">
            Une mise en ordre de départ, une page web, ou un suivi mensuel : trois offres lisibles, avec le tarif
            affiché. Pas sûr de ce qu’il vous faut ? Le mini-audit aide à choisir.
          </p>
        </div>
      </section>

      <section class="section" aria-labelledby="packs">
        <div class="container">
          <h2 class="visually-hidden" id="packs">Les trois offres</h2>
          <div class="grid grid--3 grid--packs">
            ${packs.map((pack) => packCard(ctx, pack, { level: 3 }))}
          </div>
          <p class="note note--small">
            Tarifs en euros. ${valueOrTodo(ctx.config.pricingNote ? ctx.config.pricingNote + '.' : '', 'mention de TVA sous les tarifs (HT, TTC ou franchise en base)')}
            Aucun paiement n’est demandé sur ce site : les modalités de règlement, les délais et les éventuels frais
            annexes (hébergement, nom de domaine) sont confirmés avec vous avant toute prestation.
          </p>
        </div>
      </section>

      <section class="section section--alt" aria-labelledby="comparatif">
        <div class="container">
          ${sectionHeading({ eyebrow: 'Comparatif', title: 'Ce qui est inclus, pack par pack.', id: 'comparatif' })}
          <section class="table-wrap" aria-label="Tableau comparatif des packs, défilable horizontalement si besoin" tabindex="0">
            <table class="compare">
              <caption class="visually-hidden">Contenu comparé des trois packs MotoBoost</caption>
              <thead>
                <tr>
                  <th scope="col">Contenu</th>
                  ${comparison.headers.map((header) => html`<th scope="col">${header}</th>`)}
                </tr>
              </thead>
              <tbody>
                ${comparison.rows.map(
                  (row) => html`<tr>
                    <th scope="row">${row.label}</th>
                    ${row.values.map((included) =>
                      included
                        ? html`<td class="compare__yes">${icons.check}<span class="visually-hidden">Inclus</span></td>`
                        : html`<td class="compare__no"><span aria-hidden="true">—</span><span class="visually-hidden">Non inclus</span></td>`,
                    )}
                  </tr>`,
                )}
              </tbody>
            </table>
          </section>
          <p class="note note--small">
            Le Pack Présence reprend l’ensemble du Pack Visibilité. Le Pack Suivi s’ajoute ensuite, mois après mois.
          </p>
        </div>
      </section>

      <section class="cta-band" aria-labelledby="cta-offres">
        <div class="container cta-band__inner">
          <div>
            <h2 class="cta-band__title" id="cta-offres">Pas sûr de l’offre qu’il vous faut ?</h2>
            <p>Commencez par un mini-audit : il met en évidence les priorités.</p>
          </div>
          ${button(ctx, { href: ctx.url('/contact/?offre=mini-audit#formulaire'), label: 'Demander un mini-audit', size: 'lg' })}
        </div>
      </section>
    `;
  },
};
