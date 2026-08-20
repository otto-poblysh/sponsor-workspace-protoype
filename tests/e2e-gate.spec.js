// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const codes = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'passcodes.json'), 'utf8')).codes;

test.describe('Demo access gate', () => {
  test('covers a direct page load until a valid code is entered', async ({ page }) => {
    await page.goto(`file://${path.join(ROOT_DIR, 'index.html')}`, { waitUntil: 'load' });

    await expect(page.locator('#demo-gate-root')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeHidden();

    const firstPin = page.locator('#demo-gate-root .demo-gate-pins input').first();
    await firstPin.focus();
    await page.evaluate(() => {
      const input = document.querySelector('#demo-gate-root .demo-gate-pins input');
      const event = new Event('paste', { bubbles: true, cancelable: true });
      event.clipboardData = { getData: () => '000000' };
      input.dispatchEvent(event);
    });
    await expect(page.locator('#demo-gate-root .demo-gate-error')).toHaveText('That code is not valid.');

    await firstPin.focus();
    await page.evaluate((code) => {
      const input = document.querySelector('#demo-gate-root .demo-gate-pins input');
      const event = new Event('paste', { bubbles: true, cancelable: true });
      event.clipboardData = { getData: () => code };
      input.dispatchEvent(event);
    }, String(codes[0]));

    await expect(page.locator('#demo-gate-root')).toHaveCount(0);
    await expect(page.locator('.sidebar')).toBeVisible();
  });
});
