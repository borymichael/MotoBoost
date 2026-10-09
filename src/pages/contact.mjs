import { html, raw, esc, displayPhone } from '../templates/html.mjs';
import { icons } from '../templates/icons.mjs';
import { LIMITS, ACTIVITES, OFFRE_AUDIT, OFFRE_INDECIS } from '../assets/js/form-core.js';
import { packs, formatPrice } from '../content/offers.mjs';

const required = html`<span class="field__req" aria-hidden="true">*</span>`;

/** Bloc libellé + contrôle + aide + zone d'erreur. `control` reçoit les ids à relier. */
function field({ name, label, isRequired = false, hint = '', wide = false, control }) {
  const id = `f-${name}`;
  const describedBy = [hint && `hint-${name}`, `err-${name}`].filter(Boolean).join(' ');
  return html`<div class="field${wide ? ' field--wide' : ''}" data-field="${name}">
    <label class="field__label" for="${id}">${label}${isRequired ? required : ''}</label>
    ${control({ id, describedBy })}
    ${hint ? html`<p class="field__hint" id="hint-${name}">${hint}</p>` : ''}
    <p class="field__error" id="err-${name}"></p>
  </div>`;
}

const input = (name, { type = 'text', autocomplete, inputmode, maxlength, isRequired = false, placeholder }) =>
  ({ id, describedBy }) =>
    html`<input class="field__control" id="${id}" name="${name}" type="${type}"
      ${autocomplete ? html`autocomplete="${autocomplete}"` : ''}
      ${inputmode ? html`inputmode="${inputmode}"` : ''}
      ${maxlength ? html`maxlength="${maxlength}"` : ''}
      ${placeholder ? html`placeholder="${placeholder}"` : ''}
      ${isRequired ? raw('required') : ''}
      aria-describedby="${describedBy}">`;

const select = (name, options, { isRequired = false, placeholder = '' }) =>
  ({ id, describedBy }) =>
    html`<select class="field__control field__control--select" id="${id}" name="${name}"
      ${isRequired ? raw('required') : ''} aria-describedby="${describedBy}">
      ${placeholder ? html`<option value="" selected disabled>${placeholder}</option>` : ''}
      ${options.map((o) => html`<option value="${o.value}"${o.selected ? raw(' selected') : ''}>${o.label}</option>`)}
    </select>`;

export default {
  path: '/contact/',
  nav: 'contact',
  title: 'Contact et demande de mini-audit',
  description:
    'Demandez votre mini-audit : décrivez votre activité en quelques lignes et nous revenons vers vous par e-mail. Aucun paiement, aucun compte.',
  scripts: ['formJs'],
  render(ctx) {
    const { form, contact } = ctx.config;
    const live = Boolean(form.endpoint);
    const offerOptions = [
      { value: OFFRE_AUDIT, label: 'Mini-audit — je veux d’abord un état des lieux', selected: true },
      ...packs.map((p) => ({ value: p.id, label: `${p.name} — ${formatPrice(p)}` })),
      { value: OFFRE_INDECIS, label: 'Je ne sais pas encore' },
    ];
    const formAttrs = [
      'class="form"',
      'id="contact-form"',
      'method="post"',
      live ? `action="${esc(form.endpoint)}"` : '',
      form.netlify ? 'name="contact" data-netlify="true" netlify-honeypot="fax"' : '',
      `data-contact-form data-mode="${live ? 'live' : 'demo'}"`,
      `data-endpoint="${esc(form.endpoint)}"`,
      `data-min-fill="${form.minFillMs}" data-cooldown="${form.cooldownMs}"`,
      contact.email ? `data-fallback-email="${esc(contact.email)}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Contact</p>
          <h1 class="page-title" id="page-title">Demandez votre mini-audit.</h1>
          <p class="page-lead">
            Décrivez votre activité en quelques lignes. Nous revenons vers vous par e-mail. Aucun paiement, aucun compte
            à créer.
          </p>
        </div>
      </section>

      <section class="section" aria-labelledby="titre-formulaire">
        <div class="container contact-layout">
          <div class="contact-main" id="formulaire">
            <h2 class="section-title section-title--sm" id="titre-formulaire">Votre demande</h2>
            ${live
              ? ''
              : html`<p class="alert alert--info" id="demo-notice">
                  <strong>Mode démonstration.</strong> Aucun service d’envoi n’est encore connecté : le formulaire se
                  valide et réagit comme en production, mais rien n’est transmis.
                </p>`}
            <noscript>
              <p class="alert alert--info">
                JavaScript est désactivé : la vérification des champs se fait par votre navigateur.
                ${contact.email
                  ? html`En cas de souci, écrivez-nous à <a href="mailto:${contact.email}">${contact.email}</a>.`
                  : ''}
              </p>
            </noscript>

            <div class="alert alert--error" id="form-errors" role="alert" tabindex="-1" hidden>
              <p class="alert__title" id="form-errors-title">Merci de corriger les champs suivants</p>
              <ul class="alert__list"></ul>
            </div>
            <div class="alert alert--error" id="form-send-error" role="alert" tabindex="-1" hidden>
              <p class="alert__title" id="form-send-error-title"></p>
              <p id="form-send-error-text"></p>
            </div>

            <form ${raw(formAttrs)}>
              <p class="form__legend">Les champs marqués d’un ${required} sont obligatoires.</p>
              <div class="form__grid">
                ${field({
                  name: 'nom',
                  label: 'Nom et prénom',
                  isRequired: true,
                  control: input('nom', { autocomplete: 'name', maxlength: LIMITS.nom.max, isRequired: true }),
                })}
                ${field({
                  name: 'entreprise',
                  label: 'Entreprise ou enseigne',
                  isRequired: true,
                  control: input('entreprise', {
                    autocomplete: 'organization',
                    maxlength: LIMITS.entreprise.max,
                    isRequired: true,
                  }),
                })}
                ${field({
                  name: 'activite',
                  label: 'Type d’activité',
                  isRequired: true,
                  control: select('activite', ACTIVITES, { isRequired: true, placeholder: 'Choisir…' }),
                })}
                ${field({
                  name: 'offre',
                  label: 'Ce qui vous intéresse',
                  control: select('offre', offerOptions, {}),
                })}
                ${field({
                  name: 'email',
                  label: 'Adresse e-mail',
                  isRequired: true,
                  control: input('email', {
                    type: 'email',
                    autocomplete: 'email',
                    inputmode: 'email',
                    maxlength: LIMITS.email.max,
                    isRequired: true,
                  }),
                })}
                ${field({
                  name: 'telephone',
                  label: 'Téléphone (facultatif)',
                  control: input('telephone', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: 30 }),
                })}
                ${field({
                  name: 'site',
                  label: 'Site web ou fiche Google (facultatif)',
                  hint: 'Un lien nous aide à préparer le mini-audit.',
                  wide: true,
                  control: input('site', { autocomplete: 'url', inputmode: 'url', maxlength: 300, placeholder: 'www.exemple.fr' }),
                })}
                <div class="field field--wide" data-field="message">
                  <label class="field__label" for="f-message">Votre message (facultatif)</label>
                  <textarea class="field__control field__control--area" id="f-message" name="message" rows="5"
                    maxlength="${LIMITS.message.max + 200}" aria-describedby="hint-message err-message"></textarea>
                  <p class="field__hint" id="hint-message">
                    Ce que vous souhaitez améliorer, vos questions. <span id="message-count" aria-live="off">0</span>/${LIMITS.message.max}
                  </p>
                  <p class="field__error" id="err-message"></p>
                </div>
              </div>

              <div class="hp" aria-hidden="true">
                <label for="f-fax">Fax (ne pas remplir)</label>
                <input id="f-fax" name="fax" type="text" tabindex="-1" autocomplete="off">
              </div>
              <input type="hidden" name="form_loaded_at" value="">
              ${form.netlify ? html`<input type="hidden" name="form-name" value="contact">` : ''}
              ${Object.entries(form.extraFields ?? {}).map(
                ([key, value]) => html`<input type="hidden" name="${key}" value="${value}">`,
              )}

              <div class="field field--check" data-field="consentement">
                <input class="field__check" id="f-consentement" name="consentement" type="checkbox" value="oui"
                  required aria-describedby="err-consentement">
                <label class="field__check-label" for="f-consentement">
                  J’ai lu la <a href="${ctx.url('/confidentialite/')}">politique de confidentialité</a> et j’accepte que
                  mes informations soient utilisées pour traiter ma demande. ${required}
                </label>
                <p class="field__error" id="err-consentement"></p>
              </div>

              <div class="form__actions">
                <button class="btn btn--lg" type="submit" id="submit-btn">
                  <span class="btn__label"><span data-label-default>Envoyer ma demande</span><span data-label-busy hidden>Envoi en cours…</span></span>
                </button>
              </div>
            </form>

            <div class="alert alert--success" id="form-success" role="status" tabindex="-1" hidden>
              <p class="alert__title" id="form-success-title" data-variant="live" hidden>Merci, votre demande est envoyée.</p>
              <p class="alert__title" id="form-success-title-demo" data-variant="demo" hidden>Démonstration : demande simulée.</p>
              <p data-variant="live" hidden>
                Nous la lisons et revenons vers vous par e-mail. Pensez à vérifier vos courriers indésirables.
              </p>
              <p data-variant="demo" hidden>
                Le formulaire fonctionne, mais aucun service d’envoi n’est connecté : <strong>rien n’a été transmis</strong>.
              </p>
              <button class="btn btn--outline btn--sm" type="button" id="form-reset"><span class="btn__label">Faire une autre demande</span></button>
            </div>
          </div>

          <aside class="contact-aside" aria-labelledby="apres">
            <h2 class="aside-title" id="apres">Et ensuite&nbsp;?</h2>
            <ol class="mini-steps">
              <li><strong>Nous lisons votre demande</strong><span>et regardons les liens que vous indiquez.</span></li>
              <li><strong>Nous vous répondons par e-mail</strong><span>pour confirmer la suite et poser, si besoin, quelques questions.</span></li>
              <li><strong>Vous décidez</strong><span>de poursuivre ou non. Votre demande ne vous engage à rien.</span></li>
            </ol>
            <div class="aside-note">
              ${icons.check}
              <p>
                Les informations saisies servent à traiter votre demande. Détails dans la
                <a href="${ctx.url('/confidentialite/')}">politique de confidentialité</a>.
              </p>
            </div>
            ${contact.email || contact.phone
              ? html`<div class="aside-contact">
                  <h3 class="aside-title aside-title--sm">Contact direct</h3>
                  ${contact.email ? html`<p><a href="mailto:${contact.email}">${contact.email}</a></p>` : ''}
                  ${contact.phone ? html`<p><a href="tel:${contact.phone.replace(/[^+\d]/g, '')}">${displayPhone(contact.phone)}</a></p>` : ''}
                </div>`
              : ''}
          </aside>
        </div>
      </section>
    `;
  },
};
