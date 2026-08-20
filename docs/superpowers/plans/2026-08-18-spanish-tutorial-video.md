# Spanish Tutorial Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `tutorial-video-es/` — a Spanish rendering of the 60-second tutorial video, identical to the English original in layout, timing, motion, and assets, differing only in language.

**Architecture:** The generator built for French (`tools/build-video-i18n.js` + `tools/lib/translate-subtitles.js`) is already locale-parametrised and covered by 19 passing tests. A coverage probe run 2026-08-18 confirms **the existing `i18n/*.es.json` catalogs cover 100% of the embedded portal markup in all five screencast beats — zero gaps, identical to the French result.** So this plan writes one new 19-key catalog, removes the single French hardcode left in the driver, and re-runs the proven pipeline. Most of the work is translation quality and layout measurement, not code.

**Tech Stack:** Node 20+ (`node:test`), existing `tools/build-video-i18n.js` / `tools/lib/translate-subtitles.js` / `tools/build-i18n.js`, HyperFrames CLI, Playwright, GSAP (CDN, unchanged).

## Global Constraints

- **Identity rule:** `tutorial-video-es/` differs from `tutorial-video/` in **language only**. `data-start`, `data-duration`, `data-track-index`, `data-width`, `data-height`, `data-composition-id`, `data-hf-id`, cursor coordinates, easing, and asset bytes are preserved exactly.
- **Do not modify `tutorial-video/`** (English source of truth) or `tutorial-video-fr/` (already delivered).
- **French output must not regress.** Task 2 refactors a code path French depends on; a byte-equality test guards it.
- Render target: **1920×1080, 60s**, root `data-duration="60"`.
- Composition IDs stay `main`, `beat-00`…`beat-06`.
- **Spanish is the primary official and administrative language of Equatorial Guinea** (`i18n/glossary.md`). This is the highest-stakes locale of the three — treat translation quality accordingly.
- Formal register (*usted* / *su* / *le*) throughout. Avoid gendering the viewer (`Le damos la bienvenida`, not `Bienvenido`).
- **No space before `:` in Spanish** — unlike French. `Contacto:` not `Contacto :`.
- Terminology comes from `i18n/common.es.json` and `i18n/glossary.md`. Never re-invent a fixed term.
- Proper nouns in `i18n/do-not-translate.json` (46 entries) stay unchanged, including `iCUBEFARM EG SL`.
- Assets are **copied, not re-encoded**.
- Orphan drafts `beat-02-verify.html` and `beat-03-skills.html` are **not** ported (unreferenced superseded drafts).
- Preserve the existing English artifacts verbatim: the literal `\n` after `<body>` in each beat, the `<br>` in the outro `.message`, and the sub-comp `data-duration` values that disagree with their host clip durations (the host wins; "fixing" them would change output timing).

---

## What Already Exists (verified 2026-08-18)

Do not rebuild any of this.

| Asset | State |
|---|---|
| `tools/build-video-i18n.js` | Working. `buildVideoLocale({srcDir, outDir, i18nDir, locale})`. Locale-parametrised **except one French hardcode** — see Task 2. |
| `tools/lib/translate-subtitles.js` | Working. Handles both double- and single-quoted `textContent:` literals. |
| `tests/build-video-i18n.test.js` | 19 tests, all passing. Several assertions are French-specific — Task 3 parametrises them. |
| `tests/video-layout-fr.spec.js` | Working Playwright overflow measurement, hardcoded to `tutorial-video-fr`. Task 4 parametrises it. |
| `i18n/*.es.json` | Complete. **100% coverage of beat markup, 0 gaps.** |
| `i18n/video.es.json` | **Does not exist.** Task 1 creates it. |
| `tutorial-video-fr/` | Delivered. Must stay byte-identical through this work. |

**Coverage probe result (both locales, for comparison):**

```
FR: 437 strings, 0 uncovered (100% covered)
ES: 437 strings, 0 uncovered (100% covered)
```

**How French resolved its intro overflow** — the precedent this plan follows: the full expansion was kept in copy, and a `#title { font-size: 22px !important; }` override was injected (down from 30px). Spanish's equivalent string is 66 chars vs French's 68, so expect a similar outcome — but **measure, do not assume**.

---

## File Structure

**Create:**

| File | Responsibility |
|---|---|
| `i18n/video.es.json` | The 19 video-only Spanish strings: 11 subtitles, 4 intro, 4 outro. Same shape as `video.fr.json`. |
| `tests/video-layout-es.spec.js` | Playwright overflow measurement for the Spanish compositions. |
| `tutorial-video-es/**` | **Generated.** Do not hand-edit. |

**Modify:**

| File | Change |
|---|---|
| `tools/build-video-i18n.js` | Replace the `locale === 'fr'` hardcode with a `LOCALE_STYLE_OVERRIDES` table. |
| `tests/build-video-i18n.test.js` | Parametrise locale-specific assertions so both FR and ES are covered; add an FR-no-regression test. |
| `i18n/glossary.md` | Add the Spanish column to the Video Copy table. |
| `package.json` | Add `video:build:es`, `video:check:es`. |

---

### Task 1: Spanish video copy catalog

**Files:**
- Create: `i18n/video.es.json`
- Modify: `i18n/glossary.md`
- Test: `tests/build-video-i18n.test.js`

**Interfaces:**
- Produces: `i18n/video.es.json` — a flat `Record<string,string>` with exactly the same 19 keys as `i18n/video.fr.json`, consumed by Tasks 2–4.

- [ ] **Step 1: Write the failing test**

Append to `tests/build-video-i18n.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/build-video-i18n.test.js`
Expected: FAIL — `ENOENT: no such file or directory, open '.../i18n/video.es.json'`

- [ ] **Step 3: Write the catalog**

Create `i18n/video.es.json`:

```json
{
  "Welcome to the Labour Market Portal.": "Le damos la bienvenida al Portal del Mercado Laboral.",
  "The dashboard provides a real-time overview...": "El panel de control ofrece una visión general en tiempo real...",
  "...of national employment metrics and skill demands.": "...de los indicadores nacionales de empleo y las necesidades de competencias.",
  "Administrators can easily monitor private-sector compliance...": "Los administradores supervisan fácilmente el cumplimiento del sector privado...",
  "...and verify newly registered employers with a single click.": "...y verifican a los empleadores recién registrados con un solo clic.",
  "Use the Skill Gap Report to identify critical worker shortages...": "El Informe de brecha de competencias identifica la escasez crítica de mano de obra...",
  "...and discover data-driven training recommendations.": "...y revela recomendaciones de formación basadas en datos.",
  "Exporting evidence-based operational reports to PDF or Excel...": "La exportación de informes operativos basados en evidencia a PDF o Excel...",
  "...is simple and secure.": "...es sencilla y segura.",
  "Finally, the immutable Activity Log ensures total transparency...": "Por último, el registro de actividad inalterable garantiza una transparencia total...",
  "...and accountability across all ministry actions.": "...y la rendición de cuentas en todas las acciones del ministerio.",
  "Digital Workforce": "Soluciones Digitales",
  "Solutions": "para el Empleo",
  "Ministry of Labour": "Ministerio de Trabajo",
  "Labour Market Information System (LMIS) Demo": "Demostración del Sistema de Información del Mercado Laboral (SIML)",
  "To customize your Labor Market Information System (LMIS)": "Para personalizar su Sistema de Información del Mercado Laboral (SIML)",
  "Contact:": "Contacto:",
  "email:": "Correo electrónico:",
  "Whatsapp:": "WhatsApp:"
}
```

> **Terminology notes.** `Portal del Mercado Laboral`, `Panel de control`, `Informe de brecha de competencias`, `Registros de actividad`, and `Ministerio de Trabajo` all match `i18n/common.es.json` exactly — do not vary them. The headline splits `Soluciones Digitales` / `para el Empleo`, mirroring the French pattern and keeping the one-to-one `.headline-line` mapping, so no markup changes. `SIML` = *Sistema de Información del Mercado Laboral* (the Spanish counterpart of the French `SIMT`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/build-video-i18n.test.js`
Expected: PASS (24 tests)

- [ ] **Step 5: Add the Spanish column to the glossary**

In `i18n/glossary.md`, replace the Video Copy table and conventions line with:

```markdown
| English | Spanish (*Español*) | French (*Français*) | Note |
| :--- | :--- | :--- | :--- |
| Labour Market Portal | Portal del Mercado Laboral | Portail du Marché du Travail | Matches `common.*.json` |
| Skill Gap Report | Informe de brecha de competencias | Rapport sur le déficit de compétences | Matches `common.*.json` |
| Activity Log | Registro de actividad | Journal d'activité | Singular in subtitle context |
| Digital Workforce Solutions | Soluciones Digitales para el Empleo | Solutions Numériques pour l'Emploi | iCUBEFARM tagline — translated in both locales |
| LMIS | SIML (*Sistema de Información del Mercado Laboral*) | SIMT (*Système d'Information sur le Marché du Travail*) | Expand on first use, then acronym |

**Conventions:** formal register (ES *usted* / FR *vous*); leading/trailing `...` continuation markers preserved exactly so subtitle pairs read as one sentence across a cut. **Punctuation differs by locale:** French takes a non-breaking space before `:` `?` `!` `;`; **Spanish takes none.**
```

- [ ] **Step 6: Commit**

```bash
git add i18n/video.es.json i18n/glossary.md tests/build-video-i18n.test.js
git commit -m "feat(video): add Spanish video copy catalog and glossary column"
```

---

### Task 2: Generalise the locale style override

**Files:**
- Modify: `tools/build-video-i18n.js`
- Modify: `tests/build-video-i18n.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: exported `LOCALE_STYLE_OVERRIDES: Record<locale, Record<filename, string>>`, consumed by Task 5 to add the Spanish entry.

The driver currently contains the only French hardcode left in the pipeline:

```js
if (locale === 'fr' && file === 'beat-00-intro.html') {
  out = out.replace(/<\/head>/, '<style>#title { font-size: 22px !important; }</style></head>');
}
```

Replace it with a table. **The French output must not change by one byte.**

- [ ] **Step 1: Write the failing test**

Append to `tests/build-video-i18n.test.js`:

```js
const { LOCALE_STYLE_OVERRIDES } = require('../tools/build-video-i18n.js');

test('LOCALE_STYLE_OVERRIDES is exported and retains the French intro override', () => {
  assert.ok(LOCALE_STYLE_OVERRIDES, 'driver must export LOCALE_STYLE_OVERRIDES');
  assert.strictEqual(
    LOCALE_STYLE_OVERRIDES.fr['beat-00-intro.html'],
    '#title { font-size: 22px !important; }'
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

test('a locale with no override entry gets no injected style tag', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv-noover-'));
  buildVideoLocale({
    srcDir: path.join(ROOT, 'tutorial-video'),
    outDir,
    i18nDir: path.join(ROOT, 'i18n'),
    locale: 'es'
  });
  const intro = fs.readFileSync(path.join(outDir, 'compositions/beat-00-intro.html'), 'utf8');
  const injected = (intro.match(/font-size:\s*\d+px !important/g) || []);
  assert.deepStrictEqual(injected, [], 'no override configured yet for es');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/build-video-i18n.test.js`
Expected: FAIL — `driver must export LOCALE_STYLE_OVERRIDES` (`LOCALE_STYLE_OVERRIDES` is `undefined`).

> The third test also needs `i18n/video.es.json` from Task 1. If Task 1 is not done, it fails on a missing catalog instead — do Task 1 first.

- [ ] **Step 3: Write minimal implementation**

In `tools/build-video-i18n.js`, add the table below `GENERATED_HEADER`:

```js
/**
 * Per-locale CSS injected into a composition's <head> to absorb text expansion.
 * Copy-level fixes are always preferred; an entry here means no acceptable
 * shorter rendering existed. Keys are composition filenames.
 */
const LOCALE_STYLE_OVERRIDES = {
  fr: {
    'beat-00-intro.html': '#title { font-size: 22px !important; }'
  }
};
```

Replace the hardcoded `if` block with:

```js
    const override = (LOCALE_STYLE_OVERRIDES[locale] || {})[file];
    if (override) {
      out = out.replace(/<\/head>/, `<style>${override}</style></head>`);
    }
```

Add `LOCALE_STYLE_OVERRIDES` to `module.exports`:

```js
module.exports = { buildVideoLocale, BEAT_CATALOG_MAP, LOCALE_STYLE_OVERRIDES };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/build-video-i18n.test.js`
Expected: PASS (27 tests)

- [ ] **Step 5: Confirm the committed French tree is untouched**

Run: `git status --porcelain tutorial-video-fr/`
Expected: **empty output.** If anything is listed, the refactor changed French output — revert and fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add tools/build-video-i18n.js tests/build-video-i18n.test.js
git commit -m "refactor(video): replace French hardcode with per-locale style override table"
```

---

### Task 3: Parametrise the unit tests by locale

**Files:**
- Modify: `tests/build-video-i18n.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `buildVideoLocale`, `i18n/video.es.json`.
- Produces: a suite that asserts the structural invariants for **both** locales, so Spanish is guarded by the same net that guards French.

The structural tests (`timing attributes preserved`, `ids preserved`, `assets copied`, `stray \n preserved`, `orphans skipped`, `idempotent`) are locale-independent but currently run only for `fr`. Run them across both.

- [ ] **Step 1: Write the failing test**

In `tests/build-video-i18n.test.js`, replace the fixed `buildToTemp()` helper with a locale-taking version and add a parametrised block:

```js
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
```

Delete the now-superseded single-locale versions of those same tests so they do not run twice.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/build-video-i18n.test.js`
Expected: FAIL on the `[es]` cases — Spanish has not been generated into a temp dir with a valid catalog until Task 1 is complete, and `[es] embedded portal markup` asserts strings that only appear once the ES build runs.

- [ ] **Step 3: Run the build to make the ES cases reachable**

Add to `package.json` scripts:

```json
"video:build:es": "node tools/build-video-i18n.js es",
"video:check:es": "cd tutorial-video-es && npx hyperframes check"
```

Run: `npm run video:build:es`
Expected: `✓ tutorial-video-es: 8 compositions, 3 assets copied.`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:video`
Expected: PASS. Both `[fr]` and `[es]` variants green.

- [ ] **Step 5: Commit**

```bash
git add tests/build-video-i18n.test.js package.json tutorial-video-es
git commit -m "test(video): parametrise video build tests by locale; generate Spanish project"
```

---

### Task 4: Spanish layout overflow measurement

**Files:**
- Create: `tests/video-layout-es.spec.js`

**Interfaces:**
- Consumes: `tutorial-video-es/compositions/*.html` from Task 3.
- Produces: a measured overflow figure for Task 5. **Expect this task to end RED** — that is its purpose.

- [ ] **Step 1: Write the test**

Create `tests/video-layout-es.spec.js` (mirrors the French spec, pointed at the Spanish tree):

```js
const { test, expect } = require('@playwright/test');
const path = require('node:path');

const ES = path.join(__dirname, '..', 'tutorial-video-es', 'compositions');

const NOWRAP_TARGETS = [
  { file: 'beat-00-intro.html', selector: '#title', container: '.text-container' },
  { file: 'beat-00-intro.html', selector: '.headline-line', container: '.text-container' }
];

for (const { file, selector, container } of NOWRAP_TARGETS) {
  test(`${file} ${selector} fits inside ${container}`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(ES, file));
    await page.waitForTimeout(500); // let the webfont settle

    const overflow = await page.evaluate(
      ([sel, cont]) => {
        const box = document.querySelector(cont).clientWidth;
        return [...document.querySelectorAll(sel)].map((el) => ({
          text: el.textContent.trim(),
          width: Math.ceil(el.scrollWidth),
          available: box,
          overflowBy: Math.ceil(el.scrollWidth) - box
        }));
      },
      [selector, container]
    );

    for (const r of overflow) {
      expect(
        r.overflowBy,
        `"${r.text}" is ${r.width}px in a ${r.available}px box (over by ${r.overflowBy}px)`
      ).toBeLessThanOrEqual(0);
    }
  });
}

test('subtitle containers stay within 80% frame width', async ({ page }) => {
  for (const file of [
    'beat-01-dashboard.html', 'beat-02-verification.html', 'beat-03-skill-gap.html',
    'beat-04-reports.html', 'beat-05-audit.html'
  ]) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(ES, file));
    const fits = await page.evaluate(() => {
      const el = document.querySelector('#subtitle-container');
      if (!el) return true;
      return el.scrollWidth <= 1920 * 0.8;
    });
    expect(fits, `${file} subtitle exceeds its 80% max-width`).toBe(true);
  }
});

test('outro message and contact block stay inside the frame', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('file://' + path.join(ES, 'beat-06-outro.html'));
  const box = await page.locator('.container').boundingBox();
  expect(box.width).toBeLessThanOrEqual(1920);
  expect(box.height).toBeLessThanOrEqual(1080);

  // "Correo electrónico:" is materially longer than "email:" — check the row fits.
  const rowsFit = await page.evaluate(() =>
    [...document.querySelectorAll('.contact-item')].every((el) => el.scrollWidth <= el.clientWidth + 1)
  );
  expect(rowsFit, 'a contact row overflows its box').toBe(true);
});
```

- [ ] **Step 2: Run it and record the actual numbers**

Run: `npx playwright test tests/video-layout-es.spec.js --reporter=list`

Expected: **FAIL on `#title`.** The Spanish string is 66 chars against English's 43; French needed a drop from 30px to 22px at 68 chars. **Write down the exact `overflowBy` value from the assertion message — Task 5 needs it.**

`.headline-line` is `Soluciones Digitales` (20 chars), the same length as the French `Solutions Numériques` which passed at 96px — expect it to pass. Record either way.

- [ ] **Step 3: Commit the test (red)**

```bash
git add tests/video-layout-es.spec.js
git commit -m "test(video): add Spanish layout overflow measurement"
```

---

### Task 5: Remediate Spanish intro overflow

**Files:**
- Modify: `tools/build-video-i18n.js` (add the `es` override entry) **or** `i18n/video.es.json` (shorten copy)

**Interfaces:**
- Consumes: the measured `overflowBy` from Task 4 Step 2; `LOCALE_STYLE_OVERRIDES` from Task 2.
- Produces: a green `tests/video-layout-es.spec.js`.

Apply the **first** option that clears the measured overflow. Stop there — do not stack fixes.

**For `#title`:**

1. **Match the French precedent** — keep the full expansion, add the override. Consistency between the two locales matters here, since both are shown to the same ministry:
   ```js
   const LOCALE_STYLE_OVERRIDES = {
     fr: { 'beat-00-intro.html': '#title { font-size: 22px !important; }' },
     es: { 'beat-00-intro.html': '#title { font-size: 22px !important; }' }
   };
   ```
   Spanish is 66 chars vs French's 68, so 22px should clear it with room. **Re-run Task 4 to confirm rather than assuming.**

2. If 22px still overflows, step down to `21px`, then `20px`. Do not go below `20px` — smaller than that is not legible at 1080p on a projected demo.

3. If legibility becomes the binding constraint, shorten the copy instead:
   ```json
   "Labour Market Information System (LMIS) Demo": "Demostración del SIML"
   ```
   The full expansion still appears in the outro, so the acronym is introduced either way.

**For `.headline-line`** (only if Task 4 showed it failing):

1. Re-split, keeping the one-to-one div mapping:
   ```json
   "Digital Workforce": "Soluciones",
   "Solutions": "Digitales RR. HH."
   ```
2. Add `.headline { font-size: 88px !important; }` to the `es` override entry.

**For the outro contact rows** (only if Task 4's `rowsFit` check failed):

1. Shorten the label: `"email:": "Correo:"`.

- [ ] **Step 1: Apply the first fallback that clears the measured overflow**

- [ ] **Step 2: Regenerate**

Run: `npm run video:build:es`

- [ ] **Step 3: Re-run the layout test to verify it passes**

Run: `npx playwright test tests/video-layout-es.spec.js --reporter=list`
Expected: PASS (all)

- [ ] **Step 4: Confirm French did not regress**

Run:
```bash
npm run test:video && \
npx playwright test tests/video-layout-fr.spec.js --reporter=list && \
git status --porcelain tutorial-video-fr/
```
Expected: tests PASS, and `git status` prints **nothing** for `tutorial-video-fr/`.

- [ ] **Step 5: Commit**

```bash
git add tools/build-video-i18n.js i18n/video.es.json tutorial-video-es
git commit -m "fix(video): resolve Spanish intro title overflow"
```

---

### Task 6: HyperFrames validation and visual parity

**Files:**
- Modify: `tutorial-video-es/**` (only if `check` reports findings unique to Spanish)

**Interfaces:**
- Consumes: the generated project from Tasks 3 and 5.
- Produces: 0 `hyperframes check` findings and confirmed visual parity with the English and French cuts.

- [ ] **Step 1: Run the HyperFrames gate**

Run: `npm run video:check:es`
Expected: 0 findings across lint, runtime, layout, motion, contrast.

> **Findings inherited from English are preserved, not fixed.** The `<br>` in the outro `.message` and the literal `\n` after `<body>` exist identically in the English and French cuts. The identity rule outranks the lint preference. Fix only findings **unique to Spanish**. If `check` behaved a particular way for French, expect the same here — compare against that run rather than re-litigating.

- [ ] **Step 2: Snapshot every beat at its host-clip midpoint**

Run:
```bash
cd tutorial-video-es && npx hyperframes snapshot --at 2.5,10,20,30,40,50,57.5
```

(Midpoints of intro 0–5, beats 5–15/15–25/25–35/35–45/45–55, outro 55–60.)

- [ ] **Step 3: Compare three-way against English and French**

Run the same snapshot command in `tutorial-video/` and `tutorial-video-fr/`. For each of the seven frames confirm:
- identical layout, spacing, and composition across all three
- identical cursor position
- text is Spanish
- no clipped, overlapping, or unexpectedly wrapped text
- subtitle box legible and within the lower third
- intro `#title` legible at whatever size Task 5 settled on

- [ ] **Step 4: Preview for human review**

Run: `cd tutorial-video-es && npx hyperframes preview`

Present to the user. **Do not render until they approve.**

- [ ] **Step 5: Commit any fixes**

```bash
git add tutorial-video-es
git commit -m "fix(video): resolve HyperFrames check findings for Spanish cut"
```

---

### Task 7: Render and deliver

**Files:**
- Create: `tutorial-video-es/renders/tutorial-video-es_<timestamp>.mp4`
- Create: `tutorial-video-es/README.md`

**Interfaces:**
- Consumes: user approval from Task 6 Step 4.
- Produces: the delivered Spanish mp4.

- [ ] **Step 1: Render (only after approval)**

Run: `cd tutorial-video-es && npx hyperframes render`
Expected: a 60s 1920×1080 mp4 in `renders/`. The English render took ~42s; expect the same order of magnitude.

- [ ] **Step 2: Verify the output**

```bash
cd tutorial-video-es && ls -la renders/ && \
  npx ffprobe -v error -show_entries format=duration:stream=width,height \
  -of default=noprint_wrappers=1 renders/*.mp4
```
Expected: `width=1920`, `height=1080`, `duration≈60`.

- [ ] **Step 3: Watch it end to end**

Confirm: audio level matches the English cut, intro/outro timing matches, all five screencasts are Spanish, subtitles readable within their allotted durations, no flash of English at any cut.

- [ ] **Step 4: Write the project README**

Create `tutorial-video-es/README.md`:

```markdown
# Tutorial Video — Spanish (Español)

**GENERATED PROJECT — do not hand-edit.**

Regenerate with:

    npm run video:build:es

Source of truth: `tutorial-video/` (English) + `i18n/video.es.json` + the existing
`i18n/*.es.json` page catalogs. Editing files here directly will be silently
discarded on the next build.

To change Spanish copy, edit `i18n/video.es.json` (video-specific strings) or the
relevant `i18n/<page>.es.json` (portal UI strings), then rebuild.

Layout overrides for this locale live in `LOCALE_STYLE_OVERRIDES` in
`tools/build-video-i18n.js`.
```

- [ ] **Step 5: Commit**

```bash
git add tutorial-video-es
git commit -m "feat(video): render Spanish tutorial video"
```

---

## Open Questions

None are blocking — every structural question was settled during the French build.

1. **Native Spanish review before render.** Spanish is Equatorial Guinea's primary language of government, making this the highest-stakes of the three locales. The 19 strings in `video.es.json` are the most visible copy in the deliverable. A native pass is cheap and worth doing before Task 7. *(Owner: stakeholder)*

2. **`Correo electrónico:` vs `Email:` in the outro.** The plan uses the full Spanish form. If the contact block looks crowded next to `WhatsApp:`, `Correo:` is the fallback and Task 4 measures whether it is forced. *(Owner: reviewer, at Task 6 Step 4)*

3. **Should the FR and ES intro titles use the same font size?** If Spanish clears at 24px while French needed 22px, matching them at 22px looks more consistent when the two cuts are shown back to back. The plan's first fallback already proposes matching. *(Owner: reviewer)*

4. **Gitignore the renders directories?** `tutorial-video-fr/renders/` and `tutorial-video-es/renders/` will accumulate large mp4s. Worth deciding once, for both locales. *(Owner: engineering)*

---

## Self-Review

**Spec coverage.** The request was a Spanish counterpart to the completed French video. Task 1 covers all new copy. Task 2 removes the one blocker to reuse (the French hardcode). Task 3 extends the safety net to Spanish and generates the project. Tasks 4–5 handle the layout consequence of Spanish expansion. Tasks 6–7 validate and deliver. The identity rule is asserted mechanically, and French non-regression is asserted at two separate points (Task 2 Step 5 and Task 5 Step 4) because Task 2 touches shared code.

**Placeholder scan.** No TBDs. Every code step is runnable. Task 5's fallbacks are concrete values selected by a measured number from Task 4, with an explicit legibility floor at 20px.

**Type consistency.** `buildVideoLocale({srcDir, outDir, i18nDir, locale})` matches the shipped signature verified in the current `tools/build-video-i18n.js`. `LOCALE_STYLE_OVERRIDES` is defined in Task 2 and consumed by name in Tasks 2 and 5. `translateHtml` option names (`pageCatalog`, `doNotTranslateSet`, `rewriteToggle`, `headerComment`) are untouched by this plan.

**Difference from the French plan.** French needed the subtitle pass, the driver, and the fixture suite built from nothing (Tasks 1–3 there were pure construction). Here all of that exists and passes. The genuinely new work is one catalog, one small refactor, and the measurement/remediation loop — which is why this plan is shorter despite covering the same deliverable.
