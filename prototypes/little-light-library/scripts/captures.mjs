import { chromium } from "playwright";
import fs from "node:fs";
const url = process.env.LIBRARY_URL || "http://127.0.0.1:8771/";
const out = process.env.CAPTURE_OUT || "docs/captures";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, height] of [
    [360, 800],
    [768, 1024],
    [1366, 768],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const capture = async (name) => {
      await page.waitForFunction(() => window.libraryDebug().ready);
      // Capture the settled composition after opening, page clearance and popup unfolding.
      await page.waitForTimeout(2300);
      await page.evaluate(() => window.libraryReview(12));
      await page.waitForTimeout(100);
      await page.screenshot({ path: `${out}/${name}-${width}.png` });
    };
    await page.goto(url);
    await page.locator("#enter").click();
    await capture("room");
    await page.locator('[data-character="noah"]').click();
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${out}/figurines-${width}.png` });
    await page.locator('[data-book="eden"]').click();
    await capture("eden");
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.libraryReview());
      await page.locator("#next").click();
      await page.waitForFunction(() => window.libraryDebug().ready);
    }
    await page.locator('[data-book="noah"]').click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.libraryReview());
      await page.locator("#next").click();
      await page.waitForFunction(() => window.libraryDebug().ready);
      if (i === 2) await capture("flood");
    }
    await capture("aftermath");
    await page.close();
  }
} finally {
  await browser.close();
}
