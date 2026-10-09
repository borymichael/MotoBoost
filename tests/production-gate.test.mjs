// Bascule démonstration -> production : le build strict refuse un site inachevé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BuildError, build } from '../scripts/build.mjs';
import { buildTemp, readPage, exists, FULL_CONFIG, EXPECTED_PAGES } from './helpers.mjs';

async function tryBuild(options) {
  const dir = await mkdtemp(path.join(tmpdir(), 'motoboost-gate-'));
  try {
    return await build({ outDir: dir, env: {}, ...options });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('production avec la config par défaut : refus, avec la liste des manques', async () => {
  await assert.rejects(
    () => tryBuild({ production: true }),
    (error) => {
      assert.ok(error instanceof BuildError);
      const all = error.problems.join('\n');
      assert.match(all, /siteUrl/);
      assert.match(all, /form\.endpoint/);
      assert.match(all, /À COMPLÉTER : nom ou dénomination sociale/);
      assert.match(all, /À COMPLÉTER : mention de TVA sous les tarifs/);
      assert.ok(error.problems.length >= 15, `${error.problems.length} problèmes`);
      return true;
    },
  );
});

test('un build refusé ne laisse aucun dossier de sortie (rien de déployable par erreur)', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'motoboost-refused-'));
  try {
    await assert.rejects(() => build({ outDir: dir, env: {}, production: true }), BuildError);
    assert.equal(await exists(dir), false, 'le dossier de sortie doit avoir été supprimé');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('production sans service de formulaire : refus (le formulaire resterait factice)', async () => {
  await assert.rejects(
    () => tryBuild({ production: true, overrides: { ...FULL_CONFIG, form: { endpoint: '' } } }),
    (error) => {
      assert.equal(error.problems.length, 1);
      assert.match(error.problems[0], /form\.endpoint/);
      return true;
    },
  );
});

test('production avec une URL non https : refus', async () => {
  await assert.rejects(
    () => tryBuild({ production: true, overrides: { ...FULL_CONFIG, siteUrl: 'http://www.exemple-test.fr' } }),
    (error) => error.problems.some((p) => /siteUrl/.test(p)),
  );
});

test('production avec un seul repère oublié : refus nommant le repère', async () => {
  const legal = { ...FULL_CONFIG.legal, hostName: '' };
  await assert.rejects(
    () => tryBuild({ production: true, overrides: { ...FULL_CONFIG, legal } }),
    (error) => {
      assert.equal(error.problems.length, 1);
      assert.match(error.problems[0], /nom de l’hébergeur \(\/mentions-legales\/\)/);
      return true;
    },
  );
});

test('production complète : site indexable, sans bandeau ni repère, avec sitemap et robots', async () => {
  const site = await buildTemp({ production: true, overrides: FULL_CONFIG });
  try {
    assert.equal(site.result.todos.length, 0);
    for (const p of EXPECTED_PAGES) {
      const { html, root } = await readPage(site.dir, p);
      assert.equal(root.querySelector('.demo-banner'), null, `${p} : bandeau`);
      assert.doesNotMatch(html, /data-todo|À COMPLÉTER/, p);
      const robots = root.querySelector('meta[name="robots"]');
      if (p === '/404.html') assert.match(robots.getAttribute('content'), /noindex/);
      else assert.equal(robots, null, `${p} : doit être indexable`);
      if (p !== '/404.html') {
        const canonical = root.querySelector('link[rel="canonical"]').getAttribute('href');
        assert.equal(canonical, `https://www.exemple-test.fr${p}`);
        assert.equal(root.querySelector('meta[property="og:url"]').getAttribute('content'), canonical);
      }
    }
    const sitemap = await readFile(path.join(site.dir, 'sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(
      urls.sort(),
      EXPECTED_PAGES.filter((p) => p !== '/404.html').map((p) => `https://www.exemple-test.fr${p}`).sort(),
    );
    const robots = await readFile(path.join(site.dir, 'robots.txt'), 'utf8');
    assert.match(robots, /Allow: \//);
    assert.match(robots, /Sitemap: https:\/\/www\.exemple-test\.fr\/sitemap\.xml/);
    const contact = await readPage(site.dir, '/contact/');
    assert.match(contact.html, /mailto:bonjour@exemple-test\.fr/);
  } finally {
    await site.cleanup();
  }
});

test('production : l’avertissement « modèle à compléter » disparaît mais les pages légales restent complètes', async () => {
  const site = await buildTemp({ production: true, overrides: FULL_CONFIG });
  try {
    const { html } = await readPage(site.dir, '/mentions-legales/');
    assert.doesNotMatch(html, /alert--warning/);
    assert.match(html, /Éditeur de test/);
    assert.match(html, /Hébergeur de test/);
  } finally {
    await site.cleanup();
  }
});

test('basePath : tous les liens internes et ressources sont préfixés', async () => {
  const site = await buildTemp({ overrides: { basePath: 'motoboost/' } });
  try {
    for (const p of EXPECTED_PAGES) {
      const { root } = await readPage(site.dir, p);
      for (const node of root.querySelectorAll('a[href], link[href], script[src]')) {
        const url = node.getAttribute('href') ?? node.getAttribute('src');
        if (/^(https?:|mailto:|tel:|#)/.test(url)) continue;
        assert.ok(url.startsWith('/motoboost/'), `${p} : ${url}`);
      }
    }
    assert.ok(await exists(path.join(site.dir, 'index.html')), 'les fichiers restent à la racine de dist');
  } finally {
    await site.cleanup();
  }
});

test('variables d’environnement : SITE_URL, FORM_ENDPOINT et SITE_MODE sont prises en compte', async () => {
  const site = await buildTemp({
    env: { SITE_URL: 'https://www.exemple-test.fr/', FORM_ENDPOINT: 'https://forms.exemple-test.fr/x', SITE_MODE: 'production' },
    overrides: { ...FULL_CONFIG, siteUrl: '', form: { endpoint: '' } },
  });
  try {
    assert.equal(site.result.config.siteUrl, 'https://www.exemple-test.fr');
    assert.equal(site.result.config.mode, 'production');
    const { root } = await readPage(site.dir, '/contact/');
    assert.equal(root.querySelector('form').getAttribute('data-mode'), 'live');
  } finally {
    await site.cleanup();
  }
});
