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
