import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/22-reading-focus/before";
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
      await page.locator(`[data-book=${book}]`).click();
      for (let spread = 1; spread <= 6; spread++) {
        await page.waitForFunction(() => window.libraryDebug().ready);
        await page.waitForTimeout(spread === 1 ? 2300 : 1300);
        if ((book === "eden" ? [2, 4] : [1, 3, 6]).includes(spread)) {
          if ((await page.evaluate(() => window.libraryDebug())).playing)
            await page.locator("#play").click();
          const count = await page.locator(".paper-target").count();
          for (const actor of [...new Set([0, count - 1])].filter(
            (i) => i >= 0,
          )) {
            await page.waitForTimeout(2500);
            await page.evaluate(() => window.libraryReview(2, 5, 0));
            await page.locator(".paper-target").nth(actor).focus();
            await page.keyboard.press("Enter");
            for (const focusAge of [0, 0.7, 3]) {
              await page.evaluate(
                (age) => window.libraryReview(2, 5, 0, age),
                focusAge,
              );
              await page.waitForTimeout(100);
              await page.screenshot({
                path: `${out}/${width}-${book}-${spread}-actor${actor}-focus${focusAge}.png`,
              });
              checks.push({
                width,
                book,
                spread,
                actor,
                focusAge,
                scene: await page.evaluate(() => window.libraryDebug().scene),
              });
            }
          }
        }
        await page.evaluate(() => window.libraryReview());
        if (spread < 6) await page.locator("#next").click();
      }
      await page.locator("#shelf").click();
      await page.locator(`[data-book=${book}]`).waitFor({ state: "visible" });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(`PASS: ${checks.length} matched reading focus states captured.`);
