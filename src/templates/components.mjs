import { html, raw } from './html.mjs';
import { icons } from './icons.mjs';
import { formatPrice } from '../content/offers.mjs';
import { demoAudit, statusLabels } from '../content/audit-demo.mjs';

export function button(ctx, { href, label, variant = 'primary', size = '', arrow = true }) {
  const cls = ['btn', variant !== 'primary' && `btn--${variant}`, size && `btn--${size}`]
    .filter(Boolean)
    .join(' ');
  return html`<a class="${cls}" href="${href}"
    ><span class="btn__label">${label}${arrow ? icons.arrow : ''}</span></a
  >`;
}

export function sectionHeading({ eyebrow, title, intro, id, level = 2, center = false }) {
  const tag = `h${level}`;
  return html`<div class="section-head${center ? ' section-head--center' : ''}">
    ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
    ${raw(`<${tag}${id ? ` id="${id}"` : ''} class="section-title">`)}${title}${raw(`</${tag}>`)}
    ${intro ? html`<p class="section-intro">${intro}</p>` : ''}
  </div>`;
}

export function packCard(ctx, pack, { level = 3 } = {}) {
  const tag = `h${level}`;
  return html`<article class="pack${pack.badge ? ' pack--featured' : ''}" aria-labelledby="pack-${pack.id}">
    ${pack.badge
      ? html`<p class="pack__badge">${pack.badge}</p>`
      : html`<p class="pack__badge pack__badge--none" aria-hidden="true">&nbsp;</p>`}
    ${raw(`<${tag} class="pack__name" id="pack-${pack.id}">`)}${pack.name}${raw(`</${tag}>`)}
    <p class="pack__price">
      <span class="pack__amount">${formatPrice(pack)}</span>
      <span class="pack__cadence">${pack.cadence}</span>
    </p>
    <p class="pack__tagline">${pack.tagline}</p>
    <ul class="checklist">
      ${pack.features.map((feature) => html`<li>${feature}</li>`)}
    </ul>
    ${button(ctx, {
      href: ctx.url(`/contact/?offre=${pack.id}#formulaire`),
      label: pack.cta,
      variant: pack.badge ? 'primary' : 'outline',
    })}
  </article>`;
}

export function faqList(ctx, items) {
  const resolve = (text) =>
    text
      .replaceAll('{offers}', ctx.url('/offres/'))
      .replaceAll('{contact}', ctx.url('/contact/'))
      .replaceAll('{privacy}', ctx.url('/confidentialite/'));
  return html`<div class="faq">
    ${items.map(
      (item) => html`<details class="faq__item">
        <summary class="faq__q">${item.q}</summary>
        <div class="faq__a">${raw(resolve(item.a))}</div>
      </details>`,
    )}
  </div>`;
}

export function stepsList(steps, { detailed = false } = {}) {
  return html`<ol class="steps${detailed ? ' steps--detailed' : ''}">
    ${steps.map(
      (step, i) => html`<li class="step">
        <span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="step__body">
          <h3 class="step__title">${step.title}</h3>
          <p>${detailed ? step.text : step.short}</p>
        </div>
      </li>`,
    )}
  </ol>`;
}

export const demoBadge = html`<span class="badge badge--demo">Démo · données fictives</span>`;

/** Exemple fictif de restitution de mini-audit. Toujours étiqueté « démo ». */
export function demoAuditCard() {
  const statusIcon = { ok: icons.check, improve: icons.alert, missing: icons.cross };
  return html`<figure class="audit" aria-labelledby="audit-title">
    <figcaption class="audit__head">
      ${demoBadge}
      <p class="audit__title" id="audit-title">${demoAudit.business}</p>
      <p class="audit__meta">${demoAudit.kind} · ${demoAudit.place}</p>
    </figcaption>
    <ul class="audit__list">
      ${demoAudit.items.map(
        (item) => html`<li class="audit__row audit__row--${item.status}">
          <span class="audit__status">${statusIcon[item.status]}<span>${statusLabels[item.status]}</span></span>
          <span class="audit__text"><strong>${item.label}</strong><span>${item.note}</span></span>
        </li>`,
      )}
    </ul>
    <p class="audit__foot">Exemple inventé pour illustrer le format. Il ne correspond à aucun client ni à aucune mesure réelle.</p>
  </figure>`;
}

/** Repère visible pour toute information à fournir avant la mise en ligne. */
export function todo(label) {
  return html`<mark class="todo" data-todo="${label}">[À COMPLÉTER : ${label}]</mark>`;
}

/** Valeur de config si renseignée, sinon repère « À COMPLÉTER ». */
export function valueOrTodo(value, label) {
  return value ? value : todo(label);
}
