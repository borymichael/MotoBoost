import { raw } from './html.mjs';

// Icônes décoratives (aria-hidden) : trait seul, couleur héritée via currentColor.
const svg = (paths, extra = '') =>
  raw(
    `<svg class="icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${paths}</svg>`,
  );

export const icons = {
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
  star: svg('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  arrow: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  alert: svg('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.4h.01"/>'),
  cross: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
};

// Logo : deux chevrons « boost ». Le nom reste du vrai texte (accessible, sélectionnable).
export const logoMark = raw(
  '<svg class="logo__mark" viewBox="0 0 34 24" width="34" height="24" aria-hidden="true" focusable="false"><path class="logo__chev logo__chev--a" d="M0 0h8l12 12L8 24H0l12-12z"/><path class="logo__chev logo__chev--b" d="M14 0h8l12 12-12 12h-8l12-12z"/></svg>',
);
