// Mini moteur de gabarits : template literal étiqueté qui échappe tout par défaut.
// Seules les valeurs créées par `html` ou `raw` sont insérées telles quelles.

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function raw(value) {
  return new SafeHtml(String(value));
}

function render(value) {
  if (value == null || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return new SafeHtml(out);
}

/**
 * Typographie française : espace insécable avant ; : ! ? » et après «,
 * et avant le symbole €. Appliqué uniquement au texte, jamais aux balises,
 * ni au contenu de <script>/<style>.
 */
export function typo(text) {
  return String(text)
    .replace(/\s+([;:!?»€])/g, ' $1')
    .replace(/«\s+/g, '« ')
    .replace(/(\d)\s+(%)/g, '$1 $2');
}

export function typoHtml(source) {
  const parts = String(source).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/g);
  return parts.map((part, i) => (i % 2 === 1 ? part : typo(part))).join('');
}

/** Numéro de téléphone affiché : groupes de chiffres liés par des espaces insécables. */
export const displayPhone = (phone) => String(phone).trim().replace(/ +/g, ' ');
