import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/17-eve-acting/candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const width of [1366, 360]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=eden]").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(2300);
    for (const spread of [2, 3, 4]) {
      await page.evaluate(() => window.libraryReview());
      await page.locator("#next").click();
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(1300);
      if ((await page.evaluate(() => window.libraryDebug())).playing)
        await page.locator("#play").click();
      for (const time of [0, 2, 4, 6]) {
        await page.evaluate((time) => window.libraryReview(time, 5, 0), time);
        await page.waitForTimeout(100);
        await page.screenshot({
          path: `${out}/${width}-eden-${spread}-t${time}.png`,
        });
      }
      if (spread === 3) {
        for (const fold of [0.5, 1]) {
          await page.evaluate((fold) => window.libraryReview(4, 5, fold), fold);
          await page.waitForTimeout(100);
          await page.screenshot({
            path: `${out}/${width}-eden-3-fold${fold}.png`,
          });
        }
      }
      checks.push({ width, spread, errors: [...errors] });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log("PASS: 24 acting and 4 folded views captured.");
