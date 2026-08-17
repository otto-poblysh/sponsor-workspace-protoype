# SDD ledger — plan: docs/i18n-plan.md

## Tasks
- [x] Task 1: Test harness, fixtures, and catalog validator
- [x] Task 2: Extractor tool
- [x] Task 3: Refactor 11 English source pages with STR blocks and language toggle
- [x] Task 4: Generator tool (HTML, attributes, metadata, JS STR, toggle rewriting)
- [x] Task 5: Coverage checker and progress reporter
- [x] Task 6: Glossary, Do-not-translate list, and Complete Translations for all 11 pages
- [x] Task 7: Language persistence and locale-aware formatting (P1)
- [x] Task 8: End-to-end testing, npm scripts, layout checks, and final build validation

## Log
- Task 1: complete (commits 483d23f..4a8965b, review clean)
- Task 2: complete (commits 4a8965b..7efa220, review clean)
- Task 3: complete (commits 7efa220..ca920c8, review clean)
- Task 4: complete (commits ca920c8..c7633c1, review clean)
- Task 5: complete (commits c7633c1..e4d4792, review clean)
- Task 6: complete (commits e4d4792..8f24e57, review clean)
- Task 7: complete (commits 8f24e57..f36e926, review clean)
- Task 8: complete (commits pending, review clean)
- 2026-08-17: Task 1 completed. Implemented test fixtures (mini.html, 4 catalog fixtures), tools/validate-catalogs.js, and tests/catalog-validator.test.js (11/11 tests passing).
- 2026-08-17: Task 2 completed. Implemented tools/extract-i18n.js, i18n/do-not-translate.json, and tests/extractor.test.js (8/8 tests passing).
- 2026-08-17: Task 3 completed. Refactored all 11 English source HTML pages with language toggle markup, CSS styles, hoisted STR blocks, and tests/english-source-integrity.test.js (54/54 tests passing).
- 2026-08-17: Task 4 completed. Implemented tools/build-i18n.js and tests/generator.test.js covering Spec Tests 8-17 (11/11 tests passing, 84/84 across full suite).
- 2026-08-17: Task 5 completed. Implemented tools/check-i18n.js and tests/coverage-check.test.js covering Spec Tests 18-20 (8/8 tests passing, 92/92 across full suite).
- 2026-08-17: Task 6 completed. Created i18n/glossary.md, updated i18n/do-not-translate.json, and authored 100% complete French and Spanish translations across 24 catalogs (1,540/1,540 strings translated, 100% coverage in FR and ES).
- 2026-08-17: Task 7 completed. Implemented client-side language preference persistence (`localStorage.portalLang`), auto-redirect routing on root pages, `?lang=en` escape hatch, loop prevention on localized trees, locale-aware date/number formatting (R8, R9), and tests/persistence.test.js (34/34 tests passing, 126/126 across full suite).
- 2026-08-17: Task 8 completed. Added standard npm scripts in package.json (R10), created playwright.config.js, implemented tests/e2e-i18n.spec.js covering Spec Tests 21-25 across all 33 pages (149/149 E2E tests passing, 126/126 unit/integration tests passing).
