// Structure, accessibilité statique, liens et assets du site construit (mode démonstration).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { buildTemp, readPage, exists, fileFor, EXPECTED_PAGES } from './helpers.mjs';
import { JS_FLAG_HASH, JS_FLAG_SCRIPT } from '../src/templates/layout.mjs';

let site;
const pages = new Map();

before(async () => {
  site = await buildTemp();
  for (const p of EXPECTED_PAGES) pages.set(p, await readPage(site.dir, p));
});
after(() => site?.cleanup());

const each = (fn) => async () => {
  for (const [p, page] of pages) await fn(p, page);
};

test('toutes les pages attendues sont générées', async () => {
  for (const p of EXPECTED_PAGES) assert.ok(await exists(path.join(site.dir, fileFor(p))), p);
  assert.ok(await exists(path.join(site.dir, '_headers')));
  assert.ok(await exists(path.join(site.dir, 'robots.txt')));
  assert.ok(await exists(path.join(site.dir, 'favicon.svg')));
});

test('socle HTML : doctype, lang=fr, charset, viewport, titre et description', each((p, { html, root }) => {
  assert.match(html, /^<!doctype html>/i, p);
  assert.equal(root.querySelector('html').getAttribute('lang'), 'fr', p);
  assert.ok(root.querySelector('meta[charset]'), `${p} charset`);
  assert.match(root.querySelector('meta[name="viewport"]').getAttribute('content'), /width=device-width/, p);
  const title = root.querySelector('title').text.trim();
  assert.ok(title.length >= 10 && title.length <= 70, `${p} titre (${title.length} car.) : ${title}`);
  const description = root.querySelector('meta[name="description"]').getAttribute('content');
  assert.ok(description.length >= 50 && description.length <= 175, `${p} description (${description.length} car.)`);
}));

test('les titres de page sont uniques', () => {
  const titles = [...pages.values()].map(({ root }) => root.querySelector('title').text.trim());
  assert.equal(new Set(titles).size, titles.length, titles.join(' | '));
});

test('repères : lien d’évitement, header, nav, main, footer, un seul h1', each((p, { root }) => {
  assert.equal(root.querySelectorAll('h1').length, 1, `${p} : un seul h1`);
  assert.equal(root.querySelector('a.skip-link').getAttribute('href'), '#contenu', p);
  assert.ok(root.querySelector('main#contenu'), p);
  assert.ok(root.querySelector('header nav[aria-label]'), p);
  assert.ok(root.querySelector('footer'), p);
  assert.equal(root.querySelectorAll('main').length, 1, p);
}));

test('hiérarchie des titres : pas de saut de niveau', each((p, { root }) => {
  const levels = root.querySelectorAll('h1,h2,h3,h4,h5,h6').map((h) => Number(h.tagName[1]));
  assert.equal(levels[0], 1, `${p} commence par h1`);
  levels.forEach((level, i) => {
    if (i > 0) assert.ok(level - levels[i - 1] <= 1, `${p} : saut h${levels[i - 1]} -> h${level}`);
  });
}));

test('identifiants uniques et références ARIA / label résolues', each((p, { root }) => {
  const ids = root.querySelectorAll('[id]').map((n) => n.getAttribute('id'));
  assert.equal(new Set(ids).size, ids.length, `${p} : id en double : ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  const known = new Set(ids);
  for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const node of root.querySelectorAll(`[${attr}]`)) {
      for (const ref of node.getAttribute(attr).split(/\s+/).filter(Boolean)) {
        assert.ok(known.has(ref), `${p} : ${attr}="${ref}" ne pointe vers rien`);
      }
    }
  }
  for (const label of root.querySelectorAll('label[for]')) {
    assert.ok(known.has(label.getAttribute('for')), `${p} : label for=${label.getAttribute('for')}`);
  }
}));

test('liens et boutons ont un nom accessible', each((p, { root }) => {
  for (const a of root.querySelectorAll('a[href]')) {
    const name = (a.getAttribute('aria-label') || a.textContent).replace(/\s+/g, ' ').trim();
    assert.ok(name.length > 0, `${p} : lien sans nom -> ${a.getAttribute('href')}`);
  }
  for (const b of root.querySelectorAll('button')) {
    assert.ok(b.textContent.trim().length > 0, `${p} : bouton sans nom`);
  }
  for (const img of root.querySelectorAll('img')) assert.ok(img.hasAttribute('alt'), `${p} : img sans alt`);
}));

test('liens internes : chaque cible existe (fichier et ancre)', async () => {
  for (const [p, { root }] of pages) {
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      const url = new URL(href, `http://x${p}`);
      const target = fileFor(url.pathname);
      assert.ok(await exists(path.join(site.dir, target)), `${p} : lien cassé ${href}`);
      if (url.hash.length > 1) {
        const { root: targetRoot } = await readPage(site.dir, url.pathname);
        assert.ok(targetRoot.querySelector(`[id="${url.hash.slice(1)}"]`), `${p} : ancre ${href} introuvable`);
      }
    }
  }
});

test('liens externes : uniquement la CNIL, sans nouvel onglet non sécurisé', () => {
  for (const [p, { root }] of pages) {
    for (const a of root.querySelectorAll('a[href^="http"]')) {
      assert.match(a.getAttribute('href'), /^https:\/\/www\.cnil\.fr/, `${p} : lien externe inattendu`);
      if (a.getAttribute('target') === '_blank') assert.match(a.getAttribute('rel') ?? '', /noopener/);
    }
  }
});

test('aucune ressource externe : tout est servi par le site lui-même', () => {
  for (const [p, { html }] of pages) {
    assert.doesNotMatch(html, /(src|href)="https?:\/\/(?!www\.cnil\.fr)/, `${p} : ressource externe`);
    assert.doesNotMatch(html, /fonts\.googleapis|gstatic|cdn\.|unpkg|jsdelivr/i, p);
  }
});

test('CSS, JS et polices référencés existent, noms hachés', async () => {
  const { root } = pages.get('/');
  const css = root.querySelector('link[rel="stylesheet"]').getAttribute('href');
  assert.match(css, /^\/assets\/css\/main-[A-Z0-9]+\.css$/);
  assert.ok(await exists(path.join(site.dir, css)));
  for (const s of root.querySelectorAll('script[src]')) {
    assert.match(s.getAttribute('src'), /^\/assets\/js\/[a-z]+-[A-Z0-9]+\.js$/);
    assert.ok(await exists(path.join(site.dir, s.getAttribute('src'))));
  }
  const preload = root.querySelector('link[rel="preload"][as="font"]');
  assert.ok(await exists(path.join(site.dir, preload.getAttribute('href'))));
  const cssText = await readFile(path.join(site.dir, css), 'utf8');
  const fonts = [...cssText.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1]);
  assert.ok(fonts.length >= 1);
  for (const f of fonts) {
    const resolved = path.join(site.dir, 'assets/css', f);
    assert.ok(await exists(resolved), `police introuvable : ${f}`);
  }
});

test('le JS du formulaire n’est chargé que sur la page contact', () => {
  for (const [p, { root }] of pages) {
    const sources = root.querySelectorAll('script[src]').map((s) => s.getAttribute('src'));
    assert.equal(sources.some((s) => s.includes('/form-')), p === '/contact/', p);
  }
});

test('CSP : aucun style/script inline sauf le drapeau « js » dont l’empreinte figure dans la CSP', async () => {
  const headers = await readFile(path.join(site.dir, '_headers'), 'utf8');
  assert.ok(headers.includes(`'${JS_FLAG_HASH}'`), 'empreinte absente de _headers');
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
  assert.doesNotMatch(headers, /unsafe-inline|unsafe-eval/);
  for (const [p, { html, root }] of pages) {
    assert.doesNotMatch(html, /\sstyle="/, `${p} : attribut style inline`);
    assert.equal(root.querySelectorAll('style').length, 0, `${p} : balise style`);
    assert.doesNotMatch(html, /\son[a-z]+="/i, `${p} : gestionnaire d'événement inline`);
    const inline = root.querySelectorAll('script:not([src])');
    assert.equal(inline.length, 1, `${p} : un seul script inline`);
    assert.equal(inline[0].text, JS_FLAG_SCRIPT, p);
    assert.match(root.querySelector('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'), /default-src 'self'/);
  }
});

test('mode démonstration : noindex partout, bandeau, robots.txt fermé, pas de sitemap', async () => {
  for (const [p, { root }] of pages) {
    assert.match(root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '', /noindex/, p);
    assert.ok(root.querySelector('.demo-banner'), `${p} : bandeau démo`);
    assert.equal(root.querySelector('link[rel="canonical"]'), null, p);
  }
  assert.match(await readFile(path.join(site.dir, 'robots.txt'), 'utf8'), /Disallow: \//);
  assert.equal(await exists(path.join(site.dir, 'sitemap.xml')), false);
});

test('typographie française : espace insécable avant ; : ! ? » et le symbole €', () => {
  for (const [p, { root }] of pages) {
    const clone = root.querySelector('body');
    clone.querySelectorAll('script').forEach((s) => s.remove());
    const text = clone.textContent;
    assert.doesNotMatch(text, /[^\S ]+[;:!?»€]/, `${p} : espace sécable avant ponctuation`);
    assert.doesNotMatch(text, /\d [€]/, `${p} : « 79 € » sans espace insécable`);
  }
});

test('poids : budgets raisonnables par fichier (octets non compressés)', () => {
  const sizes = new Map(site.result.sizes.map((s) => [s.file, s]));
  for (const { file, bytes } of site.result.sizes) {
    if (file.endsWith('.html')) assert.ok(bytes < 40_000, `${file} : ${bytes} o`);
    if (file.endsWith('.css')) assert.ok(bytes < 40_000, `${file} : ${bytes} o`);
    if (file.endsWith('.js')) assert.ok(bytes < 15_000, `${file} : ${bytes} o`);
  }
  const gzipTotal = [...sizes.values()].reduce((sum, s) => sum + s.gzip, 0);
  assert.ok(gzipTotal < 120_000, `total gzip : ${gzipTotal} o`);
});
