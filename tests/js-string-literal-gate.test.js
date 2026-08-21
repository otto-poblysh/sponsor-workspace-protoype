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
 * string literal - single-quoted, double-quoted, or backtick-delimited -
 * that appears:
 *   (a) inside an on*="..." handler attribute, or
 *   (b) inside an alert(...)/confirm(...) call within a <script> block,
 * including literals nested inside a `${...}` template interpolation
 * (round 4 closed a gap where such a nested literal was discarded instead
 * of classified - see the two round-4 tests below), and requires each one
 * to fall into exactly one of four buckets:
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
  // entities.html:1031 - row.querySelector('strong') inside a template
  // interpolation. This is a bare HTML tag-name selector argument to
  // Element.querySelector(), not a string of user-facing text; it is
  // consumed by querySelector, never assigned to .textContent/.innerHTML.
  // Round 3's classifier never saw this literal at all (it was discarded
  // whole with the rest of the interpolation); round 4's recursive scan
  // now surfaces it as its own literal and it needs this explicit entry.
  ['strong', "HTML tag-name selector argument to querySelector(), never rendered (entities.html:1031)"],
]);

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

// Round 4: any of the three JS string delimiters can carry a leak, and a
// hardcoded literal can hide *inside* a ${...} interpolation right next to
// a genuine STR reference. Both gaps were demonstrated against round 3's
// classifier (see the two "round-4 regression" tests below and the report).
const QUOTE_CHARS = new Set(["'", '"', '`']);

/**
 * Scan `text` for top-level single-, double-, or backtick-quoted string
 * literals. Handles escaped quotes (\', \", \`) and `${...}` template
 * interpolations embedded inside a literal.
 *
 * An interpolation is walked twice, deliberately:
 *   1. Once to find its matching closing `}` (tracking brace depth, and
 *      skipping over any nested quoted string so ITS internal braces/quotes
 *      don't confuse the depth count) - this is how the outer literal's own
 *      true end is found, e.g. in real markup like
 *      `'${row.querySelector('strong').textContent}'` (entities.html:1031).
 *   2. Once *recursively*, over that same interpolation's text, to pull out
 *      any string literal nested inside it (of any of the three delimiter
 *      types) as its OWN top-level entry in the returned list - so it gets
 *      independently run through classify() rather than being silently
 *      discarded as "just part of the interpolation". This is what closes
 *      the round-4 gap where a hardcoded English string riding alongside a
 *      real `STR.foo` reference in the same `${...}` was never inspected.
 *
 * Returns [{ value, index }] where `index` is the position of the opening
 * quote (relative to the start of `text`) and `value` is the literal's raw
 * contents (quotes not included, `${...}` blocks left intact in `value` so
 * stripInterpolations/isPureSTRTemplate can reason about the wrapper).
 */
function scanLiterals(text) {
  const out = [];
  scanLiteralsInto(text, 0, out);
  return out;
}

function scanLiteralsInto(text, baseOffset, out) {
  let i = 0;
  const n = text.length;
  while (i < n) {
    const quote = text[i];
    if (QUOTE_CHARS.has(quote)) {
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
        if (ch === quote) {
          i++;
          break;
        }
        if (ch === '$' && text[i + 1] === '{') {
          const exprStart = i + 2;
          let j = exprStart;
          let depth = 1;
          while (j < n && depth > 0) {
            const c = text[j];
            if (QUOTE_CHARS.has(c)) {
              // Nested quoted string inside the interpolation - skip over
              // it (for brace-balancing purposes only; it is separately
              // recursed into below) so its own quotes/braces don't get
              // mistaken for this interpolation's boundary.
              const q2 = c;
              j++;
              while (j < n && text[j] !== q2) {
                if (text[j] === '\\') j++;
                j++;
              }
              if (j < n) j++;
              continue;
            }
            if (c === '{') depth++;
            else if (c === '}') depth--;
            j++;
          }
          const exprEnd = j - 1; // index of the matching '}'
          const exprText = text.slice(exprStart, exprEnd);
          // Recurse: any literal nested inside this interpolation must be
          // classified on its own merits, not laundered by co-location
          // with a STR. reference elsewhere in the same expression.
          scanLiteralsInto(exprText, baseOffset + exprStart, out);
          value += text.slice(i, j); // keep the raw ${...} text for the wrapper
          i = j;
          continue;
        }
        value += ch;
        i++;
      }
      out.push({ value, index: baseOffset + startIdx });
    } else {
      i++;
    }
  }
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

// Round 3 shipped this as `assert.ok(total > 0)` - a floor so low it stays
// green through an extraction collapse (exactly what happened with the
// quote-style gap: it would have passed with zero double/backtick literals
// ever found, forever, since the corpus doesn't currently use them). A
// blanket total can't catch that class of regression either - the corpus
// is clean today, so a coverage check against *this* corpus cannot prove a
// delimiter or recursion path still works; only a direct, synthetic input
// can (see the two tests below, which exist specifically for that). What
// THIS test can meaningfully catch is a structural collapse of the
// existing extractors - e.g. the on*="..." attribute regex or the
// alert/confirm call-matcher silently stops matching - which would crater
// every bucket's count at once. Per-bucket floors, tied to the known
// clean-corpus counts, catch that; a bare `total > 0` would not.
test('literal classification counts do not regress below the known corpus floor', () => {
  const { stats } = collectFailuresAndStats();
  const total = stats[1] + stats[2] + stats[3] + stats[4];
  console.log(
    `[js-string-literal-gate] bucket1(not-user-facing)=${stats[1]} ` +
    `bucket2(allowlisted-key)=${stats[2]} bucket3(proper-noun)=${stats[3]} ` +
    `bucket4(STR-routed)=${stats[4]} total=${total}`
  );
  assert.ok(stats[1] >= 40, `bucket1 (not-user-facing) dropped to ${stats[1]}, expected >= 40 - extraction may have collapsed`);
  assert.ok(stats[2] >= 8, `bucket2 (allowlisted key) dropped to ${stats[2]}, expected >= 8 - extraction may have collapsed`);
  assert.ok(stats[3] >= 18, `bucket3 (proper noun) dropped to ${stats[3]}, expected >= 18 - extraction may have collapsed`);
  assert.ok(stats[4] >= 5, `bucket4 (STR-routed) dropped to ${stats[4]}, expected >= 5 - extraction may have collapsed`);
});

// ---------------------------------------------------------------------------
// Round 4 regression tests - each proves a false negative the reviewer
// demonstrated against round 3's actual classifier code, by feeding the
// same offending input straight into the extractor/classifier.
// ---------------------------------------------------------------------------

test('round 4 / Important 1: extractScriptAlertLiterals finds double-quoted and backtick alert() literals, not just single-quoted', () => {
  // Round 3's scanLiterals only recognised `'` as a string delimiter
  // (tests/js-string-literal-gate.test.js was literally `if (text[i] === "'")`).
  // Fed the exact input below, extractScriptAlertLiterals returned zero
  // literals for both lines - not unclassified, invisible - so the leaks
  // shipped silently and the gate never even counted them.
  const html = [
    '<script>',
    '  function demo() {',
    '    alert("Brand new leak via double quotes");',
    '    alert(`Brand new leak via backticks`);',
    '  }',
    '</script>',
  ].join('\n');

  const found = extractScriptAlertLiterals(html).map((l) => l.value);
  assert.ok(
    found.includes('Brand new leak via double quotes'),
    `double-quoted alert() literal must be extracted; got ${JSON.stringify(found)}`
  );
  assert.ok(
    found.includes('Brand new leak via backticks'),
    `backtick alert() literal must be extracted; got ${JSON.stringify(found)}`
  );

  for (const value of ['Brand new leak via double quotes', 'Brand new leak via backticks']) {
    assert.strictEqual(
      classify(value),
      null,
      `${JSON.stringify(value)} is unrouted English text and must fail classification`
    );
  }
});

test('round 4 / Important 2: a hardcoded literal riding alongside a real STR. reference inside the same ${...} is independently classified and fails', () => {
  // Round 3's isPureSTRTemplate() stripped the *entire* ${...} block -
  // including any nested quoted string inside it - before checking for a
  // "STR." substring anywhere in the raw literal. That meant a hardcoded
  // English string sharing an interpolation with a real STR reference was
  // deleted before classification ever saw it, and the whole wrapper was
  // credited to bucket 4 by co-location alone. This is one variable swap
  // away from the real entities.html:1009 idiom
  // (`alert('${fmt(STR.reinvitedName, { name: activeModName })}')`).
  const html = [
    '<script>',
    '  alert(\'${fmt(STR.reinvitedName, { name: "Totally Unrouted English Text" })}\');',
    '</script>',
  ].join('\n');

  const found = extractScriptAlertLiterals(html).map((l) => l.value);
  assert.ok(
    found.includes('Totally Unrouted English Text'),
    `the nested hardcoded string must be extracted as its own literal, not discarded with the interpolation; got ${JSON.stringify(found)}`
  );
  assert.strictEqual(
    classify('Totally Unrouted English Text'),
    null,
    'co-location with a real STR. reference in the same interpolation must not launder unrouted English text into bucket 4'
  );
});
