const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { buildVideoLocale } = require('../tools/build-video-i18n.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'pan-african-org', 'video-en');
const I18N = path.join(ROOT, 'pan-african-org', 'i18n');

function buildTo(locale) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `org-vid-${locale}-`));
  const catalogMap = {
    'beat-00-intro.html': null,
    'beat-01-dashboard.html': 'index',
    'beat-02-members.html': 'entities',
    'beat-03-recruiter.html': 'recruiter-jobs',
    'beat-04-seeker.html': 'seeker-home',
    'beat-05-skill-gap.html': 'skill-gap',
    'beat-06-outro.html': null
  };
  buildVideoLocale({ srcDir: SRC, outDir, i18nDir: I18N, locale, catalogMap });
  return outDir;
}

for (const locale of ['fr', 'es']) {
  test(`[${locale}] generated files open with the doctype`, () => {
    const out = buildTo(locale);
    for (const f of ['index.html', ...fs.readdirSync(path.join(out, 'compositions')).map((c) => `compositions/${c}`)]) {
      const head = fs.readFileSync(path.join(out, f), 'utf8').slice(0, 200);
      assert.ok(/^<!DOCTYPE html>/i.test(head),
        `${locale}/${f} must open with the doctype or accents will corrupt`);
    }
  });

  test(`[${locale}] no mojibake and no English subtitle survives`, () => {
    const out = buildTo(locale);
    const video = JSON.parse(fs.readFileSync(path.join(I18N, `video.${locale}.json`), 'utf8'));
    for (const f of fs.readdirSync(path.join(out, 'compositions'))) {
      const html = fs.readFileSync(path.join(out, 'compositions', f), 'utf8');
      assert.ok(!/Ã[©¨«¢]/.test(html), `mojibake in ${locale}/${f}`);
      for (const en of Object.keys(video)) {
        assert.ok(!html.includes(`textContent: "${en}"`) && !html.includes(`textContent: '${en}'`),
          `${locale}/${f} still carries the English subtitle "${en}"`);
      }
    }
  });

  test(`[${locale}] timing is preserved byte-for-byte`, () => {
    const out = buildTo(locale);
    const timing = (s) => (s.match(/data-(start|duration|track-index|width|height)="[^"]*"/g) || []).join('|');
    assert.strictEqual(
      timing(fs.readFileSync(path.join(out, 'index.html'), 'utf8')),
      timing(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'))
    );
  });
}
