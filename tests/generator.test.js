const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');

const {
  translateHtml,
  buildAll,
  rewriteLanguageToggle,
  DEFAULT_PROTOTYPE_PAGES
} = require('../tools/build-i18n.js');

describe('Generator Tool (R3, R5)', () => {
  const miniHtmlPath = path.join(__dirname, 'fixtures', 'mini.html');
  const validFrJsonPath = path.join(__dirname, 'fixtures', 'catalogs', 'valid.fr.json');

  let miniHtml;
  let validFrCatalog;

  beforeEach(() => {
    miniHtml = fs.readFileSync(miniHtmlPath, 'utf-8');
    validFrCatalog = JSON.parse(fs.readFileSync(validFrJsonPath, 'utf-8'));
  });

  describe('translateHtml substitutions', () => {
    // Spec Test 8: text node is replaced from the catalog (using tests/fixtures/mini.html & fixture catalogs)
    it('Spec Test 8: text node is replaced from the catalog', () => {
      const translated = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });

      assert.ok(translated.includes('<h1>Portail du Marché du Travail</h1>'), 'h1 text node must be translated');
      assert.ok(
        translated.includes("<p>Aperçu national de l'emploi déclaré dans le secteur privé en Guinée équatoriale</p>"),
        'p text node must be translated'
      );
      assert.ok(translated.includes('>Tableau de bord<'), 'Nav link text node Dashboard must be translated');
      assert.ok(translated.includes('>Employeurs enregistrés<'), 'Nav link text node Registered Employers must be translated');
      assert.ok(translated.includes('>Administrateur de démonstration<'), 'user-name text node must be translated');
      assert.ok(translated.includes('>Exporter le rapport<'), 'Button text node Export Report must be translated');
      assert.ok(!translated.includes('<h1>Labour Market Portal</h1>'), 'Original h1 must not be present');
    });

    // Spec Test 9: page catalog overrides common catalog on the same key
    it('Spec Test 9: page catalog overrides common catalog on the same key', () => {
      const commonCatalog = {
        'Export': 'Exporter (Common)',
        'Dashboard': 'Tableau de bord (Common)'
      };
      const pageCatalog = {
        'Export': 'Exporter (Page Override)'
      };

      const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Test Page</title></head>
<body>
  <a href="dashboard.html">Dashboard</a>
  <button>Export</button>
</body>
</html>`;

      const translated = translateHtml(html, {
        commonCatalog,
        pageCatalog,
        locale: 'fr',
        pageName: 'test.html'
      });

      assert.ok(
        translated.includes('<button>Exporter (Page Override)</button>'),
        'Page catalog translation must take precedence over common catalog'
      );
      assert.ok(
        !translated.includes('Exporter (Common)'),
        'Common catalog translation must not be used when page catalog overrides it'
      );
      assert.ok(
        translated.includes('>Tableau de bord (Common)<'),
        'Common catalog translation must be used when page catalog has no override'
      );
    });

    // Spec Test 10: whitelisted attributes are translated; others untouched
    it('Spec Test 10: whitelisted attributes are translated; others untouched', () => {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Portal description text">
  <title>Test Page</title>
</head>
<body>
  <input type="text" id="employer-search" name="search_q" placeholder="Search employers..." aria-label="Search employers" data-hf-id="input-123">
  <button id="btn-export" class="btn primary" title="Export data to CSV" data-hf-id="btn-999">Export</button>
  <img src="logo.png" id="main-logo" alt="Ministry Logo" width="120" height="40" data-hf-id="img-001">
  <div data-i18n-ignore="true">
    <button title="Export data to CSV" aria-label="Search employers">Export</button>
  </div>
</body>
</html>`;

      const catalog = {
        'Portal description text': 'Texte de description du portail',
        'Search employers...': 'Rechercher des employeurs...',
        'Search employers': 'Rechercher des employeurs',
        'Export data to CSV': 'Exporter les données au format CSV',
        'Export': 'Exporter',
        'Ministry Logo': 'Logo du Ministère'
      };

      const translated = translateHtml(html, {
        pageCatalog: catalog,
        locale: 'fr',
        pageName: 'test.html'
      });

      // Whitelisted attributes must be translated
      assert.ok(translated.includes('content="Texte de description du portail"'), 'meta description content must be translated');
      assert.ok(translated.includes('placeholder="Rechercher des employeurs..."'), 'placeholder attribute must be translated');
      assert.ok(translated.includes('aria-label="Rechercher des employeurs"'), 'aria-label attribute must be translated');
      assert.ok(translated.includes('title="Exporter les données au format CSV"'), 'title attribute must be translated');
      assert.ok(translated.includes('alt="Logo du Ministère"'), 'alt attribute must be translated');

      // Non-whitelisted attributes must remain byte-identical
      assert.ok(translated.includes('content="width=device-width, initial-scale=1.0"'), 'non-description meta content must be untouched');
      assert.ok(translated.includes('id="employer-search"'), 'id attribute must be untouched');
      assert.ok(translated.includes('name="search_q"'), 'name attribute must be untouched');
      assert.ok(translated.includes('type="text"'), 'type attribute must be untouched');
      assert.ok(translated.includes('data-hf-id="input-123"'), 'data-hf-id must be preserved byte-for-byte');
      assert.ok(translated.includes('data-hf-id="btn-999"'), 'data-hf-id must be preserved byte-for-byte');
      assert.ok(translated.includes('data-hf-id="img-001"'), 'data-hf-id must be preserved byte-for-byte');
      assert.ok(translated.includes('src="logo.png"'), 'src attribute must be untouched');
      assert.ok(translated.includes('width="120"'), 'width attribute must be untouched');
      assert.ok(translated.includes('height="40"'), 'height attribute must be untouched');

      // Elements with data-i18n-ignore must NOT have their attributes or content translated
      assert.ok(
        translated.includes('<div data-i18n-ignore="true">\n    <button title="Export data to CSV" aria-label="Search employers">Export</button>\n  </div>'),
        'data-i18n-ignore container must remain untouched'
      );
    });

    // Spec Test 11: <html lang> and <title> are set per locale
    it('Spec Test 11: <html lang> and <title> are set per locale', () => {
      // Test FR
      const translatedFr = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });
      assert.ok(translatedFr.includes('<html lang="fr">'), 'Must replace <html lang="en"> with <html lang="fr">');
      assert.ok(!translatedFr.includes('<html lang="en">'), 'Must not contain <html lang="en">');
      assert.ok(
        translatedFr.includes('<title>Portail du Marché du Travail — Mini</title>'),
        'Must translate title in French'
      );
      assert.ok(
        !translatedFr.includes('<title>Labour Market Portal — Mini</title>'),
        'Must not contain English title'
      );

      // Test ES
      const esCatalog = {
        'Labour Market Portal — Mini': 'Portal del Mercado Laboral — Mini'
      };
      const translatedEs = translateHtml(miniHtml, {
        pageCatalog: esCatalog,
        locale: 'es',
        pageName: 'mini.html'
      });
      assert.ok(translatedEs.includes('<html lang="es">'), 'Must replace <html lang="en"> with <html lang="es">');
      assert.ok(
        translatedEs.includes('<title>Portal del Mercado Laboral — Mini</title>'),
        'Must translate title in Spanish'
      );
    });

    // Spec Test 12: STR block is replaced; surrounding JS is byte-identical
    it('Spec Test 12: STR block is replaced; surrounding JS is byte-identical', () => {
      const translated = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });

      // Find script tags
      const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
      const originalScriptMatch = scriptRegex.exec(miniHtml);
      assert.ok(originalScriptMatch, 'Original script must be found');
      const originalScript = originalScriptMatch[1];

      scriptRegex.lastIndex = 0;
      const translatedScriptMatch = scriptRegex.exec(translated);
      assert.ok(translatedScriptMatch, 'Translated script must be found');
      const translatedScript = translatedScriptMatch[1];

      // Extract parts before /* i18n:STR:start */ and after /* i18n:STR:end */
      const originalParts = originalScript.split(/\/\*\s*i18n:STR:(?:start|end)\s*\*\//);
      const translatedParts = translatedScript.split(/\/\*\s*i18n:STR:(?:start|end)\s*\*\//);

      assert.equal(originalParts.length, 3, 'Must have prefix, STR block, and suffix');
      assert.equal(translatedParts.length, 3, 'Translated script must have prefix, STR block, and suffix');

      // Prefix and suffix outside the STR delimiters must be 100% byte-identical
      assert.equal(translatedParts[0], originalParts[0], 'Script prefix before STR block must be byte-identical');
      assert.equal(translatedParts[2], originalParts[2], 'Script suffix after STR block must be byte-identical');

      // Verify translated script runs in node:vm
      const sandbox = {};
      vm.createContext(sandbox);
      const strObj = vm.runInContext(translatedScript + '\n; STR;', sandbox);

      assert.ok(strObj, 'STR object must be evaluated in sandbox');
      assert.equal(strObj.commentRequired, 'Veuillez saisir un commentaire avant de soumettre.');
      assert.equal(strObj.returnTitle, 'Retourner l\'enregistrement de l\'employeur');
      assert.equal(strObj.suspendTitle, 'Suspendre l\'employeur');
      assert.equal(
        strObj.suspendConfirm,
        'Êtes-vous sûr de vouloir suspendre l\'accès pour {name} ? Un commentaire est requis pour continuer.'
      );
    });

    // Spec Test 13: fmt() interpolates a reordered placeholder correctly
    it('Spec Test 13: fmt() interpolates a reordered placeholder correctly', () => {
      const html = `<!DOCTYPE html>
<html>
<body>
  <script>
    /* i18n:STR:start */
    const STR = {
      reorderedMessage: "Transfer {amount} from {source} to {target}."
    };
    /* i18n:STR:end */
    const fmt = (s, v = {}) => s.replace(/\\{(\\w+)\\}/g, (_, k) => v[k] ?? '{' + k + '}');
  </script>
</body>
</html>`;

      const esCatalog = {
        'Transfer {amount} from {source} to {target}.': 'De {source} transferir {amount} a {target}.'
      };

      const translated = translateHtml(html, {
        pageCatalog: esCatalog,
        locale: 'es',
        pageName: 'test.html'
      });

      const scriptMatch = translated.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
      assert.ok(scriptMatch, 'Translated script must be found');

      const sandbox = {};
      vm.createContext(sandbox);
      const scope = vm.runInContext(scriptMatch[1] + '\n; ({ STR, fmt });', sandbox);

      assert.ok(typeof scope.fmt === 'function', 'fmt must be a function');
      const formatted = scope.fmt(scope.STR.reorderedMessage, {
        amount: '50 000 FCFA',
        source: 'Compte A',
        target: 'Compte B'
      });

      assert.equal(
        formatted,
        'De Compte A transferir 50 000 FCFA a Compte B.',
        'fmt() must correctly interpolate placeholders when their position in translation is reordered'
      );
    });

    // Spec Test 14: toggle hrefs are correct from root, /fr, and /es
    it('Spec Test 14: toggle hrefs are correct from root, /fr, and /es', () => {
      // From root (EN)
      const rootHtml = translateHtml(miniHtml, {
        pageCatalog: {},
        locale: 'en',
        pageName: 'mini.html'
      });
      assert.ok(rootHtml.includes('href="mini.html">EN</a>'), 'Root EN href must be mini.html');
      assert.ok(rootHtml.includes('href="fr/mini.html">FR</a>'), 'Root FR href must be fr/mini.html');
      assert.ok(rootHtml.includes('href="es/mini.html">ES</a>'), 'Root ES href must be es/mini.html');

      // From /fr
      const frHtml = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });
      assert.ok(frHtml.includes('href="../mini.html">EN</a>'), 'FR build EN href must be ../mini.html');
      assert.ok(frHtml.includes('href="mini.html">FR</a>'), 'FR build FR href must be mini.html');
      assert.ok(frHtml.includes('href="../es/mini.html">ES</a>'), 'FR build ES href must be ../es/mini.html');

      // From /es
      const esHtml = translateHtml(miniHtml, {
        pageCatalog: {},
        locale: 'es',
        pageName: 'mini.html'
      });
      assert.ok(esHtml.includes('href="../mini.html">EN</a>'), 'ES build EN href must be ../mini.html');
      assert.ok(esHtml.includes('href="../fr/mini.html">FR</a>'), 'ES build FR href must be ../fr/mini.html');
      assert.ok(esHtml.includes('href="mini.html">ES</a>'), 'ES build ES href must be mini.html');
    });

    // Spec Test 15: active segment matches the output locale
    it('Spec Test 15: active segment matches the output locale', () => {
      // Root (EN) active segment
      const rootHtml = translateHtml(miniHtml, {
        pageCatalog: {},
        locale: 'en',
        pageName: 'mini.html'
      });
      assert.match(rootHtml, /<a\s+class="[^"]*lang-opt[^"]*is-active[^"]*"\s+hreflang="en"\s+href="mini\.html">EN<\/a>/);
      assert.doesNotMatch(rootHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="fr"/);
      assert.doesNotMatch(rootHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="es"/);

      // FR active segment
      const frHtml = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });
      assert.match(frHtml, /<a\s+class="[^"]*lang-opt[^"]*is-active[^"]*"\s+hreflang="fr"\s+href="mini\.html">FR<\/a>/);
      assert.doesNotMatch(frHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="en"/);
      assert.doesNotMatch(frHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="es"/);

      // ES active segment
      const esHtml = translateHtml(miniHtml, {
        pageCatalog: {},
        locale: 'es',
        pageName: 'mini.html'
      });
      assert.match(esHtml, /<a\s+class="[^"]*lang-opt[^"]*is-active[^"]*"\s+hreflang="es"\s+href="mini\.html">ES<\/a>/);
      assert.doesNotMatch(esHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="en"/);
      assert.doesNotMatch(esHtml, /<a\s+class="[^"]*is-active[^"]*"\s+hreflang="fr"/);
    });

    it('inserts header comment at the top of the generated file', () => {
      const translated = translateHtml(miniHtml, {
        pageCatalog: validFrCatalog,
        locale: 'fr',
        pageName: 'mini.html'
      });

      assert.ok(
        translated.startsWith('<!-- GENERATED FILE - DO NOT EDIT DIRECTLY. Source: ../mini.html -->\n'),
        'Generated HTML must start with the source header comment'
      );
    });
  });

  describe('buildAll static tree generation', () => {
    let tmpDir;
    let srcDir;
    let outDir;
    let i18nDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-generator-test-'));
      srcDir = path.join(tmpDir, 'src');
      outDir = path.join(tmpDir, 'out');
      i18nDir = path.join(tmpDir, 'i18n');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(outDir, { recursive: true });
      fs.mkdirSync(i18nDir, { recursive: true });

      // Create test source pages
      fs.writeFileSync(path.join(srcDir, 'mini.html'), miniHtml, 'utf-8');
      fs.writeFileSync(
        path.join(srcDir, 'page2.html'),
        `<!DOCTYPE html>
<html lang="en">
<head><title>Page Two</title></head>
<body>
  <div class="sidebar-foot">
    <div class="lang-toggle" role="group" aria-label="Language">
      <a class="lang-opt is-active" hreflang="en" href="page2.html">EN</a>
      <a class="lang-opt" hreflang="fr" href="fr/page2.html">FR</a>
      <a class="lang-opt" hreflang="es" href="es/page2.html">ES</a>
    </div>
  </div>
  <h1>Page Two Heading</h1>
</body>
</html>`,
        'utf-8'
      );

      // Create common and page catalogs
      fs.writeFileSync(
        path.join(i18nDir, 'common.fr.json'),
        JSON.stringify({ 'Language': 'Langue', 'Dashboard': 'Tableau de bord' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'common.es.json'),
        JSON.stringify({ 'Language': 'Idioma', 'Dashboard': 'Panel' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'mini.fr.json'),
        JSON.stringify(validFrCatalog, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'mini.es.json'),
        JSON.stringify({ 'Labour Market Portal — Mini': 'Portal del Mercado Laboral — Mini' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'page2.fr.json'),
        JSON.stringify({ 'Page Two': 'Deuxième page', 'Page Two Heading': 'Titre de la deuxième page' }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(i18nDir, 'page2.es.json'),
        JSON.stringify({ 'Page Two': 'Segunda página', 'Page Two Heading': 'Título de la segunda página' }, null, 2),
        'utf-8'
      );
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    // Helper to compute sha256 checksum
    function getFileChecksum(filePath) {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    }

    // Spec Test 16: build is idempotent (two runs, identical checksums)
    it('Spec Test 16: build is idempotent (two runs produce identical file checksums)', () => {
      const pages = ['mini.html', 'page2.html'];

      // First run
      const result1 = buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages
      });

      const frMini1 = path.join(outDir, 'fr', 'mini.html');
      const frPage2_1 = path.join(outDir, 'fr', 'page2.html');
      const esMini1 = path.join(outDir, 'es', 'mini.html');
      const esPage2_1 = path.join(outDir, 'es', 'page2.html');

      assert.ok(fs.existsSync(frMini1), 'fr/mini.html must exist after run 1');
      assert.ok(fs.existsSync(frPage2_1), 'fr/page2.html must exist after run 1');
      assert.ok(fs.existsSync(esMini1), 'es/mini.html must exist after run 1');
      assert.ok(fs.existsSync(esPage2_1), 'es/page2.html must exist after run 1');

      const hashFrMini1 = getFileChecksum(frMini1);
      const hashFrPage2_1 = getFileChecksum(frPage2_1);
      const hashEsMini1 = getFileChecksum(esMini1);
      const hashEsPage2_1 = getFileChecksum(esPage2_1);

      // Second run
      const result2 = buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages
      });

      const hashFrMini2 = getFileChecksum(frMini1);
      const hashFrPage2_2 = getFileChecksum(frPage2_1);
      const hashEsMini2 = getFileChecksum(esMini1);
      const hashEsPage2_2 = getFileChecksum(esPage2_1);

      assert.equal(hashFrMini1, hashFrMini2, 'fr/mini.html checksum must be identical across consecutive runs');
      assert.equal(hashFrPage2_1, hashFrPage2_2, 'fr/page2.html checksum must be identical across consecutive runs');
      assert.equal(hashEsMini1, hashEsMini2, 'es/mini.html checksum must be identical across consecutive runs');
      assert.equal(hashEsPage2_1, hashEsPage2_2, 'es/page2.html checksum must be identical across consecutive runs');
    });

    // Spec Test 17: orphaned output page is removed when its English source is deleted
    it('Spec Test 17: orphaned output page is removed when its English source is deleted', () => {
      // 1. Initial build with two pages
      buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html', 'page2.html']
      });

      const frMini = path.join(outDir, 'fr', 'mini.html');
      const frPage2 = path.join(outDir, 'fr', 'page2.html');
      const esMini = path.join(outDir, 'es', 'mini.html');
      const esPage2 = path.join(outDir, 'es', 'page2.html');

      assert.ok(fs.existsSync(frPage2), 'fr/page2.html must exist initially');
      assert.ok(fs.existsSync(esPage2), 'es/page2.html must exist initially');

      // 2. Remove page2.html from source and list of pages
      fs.rmSync(path.join(srcDir, 'page2.html'));

      // 3. Re-run buildAll
      buildAll({
        srcDir,
        outDir,
        i18nDir,
        locales: ['fr', 'es'],
        pages: ['mini.html']
      });

      // 4. Assert mini.html still exists in fr and es, but page2.html has been removed
      assert.ok(fs.existsSync(frMini), 'fr/mini.html must still exist');
      assert.ok(fs.existsSync(esMini), 'es/mini.html must still exist');
      assert.ok(!fs.existsSync(frPage2), 'fr/page2.html orphan must be removed');
      assert.ok(!fs.existsSync(esPage2), 'es/page2.html orphan must be removed');
    });
  });
});
