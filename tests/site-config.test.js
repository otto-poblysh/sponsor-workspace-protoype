const test = require('node:test');
const assert = require('node:assert');
const { rewriteToggleLinks } = require('../tools/build-i18n.js');

const TOGGLE = [
  '<a class="lang-opt" hreflang="en" href="index.html">EN</a>',
  '<a class="lang-opt" hreflang="fr" href="fr/index.html">FR</a>',
  '<a class="lang-opt" hreflang="es" href="es/index.html">ES</a>'
].join('');

function hrefOf(html, lang) {
  const m = html.match(new RegExp(`hreflang="${lang}" href="([^"]*)"`));
  return m && m[1];
}

test('without englishDir, English stays at the site root (ministry behaviour)', () => {
  const fr = rewriteToggleLinks(TOGGLE, 'fr', 'entities.html');
  assert.strictEqual(hrefOf(fr, 'en'), '../entities.html');
  assert.strictEqual(hrefOf(fr, 'fr'), 'entities.html');
  assert.strictEqual(hrefOf(fr, 'es'), '../es/entities.html');
});

test('with englishDir, English is a sibling directory', () => {
  const fr = rewriteToggleLinks(TOGGLE, 'fr', 'entities.html', 'en');
  assert.strictEqual(hrefOf(fr, 'en'), '../en/entities.html');
  assert.strictEqual(hrefOf(fr, 'fr'), 'entities.html');
  assert.strictEqual(hrefOf(fr, 'es'), '../es/entities.html');
});

test('with englishDir, the es page links back through ../en/', () => {
  const es = rewriteToggleLinks(TOGGLE, 'es', 'skill-gap.html', 'en');
  assert.strictEqual(hrefOf(es, 'en'), '../en/skill-gap.html');
  assert.strictEqual(hrefOf(es, 'fr'), '../fr/skill-gap.html');
  assert.strictEqual(hrefOf(es, 'es'), 'skill-gap.html');
});

test('with englishDir, an en page reaches siblings through ../', () => {
  const en = rewriteToggleLinks(TOGGLE, 'en', 'index.html', 'en');
  assert.strictEqual(hrefOf(en, 'en'), 'index.html');
  assert.strictEqual(hrefOf(en, 'fr'), '../fr/index.html');
  assert.strictEqual(hrefOf(en, 'es'), '../es/index.html');
});

test('the active segment still tracks the locale when englishDir is set', () => {
  const fr = rewriteToggleLinks(TOGGLE, 'fr', 'index.html', 'en');
  assert.match(fr, /class="lang-opt is-active" hreflang="fr"/);
  assert.match(fr, /class="lang-opt" hreflang="en"/);
});

const path = require('node:path');
const { resolveSite } = require('../tools/build-i18n.js');
const ROOT = path.join(__dirname, '..');

test('no --site resolves to repo root with no englishDir', () => {
  const s = resolveSite([], ROOT);
  assert.strictEqual(s.srcDir, ROOT);
  assert.strictEqual(s.outDir, ROOT);
  assert.strictEqual(s.i18nDir, path.join(ROOT, 'i18n'));
  assert.strictEqual(s.englishDir, null);
});

test('--site with an en/ subdirectory sources from it', () => {
  const s = resolveSite(['--site', 'pan-african-org'], ROOT);
  assert.strictEqual(s.srcDir, path.join(ROOT, 'pan-african-org', 'en'));
  assert.strictEqual(s.outDir, path.join(ROOT, 'pan-african-org'));
  assert.strictEqual(s.i18nDir, path.join(ROOT, 'pan-african-org', 'i18n'));
  assert.strictEqual(s.englishDir, 'en');
});

test('--site without an en/ subdirectory sources from the site root', () => {
  const s = resolveSite(['--site', 'tutorial-video'], ROOT);
  assert.strictEqual(s.srcDir, path.join(ROOT, 'tutorial-video'));
  assert.strictEqual(s.englishDir, null);
});
