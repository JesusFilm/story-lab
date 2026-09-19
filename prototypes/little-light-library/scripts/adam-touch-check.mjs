import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.ADAM_REVIEW_OUT || "review/latest-validation/adam-touch";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const reduced of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      hasTouch: true,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=eden]").click();
    for (let spread = 1; spread <= 4; spread++) {
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(spread === 1 ? 2300 : 1300);
      if ([1, 3, 4].includes(spread)) {
        if ((await page.evaluate(() => window.libraryDebug())).playing)
          await page.locator("#play").click();
        await page.evaluate(() => window.libraryReview(2, 5));
        await page.waitForTimeout(100);
        const adam = page.locator('.paper-target[aria-label="Adam"]');
        const rect = await adam.boundingBox();
        await page.touchscreen.tap(
          rect.x + rect.width / 2,
          rect.y + rect.height * 0.5,
        );
        await page.waitForFunction(
          () => window.libraryDebug().scene.touchedActor === 0,
        );
        await page.waitForFunction(
          () => document.querySelector(".paper-name")?.textContent === "Adam",
        );
        assert.equal(await page.locator(".paper-name").innerText(), "Adam");
        await adam.focus();
        await page.keyboard.press("Enter");
        assert.equal(
          (await page.evaluate(() => window.libraryDebug().scene)).touchedActor,
          0,
        );
        await page.screenshot({
          path: `${out}/${reduced ? "reduced" : "normal"}-eden-${spread}.png`,
        });
        checks.push({
          reducedMotion: reduced,
          spread,
          touch: true,
          keyboard: true,
        });
      }
      await page.evaluate(() => window.libraryReview());
      if (spread < 4) await page.locator("#next").click();
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: normal/reduced Adam touch and keyboard response across welcome, warning and sorrow.",
);
