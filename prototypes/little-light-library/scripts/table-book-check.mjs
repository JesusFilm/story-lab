import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage({
      viewport: touch
        ? { width: 390, height: 844 }
        : { width: 1366, height: 900 },
      hasTouch: touch,
    });
    await page.goto("http://127.0.0.1:8771/");
    await page.getByRole("button", { name: "Enter the library" }).click();
    await page
      .getByRole("button", {
        name: "Preview Adam, Eve, and the Garden",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Read", exact: true }).click();
    await page.locator("#next").click();
    await page.locator("#shelf").click();
    await page.waitForFunction(() => {
      const s = window.libraryDebug().scene;
      return s.shelfBrowsingTable && !s.shelfCoverMoving;
    });
    await page.waitForTimeout(800);
    const box = await page.evaluate(
      () => window.libraryDebug().scene.closedBookBounds,
    );
    const x = (box.left + box.right) / 2,
      y = (box.top + box.bottom) / 2;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.waitForFunction(() => !window.libraryDebug().shelf.browsing);
    assert.equal(
      await page.evaluate(() => window.libraryDebug().state.page),
      1,
    );
    console.log(
      `${touch ? "Touch" : "Click"} reopens table book at saved page`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
