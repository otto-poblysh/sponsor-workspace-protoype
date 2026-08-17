const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const {
  checkPageCoverage,
  checkAllCoverage,
  extractStringsWithLocations,
  formatCoverageReport
} = require('../tools/check-i18n.js');

const { translateHtml, buildAll } = require('../tools/build-i18n.js');
const { loadDoNotTranslate } = require('../tools/extract-i18n.js');

describe('Coverage Checker and Progress Reporter (R4, R11)', () => {
  const miniHtmlPath = path.join(__dirname, 'fixtures', 'mini.html');
  const validFrJsonPath = path.join(__dirname, 'fixtures', 'catalogs', 'valid.fr.json');
  const doNotTranslatePath = path.join(__dirname, '..', 'i18n', 'do-not-translate.json');

  let miniHtml;
  let validFrCatalog;
  let doNotTranslateSet;

  beforeEach(() => {
    miniHtml = fs.readFileSync(miniHtmlPath, 'utf-8');
    validFrCatalog = JSON.parse(fs.readFileSync(validFrJsonPath, 'utf-8'));
    if (fs.existsSync(doNotTranslatePath)) {
      doNotTranslateSet = loadDoNotTranslate(doNotTranslatePath);
    } else {
      doNotTranslateSet = new Set(['Malabo', 'Bata', 'Hyperframes', 'Geist', 'EN', 'FR', 'ES']);
    }
  });

  describe('extractStringsWithLocations', () => {
    it('extracts strings along with accurate 1-indexed line numbers from HTML', () => {
      const extracted = extractStringsWithLocations(miniHtml, doNotTranslateSet);
      assert.ok(Array.isArray(extracted), 'Must return an array of items');
      assert.equal(extracted.length, 18, 'Should extract 18 translatable strings from mini.html');

      const titleItem = extracted.find((item) => item.string === 'Labour Market Portal — Mini');
      assert.ok(titleItem, 'Should extract title string');
      assert.equal(titleItem.line, 6, 'Title is on line 6');

      const h1Item = extracted.find((item) => item.string === 'Labour Market Portal');
      assert.ok(h1Item, 'Should extract h1 text');
      assert.equal(h1Item.line, 41, 'h1 is on line 41');

      const descMetaItem = extracted.find((item) => item.string === 'Minimal test harness for i18n tooling');
      assert.ok(descMetaItem, 'Should extract meta description');
      assert.equal(descMetaItem.line, 7, 'meta description is on line 7');

      const placeholderItem = extracted.find((item) => item.string === 'Search employers...');
      assert.ok(placeholderItem, 'Should extract input placeholder');
      assert.equal(placeholderItem.line, 46, 'input placeholder is on line 46');

      const strItem = extracted.find((item) => item.string === 'Please enter a comment before submitting.');
      assert.ok(strItem, 'Should extract STR block string');
      assert.equal(strItem.line, 55, 'STR commentRequired is on line 55');
    });
  });

  describe('checkPageCoverage', () => {
    // Spec Test 18: checker rejects an untranslated string in a generated page (R4)
    it('Spec Test 18: checker rejects an untranslated string in a generated page with line number and filename', () => {
      // Create incomplete catalog missing "Registered Employers" and "Suspend Employer"
      const incompleteFrCatalog = { ...validFrCatalog };
      delete incompleteFrCatalog['Registered Employers'];
      delete incompleteFrCatalog['Suspend Employer'];

      // Generate HTML with incomplete catalog
      const generatedHtml = translateHtml(miniHtml, {
        pageCatalog: incompleteFrCatalog,
        locale: 'fr',
        pageName: 'mini.html',
        doNotTranslateSet
      });

      const report = checkPageCoverage(miniHtml, generatedHtml, {
        locale: 'fr',
        pageName: 'mini.html',
        doNotTranslateSet,
        pageCatalog: incompleteFrCatalog
      });

      assert.equal(report.totalStrings, 18, 'Total strings should be 18');
      assert.equal(report.translatedCount, 16, 'Translated count should be 16');
      assert.equal(report.coveragePercent, 89, 'Coverage percent should be 89% (16/18)');
      assert.equal(report.untranslatedStrings.length, 2, 'Must flag 2 untranslated strings');

      const missing1 = report.untranslatedStrings.find((u) => u.string === 'Registered Employers');
      assert.ok(missing1, 'Must flag "Registered Employers" as untranslated');
      assert.equal(missing1.line, 24, '"Registered Employers" line number should be 24');

      const missing2 = report.untranslatedStrings.find((u) => u.string === 'Suspend Employer');
      assert.ok(missing2, 'Must flag "Suspend Employer" as untranslated');
      assert.equal(missing2.line, 58, '"Suspend Employer" line number should be 58');
    });

    // Spec Test 19: checker passes when all strings are translated (or in do-not-translate.json) (R4)
    it('Spec Test 19: checker passes when all strings are translated (or in do-not-translate.json)', () => {
      // Generate HTML with complete valid catalog
      const generatedHtml = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html',
        doNotTranslateSet
      });

      const report = checkPageCoverage(miniHtml, generatedHtml, {
        locale: 'fr',
        pageName: 'mini.html',
        doNotTranslateSet,
        pageCatalog: validFrCatalog
      });

      assert.equal(report.totalStrings, 18, 'Total strings should be 18');
      assert.equal(report.translatedCount, 18, 'Translated count should be 18');
      assert.equal(report.coveragePercent, 100, 'Coverage percent should be 100%');
      assert.deepEqual(report.untranslatedStrings, [], 'Untranslated strings list must be empty');
    });

    it('ignores untranslated strings that are in doNotTranslateSet without failing', () => {
      const htmlWithProperNouns = `<!DOCTYPE html>
<html lang="en">
<head><title>Test DNT</title></head>
<body>
  <h1>Portal Title</h1>
  <p>Malabo</p>
  <p>Bata</p>
  <p>Hyperframes</p>
  <p>Geist</p>
  <span>100 FCFA</span>
</body>
</html>`;

      const catalog = {
        'Test DNT': 'Test DNT FR',
        'Portal Title': 'Titre du Portail'
      };

      const generated = translateHtml(htmlWithProperNouns, {
        pageCatalog: catalog,
        locale: 'fr',
        pageName: 'test.html',
        doNotTranslateSet
      });

      const report = checkPageCoverage(htmlWithProperNouns, generated, {
        locale: 'fr',
        pageName: 'test.html',
        doNotTranslateSet,
        pageCatalog: catalog
      });

      assert.equal(report.totalStrings, 2, 'Only 2 translatable strings (excluding DNT and currency)');
      assert.equal(report.translatedCount, 2, 'Both translatable strings translated');
      assert.equal(report.coveragePercent, 100);
      assert.deepEqual(report.untranslatedStrings, []);
    });
  });

  describe('checkAllCoverage across multiple pages and locales', () => {
    let tmpDir;
    let srcDir;
    let outDir;
    let i18nDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-coverage-test-'));
      srcDir = path.join(tmpDir, 'src');
      outDir = tmpDir;
      i18nDir = path.join(tmpDir, 'i18n');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(i18nDir, { recursive: true });

      // Page 1: mini.html
      fs.writeFileSync(path.join(srcDir, 'mini.html'), miniHtml, 'utf-8');

      // Page 2: other.html
      const otherHtml = `<!DOCTYPE html>
<html lang="en">
<head><title>Other Page</title></head>
<body>
  <a href="mini.html">Dashboard</a>
  <h1>Section Heading</h1>
</body>
</html>`;
      fs.writeFileSync(path.join(srcDir, 'other.html'), otherHtml, 'utf-8');

      // Catalogs for mini and other
      fs.writeFileSync(
        path.join(i18nDir, 'common.fr.json'),
        JSON.stringify({ Dashboard: 'Tableau de bord' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'common.es.json'),
        JSON.stringify({ Dashboard: 'Panel de control' }, null, 2),
        'utf-8'
      );

      // FR: complete mini.fr.json and other.fr.json
      fs.writeFileSync(
        path.join(i18nDir, 'mini.fr.json'),
        JSON.stringify(validFrCatalog, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'other.fr.json'),
        JSON.stringify({ 'Other Page': 'Autre page', 'Section Heading': 'Titre de section' }, null, 2),
        'utf-8'
      );

      // ES: incomplete mini.es.json (only 1 string translated)
      fs.writeFileSync(
        path.join(i18nDir, 'mini.es.json'),
        JSON.stringify({ 'Labour Market Portal — Mini': 'Portal del Mercado Laboral — Mini' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'other.es.json'),
        JSON.stringify({ 'Other Page': 'Otra página', 'Section Heading': 'Encabezado de sección' }, null, 2),
        'utf-8'
      );

      fs.writeFileSync(
        path.join(i18nDir, 'do-not-translate.json'),
        JSON.stringify(['Malabo', 'Bata', 'Hyperframes', 'EN', 'FR', 'ES'], null, 2),
        'utf-8'
      );
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    // Spec Test 20: coverage output displays per-page and total stats accurately (R11)
    it('Spec Test 20: coverage output displays per-page and total stats accurately', () => {
      // First build generated trees
      buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html', 'other.html']
      });

      const result = checkAllCoverage({
        srcDir,
        genDir: outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html', 'other.html'],
        silent: true
      });

      assert.equal(result.allPassed, false, 'Should be false because ES is incomplete');

      // Check FR reports (100% complete)
      const frReport = result.localeReports.fr;
      assert.ok(frReport, 'FR locale report must exist');
      assert.equal(frReport.pages['mini.html'].coveragePercent, 100);
      assert.equal(frReport.pages['mini.html'].translatedCount, 18);
      assert.equal(frReport.pages['mini.html'].totalStrings, 18);
      assert.equal(frReport.pages['other.html'].coveragePercent, 100);
      assert.equal(frReport.pages['other.html'].translatedCount, 3);
      assert.equal(frReport.pages['other.html'].totalStrings, 3);
      assert.equal(frReport.totalStrings, 21);
      assert.equal(frReport.translatedCount, 21);
      assert.equal(frReport.coveragePercent, 100);
      assert.equal(frReport.errors.length, 0);

      // Check ES reports (incomplete)
      const esReport = result.localeReports.es;
      assert.ok(esReport, 'ES locale report must exist');
      assert.equal(esReport.pages['other.html'].coveragePercent, 100);
      assert.equal(esReport.pages['mini.html'].totalStrings, 18);
      // In mini.html for ES: only title + common Dashboard are translated -> 2/18
      assert.equal(esReport.pages['mini.html'].translatedCount, 2);
      assert.equal(esReport.pages['mini.html'].untranslatedStrings.length, 16);
      assert.equal(esReport.pages['mini.html'].coveragePercent, 11);
      assert.ok(esReport.errors.length > 0, 'ES must have reported errors');

      // Check overall stats
      assert.equal(result.overallCoverage.totalStrings, 42); // 21 in FR + 21 in ES
      assert.equal(result.overallCoverage.translatedCount, 26); // 21 in FR + 5 in ES
      assert.equal(result.overallCoverage.coveragePercent, 62); // 26 / 42 = 62%

      // Check formatCoverageReport formatting
      const textOutput = formatCoverageReport(result);
      assert.ok(textOutput.includes('fr/mini.html: 18/18 (100%)'), 'Report text must show fr/mini.html stats');
      assert.ok(textOutput.includes('fr/other.html: 3/3 (100%)'), 'Report text must show fr/other.html stats');
      assert.ok(textOutput.includes('es/mini.html: 2/18 (11%)'), 'Report text must show es/mini.html stats');
      assert.ok(textOutput.includes('es Total: 5/21 (24%)'), 'Report text must show es Total stats');
      assert.ok(textOutput.includes('Overall: 26/42 (62%)'), 'Report text must show Overall stats');
      assert.ok(textOutput.includes('es/mini.html: line 41 - "Labour Market Portal"'), 'Report must detail missing strings with line numbers');
    });

    it('returns allPassed: true when all locales and pages are 100% translated', () => {
      // Make ES complete as well
      fs.writeFileSync(
        path.join(i18nDir, 'mini.es.json'),
        JSON.stringify(validFrCatalog, null, 2), // reuse fixture as complete catalog
        'utf-8'
      );

      buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html', 'other.html']
      });

      const result = checkAllCoverage({
        srcDir,
        genDir: outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html', 'other.html'],
        silent: true
      });

      assert.equal(result.allPassed, true);
      assert.equal(result.errors.length, 0);
      assert.equal(result.overallCoverage.coveragePercent, 100);
      assert.equal(result.localeReports.fr.coveragePercent, 100);
      assert.equal(result.localeReports.es.coveragePercent, 100);
    });
  });

  describe('CLI execution and exit codes', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-cli-test-'));
      fs.mkdirSync(path.join(tmpDir, 'i18n'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'mini.html'), miniHtml, 'utf-8');
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'do-not-translate.json'),
        JSON.stringify(['Malabo', 'Bata', 'EN', 'FR', 'ES'], null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'common.fr.json'),
        JSON.stringify({}, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'common.es.json'),
        JSON.stringify({}, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'mini.fr.json'),
        JSON.stringify(validFrCatalog, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'mini.es.json'),
        JSON.stringify({}, null, 2),
        'utf-8'
      );
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('exits with code 1 when translation coverage is incomplete', () => {
      // Build static tree
      buildAll({
        srcDir: tmpDir,
        outDir: tmpDir,
        i18nDir: path.join(tmpDir, 'i18n'),
        locales: ['fr', 'es'],
        pages: ['mini.html']
      });

      const scriptPath = path.resolve(__dirname, '..', 'tools', 'check-i18n.js');
      const proc = spawnSync('node', [scriptPath, '--src', tmpDir, '--gen', tmpDir, '--i18n', path.join(tmpDir, 'i18n'), '--pages', 'mini.html'], {
        encoding: 'utf-8'
      });

      assert.equal(proc.status, 1, 'Process should exit with code 1 on incomplete translation');
      const output = proc.stdout + proc.stderr;
      assert.ok(output.includes('es/mini.html'), 'Output should mention incomplete es/mini.html');
      assert.ok(output.includes('Coverage check failed') || output.includes('untranslated string'), 'Output should state failure');
    });

    it('exits with code 0 when translation coverage is 100%', () => {
      // Complete ES catalog
      fs.writeFileSync(
        path.join(tmpDir, 'i18n', 'mini.es.json'),
        JSON.stringify(validFrCatalog, null, 2),
        'utf-8'
      );

      // Build static tree
      buildAll({
        srcDir: tmpDir,
        outDir: tmpDir,
        i18nDir: path.join(tmpDir, 'i18n'),
        locales: ['fr', 'es'],
        pages: ['mini.html']
      });

      const scriptPath = path.resolve(__dirname, '..', 'tools', 'check-i18n.js');
      const proc = spawnSync('node', [scriptPath, '--src', tmpDir, '--gen', tmpDir, '--i18n', path.join(tmpDir, 'i18n'), '--pages', 'mini.html'], {
        encoding: 'utf-8'
      });

      assert.equal(proc.status, 0, 'Process should exit with code 0 on complete translation');
      const output = proc.stdout + proc.stderr;
      assert.ok(output.includes('100%') || output.includes('passed'), 'Output should state success');
    });
  });
});
