#!/usr/bin/env node

/**
 * tools/extract-i18n.js
 *
 * Scans English HTML source files and extracts translatable strings into catalog skeletons (R2):
 * - Extracts visible text nodes (trimmed, non-empty, skipping <script>, <style>, and data-i18n-ignore).
 * - Extracts whitelisted attributes: title, aria-label, placeholder, alt, and <meta name="description"> content.
 * - Extracts dynamic strings inside /* i18n:STR:start * / ... /* i18n:STR:end * / blocks in scripts.
 * - Skips entries matching do-not-translate.json, pure numbers, currency symbols, and punctuation-only strings.
 * - Categorizes strings on >= 8 of 11 pages into common.[locale].json; others into [page].[locale].json.
 * - Merges new strings non-destructively into existing catalogs, preserving existing translations and key sorting.
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_PROTOTYPE_PAGES = [
  'index.html',
  'entities.html',
  'skill-gap.html',
  'jobs-applications.html',
  'general-report.html',
  'users-management.html',
  'activity-logs.html',
  'report-recipients.html',
  'notification-preferences.html',
  'tenant-branding.html',
  'supported-countries.html'
];

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

/**
 * Loads the do-not-translate list from a JSON file into a Set.
 * @param {string} filePath
 * @returns {Set<string>}
 */
function loadDoNotTranslate(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Set();
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch (err) {
    console.error(`Warning: Failed to load do-not-translate file from ${filePath}: ${err.message}`);
    return new Set();
  }
}

/**
 * Unescapes basic HTML entities.
 * @param {string} str
 * @returns {string}
 */
function unescapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

/**
 * Unescapes JavaScript string literals.
 * @param {string} str
 * @returns {string}
 */
function unescapeJsString(str) {
  if (!str) return '';
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

/**
 * Checks if a string is eligible for translation.
 * Omit if:
 * - Empty or whitespace-only
 * - Found in doNotTranslateSet
 * - Pure numbers, currency amounts, percentages, or punctuation-only
 * @param {string} str
 * @param {Set<string>} [doNotTranslateSet]
 * @returns {boolean}
 */
function isTranslatable(str, doNotTranslateSet = new Set()) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  const dntSet = doNotTranslateSet instanceof Set ? doNotTranslateSet : new Set(doNotTranslateSet || []);
  if (dntSet.has(trimmed)) return false;

  // Must contain at least one unicode letter character (\p{L})
  if (!/\p{L}/u.test(trimmed)) return false;

  // Exclude standalone currency amounts like "100 FCFA", "500 USD", "$100"
  if (/^(?:FCFA|XAF|USD|EUR|GBP)[\s\d,.\-+%]+$/i.test(trimmed) || /^[\s\d,.\-+%]+(?:FCFA|XAF|USD|EUR|GBP)$/i.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Parses attributes from an HTML element opening tag.
 * @param {string} attrString
 * @returns {Record<string, string>}
 */
function parseAttributes(attrString) {
  const attrs = {};
  if (!attrString) return attrs;

  const attrRegex = /([a-zA-Z0-9\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = attrRegex.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
    attrs[name] = unescapeHtml(value);
  }
  return attrs;
}

/**
 * Extracts all translatable strings from an HTML document string.
 * @param {string} htmlContent
 * @param {Set<string>} [doNotTranslateSet]
 * @param {object} [options]
 * @returns {Set<string>}
 */
function extractStringsFromHtml(htmlContent, doNotTranslateSet = new Set(), options = {}) {
  const extracted = new Set();
  const dntSet = doNotTranslateSet instanceof Set ? doNotTranslateSet : new Set(doNotTranslateSet || []);

  if (!htmlContent || typeof htmlContent !== 'string') {
    return extracted;
  }

  // 1. Extract dynamic strings from /* i18n:STR:start */ ... /* i18n:STR:end */
  const strBlockRegex = /\/\*\s*i18n:STR:start\s*\*\/([\s\S]*?)\/\*\s*i18n:STR:end\s*\*\//g;
  let blockMatch;
  while ((blockMatch = strBlockRegex.exec(htmlContent)) !== null) {
    const blockContent = blockMatch[1];
    const strLitRegex = /(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)/g;
    let litMatch;
    while ((litMatch = strLitRegex.exec(blockContent)) !== null) {
      const rawVal = litMatch[1] !== undefined ? litMatch[1] : (litMatch[2] !== undefined ? litMatch[2] : litMatch[3]);
      if (rawVal !== undefined) {
        const val = unescapeJsString(rawVal);
        if (isTranslatable(val, dntSet)) {
          extracted.add(val);
        }
      }
    }
  }

  // 2. Tokenize and parse HTML tags, attributes, and text nodes
  // Tokenizer pattern matches:
  // - HTML comments: <!-- ... -->
  // - <script ...> ... </script>
  // - <style ...> ... </style>
  // - HTML tags: <tagName attrs> or </tagName>
  // - Text nodes: [^<]+
  const tokenRegex = /<!--[\s\S]*?-->|<!DOCTYPE\b[^>]*>|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<(?:\/([a-zA-Z0-9\-]+)|([a-zA-Z0-9\-]+)((?:\s+[^"'/>\s=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>)|([^<]+)/gi;

  let ignoreDepth = 0;
  let tokenMatch;

  while ((tokenMatch = tokenRegex.exec(htmlContent)) !== null) {
    const fullMatch = tokenMatch[0];
    const closeTagName = tokenMatch[1];
    const openTagName = tokenMatch[2];
    const attrString = tokenMatch[3];
    const selfClosingSlash = tokenMatch[4];
    const textNode = tokenMatch[5];

    // Comments, doctype, scripts, styles
    if (fullMatch.startsWith('<!--') || fullMatch.toUpperCase().startsWith('<!DOCTYPE') || fullMatch.toLowerCase().startsWith('<script') || fullMatch.toLowerCase().startsWith('<style')) {
      continue;
    }

    // Closing tag: </tagName>
    if (closeTagName) {
      if (ignoreDepth > 0) {
        ignoreDepth--;
      }
      continue;
    }

    // Opening tag: <tagName attrs>
    if (openTagName) {
      const tagLower = openTagName.toLowerCase();
      const isVoid = VOID_ELEMENTS.has(tagLower) || selfClosingSlash === '/';
      const hasIgnoreAttr = /\bdata-i18n-ignore\b/i.test(attrString || '');

      if (ignoreDepth > 0) {
        if (!isVoid) {
          ignoreDepth++;
        }
        continue;
      }

      if (hasIgnoreAttr) {
        if (!isVoid) {
          ignoreDepth = 1;
        }
        continue;
      }

      if (ignoreDepth === 0) {
        const attrs = parseAttributes(attrString);

        // Whitelisted attributes: title, aria-label, placeholder, alt
        if (attrs['title'] && isTranslatable(attrs['title'], dntSet)) {
          extracted.add(attrs['title']);
        }
        if (attrs['aria-label'] && isTranslatable(attrs['aria-label'], dntSet)) {
          extracted.add(attrs['aria-label']);
        }
        if (attrs['placeholder'] && isTranslatable(attrs['placeholder'], dntSet)) {
          extracted.add(attrs['placeholder']);
        }
        if (attrs['alt'] && isTranslatable(attrs['alt'], dntSet)) {
          extracted.add(attrs['alt']);
        }

        // <meta name="description" content="...">
        if (tagLower === 'meta' && attrs['name'] && attrs['name'].toLowerCase() === 'description' && attrs['content']) {
          if (isTranslatable(attrs['content'], dntSet)) {
            extracted.add(attrs['content']);
          }
        }
      }
      continue;
    }

    // Text node
    if (textNode && ignoreDepth === 0) {
      const trimmed = unescapeHtml(textNode.trim());
      if (isTranslatable(trimmed, dntSet)) {
        extracted.add(trimmed);
      }
    }
  }

  return extracted;
}

/**
 * Extracts strings across all pages and splits them into common and page-specific catalogs.
 * Strings appearing on >= threshold pages land in common, not per-page.
 * @param {Record<string, string>} pagesMap Map of pageName -> htmlContent
 * @param {object} [options]
 * @param {number} [options.threshold] Default 8
 * @param {Set<string>} [options.doNotTranslateSet]
 * @returns {{ common: Set<string>, pages: Record<string, Set<string>>, allStrings: Set<string> }}
 */
function extractAllPages(pagesMap, options = {}) {
  const threshold = options.threshold !== undefined ? options.threshold : 8;
  const dntSet = options.doNotTranslateSet || new Set();

  const stringOccurrences = new Map(); // string -> Set of pageNames

  for (const [pageName, htmlContent] of Object.entries(pagesMap)) {
    const pageStrings = extractStringsFromHtml(htmlContent, dntSet, options);
    for (const str of pageStrings) {
      if (!stringOccurrences.has(str)) {
        stringOccurrences.set(str, new Set());
      }
      stringOccurrences.get(str).add(pageName);
    }
  }

  const common = new Set();
  const pages = {};

  for (const pageName of Object.keys(pagesMap)) {
    pages[pageName] = new Set();
  }

  for (const [str, pageNames] of stringOccurrences.entries()) {
    if (pageNames.size >= threshold) {
      common.add(str);
    } else {
      for (const pageName of pageNames) {
        pages[pageName].add(str);
      }
    }
  }

  return {
    common,
    pages,
    allStrings: new Set(stringOccurrences.keys())
  };
}

/**
 * Non-destructively writes or updates translation catalog skeletons.
 * Preserves existing translations and ensures alphabetical key sorting.
 * @param {{ common: Set<string>, pages: Record<string, Set<string>> }} extractedData
 * @param {string} i18nDir
 * @param {string[]} [locales] Default ['fr', 'es']
 * @param {object} [options]
 * @param {string} [options.defaultValue] Default ""
 * @returns {string[]} Written file paths
 */
function writeCatalogSkeletons(extractedData, i18nDir, locales = ['fr', 'es'], options = {}) {
  fs.mkdirSync(i18nDir, { recursive: true });
  const writtenFiles = [];
  const defaultValue = options.defaultValue !== undefined ? options.defaultValue : '';

  for (const locale of locales) {
    // 1. common.[locale].json
    const commonPath = path.join(i18nDir, `common.${locale}.json`);
    let existingCommon = {};
    if (fs.existsSync(commonPath)) {
      try {
        existingCommon = JSON.parse(fs.readFileSync(commonPath, 'utf-8'));
      } catch (_) {
        existingCommon = {};
      }
    }

    const mergedCommon = { ...existingCommon };
    for (const str of extractedData.common) {
      if (!(str in mergedCommon)) {
        mergedCommon[str] = defaultValue;
      }
    }

    const sortedCommon = {};
    for (const key of Object.keys(mergedCommon).sort()) {
      sortedCommon[key] = mergedCommon[key];
    }
    fs.writeFileSync(commonPath, JSON.stringify(sortedCommon, null, 2) + '\n', 'utf-8');
    writtenFiles.push(commonPath);

    // 2. [page].[locale].json
    for (const [pageFile, strings] of Object.entries(extractedData.pages)) {
      const baseName = path.basename(pageFile, '.html');
      const pagePath = path.join(i18nDir, `${baseName}.${locale}.json`);
      let existingPage = {};
      if (fs.existsSync(pagePath)) {
        try {
          existingPage = JSON.parse(fs.readFileSync(pagePath, 'utf-8'));
        } catch (_) {
          existingPage = {};
        }
      }

      const mergedPage = { ...existingPage };
      for (const str of strings) {
        if (!(str in mergedPage)) {
          mergedPage[str] = defaultValue;
        }
      }

      const sortedPage = {};
      for (const key of Object.keys(mergedPage).sort()) {
        sortedPage[key] = mergedPage[key];
      }
      fs.writeFileSync(pagePath, JSON.stringify(sortedPage, null, 2) + '\n', 'utf-8');
      writtenFiles.push(pagePath);
    }
  }

  return writtenFiles;
}

// CLI runner
if (require.main === module) {
  const rootDir = process.cwd();
  const i18nDir = path.join(rootDir, 'i18n');
  const dntPath = path.join(i18nDir, 'do-not-translate.json');
  const doNotTranslateSet = loadDoNotTranslate(dntPath);

  const pagesMap = {};
  for (const pageName of DEFAULT_PROTOTYPE_PAGES) {
    const fullPath = path.join(rootDir, pageName);
    if (fs.existsSync(fullPath)) {
      pagesMap[pageName] = fs.readFileSync(fullPath, 'utf-8');
    }
  }

  const pageCount = Object.keys(pagesMap).length;
  console.log(`Scanning ${pageCount} English HTML prototype pages...`);

  const extractedData = extractAllPages(pagesMap, {
    threshold: 8,
    doNotTranslateSet
  });

  console.log(`✓ Extracted ${extractedData.allStrings.size} total unique translatable strings.`);
  console.log(`✓ Common strings (>= 8 pages): ${extractedData.common.size}`);
  for (const [page, strings] of Object.entries(extractedData.pages)) {
    console.log(`  - ${page}: ${strings.size} page-specific strings`);
  }

  const written = writeCatalogSkeletons(extractedData, i18nDir, ['fr', 'es']);
  console.log(`✓ Wrote/updated ${written.length} catalog skeleton files in ${i18nDir}`);
}

module.exports = {
  loadDoNotTranslate,
  unescapeHtml,
  unescapeJsString,
  isTranslatable,
  parseAttributes,
  extractStringsFromHtml,
  extractAllPages,
  writeCatalogSkeletons,
  DEFAULT_PROTOTYPE_PAGES
};
