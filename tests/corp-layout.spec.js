const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..', 'corporate');
const PAGES = fs.readdirSync(path.join(ROOT, 'en')).filter((f) => f.endsWith('.html'));

const OVERFLOW_SELECTORS = [
  '.sidebar', '.topbar', '.page-header', '.nav-item',
  '.seeker-shell', '.seeker-nav', '.seeker-nav-item', '.feed-header',
  '.entity-shell', '.grid-2', '.integration-card'
].join(', ');

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

      const { matchedCount, overflow } = await p.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        return {
          matchedCount: els.length,
          overflow: els
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => `${el.className}: ${el.scrollWidth}>${el.clientWidth}`)
        };
      }, OVERFLOW_SELECTORS);

      expect(matchedCount, `no layout containers matched on [${locale}] ${page}`).toBeGreaterThan(0);
      expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
      expect(overflow, `overflowing: ${overflow.join(' | ')}`).toEqual([]);
    });
  }
}

test('corporate integrations page renders connectors and allows sync trigger', async ({ page }) => {
  await page.goto('file://' + path.join(ROOT, 'en', 'integrations.html'));
  
  await expect(page.locator('.integration-card', { hasText: 'SAP SuccessFactors' })).toBeVisible();
  await expect(page.locator('.integration-card', { hasText: 'LinkedIn Recruiter' })).toBeVisible();
  await expect(page.locator('.integration-card', { hasText: 'Indeed' })).toBeVisible();
  await expect(page.locator('.integration-card', { hasText: 'Glassdoor' })).toBeVisible();

  let dialogMessage = null;
  page.once('dialog', async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.accept();
  });

  const sapCard = page.locator('.integration-card', { hasText: 'SAP SuccessFactors' });
  await sapCard.getByRole('button', { name: 'Sync Now' }).click();

  expect(dialogMessage).toContain('Data synchronization initiated for SAP SuccessFactors');
});

test('corporate language toggle preserves the current page across locales', async ({ page }) => {
  await page.goto('file://' + path.join(ROOT, 'fr', 'integrations.html'));
  const esHref = await page.getAttribute('a[hreflang="es"]', 'href');
  expect(esHref).toBe('../es/integrations.html');
  const enHref = await page.getAttribute('a[hreflang="en"]', 'href');
  expect(enHref).toBe('../en/integrations.html');
});

test('every corporate internal link resolves on disk', async () => {
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
