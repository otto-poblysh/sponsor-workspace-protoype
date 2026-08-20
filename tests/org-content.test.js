const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EN = path.join(ROOT, 'pan-african-org', 'en');

const pages = () => fs.readdirSync(EN).filter((f) => f.endsWith('.html'));
const read = (f) => fs.readFileSync(path.join(EN, f), 'utf8');

const MINISTRY_TERMS = [
  'Ministry of Labour', 'Ministry Users', 'Ministry Administrator',
  'Registered Employers', 'Labour Market Portal', 'Labour Market Reports',
  'Regional Coverage', 'Equatorial Guinea'
];

test('no ministry vocabulary survives on any org page', () => {
  const hits = [];
  for (const f of pages()) {
    const html = read(f);
    for (const term of MINISTRY_TERMS) {
      if (html.includes(term)) hits.push(`${f}: "${term}"`);
    }
  }
  assert.deepStrictEqual(hits, [], `Ministry vocabulary found:\n  ${hits.join('\n  ')}`);
});

test('the seeding scaffolding is gone', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'tools/seed-org-site.js')), 'seed script must be deleted');
  assert.ok(!fs.existsSync(path.join(ROOT, 'i18n/org-seed.json')), 'seed catalog must be deleted');
});

test('every org page carries the organization identity', () => {
  for (const f of pages()) {
    assert.ok(read(f).includes('Pan-African Enterprise Alliance'), `${f} missing org name`);
  }
});

test('the ministry site is untouched by org work', () => {
  const ministryIndex = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(ministryIndex.includes('Ministry of Labour'), 'ministry source must keep its own vocabulary');
});
