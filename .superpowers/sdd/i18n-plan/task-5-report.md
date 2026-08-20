# Task 5 Report: Coverage Checker and Progress Reporter

**Status:** DONE  
**Date:** 2026-08-17  
**Files:** `tools/check-i18n.js`, `tests/coverage-check.test.js`

---

## 1. What Was Implemented

Implemented `tools/check-i18n.js` to serve as the automated coverage safety net and progress reporter according to requirements R4 and R11:

1. **Precise String Location Tracking (`extractStringsWithLocations`):**
   - Accurately tokenizes HTML tags, text nodes, whitelisted attributes (`title`, `aria-label`, `placeholder`, `alt`, and `<meta name="description">` content), and dynamic strings in `/* i18n:STR:start */ ... /* i18n:STR:end */` blocks.
   - Calculates 1-indexed source line numbers for each translatable string.
   - Respects `data-i18n-ignore` and the `do-not-translate.json` token list.

2. **Per-Page Coverage Checker (`checkPageCoverage`):**
   - Assesses each translatable string against `{page catalog} ∪ {common catalog}`.
   - Verifies whether every translatable string has a valid non-empty translation.
   - Identifies and reports specific missing strings with line numbers: `[locale]/[page].html: line [L] - "[string]"`.
   - Computes integer percentage coverage: `Math.round((translatedCount / totalStrings) * 100)`.

3. **Multi-Page & Multi-Locale Aggregator (`checkAllCoverage`):**
   - Iterates across all pages and target locales (`fr`, `es`).
   - Returns `{ overallCoverage, localeReports, allPassed, errors }`.
   - Provides granular per-page stats, per-locale totals, and total system coverage statistics.

4. **Human-Readable Formatter & CLI Execution (`formatCoverageReport`):**
   - Formats clean console output e.g. `fr/skill-gap.html: 168/171 (98%)`.
   - CLI flags `--src`, `--gen`, `--i18n`, `--pages`, `--locales`, `--silent`.
   - Exits with return code `0` when coverage is 100%, and non-zero `1` if any untranslated string or gap exists.

---

## 2. Testing and Test Results

### Test Suite: `tests/coverage-check.test.js`
- **Line Number Tracking:** Verifies accurate 1-indexed line numbers for HTML titles, h1 text nodes, meta descriptions, input placeholders, and STR block entries.
- **Spec Test 18 (R4):** Rejects untranslated strings in generated output, detailing exact line numbers and filenames.
- **Spec Test 19 (R4):** Passes when all translatable strings are translated or present in `do-not-translate.json`.
- **DNT Suppression:** Ignores proper nouns and currencies without flagging them as untranslated.
- **Spec Test 20 (R11):** Coverage output displays per-page, per-locale, and total overall stats accurately with missing line details.
- **Full Localization:** Returns `allPassed: true` and 0 errors when all pages and locales are 100% complete.
- **CLI Exits:** Process exits with `1` on incomplete translations and `0` on 100% complete translations.

### Test Execution Summary
- `node --test tests/coverage-check.test.js`: **8/8 tests passed** (100%).
- `node --test` (all test suites): **92/92 tests passed** across `catalog-validator.test.js`, `english-source-integrity.test.js`, `extractor.test.js`, `generator.test.js`, and `coverage-check.test.js`.

---

## 3. TDD Evidence

1. **Red Phase:** Created `tests/coverage-check.test.js` covering Spec Tests 18, 19, 20, line number pinpointing, and CLI execution. Observed RED failure due to missing module.
2. **Green Phase:** Created `tools/check-i18n.js` with full tokenization, line indexing, per-page checking, multi-locale aggregation, CLI runner, and formatting.
3. **Refactor & Verification:** Verified all 8 coverage tests and the complete 92-test repository suite pass cleanly with zero warnings or regressions.

---

## 4. Files Changed / Created

- **Created:**
  - `tools/check-i18n.js`
  - `tests/coverage-check.test.js`
  - `.superpowers/sdd/i18n-plan/task-5-report.md`

---

## 5. Self-Review Findings

- Accurate line number calculation handles multi-line attributes, STR blocks, and interleaved markup.
- Coverage calculation accurately excludes proper nouns and DNT list entries.
- CLI exit codes match standard CI/CD expectations for automated build pipelines.

---

## 6. Issues or Concerns

- None. Ready for Task 6: Glossary, Do-not-translate list, and Complete Translations for all 11 pages.
