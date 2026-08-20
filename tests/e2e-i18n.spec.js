// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PAGES = [
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

const LOCALES = ['en', 'fr', 'es'];

const ROOT_DIR = path.resolve(__dirname, '..');

function getPagePath(locale, page) {
  if (locale === 'en') {
    return path.join(ROOT_DIR, page);
  }
  return path.join(ROOT_DIR, locale, page);
}

function getPageUrl(locale, page, query = '') {
  const filePath = getPagePath(locale, page);
  return `file://${filePath}${query ? '?' + query : ''}`;
}

test.describe('Trilingual Portal E2E Test Suite (Spec Tests 21–25)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('icubefarm-demo-unlocked', '1');
      } catch (err) {
        /* ignore */
      }
    });
  });

  // --------------------------------------------------------------------------
  // Spec Test 21: All 33 pages load with zero console errors or runtime exceptions
  // --------------------------------------------------------------------------
  test.describe('Spec Test 21: Page Load & Console Health (All 33 pages)', () => {
    for (const locale of LOCALES) {
      for (const pageName of PAGES) {
        test(`[${locale.toUpperCase()}] ${pageName} loads with zero console errors`, async ({ page }) => {
          const consoleErrors = [];
          const pageErrors = [];

          page.on('console', msg => {
            if (msg.type() === 'error') {
              consoleErrors.push(msg.text());
            }
          });

          page.on('pageerror', err => {
            pageErrors.push(err.message);
          });

          // Pin locale to English escape hatch or ensure clear localStorage so root pages don't redirect away
          const url = getPageUrl(locale, pageName, locale === 'en' ? 'lang=en' : '');
          await page.goto(url, { waitUntil: 'load' });

          expect(consoleErrors, `Expected 0 console errors on ${locale}/${pageName}`).toEqual([]);
          expect(pageErrors, `Expected 0 runtime exceptions on ${locale}/${pageName}`).toEqual([]);

          // Verify document has correct html lang attribute
          const docLang = await page.locator('html').getAttribute('lang');
          expect(docLang).toBe(locale);

          // Verify document has a non-empty title
          const title = await page.title();
          expect(title.trim().length).toBeGreaterThan(0);

          // Verify sidebar and language toggle exist
          await expect(page.locator('.sidebar')).toBeVisible();
          await expect(page.locator('.lang-toggle')).toBeVisible();
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // Spec Test 22: Internal links and toggle links resolve to existing files
  // --------------------------------------------------------------------------
  test.describe('Spec Test 22: Link Integrity & File Resolution (All 33 pages)', () => {
    for (const locale of LOCALES) {
      for (const pageName of PAGES) {
        test(`[${locale.toUpperCase()}] ${pageName} internal navigation & toggle links resolve`, async ({ page }) => {
          const url = getPageUrl(locale, pageName, locale === 'en' ? 'lang=en' : '');
          await page.goto(url, { waitUntil: 'domcontentloaded' });

          const pageFilePath = getPagePath(locale, pageName);
          const pageDir = path.dirname(pageFilePath);

          // Extract all <a> links on the page
          const links = await page.$$eval('a[href]', els =>
            els.map(el => ({
              href: el.getAttribute('href') || '',
              text: (el.textContent || '').trim(),
              className: el.className
            }))
          );

          expect(links.length).toBeGreaterThan(0);

          for (const link of links) {
            const rawHref = link.href.trim();
            // Skip anchor jumps, mailto, tel, javascript, or external URLs
            if (!rawHref ||
                rawHref.startsWith('#') ||
                rawHref.startsWith('javascript:') ||
                rawHref.startsWith('mailto:') ||
                rawHref.startsWith('tel:') ||
                rawHref.startsWith('http://') ||
                rawHref.startsWith('https://')) {
              continue;
            }

            // Remove query params and hashes for file existence verification
            const cleanHref = rawHref.split('?')[0].split('#')[0];
            const resolvedPath = path.resolve(pageDir, cleanHref);

            const exists = fs.existsSync(resolvedPath);
            expect(exists, `Link target "${rawHref}" (resolved to ${resolvedPath}) must exist on filesystem for ${locale}/${pageName}`).toBe(true);
          }

          // Specifically check language toggle links
          const toggleLinks = await page.$$eval('.lang-toggle .lang-opt', els =>
            els.map(el => ({
              hreflang: el.getAttribute('hreflang'),
              href: el.getAttribute('href'),
              isActive: el.classList.contains('is-active')
            }))
          );

          expect(toggleLinks.length).toBe(3);

          const activeOpt = toggleLinks.find(l => l.isActive);
          expect(activeOpt, `Toggle on ${locale}/${pageName} must have an active segment`).toBeDefined();
          expect(activeOpt?.hreflang).toBe(locale);

          // Verify each toggle option points to the correct target
          for (const opt of toggleLinks) {
            const cleanHref = (opt.href || '').split('?')[0].split('#')[0];
            const resolvedPath = path.resolve(pageDir, cleanHref);
            expect(fs.existsSync(resolvedPath), `Toggle link "${opt.href}" from ${locale}/${pageName} must resolve`).toBe(true);

            if (opt.hreflang === 'en') {
              expect(resolvedPath).toBe(path.join(ROOT_DIR, pageName));
            } else if (opt.hreflang === 'fr') {
              expect(resolvedPath).toBe(path.join(ROOT_DIR, 'fr', pageName));
            } else if (opt.hreflang === 'es') {
              expect(resolvedPath).toBe(path.join(ROOT_DIR, 'es', pageName));
            }
          }
        });
      }
    }
  });

  // --------------------------------------------------------------------------
  // Spec Test 23: Toggle navigation between EN -> FR -> ES -> EN
  // --------------------------------------------------------------------------
  test.describe('Spec Test 23: Interactive Language Toggle Navigation', () => {
    for (const pageName of PAGES) {
      test(`Toggle navigation on ${pageName} cycles EN -> FR -> ES -> EN correctly`, async ({ page }) => {
        // Start at root English page with escape hatch
        await page.goto(getPageUrl('en', pageName, 'lang=en'), { waitUntil: 'load' });
        expect(await page.locator('html').getAttribute('lang')).toBe('en');
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="en"]')).toHaveClass(/is-active/);

        // Click FR segment
        await page.locator('.lang-toggle .lang-opt[hreflang="fr"]').click();
        await page.waitForLoadState('load');

        // Should land on matching French page
        expect(page.url()).toContain(`/fr/${pageName}`);
        expect(await page.locator('html').getAttribute('lang')).toBe('fr');
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="fr"]')).toHaveClass(/is-active/);
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="en"]')).not.toHaveClass(/is-active/);

        // Click ES segment
        await page.locator('.lang-toggle .lang-opt[hreflang="es"]').click();
        await page.waitForLoadState('load');

        // Should land on matching Spanish page
        expect(page.url()).toContain(`/es/${pageName}`);
        expect(await page.locator('html').getAttribute('lang')).toBe('es');
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="es"]')).toHaveClass(/is-active/);
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="fr"]')).not.toHaveClass(/is-active/);

        // Click EN segment
        await page.locator('.lang-toggle .lang-opt[hreflang="en"]').click();
        await page.waitForLoadState('load');

        // Should land back on root English page
        expect(page.url()).not.toContain('/fr/');
        expect(page.url()).not.toContain('/es/');
        expect(page.url()).toContain(pageName);
        expect(await page.locator('html').getAttribute('lang')).toBe('en');
        await expect(page.locator('.lang-toggle .lang-opt[hreflang="en"]')).toHaveClass(/is-active/);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Spec Test 24: Layout overflow check at 1920x1080 and 768x1024 viewports
  // --------------------------------------------------------------------------
  test.describe('Spec Test 24: Layout Integrity & Overflow Verification', () => {
    const viewports = [
      { name: '1920x1080 (Desktop)', width: 1920, height: 1080 },
      { name: '768x1024 (Tablet/Mobile)', width: 768, height: 1024 }
    ];

    for (const vp of viewports) {
      test.describe(`Viewport: ${vp.name}`, () => {
        for (const locale of LOCALES) {
          for (const pageName of PAGES) {
            test(`[${locale.toUpperCase()}] ${pageName} has no layout overflow in sidebar or header elements`, async ({ page }) => {
              await page.setViewportSize({ width: vp.width, height: vp.height });
              const url = getPageUrl(locale, pageName, locale === 'en' ? 'lang=en' : '');
              await page.goto(url, { waitUntil: 'load' });

              const overflows = await page.evaluate(() => {
                const results = [];
                const selectors = [
                  '.sidebar',
                  '.sidebar-head',
                  '.sidebar-brand',
                  '.brand-title',
                  '.sidebar-nav',
                  '.sidebar-nav a',
                  '.sidebar-foot',
                  '.lang-toggle',
                  '.lang-opt',
                  '.header',
                  '.topbar',
                  '.page-header',
                  '.header-title',
                  '.stat-card',
                  '.stat',
                  '.kpi-card'
                ];

                for (const selector of selectors) {
                  const elements = document.querySelectorAll(selector);
                  elements.forEach((el, idx) => {
                    // scrollWidth must not exceed clientWidth + 1 (1px tolerance for subpixel rounding)
                    if (el.scrollWidth > el.clientWidth + 1) {
                      results.push({
                        selector,
                        index: idx,
                        className: el.className,
                        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50),
                        scrollWidth: el.scrollWidth,
                        clientWidth: el.clientWidth,
                        overflowDiff: el.scrollWidth - el.clientWidth
                      });
                    }
                  });
                }

                return results;
              });

              expect(overflows, `Found overflowing elements on ${locale}/${pageName} at ${vp.name}: ${JSON.stringify(overflows, null, 2)}`).toEqual([]);
            });
          }
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Spec Test 25: E2E persistence and escape hatch (?lang=en, redirect loops)
  // --------------------------------------------------------------------------
  test.describe('Spec Test 25: Language Preference Persistence & Routing (R8)', () => {

    test('Clicking language toggle sets localStorage.portalLang and navigates', async ({ page }) => {
      // Navigate to root entities page
      await page.goto(getPageUrl('en', 'entities.html', 'lang=en'), { waitUntil: 'load' });

      // Click ES toggle
      await page.locator('.lang-toggle .lang-opt[hreflang="es"]').click();
      await page.waitForLoadState('load');

      expect(page.url()).toContain('/es/entities.html');

      // Verify localStorage.portalLang is set to 'es'
      const storedLang = await page.evaluate(() => localStorage.getItem('portalLang'));
      expect(storedLang).toBe('es');
    });

    test('Navigating to root page with stored portalLang=es automatically redirects to /es/ page', async ({ page }) => {
      // Set preference in localStorage
      await page.goto(getPageUrl('en', 'index.html', 'lang=en'), { waitUntil: 'load' });
      await page.evaluate(() => localStorage.setItem('portalLang', 'es'));

      // Now navigate to a root page without ?lang=en
      await page.goto(getPageUrl('en', 'index.html'), { waitUntil: 'load' });

      // Should automatically redirect to es/index.html
      expect(page.url()).toContain('/es/index.html');
      expect(await page.locator('html').getAttribute('lang')).toBe('es');
    });

    test('Navigating to root subpage with stored portalLang=fr automatically redirects to /fr/ page', async ({ page }) => {
      // Set preference in localStorage
      await page.goto(getPageUrl('en', 'index.html', 'lang=en'), { waitUntil: 'load' });
      await page.evaluate(() => localStorage.setItem('portalLang', 'fr'));

      // Navigate to skill-gap.html at root
      await page.goto(getPageUrl('en', 'skill-gap.html'), { waitUntil: 'load' });

      // Should automatically redirect to fr/skill-gap.html
      expect(page.url()).toContain('/fr/skill-gap.html');
      expect(await page.locator('html').getAttribute('lang')).toBe('fr');
    });

    test('?lang=en escape hatch clears stored preference and stays on English page', async ({ page }) => {
      // Set preference in localStorage
      await page.goto(getPageUrl('en', 'index.html', 'lang=en'), { waitUntil: 'load' });
      await page.evaluate(() => localStorage.setItem('portalLang', 'es'));

      // Navigate with ?lang=en escape hatch
      await page.goto(getPageUrl('en', 'index.html', 'lang=en'), { waitUntil: 'load' });

      // Should remain on English page
      expect(page.url()).not.toContain('/es/');
      expect(page.url()).not.toContain('/fr/');
      expect(await page.locator('html').getAttribute('lang')).toBe('en');

      // Stored preference should be cleared
      const storedLang = await page.evaluate(() => localStorage.getItem('portalLang'));
      expect(storedLang).toBeNull();
    });

    test('First visit with no stored preference stays on English page without redirect', async ({ page }) => {
      // Clear localStorage
      await page.goto(getPageUrl('en', 'general-report.html', 'lang=en'), { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());

      // Navigate to another root page
      await page.goto(getPageUrl('en', 'general-report.html'), { waitUntil: 'load' });

      // Should stay on English page
      expect(page.url()).not.toContain('/es/');
      expect(page.url()).not.toContain('/fr/');
      expect(await page.locator('html').getAttribute('lang')).toBe('en');
    });

    test('Direct visit to localized pages (/fr/ or /es/) never loops or reloads', async ({ page }) => {
      // Set localStorage to es
      await page.goto(getPageUrl('es', 'users-management.html'), { waitUntil: 'load' });
      await page.evaluate(() => localStorage.setItem('portalLang', 'es'));

      // Reload es page
      await page.goto(getPageUrl('es', 'users-management.html'), { waitUntil: 'load' });
      expect(page.url()).toContain('/es/users-management.html');
      expect(await page.locator('html').getAttribute('lang')).toBe('es');

      // Set localStorage to fr
      await page.evaluate(() => localStorage.setItem('portalLang', 'fr'));
      await page.goto(getPageUrl('fr', 'activity-logs.html'), { waitUntil: 'load' });
      expect(page.url()).toContain('/fr/activity-logs.html');
      expect(await page.locator('html').getAttribute('lang')).toBe('fr');
    });

  });

});
