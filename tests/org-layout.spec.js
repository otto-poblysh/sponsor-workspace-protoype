const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..', 'pan-african-org');
const PAGES = fs.readdirSync(path.join(ROOT, 'en')).filter((f) => f.endsWith('.html'));

// The site has two different page shells: the "standard" shell (.sidebar,
// .topbar, .page-header, .nav-item — used by most pages, including
// recruiter-jobs.html) and the seeker-home.html shell, which uses its own
// class names (.seeker-shell, .seeker-nav, .seeker-nav-item, .feed-header)
// and matches none of the standard selectors. Both shell families are
// listed here so overflow coverage doesn't silently drop to a single
// leftover element (e.g. just .topbar) on a page using the other shell.
const OVERFLOW_SELECTORS = [
  '.sidebar', '.topbar', '.page-header', '.nav-item',
  '.seeker-shell', '.seeker-nav', '.seeker-nav-item', '.feed-header',
  '.entity-shell'
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

      // A page whose shell uses class names outside OVERFLOW_SELECTORS
      // would match zero elements and pass vacuously (nothing to check for
      // overflow). Fail loudly instead so a future shell can't silently
      // opt out of coverage.
      expect(matchedCount, `no layout containers matched on [${locale}] ${page} — extend OVERFLOW_SELECTORS for this page's shell`).toBeGreaterThan(0);
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

test('verifying a suspended entity renders a localized badge, not an English leak', async ({ page }) => {
  // Regression test for the English-literal 2nd/4th arguments to
  // changeStatus(btn, statusLabel, badgeClass, nextActionLabel) that used
  // to leak 'Verified'/'Suspend' straight into the badge/button text on
  // fr/es, invisible to org:check because it only scans static text nodes
  // — clicking is required to see the bug at all.
  await page.goto('file://' + path.join(ROOT, 'fr', 'entities.html'));

  const row = page.locator('tr', { hasText: 'Northern Highlands Construction' });
  await expect(row.locator('td:nth-child(5) .badge')).toHaveText('Suspendu');

  await row.getByRole('button', { name: 'Activer' }).click();

  const badge = row.locator('td:nth-child(5) .badge');
  await expect(badge).toHaveText('Vérifié');
  await expect(badge).not.toHaveText('Verified');

  // The row's canonical data-status key must stay the locale-invariant
  // 'verified' (used by the status filter dropdown), even though the
  // badge text is now localized.
  await expect(row).toHaveAttribute('data-status', 'verified');

  // The action cell should now offer the (localized) Suspend action.
  await expect(row.getByRole('button', { name: 'Suspendre' })).toBeVisible();
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
