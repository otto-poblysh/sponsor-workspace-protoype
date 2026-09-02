#!/usr/bin/env node
'use strict';

/**
 * tools/build-video-i18n.js
 *
 * Generates tutorial-video-<locale>/ from tutorial-video/.
 * Language differs; timing, motion, ids, and assets do not.
 */

const fs = require('node:fs');
const path = require('node:path');
const { translateHtml, loadCatalog, loadDoNotTranslate } = require('./build-i18n.js');
const { translateSubtitles } = require('./lib/translate-subtitles.js');

/** Composition file -> page catalog basename. `null` = artwork, uses video catalog only. */
const BEAT_CATALOG_MAP = {
  'beat-00-intro.html': null,
  'beat-01-dashboard.html': 'index',
  'beat-02-verification.html': 'entities',
  'beat-03-skill-gap.html': 'skill-gap',
  'beat-04-reports.html': 'general-report',
  'beat-05-audit.html': 'activity-logs',
  'beat-06-outro.html': null
};

const ASSETS = ['bgm-icubefarm.mp3', 'bgm-african-classical.mp3', 'corporate_writing_grayscale.jpg'];

const GENERATED_HEADER = '<!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: tutorial-video/ -->\n';

/**
 * Per-locale CSS injected into a composition's <head> to absorb text expansion.
 * Copy-level fixes are always preferred; an entry here means no acceptable
 * shorter rendering existed. Keys are composition filenames.
 */
const LOCALE_STYLE_OVERRIDES = {
  // Empty: the 32px two-line intro title fits every locale, so no per-locale
  // shrink is needed. Add entries here if a future locale overflows.
};

/**
 * Prepends the generated-file banner *after* <!DOCTYPE html>.
 *
 * It must not come first: a comment before the doctype makes the HyperFrames
 * sub-composition loader treat the file as a fragment rather than a document,
 * which drops <meta charset="UTF-8"> and decodes the body as Latin-1 — every
 * accented character then renders as mojibake (e-acute becomes A-tilde + (c)).
 * This is also what the `root_composition_missing_html_wrapper` lint reports.
 */
function withGeneratedHeader(html) {
  const m = html.match(/^\uFEFF?\s*<!DOCTYPE html>[^\n]*\r?\n?/i);
  if (!m) return GENERATED_HEADER + html;
  return html.slice(0, m[0].length) + GENERATED_HEADER + html.slice(m[0].length);
}

function buildVideoLocale({ srcDir, outDir, i18nDir, locale, catalogMap = BEAT_CATALOG_MAP }) {
  const common = loadCatalog(path.join(i18nDir, `common.${locale}.json`));
  const video = loadCatalog(path.join(i18nDir, `video.${locale}.json`));
  const dnt = loadDoNotTranslate(path.join(i18nDir, 'do-not-translate.json'));
  dnt.delete("Pan-African Organization");


  fs.mkdirSync(outDir, { recursive: true });
  fs.rmSync(path.join(outDir, 'compositions'), { recursive: true, force: true });
  fs.rmSync(path.join(outDir, 'assets'), { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'compositions'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });

  const generatedFiles = [];

  // Host composition: no portal markup, but carries <html lang> and the title.
  const hostSrc = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
  const hostOut = translateHtml(hostSrc, {
    pageCatalog: { ...common, ...video },
    doNotTranslateSet: dnt,
    locale,
    rewriteToggle: false,
    headerComment: false
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), withGeneratedHeader(hostOut), 'utf8');
  generatedFiles.push('index.html');

  for (const [file, pageName] of Object.entries(catalogMap)) {
    const src = fs.readFileSync(path.join(srcDir, 'compositions', file), 'utf8');
    const page = pageName ? loadCatalog(path.join(i18nDir, `${pageName}.${locale}.json`)) : {};
    const catalog = { ...common, ...page, ...video };

    let out = translateHtml(src, {
      pageCatalog: catalog,
      doNotTranslateSet: dnt,
      locale,
      rewriteToggle: false,
      headerComment: false
    });

    // Subtitles live outside i18n:STR blocks; strict so a gap fails the build.
    out = translateSubtitles(out, video, { strict: true }).html;

    const override = (LOCALE_STYLE_OVERRIDES[locale] || {})[file];
    if (override) {
      out = out.replace(/<\/head>/, `<style>${override}</style></head>`);
    }

    fs.writeFileSync(path.join(outDir, 'compositions', file), withGeneratedHeader(out), 'utf8');
    generatedFiles.push(`compositions/${file}`);
  }

  const copiedAssets = [];
  for (const a of ASSETS) {
    const from = path.join(srcDir, 'assets', a);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(outDir, 'assets', a));
    copiedAssets.push(a);
  }

  return { generatedFiles, copiedAssets };
}

if (require.main === module) {
  const locale = process.argv[2];
  if (!locale) {
    console.error('Usage: node tools/build-video-i18n.js <locale>   e.g. fr');
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const i = args.indexOf(name);
    return i !== -1 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
  };
  const root = process.cwd();
  const srcDir = flag('--src', path.join(root, 'tutorial-video'));
  const outBase = flag('--out', root);
  const i18nDir = flag('--i18n', path.join(root, 'i18n'));
  const outDir = path.join(outBase, `${path.basename(srcDir).replace(/-en$/, '')}-${locale}`);
  const hasCorp = fs.existsSync(path.join(srcDir, 'compositions/beat-03-integrations.html'));
  const hasPublicAdmin = fs.existsSync(path.join(srcDir, 'compositions/beat-02-agencies.html'));
  const hasMembers = fs.existsSync(path.join(srcDir, 'compositions/beat-02-members.html'));
  const catalogMap = hasCorp ? {
    'beat-00-intro.html': null,
    'beat-01-dashboard.html': 'index',
    'beat-02-subsidiaries.html': 'entities',
    'beat-03-integrations.html': 'integrations',
    'beat-04-skill-gap.html': 'skill-gap',
    'beat-05-audit.html': 'activity-logs',
    'beat-06-outro.html': null
  } : (hasPublicAdmin ? {
    'beat-00-intro.html': null,
    'beat-01-dashboard.html': 'index',
    'beat-02-agencies.html': 'agencies',
    'beat-03-skill-gap.html': 'skill-gap',
    'beat-04-audit.html': 'activity-logs',
    'beat-05-outro.html': null
  } : (hasMembers ? {
    'beat-00-intro.html': null,
    'beat-01-dashboard.html': 'index',
    'beat-02-members.html': 'entities',
    'beat-03-skill-gap.html': 'skill-gap',
    'beat-04-reports.html': 'general-report',
    'beat-05-audit.html': 'activity-logs',
    'beat-06-outro.html': null
  } : BEAT_CATALOG_MAP));
  const result = buildVideoLocale({ srcDir, outDir, i18nDir, locale, catalogMap });
  console.log(
    `✓ ${path.relative(root, outDir)}: ${result.generatedFiles.length} compositions, ` +
    `${result.copiedAssets.length} assets copied.`
  );
}

module.exports = { buildVideoLocale, BEAT_CATALOG_MAP, LOCALE_STYLE_OVERRIDES };

