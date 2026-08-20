# Pan-African Organization Site and Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 13-page pan-African organization demo site in EN/FR/ES plus a 60-second tutorial video in the same three locales, forked from the ministry prototype, with Ethiopia-anchored multi-country demo data.

**Architecture:** `pan-african-org/en/` is its own source of truth — not a generated variant of the ministry pages. The existing build tooling is reused unchanged wherever possible and parameterised by site where not. The ministry site, its videos and its URLs are untouched, and a byte-equality assertion proves it. The substitution engine is used **once** as a throwaway seeding tool to bulk-rename ministry vocabulary, then that scaffolding is deleted.

**Tech Stack:** Node 20+ (`node:test`, no new runtime deps), existing `tools/build-i18n.js` / `check-i18n.js` / `validate-catalogs.js` / `extract-i18n.js` / `build-video-i18n.js` / `lib/translate-subtitles.js` / `attach-poster.js`, HyperFrames CLI, Playwright, GSAP (CDN), ffmpeg.

## Global Constraints

- **Organization name: `Pan-African Enterprise Alliance` (short form `PAEA`).** ⚠ **Must be confirmed against real organizations before Task 4** — several plausible names in this space belong to real bodies headquartered in Addis Ababa. The name appears in exactly two places (`common.*.json` and `do-not-translate.json`), so changing it late is a two-line edit. Do not ship externally without the check.
- **Ministry site is frozen.** No file at the repo root, in `/fr`, `/es`, or `tutorial-video{,-fr,-es}/` may change. Task 1 asserts this by byte-equality and it must stay true through every later task.
- English source of truth: `pan-african-org/en/`. `pan-african-org/{fr,es}/` and `pan-african-org/video-{fr,es}/` are **generated — never hand-edited**.
- Locales: `en`, `fr`, `es`. The list stays a config array so a fourth is catalogs plus one entry.
- Formal register throughout: FR `vous`, ES `usted`. Never `tu` / `tú`.
- **Punctuation differs by locale:** French takes a non-breaking space before `:` `?` `!` `;`. Spanish takes none.
- Demo data: **~70% Ethiopia / ~30% secondary markets** (Kenya, Ghana, Rwanda, Nigeria). Geographic consistency is mandatory — a Kigali company may not sit under an Ethiopian region, and totals must agree across pages.
- **Generated files must open with `<!DOCTYPE html>`.** The generated-file banner goes *after* it. A comment first makes the HyperFrames loader treat the file as a fragment, drop `<meta charset="UTF-8">`, decode as Latin-1 and corrupt every accented character. Already fixed in `withGeneratedHeader`; do not reintroduce.
- Video: 1920×1080, 60.0s, intro 5s + five 10s beats + outro 5s. Preserve `data-start`, `data-duration`, `data-track-index`, `data-composition-id`, `data-hf-id` exactly.
- Do not reproduce two defects observed on the live demo: the table header misspelling **"SPONORED STATUS"** (must read "Sponsored Status"), and leaked i18n keys `MYCAREER.RECENTCONVERSATIONS` / `myCareer.recentConversationsEmpty`.

---

## What Already Exists (verified 2026-08-20)

Do not rebuild any of this.

| Capability | State |
|---|---|
| `buildAll({srcDir, outDir, i18nDir, locales, pages})` | Fully parameterised. **Needs no change** — only its CLI entry hardcodes root. |
| `translateHtml(html, {pageCatalog, commonCatalog, locale, pageName, doNotTranslateSet, rewriteToggle, headerComment})` | Working. `rewriteToggle` and `headerComment` options already exist. |
| `check-i18n.js` CLI | **Already accepts** `--src`, `--gen`, `--i18n`, `--pages`, `--locales`, `--silent`. Needs only a `--site` convenience wrapper. |
| `validate-catalogs.js` CLI | **Already accepts a directory argument.** `node tools/validate-catalogs.js pan-african-org/i18n` works today. No change needed. |
| `build-video-i18n.js` | `buildVideoLocale({srcDir, outDir, i18nDir, locale})` + `withGeneratedHeader` + `LOCALE_STYLE_OVERRIDES`. Parameterised; needs a `--src`/`--out` CLI addition only. |
| `lib/translate-subtitles.js` | Handles single- and double-quoted `textContent:` literals. No change. |
| `attach-poster.js` | `attachPoster(projectDir, at)`. No change. |
| Test suite | 164 node tests + 8 Playwright specs, all passing. |

**The only real code gaps:** `englishDir` support in toggle rewriting (Task 1) and `--site` on two CLI entries (Task 2).

---

## File Structure

**Create:**

| Path | Responsibility |
|---|---|
| `pan-african-org/en/*.html` | 13 English pages — source of truth |
| `pan-african-org/i18n/` | Own catalogs, `glossary.md`, `do-not-translate.json` |
| `pan-african-org/fr/`, `es/` | Generated site trees |
| `pan-african-org/video-en/` | Video source: `index.html`, `compositions/`, `assets/` |
| `pan-african-org/video-fr/`, `video-es/` | Generated video projects |
| `tools/seed-org-site.js` | **Throwaway.** Bulk-renames ministry vocabulary. Deleted in Task 4. |
| `i18n/org-seed.json` | **Throwaway.** Seed catalog. Deleted in Task 4. |
| `tests/site-config.test.js` | Multi-site tooling tests |
| `tests/org-content.test.js` | Content invariants: no ministry terms, data consistency |
| `tests/org-layout.spec.js` | Playwright layout checks for the 13 org pages |
| `tests/org-video.test.js` | Org video build tests |
| `tests/video-layout-org-{fr,es}.spec.js` | Org video layout specs |

**Modify:**

| Path | Change |
|---|---|
| `tools/build-i18n.js` | `englishDir` threaded through `rewriteToggleLinks` → `rewriteLanguageToggle` → `translateHtml` → `buildAll`; `--site` on CLI |
| `tools/extract-i18n.js` | `--site` on CLI |
| `tools/check-i18n.js` | `--site` convenience that sets `--src/--gen/--i18n` |
| `tools/build-video-i18n.js` | `--src` / `--out` / `--i18n` on CLI |
| `package.json` | `org:*` scripts |

**Do NOT modify:** anything at the repo root, in `/fr`, `/es`, or `tutorial-video{,-fr,-es}/`.

---

### Task 1: `englishDir` support in toggle rewriting

**Files:**
- Modify: `tools/build-i18n.js`
- Test: `tests/site-config.test.js`

**Interfaces:**
- Produces: `rewriteToggleLinks(toggleInnerHtml, locale, pageName, englishDir = null)`. When `englishDir` is a string (e.g. `'en'`), English is a sibling directory rather than the site root. Threaded as `options.englishDir` through `rewriteLanguageToggle`, `translateHtml` and `buildAll`.

The ministry site keeps English at the site root, so `fr/entities.html` links back with `../entities.html`. The org site puts English in `en/`, making all three locales siblings — every cross-link becomes `../<locale>/<page>`.

- [ ] **Step 1: Write the failing test**

Create `tests/site-config.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-config.test.js`
Expected: FAIL — the `englishDir` tests report `../entities.html`, not `../en/entities.html` (the fourth argument is currently ignored).

- [ ] **Step 3: Write minimal implementation**

In `tools/build-i18n.js`, replace the `rewriteToggleLinks` signature and href block:

```js
function rewriteToggleLinks(toggleInnerHtml, locale, pageName, englishDir = null) {
  let enHref, frHref, esHref;
  let enActive = false, frActive = false, esActive = false;

  // englishDir set => English lives in its own sibling directory (e.g. `en/`),
  // so every cross-locale link is `../<locale>/<page>`. Unset => English is the
  // site root, which is how the ministry site is laid out.
  const enPrefix = englishDir ? `../${englishDir}/` : '../';

  if (locale === 'fr') {
    enHref = `${enPrefix}${pageName}`;
    frHref = `${pageName}`;
    esHref = `../es/${pageName}`;
    frActive = true;
  } else if (locale === 'es') {
    enHref = `${enPrefix}${pageName}`;
    frHref = `../fr/${pageName}`;
    esHref = `${pageName}`;
    esActive = true;
  } else {
    // English: siblings sit one level up when English has its own directory.
    const sibPrefix = englishDir ? '../' : '';
    enHref = `${pageName}`;
    frHref = `${sibPrefix}fr/${pageName}`;
    esHref = `${sibPrefix}es/${pageName}`;
    enActive = true;
  }
```

Leave the three `result.replace(...)` blocks and the `return result;` exactly as they are.

- [ ] **Step 4: Thread the option through the three callers**

In `rewriteLanguageToggle`, pass it on (around line 223):

```js
    const rewrittenInner = rewriteToggleLinks(innerContent, locale, pageName, englishDir);
```

Add `englishDir` to that function's parameters, defaulting to `null`, and pass `options.englishDir` from `translateHtml` where it calls `rewriteLanguageToggle`. In `buildAll`, read it once and forward it:

```js
  const englishDir = options.englishDir || null;
```

then include `englishDir` in the options object passed to `translateHtml`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/site-config.test.js`
Expected: PASS (5 tests)

- [ ] **Step 6: Prove the ministry site is byte-identical**

Run:
```bash
npm test && npm run i18n:build && git status --porcelain fr/ es/
```
Expected: all tests pass, and `git status` prints **nothing**. If any ministry file changed, the default-argument path regressed — fix before continuing.

- [ ] **Step 7: Commit**

```bash
git add tools/build-i18n.js tests/site-config.test.js
git commit -m "feat(i18n): support an explicit English directory in the language toggle"
```

---

### Task 2: `--site` on the CLI entries

**Files:**
- Modify: `tools/build-i18n.js`, `tools/extract-i18n.js`, `tools/check-i18n.js`, `tools/build-video-i18n.js`, `package.json`
- Test: `tests/site-config.test.js`

**Interfaces:**
- Produces: `resolveSite(args)` exported from `tools/build-i18n.js`, returning `{srcDir, outDir, i18nDir, englishDir}`. `--site <dir>` uses `<dir>/en` as source when that directory exists, else `<dir>` itself. With no `--site`, returns repo-root defaults with `englishDir: null` — ministry behaviour unchanged.

- [ ] **Step 1: Write the failing test**

Append to `tests/site-config.test.js`:

```js
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
```

> The `pan-african-org/en` directory does not exist yet, so Step 3 must decide on `fs.existsSync` at call time. Task 3 creates it; this test asserts the *branch*, and passes either way only if the implementation checks the filesystem. To make it deterministic now, Step 3 creates the directory as part of this task.

- [ ] **Step 2: Create the site directory so the branch is exercised**

```bash
mkdir -p pan-african-org/en pan-african-org/i18n
touch pan-african-org/en/.gitkeep pan-african-org/i18n/.gitkeep
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/site-config.test.js`
Expected: FAIL — `resolveSite is not a function`.

- [ ] **Step 4: Write minimal implementation**

In `tools/build-i18n.js`, above the CLI runner:

```js
/**
 * Resolves site paths from CLI args.
 *
 * `--site <dir>` points the build at a nested site. If `<dir>/en` exists it is
 * the English source and locales are siblings inside `<dir>`; otherwise `<dir>`
 * itself is the source and locales nest under it (the ministry layout).
 * With no `--site`, everything resolves to the repo root exactly as before.
 *
 * @param {string[]} args
 * @param {string} [cwd]
 * @returns {{srcDir: string, outDir: string, i18nDir: string, englishDir: string|null}}
 */
function resolveSite(args, cwd = process.cwd()) {
  const i = args.indexOf('--site');
  if (i === -1 || !args[i + 1]) {
    return { srcDir: cwd, outDir: cwd, i18nDir: path.join(cwd, 'i18n'), englishDir: null };
  }
  const siteDir = path.resolve(cwd, args[i + 1]);
  const enDir = path.join(siteDir, 'en');
  const hasEn = fs.existsSync(enDir);
  return {
    srcDir: hasEn ? enDir : siteDir,
    outDir: siteDir,
    i18nDir: path.join(siteDir, 'i18n'),
    englishDir: hasEn ? 'en' : null
  };
}
```

Replace the CLI runner body:

```js
if (require.main === module) {
  const args = process.argv.slice(2);
  const { srcDir, outDir, i18nDir, englishDir } = resolveSite(args);
  const locales = ['fr', 'es'];
  const pages = fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort();

  console.log(`Compiling i18n trees for ${path.relative(process.cwd(), outDir) || '.'} ...`);
  const result = buildAll({ srcDir, outDir, i18nDir, locales, pages, englishDir });
  console.log(`✓ Generated ${result.generatedFiles.length} pages across [${locales.join(', ')}].`);
}
```

Add `resolveSite` to `module.exports`.

> **Page discovery changed** from the hardcoded `DEFAULT_PROTOTYPE_PAGES` to reading `*.html` from `srcDir`. For the ministry root that yields the same 11 files. Step 6 proves it.

- [ ] **Step 5: Add `--site` to the other three CLIs**

`tools/extract-i18n.js` — replace `const rootDir = process.cwd();` and the `i18nDir` line in the CLI block with:

```js
  const { resolveSite } = require('./build-i18n.js');
  const { srcDir: rootDir, i18nDir } = resolveSite(process.argv.slice(2));
```

and change the page loop to read `*.html` from `rootDir`:

```js
  const pageList = fs.readdirSync(rootDir).filter((f) => f.endsWith('.html')).sort();
  for (const pageName of pageList) {
```

`tools/check-i18n.js` — inside the existing arg loop, add one branch before the others:

```js
    if (args[i] === '--site' && args[i + 1]) {
      const { resolveSite } = require('./build-i18n.js');
      const s = resolveSite(['--site', args[++i]]);
      srcDir = s.srcDir;
      genDir = s.outDir;
      i18nDir = s.i18nDir;
      pages = fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort();
    } else if (args[i] === '--src' && args[i + 1]) {
```

`tools/build-video-i18n.js` — replace the CLI block's fixed paths:

```js
  const args = process.argv.slice(2);
  const locale = args.find((a) => !a.startsWith('--'));
  const flag = (name, fallback) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
  };
  const root = process.cwd();
  const srcDir = flag('--src', path.join(root, 'tutorial-video'));
  const outBase = flag('--out', root);
  const i18nDir = flag('--i18n', path.join(root, 'i18n'));
  const outDir = path.join(outBase, `${path.basename(srcDir).replace(/-en$/, '')}-${locale}`);
  const result = buildVideoLocale({ srcDir, outDir, i18nDir, locale });
```

- [ ] **Step 6: Run the full suite and prove ministry output is unchanged**

Run:
```bash
npm test && npm run i18n:build && npm run i18n:check && \
npm run video:build:fr && npm run video:build:es && \
git status --porcelain fr/ es/ tutorial-video-fr/ tutorial-video-es/
```
Expected: all pass, and `git status` prints **nothing**.

- [ ] **Step 7: Add npm scripts**

Add to `package.json` `scripts`:

```json
"org:build": "node tools/build-i18n.js --site pan-african-org",
"org:check": "node tools/check-i18n.js --site pan-african-org",
"org:extract": "node tools/extract-i18n.js --site pan-african-org",
"org:validate": "node tools/validate-catalogs.js pan-african-org/i18n",
"org:video:build:fr": "node tools/build-video-i18n.js fr --src pan-african-org/video-en --out pan-african-org --i18n pan-african-org/i18n",
"org:video:build:es": "node tools/build-video-i18n.js es --src pan-african-org/video-en --out pan-african-org --i18n pan-african-org/i18n"
```

- [ ] **Step 8: Commit**

```bash
git add tools/ package.json tests/site-config.test.js pan-african-org/
git commit -m "feat(i18n): add --site flag for multi-site builds"
```

---

### Task 3: Seed the English org pages

**Files:**
- Create: `tools/seed-org-site.js` *(throwaway — deleted in Task 4)*
- Create: `i18n/org-seed.json` *(throwaway — deleted in Task 4)*
- Create: `pan-african-org/en/*.html` (11 pages)

**Interfaces:**
- Consumes: `translateHtml`, `loadDoNotTranslate` from `tools/build-i18n.js`.
- Produces: 11 English pages in `pan-african-org/en/`, committed as real source.

> ⚠ **Confirm the organization name before Task 4.** This task can proceed with the working name; Task 4 is where it becomes load-bearing.

- [ ] **Step 1: Write the seed catalog**

Create `i18n/org-seed.json`:

```json
{
  "Ministry of Labour": "Pan-African Enterprise Alliance",
  "Labour Market Portal": "Community Talent Portal",
  "Ministry Administrator": "Programme Administrator",
  "Ministry Users": "Organization Team",
  "Registered Employers": "Member Companies",
  "Registered employers": "Member companies",
  "Employer status": "Membership status",
  "Regional Coverage": "Member Countries",
  "Supported Countries": "Member Countries",
  "Labour Market Reports": "Community Impact Reports",
  "Dashboard": "Network Dashboard",
  "National overview of registered private-sector employment in Equatorial Guinea": "Network-wide overview of employment across Pan-African Enterprise Alliance member companies",
  "Register employer": "Add member company",
  "Ministry": "Alliance"
}
```

- [ ] **Step 2: Write the seeding script**

Create `tools/seed-org-site.js`:

```js
#!/usr/bin/env node
'use strict';

/**
 * THROWAWAY. Bulk-renames ministry vocabulary to produce a first draft of the
 * organization site's English pages. Its output is committed as real source and
 * this script plus i18n/org-seed.json are deleted in Task 4.
 *
 * Deliberately NOT infrastructure: the two sites diverge in geography, data and
 * narrative, so a permanent generation link between them would couple things
 * that should move independently.
 */

const fs = require('node:fs');
const path = require('node:path');
const { translateHtml, loadDoNotTranslate } = require('./build-i18n.js');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'pan-african-org', 'en');

const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'org-seed.json'), 'utf8'));
const dnt = loadDoNotTranslate(path.join(ROOT, 'i18n', 'do-not-translate.json'));

fs.mkdirSync(OUT, { recursive: true });

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
for (const page of pages) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const out = translateHtml(src, {
    pageCatalog: seed,
    locale: 'en',
    pageName: page,
    doNotTranslateSet: dnt,
    englishDir: 'en',
    headerComment: false
  });
  fs.writeFileSync(path.join(OUT, page), out, 'utf8');
  console.log(`  seeded ${page}`);
}
console.log(`✓ ${pages.length} pages seeded into pan-african-org/en/`);
```

- [ ] **Step 3: Run the seed**

```bash
rm -f pan-african-org/en/.gitkeep
node tools/seed-org-site.js
```
Expected: `✓ 11 pages seeded into pan-african-org/en/`

- [ ] **Step 4: Verify the toggle hrefs are sibling-relative**

Run:
```bash
grep -o 'hreflang="[a-z]*" href="[^"]*"' pan-african-org/en/index.html
```
Expected: `href="index.html"`, `href="../fr/index.html"`, `href="../es/index.html"`.

- [ ] **Step 5: Commit the seeded draft**

```bash
git add pan-african-org/en tools/seed-org-site.js i18n/org-seed.json
git commit -m "chore(org): seed English org pages from ministry source"
```

---

### Task 4: Complete the vocabulary pass and remove the seed

**Files:**
- Modify: `pan-african-org/en/*.html`
- Delete: `tools/seed-org-site.js`, `i18n/org-seed.json`
- Test: `tests/org-content.test.js`

**Interfaces:**
- Produces: `pan-african-org/en/` as a standalone source with no ministry vocabulary and no dependency on the seed.

> ⚠ **The organization name must be confirmed before this task.** After it, the name appears across 11 pages.

- [ ] **Step 1: Write the failing test**

Create `tests/org-content.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/org-content.test.js`
Expected: FAIL — the seed left `Equatorial Guinea` and several ministry phrases behind, and the seed files still exist.

- [ ] **Step 3: Complete the vocabulary by hand**

Work page by page through `pan-african-org/en/`. The seed handled the high-frequency terms; the remainder are phrases the catalog could not match because they are embedded in longer sentences. Use the test failure output as the worklist — it names the file and exact term. For each hit, rewrite the surrounding sentence so it reads naturally for a membership organization rather than substituting word-for-word.

Reference mapping (from the spec):

| Ministry | Organization |
|---|---|
| Ministry of Labour | Pan-African Enterprise Alliance |
| Labour Market Portal | Community Talent Portal |
| Ministry Administrator | Programme Administrator |
| Ministry Users | Organization Team |
| Registered Employers | Member Companies |
| Employer status | Membership status |
| Regional Coverage | Member Countries |
| Labour Market Reports | Community Impact Reports |
| National overview of… | Network-wide overview of… |

- [ ] **Step 4: Delete the seeding scaffolding**

```bash
git rm tools/seed-org-site.js i18n/org-seed.json
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/org-content.test.js`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add pan-african-org/en tests/org-content.test.js
git commit -m "feat(org): complete organization vocabulary and drop the seed scaffolding"
```

---

### Task 5: Ethiopia-anchored multi-country dataset

**Files:**
- Modify: `pan-african-org/en/*.html`
- Test: `tests/org-content.test.js`

**Interfaces:**
- Produces: a geographically consistent demo dataset across all pages, and `pan-african-org/i18n/do-not-translate.json` listing every proper noun it introduces.

- [ ] **Step 1: Write the failing test**

Append to `tests/org-content.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/org-content.test.js`
Expected: FAIL — Equatorial Guinea nouns still present, no Ethiopian cities, no org DNT file.

- [ ] **Step 3: Write the org do-not-translate list**

Create `pan-african-org/i18n/do-not-translate.json`:

```json
[
  "Pan-African Enterprise Alliance",
  "PAEA",
  "Addis Ababa", "Dire Dawa", "Hawassa", "Bahir Dar", "Mekelle", "Adama", "Jimma",
  "Oromia", "Amhara", "Tigray", "Sidama", "Somali", "Afar",
  "Nairobi", "Accra", "Kigali", "Lagos",
  "Ethiopia", "Kenya", "Ghana", "Rwanda", "Nigeria",
  "ETB", "KES", "GHS", "RWF", "NGN",
  "Selamawit Bekele", "Dawit Haile", "Tigist Alemu",
  "Abebe Tesfaye", "Hanna Girma", "Yonas Mekonnen",
  "Wanjiru Kamau", "Kwame Mensah",
  "iCUBEFARM", "Hyperframes", "Geist", "Geist Sans", "Phosphor",
  "EN", "FR", "ES", "CSV", "PDF", "JSON", "API", "UI", "URL"
]
```

> Company names are added here as Task 5 introduces them. Every invented company name must be checked against real trading names in its market before it goes in.

- [ ] **Step 4: Replace the dataset page by page**

Work through all 11 pages, replacing Equatorial Guinea data with the Ethiopia-anchored set. Use the test failure output as the worklist.

Substitution guide:

| Dimension | Replace with |
|---|---|
| Cities | Addis Ababa, Dire Dawa, Hawassa, Bahir Dar, Mekelle, Adama (~70%); Nairobi, Accra, Kigali, Lagos (~30%) |
| Regions | Oromia, Amhara, Tigray, Sidama, Somali, Afar |
| Sectors | Manufacturing & textiles, Agriculture & agro-processing, Construction, ICT & business services, Logistics & transport, Tourism & hospitality, Leather & footwear |
| Currency | ETB for Ethiopian rows; prefer unit-free figures where the page allows |
| People | Selamawit Bekele, Dawit Haile, Tigist Alemu, Abebe Tesfaye, Hanna Girma, Yonas Mekonnen, Wanjiru Kamau, Kwame Mensah |

**Consistency rules — the largest source of "this demo feels fake":**
- A company's city must belong to its country, and its region must belong to that country.
- Member-company totals must agree between `index.html` and `entities.html`.
- Per-sector counts must sum to the sector total shown on the dashboard.
- A person's name should suit the market their row sits in.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/org-content.test.js`
Expected: PASS (8 tests)

- [ ] **Step 6: Manually verify cross-page totals**

Open `pan-african-org/en/index.html` and `entities.html` side by side. Confirm the member-company count, the pending/verified split and the sector breakdown agree. The automated test cannot judge this — a human must.

- [ ] **Step 7: Commit**

```bash
git add pan-african-org tests/org-content.test.js
git commit -m "feat(org): replace demo data with Ethiopia-anchored multi-country dataset"
```

---

### Task 6: Job Seeker Home page

**Files:**
- Create: `pan-african-org/en/seeker-home.html`
- Test: `tests/org-content.test.js`

**Interfaces:**
- Consumes: the dataset conventions from Task 5.
- Produces: `seeker-home.html` — a page with a **different shell** from the admin console. Task 11 embeds its markup as video beat 04.

Modelled on `org-demo.icubefarm.com/en/home`, observed logged in on 2026-08-20.

- [ ] **Step 1: Write the failing test**

Append to `tests/org-content.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/org-content.test.js`
Expected: FAIL — `ENOENT ... seeker-home.html`.

- [ ] **Step 3: Build the page**

Create `pan-african-org/en/seeker-home.html`. Copy the `<head>` block (fonts, Phosphor icons, CSS custom properties) verbatim from `pan-african-org/en/index.html` so the design system matches, then build this structure:

- **Top bar:** brand (organization name), inbox icon with badge, notification icon with badge, avatar, **language toggle** — for this shell the toggle lives in the top bar, not the sidebar foot
- **Left nav:** Home *(active)*, Inbox `5`, My Career, Jobs, Entities · footer group: WhatsApp Support, Notifications `1`, Settings, user identity block
- **Centre column:** "Home" heading, a "Hide announcements" control, then **at least 4** job cards, each with `class="job-card"` and containing:
  - job title (h3)
  - `CLOSES IN 8 Days`
  - work mode + location — e.g. `Hybrid · Addis Ababa`
  - employer name (a member company from the Task 5 dataset)
  - optional Business Unit / Department chips
  - `Apply` (primary) and `Share` (secondary) buttons
  - a `JOB` tag
- **Right rail:** two panels — *Professional Quick Actions* (My Career Profile, PDF Resume Builder, Web Resume Builder, My Job Applications) and *Entity Quick Actions* (member company name, then Post Job, Manage Users, Entity Dashboard)

Use the Task 5 dataset for every employer name and location, keeping the ~70/30 Ethiopia split within the visible cards.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/org-content.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pan-african-org/en/seeker-home.html tests/org-content.test.js
git commit -m "feat(org): add job seeker home page"
```

---

### Task 7: Recruiter Job List page

**Files:**
- Create: `pan-african-org/en/recruiter-jobs.html`
- Test: `tests/org-content.test.js`

**Interfaces:**
- Produces: `recruiter-jobs.html`. Task 11 embeds its markup as video beat 03.

Modelled on the entity-admin job-list overview, observed logged in on 2026-08-20.

- [ ] **Step 1: Write the failing test**

Append to `tests/org-content.test.js`:

```js
test('recruiter page renders the entity-admin shell', () => {
  const html = read('recruiter-jobs.html');
  assert.ok(html.includes('Entity Admin'), 'missing entity-admin label');
  for (const item of ['Manage Entity', 'Users &amp; Roles', 'Jobs']) {
    assert.ok(html.includes(item), `recruiter nav missing "${item}"`);
  }
});

test('recruiter page renders status tabs with counts', () => {
  const html = read('recruiter-jobs.html');
  for (const tab of ['Overview', 'Active', 'Draft', 'Closed', 'Expired', 'Trash', 'All']) {
    assert.ok(html.includes(tab), `missing status tab "${tab}"`);
  }
  assert.ok(/\(\d+\)/.test(html), 'status tabs must carry counts');
});

test('recruiter page renders the four KPI tiles', () => {
  const html = read('recruiter-jobs.html');
  for (const kpi of [
    'Active Jobs', 'Applicants Awaiting Review',
    'Upcoming Pre-Screening Calls', 'Interview Responses Awaiting Review'
  ]) {
    assert.ok(html.toLowerCase().includes(kpi.toLowerCase()), `missing KPI "${kpi}"`);
  }
});

test('recruiter page renders both charts with recruitment stages', () => {
  const html = read('recruiter-jobs.html');
  assert.ok(html.includes('Job Applications') || html.includes('JOB APPLICATIONS'));
  assert.ok(html.includes('Applicants by Recruitment Stage') ||
            html.includes('APPLICANTS BY RECRUITMENT STAGES'));
  for (const stage of ['Applied', 'Interview', 'Offer', 'Rejected']) {
    assert.ok(html.includes(stage), `missing stage "${stage}"`);
  }
});

test('recruiter jobs table has the right columns and no misspelling', () => {
  const html = read('recruiter-jobs.html');
  for (const col of ['Title', 'Posted By', 'Posted On', 'Expires On',
                     'Sponsored Status', 'Applicants', 'Actions']) {
    assert.ok(html.includes(col), `jobs table missing column "${col}"`);
  }
  assert.ok(!/SPONORED/i.test(html), 'the live demo misspelling must not be reproduced');
});

test('recruiter page offers Post a Job', () => {
  assert.ok(read('recruiter-jobs.html').includes('Post a Job'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/org-content.test.js`
Expected: FAIL — `ENOENT ... recruiter-jobs.html`.

- [ ] **Step 3: Build the page**

Create `pan-african-org/en/recruiter-jobs.html`, reusing the same `<head>` block. Structure:

- **Left nav:** member-company name + `Entity Admin` subtitle · Home, Inbox, Manage Entity, Users & Roles, Jobs *(active)*
- **Header row:** "Overview" heading + **Post a Job** primary button
- **Status tabs with counts:** `Overview(6)`, `Active(4)`, `Draft(1)`, `Closed(1)`, `Expired(0)`, `Trash(0)`, `All(6)` — counts must sum consistently
- **Four KPI tiles:** Active Jobs, Applicants Awaiting Review, Upcoming Pre-Screening Calls, Interview Responses Awaiting Review — use non-zero values so the demo looks alive, unlike the live UAT entity
- **Two chart panels:**
  - *Job Applications* with range chips `24H / 7D / 30D / 90D / 365D` and a bar series
  - *Applicants by Recruitment Stage* with range chips `Today / This Week / This Month / This Year / All Time` and a legend of Applied / Interview / Offer / Rejected
  - Render bars as styled `div`s (the ministry pages already use this technique) — no charting library
- **Jobs table:** Title, Posted By, Posted On, Expires On, Sponsored Status, Applicants, Actions — at least 5 rows drawn from the Task 5 dataset
- **Language toggle** in the top bar, matching the seeker shell

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/org-content.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pan-african-org/en/recruiter-jobs.html tests/org-content.test.js
git commit -m "feat(org): add recruiter job list page"
```

---

### Task 8: French and Spanish catalogs

**Files:**
- Create: `pan-african-org/i18n/{common,index,entities,jobs-applications,users-management,skill-gap,general-report,activity-logs,tenant-branding,supported-countries,report-recipients,notification-preferences,seeker-home,recruiter-jobs}.{fr,es}.json`
- Create: `pan-african-org/i18n/glossary.md`

**Interfaces:**
- Consumes: `npm run org:extract` to generate skeletons.
- Produces: complete FR and ES catalogs consumed by Task 9.

- [ ] **Step 1: Generate the catalog skeletons**

Run: `npm run org:extract`
Expected: 26+ catalog files created under `pan-african-org/i18n/`, covering every translatable string across the 13 pages, with proper nouns from the org DNT list omitted.

- [ ] **Step 2: Write the glossary**

Create `pan-african-org/i18n/glossary.md`:

```markdown
# Pan-African Organization — i18n Glossary

## Audience & Register

Pan-African membership organizations — chambers of commerce, business councils,
industry federations. **Not a government body.** Avoid regulatory language
("compliance", "enforcement", "oversight") in favour of membership language
("member companies", "community", "programme").

- French: formal register (*vous* / *votre*). Non-breaking space before `:` `?` `!` `;`.
- Spanish: formal register (*usted* / *su*). **No** space before `:`.

## Core Terminology

| English | Spanish | French |
| :--- | :--- | :--- |
| Pan-African Enterprise Alliance | Alianza Panafricana de Empresas | Alliance Panafricaine des Entreprises |
| Community Talent Portal | Portal de Talento Comunitario | Portail de Talents Communautaire |
| Member Companies | Empresas Miembro | Entreprises Membres |
| Member Countries | Países Miembro | Pays Membres |
| Organization Team | Equipo de la Organización | Équipe de l'Organisation |
| Programme Administrator | Administrador de Programa | Administrateur de Programme |
| Community Impact Reports | Informes de Impacto Comunitario | Rapports d'Impact Communautaire |
| Network Dashboard | Panel de la Red | Tableau de Bord du Réseau |
| Membership status | Estado de membresía | Statut d'adhésion |
| Skill Gap Report | Informe de brecha de competencias | Rapport sur le déficit de compétences |
| Job Seeker | Candidato | Candidat |
| Recruiter | Reclutador | Recruteur |
| Apply | Postular | Postuler |
| Post a Job | Publicar empleo | Publier une offre |
| Applicants Awaiting Review | Candidatos pendientes de revisión | Candidats en attente d'examen |

**Shared with the ministry site:** where a term already exists in the root
`i18n/glossary.md` (statuses, generic UI verbs), reuse that rendering exactly so
the two demos do not contradict each other.

## Proper Nouns

Governed by `pan-african-org/i18n/do-not-translate.json`. Ethiopian and secondary-market
place names, person names, company names, currency codes and the organization
name itself never change across locales.
```

- [ ] **Step 3: Fill both catalogs**

Translate every key. Work page by page, most-demoed first: `index` → `entities` → `recruiter-jobs` → `seeker-home` → `skill-gap` → the rest. Reuse the root `i18n/glossary.md` renderings wherever a term is shared.

- [ ] **Step 4: Validate catalog structure**

Run: `npm run org:validate`
Expected: `✓ All N catalog(s) passed validation.` — no stale keys, no empty values, no placeholder mismatches.

- [ ] **Step 5: Commit**

```bash
git add pan-african-org/i18n
git commit -m "feat(org): add French and Spanish catalogs and glossary"
```

---

### Task 9: Generate the localised site and gate it

**Files:**
- Create: `pan-african-org/{fr,es}/*.html` (generated)
- Create: `tests/org-layout.spec.js`

**Interfaces:**
- Consumes: catalogs from Task 8, `--site` from Task 2.
- Produces: 39 pages total, gated at zero untranslated strings.

- [ ] **Step 1: Build the trees**

Run: `npm run org:build`
Expected: `✓ Generated 26 pages across [fr, es].`

- [ ] **Step 2: Run the coverage gate**

Run: `npm run org:check`
Expected: exit 0, no untranslated strings. Any failure names the file and string — fix the catalog, rebuild, re-run.

- [ ] **Step 3: Verify generated files open with the doctype**

Run:
```bash
head -1 pan-african-org/fr/index.html pan-african-org/es/index.html
```
Expected: `<!DOCTYPE html>` on both. If a banner comes first, the charset bug is back — accented characters will corrupt in the video build.

- [ ] **Step 4: Write the layout spec**

Create `tests/org-layout.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..', 'pan-african-org');
const PAGES = fs.readdirSync(path.join(ROOT, 'en')).filter((f) => f.endsWith('.html'));

for (const locale of ['en', 'fr', 'es']) {
  for (const page of PAGES) {
    test(`[${locale}] ${page} renders without overflow or console errors`, async ({ page: p }) => {
      const errors = [];
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

      await p.setViewportSize({ width: 1920, height: 1080 });
      await p.goto('file://' + path.join(ROOT, locale, page));
      await p.waitForTimeout(300);

      const overflow = await p.evaluate(() =>
        [...document.querySelectorAll('.sidebar, .topbar, .page-header, .nav-item')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => `${el.className}: ${el.scrollWidth}>${el.clientWidth}`)
      );

      expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
      expect(overflow, `overflowing: ${overflow.join(' | ')}`).toEqual([]);
    });
  }
}

test('language toggle preserves the current page across locales', async ({ page }) => {
  await page.goto('file://' + path.join(ROOT, 'fr', 'skill-gap.html'));
  const esHref = await page.getAttribute('a[hreflang="es"]', 'href');
  expect(esHref).toBe('../es/skill-gap.html');
  const enHref = await page.getAttribute('a[hreflang="en"]', 'href');
  expect(enHref).toBe('../en/skill-gap.html');
});

test('every internal link resolves on disk', async () => {
  const missing = [];
  for (const locale of ['en', 'fr', 'es']) {
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(ROOT, locale, page), 'utf8');
      for (const m of html.matchAll(/href="([^"]+\.html)"/g)) {
        const target = path.resolve(path.join(ROOT, locale), m[1]);
        if (!fs.existsSync(target)) missing.push(`${locale}/${page} -> ${m[1]}`);
      }
    }
  }
  expect(missing, `broken links: ${missing.join(', ')}`).toEqual([]);
});
```

- [ ] **Step 5: Run the layout spec**

Run: `npx playwright test tests/org-layout.spec.js --reporter=list`
Expected: PASS. French runs 15–25% longer than English — if a nav item or button overflows, shorten the copy in the catalog rather than changing layout geometry.

- [ ] **Step 6: Confirm the ministry site is still untouched**

Run: `git status --porcelain fr/ es/ index.html tutorial-video/`
Expected: **empty output.**

- [ ] **Step 7: Commit**

```bash
git add pan-african-org tests/org-layout.spec.js
git commit -m "feat(org): generate French and Spanish site trees"
```

---

### Task 10: Video project scaffold — host, intro, outro

**Files:**
- Create: `pan-african-org/video-en/index.html`
- Create: `pan-african-org/video-en/compositions/beat-00-intro.html`
- Create: `pan-african-org/video-en/compositions/beat-06-outro.html`
- Create: `pan-african-org/video-en/assets/` (copied)

**Interfaces:**
- Produces: the host composition with the same 60s timing contract as the ministry video, plus intro and outro artwork. Task 11 fills in beats 01–05.

- [ ] **Step 1: Copy the shell and assets**

```bash
mkdir -p pan-african-org/video-en/compositions
cp tutorial-video/index.html pan-african-org/video-en/index.html
cp tutorial-video/compositions/beat-00-intro.html pan-african-org/video-en/compositions/
cp tutorial-video/compositions/beat-06-outro.html pan-african-org/video-en/compositions/
cp -R tutorial-video/assets pan-african-org/video-en/assets
```

- [ ] **Step 2: Rewrite the intro cover copy**

In `pan-african-org/video-en/compositions/beat-00-intro.html`, change only the text nodes — leave every `data-*`, id, class, timing and GSAP tween untouched:

- `#ministry` → `Pan-African Enterprise Alliance`
- `.title-line` 1 → `Community Talent Portal`
- `.title-line` 2 → `Demo for Job Creation`
- `.headline-line` 1 and 2 → keep `Digital Workforce` / `Solutions` (the iCUBEFARM tagline is unchanged across all demos)

The two-line `.title` structure at 32px and the `.title-line { white-space: nowrap }` rule already exist — do not revert them to a single line.

- [ ] **Step 3: Rewrite the outro copy**

In `beat-06-outro.html`, change `To customize your Labor Market Information System (LMIS)` to `To customize your Community Talent Portal`. Leave the contact block, timing and animation untouched.

- [ ] **Step 4: Verify the intro title fits**

Run:
```bash
npx playwright test tests/video-layout-org-en.spec.js --reporter=list 2>/dev/null || \
node -e '
const {chromium}=require("playwright");const path=require("path");
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setViewportSize({width:1920,height:1080});
await p.goto("file://"+path.resolve("pan-african-org/video-en/compositions/beat-00-intro.html"));
await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{
  const tc=document.querySelector(".text-container");
  const pad=parseFloat(getComputedStyle(document.querySelector(".signature")).paddingLeft);
  const avail=tc.clientWidth-pad;
  return [...document.querySelectorAll(".title-line,.headline-line")].map(el=>{
    const r=document.createRange();r.selectNodeContents(el);
    return {t:el.textContent.trim(),w:Math.ceil(r.getBoundingClientRect().width),avail};
  });
});
r.forEach(x=>console.log(`${x.w<=x.avail?"OK  ":"OVER"} ${x.w}/${x.avail}  "${x.t}"`));
process.exit(r.every(x=>x.w<=x.avail)?0:1);
await b.close();})();
'
```
Expected: every line `OK`. If a line overflows, shorten the copy — do not change the container geometry.

- [ ] **Step 5: Commit**

```bash
git add pan-african-org/video-en
git commit -m "feat(org): scaffold video project with intro and outro"
```

---

### Task 11: The five screencast beats

**Files:**
- Create: `pan-african-org/video-en/compositions/beat-0{1..5}-*.html`
- Modify: `pan-african-org/video-en/index.html`

**Interfaces:**
- Consumes: page markup from `pan-african-org/en/`.
- Produces: five beat compositions wired into the host. Each embeds a **copy** of its page's markup plus a cursor and subtitle container.

| Beat | File | Embeds | Subtitles |
|---|---|---|---|
| 01 | `beat-01-dashboard.html` | `index.html` | Network-wide employment data |
| 02 | `beat-02-members.html` | `entities.html` | The member companies |
| 03 | `beat-03-recruiter.html` | `recruiter-jobs.html` | Free software for members |
| 04 | `beat-04-seeker.html` | `seeker-home.html` | Talent applies across the community |
| 05 | `beat-05-skill-gap.html` | `skill-gap.html` | Evidence for training decisions |

- [ ] **Step 1: Build each beat from its ministry counterpart**

For each beat, use `tutorial-video/compositions/beat-01-dashboard.html` as the structural template. Each file is:

1. The page's `<style>` block, copied from the corresponding `pan-african-org/en/` page
2. `<body>` containing `<div data-composition-id="beat-0N" data-width="1920" data-height="1080" data-duration="...">` wrapping a copy of that page's body markup
3. The `#cursor` SVG and `#subtitle-container` div, copied verbatim from the ministry beat
4. A GSAP timeline script driving cursor movement and subtitle changes

- [ ] **Step 2: Write the subtitles**

Two subtitles per beat, following the ministry pattern where a sentence continues across a cut with leading and trailing `...`:

```js
// beat-01
.set("#subtitle-container", { textContent: "See employment across every member company in real time..." })
.set("#subtitle-container", { textContent: "...without waiting for annual surveys." })

// beat-02
.set("#subtitle-container", { textContent: "Every company in your community, in one directory..." })
.set("#subtitle-container", { textContent: "...with membership status you control." })

// beat-03
.set("#subtitle-container", { textContent: "Member companies get recruitment software at no cost..." })
.set("#subtitle-container", { textContent: "...so hiring stops being a budget decision." })

// beat-04
.set("#subtitle-container", { textContent: "One profile reaches every employer in the community..." })
.set("#subtitle-container", { textContent: "...and every application feeds your data." })

// beat-05
.set("#subtitle-container", { textContent: "Turn that data into training and partnership decisions..." })
.set("#subtitle-container", { textContent: "...backed by evidence, not assumption." })
```

- [ ] **Step 3: Wire the beats into the host**

In `pan-african-org/video-en/index.html`, update the five clip `data-composition-src` paths to the new filenames. **Do not change** any `data-start`, `data-duration`, `data-track-index`, `data-width`, `data-height` or `z-index` value — the 60s contract must hold.

- [ ] **Step 4: Validate**

Run: `cd pan-african-org/video-en && npx hyperframes check`
Expected: no finding that is not also present in the ministry baseline. Compare against `cd tutorial-video && npx hyperframes check`.

- [ ] **Step 5: Snapshot every beat at its midpoint**

Run:
```bash
cd pan-african-org/video-en && npx hyperframes snapshot --at 2.5,10,20,30,40,50,57.5
```
Inspect all seven frames: correct page, cursor visible and moving, subtitle legible in the lower third, no clipped text.

- [ ] **Step 6: Commit**

```bash
git add pan-african-org/video-en
git commit -m "feat(org): add five screencast beats"
```

---

### Task 12: French and Spanish video builds

**Files:**
- Create: `pan-african-org/i18n/video.{fr,es}.json`
- Create: `tests/org-video.test.js`, `tests/video-layout-org-{fr,es}.spec.js`
- Create: `pan-african-org/video-{fr,es}/` (generated)

**Interfaces:**
- Consumes: `buildVideoLocale`, `translateSubtitles`, `--src`/`--out`/`--i18n` from Task 2.
- Produces: two generated video projects.

- [ ] **Step 1: Write the video copy catalogs**

Create `pan-african-org/i18n/video.fr.json` and `video.es.json` with all 10 subtitles plus the intro and outro strings:

Keys required — `Community Talent Portal`, `Demo for Job Creation`, `Digital Workforce`, `Solutions`, `Pan-African Enterprise Alliance`, `To customize your Community Talent Portal`, `Contact:`, `email:`, `Whatsapp:`, and the 10 subtitle strings from Task 11 verbatim.

Preserve leading and trailing `...` exactly. French takes a non-breaking space before `:`; Spanish does not.

- [ ] **Step 2: Write the failing test**

Create `tests/org-video.test.js`:

```js
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
  buildVideoLocale({ srcDir: SRC, outDir, i18nDir: I18N, locale });
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/org-video.test.js`
Expected: FAIL — no `video.fr.json` yet, or a subtitle key is missing.

- [ ] **Step 4: Build both locales**

Run: `npm run org:video:build:fr && npm run org:video:build:es`
Expected: `✓ ... 8 compositions, 3 assets copied.` for each.

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/org-video.test.js`
Expected: PASS (6 tests)

- [ ] **Step 6: Add layout specs for both locales**

Create `tests/video-layout-org-fr.spec.js` and `tests/video-layout-org-es.spec.js` by copying `tests/video-layout-fr.spec.js` and pointing the directory constant at `pan-african-org/video-fr` and `video-es` respectively.

Run: `npx playwright test tests/video-layout-org-fr.spec.js tests/video-layout-org-es.spec.js --reporter=list`
Expected: PASS. If the intro title overflows in a locale, shorten that locale's `video.*.json` copy first; only then add an entry to `LOCALE_STYLE_OVERRIDES` in `tools/build-video-i18n.js`.

- [ ] **Step 7: Snapshot and compare three-way**

```bash
for d in video-en video-fr video-es; do
  (cd pan-african-org/$d && npx hyperframes snapshot --at 3.0,10,30,57.5)
done
```
Confirm identical layout across locales, correct language, and **no mojibake** — check an accented frame in each of FR and ES.

- [ ] **Step 8: Commit**

```bash
git add pan-african-org tests/org-video.test.js tests/video-layout-org-*.spec.js
git commit -m "feat(org): generate French and Spanish video projects"
```

---

### Task 13: Render, poster, deliver

**Files:**
- Create: `pan-african-org/video-{en,fr,es}/renders/*.mp4` and `*.poster.jpg`
- Create: `pan-african-org/README.md`

**Interfaces:**
- Consumes: `attachPoster(projectDir, at)` from `tools/attach-poster.js`.

- [ ] **Step 1: Preview for approval**

Run: `cd pan-african-org/video-en && npx hyperframes preview`

Present to the user. **Do not render until approved.**

- [ ] **Step 2: Render all three**

```bash
for d in video-en video-fr video-es; do
  (cd pan-african-org/$d && npx hyperframes render)
done
```
Expected: three 60s 1920×1080 mp4s, roughly 30–45s each.

- [ ] **Step 3: Attach the intro cover as the thumbnail**

```bash
for d in video-en video-fr video-es; do
  node tools/attach-poster.js pan-african-org/$d
done
```

- [ ] **Step 4: Verify each output**

```bash
for d in video-en video-fr video-es; do
  mp4=$(ls -t pan-african-org/$d/renders/*.mp4 | head -1)
  printf "%-10s " "$d"
  ffprobe -v error -show_entries stream=codec_name -show_entries format=duration -of csv=p=0 "$mp4" | tr '\n' ' '
  printf "attached_pic="
  ffprobe -v error -select_streams v:1 -show_entries stream_disposition=attached_pic -of csv=p=0 "$mp4"
done
```
Expected per file: `h264 aac mjpeg`, `duration=60.000000`, `attached_pic=1`.

- [ ] **Step 5: Watch each end to end**

Confirm: audio level matches across locales, intro and outro timing identical, all five screencasts in the right language, subtitles readable within their durations, no flash of English at any cut, no mojibake anywhere.

- [ ] **Step 6: Write the site README**

Create `pan-african-org/README.md`:

```markdown
# Pan-African Organization Demo

Prototype for pan-African membership organizations — chambers of commerce,
business councils, industry federations.

## Layout

    en/          source of truth (13 pages) — edit here
    fr/ es/      GENERATED — do not hand-edit
    i18n/        catalogs, glossary.md, do-not-translate.json
    video-en/    video source of truth
    video-fr/ video-es/   GENERATED

## Commands

    npm run org:build          regenerate fr/ and es/
    npm run org:check          fail on any untranslated string
    npm run org:validate       validate catalog structure
    npm run org:extract        refresh catalog skeletons after English edits
    npm run org:video:build:fr regenerate the French video project
    npm run org:video:build:es regenerate the Spanish video project

To change copy, edit `en/` for English or the relevant `i18n/*.{fr,es}.json`
for a translation, then rebuild. Edits made directly in `fr/`, `es/` or
`video-fr/`, `video-es/` are discarded on the next build.

## Related

This site is a **fork** of the ministry prototype at the repo root, not a
generated variant of it. The two share tooling in `tools/` but have independent
English sources, catalogs and demo data. A change to one does not affect the other.
```

- [ ] **Step 7: Commit**

```bash
git add pan-african-org
git commit -m "feat(org): render pan-African tutorial videos in three locales"
```

---

## Self-Review

**Spec coverage.** R1 → Tasks 1–2. R2 → Tasks 3–4. R3 → Task 5. R4 → Tasks 6–7. R5 → Tasks 8–9. R6 → Task 9 (toggle and link-resolution tests). R7 → Tasks 10–13. The P1 items are deliberately unscheduled: R8 (job detail, post-a-job) and R9 (screenshot capture) are fast-follows, R10 (npm scripts) is folded into Task 2 where it is needed, and R11 (upstream defect report) is a message, not code — Tasks 6 and 7 assert we do not reproduce the two defects.

**Ministry-freeze coverage.** Asserted three times: Task 1 Step 6, Task 2 Step 6, and Task 9 Step 6. Task 4 also asserts the ministry English source keeps its own vocabulary, catching an accidental in-place edit.

**Placeholder scan.** No TBDs. Every code step carries runnable code. The content tasks (4, 5, 6, 7, 8) are verification-driven rather than code-driven — their tests name the exact failing file and string, so the failure output *is* the worklist. That is deliberate: hand-authoring 13 pages of demo copy cannot be reduced to a code block, but the invariants it must satisfy can.

**Type consistency.** `rewriteToggleLinks(html, locale, pageName, englishDir)` is defined in Task 1 and consumed by name in Task 2. `resolveSite(args, cwd) => {srcDir, outDir, i18nDir, englishDir}` is defined in Task 2 and consumed in the `extract-i18n.js` and `check-i18n.js` edits in that same task. `buildVideoLocale({srcDir, outDir, i18nDir, locale})` and `attachPoster(projectDir, at)` match the shipped signatures verified on 2026-08-20.

**Known risks carried deliberately.**
1. **The organization name is unconfirmed.** Tasks 3 and 4 both flag it; after Task 4 it is spread across 11 pages. If the name check fails late, the fix is a find-and-replace plus two catalog entries — annoying, not structural.
2. **Task 2 changes page discovery** from `DEFAULT_PROTOTYPE_PAGES` to reading `*.html` from the source directory. For the ministry root these are the same 11 files, and Step 6 proves it — but this is the single most likely place shared tooling regresses.
3. **Task 5 has a manual verification step** (cross-page totals) that no test can replace. Skipping it is how a demo ends up with 386 member companies on one page and 412 on the next.
