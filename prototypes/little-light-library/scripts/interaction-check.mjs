import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const output = ".test-output/interactions";
fs.mkdirSync(output, { recursive: true });
try {
  await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771/");
  await page.getByRole("button", { name: "Enter the library" }).click();
  await page.waitForFunction(
    () => window.libraryDebug().scene?.shelf.books.length === 3,
  );
  await page.waitForFunction(
    () => window.libraryDebug().scene?.shelfHint.visible,
    {},
    { timeout: 25000 },
  );
  console.log(
    "Hint",
    await page.evaluate(() => window.libraryDebug().scene.shelfHint),
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${output}/hint.png` });
  await page
    .getByRole("button", { name: "Preview Adam, Eve, and the Garden" })
    .click();
  await page.getByRole("button", { name: "Read", exact: true }).click();
  await page.waitForFunction(() => window.libraryDebug().ready);
  assert.equal(
    await page.evaluate(() => window.libraryDebug().scene.shelfHint.completed),
    true,
  );
  await page.locator("#next").click();
  await page.waitForFunction(() => window.libraryDebug().ready);
  for (const fold of [1, 0.6, 0]) {
    await page.evaluate((fold) => window.libraryReview(0, 5, fold), fold);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${output}/fold-${fold}.png` });
  }
  console.log("Interaction captures complete");
} finally {
  await browser.close();
}
