const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..', 'pan-african-org');
const PAGES = fs.readdirSync(path.join(ROOT, 'en')).filter((f) => f.endsWith('.html'));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('icubefarm-demo-unlocked', '1');
    } catch (err) {
      /* ignore */
    }
  });
});

for (const locale of ['en', 'fr', 'es']) {
  for (const page of PAGES) {
    test(`[${locale}] ${page} renders without overflow or console errors`, async ({ page: p }) => {
      const errors = [];
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

      await p.setViewportSize({ width: 1920, height: 1080 });
      await p.goto('file://' + path.join(ROOT, locale, page));
      await p.waitForTimeout(300);

      const overflow = await p.evaluate(() =>
        [...document.querySelectorAll('.sidebar, .topbar, .page-header, .nav-item')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => `${el.className}: ${el.scrollWidth}>${el.clientWidth}`)
      );

      expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
      expect(overflow, `overflowing: ${overflow.join(' | ')}`).toEqual([]);
    });
  }
}

test('language toggle preserves the current page across locales', async ({ page }) => {
  await page.goto('file://' + path.join(ROOT, 'fr', 'skill-gap.html'));
  const esHref = await page.getAttribute('a[hreflang="es"]', 'href');
  expect(esHref).toBe('../es/skill-gap.html');
  const enHref = await page.getAttribute('a[hreflang="en"]', 'href');
  expect(enHref).toBe('../en/skill-gap.html');
});

test('every internal link resolves on disk', async () => {
  const missing = [];
  for (const locale of ['en', 'fr', 'es']) {
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(ROOT, locale, page), 'utf8');
      for (const m of html.matchAll(/href="([^"]+\.html)"/g)) {
        const target = path.resolve(path.join(ROOT, locale), m[1]);
        if (!fs.existsSync(target)) missing.push(`${locale}/${page} -> ${m[1]}`);
      }
    }
  }
  expect(missing, `broken links: ${missing.join(', ')}`).toEqual([]);
});

test('demo gate is actually bypassed, not vacuously passing', async ({ page }) => {
  await page.goto('file://' + path.join(ROOT, 'en', 'index.html'));
  await page.waitForTimeout(300);

  // If the sessionStorage bypass ever stopped working, gate.js would mount
  // #demo-gate-root and hide the real content behind it — these two
  // assertions would then fail, catching a vacuous pass in the tests above.
  await expect(page.locator('#demo-gate-root')).toHaveCount(0);
  await expect(page.locator('.sidebar')).toBeVisible();
});
