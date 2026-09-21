import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const output = ".test-output/paper-transitions";
fs.mkdirSync(output, { recursive: true });
try {
  await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771/");
  await page.getByRole("button", { name: "Enter the library" }).click();
  for (const [id, title] of [
    ["eden", "Adam, Eve, and the Garden"],
    ["noah", "Noah and the Great Flood"],
    ["jonah", "Jonah and the Whale"],
  ]) {
    await page
      .getByRole("button", { name: `Preview ${title}`, exact: true })
      .click();
    await page.getByRole("button", { name: "Read", exact: true }).click();
    await page.waitForFunction(
      () =>
        window.libraryDebug().scene?.mode === "spread" &&
        !window.libraryDebug().scene.transitionWaiting &&
        !window.libraryDebug().shelf.busy,
    );
    for (const age of [1.2, 1.55, 1.8, 2.1]) {
      await page.evaluate((age) => window.libraryReview(0, age), age);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${output}/${id}-opening-${age}.png` });
      assert.equal(
        await page.evaluate(() => window.libraryDebug().scene.stageVisible),
        age >= 1.55,
      );
    }
    await page.evaluate(() => window.libraryReview());
    await page.locator("#next").click();
    await page.waitForFunction(
      () =>
        !window.libraryDebug().scene.transitionWaiting &&
        window.libraryDebug().state.page === 1,
    );
    for (const age of [0.25, 0.58, 0.85, 1.2]) {
      await page.evaluate((age) => window.libraryReview(0, age), age);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${output}/${id}-turn-${age}.png` });
    }
    await page.evaluate(() => window.libraryReview());
    await page.locator("#shelf").click();
    console.log(`Captured ${id} opening and page turn`);
  }
} finally {
  await browser.close();
}
