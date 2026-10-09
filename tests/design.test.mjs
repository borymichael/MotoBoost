// Contrastes WCAG calculés directement depuis les variables de src/assets/css/main.css,
// et quelques garde-fous d'accessibilité côté CSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/assets/css/main.css', import.meta.url), 'utf8');

const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2].toLowerCase()]),
);

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const color = (nameOrHex) => (nameOrHex.startsWith('#') ? nameOrHex : tokens[nameOrHex]);

test('les variables de couleur attendues sont définies', () => {
  for (const name of ['bg', 'bg-alt', 'surface', 'surface-2', 'text', 'muted', 'accent', 'accent-hover', 'accent-ink', 'border-strong', 'danger', 'success', 'warn', 'warn-ink', 'info', 'banner-bg', 'banner-text']) {
    assert.match(tokens[name] ?? '', /^#[0-9a-f]{6}$/, name);
  }
  assert.equal(tokens.accent, '#ff6a13', 'orange racing');
});

test('contraste du calcul : références connues', () => {
  assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) < 0.01);
  assert.ok(Math.abs(contrast('#777777', '#ffffff') - 4.48) < 0.02);
});

const TEXT_AA = 4.5;
const pairs = [
  // texte courant sur chaque fond
  ...['bg', 'bg-alt', 'surface', 'surface-2', '#0a0b0c', '#101215', '#261b13'].flatMap((bg) => [
    ['text', bg, TEXT_AA],
    ['muted', bg, TEXT_AA],
  ]),
  // liens et éléments d'accent sur fonds sombres
  ...['bg', 'bg-alt', 'surface', 'surface-2', '#101215', '#0a0b0c'].flatMap((bg) => [
    ['accent', bg, TEXT_AA],
    ['accent-hover', bg, TEXT_AA],
  ]),
  // texte sombre sur orange (boutons, bandeau, badges) et orange sur noir (bouton du bandeau)
  ['accent-ink', 'accent', TEXT_AA],
  ['accent-ink', 'accent-hover', TEXT_AA],
  ['accent', 'accent-ink', TEXT_AA],
  ['accent-hover', '#000000', TEXT_AA],
  // états
  ...['bg', 'surface', 'surface-2'].flatMap((bg) => [
    ['danger', bg, TEXT_AA],
    ['success', bg, TEXT_AA],
    ['warn', bg, TEXT_AA],
    ['info', bg, TEXT_AA],
  ]),
  ['warn-ink', 'warn', TEXT_AA],
  ['bg', 'danger', TEXT_AA], // « ! » dans la pastille d'erreur
  ['banner-text', 'banner-bg', TEXT_AA],
  ['#ffffff', 'banner-bg', TEXT_AA],
  // composants d'interface (bordures de champs, anneau de focus) : 3:1
  ...['bg', 'surface', 'surface-2'].map((bg) => ['border-strong', bg, 3]),
  ['accent', 'bg', 3],
  ['accent', 'surface', 3],
];

for (const [fg, bg, min] of pairs) {
  test(`contraste ${fg} sur ${bg} >= ${min}:1`, () => {
    const ratio = contrast(color(fg), color(bg));
    assert.ok(ratio >= min, `${fg} (${color(fg)}) sur ${bg} (${color(bg)}) = ${ratio.toFixed(2)}`);
  });
}

test('le blanc sur orange échouerait (raison du texte sombre sur les boutons)', () => {
  assert.ok(contrast('#ffffff', tokens.accent) < 4.5);
});

test('CSS : focus visible, mouvement réduit, affichage de police et cibles tactiles', () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*html\s*\{\s*scroll-behavior: smooth/);
  assert.match(css, /font-display:\s*swap/);
  assert.match(css, /\.btn--sm\s*\{[^}]*min-height:\s*2\.75rem/, 'cible >= 44 px');
  assert.match(css, /\.nav-toggle\s*\{[^}]*min-height:\s*2\.75rem/);
  assert.match(css, /\.field__control\s*\{[^}]*font-size:\s*1rem/, 'champs >= 16 px (pas de zoom iOS)');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none !important/);
});

test('CSS : mobile-first (media queries min-width uniquement)', () => {
  assert.doesNotMatch(css, /@media[^{]*max-width/);
  assert.ok((css.match(/@media \(min-width/g) ?? []).length >= 8);
});
