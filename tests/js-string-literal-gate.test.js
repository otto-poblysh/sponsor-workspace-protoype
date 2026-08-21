'use strict';

/**
 * Static lint gate for Task 9, round 3.
 *
 * org:check (tools/check-i18n.js) walks static HTML text nodes only. It
 * cannot see English string literals that live inside JavaScript — an
 * on*="..." event-handler attribute, or an alert()/confirm() call inside a
 * <script> block. Seven such leaks were found by hand across five pages in
 * rounds 1-2 of this task (see task-9-report.md) and fixed by routing them
 * through the page's STR object. Nothing automated would have caught a
 * regression of that class — this test is that automation.
 *
 * For every pan-african-org/en/*.html page, this test extracts every JS
 * string literal that appears:
 *   (a) inside an on*="..." handler attribute, or
 *   (b) inside an alert(...)/confirm(...) call within a <script> block,
 * and requires each one to fall into exactly one of four buckets:
 *   1. Not user-facing   - no static alphabetic content, a hex colour,
 *                           a CSS class name (".foo"), or a kebab-case
 *                           internal id/token ("invite-modal", "is-open").
 *   2. Documented key     - present in ALLOWLIST below, with a comment
 *                           explaining why it never reaches the DOM.
 *   3. Protected noun     - present in do-not-translate.json.
 *   4. Routed through STR - the literal is a template placeholder like
 *                           "${STR.foo}" or "${fmt(STR.foo, {...})}".
 * A literal matching none of the above fails the test.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EN_DIR = path.join(ROOT, 'pan-african-org', 'en');
const DNT_PATH = path.join(ROOT, 'pan-african-org', 'i18n', 'do-not-translate.json');

const DO_NOT_TRANSLATE = new Set(JSON.parse(fs.readFileSync(DNT_PATH, 'utf8')));

// Bucket 2: documented internal keys. Each entry must carry a one-line
// comment proving it is never assigned to .textContent/.innerHTML - only
// ever compared against. Keep this list short; if it starts absorbing
// genuinely user-facing strings, the gate stops being a gate.
const ALLOWLIST = new Map([
  // openModeration(type, entityName) in entities.html branches on `type`
  // (`type === 'suspend' ? STR.suspendTitle : STR.returnTitle`) to select
  // an already-translated string; `type` itself is never written to the
  // DOM. Verified across every call site in entities.html.
  ['suspend', "openModeration() type key - compared against, never rendered (entities.html)"],
  ['reject', "openModeration() type key - compared against, never rendered (entities.html)"],
]);

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/**
 * Scan `text` for top-level single-quoted string literals. Handles escaped
 * quotes (\') and `${...}` template interpolations embedded inside a
 * literal - including interpolations that themselves contain nested quoted
 * strings (e.g. `'${row.querySelector('strong').textContent}'`, which is
 * real markup in entities.html) - without letting the nested quote
 * prematurely close the outer literal.
 *
 * Returns [{ value, index }] where `index` is the position of the opening
 * quote and `value` is the literal's raw contents (quotes not included,
 * `${...}` blocks left intact for stripInterpolations to handle later).
 */
function scanLiterals(text) {
  const out = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] === "'") {
      const startIdx = i;
      i++;
      let value = '';
      while (i < n) {
        const ch = text[i];
        if (ch === '\\') {
          value += ch + (text[i + 1] || '');
          i += 2;
          continue;
        }
        if (ch === "'") {
          i++;
          break;
        }
        if (ch === '$' && text[i + 1] === '{') {
          value += '${';
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            const c = text[i];
            if (c === "'" || c === '"' || c === '`') {
              // Nested quoted string inside the interpolation - consume it
              // verbatim so its quotes don't get mistaken for the outer
              // literal's closing quote.
              const q = c;
              value += c;
              i++;
              while (i < n && text[i] !== q) {
                if (text[i] === '\\') {
                  value += text[i] + (text[i + 1] || '');
                  i += 2;
                  continue;
                }
                value += text[i];
                i++;
              }
              if (i < n) {
                value += text[i];
                i++;
              }
              continue;
            }
            if (c === '{') depth++;
            else if (c === '}') depth--;
            value += c;
            i++;
          }
          continue;
        }
        value += ch;
        i++;
      }
      out.push({ value, index: startIdx });
    } else {
      i++;
    }
  }
  return out;
}

/** Remove every balanced top-level `${...}` block from a literal's value,
 * returning whatever static text (if any) surrounds them. */
function stripInterpolations(value) {
  let out = '';
  let i = 0;
  const n = value.length;
  while (i < n) {
    if (value[i] === '$' && value[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < n && depth > 0) {
        const c = value[i];
        if (c === "'" || c === '"' || c === '`') {
          const q = c;
          i++;
          while (i < n && value[i] !== q) {
            if (value[i] === '\\') i++;
            i++;
          }
          if (i < n) i++;
          continue;
        }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        i++;
      }
      continue;
    }
    out += value[i];
    i++;
  }
  return out;
}

function extractOnAttrLiterals(html) {
  const results = [];
  const re = /\bon[a-z]+="([^"]*)"/g;
  let m;
  while ((m = re.exec(html))) {
    const attrValue = m[1];
    const attrValueStart = m.index + m[0].indexOf(attrValue);
    for (const lit of scanLiterals(attrValue)) {
      results.push({ value: lit.value, index: attrValueStart + lit.index, source: 'on*-attribute' });
    }
  }
  return results;
}

function extractScriptAlertLiterals(html) {
  const results = [];
  const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let sm;
  while ((sm = scriptRe.exec(html))) {
    const attrs = sm[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue; // external script, e.g. gate.js
    const body = sm[2];
    const openTagLen = sm[0].length - body.length - '</script>'.length;
    const bodyStart = sm.index + openTagLen;

    const callRe = /\b(alert|confirm)\s*\(/g;
    let cm;
    while ((cm = callRe.exec(body))) {
      const argsStart = callRe.lastIndex;
      let depth = 1;
      let i = argsStart;
      while (i < body.length && depth > 0) {
        const c = body[i];
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (c === "'" || c === '"' || c === '`') {
          const q = c;
          i++;
          while (i < body.length && body[i] !== q) {
            if (body[i] === '\\') i++;
            i++;
          }
        }
        i++;
      }
      const argsEnd = i - 1;
      const argsText = body.slice(argsStart, argsEnd);
      for (const lit of scanLiterals(argsText)) {
        results.push({
          value: lit.value,
          index: bodyStart + argsStart + lit.index,
          source: `${cm[1]}()-in-script`,
        });
      }
      callRe.lastIndex = argsEnd;
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const HAS_ALPHA_RE = /[A-Za-z]/;
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const CSS_CLASS_RE = /^\.[a-zA-Z][\w-]*$/;
const KEBAB_ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
const STR_REF_RE = /\bSTR\.[A-Za-z_][A-Za-z0-9_]*\b/;

function isPureSTRTemplate(rawValue) {
  const stripped = stripInterpolations(rawValue);
  if (stripped.trim() !== '') return false; // has literal text outside the interpolation
  return STR_REF_RE.test(rawValue);
}

/** Returns { bucket, reason } for a literal that passes, or null to fail it. */
function classify(rawValue) {
  if (isPureSTRTemplate(rawValue)) {
    return { bucket: 4, reason: 'routed through STR (template placeholder)' };
  }

  const stripped = stripInterpolations(rawValue).trim();

  if (!HAS_ALPHA_RE.test(stripped)) {
    return { bucket: 1, reason: 'no static alphabetic content' };
  }
  if (HEX_RE.test(stripped)) {
    return { bucket: 1, reason: 'hex colour' };
  }
  if (CSS_CLASS_RE.test(stripped)) {
    return { bucket: 1, reason: 'CSS class name' };
  }
  if (KEBAB_ID_RE.test(stripped)) {
    return { bucket: 1, reason: 'element id / internal token' };
  }
  if (ALLOWLIST.has(stripped)) {
    return { bucket: 2, reason: ALLOWLIST.get(stripped) };
  }
  if (DO_NOT_TRANSLATE.has(stripped)) {
    return { bucket: 3, reason: 'protected proper noun (do-not-translate.json)' };
  }
  return null;
}

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function collectFailuresAndStats() {
  const pages = fs.readdirSync(EN_DIR).filter((f) => f.endsWith('.html'));
  const stats = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const failures = [];

  for (const page of pages) {
    const filePath = path.join(EN_DIR, page);
    const html = fs.readFileSync(filePath, 'utf8');
    const literals = [...extractOnAttrLiterals(html), ...extractScriptAlertLiterals(html)];

    // The same literal can textually appear in both passes (an on*="..."
    // attribute embedded inside a <script> template literal is picked up
    // by both extractors) - dedupe by absolute character offset so it's
    // only judged, and reported, once.
    const seen = new Set();
    for (const lit of literals) {
      if (seen.has(lit.index)) continue;
      seen.add(lit.index);

      const result = classify(lit.value);
      const line = lineOf(html, lit.index);
      if (!result) {
        failures.push(
          `${page}:${line} [${lit.source}] ${JSON.stringify(lit.value)} - ` +
          'not classified. Route it through STR (STR.<key> / fmt(STR.<key>, {...})), ' +
          'add the exact proper noun to pan-african-org/i18n/do-not-translate.json, ' +
          'add a justified entry to ALLOWLIST in tests/js-string-literal-gate.test.js, ' +
          'or confirm it is genuinely non-user-facing (CSS class/id/hex/numeric).'
        );
      } else {
        stats[result.bucket]++;
      }
    }
  }

  return { failures, stats };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('no unclassified English JS string literals in on*="..." attributes or alert()/confirm() calls', () => {
  const { failures } = collectFailuresAndStats();
  assert.deepStrictEqual(
    failures,
    [],
    `Unclassified string literal(s) found:\n  ${failures.join('\n  ')}`
  );
});

test('literal classification stats (informational)', () => {
  const { stats } = collectFailuresAndStats();
  const total = stats[1] + stats[2] + stats[3] + stats[4];
  console.log(
    `[js-string-literal-gate] bucket1(not-user-facing)=${stats[1]} ` +
    `bucket2(allowlisted-key)=${stats[2]} bucket3(proper-noun)=${stats[3]} ` +
    `bucket4(STR-routed)=${stats[4]} total=${total}`
  );
  assert.ok(total > 0, 'expected at least one classified literal across the org English pages');
});
