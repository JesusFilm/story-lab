import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out = process.env.EVE_REVIEW_OUT || "review/17-eve-acting/touch-final";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const reduced of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=eden]").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    for (let i = 0; i < 2; i++) {
      await page.locator("#next").click();
      await page.waitForFunction(() => window.libraryDebug().ready);
    }
    await page.waitForTimeout(1400);
    if ((await page.evaluate(() => window.libraryDebug())).playing)
      await page.locator("#play").click();
    const label = page.locator(".paper-name");
    const eve = page.locator(".paper-target").nth(1);
    await eve.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.querySelector(".paper-name")?.textContent === "Eve",
    );
    assert.equal(await label.innerText(), "Eve");
    assert.equal(
      (await page.evaluate(() => window.libraryDebug().scene)).touchedActor,
      1,
    );
    await page.screenshot({
      path: `${out}/${reduced ? "reduced" : "normal"}-touch.png`,
    });
    await page.locator("#next").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(1300);
    await page.screenshot({
      path: `${out}/${reduced ? "reduced" : "normal"}-consequences.png`,
    });
    assert.deepEqual(errors, []);
    checks.push({
      reducedMotion: reduced,
      eveTouch: true,
      nextReady: true,
      errors,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: normal/reduced Eve activation and consequence-page handoff.",
);
