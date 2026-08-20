#!/usr/bin/env node

/**
 * tools/build-i18n.js
 *
 * Compiles English HTML source pages into static /fr and /es directory trees (R3, R5):
 * 1. Document metadata: updates <html lang="..."> to target locale, translates <title>.
 * 2. Text nodes: replaced with translations from {page catalog} ∪ {common catalog} (page winning).
 * 3. Whitelisted attributes: title, aria-label, placeholder, alt, and <meta name="description"> content.
 * 4. JS STR blocks: translates string literals inside /* i18n:STR:start * / ... /* i18n:STR:end * / blocks.
 *    Surrounding JS remains byte-identical.
 * 5. Language toggle: rewrites hrefs and .is-active segment for root (EN), /fr, and /es.
 * 6. Header comment: prepends <!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: ../[page] -->.
 * 7. Preservation: preserves data-hf-id and all other attributes byte-for-byte.
 * 8. Idempotency: wiped and recreated output trees ensure idempotent clean builds without stale orphans.
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

const WHITELISTED_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt']);

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
 * Loads a translation catalog from JSON file.
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function loadCatalog(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Warning: Failed to load catalog from ${filePath}: ${err.message}`);
    return {};
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
 * Escapes characters for HTML text nodes.
 * Preserves unicode characters / UTF-8.
 * @param {string} str
 * @returns {string}
 */
function escapeHtmlText(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapes characters for HTML attribute values.
 * @param {string} str
 * @param {string} [quoteChar]
 * @returns {string}
 */
function escapeHtmlAttr(str, quoteChar = '"') {
  if (!str) return '';
  let res = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  if (quoteChar === '"') {
    res = res.replace(/"/g, '&quot;');
  } else if (quoteChar === "'") {
    res = res.replace(/'/g, '&#39;');
  }
  return res;
}

/**
 * Rewrites toggle anchor links for the given target locale and pageName.
 * @param {string} toggleInnerHtml
 * @param {string} locale
 * @param {string} pageName
 * @returns {string}
 */
function rewriteToggleLinks(toggleInnerHtml, locale, pageName, englishDir = null) {
  let enHref, frHref, esHref;
  let enActive = false, frActive = false, esActive = false;

  // englishDir set => English lives in its own sibling directory (e.g. `en/`),
  // so every cross-locale link is `../<locale>/<page>`. Unset => English is the
  // site root, which is how the ministry site is laid out.
  const enPrefix = englishDir ? `../${englishDir}/` : '../';

  if (locale === 'fr') {
    enHref = `${enPrefix}${pageName}`;
    frHref = `${pageName}`;
    esHref = `../es/${pageName}`;
    frActive = true;
  } else if (locale === 'es') {
    enHref = `${enPrefix}${pageName}`;
    frHref = `../fr/${pageName}`;
    esHref = `${pageName}`;
    esActive = true;
  } else {
    // English: siblings sit one level up when English has its own directory.
    const sibPrefix = englishDir ? '../' : '';
    enHref = `${pageName}`;
    frHref = `${sibPrefix}fr/${pageName}`;
    esHref = `${sibPrefix}es/${pageName}`;
    enActive = true;
  }

  let result = toggleInnerHtml;
  // Replace EN anchor
  result = result.replace(
    /<a\b([^>]*\bhreflang=["']en["'][^>]*)>([\s\S]*?)<\/a>/i,
    `<a class="lang-opt${enActive ? ' is-active' : ''}" hreflang="en" href="${enHref}">$2</a>`
  );
  // Replace FR anchor
  result = result.replace(
    /<a\b([^>]*\bhreflang=["']fr["'][^>]*)>([\s\S]*?)<\/a>/i,
    `<a class="lang-opt${frActive ? ' is-active' : ''}" hreflang="fr" href="${frHref}">$2</a>`
  );
  // Replace ES anchor
  result = result.replace(
    /<a\b([^>]*\bhreflang=["']es["'][^>]*)>([\s\S]*?)<\/a>/i,
    `<a class="lang-opt${esActive ? ' is-active' : ''}" hreflang="es" href="${esHref}">$2</a>`
  );

  return result;
}

/**
 * Rewrites the entire language toggle block in an HTML document string.
 * @param {string} htmlContent
 * @param {string} locale
 * @param {string} pageName
 * @param {Record<string, string>} [catalog]
 * @param {Set<string>} [dntSet]
 * @param {string} [englishDir]
 * @returns {string}
 */
function rewriteLanguageToggle(htmlContent, locale, pageName, catalog = {}, dntSet = new Set(), englishDir = null) {
  const toggleRegex = /<div\b([^>]*\bclass=["'][^"']*\blang-toggle\b[^"']*["'][^>]*)>([\s\S]*?)<\/div>/gi;
  return htmlContent.replace(toggleRegex, (fullMatch, divAttrs, innerContent) => {
    // Translate aria-label if present on .lang-toggle container
    let translatedDivAttrs = divAttrs;
    const ariaMatch = /aria-label\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(divAttrs);
    if (ariaMatch) {
      const rawAria = ariaMatch[1] !== undefined ? ariaMatch[1] : ariaMatch[2];
      const key = unescapeHtml(rawAria);
      const translation = catalog[key];
      if (translation && translation !== '' && (!dntSet || !dntSet.has(key))) {
        translatedDivAttrs = divAttrs.replace(
          ariaMatch[0],
          `aria-label="${escapeHtmlAttr(translation, '"')}"`
        );
      }
    }
    const rewrittenInner = rewriteToggleLinks(innerContent, locale, pageName, englishDir);
    return `<div${translatedDivAttrs}>${rewrittenInner}</div>`;
  });
}

/**
 * Translates string literals inside /* i18n:STR:start * / ... /* i18n:STR:end * / blocks.
 * @param {string} scriptContent
 * @param {Record<string, string>} catalog
 * @param {Set<string>} [dntSet]
 * @returns {string}
 */
function translateStrBlock(scriptContent, catalog, dntSet = new Set()) {
  const strBlockRegex = /(\/\*\s*i18n:STR:start\s*\*\/)([\s\S]*?)(\/\*\s*i18n:STR:end\s*\*\/)/g;
  return scriptContent.replace(strBlockRegex, (fullBlock, startDelim, blockBody, endDelim) => {
    const translatedBody = blockBody.replace(
      /([a-zA-Z0-9_$]+)\s*:\s*("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)/g,
      (fullPair, key, rawLiteral, qDouble, qSingle, qBacktick) => {
        const rawVal = qDouble !== undefined ? qDouble : (qSingle !== undefined ? qSingle : qBacktick);
        const val = unescapeJsString(rawVal);
        const translation = catalog[val];
        if (translation !== undefined && translation !== '' && (!dntSet || !dntSet.has(val))) {
          return `${key}: ${JSON.stringify(translation)}`;
        }
        return fullPair;
      }
    );
    return `${startDelim}${translatedBody}${endDelim}`;
  });
}

/**
 * Translates an English HTML source page into a target locale HTML string (R3, R5).
 * @param {string} htmlContent
 * @param {object} options
 * @param {Record<string, string>} [options.pageCatalog]
 * @param {Record<string, string>} [options.commonCatalog]
 * @param {string} [options.locale] Target locale (e.g. 'fr', 'es', 'en')
 * @param {string} [options.pageName] Name of HTML page (e.g. 'mini.html', 'index.html')
 * @param {Set<string>|string[]} [options.doNotTranslateSet]
 * @returns {string} Translated HTML string
 */
function translateHtml(htmlContent, options = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  const locale = options.locale || 'fr';
  const pageName = options.pageName || 'index.html';
  const pageCatalog = options.pageCatalog || {};
  const commonCatalog = options.commonCatalog || {};
  const dntSet = options.doNotTranslateSet instanceof Set
    ? options.doNotTranslateSet
    : new Set(options.doNotTranslateSet || []);

  /**
   * Catalog lookup: pageCatalog takes precedence over commonCatalog (Spec Test 9)
   * @param {string} key
   * @returns {string|undefined}
   */
  function lookup(key) {
    if (pageCatalog && pageCatalog[key] !== undefined && pageCatalog[key] !== '') {
      return pageCatalog[key];
    }
    if (commonCatalog && commonCatalog[key] !== undefined && commonCatalog[key] !== '') {
      return commonCatalog[key];
    }
    return undefined;
  }

  // Combined catalog for toggle / script translations
  const mergedCatalog = Object.assign({}, commonCatalog, pageCatalog);

  // 1. Update <html lang="...">
  let processedHtml = htmlContent.replace(/<html\b([^>]*)>/i, (fullHtmlTag, attrStr) => {
    if (/\blang\s*=\s*["'][^"']*["']/i.test(attrStr)) {
      return `<html${attrStr.replace(/\blang\s*=\s*["'][^"']*["']/i, `lang="${locale}"`)}>`;
    }
    return `<html lang="${locale}"${attrStr}>`;
  });

  // 2. Rewrite language toggle container and child links
  if (options.rewriteToggle !== false) {
    processedHtml = rewriteLanguageToggle(processedHtml, locale, pageName, mergedCatalog, dntSet, options.englishDir);
  }

  // 3. Tokenize HTML to translate text nodes, whitelisted attributes, and JS STR blocks
  const tokenRegex = /<!--[\s\S]*?-->|<!DOCTYPE\b[^>]*>|<script\b([^>]*)>([\s\S]*?)<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<div\b[^>]*\bclass=["'][^"']*\blang-toggle\b[^"']*["'][^>]*>[\s\S]*?<\/div>|<\/([a-zA-Z0-9\-]+)\s*>|<([a-zA-Z0-9\-]+)((?:\s+[^"'/>\s=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/gi;

  let ignoreDepth = 0;
  let out = '';
  let tokenMatch;

  while ((tokenMatch = tokenRegex.exec(processedHtml)) !== null) {
    const fullMatch = tokenMatch[0];
    const scriptAttrs = tokenMatch[1];
    const scriptCode = tokenMatch[2];
    const closeTagName = tokenMatch[3];
    const openTagName = tokenMatch[4];
    const attrString = tokenMatch[5];
    const selfClosingSlash = tokenMatch[6];
    const textNode = tokenMatch[7];

    // Comments, doctype, styles, or already-rewritten lang-toggle: preserve as-is
    if (
      fullMatch.startsWith('<!--') ||
      fullMatch.toUpperCase().startsWith('<!DOCTYPE') ||
      fullMatch.toLowerCase().startsWith('<style') ||
      (fullMatch.toLowerCase().startsWith('<div') && fullMatch.includes('lang-toggle'))
    ) {
      out += fullMatch;
      continue;
    }

    // Scripts: translate STR block, preserve surrounding JS byte-identical
    if (scriptCode !== undefined) {
      const translatedScript = translateStrBlock(scriptCode, mergedCatalog, dntSet);
      out += `<script${scriptAttrs || ''}>${translatedScript}</script>`;
      continue;
    }

    // Closing tag: </tagName>
    if (closeTagName) {
      if (ignoreDepth > 0) {
        ignoreDepth--;
      }
      out += fullMatch;
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
        out += fullMatch;
        continue;
      }

      if (hasIgnoreAttr) {
        if (!isVoid) {
          ignoreDepth = 1;
        }
        out += fullMatch;
        continue;
      }

      // Translate whitelisted attributes
      if (!attrString) {
        out += fullMatch;
        continue;
      }

      const isMetaDescription = tagLower === 'meta' && /\bname\s*=\s*["']description["']/i.test(attrString);

      const translatedAttrString = attrString.replace(
        /([a-zA-Z0-9\-:]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
        (attrFull, attrName, eqVal, qDouble, qSingle, qBare) => {
          if (!eqVal) return attrFull;

          const attrNameLower = attrName.toLowerCase();
          const isWhitelisted = WHITELISTED_ATTRS.has(attrNameLower) || (isMetaDescription && attrNameLower === 'content');

          if (!isWhitelisted) {
            return attrFull;
          }

          const rawVal = qDouble !== undefined ? qDouble : (qSingle !== undefined ? qSingle : (qBare !== undefined ? qBare : ''));
          const key = unescapeHtml(rawVal);
          const translation = lookup(key);

          if (translation !== undefined && translation !== '' && (!dntSet || !dntSet.has(key))) {
            const quoteChar = qDouble !== undefined ? '"' : (qSingle !== undefined ? "'" : '"');
            return `${attrName}=${quoteChar}${escapeHtmlAttr(translation, quoteChar)}${quoteChar}`;
          }

          return attrFull;
        }
      );

      out += `<${openTagName}${translatedAttrString}${selfClosingSlash || ''}>`;
      continue;
    }

    // Text node
    if (textNode !== undefined) {
      if (ignoreDepth > 0) {
        out += textNode;
        continue;
      }

      const leadingWhitespace = (textNode.match(/^\s*/) || [''])[0];
      const trailingWhitespace = (textNode.match(/\s*$/) || [''])[0];
      const trimmed = textNode.trim();

      if (trimmed === '') {
        out += textNode;
        continue;
      }

      const key = unescapeHtml(trimmed);
      const translation = lookup(key);

      if (translation !== undefined && translation !== '' && (!dntSet || !dntSet.has(key))) {
        out += `${leadingWhitespace}${escapeHtmlText(translation)}${trailingWhitespace}`;
      } else {
        out += textNode;
      }
      continue;
    }

    out += fullMatch;
  }

  // Prepend generated file header comment
  if (options.headerComment === false || options.header === false) {
    return out;
  }
  const headerComment = typeof options.headerComment === 'string'
    ? options.headerComment
    : `<!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: ../${pageName} -->\n`;
  return `${headerComment}${out}`;
}

/**
 * Inserts the generated-file banner comment *after* <!DOCTYPE html> rather than
 * before it.
 *
 * A comment before the doctype makes downstream tooling (and some strict HTML
 * parsers) treat the file as a fragment rather than a document, which drops
 * <meta charset="UTF-8"> and decodes the body as Latin-1 — every accented
 * character then renders as mojibake. `buildAll` always uses this helper
 * (calling `translateHtml` with `headerComment: false` first) so generated
 * pages open with `<!DOCTYPE html>` on line 1. `translateHtml`'s own default
 * header behavior is left as-is for direct callers/tests.
 * @param {string} html
 * @param {string} headerComment
 * @returns {string}
 */
function insertHeaderAfterDoctype(html, headerComment) {
  const m = html.match(/^\uFEFF?\s*<!DOCTYPE html>[^\n]*\r?\n?/i);
  if (!m) return headerComment + html;
  return html.slice(0, m[0].length) + headerComment + html.slice(m[0].length);
}

/**
 * Points the demo-gate script at repo-root gate.js from a generated locale page.
 * @param {string} html
 * @param {string} outPagePath
 * @param {string} repoRoot
 * @returns {string}
 */
function rewriteGateScriptSrc(html, outPagePath, repoRoot) {
  if (!html || html.indexOf('gate.js') === -1) {
    return html;
  }
  const rel = path.relative(path.dirname(outPagePath), repoRoot);
  const src = (rel ? rel.split(path.sep).join('/') + '/' : '') + 'gate.js';
  return html.replace(/src="(?:\.\/|\.\.\/)*gate\.js"/g, `src="${src}"`);
}

/**
 * Builds static trees for all configured locales and pages (R3, R5).
 * Wipes previous output directories to eliminate orphan files.
 * @param {object} options
 * @param {string} [options.srcDir] Root source directory
 * @param {string} [options.outDir] Output root directory
 * @param {string} [options.i18nDir] Catalogs directory
 * @param {string[]} [options.locales] Locales to build (default ['fr', 'es'])
 * @param {string[]} [options.pages] List of English HTML page file names
 * @param {string} [options.doNotTranslatePath] Path to do-not-translate.json
 * @returns {{ generatedFiles: string[], count: number }}
 */
function buildAll(options = {}) {
  const rootDir = options.srcDir || process.cwd();
  const outDir = options.outDir || process.cwd();
  const i18nDir = options.i18nDir || path.join(rootDir, 'i18n');
  const locales = options.locales || ['fr', 'es'];
  const pages = options.pages || DEFAULT_PROTOTYPE_PAGES;
  const dntPath = options.doNotTranslatePath || path.join(i18nDir, 'do-not-translate.json');
  const englishDir = options.englishDir || null;

  const doNotTranslateSet = loadDoNotTranslate(dntPath);
  const generatedFiles = [];

  for (const locale of locales) {
    const localeDir = path.join(outDir, locale);

    // Completely wipe and recreate output directory to prevent stale orphans (R3)
    if (fs.existsSync(localeDir)) {
      fs.rmSync(localeDir, { recursive: true, force: true });
    }
    fs.mkdirSync(localeDir, { recursive: true });

    // Load common catalog for this locale
    const commonPath = path.join(i18nDir, `common.${locale}.json`);
    const commonCatalog = loadCatalog(commonPath);

    for (const pageName of pages) {
      const srcPagePath = path.join(rootDir, pageName);
      if (!fs.existsSync(srcPagePath)) {
        continue;
      }

      const htmlContent = fs.readFileSync(srcPagePath, 'utf-8');
      const baseName = path.basename(pageName, '.html');
      const pageCatalogPath = path.join(i18nDir, `${baseName}.${locale}.json`);
      const pageCatalog = loadCatalog(pageCatalogPath);

      const translatedBody = translateHtml(htmlContent, {
        pageCatalog,
        commonCatalog,
        locale,
        pageName,
        doNotTranslateSet,
        englishDir,
        headerComment: false
      });
      const headerComment = `<!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: ../${pageName} -->\n`;
      const translated = insertHeaderAfterDoctype(translatedBody, headerComment);

      const outPagePath = path.join(localeDir, pageName);
      const withGateSrc = rewriteGateScriptSrc(
        translated,
        outPagePath,
        options.repoRoot || process.cwd()
      );
      fs.writeFileSync(outPagePath, withGateSrc, 'utf-8');
      generatedFiles.push(outPagePath);
    }
  }

  return {
    generatedFiles,
    count: generatedFiles.length
  };
}

/**
 * Resolves site paths from CLI args.
 *
 * `--site <dir>` points the build at a nested site. If `<dir>/en` exists it is
 * the English source and locales are siblings inside `<dir>`; otherwise `<dir>`
 * itself is the source and locales nest under it (the ministry layout).
 * With no `--site`, everything resolves to the repo root exactly as before.
 *
 * @param {string[]} args
 * @param {string} [cwd]
 * @returns {{srcDir: string, outDir: string, i18nDir: string, englishDir: string|null}}
 */
function resolveSite(args, cwd = process.cwd()) {
  const i = args.indexOf('--site');
  if (i === -1 || !args[i + 1]) {
    return { srcDir: cwd, outDir: cwd, i18nDir: path.join(cwd, 'i18n'), englishDir: null };
  }
  const siteDir = path.resolve(cwd, args[i + 1]);
  const enDir = path.join(siteDir, 'en');
  const hasEn = fs.existsSync(enDir);
  return {
    srcDir: hasEn ? enDir : siteDir,
    outDir: siteDir,
    i18nDir: path.join(siteDir, 'i18n'),
    englishDir: hasEn ? 'en' : null
  };
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const { srcDir, outDir, i18nDir, englishDir } = resolveSite(args);
  const locales = ['fr', 'es'];
  const pages = fs.readdirSync(srcDir).filter((f) => f.endsWith('.html')).sort();

  console.log(`Compiling i18n trees for ${path.relative(process.cwd(), outDir) || '.'} ...`);
  const result = buildAll({ srcDir, outDir, i18nDir, locales, pages, englishDir });
  console.log(`✓ Generated ${result.generatedFiles.length} pages across [${locales.join(', ')}].`);
}

module.exports = {
  translateHtml,
  buildAll,
  rewriteLanguageToggle,
  rewriteToggleLinks,
  translateStrBlock,
  loadCatalog,
  loadDoNotTranslate,
  unescapeHtml,
  unescapeJsString,
  escapeHtmlText,
  escapeHtmlAttr,
  resolveSite,
  rewriteGateScriptSrc,
  insertHeaderAfterDoctype,
  DEFAULT_PROTOTYPE_PAGES,
  WHITELISTED_ATTRS
};
