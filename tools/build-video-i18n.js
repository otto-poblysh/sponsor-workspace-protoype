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

function buildVideoLocale({ srcDir, outDir, i18nDir, locale }) {
  const common = loadCatalog(path.join(i18nDir, `common.${locale}.json`));
  const video = loadCatalog(path.join(i18nDir, `video.${locale}.json`));
  const dnt = loadDoNotTranslate(path.join(i18nDir, 'do-not-translate.json'));

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'compositions'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });

  const generatedFiles = [];

  // Host composition: no portal markup, but carries <html lang> and the title.
  const hostSrc = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
  const hostOut = translateHtml(hostSrc, {
    catalog: { ...common, ...video },
    doNotTranslate: dnt,
    locale,
    rewriteToggle: false
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), GENERATED_HEADER + hostOut, 'utf8');
  generatedFiles.push('index.html');

  for (const [file, pageName] of Object.entries(BEAT_CATALOG_MAP)) {
    const src = fs.readFileSync(path.join(srcDir, 'compositions', file), 'utf8');
    const page = pageName ? loadCatalog(path.join(i18nDir, `${pageName}.${locale}.json`)) : {};
    const catalog = { ...common, ...page, ...video };

    let out = translateHtml(src, {
      catalog,
      doNotTranslate: dnt,
      locale,
      rewriteToggle: false
    });

    // Subtitles live outside i18n:STR blocks; strict so a gap fails the build.
    out = translateSubtitles(out, video, { strict: true }).html;

    fs.writeFileSync(path.join(outDir, 'compositions', file), GENERATED_HEADER + out, 'utf8');
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
  const root = process.cwd();
  const result = buildVideoLocale({
    srcDir: path.join(root, 'tutorial-video'),
    outDir: path.join(root, `tutorial-video-${locale}`),
    i18nDir: path.join(root, 'i18n'),
    locale
  });
  console.log(
    `✓ tutorial-video-${locale}: ${result.generatedFiles.length} compositions, ` +
    `${result.copiedAssets.length} assets copied.`
  );
}

module.exports = { buildVideoLocale, BEAT_CATALOG_MAP };
