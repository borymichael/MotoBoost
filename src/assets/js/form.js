// Formulaire de contact : validation, états d'erreur, protection anti-robots basique, envoi.
// Sans endpoint (mode démonstration), rien n'est envoyé et l'interface le dit clairement.

import {
  FIELD_ORDER,
  OFFRE_VALUES,
  assessSubmission,
  buildBody,
  normalize,
  secondsLabel,
  validateAll,
  validateField,
} from './form-core.js';

const form = document.querySelector('[data-contact-form]');
if (form) init(form);

function init(form) {
  const live = form.dataset.mode === 'live';
  const endpoint = form.dataset.endpoint || '';
  const minFillMs = Number(form.dataset.minFill) || 3000;
  const cooldownMs = Number(form.dataset.cooldown) || 30000;
  const fallbackEmail = form.dataset.fallbackEmail || '';
  const STORAGE_KEY = 'motoboost:last-submit';
  const SEND_TIMEOUT_MS = 12000;

  const $ = (id) => document.getElementById(id);
  const summary = $('form-errors');
  const summaryList = summary.querySelector('.alert__list');
  const sendError = $('form-send-error');
  const success = $('form-success');
  const submitBtn = $('submit-btn');
  const counter = $('message-count');

  let loadedAt = Date.now();
  let submitting = false;
  const touched = new Set();

  form.noValidate = true; // les messages natifs sont remplacés par les nôtres

  // ---- Préremplissage de l'offre depuis ?offre=... -----------------------------------------
  const wanted = new URLSearchParams(location.search).get('offre');
  if (wanted && OFFRE_VALUES.includes(wanted) && form.elements.offre) form.elements.offre.value = wanted;

  // ---- Lecture des champs ------------------------------------------------------------------
  const readValue = (name) => {
    const control = form.elements[name];
    if (!control) return '';
    return control.type === 'checkbox' ? control.checked : control.value;
  };
  const readValues = () => Object.fromEntries(FIELD_ORDER.map((name) => [name, readValue(name)]));

  // ---- États d'un champ --------------------------------------------------------------------
  function setFieldError(name, message) {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    const control = form.elements[name];
    const slot = $(`err-${name}`);
    if (!wrap || !control || !slot) return;
    slot.textContent = message;
    control.setAttribute('aria-invalid', message ? 'true' : 'false');
    wrap.classList.toggle('is-invalid', Boolean(message));
    const filled = control.type === 'checkbox' ? control.checked : String(control.value).trim() !== '';
    wrap.classList.toggle('is-valid', !message && touched.has(name) && filled && name !== 'consentement');
  }

  function checkField(name) {
    touched.add(name);
    const message = validateField(name, readValue(name));
    setFieldError(name, message);
    if (!summary.hidden) refreshSummary();
    return message;
  }

  // ---- Récapitulatif d'erreurs (focus + liens vers les champs) ------------------------------
  function currentErrors() {
    const errors = {};
    for (const name of FIELD_ORDER) {
      const message = validateField(name, readValue(name));
      if (message) errors[name] = message;
    }
    return errors;
  }

  function renderSummary(errors) {
    summaryList.replaceChildren(
      ...Object.entries(errors).map(([name, message]) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#f-${name}`;
        link.textContent = message;
        link.dataset.target = name;
        item.append(link);
        return item;
      }),
    );
  }

  function refreshSummary() {
    const errors = currentErrors();
    if (Object.keys(errors).length === 0) {
      summary.hidden = true;
      return;
    }
    renderSummary(errors);
  }

  summaryList.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-target]');
    if (!link) return;
    event.preventDefault();
    form.elements[link.dataset.target]?.focus();
  });

  // ---- Événements de saisie ------------------------------------------------------------------
  form.addEventListener('focusout', (event) => {
    const name = event.target.name;
    if (FIELD_ORDER.includes(name)) checkField(name);
  });
  form.addEventListener('input', (event) => {
    const name = event.target.name;
    if (name === 'message') counter.textContent = String(event.target.value.length);
    if (FIELD_ORDER.includes(name) && touched.has(name)) checkField(name);
  });
  form.addEventListener('change', (event) => {
    const name = event.target.name;
    if (FIELD_ORDER.includes(name) && (touched.has(name) || event.target.type === 'checkbox')) checkField(name);
  });

  // ---- Affichage des états globaux ---------------------------------------------------------------
  function showSendError(title, text) {
    $('form-send-error-title').textContent = title;
    const extra = fallbackEmail ? ` Vous pouvez aussi nous écrire à ${fallbackEmail}.` : '';
    $('form-send-error-text').textContent = text + extra;
    sendError.hidden = false;
    sendError.focus();
  }

  function setBusy(busy) {
    submitting = busy;
    if (busy) submitBtn.setAttribute('aria-disabled', 'true');
    else submitBtn.removeAttribute('aria-disabled');
    submitBtn.setAttribute('aria-busy', String(busy));
    submitBtn.querySelector('[data-label-default]').hidden = busy;
    submitBtn.querySelector('[data-label-busy]').hidden = !busy;
  }

  function showSuccess() {
    form.hidden = true;
    summary.hidden = true;
    sendError.hidden = true;
    const demoNotice = $('demo-notice');
    if (demoNotice) demoNotice.hidden = true;
    for (const node of success.querySelectorAll('[data-variant]')) {
      node.hidden = node.dataset.variant !== (live ? 'live' : 'demo');
    }
    success.hidden = false;
    success.focus();
  }

  $('form-reset').addEventListener('click', () => {
    form.reset();
    touched.clear();
    for (const name of FIELD_ORDER) setFieldError(name, '');
    counter.textContent = '0';
    loadedAt = Date.now();
    success.hidden = true;
    const demoNotice = $('demo-notice');
    if (demoNotice) demoNotice.hidden = false;
    form.hidden = false;
    form.elements.nom.focus();
  });

  // ---- Anti-automatisation : mémoire du dernier envoi -----------------------------------------------
  const readLast = () => {
    try {
      return Number(sessionStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      return 0;
    }
  };
  const writeLast = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* stockage indisponible : pas de délai entre envois, sans gravité */
    }
  };

  // ---- Envoi ---------------------------------------------------------------------------------------------
  async function send(values) {
    setBusy(true);
    try {
      if (!live) {
        await new Promise((resolve) => setTimeout(resolve, 600)); // simule une latence réseau
        writeLast();
        showSuccess();
        return;
      }
      const entries = { ...Object.fromEntries(new FormData(form)), ...values, consentement: 'oui' };
      const body = buildBody(entries, { loadedAt });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body,
          signal: controller.signal,
        });
        let ok = response.ok;
        if (ok && (response.headers.get('content-type') || '').includes('json')) {
          const data = await response.json().catch(() => null);
          if (data && (data.ok === false || data.success === false)) ok = false;
        }
        if (!ok) throw new Error(`HTTP ${response.status}`);
        writeLast();
        showSuccess();
      } finally {
        clearTimeout(timer);
      }
    } catch {
      showSendError(
        'L’envoi a échoué.',
        'Vos informations sont toujours dans le formulaire. Vérifiez votre connexion puis réessayez.',
      );
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitting) return;
    sendError.hidden = true;

    const values = normalize(readValues());
    const result = validateAll(values);
    for (const name of FIELD_ORDER) {
      touched.add(name);
      setFieldError(name, result.errors[name] || '');
    }
    if (!result.valid) {
      renderSummary(result.errors);
      summary.hidden = false;
      summary.focus();
      return;
    }
    summary.hidden = true;

    const verdict = assessSubmission({
      honeypot: form.elements.fax?.value,
      elapsedMs: Date.now() - loadedAt,
      minFillMs,
      lastSubmitAt: readLast(),
      cooldownMs,
    });
    if (verdict.reason === 'honeypot') {
      showSuccess(); // un robot croit avoir réussi ; rien n'est envoyé
      return;
    }
    if (verdict.reason === 'too-fast') {
      showSendError(
        'Un instant…',
        `Votre demande est partie un peu trop vite pour être vérifiée. Réessayez dans ${secondsLabel(verdict.retryInMs)}.`,
      );
      return;
    }
    if (verdict.reason === 'cooldown') {
      showSendError(
        'Une demande vient d’être envoyée.',
        `Patientez ${secondsLabel(verdict.retryInMs)} avant d’en envoyer une autre.`,
      );
      return;
    }
    send(values);
  });

  counter.textContent = String(form.elements.message.value.length);
}
