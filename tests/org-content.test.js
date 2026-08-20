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
    const haystack = html.toLowerCase();
    for (const term of MINISTRY_TERMS) {
      // Case-insensitive: sentence-case residues such as "Regional coverage"
      // must fail just as loudly as the Title Case form.
      if (haystack.includes(term.toLowerCase())) hits.push(`${f}: "${term}"`);
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

const ETHIOPIA_CITIES = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Adama'];
const SECONDARY_CITIES = ['Nairobi', 'Accra', 'Kigali', 'Lagos'];
const EG_PROPER_NOUNS = [
  'Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Luba', 'Annobón',
  'Bioko', 'Kié-Ntem', 'Wele-Nzas', 'María Esono', 'Pedro Nsue',
  'GETESA', 'Sonagas', 'Gepetrol', 'FCFA', 'XAF'
];

test('no Equatorial Guinea demo data survives', () => {
  const hits = [];
  for (const f of pages()) {
    const html = read(f);
    for (const n of EG_PROPER_NOUNS) if (html.includes(n)) hits.push(`${f}: "${n}"`);
  }
  assert.deepStrictEqual(hits, [], `Equatorial Guinea data found:\n  ${hits.join('\n  ')}`);
});

test('Ethiopia anchors the dataset at roughly 70 percent', () => {
  const all = pages().map(read).join('\n');
  const eth = ETHIOPIA_CITIES.reduce((n, c) => n + (all.split(c).length - 1), 0);
  const sec = SECONDARY_CITIES.reduce((n, c) => n + (all.split(c).length - 1), 0);
  assert.ok(eth > 0 && sec > 0, `need both anchor and secondary markets (eth=${eth}, sec=${sec})`);
  const share = eth / (eth + sec);
  assert.ok(share >= 0.6 && share <= 0.85, `Ethiopia share ${(share * 100).toFixed(0)}% outside 60-85%`);
});

test('member countries page lists the secondary markets', () => {
  const html = read('supported-countries.html');
  for (const c of ['Ethiopia', 'Kenya', 'Ghana', 'Rwanda', 'Nigeria']) {
    assert.ok(html.includes(c), `Member Countries missing ${c}`);
  }
});

test('the org do-not-translate list exists and excludes Equatorial Guinea nouns', () => {
  const p = path.join(ROOT, 'pan-african-org/i18n/do-not-translate.json');
  assert.ok(fs.existsSync(p), 'org DNT list must exist');
  const dnt = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(Array.isArray(dnt) && dnt.length > 0);
  assert.ok(dnt.includes('Addis Ababa'), 'anchor city must be protected');
  assert.ok(dnt.includes('Pan-African Enterprise Alliance'), 'org name must be protected');
  for (const n of ['Malabo', 'GETESA', 'FCFA']) {
    assert.ok(!dnt.includes(n), `${n} belongs to the ministry list, not this one`);
  }
});

test('seeker home renders the seeker shell', () => {
  const html = read('seeker-home.html');
  for (const item of ['Home', 'Inbox', 'My Career', 'Jobs', 'Entities']) {
    assert.ok(html.includes(`>${item}<`), `seeker nav missing "${item}"`);
  }
  assert.ok(html.includes('WhatsApp Support'), 'missing support link');
  assert.ok(html.includes('Settings'), 'missing settings link');
});

test('seeker home renders a job feed with apply affordances', () => {
  const html = read('seeker-home.html');
  const cards = html.match(/class="[^"]*job-card[^"]*"/g) || [];
  assert.ok(cards.length >= 4, `expected at least 4 job cards, got ${cards.length}`);
  assert.ok(html.includes('CLOSES IN'), 'missing closing-date affordance');
  assert.ok(html.includes('Apply'), 'missing Apply action');
  assert.ok(html.includes('Share'), 'missing Share action');
});

test('seeker home renders both quick-action panels', () => {
  const html = read('seeker-home.html');
  for (const label of [
    'My Career Profile', 'PDF Resume Builder', 'Web Resume Builder',
    'My Job Applications', 'Post Job', 'Manage Users', 'Entity Dashboard'
  ]) {
    assert.ok(html.includes(label), `quick actions missing "${label}"`);
  }
});

test('no raw i18n key leaks on the seeker page', () => {
  const html = read('seeker-home.html');
  const body = html.slice(html.indexOf('<body'));
  const leaks = body.match(/>[A-Z][A-Z0-9_]*\.[A-Z0-9_.]+</g) || [];
  assert.deepStrictEqual(leaks, [], `raw i18n keys visible: ${leaks.join(', ')}`);
  assert.ok(!/myCareer\.recent/i.test(body), 'the live demo key leak must not be reproduced');
});

test('seeker home carries the language toggle', () => {
  const html = read('seeker-home.html');
  assert.ok(html.includes('hreflang="fr"'), 'missing FR toggle link');
  assert.ok(html.includes('hreflang="es"'), 'missing ES toggle link');
});
