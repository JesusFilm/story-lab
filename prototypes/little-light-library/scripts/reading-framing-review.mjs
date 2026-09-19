import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/18-reading-framing/candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const [width, height] of [
    [360, 800],
    [768, 1024],
    [1366, 768],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    for (const book of ["eden", "noah"]) {
      await page.locator(`[data-book=${book}]`).click();
      for (let spread = 1; spread <= 8; spread++) {
        await page.waitForFunction(() => window.libraryDebug().ready);
        await page.waitForTimeout(spread === 1 ? 2300 : 1300);
        if ((await page.evaluate(() => window.libraryDebug())).playing)
          await page.locator("#play").click();
        await page.evaluate(() => window.libraryReview(12, 5));
        await page.waitForTimeout(100);
        await page.screenshot({
          path: `${out}/${width}-${book}-${spread}.png`,
        });
        const targets = await page
          .locator(".paper-target")
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const r = node.getBoundingClientRect();
              return {
                name: node.getAttribute("aria-label"),
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
              };
            }),
          );
        checks.push({ width, height, book, spread, targets });
        await page.evaluate(() => window.libraryReview());
        await page.locator(spread === 8 ? "#shelf" : "#next").click();
      }
      await page.locator("[data-book=eden]").waitFor();
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: all16 settled spreads captured at phone, tablet and desktop.",
);
