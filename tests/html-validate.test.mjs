// Validation HTML (structure, accessibilité statique, attributs) avec html-validate.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { HtmlValidate } from 'html-validate';
import { buildTemp, fileFor, EXPECTED_PAGES } from './helpers.mjs';

let site;
const validator = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    // Choix de style du projet : doctype minuscule, balises auto-fermées interdites sur les éléments void.
    'doctype-style': 'off',
    'void-style': ['error', { style: 'omit' }],
    'attribute-boolean-style': ['error', { style: 'omit' }],
    'no-trailing-whitespace': 'off',
    'attr-quotes': 'error',
    'no-inline-style': 'error',
  },
});

before(async () => {
  site = await buildTemp();
});
after(() => site?.cleanup());

for (const page of EXPECTED_PAGES) {
  test(`html-validate : ${page}`, async () => {
    const html = await readFile(path.join(site.dir, fileFor(page)), 'utf8');
    const report = await validator.validateString(html, page);
    const messages = report.results.flatMap((r) =>
      r.messages.map((m) => `${m.ruleId} (${m.line}:${m.column}) ${m.message}`),
    );
    assert.deepEqual(messages, [], `\n${messages.join('\n')}`);
  });
}

test('html-validate : la version production est aussi valide', async () => {
  const { FULL_CONFIG } = await import('./helpers.mjs');
  const prod = await buildTemp({ production: true, overrides: FULL_CONFIG });
  try {
    for (const page of EXPECTED_PAGES) {
      const html = await readFile(path.join(prod.dir, fileFor(page)), 'utf8');
      const report = await validator.validateString(html, page);
      const messages = report.results.flatMap((r) => r.messages.map((m) => `${page} ${m.ruleId} (${m.line}:${m.column}) ${m.message}`));
      assert.deepEqual(messages, [], `\n${messages.join('\n')}`);
    }
  } finally {
    await prod.cleanup();
  }
});
