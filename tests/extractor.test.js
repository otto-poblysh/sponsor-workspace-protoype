const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {
  extractStringsFromHtml,
  extractAllPages,
  writeCatalogSkeletons,
  loadDoNotTranslate,
  isTranslatable
} = require('../tools/extract-i18n.js');

describe('Extractor Tool (R2)', () => {
  const miniHtmlPath = path.join(__dirname, 'fixtures', 'mini.html');
  const validFrJsonPath = path.join(__dirname, 'fixtures', 'catalogs', 'valid.fr.json');
  const doNotTranslatePath = path.join(__dirname, '..', 'i18n', 'do-not-translate.json');

  let doNotTranslateSet;

  beforeEach(() => {
    if (fs.existsSync(doNotTranslatePath)) {
      doNotTranslateSet = loadDoNotTranslate(doNotTranslatePath);
    } else {
      doNotTranslateSet = new Set([
        'Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Luba', 'Annobón',
        'Bioko Norte', 'Bioko Sur', 'Centro Sur', 'Kié-Ntem', 'Litoral', 'Wele-Nzas',
        'Hyperframes', 'Geist', 'Geist Sans', 'Phosphor', 'EN', 'FR', 'ES'
      ]);
    }
  });

  describe('extractStringsFromHtml', () => {
    // Spec Test 4: extractor lists exactly the translatable strings in tests/fixtures/mini.html
    it('Spec Test 4: extracts exactly the translatable strings from mini.html fixture', () => {
      const htmlContent = fs.readFileSync(miniHtmlPath, 'utf-8');
      const validFrCatalog = JSON.parse(fs.readFileSync(validFrJsonPath, 'utf-8'));
      const expectedKeys = Object.keys(validFrCatalog).sort();

      const extracted = extractStringsFromHtml(htmlContent, doNotTranslateSet);
      const extractedArray = Array.from(extracted).sort();

      assert.equal(extractedArray.length, 18, `Expected 18 unique strings, got ${extractedArray.length}`);
      assert.deepEqual(extractedArray, expectedKeys, 'Extracted strings must match exactly valid.fr.json keys');
    });

    // Spec Test 5: extractor omits do-not-translate entries
    it('Spec Test 5: omits do-not-translate entries, pure numbers, currency amounts, and punctuation-only strings', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Page</title></head>
        <body>
          <p>Malabo</p>
          <p>Bata</p>
          <p>Hyperframes</p>
          <p>Geist Sans</p>
          <span>EN</span>
          <span>FR</span>
          <span>ES</span>
          <div>123</div>
          <div>1,234</div>
          <div>$500</div>
          <div>100 FCFA</div>
          <div>+15%</div>
          <div>—</div>
          <div>...</div>
          <div>•</div>
          <div>Valid Translatable String</div>
        </body>
        </html>
      `;

      const extracted = extractStringsFromHtml(html, doNotTranslateSet);
      const extractedArray = Array.from(extracted).sort();

      assert.ok(!extracted.has('Malabo'), 'Should omit Malabo');
      assert.ok(!extracted.has('Bata'), 'Should omit Bata');
      assert.ok(!extracted.has('Hyperframes'), 'Should omit Hyperframes');
      assert.ok(!extracted.has('Geist Sans'), 'Should omit Geist Sans');
      assert.ok(!extracted.has('EN'), 'Should omit EN');
      assert.ok(!extracted.has('FR'), 'Should omit FR');
      assert.ok(!extracted.has('ES'), 'Should omit ES');
      assert.ok(!extracted.has('123'), 'Should omit pure numbers');
      assert.ok(!extracted.has('1,234'), 'Should omit formatted numbers');
      assert.ok(!extracted.has('$500'), 'Should omit currency amounts');
      assert.ok(!extracted.has('100 FCFA'), 'Should omit currency amounts');
      assert.ok(!extracted.has('+15%'), 'Should omit percentages');
      assert.ok(!extracted.has('—'), 'Should omit punctuation dashes');
      assert.ok(!extracted.has('...'), 'Should omit punctuation ellipses');
      assert.ok(!extracted.has('•'), 'Should omit punctuation bullets');

      assert.ok(extracted.has('Test Page'), 'Should extract title text');
      assert.ok(extracted.has('Valid Translatable String'), 'Should extract valid translatable string');
      assert.deepEqual(extractedArray, ['Test Page', 'Valid Translatable String'].sort());
    });

    it('skips elements with data-i18n-ignore and all their children', () => {
      const html = `
        <div>
          <h1>Translate Me</h1>
          <div data-i18n-ignore>
            <p>Ignored Paragraph</p>
            <button title="Ignored Tooltip">Ignored Button</button>
            <span aria-label="Ignored Label">Ignored Span</span>
          </div>
          <p data-i18n-ignore="true">Also Ignored</p>
          <img data-i18n-ignore alt="Ignored Alt">
          <h2>Also Translate Me</h2>
        </div>
      `;

      const extracted = extractStringsFromHtml(html, doNotTranslateSet);
      assert.ok(extracted.has('Translate Me'));
      assert.ok(extracted.has('Also Translate Me'));
      assert.ok(!extracted.has('Ignored Paragraph'));
      assert.ok(!extracted.has('Ignored Tooltip'));
      assert.ok(!extracted.has('Ignored Button'));
      assert.ok(!extracted.has('Ignored Label'));
      assert.ok(!extracted.has('Ignored Span'));
      assert.ok(!extracted.has('Also Ignored'));
      assert.ok(!extracted.has('Ignored Alt'));
    });

    it('extracts whitelisted attributes and meta description but ignores other attributes', () => {
      const html = `
        <meta name="description" content="Portal description text">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <input type="text" name="user_query" placeholder="Enter username" aria-label="Username Input">
        <button id="btn-save" class="btn primary" title="Save changes">Save</button>
        <img src="banner.jpg" alt="National Flag Banner" class="banner-img">
      `;

      const extracted = extractStringsFromHtml(html, doNotTranslateSet);
      assert.ok(extracted.has('Portal description text'), 'Should extract meta description');
      assert.ok(extracted.has('Enter username'), 'Should extract placeholder');
      assert.ok(extracted.has('Username Input'), 'Should extract aria-label');
      assert.ok(extracted.has('Save changes'), 'Should extract title');
      assert.ok(extracted.has('Save'), 'Should extract button text');
      assert.ok(extracted.has('National Flag Banner'), 'Should extract img alt');

      assert.ok(!extracted.has('width=device-width, initial-scale=1.0'), 'Should ignore non-description meta content');
      assert.ok(!extracted.has('user_query'), 'Should ignore input name attribute');
      assert.ok(!extracted.has('btn-save'), 'Should ignore id attribute');
      assert.ok(!extracted.has('btn primary'), 'Should ignore class attribute');
      assert.ok(!extracted.has('banner.jpg'), 'Should ignore src attribute');
    });

    it('extracts string values from /* i18n:STR:start */ ... /* i18n:STR:end */ blocks and ignores regular JS code', () => {
      const html = `
        <script>
          const ignoredVar = "Non-STR variable string";
          console.log("Console log message");

          /* i18n:STR:start */
          const STR = {
            greeting: "Hello {name}, welcome!",
            farewell: 'Goodbye!',
            template: \`See you tomorrow\`
          };
          /* i18n:STR:end */

          function helper() {
            return "Another ignored JS string";
          }
        </script>
      `;

      const extracted = extractStringsFromHtml(html, doNotTranslateSet);
      assert.ok(extracted.has('Hello {name}, welcome!'));
      assert.ok(extracted.has('Goodbye!'));
      assert.ok(extracted.has('See you tomorrow'));

      assert.ok(!extracted.has('Non-STR variable string'));
      assert.ok(!extracted.has('Console log message'));
      assert.ok(!extracted.has('Another ignored JS string'));
    });
  });

  describe('extractAllPages and common vs page grouping', () => {
    // Spec Test 7: strings on ≥ 8 of 11 pages land in common, not per-page
    it('Spec Test 7: strings on ≥ 8 of 11 pages land in common, not per-page', () => {
      const pagesMap = {};
      const commonString1 = 'Dashboard Navigation'; // 9 pages (>= 8)
      const commonString2 = 'Ministry Footer';     // 8 pages (>= 8)
      const pageSpecificString = 'Specific Table Header'; // 3 pages (< 8)
      const singlePageString = 'Unique Secret Setting';  // 1 page (< 8)

      for (let i = 1; i <= 11; i++) {
        const pageName = `page-${i}.html`;
        const parts = [];
        if (i <= 9) parts.push(`<p>${commonString1}</p>`);
        if (i <= 8) parts.push(`<p>${commonString2}</p>`);
        if (i <= 3) parts.push(`<p>${pageSpecificString}</p>`);
        if (i === 1) parts.push(`<p>${singlePageString}</p>`);
        pagesMap[pageName] = `<!DOCTYPE html><html><body>${parts.join('')}</body></html>`;
      }

      const result = extractAllPages(pagesMap, {
        threshold: 8,
        doNotTranslateSet
      });

      // Common assertions
      assert.ok(result.common.has(commonString1), 'commonString1 (9 pages) should be in common');
      assert.ok(result.common.has(commonString2), 'commonString2 (8 pages) should be in common');
      assert.ok(!result.common.has(pageSpecificString), 'pageSpecificString (3 pages) must NOT be in common');
      assert.ok(!result.common.has(singlePageString), 'singlePageString (1 page) must NOT be in common');

      // Per-page assertions
      for (let i = 1; i <= 11; i++) {
        const pageName = `page-${i}.html`;
        const pageSet = result.pages[pageName];
        assert.ok(pageSet, `result.pages should contain entry for ${pageName}`);
        assert.ok(!pageSet.has(commonString1), `${pageName} must NOT contain commonString1`);
        assert.ok(!pageSet.has(commonString2), `${pageName} must NOT contain commonString2`);

        if (i <= 3) {
          assert.ok(pageSet.has(pageSpecificString), `${pageName} (i<=${i}) should contain pageSpecificString`);
        } else {
          assert.ok(!pageSet.has(pageSpecificString), `${pageName} should NOT contain pageSpecificString`);
        }

        if (i === 1) {
          assert.ok(pageSet.has(singlePageString), `${pageName} should contain singlePageString`);
        } else {
          assert.ok(!pageSet.has(singlePageString), `${pageName} should NOT contain singlePageString`);
        }
      }
    });
  });

  describe('writeCatalogSkeletons and non-destructive preservation', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-extract-test-'));
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    // Spec Test 6: re-extraction preserves existing translations
    it('Spec Test 6: re-extraction preserves existing translations without overwriting and maintains sorted keys', () => {
      // 1. Pre-populate an existing catalog with a translated string and an existing empty string
      const initialCatalog = {
        'Existing Translated Key': 'Clé traduite existante',
        'Zebra Key': 'Clé zèbre traduite'
      };
      const frCatalogFile = path.join(tmpDir, 'mini.fr.json');
      fs.writeFileSync(frCatalogFile, JSON.stringify(initialCatalog, null, 2), 'utf-8');

      // 2. Extracted data containing existing keys + new keys
      const extractedData = {
        common: new Set(['Common Shell Brand']),
        pages: {
          'mini.html': new Set([
            'Existing Translated Key',
            'Apple Key (New)',
            'Zebra Key',
            'Middle Key (New)'
          ])
        }
      };

      // 3. Write catalog skeletons
      writeCatalogSkeletons(extractedData, tmpDir, ['fr', 'es']);

      // 4. Verify mini.fr.json
      const updatedFr = JSON.parse(fs.readFileSync(frCatalogFile, 'utf-8'));
      assert.equal(updatedFr['Existing Translated Key'], 'Clé traduite existante', 'Must preserve existing translation');
      assert.equal(updatedFr['Zebra Key'], 'Clé zèbre traduite', 'Must preserve existing translation for Zebra Key');
      assert.equal(updatedFr['Apple Key (New)'], '', 'New key must have placeholder empty value');
      assert.equal(updatedFr['Middle Key (New)'], '', 'New key must have placeholder empty value');

      // 5. Verify alphabetical sorting of keys
      const keys = Object.keys(updatedFr);
      const sortedKeys = [...keys].sort();
      assert.deepEqual(keys, sortedKeys, 'Keys in catalog must be sorted alphabetically');

      // 6. Verify common.fr.json and common.es.json were created
      const commonFrFile = path.join(tmpDir, 'common.fr.json');
      const commonEsFile = path.join(tmpDir, 'common.es.json');
      assert.ok(fs.existsSync(commonFrFile), 'common.fr.json should be created');
      assert.ok(fs.existsSync(commonEsFile), 'common.es.json should be created');

      const commonFr = JSON.parse(fs.readFileSync(commonFrFile, 'utf-8'));
      assert.deepEqual(commonFr, { 'Common Shell Brand': '' });
    });
  });

  describe('isTranslatable helper', () => {
    it('accurately identifies translatable vs non-translatable strings', () => {
      assert.equal(isTranslatable('Hello World', doNotTranslateSet), true);
      assert.equal(isTranslatable('Malabo', doNotTranslateSet), false);
      assert.equal(isTranslatable('12345', doNotTranslateSet), false);
      assert.equal(isTranslatable('$ 99.99', doNotTranslateSet), false);
      assert.equal(isTranslatable('—', doNotTranslateSet), false);
      assert.equal(isTranslatable('   ', doNotTranslateSet), false);
      assert.equal(isTranslatable(null, doNotTranslateSet), false);
      assert.equal(isTranslatable(undefined, doNotTranslateSet), false);
    });
  });
});
