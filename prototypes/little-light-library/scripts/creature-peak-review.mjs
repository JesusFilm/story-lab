import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.REVIEW_OUT || "review/23-paper-creatures/candidate-01-peaks";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const width of [1366, 360]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=noah]").click();
    for (let n = 1; n <= 5; n++) {
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(n === 1 ? 2300 : 1300);
      if (n < 5) await page.locator("#next").click();
    }
    if ((await page.evaluate(() => window.libraryDebug())).playing)
      await page.locator("#play").click();
    for (const time of [0.525, 1.575]) {
      await page.evaluate((t) => window.libraryReview(t, 5, 0), time);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/${width}-dove-peak${time}.png` });
      results.push({
        width,
        time,
        scene: await page.evaluate(() => window.libraryDebug().scene),
      });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log("PASS: four supplemental dove peak poses captured.");
