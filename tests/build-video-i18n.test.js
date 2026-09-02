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
  'National Employment Portal',
  'Demo for Job Creation',
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

test('translateSubtitles supports single-quoted subtitle literals and escapes single quotes', () => {
  const src = "tl.set('#subtitle-container', { textContent: 'Skill Report' });";
  const { html, translated } = translateSubtitles(src, { 'Skill Report': "Rapport sur l'emploi" });
  assert.strictEqual(translated, 1);
  assert.ok(html.includes("textContent: 'Rapport sur l\\'emploi'"));
});

const os = require('node:os');
const { buildVideoLocale, BEAT_CATALOG_MAP } = require('../tools/build-video-i18n.js');

function buildToTempFor(locale) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `tv-${locale}-`));
  const result = buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'),
    outDir,
    i18nDir: path.join(ROOT, 'i18n'),
    locale
  });
  return { outDir, result };
}

const EXPECTED_COMPOSITIONS = [
  'beat-00-intro.html', 'beat-01-dashboard.html', 'beat-02-verification.html',
  'beat-03-skill-gap.html', 'beat-04-reports.html', 'beat-05-audit.html',
  'beat-06-outro.html'
];

for (const locale of ['fr', 'es']) {
  test(`[${locale}] generates exactly the referenced compositions`, () => {
    const { outDir } = buildToTempFor(locale);
    assert.deepStrictEqual(
      fs.readdirSync(path.join(outDir, 'compositions')).sort(),
      EXPECTED_COMPOSITIONS
    );
  });

  test(`[${locale}] preserves timing attributes byte-for-byte`, () => {
    const { outDir } = buildToTempFor(locale);
    const timing = (s) =>
      (s.match(/data-(start|duration|track-index|width|height)="[^"]*"/g) || []).join('|');
    assert.strictEqual(
      timing(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')),
      timing(fs.readFileSync(path.join(ROOT, 'tutorial-video/index.html'), 'utf8'))
    );
  });

  test(`[${locale}] preserves composition ids and hf ids`, () => {
    const { outDir } = buildToTempFor(locale);
    const ids = (s) => (s.match(/data-(composition-id|hf-id)="[^"]*"/g) || []).join('|');
    assert.strictEqual(
      ids(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')),
      ids(fs.readFileSync(path.join(ROOT, 'tutorial-video/index.html'), 'utf8'))
    );
  });

  test(`[${locale}] sets html lang to the target locale`, () => {
    const { outDir } = buildToTempFor(locale);
    assert.match(
      fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'),
      new RegExp(`<html lang="${locale}">`)
    );
  });

  test(`[${locale}] preserves the stray backslash-n artifact`, () => {
    const { outDir } = buildToTempFor(locale);
    const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
    assert.ok(b1.includes('<body>\\n<div'));
  });

  test(`[${locale}] copies assets byte-identically`, () => {
    const { outDir } = buildToTempFor(locale);
    for (const a of ['bgm-icubefarm.mp3', 'bgm-african-classical.mp3', 'corporate_writing_grayscale.jpg']) {
      assert.ok(
        fs.readFileSync(path.join(ROOT, 'tutorial-video/assets', a))
          .equals(fs.readFileSync(path.join(outDir, 'assets', a))),
        `${a} must be copied, not re-encoded`
      );
    }
  });

  test(`[${locale}] build is idempotent`, () => {
    const { outDir } = buildToTempFor(locale);
    const first = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
    buildVideoLocale({
      srcDir: path.join(ROOT, 'tutorial-video'), outDir,
      i18nDir: path.join(ROOT, 'i18n'), locale
    });
    assert.strictEqual(
      first,
      fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8')
    );
  });

  test(`[${locale}] no English subtitle survives translation`, () => {
    const { outDir } = buildToTempFor(locale);
    const video = JSON.parse(fs.readFileSync(path.join(ROOT, `i18n/video.${locale}.json`), 'utf8'));
    for (const file of EXPECTED_COMPOSITIONS) {
      const html = fs.readFileSync(path.join(outDir, 'compositions', file), 'utf8');
      for (const en of Object.keys(video)) {
        assert.ok(
          !html.includes(`textContent: "${en}"`) && !html.includes(`textContent: '${en}'`),
          `${locale}/${file} still carries the English subtitle "${en}"`
        );
      }
    }
  });
}

test('[fr] embedded portal markup is translated in every screencast beat', () => {
  const { outDir } = buildToTempFor('fr');
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('Employeurs enregistrés'));
  assert.ok(b1.includes('Tableau de bord'));
  assert.ok(!/>\s*Registered Employers\s*</.test(b1));
});

test('[fr] subtitles are translated in every beat that has them', () => {
  const { outDir } = buildToTempFor('fr');
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('textContent: "Bienvenue sur le Portail du Marché du Travail."'));
  const b5 = fs.readFileSync(path.join(outDir, 'compositions/beat-05-audit.html'), 'utf8');
  assert.ok(b5.includes('journal d\'activité inaltérable'));
});

test('[es] embedded portal markup is translated', () => {
  const { outDir } = buildToTempFor('es');
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('Empleadores registrados'));
  assert.ok(b1.includes('Panel de control'));
  assert.ok(!/>\s*Registered Employers\s*</.test(b1));
});

test('[es] subtitles are translated', () => {
  const { outDir } = buildToTempFor('es');
  const b1 = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  assert.ok(b1.includes('Le damos la bienvenida al Portal del Mercado Laboral.'));
  const b5 = fs.readFileSync(path.join(outDir, 'compositions/beat-05-audit.html'), 'utf8');
  assert.ok(b5.includes('registro de actividad inalterable'));
});

test('video.es.json has exactly the same keys as video.fr.json', () => {
  const fr = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.fr.json'), 'utf8'));
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.es.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(es).sort(), Object.keys(fr).sort());
});

test('video.es.json has no empty values', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.es.json'), 'utf8'));
  const empty = Object.entries(es).filter(([, v]) => typeof v !== 'string' || v.trim() === '');
  assert.deepStrictEqual(empty, [], `Empty translations: ${JSON.stringify(empty)}`);
});

test('video.es.json preserves subtitle ellipsis continuation markers', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.es.json'), 'utf8'));
  for (const [en, val] of Object.entries(es)) {
    if (en.startsWith('...')) assert.ok(val.startsWith('...'), `"${val}" must open with "..."`);
    if (en.endsWith('...')) assert.ok(val.endsWith('...'), `"${val}" must close with "..."`);
  }
});

test('video.es.json uses no French-style space before colon', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.es.json'), 'utf8'));
  const offenders = Object.entries(es).filter(([, v]) => /[\s  ]:/.test(v));
  assert.deepStrictEqual(offenders, [], `Spanish takes no space before ":": ${JSON.stringify(offenders)}`);
});

test('video.es.json does not gender the viewer in the welcome subtitle', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n/video.es.json'), 'utf8'));
  const welcome = es['Welcome to the Labour Market Portal.'];
  assert.ok(!/\bBienvenid[oa]\b/.test(welcome), `Use a gender-neutral formal welcome, got: "${welcome}"`);
});

const { LOCALE_STYLE_OVERRIDES } = require('../tools/build-video-i18n.js');

test('LOCALE_STYLE_OVERRIDES is exported and needs no per-locale intro shrink', () => {
  assert.ok(LOCALE_STYLE_OVERRIDES, 'driver must export LOCALE_STYLE_OVERRIDES');
  assert.strictEqual(
    LOCALE_STYLE_OVERRIDES.fr && LOCALE_STYLE_OVERRIDES.fr['beat-00-intro.html'],
    undefined,
    'the 32px two-line title fits French without an override'
  );
  assert.strictEqual(
    LOCALE_STYLE_OVERRIDES.es && LOCALE_STYLE_OVERRIDES.es['beat-00-intro.html'],
    undefined,
    'the 32px two-line title fits Spanish without an override'
  );
});

test('refactor leaves the committed French intro byte-identical', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-fr-regress-'));
  buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'),
    outDir,
    i18nDir: path.join(ROOT, 'i18n'),
    locale: 'fr'
  });
  const rebuilt = fs.readFileSync(path.join(outDir, 'compositions/beat-00-intro.html'), 'utf8');
  const committed = fs.readFileSync(
    path.join(ROOT, 'tutorial-video-fr/compositions/beat-00-intro.html'), 'utf8'
  );
  assert.strictEqual(rebuilt, committed, 'French output must not regress');
});

test('a composition with no override entry gets no injected style tag', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-noover-'));
  buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'),
    outDir,
    i18nDir: path.join(ROOT, 'i18n'),
    locale: 'es'
  });
  const dash = fs.readFileSync(path.join(outDir, 'compositions/beat-01-dashboard.html'), 'utf8');
  const injected = (dash.match(/font-size:\s*\d+px !important/g) || []);
  assert.deepStrictEqual(injected, [], 'no override configured for beat-01-dashboard.html');
});

for (const locale of ['fr', 'es']) {
  test(`[${locale}] generated files start with <!DOCTYPE html>, not a comment`, () => {
    const { outDir } = buildToTempFor(locale);
    const files = ['index.html', ...EXPECTED_COMPOSITIONS.map((f) => `compositions/${f}`)];
    for (const f of files) {
      const head = fs.readFileSync(path.join(outDir, f), 'utf8').slice(0, 200);
      assert.ok(
        /^<!DOCTYPE html>/i.test(head),
        `${locale}/${f} must open with the doctype. A comment before it makes the ` +
        `HyperFrames loader treat the file as a fragment, dropping <meta charset> ` +
        `and rendering every accented character as mojibake.`
      );
      assert.ok(head.includes('GENERATED FILE'), `${locale}/${f} lost its generated banner`);
    }
  });

  test(`[${locale}] accented characters survive as valid UTF-8`, () => {
    const { outDir } = buildToTempFor(locale);
    const intro = fs.readFileSync(path.join(outDir, 'compositions/beat-00-intro.html'), 'utf8');
    assert.ok(!/Ã[©¨«¢]/.test(intro), 'mojibake detected in the intro');
    const expected = locale === 'fr' ? 'Création' : 'Creación';
    assert.ok(intro.includes(expected), `expected "${expected}" in the ${locale} intro`);
  });

  test(`[${locale}] intro title renders as two explicit lines`, () => {
    const { outDir } = buildToTempFor(locale);
    const intro = fs.readFileSync(path.join(outDir, 'compositions/beat-00-intro.html'), 'utf8');
    const lines = intro.match(/class="title-line">([^<]*)</g) || [];
    assert.strictEqual(lines.length, 2, 'the cover title must be exactly two lines');
  });
}
