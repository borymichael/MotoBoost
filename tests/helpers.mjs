import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parse } from 'node-html-parser';
import { build } from '../scripts/build.mjs';

export const EXPECTED_PAGES = [
  '/',
  '/offres/',
  '/methode/',
  '/faq/',
  '/contact/',
  '/mentions-legales/',
  '/confidentialite/',
  '/404.html',
];

/** Construit le site dans un dossier temporaire, sans lire les variables d'environnement. */
export async function buildTemp(options = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'motoboost-test-'));
  const result = await build({ outDir: dir, env: {}, ...options });
  return { dir, result, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

export const fileFor = (urlPath) => (urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath).replace(/^\//, '');

export async function readPage(dir, urlPath) {
  const html = await readFile(path.join(dir, fileFor(urlPath)), 'utf8');
  return { html, root: parse(html, { comment: false }) };
}

export async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/** Texte visible approximatif (sans script/style), espaces normalisés. */
export function visibleText(root) {
  const clone = parse(root.toString());
  clone.querySelectorAll('script, style').forEach((node) => node.remove());
  // Les espaces insécables sont conservés : ils font partie de la typographie vérifiée.
  return clone.textContent.replace(/[ \t\r\n]+/g, ' ').trim();
}

/** Config minimale complète : permet un build production valide. */
export const FULL_CONFIG = {
  siteUrl: 'https://www.exemple-test.fr',
  pricingNote: 'Prix TTC',
  contact: { email: 'bonjour@exemple-test.fr', phone: '01 23 45 67 89' },
  form: { endpoint: 'https://forms.exemple-test.fr/f/abc123' },
  legal: {
    publisherName: 'Éditeur de test',
    legalForm: 'Forme de test',
    registration: 'SIREN 000 000 000',
    vatMention: 'TVA de test',
    address: '1 rue du Test, 00000 Ville',
    publicationDirector: 'Directeur de test',
    hostName: 'Hébergeur de test',
    hostAddress: '2 rue du Test, 00000 Ville',
    hostPhone: '01 00 00 00 00',
    reuseTerms: 'Texte de test',
    liabilityText: 'Texte de test',
    legalBasis: 'Base de test',
    processors: 'Prestataires de test',
    retention: 'Durée de test',
    transfers: 'Aucun transfert (test)',
    hostLogs: 'Journaux de test',
    lastUpdate: '1er janvier 2026 (test)',
  },
};
