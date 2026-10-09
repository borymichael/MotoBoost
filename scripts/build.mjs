// Build du site statique : gabarits JS -> dist/ (HTML, CSS/JS hachés, police, headers).
// Usage : node scripts/build.mjs [--production] [--out <dossier>] [--quiet]

import { build as esbuild } from 'esbuild';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import pages from '../src/pages/index.mjs';
import { layout, JS_FLAG_HASH } from '../src/templates/layout.mjs';
import { typoHtml } from '../src/templates/html.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class BuildError extends Error {
  constructor(problems) {
    super(`Build refusé :\n - ${problems.join('\n - ')}`);
    this.name = 'BuildError';
    this.problems = problems;
  }
}

function deepMerge(base, extra) {
  if (!extra) return base;
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof base[key] === 'object') {
      base[key] = deepMerge(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

/** Charge site.config.mjs, applique les surcharges et les variables d'environnement. */
export async function loadConfig({ production = false, overrides = {}, env = process.env } = {}) {
  const mod = await import(pathToFileURL(path.join(ROOT, 'site.config.mjs')).href);
  const config = deepMerge(structuredClone(mod.default), overrides);
  if (env.SITE_URL) config.siteUrl = env.SITE_URL;
  if (env.BASE_PATH) config.basePath = env.BASE_PATH;
  if (env.FORM_ENDPOINT) config.form.endpoint = env.FORM_ENDPOINT;
  if (env.SITE_MODE) config.mode = env.SITE_MODE;
  if (production) config.mode = 'production';

  config.siteUrl = (config.siteUrl || '').replace(/\/+$/, '');
  const base = (config.basePath || '').replace(/^\/*|\/+$/g, '');
  config.basePath = base ? `/${base}` : '';
  config.form.endpoint = (config.form.endpoint || '').trim();
  return config;
}

function fileFor(urlPath) {
  return urlPath.endsWith('/') ? `${urlPath}index.html`.slice(1) : urlPath.slice(1);
}

function endpointOrigin(endpoint) {
  try {
    return /^https?:\/\//i.test(endpoint) ? new URL(endpoint).origin : '';
  } catch {
    return '';
  }
}

export function contentSecurityPolicy(config, { forMeta = false } = {}) {
  const origin = endpointOrigin(config.form.endpoint);
  const directives = [
    ["default-src", "'self'"],
    ['script-src', `'self' '${JS_FLAG_HASH}'`],
    ['style-src', "'self'"],
    ['img-src', "'self'"],
    ['font-src', "'self'"],
    ['connect-src', `'self'${origin ? ` ${origin}` : ''}`],
    ['form-action', `'self'${origin ? ` ${origin}` : ''}`],
    ['base-uri', "'self'"],
    ['object-src', "'none'"],
  ];
  if (!forMeta) directives.push(['frame-ancestors', "'none'"]); // ignoré dans une balise <meta>
  return directives.map(([name, value]) => `${name} ${value}`).join('; ');
}

function headersFile(config) {
  return `# Généré par scripts/build.mjs — lu par Netlify et Cloudflare Pages.
/*
  Content-Security-Policy: ${contentSecurityPolicy(config)}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

async function bundleAssets(outDir) {
  const result = await esbuild({
    absWorkingDir: ROOT,
    entryPoints: {
      'css/main': 'src/assets/css/main.css',
      'js/main': 'src/assets/js/main.js',
      'js/form': 'src/assets/js/form.js',
    },
    outdir: path.join(outDir, 'assets'),
    entryNames: '[dir]/[name]-[hash]',
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['chrome100', 'firefox100', 'safari15', 'edge100'],
    external: ['*.woff2'],
    legalComments: 'none',
    metafile: true,
    logLevel: 'silent',
  });
  const urls = {};
  for (const [file, meta] of Object.entries(result.metafile.outputs)) {
    if (!meta.entryPoint) continue;
    const rel = path.relative(path.join(outDir, 'assets'), path.resolve(ROOT, file)).split(path.sep).join('/');
    urls[meta.entryPoint] = `/assets/${rel}`;
  }
  return urls;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

export async function build({
  outDir = path.join(ROOT, 'dist'),
  production = false,
  overrides = {},
  env = process.env,
  log = () => {},
} = {}) {
  const config = await loadConfig({ production, overrides, env });
  const isProd = config.mode === 'production';
  const problems = [];

  if (isProd) {
    if (!/^https:\/\/[^\s/]+/i.test(config.siteUrl)) {
      problems.push('siteUrl : renseignez l’URL publique en https (ex. https://www.votredomaine.fr)');
    }
    if (!config.form.endpoint) {
      problems.push(
        'form.endpoint : aucun service d’envoi configuré — le formulaire resterait en mode démonstration (rien ne serait transmis)',
      );
    }
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'assets'), { recursive: true });

  const built = await bundleAssets(outDir);
  await cp(path.join(ROOT, 'src/assets/fonts'), path.join(outDir, 'assets/fonts'), { recursive: true });
  await cp(path.join(ROOT, 'src/public'), outDir, { recursive: true });

  const prefix = (p) => `${config.basePath}${p}`;
  const ctx = {
    config,
    isProd,
    indexable: isProd,
    year: new Date().getFullYear(),
    url: prefix,
    absolute: (p) => (config.siteUrl ? `${config.siteUrl}${config.basePath}${p}` : ''),
    csp: contentSecurityPolicy(config, { forMeta: true }),
    assets: {
      css: prefix(built['src/assets/css/main.css']),
      mainJs: prefix(built['src/assets/js/main.js']),
      formJs: prefix(built['src/assets/js/form.js']),
      fontBold: prefix('/assets/fonts/barlow-condensed-latin-700-normal.woff2'),
    },
  };

  const written = [];
  const todos = new Map(); // libellé -> pages
  for (const page of pages) {
    const body = page.render(ctx);
    const doc = typoHtml(layout(ctx, page, body).toString());
    const file = fileFor(page.path);
    const target = path.join(outDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, doc, 'utf8');
    written.push({ path: page.path, file, bytes: Buffer.byteLength(doc), noindex: Boolean(page.noindex) });
    for (const match of doc.matchAll(/data-todo="([^"]*)"/g)) {
      const label = match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      if (!todos.has(label)) todos.set(label, new Set());
      todos.get(label).add(page.path);
    }
  }

  // sitemap.xml / robots.txt / _headers
  if (isProd) {
    const urls = written
      .filter((p) => !p.noindex)
      .map((p) => `  <url><loc>${ctx.absolute(p.path)}</loc></url>`)
      .join('\n');
    await writeFile(
      path.join(outDir, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
    await writeFile(
      path.join(outDir, 'robots.txt'),
      `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}${config.basePath}/sitemap.xml\n`,
    );
  } else {
    await writeFile(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  }
  await writeFile(path.join(outDir, '_headers'), headersFile(config));

  if (isProd && todos.size > 0) {
    for (const [label, where] of todos) problems.push(`À COMPLÉTER : ${label} (${[...where].join(', ')})`);
  }
  if (problems.length) {
    // Un build refusé ne doit laisser aucun dossier déployable par erreur.
    await rm(outDir, { recursive: true, force: true });
    throw new BuildError(problems);
  }

  const files = await walk(outDir);
  const sizes = [];
  for (const file of files) {
    const buf = await readFile(file);
    sizes.push({ file: path.relative(outDir, file).split(path.sep).join('/'), bytes: buf.length, gzip: gzipSync(buf).length });
  }

  log(`Build ${isProd ? 'PRODUCTION' : 'démonstration'} : ${written.length} pages -> ${path.relative(ROOT, outDir) || outDir}`);
  if (!isProd && todos.size) log(`${todos.size} repère(s) « À COMPLÉTER » restants (bloquants en production).`);
  return { config, pages: written, todos: [...todos].map(([label, where]) => ({ label, pages: [...where] })), sizes, outDir };
}

// ---- CLI -------------------------------------------------------------------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const outIndex = args.indexOf('--out');
  const outDir = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(ROOT, 'dist');
  try {
    const result = await build({
      outDir,
      production: args.includes('--production'),
      log: quiet ? () => {} : (line) => console.log(line),
    });
    if (!quiet) {
      const total = result.sizes.reduce((sum, s) => sum + s.gzip, 0);
      for (const s of result.sizes.filter((f) => /\.(html|css|js|woff2)$/.test(f.file))) {
        console.log(`  ${s.file.padEnd(52)} ${String(s.bytes).padStart(7)} o   gzip ${String(s.gzip).padStart(6)} o`);
      }
      console.log(`  Total (gzip) : ${(total / 1024).toFixed(1)} Ko`);
      for (const todo of result.todos) console.log(`  À compléter : ${todo.label}`);
    }
  } catch (error) {
    if (error instanceof BuildError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  }
}
