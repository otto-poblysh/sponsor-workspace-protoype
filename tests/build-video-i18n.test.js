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

const os = require('node:os');
const { buildVideoLocale, BEAT_CATALOG_MAP } = require('../tools/build-video-i18n.js');

function buildToTemp() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-fr-'));
  const result = buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'),
    outDir,
    i18nDir: path.join(ROOT, 'i18n'),
    locale: 'fr'
  });
  return { outDir, result };
}

test('every referenced composition is generated, orphans are skipped', () => {
  const { outDir } = buildToTemp();
  const comps = fs.readdirSync(path.join(outDir, 'compositions')).sort();
  assert.deepStrictEqual(comps, [
    'beat-00-intro.html', 'beat-01-dashboard.html', 'beat-02-verification.html',
    'beat-03-skill-gap.html', 'beat-04-reports.html', 'beat-05-audit.html',
    'beat-06-outro.html'
  ]);
  assert.ok(!comps.includes('beat-02-verify.html'), 'orphan draft must not be ported');
  assert.ok(!comps.includes('beat-03-skills.html'), 'orphan draft must not be ported');
});

test('timing attributes are preserved byte-for-byte', () => {
  const { outDir } = buildToTemp();
  const en = fs.readFileSync(path.join(ROOT, 'tutorial-video/index.html'), 'utf8');
  const fr = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const timing = (s) => (s.match(/data-(start|duration|track-index|width|height)="[^"]*"/g) || []).join('|');
  assert.strictEqual(timing(fr), timing(en));
});

test('composition ids and hf ids are preserved', () => {
  const { outDir } = buildToTemp();
  const en = fs.readFileSync(path.join(ROOT, 'tutorial-video/index.html'), 'utf8');
  const fr = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const ids = (s) => (s.match(/data-(composition-id|hf-id)="[^"]*"/g) || []).join('|');
  assert.strictEqual(ids(fr), ids(en));
});

test('embedded portal markup is translated in every screencast beat', () => {
  const { outDir } = buildToTemp();
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('Employeurs enregistrés'));
  assert.ok(b1.includes('Tableau de bord'));
  assert.ok(!/>\s*Registered Employers\s*</.test(b1));
});

test('subtitles are translated in every beat that has them', () => {
  const { outDir } = buildToTemp();
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('textContent: "Bienvenue sur le Portail du Marché du Travail."'));
  const b5 = fs.readFileSync(path.join(outDir, 'compositions/beat-05-audit.html'), 'utf8');
  assert.ok(b5.includes('journal d\'activité inaltérable'));
});

test('the stray literal backslash-n artifact is preserved', () => {
  const { outDir } = buildToTemp();
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('<body>\\n<div'), 'existing English artifact must survive verbatim');
});

test('assets are copied byte-identically', () => {
  const { outDir } = buildToTemp();
  for (const a of ['bgm-icubefarm.mp3', 'bgm-african-classical.mp3', 'corporate_writing_grayscale.jpg']) {
    const src = fs.readFileSync(path.join(ROOT, 'tutorial-video/assets', a));
    const out = fs.readFileSync(path.join(outDir, 'assets', a));
    assert.ok(src.equals(out), `${a} must be copied, not re-encoded`);
  }
});

test('html lang is set to the target locale', () => {
  const { outDir } = buildToTemp();
  const fr = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.match(fr, /<html lang="fr">/);
});

test('build is idempotent', () => {
  const { outDir } = buildToTemp();
  const first = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'), outDir,
    i18nDir: path.join(ROOT, 'i18n'), locale: 'fr'
  });
  const second = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.strictEqual(first, second);
});


