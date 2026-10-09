import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, html, raw, typo, typoHtml } from '../src/templates/html.mjs';

test('html`` échappe les valeurs par défaut (anti-injection)', () => {
  const evil = '<script>alert("x")</script> & \'q\'';
  const out = html`<p title="${evil}">${evil}</p>`.toString();
  assert.equal(out, '<p title="&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;</p>');
  assert.doesNotMatch(out, /<script/);
});

test('html`` : raw et html imbriqués passent tels quels, tableaux concaténés, faux/null ignorés', () => {
  const inner = html`<b>${'a<b'}</b>`;
  assert.equal(html`${raw('<i>x</i>')}|${inner}|${[1, html`<u>2</u>`]}|${false}|${null}|${undefined}|${true}`.toString(), '<i>x</i>|<b>a&lt;b</b>|1<u>2</u>||||');
  assert.equal(esc(0), '0');
});

test('typo : espaces insécables avant ; : ! ? » € et après «', () => {
  assert.equal(typo('Quoi ? Oui ! Ex : ok ; fin'), 'Quoi ? Oui ! Ex : ok ; fin');
  assert.equal(typo('« Bonjour »'), '« Bonjour »');
  assert.equal(typo('79 € et 49 €/mois'), '79 € et 49 €/mois');
  assert.equal(typo('Quoi ?'), 'Quoi ?', 'idempotent');
});

test('typoHtml : ne touche ni aux balises, ni aux attributs, ni aux scripts et styles', () => {
  const source = '<a href="/x ?y" title="a : b">Salut !</a><script>var a = b ? c : d;</script><style>a :hover{}</style>';
  assert.equal(
    typoHtml(source),
    '<a href="/x ?y" title="a : b">Salut !</a><script>var a = b ? c : d;</script><style>a :hover{}</style>',
  );
});
