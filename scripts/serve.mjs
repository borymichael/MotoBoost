// Serveur statique local pour dist/ — sans dépendance.
//   npm run preview   -> sert dist/ tel quel (applique les en-têtes du fichier _headers)
//   npm run dev       -> idem + reconstruit à chaque modification de src/ ou site.config.mjs
// Options : --dir <dossier> pour servir un autre dossier que dist/. Variable : PORT (3000 par défaut).

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirArg = process.argv.indexOf('--dir');
const DIST = dirArg >= 0 ? path.resolve(process.argv[dirArg + 1]) : path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const WATCH = process.argv.includes('--watch');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/** Lit le fichier _headers (format Netlify / Cloudflare Pages). */
async function loadHeaderRules() {
  let text = '';
  try {
    text = await readFile(path.join(DIST, '_headers'), 'utf8');
  } catch {
    return [];
  }
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) rules.push({ prefix: line.trim().replace(/\*$/, ''), headers: {} });
    else if (rules.length) {
      const i = line.indexOf(':');
      rules.at(-1).headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.normalize(path.join(DIST, clean));
  if (!target.startsWith(DIST)) return { status: 403 };
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      if (!clean.endsWith('/')) return { status: 301, location: `${clean}/` };
      return { status: 200, file: path.join(target, 'index.html') };
    }
    return { status: 200, file: target };
  } catch {
    return { status: 404, file: path.join(DIST, '404.html') };
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const found = await resolveFile(req.url);
    if (found.status === 301) {
      res.writeHead(301, { Location: found.location });
      return res.end();
    }
    if (found.status === 403) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    const headers = {};
    const urlPath = req.url.split('?')[0];
    for (const rule of await loadHeaderRules()) {
      if (urlPath.startsWith(rule.prefix)) Object.assign(headers, rule.headers);
    }
    if (WATCH) headers['Cache-Control'] = 'no-store';
    let body;
    try {
      body = await readFile(found.file);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 — lancez d’abord « npm run build »');
    }
    headers['Content-Type'] = MIME[path.extname(found.file)] ?? 'application/octet-stream';
    res.writeHead(found.status, headers);
    res.end(body);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

function rebuild() {
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--quiet'], { stdio: 'inherit' });
  return new Promise((resolve) => child.on('close', resolve));
}

if (WATCH) {
  await rebuild();
  let timer;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const code = await rebuild();
      console.log(code === 0 ? '↻ reconstruit' : '✖ build en erreur (voir ci-dessus)');
    }, 150);
  };
  for (const target of ['src', 'scripts', 'site.config.mjs']) {
    watch(path.join(ROOT, target), { recursive: true }, trigger);
  }
}

server.listen(PORT, () => {
  console.log(`MotoBoost -> http://localhost:${PORT}/  ${WATCH ? '(mode dev : rechargez la page après modification)' : ''}`);
});
