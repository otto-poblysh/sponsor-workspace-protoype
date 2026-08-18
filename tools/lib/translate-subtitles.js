'use strict';

/**
 * Translates GSAP subtitle literals of the form:
 *   .set("#subtitle-container", { textContent: "..." })
 *
 * Only the string literal following `textContent:` is touched. All surrounding
 * JavaScript is left byte-identical — this never parses or rewrites arbitrary code.
 */

const SUBTITLE_RE = /(textContent:\s*)(["'])((?:(?!\2)[^\\]|\\.)*)(\2)/g;

function unescapeJs(s) {
  return s.replace(/\\(["'\\/bfnrt])/g, (_, c) => {
    const map = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
    return map[c] !== undefined ? map[c] : c;
  });
}

function escapeJs(s, quote = '"') {
  const esc = s.replace(/\\/g, '\\\\');
  return quote === "'" ? esc.replace(/'/g, "\\'") : esc.replace(/"/g, '\\"');
}

/**
 * @param {string} html
 * @param {Record<string,string>} catalog
 * @param {{strict?: boolean}} [opts]
 * @returns {{html: string, translated: number, missing: string[]}}
 */
function translateSubtitles(html, catalog, opts = {}) {
  const missing = [];
  let translated = 0;

  const out = html.replace(SUBTITLE_RE, (match, prefix, quote, body) => {
    const key = unescapeJs(body);
    if (Object.prototype.hasOwnProperty.call(catalog, key)) {
      translated += 1;
      return `${prefix}${quote}${escapeJs(catalog[key], quote)}${quote}`;
    }
    missing.push(key);
    return match;
  });

  if (opts.strict && missing.length > 0) {
    throw new Error(
      `Untranslated subtitle(s):\n  - ${missing.join('\n  - ')}`
    );
  }

  return { html: out, translated, missing };
}

module.exports = { translateSubtitles };
