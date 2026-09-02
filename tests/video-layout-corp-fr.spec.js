const { test, expect } = require('@playwright/test');
const path = require('node:path');

const FR = path.join(__dirname, '..', 'corporate', 'video-fr', 'compositions');

const NOWRAP_TARGETS = [
  { file: 'beat-00-intro.html', selector: '.title-line', container: '.text-container' },
  { file: 'beat-00-intro.html', selector: '.headline-line', container: '.text-container' }
];

for (const { file, selector, container } of NOWRAP_TARGETS) {
  test(`[FR] ${file} ${selector} fits inside ${container}`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(FR, file));
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(
      ([sel, cont]) => {
        const sig = document.querySelector('.signature');
        const pad = sig ? parseFloat(getComputedStyle(sig).paddingLeft) : 0;
        const box = document.querySelector(cont).clientWidth - (sel === '.title-line' ? pad : 0);
        return [...document.querySelectorAll(sel)].map((el) => ({
          text: el.textContent.trim(),
          width: (() => { const r = document.createRange(); r.selectNodeContents(el);
                          return Math.ceil(r.getBoundingClientRect().width); })(),
          available: box,
          overflowBy: (() => { const r = document.createRange(); r.selectNodeContents(el);
                                return Math.ceil(r.getBoundingClientRect().width) - box; })()
        }));
      },
      [selector, container]
    );

    for (const r of overflow) {
      expect(
        r.overflowBy,
        `"${r.text}" is ${r.width}px in a ${r.available}px box (over by ${r.overflowBy}px)`
      ).toBeLessThanOrEqual(0);
    }
  });
}

test('[FR] video beats have no caption/subtitle containers', async ({ page }) => {
  for (const file of [
    'beat-01-dashboard.html',
    'beat-02-subsidiaries.html',
    'beat-03-integrations.html',
    'beat-04-skill-gap.html',
    'beat-05-audit.html'
  ]) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('file://' + path.join(FR, file));
    const subtitleExists = await page.evaluate(() => !!document.querySelector('#subtitle-container'));
    expect(subtitleExists, `Unexpected #subtitle-container found in ${file}`).toBe(false);
  }
});

test('[FR] outro message block stays inside the frame', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('file://' + path.join(FR, 'beat-06-outro.html'));
  const box = await page.locator('.container').boundingBox();
  expect(box.width).toBeLessThanOrEqual(1920);
  expect(box.height).toBeLessThanOrEqual(1080);
});
