const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const REQUIRED_SUBTITLES = [
  'Welcome to the Labour Market Portal.',
  'The dashboard provides a real-time overview...',
  '...of national employment metrics and skill demands.',
  'Administrators can easily monitor private-sector compliance...',
  '...and verify newly registered employers with a single click.',
  'Use the Skill Gap Report to identify critical worker shortages...',
  '...and discover data-driven training recommendations.',
  'Exporting evidence-based operational reports to PDF or Excel...',
  '...is simple and secure.',
  'Finally, the immutable Activity Log ensures total transparency...',
  '...and accountability across all ministry actions.'
];

const REQUIRED_ARTWORK = [
  'Digital Workforce',
  'Solutions',
  'Labour Market Information System (LMIS) Demo',
  'To customize your Labor Market Information System (LMIS)',
  'Contact:',
  'email:',
  'Whatsapp:'
];

test('video.fr.json covers every subtitle literal', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.fr.json'), 'utf8'));
  const missing = REQUIRED_SUBTITLES.filter((s) => !(s in cat));
  assert.deepStrictEqual(missing, [], `Untranslated subtitles: ${JSON.stringify(missing)}`);
});

test('video.fr.json covers every intro and outro string', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.fr.json'), 'utf8'));
  const missing = REQUIRED_ARTWORK.filter((s) => !(s in cat));
  assert.deepStrictEqual(missing, [], `Untranslated artwork copy: ${JSON.stringify(missing)}`);
});

test('video.fr.json has no empty values', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.fr.json'), 'utf8'));
  const empty = Object.entries(cat).filter(([, v]) => typeof v !== 'string' || v.trim() === '');
  assert.deepStrictEqual(empty, [], `Empty translations: ${JSON.stringify(empty)}`);
});

test('subtitle ellipsis continuation markers are preserved', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.fr.json'), 'utf8'));
  for (const [en, fr] of Object.entries(cat)) {
    if (en.startsWith('...')) {
      assert.ok(fr.startsWith('...'), `"${fr}" must open with "..." to match "${en}"`);
    }
    if (en.endsWith('...')) {
      assert.ok(fr.endsWith('...'), `"${fr}" must close with "..." to match "${en}"`);
    }
  }
});

const { translateSubtitles } = require('../tools/lib/translate-subtitles.js');

const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures/mini-beat.html'), 'utf8');

const MINI_CAT = {
  'Welcome to the Labour Market Portal.': 'Bienvenue sur le Portail du Marché du Travail.',
  '...is simple and secure.': '...est simple et sécurisée.'
};

test('translateSubtitles replaces every textContent literal', () => {
  const { html, translated, missing } = translateSubtitles(FIXTURE, MINI_CAT);
  assert.strictEqual(translated, 2);
  assert.deepStrictEqual(missing, []);
  assert.ok(html.includes('textContent: "Bienvenue sur le Portail du Marché du Travail."'));
  assert.ok(html.includes('textContent: "...est simple et sécurisée."'));
  assert.ok(!html.includes('Welcome to the Labour Market Portal.'));
});

test('translateSubtitles leaves surrounding GSAP byte-identical', () => {
  const { html } = translateSubtitles(FIXTURE, MINI_CAT);
  assert.ok(html.includes('.to("#cursor", { x: 400, y: 200, duration: 2, ease: "power2.inOut" })'));
  assert.ok(html.includes('data-hf-id="hf-mini"'));
  assert.ok(html.includes('data-duration="5"'));
});

test('translateSubtitles reports missing keys instead of silently passing through', () => {
  const { missing, translated } = translateSubtitles(FIXTURE, {
    'Welcome to the Labour Market Portal.': 'Bienvenue.'
  });
  assert.strictEqual(translated, 1);
  assert.deepStrictEqual(missing, ['...is simple and secure.']);
});

test('translateSubtitles throws in strict mode when a subtitle is untranslated', () => {
  assert.throws(
    () => translateSubtitles(FIXTURE, {}, { strict: true }),
    /Untranslated subtitle/
  );
});

test('translateSubtitles escapes double quotes in the translation', () => {
  const src = 'tl.set("#subtitle-container", { textContent: "Reports" });';
  const { html } = translateSubtitles(src, { Reports: 'Rapports « clés »' });
  assert.ok(html.includes('textContent: "Rapports « clés »"'));
});

