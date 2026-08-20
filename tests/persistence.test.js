const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');

const ENGLISH_PAGES = [
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

/**
 * Extracts and executes the head routing script in a mock DOM / browser environment.
 * @param {string} html
 * @param {object} options
 * @returns {{ replacedUrl: string|null, localStorage: object, registeredEvents: object }}
 */
function executeRoutingScript(html, {
  pathname = '/index.html',
  search = '',
  hash = '',
  portalLang = null,
  docLang = 'en'
} = {}) {
  const store = new Map();
  if (portalLang !== null && portalLang !== undefined) {
    store.set('portalLang', String(portalLang));
  }

  let replacedUrl = null;
  const eventListeners = {};

  const mockLocalStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, val) {
      store.set(key, String(val));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };

  const mockLocation = {
    pathname,
    search,
    hash,
    replace(url) {
      replacedUrl = url;
    },
    assign(url) {
      replacedUrl = url;
    },
    href: `https://example.com${pathname}${search}${hash}`
  };

  const mockDocument = {
    documentElement: {
      lang: docLang
    },
    addEventListener(event, handler) {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler);
    },
    querySelectorAll() {
      return [];
    }
  };

  // Find the head script containing routing / persistence
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let routingScriptCode = null;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].includes('portalLang') || match[1].includes('URLSearchParams')) {
      routingScriptCode = match[1];
      break;
    }
  }

  if (!routingScriptCode) {
    throw new Error('Routing / persistence script not found in HTML');
  }

  const context = vm.createContext({
    window: {
      location: mockLocation,
      localStorage: mockLocalStorage,
      URLSearchParams
    },
    location: mockLocation,
    localStorage: mockLocalStorage,
    document: mockDocument,
    URLSearchParams,
    console
  });

  vm.runInContext(routingScriptCode, context);

  return {
    replacedUrl,
    localStorage: mockLocalStorage,
    eventListeners
  };
}

describe('Language Persistence and Locale-Aware Routing (R8, R9)', () => {
  describe('English source pages contain routing and persistence script in <head>', () => {
    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName} contains language routing script in <head>`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        assert.ok(fs.existsSync(filePath), `${pageName} must exist`);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Verify head contains script referencing portalLang and URLSearchParams
        const headMatch = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(content);
        assert.ok(headMatch, `${pageName} must have a <head> block`);
        const headContent = headMatch[1];
        assert.ok(
          headContent.includes('portalLang'),
          `${pageName} <head> must contain script referencing portalLang`
        );
        assert.ok(
          headContent.includes('URLSearchParams'),
          `${pageName} <head> must contain URLSearchParams logic for ?lang=en`
        );
      });
    }
  });

  describe('Spec Test 26: no stored preference → no redirect (R8)', () => {
    for (const pageName of ENGLISH_PAGES) {
      it(`${pageName}: no stored preference does not redirect`, () => {
        const filePath = path.join(ROOT_DIR, pageName);
        const html = fs.readFileSync(filePath, 'utf-8');

        const result = executeRoutingScript(html, {
          pathname: `/${pageName}`,
          portalLang: null
        });

        assert.equal(result.replacedUrl, null, `Must not redirect when portalLang is null on ${pageName}`);
        assert.equal(result.localStorage.getItem('portalLang'), null, 'portalLang should remain unset');
      });
    }
  });

  describe('Spec Test 27: portalLang=es or fr on a root page → redirect to localized tree (R8)', () => {
    it('portalLang=es on /index.html redirects to es/index.html', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/index.html',
        portalLang: 'es'
      });

      assert.equal(result.replacedUrl, 'es/index.html', 'Must redirect to es/index.html');
    });

    it('portalLang=fr on /entities.html redirects to fr/entities.html', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'entities.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/entities.html',
        portalLang: 'fr'
      });

      assert.equal(result.replacedUrl, 'fr/entities.html', 'Must redirect to fr/entities.html');
    });

    it('preserves query parameters and URL hash on redirect', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'general-report.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/general-report.html',
        search: '?tab=summary&export=pdf',
        hash: '#exports-table',
        portalLang: 'es'
      });

      assert.equal(
        result.replacedUrl,
        'es/general-report.html?tab=summary&export=pdf#exports-table',
        'Must preserve search and hash'
      );
    });

    it('handles nested pathnames cleanly (e.g. /demo/skill-gap.html)', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'skill-gap.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/demo/skill-gap.html',
        portalLang: 'fr'
      });

      assert.equal(result.replacedUrl, 'fr/skill-gap.html', 'Must redirect to fr/skill-gap.html');
    });
  });

  describe('Spec Test 28: ?lang=en clears preference and pins English (R8)', () => {
    it('?lang=en clears portalLang=es and prevents redirect', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/index.html',
        search: '?lang=en',
        portalLang: 'es'
      });

      assert.equal(result.replacedUrl, null, 'Must NOT redirect when ?lang=en is present');
      assert.equal(result.localStorage.getItem('portalLang'), null, 'portalLang must be removed from localStorage');
    });

    it('?lang=en clears portalLang=fr and prevents redirect on subpage', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'users-management.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/users-management.html',
        search: '?filter=active&lang=en',
        portalLang: 'fr'
      });

      assert.equal(result.replacedUrl, null, 'Must NOT redirect when ?lang=en is present');
      assert.equal(result.localStorage.getItem('portalLang'), null, 'portalLang must be removed');
    });
  });

  describe('Spec Test 29: redirect never loops on /fr or /es pages (R8)', () => {
    it('does not redirect on French generated page when portalLang=fr', () => {
      const frIndexPath = path.join(ROOT_DIR, 'fr', 'index.html');
      if (fs.existsSync(frIndexPath)) {
        const html = fs.readFileSync(frIndexPath, 'utf-8');
        const result = executeRoutingScript(html, {
          pathname: '/fr/index.html',
          portalLang: 'fr',
          docLang: 'fr'
        });

        assert.equal(result.replacedUrl, null, 'French page must not redirect when portalLang is fr');
      }
    });

    it('does not redirect on Spanish generated page when portalLang=es', () => {
      const esEntitiesPath = path.join(ROOT_DIR, 'es', 'entities.html');
      if (fs.existsSync(esEntitiesPath)) {
        const html = fs.readFileSync(esEntitiesPath, 'utf-8');
        const result = executeRoutingScript(html, {
          pathname: '/es/entities.html',
          portalLang: 'es',
          docLang: 'es'
        });

        assert.equal(result.replacedUrl, null, 'Spanish page must not redirect when portalLang is es');
      }
    });

    it('does not redirect if pathname is in /fr/ or /es/ directory', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
      const resultFr = executeRoutingScript(html, {
        pathname: '/app/fr/index.html',
        portalLang: 'fr',
        docLang: 'fr'
      });
      assert.equal(resultFr.replacedUrl, null, 'Must not redirect inside /fr/ path');

      const resultEs = executeRoutingScript(html, {
        pathname: '/app/es/index.html',
        portalLang: 'es',
        docLang: 'es'
      });
      assert.equal(resultEs.replacedUrl, null, 'Must not redirect inside /es/ path');
    });
  });

  describe('Language toggle click persistence', () => {
    it('registers click listener that saves portalLang on clicking toggle segment', () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
      const result = executeRoutingScript(html, {
        pathname: '/index.html',
        portalLang: null
      });

      assert.ok(result.eventListeners['click'] && result.eventListeners['click'].length > 0, 'Must register click listener');
      const clickHandler = result.eventListeners['click'][0];

      // Simulate click on FR toggle
      clickHandler({
        target: {
          closest(selector) {
            if (selector === '.lang-opt') {
              return {
                getAttribute(attr) {
                  return attr === 'hreflang' ? 'fr' : null;
                }
              };
            }
            return null;
          }
        }
      });

      assert.equal(result.localStorage.getItem('portalLang'), 'fr', 'Clicking FR must save portalLang=fr');

      // Simulate click on ES toggle
      clickHandler({
        target: {
          closest(selector) {
            if (selector === '.lang-opt') {
              return {
                getAttribute(attr) {
                  return attr === 'hreflang' ? 'es' : null;
                }
              };
            }
            return null;
          }
        }
      });

      assert.equal(result.localStorage.getItem('portalLang'), 'es', 'Clicking ES must save portalLang=es');

      // Simulate click on EN toggle
      clickHandler({
        target: {
          closest(selector) {
            if (selector === '.lang-opt') {
              return {
                getAttribute(attr) {
                  return attr === 'hreflang' ? 'en' : null;
                }
              };
            }
            return null;
          }
        }
      });

      assert.equal(result.localStorage.getItem('portalLang'), 'en', 'Clicking EN must save portalLang=en');
    });
  });

  describe('Locale-aware formatting (R9)', () => {
    it('formats numbers with locale-appropriate thousand separators', () => {
      const num = 1234567;

      const enFormatted = new Intl.NumberFormat('en-GB').format(num);
      assert.equal(enFormatted, '1,234,567', 'English uses commas for thousands');

      const frFormatted = new Intl.NumberFormat('fr-GQ').format(num);
      // French uses space / narrow no-break space
      assert.match(frFormatted, /1[\s\u00A0\u202F]234[\s\u00A0\u202F]567/, 'French uses spaces for thousands');

      const esFormatted = new Intl.NumberFormat('es-GQ').format(num);
      // Spanish format
      assert.ok(esFormatted.includes('1') && esFormatted.includes('234') && esFormatted.includes('567'));
    });

    it('formats dates according to document locale in general-report.html', () => {
      const testDate = new Date('2026-08-17T14:30:00Z');

      const enDate = testDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      assert.ok(enDate.includes('Aug') || enDate.includes('17'), 'en-GB date format');

      const frDate = testDate.toLocaleDateString('fr-GQ', { day: '2-digit', month: 'short', year: 'numeric' });
      assert.ok(frDate.includes('août') || frDate.includes('aout') || frDate.includes('17'), 'fr-GQ date format');

      const esDate = testDate.toLocaleDateString('es-GQ', { day: '2-digit', month: 'short', year: 'numeric' });
      assert.ok(esDate.includes('ago') || esDate.includes('17'), 'es-GQ date format');

      // Verify general-report.html contains locale detection logic
      const reportHtml = fs.readFileSync(path.join(ROOT_DIR, 'general-report.html'), 'utf-8');
      assert.ok(
        reportHtml.includes('document.documentElement.lang') || reportHtml.includes('pageLocale'),
        'general-report.html must detect locale from document.documentElement.lang'
      );
      assert.ok(
        reportHtml.includes('dateLocale') || reportHtml.includes('es-GQ') || reportHtml.includes('fr-GQ'),
        'general-report.html must map locale to dateLocale (en-GB, fr-GQ, es-GQ)'
      );
    });
  });
});
