import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/15-shelf-touch/candidate-01";
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
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.evaluate(() => window.libraryReview(12));
    const capture = async (name) => {
      const scene = await page.evaluate(() => window.libraryDebug().scene);
      await page.screenshot({ path: `${out}/${width}-${name}.png` });
      checks.push({ width, name, scene });
    };
    await capture("idle");
    for (const id of ["adam", "eve", "noah"]) {
      await page.locator(`[data-character="${id}"]`).click();
      await page.waitForTimeout(250);
      await capture(`${id}-tap`);
      await page.waitForTimeout(1100);
    }
    await page.locator('[data-character="adam"]').click();
    await page.waitForTimeout(150);
    await page.locator('[data-character="eve"]').click();
    await page.waitForTimeout(150);
    await page.locator('[data-character="noah"]').click();
    await page.waitForTimeout(1400);
    await capture("rapid-settled");
    await page.locator('[data-character="eve"]').focus();
    await capture("eve-focus");
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(`PASS: ${checks.length} shelf input/response poses.`);
