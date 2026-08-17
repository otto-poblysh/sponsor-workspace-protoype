# Spec: Trilingual Portal (EN / FR / ES)

**Status:** Draft for implementation
**Date:** 2026-08-17
**Scope:** All 11 pages of the Equatorial Guinea Ministry of Labour prototype

---

## Problem Statement

The Labour Market Portal prototype exists only in English, but it is being demonstrated to the **Equatorial Guinea Ministry of Labour** — a government whose official languages are Spanish, French, and Portuguese, and where **Spanish is the primary language of government**. Presenting an English-only interface to ministry stakeholders forces them to evaluate a product in a language they do not administer in, which undercuts the credibility of the demo and invites "can it even do our language?" as the first objection rather than a closing question.

Cost of not solving it: the prototype reads as a foreign product retrofitted for the region rather than one built for it, and every demo spends time on translation caveats instead of capability.

---

## Goals

1. **Any of the 11 pages can be demonstrated end-to-end in English, French, or Spanish** with no untranslated English text visible in the FR/ES builds — enforced by an automated check, not by eye.
2. **Switching language takes one click from any page** and lands the viewer on the *same* page in the target language, never on a home page or a 404.
3. **English remains the single source of truth.** A copy edit to an English page propagates to FR and ES via one regeneration command — no hand-editing 33 files.
4. **Zero new runtime dependencies.** The output stays plain static HTML that works over `file://` and on the existing Vercel deployment, with no client-side fetch or framework.
5. **Layout survives translation.** French and Spanish run 15–25% longer than English; no page may break its sidebar, buttons, or table headers in the longer locales.

---

## Non-Goals

| Not doing | Why |
|---|---|
| **Portuguese (pt)** | Also official in Equatorial Guinea, but not requested. The architecture must make adding it a catalog-only change — no code change. Documented in P2. |
| **Right-to-left (RTL) support** | No RTL language in scope. Adding the CSS logical-property work now is unearned complexity. |
| **A translation management system / vendor workflow** | 498 unique strings is small enough for flat JSON files in-repo. A TMS is warranted at 10× this volume. |
| **Locale-aware number, date, and currency formatting** | Only one page uses `toLocaleString`/`new Date`. Demo data is static. Deferred to P1. |
| **Translating proper nouns** | Malabo, Bata, Ebebiyín, Mongomo, Luba, person names, and company names stay as-is in all locales. A do-not-translate list enforces this. |
| **User-selectable language stored server-side** | No backend. `localStorage` only. |

---

## Architecture

English pages remain authoritative. A Node generator reads each English page plus its translation catalogs and emits the FR and ES trees.

```
/                          English — source of truth (unchanged, 11 pages)
  index.html
  entities.html
  ...
/i18n/
  common.fr.json           shared shell: nav, brand, user block, toggle
  common.es.json
  index.fr.json            per-page overrides
  index.es.json
  ...                      (22 page catalogs + 2 common)
  glossary.md              agreed terminology
  do-not-translate.json    proper nouns, brand names
/tools/
  extract-i18n.js          English pages -> catalog skeletons
  build-i18n.js            English + catalogs -> /fr, /es
/tests/
  ...
/fr/                       GENERATED — do not hand-edit
/es/                       GENERATED — do not hand-edit
```

### Why this works cleanly here

Three properties of the current codebase make the generator approach low-risk:

- **All internal links are relative siblings** (`href="entities.html"`). A copied tree navigates correctly with **zero link rewriting**. Only the language toggle needs locale-aware hrefs.
- **The shared shell is byte-identical across all 11 pages** (verified: identical MD5 for the `sidebar-foot` block on every page). Nav, brand, and user strings live in one `common` catalog and one insertion point serves the toggle.
- **Every page is self-contained** (inline `<style>`, inline `<script>`, no shared assets). There is no asset-path rewriting problem.

### Substitution model

Catalogs are keyed by the **exact English source string**, so they are human-readable and reviewable by a non-developer:

```json
{
  "Registered Employers": "Employeurs enregistrés",
  "Pending review": "En attente d'examen",
  "National overview of registered private-sector employment in Equatorial Guinea":
    "Aperçu national de l'emploi déclaré dans le secteur privé en Guinée équatoriale"
}
```

The generator parses the English page, walks it, and replaces:

1. **Text nodes** — trimmed content looked up in `{page catalog} ∪ {common catalog}`, page winning on conflict.
2. **Whitelisted attributes** — `title`, `aria-label`, `placeholder`, `alt`, `<meta name="description">`.
3. **Document metadata** — `<html lang>` → `fr` / `es`, and `<title>`.
4. **The `STR` block** in inline `<script>` (see below).
5. **Language-toggle hrefs** and active state, computed per locale.

**Homograph handling:** if the same English string needs different translations on different pages, the page catalog overrides `common`. If two contexts on the *same* page conflict, use the context-qualified key form `"Status|Active"` and add `data-i18n-ctx="Status"` to that element. Expected to be rare; the extractor reports candidates.

### JS-generated strings

~65 dynamic string sites across 8 pages produce user-visible text (`alert()`, `textContent =`, template literals such as `` `Are you sure you want to suspend access for ${entityName}?` ``). A DOM walk cannot reach these.

**One-time refactor of the English source:** hoist those literals into a delimited block at the top of each inline script, and interpolate with named placeholders.

```js
/* i18n:STR:start */
const STR = {
  suspendTitle: "Suspend Employer",
  returnTitle: "Return Employer Registration",
  suspendConfirm: "Are you sure you want to suspend access for {name}? A comment is required to proceed.",
  commentRequired: "Please enter a comment before submitting."
};
/* i18n:STR:end */
const fmt = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);
```

Call sites become `fmt(STR.suspendConfirm, { name: entityName })`. The generator replaces the whole delimited block — it never rewrites arbitrary JavaScript, so it cannot corrupt code. Placeholder tokens (`{name}`) are order-independent, which matters because French and Spanish word order differs from English.

### Language toggle

A three-segment control inserted into `sidebar-foot`, above the user block — one location, present on every page, identical markup in all 11 English sources.

```html
<div class="lang-toggle" role="group" aria-label="Language">
  <a class="lang-opt is-active" hreflang="en" href="index.html">EN</a>
  <a class="lang-opt" hreflang="fr" href="fr/index.html">FR</a>
  <a class="lang-opt" hreflang="es" href="es/index.html">ES</a>
</div>
```

The generator rewrites hrefs per locale and per page, preserving the current page:

| Viewing | → EN | → FR | → ES |
|---|---|---|---|
| `/entities.html` | `entities.html` | `fr/entities.html` | `es/entities.html` |
| `/fr/entities.html` | `../entities.html` | `entities.html` | `../es/entities.html` |
| `/es/entities.html` | `../entities.html` | `../fr/entities.html` | `entities.html` |

Relative hrefs (not absolute) keep the prototype working over `file://`, which `capture_screenshots.js` depends on.

---

## User Stories

**Ministry stakeholder (demo audience)**
- As a ministry official who works in Spanish, I want the entire portal in Spanish so that I can evaluate the product's substance rather than translate it in my head.
- As a francophone regional partner, I want to switch to French from whatever page is on screen so that I keep my place in the demo instead of restarting from the dashboard.
- As a viewer, I want the language I picked to still apply after I click through to another page so that I do not re-select it on every screen.

**Presenter**
- As a presenter, I want the language control in the same place on every page so that switching is muscle memory and never interrupts the flow.
- As a presenter, I want to open the prototype and land in English by default so that a colleague's earlier preference does not surprise me mid-demo.

**Maintainer**
- As a maintainer, I want to edit English copy once and regenerate so that FR and ES cannot silently drift from the source.
- As a maintainer, I want the build to fail loudly on an untranslated string so that a half-translated page can never reach a demo.
- As a translator, I want to edit flat JSON of English→target pairs so that I never touch HTML.

---

## Requirements

### P0 — Must have

**R1. Catalog schema and validation**
- Catalogs are flat JSON, `{ "<English source>": "<translation>" }`, UTF-8, sorted by key.
- Validator rejects: non-string values, empty translations, keys absent from the English source (stale), and placeholder-token mismatch between key and value.

*Acceptance:*
- [ ] Given a catalog with a key not present in any English page, when validation runs, then it fails naming the stale key and its file
- [ ] Given `"…for {name}?"` mapped to a value containing `{nom}`, then validation fails on placeholder mismatch
- [ ] Given a value of `""`, then validation fails (an untranslated string must be absent, not blank)

**R2. Extractor produces catalog skeletons**
- `node tools/extract-i18n.js` walks the 11 English pages and emits/updates one skeleton per page per locale, plus `common.*.json` for strings appearing on **≥ 8 of 11** pages.
- Strings matching `do-not-translate.json` are omitted.
- Re-running preserves existing translations and only adds new keys — never clobbers translator work.

*Acceptance:*
- [ ] Given a fresh checkout, when the extractor runs, then 24 catalog files are created and their union covers all 498 unique source strings
- [ ] Given an existing catalog with translations, when the extractor re-runs after an English copy edit, then prior translations are intact and only the new string is added
- [ ] Given `"Malabo"` in `do-not-translate.json`, then it appears in no catalog

**R3. Generator emits FR and ES trees**
- `node tools/build-i18n.js` writes `/fr` and `/es`, each with all 11 pages.
- Performs the five substitutions listed under *Substitution model*.
- Generation is idempotent — running twice produces byte-identical output.
- `/fr` and `/es` are wiped and rebuilt each run, so a deleted English page cannot leave an orphan.

*Acceptance:*
- [ ] Given a built tree, when `/fr/index.html` is opened, then `<html lang="fr">` and the `<title>` is French
- [ ] Given a `title="Export"` attribute, then the FR build carries the translated attribute value
- [ ] Given the build runs twice, then the second run changes no file's checksum
- [ ] Given an English page is deleted and the build re-runs, then its FR and ES counterparts are gone

**R4. No untranslated English survives — the safety net**
- After generation, a coverage check scans every FR and ES page for any source string still matching its English original, excluding the do-not-translate list.
- **Any leftover fails the build with a non-zero exit code**, listing file, string, and location.

*Acceptance:*
- [ ] Given one string is deleted from `entities.fr.json`, when the build runs, then it exits non-zero naming that string and `fr/entities.html`
- [ ] Given all catalogs are complete, then the check passes with zero findings
- [ ] Given `"Malabo"` appears untranslated in `/fr`, then the check does **not** flag it

**R5. Language toggle present and correct on all 33 pages**
- Inserted once into the English `sidebar-foot`; the generator rewrites hrefs per the table above.
- The current locale's segment is marked `is-active` and is non-navigating.
- Each link carries a correct `hreflang`.

*Acceptance:*
- [ ] Given `/fr/skill-gap.html`, when ES is clicked, then the browser lands on `/es/skill-gap.html` — same page, different language
- [ ] Given any of the 33 pages, then the toggle renders and the active segment matches the page's locale
- [ ] Given the prototype is opened over `file://`, then every toggle link resolves (no broken path)

**R6. Translation quality and consistency**
- `i18n/glossary.md` fixes the recurring terms before translation begins: *Labour Market Portal*, *Ministry of Labour*, *employer*, *skill gap*, *labour market*, *shortage / surplus / tight*, *pending review*, *verified*, *suspended*.
- Spanish uses Equatorial Guinean administrative register, not Latin American or Peninsular colloquial.
- Both locales use formal address (`vous` / `usted`) throughout — this is a government tool.
- All UI chrome **and** demo data are translated (job titles, sector names, status badges, activity log entries, report names), excepting the do-not-translate list.

*Acceptance:*
- [ ] Given the glossary fixes *skill gap* → *déficit de compétences*, then no FR page uses a different rendering
- [ ] Given any FR or ES page, then no second-person informal verb form (`tu` / `tú`) appears
- [ ] Given `/es/entities.html`, then table row data is Spanish, not English

**R7. Layout integrity in longer locales**
- No text overflow, clipping, or wrap-induced breakage in FR/ES at 1920×1080 and at the 768px mobile breakpoint.
- Highest-risk surfaces: fixed-width sidebar nav items, button labels, table headers, and stat-card labels.

*Acceptance:*
- [ ] Given every FR and ES page at both viewports, then no element's `scrollWidth` exceeds its `clientWidth` in the sidebar or header
- [ ] Given the longest FR nav label, then it wraps or is accommodated by CSS rather than clipped
- [ ] Given a Playwright screenshot of each of the 33 pages, then a reviewer confirms no visual regression against the English baseline

### P1 — Should have

**R8. Language preference persists**
- Clicking a toggle segment writes `localStorage.portalLang`.
- On loading a **root (English)** page, if `portalLang` is `fr` or `es`, redirect to the equivalent page in that locale.
- **No redirect on first visit** — absent a stored preference, English root is the entry point.
- **Escape hatch:** `?lang=en` on any URL clears the stored preference and pins English for the session, so a presenter can never be trapped in a locale a previous viewer chose.

*Acceptance:*
- [ ] Given no stored preference, when `/index.html` loads, then no redirect occurs
- [ ] Given `portalLang=es`, when `/entities.html` loads, then the browser lands on `/es/entities.html`
- [ ] Given `portalLang=es`, when `/index.html?lang=en` loads, then English renders and the preference is cleared
- [ ] Given the redirect fires, then no infinite loop occurs (the locale page must not redirect again)

**R9. Locale-aware formatting** — apply `Intl.NumberFormat` / `Intl.DateTimeFormat` with the page locale on the pages that render numbers and dates (`general-report.html` uses `toLocaleString`; thousands separators differ: `1,234` EN vs `1 234` FR vs `1.234` ES).

**R10. `npm run` scripts** — `i18n:extract`, `i18n:build`, `i18n:check`, `test`, so the workflow is discoverable without reading this spec.

**R11. Translator-facing progress report** — `i18n:check` prints per-locale, per-page completion (`fr/skill-gap: 168/171`) so remaining work is visible at a glance.

### P2 — Future considerations (design for, do not build)

- **Portuguese (`/pt`)** — the locale list must be a config array, so adding `pt` is `+1 entry, +12 catalogs`, zero code change.
- **`hreflang` and canonical link tags** for search engines, if the prototype ever becomes a public site.
- **Per-locale screenshot capture** — generalize `capture_screenshots.js` to loop locales and write `screenshots/{locale}/`.
- **Pluralization rules** — no current string pluralizes on a count. If one is added, ICU MessageFormat rather than string concatenation.

---

## Implementation Plan (TDD)

**The Iron Law: no production code without a failing test first.** Every step below is Red → verify Red → Green → verify Green → Refactor.

**Runners:** `node:test` (built-in, no new dependency) for the generator and catalogs; existing `playwright` for end-to-end and visual checks.

### Phase 0 — Harness (~0.5 day)
Fixtures first: a `tests/fixtures/mini.html` with two text nodes, one `title` attribute, one `STR` block, and one toggle. Every generator test runs against fixtures, not the real 11 pages, so tests stay fast and intent-revealing.

### Phase 1 — Catalog layer (~1 day)

| # | Test (RED) | Implements |
|---|---|---|
| 1 | validator rejects a stale key | R1 |
| 2 | validator rejects placeholder mismatch | R1 |
| 3 | validator rejects an empty value | R1 |
| 4 | extractor lists exactly the translatable strings in the fixture | R2 |
| 5 | extractor omits do-not-translate entries | R2 |
| 6 | re-extraction preserves existing translations | R2 |
| 7 | strings on ≥ 8 of 11 pages land in `common`, not per-page | R2 |

### Phase 2 — Generator (~1.5 days)

| # | Test (RED) | Implements |
|---|---|---|
| 8 | text node is replaced from the catalog | R3 |
| 9 | page catalog overrides `common` on the same key | R3 |
| 10 | whitelisted attributes are translated; others untouched | R3 |
| 11 | `<html lang>` and `<title>` are set per locale | R3 |
| 12 | `STR` block is replaced; surrounding JS is byte-identical | R3 |
| 13 | `fmt()` interpolates a reordered placeholder correctly | R3 |
| 14 | toggle hrefs are correct from root, `/fr`, and `/es` | R5 |
| 15 | active segment matches the output locale | R5 |
| 16 | build is idempotent (two runs, identical checksums) | R3 |
| 17 | orphaned output page is removed when its English source is deleted | R3 |

### Phase 3 — Coverage gate (~0.5 day)
Test 18 is the one that makes the rest safe: **given a deliberately incomplete catalog, the build exits non-zero and names the offending string and file.** Write it before translating a single string — it will fail for all 996 translations at first, and that failure count *is* the progress bar for Phase 4.

| # | Test (RED) | Implements |
|---|---|---|
| 18 | incomplete catalog → non-zero exit, string and file named | R4 |
| 19 | complete catalogs → zero findings | R4 |
| 20 | do-not-translate entries are not flagged as leftovers | R4 |

### Phase 4 — Translation (~2–3 days, the bulk of the effort)
Glossary and do-not-translate list first, then translate to green. Test 18 goes from ~996 findings to 0. Work page by page, most-demoed first: `index` → `entities` → `skill-gap` → `jobs-applications` → the rest.

**Volume:** 498 unique strings × 2 locales = **996 translations**, plus ~65 JS strings × 2. Roughly **51% of raw text nodes are duplicates** (1,021 total → 498 unique), and the shared shell is byte-identical across pages — so `common.*.json` clears a large share early and per-page work shrinks fast after the first page.

### Phase 5 — End-to-end and visual (~1 day)

| # | Test (RED) | Implements |
|---|---|---|
| 21 | all 33 pages load with zero console errors | R3 |
| 22 | every internal link on every page resolves (no 404 / no bad `file://` path) | R5 |
| 23 | toggle from `/fr/skill-gap.html` → ES lands on `/es/skill-gap.html` | R5 |
| 24 | no sidebar/header overflow (`scrollWidth > clientWidth`) at 1920 and 768 | R7 |
| 25 | 33-page screenshot set captured for review | R7 |

### Phase 6 — Persistence (P1, ~0.5 day)

| # | Test (RED) | Implements |
|---|---|---|
| 26 | no stored preference → no redirect | R8 |
| 27 | `portalLang=es` on a root page → redirect to `/es/…` | R8 |
| 28 | `?lang=en` clears the preference and pins English | R8 |
| 29 | redirect never loops | R8 |

**Total: ~7–8 days**, of which translation is roughly half. Phases 1–3 are pure Node and can proceed in parallel with glossary agreement.

---

## Success Metrics

**Leading (verifiable at merge)**
| Metric | Target |
|---|---|
| Untranslated strings in FR/ES builds | **0** (build gate, R4) |
| Pages available per locale | 11 / 11 / 11 |
| Console errors across 33 pages | 0 |
| Broken internal links | 0 |
| Layout overflow findings | 0 |
| Generator test suite | 100% passing, every test having failed first |

**Lagging (post-launch)**
| Metric | Target | How measured |
|---|---|---|
| Demos conducted in FR or ES | ≥ 1 within 30 days | Presenter report |
| Language-support objections raised in demo | 0 | Demo notes |
| Time to propagate an English copy edit to all locales | < 5 min | One `npm run i18n:build` + translating the changed key only |
| Locale drift incidents (FR/ES stale vs EN) | 0 | Build gate makes this structurally impossible |

---

## Open Questions

**Blocking — needed before Phase 4**
1. **Who validates translation quality?** Machine translation is adequate for a prototype but will read as machine-translated to a native Spanish-speaking ministry audience — the exact audience this is for. Is a native reviewer available, at least for `index`, `entities`, and `skill-gap`? *(Owner: stakeholder)*
2. **Should Spanish be the default rather than English?** Spanish is Equatorial Guinea's primary language of government. English at root is assumed here because it is the current source, but if the ministry is the main audience, `/` serving Spanish with `/en` and `/fr` as alternates may be the more credible framing. This inverts the folder layout. *(Owner: stakeholder — cheap to decide now, expensive later)*

**Non-blocking — resolve during implementation**
3. Do demo **person names** (María Esono, Pedro Nsue) and **employer names** stay fixed across locales, or should they vary to feel locally authentic? Assumption: fixed, on the do-not-translate list. *(Owner: design)*
4. Should `/fr` and `/es` be **committed to git** or generated at deploy time? Committing keeps `file://` and Vercel deployment trivially working and makes translation diffs reviewable; it also adds 22 generated files to the repo. Assumption: commit them, with a header comment marking them generated. *(Owner: engineering)*
5. Does Vercel need a `vercel.json` rewrite so `/fr/` serves `/fr/index.html`? Default static behavior should handle it — verify on first deploy. *(Owner: engineering)*
6. `index.html` carries 349 `data-hf-id` attributes from Hyperframes; the other 10 pages have none. Confirm the generator must **preserve** these attributes byte-for-byte so Hyperframes editing of the English source keeps working. Assumption: preserve. *(Owner: engineering)*

---

## Timeline Considerations

- **No hard external deadline identified.** If a ministry demo date exists, it should be stated — it determines whether P1 persistence ships in v1 or after.
- **Critical path is translation (Phase 4), not tooling.** Phases 1–3 are ~3 days of Node work and are fully testable against fixtures. If a native reviewer is involved, engage them at the start of Phase 3 so review overlaps generator work rather than following it.
- **Question 2 (Spanish as default) is timeline-relevant.** Deciding it before Phase 1 costs nothing; deciding it after Phase 4 means reworking the folder layout, every toggle href, and the redirect logic.
- **Suggested phasing if time is short:** P0 alone is a complete, demonstrable feature — three languages, working toggle, no untranslated text. R8 persistence, R9 formatting, and R11 reporting are genuine fast-follows that no demo depends on.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Machine translation reads as machine-translated to native speakers | Undermines the credibility the feature exists to build | Glossary first; native review of the three most-demoed pages (Q1) |
| French/Spanish text 15–25% longer breaks the fixed-width sidebar | Visible layout breakage mid-demo | R7 overflow test at both breakpoints, in CI, before translation is finished |
| Same English string needs different translations in different contexts | Wrong word appears in one place | Page catalog overrides `common`; `data-i18n-ctx` for same-page conflicts; extractor reports candidates |
| Generator corrupts inline JavaScript | Pages break silently | Generator replaces only the delimited `STR` block, never arbitrary JS; test 12 asserts surrounding JS is byte-identical |
| Someone hand-edits `/fr/*.html` and the next build discards it | Lost work, confusion | Generated-file header comment; `/fr` and `/es` wiped each build; note in README |
| Stored language preference surprises a presenter | Demo starts in the wrong language | No redirect without an explicit prior click; `?lang=en` escape hatch (R8) |
