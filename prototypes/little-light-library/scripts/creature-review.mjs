import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/23-paper-creatures/before";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const width of [1366, 360])
    for (const reduced of [false, true]) {
      const size = { width, height: width === 360 ? 800 : 768 };
      const context = await browser.newContext({
        viewport: size,
        reducedMotion: reduced ? "reduce" : "no-preference",
        recordVideo: reduced ? undefined : { dir: `${out}/video`, size },
      });
      const page = await context.newPage();
      const video = page.video();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
      await page.locator("#enter").click();
      for (const [book, spread] of [
        ["eden", 3],
        ["noah", 5],
      ]) {
        await page.locator(`[data-book=${book}]`).click();
        for (let n = 1; n <= spread; n++) {
          await page.waitForFunction(() => window.libraryDebug().ready);
          await page.waitForTimeout(n === 1 ? 2300 : 1300);
          if (n < spread) await page.locator("#next").click();
        }
        if ((await page.evaluate(() => window.libraryDebug())).playing)
          await page.locator("#play").click();
        for (const time of reduced ? [2] : [0, 1, 2, 3, 4, 6]) {
          await page.evaluate((t) => window.libraryReview(t, 5, 0), time);
          await page.waitForTimeout(100);
          await page.screenshot({
            path: `${out}/${width}-${book}-${spread}-${reduced ? "reduced" : "normal"}-t${time}.png`,
          });
          results.push({
            width,
            book,
            spread,
            reduced,
            time,
            scene: await page.evaluate(() => window.libraryDebug().scene),
          });
        }
        if (!reduced)
          for (const fold of [0.5, 1]) {
            await page.evaluate((f) => window.libraryReview(2, 5, f), fold);
            await page.waitForTimeout(100);
            await page.screenshot({
              path: `${out}/${width}-${book}-${spread}-fold${fold}.png`,
            });
          }
        await page.evaluate(() => window.libraryReview());
        if (!reduced) await page.waitForTimeout(7000);
        await page.locator("#shelf").click();
        await page.locator(`[data-book=${book}]`).waitFor({ state: "visible" });
      }
      assert.deepEqual(errors, []);
      await context.close();
      if (video) {
        await video.saveAs(`${out}/${width}-creatures.webm`);
        await video.delete();
      }
    }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log(
  `PASS: ${results.length} acting/reduced states and8fold poses captured.`,
);
