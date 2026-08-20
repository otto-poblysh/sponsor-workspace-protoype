#!/usr/bin/env node

/**
 * tools/check-i18n.js
 *
 * Automated coverage checker and progress reporter (R4, R11):
 * - Scans every generated page in /fr and /es against original English strings.
 * - Rejects any untranslated English string remaining in the generated output, excluding do-not-translate.json.
 * - Exits with non-zero exit code if any untranslated string or catalog gap exists,
 *   detailing `[locale]/[page].html: line [L] - "[string]"`.
 * - Outputs per-page and per-locale progress stats (e.g. `fr/skill-gap: 168/171 (98%)`).
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadDoNotTranslate, isTranslatable } = require('./extract-i18n.js');
const { loadCatalog, DEFAULT_PROTOTYPE_PAGES } = require('./build-i18n.js');

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const WHITELISTED_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt']);

/**
 * Unescapes HTML entities.
 */
function unescapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Unescapes JavaScript string literals.
 */
function unescapeJsString(raw) {
  if (!raw) return '';
  try {
    return (0, eval)(`"${raw.replace(/"/g, '\\"')}"`);
  } catch {
    return raw
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

/**
 * Calculates 1-indexed line number for a character index in a string.
 */
function getLineNumber(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === '\n') {
      line++;
    }
  }
  return line;
}

/**
 * Extracts translatable strings from HTML along with their 1-indexed line numbers.
 * @param {string} htmlContent
 * @param {Set<string>} [doNotTranslateSet]
 * @returns {Array<{ string: string, line: number }>}
 */
function extractStringsWithLocations(htmlContent, doNotTranslateSet = new Set()) {
  const results = [];
  const seenStrings = new Set();

  function record(str, line) {
    const trimmed = str.trim();
    if (trimmed.length > 0 && isTranslatable(trimmed, doNotTranslateSet)) {
      if (!seenStrings.has(trimmed)) {
        seenStrings.add(trimmed);
        results.push({ string: trimmed, line });
      }
    }
  }

  // 1. Dynamic strings in /* i18n:STR:start */ ... /* i18n:STR:end */ blocks
  const strBlockRegex = /\/\*\s*i18n:STR:start\s*\*\/([\s\S]*?)\/\*\s*i18n:STR:end\s*\*\//g;
  let strMatch;
  while ((strMatch = strBlockRegex.exec(htmlContent)) !== null) {
    const blockContent = strMatch[1];
    const blockOffset = strMatch.index + strMatch[0].indexOf(blockContent);
    const kvRegex = /(?:['"`]?([a-zA-Z0-9_$]+)['"`]?\s*:\s*)?(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;
    let kvMatch;
    while ((kvMatch = kvRegex.exec(blockContent)) !== null) {
      const rawVal = kvMatch[2] ?? kvMatch[3] ?? kvMatch[4];
      if (rawVal !== undefined) {
        const val = unescapeJsString(rawVal);
        const matchPos = blockOffset + kvMatch.index;
        const line = getLineNumber(htmlContent, matchPos);
        record(val, line);
      }
    }
  }

  // 2. Tokenize HTML
  let index = 0;
  const len = htmlContent.length;
  let ignoreDepth = 0;

  while (index < len) {
    const nextLt = htmlContent.indexOf('<', index);

    if (nextLt === -1) {
      if (ignoreDepth === 0) {
        const text = htmlContent.slice(index);
        const unesc = unescapeHtml(text);
        const line = getLineNumber(htmlContent, index);
        record(unesc, line);
      }
      break;
    }

    if (nextLt > index && ignoreDepth === 0) {
      const text = htmlContent.slice(index, nextLt);
      const unesc = unescapeHtml(text);
      const line = getLineNumber(htmlContent, index);
      record(unesc, line);
    }

    index = nextLt;

    // Comments
    if (htmlContent.startsWith('<!--', index)) {
      const closeComment = htmlContent.indexOf('-->', index + 4);
      index = closeComment === -1 ? len : closeComment + 3;
      continue;
    }

    // DOCTYPE
    if (htmlContent.startsWith('<!', index)) {
      const closeGt = htmlContent.indexOf('>', index + 2);
      index = closeGt === -1 ? len : closeGt + 1;
      continue;
    }

    // Closing tags
    if (htmlContent.startsWith('</', index)) {
      const closeGt = htmlContent.indexOf('>', index + 2);
      const tagContent = htmlContent.slice(index + 2, closeGt === -1 ? len : closeGt).trim().toLowerCase();
      if (tagContent === 'script' || tagContent === 'style') {
        // handled
      }
      if (ignoreDepth > 0) {
        ignoreDepth--;
      }
      index = closeGt === -1 ? len : closeGt + 1;
      continue;
    }

    // Opening tags
    const closeGt = htmlContent.indexOf('>', index + 1);
    if (closeGt === -1) {
      break;
    }

    const tagFull = htmlContent.slice(index, closeGt + 1);
    const tagMatch = tagFull.match(/^<([a-zA-Z0-9-]+)/);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
    const isSelfClosing = tagFull.endsWith('/>') || VOID_ELEMENTS.has(tagName);
    const isIgnore = tagFull.includes('data-i18n-ignore');

    if (isIgnore && !isSelfClosing) {
      ignoreDepth++;
    }

    // Attribute extraction
    if (ignoreDepth === 0) {
      const isMetaDesc = tagName === 'meta' && /name\s*=\s*["']description["']/i.test(tagFull);
      const attrRegex = /([a-zA-Z0-9-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(tagFull)) !== null) {
        const attrName = aMatch[1].toLowerCase();
        const attrVal = aMatch[2] ?? aMatch[3] ?? aMatch[4] ?? '';
        if (WHITELISTED_ATTRS.has(attrName) || (isMetaDesc && attrName === 'content')) {
          const unesc = unescapeHtml(attrVal);
          const line = getLineNumber(htmlContent, index + aMatch.index);
          record(unesc, line);
        }
      }
    }

    index = closeGt + 1;

    // Script/Style blocks
    if (tagName === 'script' || tagName === 'style') {
      const closeTag = `</${tagName}>`;
      const endPos = htmlContent.toLowerCase().indexOf(closeTag, index);
      index = endPos === -1 ? len : endPos + closeTag.length;
    }
  }

  return results;
}

/**
 * Checks translation coverage of a single page against catalogs.
 * @param {string} enHtmlContent
 * @param {string} generatedHtmlContent
 * @param {object} options
 * @returns {object}
 */
function checkPageCoverage(enHtmlContent, generatedHtmlContent, options = {}) {
  const {
    locale = 'fr',
    pageName = 'page.html',
    doNotTranslateSet = new Set(),
    pageCatalog = {},
    commonCatalog = {}
  } = options;

  const extractedStrings = extractStringsWithLocations(enHtmlContent, doNotTranslateSet);
  const totalStrings = extractedStrings.length;
  const untranslatedStrings = [];
  let translatedCount = 0;

  for (const item of extractedStrings) {
    const enStr = item.string;
    const translation = pageCatalog[enStr] ?? commonCatalog[enStr];

    if (translation !== undefined && typeof translation === 'string' && translation.trim().length > 0) {
      translatedCount++;
    } else {
      untranslatedStrings.push({
        string: enStr,
        line: item.line
      });
    }
  }

  const coveragePercent = totalStrings === 0 ? 100 : Math.round((translatedCount / totalStrings) * 100);

  return {
    locale,
    pageName,
    totalStrings,
    translatedCount,
    untranslatedStrings,
    coveragePercent,
    isComplete: untranslatedStrings.length === 0
  };
}

/**
 * Checks coverage across all pages and locales.
 * @param {object} options
 * @returns {object}
 */
function checkAllCoverage(options = {}) {
  const rootDir = options.srcDir || process.cwd();
  const genDir = options.genDir || rootDir;
  const i18nDir = options.i18nDir || path.join(rootDir, 'i18n');
  const locales = options.locales || ['fr', 'es'];
  const pages = options.pages || DEFAULT_PROTOTYPE_PAGES;
  const doNotTranslateSet = options.doNotTranslateSet || loadDoNotTranslate(path.join(i18nDir, 'do-not-translate.json'));

  const localeReports = {};
  const errors = [];
  let totalOverallStrings = 0;
  let totalOverallTranslated = 0;

  for (const locale of locales) {
    const commonCatalogPath = path.join(i18nDir, `common.${locale}.json`);
    const commonCatalog = loadCatalog(commonCatalogPath);

    let localeTotalStrings = 0;
    let localeTranslatedCount = 0;
    const pageReports = {};
    const localeErrors = [];

    for (const pageName of pages) {
      const srcPath = path.join(rootDir, pageName);
      if (!fs.existsSync(srcPath)) {
        continue;
      }

      const enHtmlContent = fs.readFileSync(srcPath, 'utf-8');
      const baseName = path.basename(pageName, '.html');
      const pageCatalogPath = path.join(i18nDir, `${baseName}.${locale}.json`);
      const pageCatalog = loadCatalog(pageCatalogPath);

      const genPagePath = path.join(genDir, locale, pageName);
      const generatedHtmlContent = fs.existsSync(genPagePath) ? fs.readFileSync(genPagePath, 'utf-8') : '';

      const pageReport = checkPageCoverage(enHtmlContent, generatedHtmlContent, {
        locale,
        pageName,
        doNotTranslateSet,
        pageCatalog,
        commonCatalog
      });

      pageReports[pageName] = pageReport;
      localeTotalStrings += pageReport.totalStrings;
      localeTranslatedCount += pageReport.translatedCount;

      for (const untranslated of pageReport.untranslatedStrings) {
        const errMsg = `${locale}/${pageName}: line ${untranslated.line} - "${untranslated.string}"`;
        localeErrors.push(errMsg);
        errors.push(errMsg);
      }
    }

    const localeCoveragePercent = localeTotalStrings === 0 ? 100 : Math.round((localeTranslatedCount / localeTotalStrings) * 100);

    localeReports[locale] = {
      locale,
      totalStrings: localeTotalStrings,
      translatedCount: localeTranslatedCount,
      coveragePercent: localeCoveragePercent,
      pages: pageReports,
      errors: localeErrors,
      untranslatedCount: localeErrors.length,
      isComplete: localeErrors.length === 0
    };

    totalOverallStrings += localeTotalStrings;
    totalOverallTranslated += localeTranslatedCount;
  }

  const overallCoveragePercent = totalOverallStrings === 0 ? 100 : Math.round((totalOverallTranslated / totalOverallStrings) * 100);

  return {
    allPassed: errors.length === 0,
    errors,
    overallCoverage: {
      totalStrings: totalOverallStrings,
      translatedCount: totalOverallTranslated,
      coveragePercent: overallCoveragePercent
    },
    localeReports
  };
}

/**
 * Formats coverage report as a human-readable string.
 * @param {object} result
 * @returns {string}
 */
function formatCoverageReport(result) {
  const lines = [];
  lines.push('=== Translation Coverage Report ===\n');

  for (const [locale, report] of Object.entries(result.localeReports)) {
    lines.push(`Locale: [${locale.toUpperCase()}]`);
    for (const [pageName, pReport] of Object.entries(report.pages)) {
      lines.push(`  - ${locale}/${pageName}: ${pReport.translatedCount}/${pReport.totalStrings} (${pReport.coveragePercent}%)`);
    }
    lines.push(`  > ${locale} Total: ${report.translatedCount}/${report.totalStrings} (${report.coveragePercent}%)\n`);
  }

  const ov = result.overallCoverage;
  lines.push(`Overall: ${ov.translatedCount}/${ov.totalStrings} (${ov.coveragePercent}%)`);

  if (result.errors.length > 0) {
    lines.push(`\nUntranslated String Gaps (${result.errors.length}):`);
    for (const err of result.errors) {
      lines.push(`  ✖ ${err}`);
    }
  } else {
    lines.push('\n✓ All pages and locales are 100% translated.');
  }

  return lines.join('\n');
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  let srcDir = process.cwd();
  let genDir = process.cwd();
  let i18nDir = path.join(process.cwd(), 'i18n');
  let pages = DEFAULT_PROTOTYPE_PAGES;
  let locales = ['fr', 'es'];
  let silent = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) {
      const { resolveSite } = require('./build-i18n.js');
      const s = resolveSite(['--site', args[++i]]);
      srcDir = s.srcDir;
      genDir = s.outDir;
      i18nDir = s.i18nDir;
      pages = fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort();
    } else if (args[i] === '--src' && args[i + 1]) {
      srcDir = args[++i];
    } else if (args[i] === '--gen' && args[i + 1]) {
      genDir = args[++i];
    } else if (args[i] === '--i18n' && args[i + 1]) {
      i18nDir = args[++i];
    } else if (args[i] === '--pages' && args[i + 1]) {
      pages = args[++i].split(',');
    } else if (args[i] === '--locales' && args[i + 1]) {
      locales = args[++i].split(',');
    } else if (args[i] === '--silent') {
      silent = true;
    }
  }

  const result = checkAllCoverage({
    srcDir,
    genDir,
    i18nDir,
    locales,
    pages
  });

  if (!silent) {
    console.log(formatCoverageReport(result));
  }

  if (result.allPassed) {
    process.exit(0);
  } else {
    if (!silent) {
      console.error(`\nCoverage check failed with ${result.errors.length} untranslated string(s).`);
    }
    process.exit(1);
  }
}

module.exports = {
  extractStringsWithLocations,
  checkPageCoverage,
  checkAllCoverage,
  formatCoverageReport
};
