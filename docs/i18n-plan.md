# Implementation Plan: Trilingual Portal (EN / FR / ES)

Plan file: `docs/i18n-plan.md`
Spec: `docs/i18n-spec.md`

## Context & Global Constraints

- **Scope:** All 11 pages of the Equatorial Guinea Ministry of Labour prototype (`index.html`, `entities.html`, `skill-gap.html`, `jobs-applications.html`, `general-report.html`, `users-management.html`, `activity-logs.html`, `report-recipients.html`, `notification-preferences.html`, `tenant-branding.html`, `supported-countries.html`).
- **Source of truth:** English HTML files at repository root remain authoritative.
- **Generated output:** `/fr/` and `/es/` directories are generated automatically by `tools/build-i18n.js`. Never hand-edit files in `/fr` or `/es`.
- **Zero runtime dependencies:** Output is plain static HTML, CSS, and JS that runs over `file://` and on static web hosting.
- **Node tools & test runner:** Use Node built-in `node:test` and `node:assert` for unit/integration tests; Playwright for E2E.
- **Catalogs:** Flat JSON `{ "<English source string>": "<translation>" }`, UTF-8, sorted keys.
- **Dynamic JS strings:** Hoisted into `/* i18n:STR:start */ const STR = { ... }; /* i18n:STR:end */` and formatted via `fmt(STR.key, { placeholder: val })`.
- **Language toggle:** Inserted into `.sidebar-foot` on all pages with relative hrefs and `.is-active` segment.
- **Translation register:** Formal address (`vous` / `usted`), Equatorial Guinean administrative terminology for Spanish.

---

### Task 1: Test harness, fixtures, and catalog validator

**Goal:** Create test fixtures and build `tools/validate-catalogs.js` along with comprehensive unit tests in `tests/catalog-validator.test.js` validating catalog schema (R1).

**Files:**
- `tests/fixtures/mini.html` (minimal HTML page with text nodes, whitelisted attributes, `STR` block, and language toggle)
- `tests/fixtures/catalogs/valid.fr.json`
- `tests/fixtures/catalogs/stale.fr.json`
- `tests/fixtures/catalogs/mismatch.fr.json`
- `tests/fixtures/catalogs/empty.fr.json`
- `tools/validate-catalogs.js` (exported functions `validateCatalog(catalog, sourceStrings)` and CLI runner)
- `tests/catalog-validator.test.js`

**Requirements:**
1. Validator checks:
   - Rejects non-string values.
   - Rejects empty translation values (`""`).
   - Rejects stale keys (keys not found in the English source strings set).
   - Rejects placeholder mismatch (e.g., source has `{name}` but translation has `{nom}` or missing `{name}`).
   - Verifies keys are sorted alphabetically.
2. CLI `node tools/validate-catalogs.js` exits 0 when valid, non-zero when invalid with detailed error report.
3. Tests 1, 2, 3 from spec pass with `node --test tests/catalog-validator.test.js`.

---

### Task 2: Extractor tool

**Goal:** Build `tools/extract-i18n.js` to scan English HTML files and extract translatable strings into catalog skeletons (R2).

**Files:**
- `i18n/do-not-translate.json` (initial seed of proper nouns: Malabo, Bata, Ebebiyín, Mongomo, Luba, Hyperframes, etc.)
- `tools/extract-i18n.js`
- `tests/extractor.test.js`

**Requirements:**
1. Extractor extracts:
   - Visible text nodes (trimmed, non-empty, excluding `<script>`, `<style>`, and elements marked with `data-i18n-ignore`).
   - Whitelisted attributes: `title`, `aria-label`, `placeholder`, `alt`, `<meta name="description">` content.
   - Dynamic strings within `/* i18n:STR:start */ ... /* i18n:STR:end */` blocks.
2. Omits any string exact-matching entries in `do-not-translate.json` or numbers/pure punctuation.
3. Groups strings appearing on ≥ 8 of the 11 pages into `common.[locale].json`; page-specific strings into `[page].[locale].json`.
4. Non-destructive: merges new keys into existing catalogs without overwriting existing translations; keeps keys sorted.
5. Tests 4, 5, 6, 7 pass with `node --test tests/extractor.test.js`.

---

### Task 3: Refactor 11 English source pages with STR blocks and language toggle

**Goal:** Refactor the 11 root English pages to hoist dynamic JS strings into `/* i18n:STR:start */` blocks, add `fmt()` helper, and add the language toggle markup to `.sidebar-foot` with responsive styles.

**Files:**
- `index.html`
- `entities.html`
- `skill-gap.html`
- `jobs-applications.html`
- `general-report.html`
- `users-management.html`
- `activity-logs.html`
- `report-recipients.html`
- `notification-preferences.html`
- `tenant-branding.html`
- `supported-countries.html`
- `tests/english-source-integrity.test.js`

**Requirements:**
1. In all 11 HTML pages:
   - Identify dynamic string literals in scripts (`alert()`, `confirm()`, `modal` text, dynamic table rows / status badges) and hoist into `/* i18n:STR:start */ const STR = { ... }; /* i18n:STR:end */`.
   - Add `const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '{' + k + '}');` where placeholders are used.
   - Insert language toggle into `.sidebar-foot` right above `.user-block`:
     ```html
     <div class="lang-toggle" role="group" aria-label="Language">
       <a class="lang-opt is-active" hreflang="en" href="index.html">EN</a>
       <a class="lang-opt" hreflang="fr" href="fr/index.html">FR</a>
       <a class="lang-opt" hreflang="es" href="es/index.html">ES</a>
     </div>
     ```
   - Add CSS for `.lang-toggle` and `.lang-opt` to inline styles (sleek segmented control matching the dark sidebar theme).
2. Write `tests/english-source-integrity.test.js` ensuring:
   - All 11 pages have valid `STR` blocks (or scripts if static) and valid language toggle markup.
   - No broken script syntax or unclosed tags.

---

### Task 4: Generator tool (HTML, attributes, metadata, JS STR, toggle rewriting)

**Goal:** Build `tools/build-i18n.js` to compile English HTML pages into `/fr` and `/es` static trees (R3, R5).

**Files:**
- `tools/build-i18n.js`
- `tests/generator.test.js`

**Requirements:**
1. Generator performs 5 substitutions:
   - Text nodes: looked up in `{page catalog} ∪ {common catalog}`, page catalog winning on conflict.
   - Whitelisted attributes: `title`, `aria-label`, `placeholder`, `alt`, `<meta name="description">`.
   - Document metadata: `<html lang="fr">` or `<html lang="es">`, and translated `<title>`.
   - `/* i18n:STR:start */ ... /* i18n:STR:end */` block: replaced with translated string object for target locale. Surrounding JS remains byte-identical.
   - Language toggle hrefs and active state:
     - Root (EN): `page.html` (active), `fr/page.html`, `es/page.html`
     - FR: `../page.html`, `page.html` (active), `../es/page.html`
     - ES: `../page.html`, `../fr/page.html`, `page.html` (active)
2. Writes to `/fr/` and `/es/`. Completely wipes and recreates output dirs to prevent stale orphans.
3. Inserts `<!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: ../[file] -->` at top of generated files.
4. Preserves `data-hf-id` and all attributes byte-for-byte.
5. Idempotent: consecutive runs produce identical file hashes.
6. Tests 8 through 17 pass with `node --test tests/generator.test.js`.

---

### Task 5: Coverage checker and progress reporter

**Goal:** Build `tools/check-i18n.js` as the automated safety net (R4, R11).

**Files:**
- `tools/check-i18n.js`
- `tests/coverage-check.test.js`

**Requirements:**
1. Scans every generated page in `/fr` and `/es` against original English strings.
2. Rejects any untranslated English string remaining in the generated output, excluding `do-not-translate.json`.
3. Exits with non-zero exit code if any untranslated string or catalog gap exists, detailing `[locale]/[page].html: line [L] - "[string]"`.
4. Outputs per-page and per-locale progress stats (e.g. `fr/skill-gap: 168/171 (98%)`).
5. Tests 18, 19, 20 pass with `node --test tests/coverage-check.test.js`.

---

### Task 6: Glossary, Do-not-translate list, and Complete Translations for all 11 pages

**Goal:** Create `i18n/glossary.md`, finalize `i18n/do-not-translate.json`, extract all strings, and populate complete, high-quality French and Spanish translations for all catalogs (R6).

**Files:**
- `i18n/glossary.md`
- `i18n/do-not-translate.json`
- `i18n/common.fr.json`, `i18n/common.es.json`
- 22 page catalogs: `index.{fr,es}.json`, `entities.{fr,es}.json`, `skill-gap.{fr,es}.json`, `jobs-applications.{fr,es}.json`, `general-report.{fr,es}.json`, `users-management.{fr,es}.json`, `activity-logs.{fr,es}.json`, `report-recipients.{fr,es}.json`, `notification-preferences.{fr,es}.json`, `tenant-branding.{fr,es}.json`, `supported-countries.{fr,es}.json`

**Requirements:**
1. Glossary sets formal terminology:
   - Portal: *Portal del Mercado Laboral* / *Portail du Marché du Travail*
   - Ministry: *Ministerio de Trabajo, Fomento de Empleo y Seguridad Social* / *Ministère du Travail, de la Promotion de l'Emploi et de la Sécurité Sociale*
   - Statuses: *Pendiente de revisión* / *En attente d'examen*, *Verificado* / *Vérifié*, *Suspendido* / *Suspendu*, *Escasez* / *Pénurie*, *Superávit* / *Surplus*.
2. Do-not-translate includes: Malabo, Bata, Ebebiyín, Mongomo, Luba, Annobón, Bioko Norte, Bioko Sur, Centro Sur, Kié-Ntem, Litoral, Wele-Nzas, demo person names (María Esono, Pedro Nsue, etc.), company names (GETESA, Marathon EG, TotalEnergies EG, etc.), brand identifiers.
3. 100% translation coverage across all 24 catalogs.
4. Run `node tools/validate-catalogs.js`, `node tools/build-i18n.js`, and `node tools/check-i18n.js` -> 0 errors, 0 untranslated strings.

---

### Task 7: Language persistence and locale-aware formatting (P1)

**Goal:** Implement client-side language preference persistence and locale-aware number/date formatting (R8, R9).

**Files:**
- JavaScript logic in shared toggle & header scripts of HTML pages / generator
- `general-report.html` (locale-aware date/number formatting)
- `tests/persistence.test.js`

**Requirements:**
1. Clicking language toggle saves `localStorage.setItem('portalLang', lang)`.
2. On root (EN) pages:
   - If `portalLang` is `fr` or `es`, and no `?lang=en` is in the URL, redirect to `/fr/[page]` or `/es/[page]`.
   - If no preference stored, stay on English (first visit default).
   - If `?lang=en` is present in query parameters, clear `portalLang` from `localStorage` and do not redirect.
3. In `/fr/` and `/es/` pages: do NOT execute redirect logic (prevents loops).
4. `general-report.html` formats dynamic metrics using `Intl.NumberFormat(lang)` and dates with `Intl.DateTimeFormat(lang)`.
5. Tests 26 to 29 pass with `node --test tests/persistence.test.js`.

---

### Task 8: End-to-end testing, npm scripts, layout checks, and final build validation

**Goal:** Configure npm scripts, write Playwright E2E tests for navigation, layout overflow, console error checks across all 33 pages, and perform final build verification (R7, R10).

**Files:**
- `package.json` (add scripts: `i18n:extract`, `i18n:build`, `i18n:check`, `i18n:validate`, `test`, `test:e2e`)
- `tests/e2e-i18n.spec.js` (Playwright suite verifying all 33 pages, toggle navigation, zero console errors, no `scrollWidth > clientWidth` overflow on sidebar/headers at 1920px and 768px)

**Requirements:**
1. All npm scripts work smoothly.
2. `npm run test` executes all unit and integration tests successfully.
3. `npx playwright test tests/e2e-i18n.spec.js` passes all tests across all 33 pages.
4. Clean, comprehensive test output.

