import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/21-adam-acting/candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const width of [1366, 360]) {
    const height = width === 360 ? 800 : 768;
    const context = await browser.newContext({
      viewport: { width, height },
      recordVideo: { dir: `${out}/video`, size: { width, height } },
    });
    const page = await context.newPage();
    const video = page.video();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=eden]").click();
    for (let spread = 1; spread <= 8; spread++) {
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(spread === 1 ? 2300 : 1300);
      if ((await page.evaluate(() => window.libraryDebug())).playing)
        await page.locator("#play").click();
      if ([1, 2, 3, 4, 8].includes(spread)) {
        for (const time of [0, 2, 4, 6]) {
          await page.evaluate((time) => window.libraryReview(time, 5, 0), time);
          await page.waitForTimeout(100);
          await page.screenshot({
            path: `${out}/${width}-eden-${spread}-t${time}.png`,
          });
        }
        if (spread === 2) {
          for (const fold of [0.5, 1]) {
            await page.evaluate(
              (fold) => window.libraryReview(2, 5, fold),
              fold,
            );
            await page.waitForTimeout(100);
            await page.screenshot({
              path: `${out}/${width}-eden-2-fold${fold}.png`,
            });
          }
        }
        checks.push({ width, spread, errors: [...errors] });
      }
      await page.evaluate(() => window.libraryReview());
      if (spread === 1) {
        // Raw video includes ten real-time seconds after the frozen comparison poses.
        await page.locator('.paper-target[aria-label="Adam"]').focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(10000);
      }
      if (spread < 8) await page.locator("#next").click();
    }
    assert.deepEqual(errors, []);
    await context.close();
    await video.saveAs(`${out}/${width}-acting.webm`);
    fs.rmSync(await video.path(), { force: true });
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS:40 acting states,4 folding states and two raw1x recordings captured.",
);
