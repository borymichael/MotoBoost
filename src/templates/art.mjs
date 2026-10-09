import { raw } from './html.mjs';

// Illustration décorative du héros : un compte-tours générique (sans chiffres).
// Générée en JS pour éviter 30 lignes SVG écrites à la main ; les couleurs
// viennent du CSS (classes), jamais d'attributs style (CSP).
export function tachometer() {
  const cx = 200;
  const cy = 200;
  const steps = 24; // intervalles
  const start = 135; // degrés, sens horaire depuis l'axe x (bas gauche)
  const sweep = 270;
  const redFrom = 19;
  const point = (r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [(cx + r * Math.cos(a)).toFixed(2), (cy + r * Math.sin(a)).toFixed(2)];
  };
  const angle = (i) => start + (i * sweep) / steps;

  const ticks = [];
  for (let i = 0; i <= steps; i++) {
    const major = i % 4 === 0;
    const [x1, y1] = point(major ? 136 : 148, angle(i));
    const [x2, y2] = point(166, angle(i));
    const cls = `tach__tick${major ? ' tach__tick--major' : ''}${i >= redFrom ? ' tach__tick--red' : ''}`;
    ticks.push(`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
  }
  const [ax, ay] = point(176, angle(redFrom));
  const [bx, by] = point(176, angle(steps));

  return raw(`<svg class="tach" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
  <circle class="tach__ring" cx="${cx}" cy="${cy}" r="192"/>
  <circle class="tach__face" cx="${cx}" cy="${cy}" r="184"/>
  <circle class="tach__ring tach__ring--dash" cx="${cx}" cy="${cy}" r="120"/>
  <path class="tach__redline" d="M${ax} ${ay}A176 176 0 0 1 ${bx} ${by}"/>
  ${ticks.join('\n  ')}
  <g class="tach__needle">
    <path d="M${cx - 18} ${cy - 5}L${cx + 118} ${cy}L${cx - 18} ${cy + 5}z"/>
  </g>
  <circle class="tach__hub" cx="${cx}" cy="${cy}" r="16"/>
  <text class="tach__label" x="${cx}" y="${cy + 78}" text-anchor="middle">BOOST</text>
</svg>`);
}
