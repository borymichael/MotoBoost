import { html } from '../templates/html.mjs';
import { icons } from '../templates/icons.mjs';
import { tachometer } from '../templates/art.mjs';
import { button, sectionHeading, packCard, faqList, stepsList, demoAuditCard } from '../templates/components.mjs';
import { packs } from '../content/offers.mjs';
import { steps } from '../content/method.mjs';
import { faq } from '../content/faq.mjs';

const reasons = [
  {
    icon: icons.pin,
    title: 'Être trouvé',
    text: 'Une fiche Google complète et des informations cohérentes aident les motards de votre secteur à vous repérer.',
  },
  {
    icon: icons.star,
    title: 'Inspirer confiance',
    text: 'Des horaires à jour, des services clairs, des avis qui reçoivent une réponse : les détails qui rassurent avant l’appel.',
  },
  {
    icon: icons.phone,
    title: 'Être contacté facilement',
    text: 'Un bouton d’appel, un itinéraire, une page lisible sur mobile : le chemin le plus court entre la recherche et votre atelier.',
  },
];

export default {
  path: '/',
  nav: 'accueil',
  fullTitle: 'MotoBoost — Présence en ligne des professionnels de la moto',
  description:
    'MotoBoost aide les ateliers, concessions, loueurs, écoles et boutiques moto à clarifier leur présence en ligne. Packs à 79 €, 199 € et 49 €/mois. Demandez un mini-audit.',
  render(ctx) {
    return html`
      <section class="hero" aria-labelledby="hero-title">
        <div class="container hero__inner">
          <div class="hero__copy">
            <p class="eyebrow">Présence en ligne · Professionnels de la moto</p>
            <h1 class="hero__title" id="hero-title">
              Mettez votre activité moto <span class="hero__em">en pole position</span> sur le web.
            </h1>
            <p class="hero__lead">
              MotoBoost aide les ateliers, concessions, loueurs, écoles et boutiques moto à rendre leur présence en ligne
              claire, à jour et facile à trouver. Commencez par un mini-audit.
            </p>
            <div class="hero__actions">
              ${button(ctx, { href: ctx.url('/contact/?offre=mini-audit#formulaire'), label: 'Demander un mini-audit', size: 'lg' })}
              ${button(ctx, { href: ctx.url('/offres/'), label: 'Voir les offres', variant: 'ghost', size: 'lg', arrow: false })}
            </div>
            <ul class="hero__points">
              <li>${icons.check}Aucun paiement en ligne</li>
              <li>${icons.check}Aucun compte à créer</li>
              <li>${icons.check}Tarifs affichés</li>
            </ul>
          </div>
          <div class="hero__art">${tachometer()}</div>
        </div>
      </section>

      <section class="section" aria-labelledby="pourquoi">
        <div class="container">
          ${sectionHeading({
            eyebrow: 'L’enjeu',
            title: 'Avant de pousser votre porte, vos clients vous cherchent en ligne.',
            id: 'pourquoi',
          })}
          <div class="grid grid--3">
            ${reasons.map(
              (reason) => html`<article class="card">
                <span class="card__icon">${reason.icon}</span>
                <h3 class="card__title">${reason.title}</h3>
                <p>${reason.text}</p>
              </article>`,
            )}
          </div>
        </div>
      </section>

      <section class="section section--alt" aria-labelledby="offres">
        <div class="container">
          ${sectionHeading({
            eyebrow: 'Les offres',
            title: 'Trois offres, des prix affichés.',
            intro: 'Le tarif est annoncé, le contenu détaillé. Vous savez ce que vous obtenez avant de nous écrire.',
            id: 'offres',
          })}
          <div class="grid grid--3 grid--packs">
            ${packs.map((pack) => packCard(ctx, pack))}
          </div>
          <p class="note">
            <a class="link-arrow" href="${ctx.url('/offres/')}">Comparer les offres en détail ${icons.arrow}</a>
          </p>
        </div>
      </section>

      <section class="section" aria-labelledby="exemple">
        <div class="container split">
          <div class="split__copy">
            ${sectionHeading({
              eyebrow: 'Le mini-audit',
              title: 'À quoi ressemble un mini-audit ?',
              intro:
                'Un premier état des lieux, simple à lire : ce qui va bien, ce qui manque, par où commencer. L’exemple ci-contre est entièrement fictif.',
              id: 'exemple',
            })}
            ${button(ctx, { href: ctx.url('/contact/?offre=mini-audit#formulaire'), label: 'Demander mon mini-audit' })}
          </div>
          <div class="split__aside">${demoAuditCard()}</div>
        </div>
      </section>

      <section class="section section--alt" aria-labelledby="methode">
        <div class="container">
          ${sectionHeading({
            eyebrow: 'La méthode',
            title: 'Quatre étapes, du premier message à la mise en place.',
            id: 'methode',
          })}
          ${stepsList(steps)}
          <p class="note">
            <a class="link-arrow" href="${ctx.url('/methode/')}">Voir la méthode complète ${icons.arrow}</a>
          </p>
        </div>
      </section>

      <section class="section" aria-labelledby="questions">
        <div class="container container--narrow">
          ${sectionHeading({ eyebrow: 'FAQ', title: 'Vos questions, nos réponses.', id: 'questions' })}
          ${faqList(ctx, faq.filter((item) => item.home))}
          <p class="note">
            <a class="link-arrow" href="${ctx.url('/faq/')}">Toutes les questions ${icons.arrow}</a>
          </p>
        </div>
      </section>

      <section class="cta-band" aria-labelledby="cta-final">
        <div class="container cta-band__inner">
          <div>
            <h2 class="cta-band__title" id="cta-final">Prêt à passer la vitesse supérieure ?</h2>
            <p>Envoyer une demande ne vous engage à rien : pas de paiement, pas de compte.</p>
          </div>
          ${button(ctx, { href: ctx.url('/contact/?offre=mini-audit#formulaire'), label: 'Demander un mini-audit', size: 'lg' })}
        </div>
      </section>
    `;
  },
};
