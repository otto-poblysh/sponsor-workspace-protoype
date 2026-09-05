const { test, expect } = require("@playwright/test");
const path = require("node:path");

for (const locale of ["en", "fr", "es"]) {
  test(locale + " association intro layout fits inside container", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const p = path.join(__dirname, "..", "association", "video-" + locale, "compositions", "beat-00-intro.html");
    await page.goto("file://" + p);
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => {
      const cont = document.querySelector(".text-container");
      const sig = document.querySelector(".signature");
      const pad = sig ? parseFloat(getComputedStyle(sig).paddingLeft) : 0;
      const box = cont.clientWidth - pad;
      const els = [...document.querySelectorAll(".title-line, .ministry, .headline-line")];
      return els.map(el => {
        const r = document.createRange();
        r.selectNodeContents(el);
        const w = Math.ceil(r.getBoundingClientRect().width);
        return { text: el.textContent.trim(), width: w, available: box, overflowBy: w - box };
      });
    });
    for (const r of overflow) {
      expect(r.overflowBy, r.text + " overflows by " + r.overflowBy + "px").toBeLessThanOrEqual(0);
    }
  });
}
