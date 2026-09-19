import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.REVIEW_OUT || "review/14-popup-folding/outgoing-candidate-01";
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
    for (const book of ["eden", "noah"]) {
      await page.locator(`[data-book="${book}"]`).click();
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(2300);
      for (const index of [1, 2]) {
        await page.evaluate(() => window.libraryReview());
        await page.locator("#next").click();
        await page.waitForFunction(() => window.libraryDebug().ready);
        await page.waitForTimeout(1300);
        if ((await page.evaluate(() => window.libraryDebug())).playing)
          await page.locator("#play").click();
        for (const fold of [0, 0.25, 0.5, 0.75, 1]) {
          await page.evaluate(
            (fold) => window.libraryReview(12, 5, fold),
            fold,
          );
          await page.waitForTimeout(80);
          const scene = await page.evaluate(() => window.libraryDebug().scene);
          assert.equal(scene.outgoingFoldProgress, fold);
          assert.equal(scene.stageVisible, true);
          if (fold === 0)
            assert.ok(
              scene.popups.every((a) => Math.abs(a - Math.PI / 2) < 1e-6),
            );
          if (fold === 1)
            assert.ok(
              scene.popups.every(
                (a) => Math.min(Math.abs(a), Math.abs(a - Math.PI)) < 1e-6,
              ),
            );
          await page.screenshot({
            path: `${out}/${width}-${book}-${index + 1}-${fold}.png`,
          });
          checks.push({ width, book, index, fold, scene });
        }
      }
      await page.evaluate(() => window.libraryReview());
      await page.locator("#shelf").click();
      await page.locator('[data-book="eden"]').waitFor();
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(`PASS: ${checks.length} outgoing-collapse poses captured.`);
