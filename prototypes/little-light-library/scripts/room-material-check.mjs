import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.ROOM_REVIEW_OUT || "review/latest-validation/room-material";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const mode of ["normal", "missing", "delayed"]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let held;
    if (mode !== "normal")
      await page.route("**/botanical-wallpaper.webp", async (route) => {
        if (mode === "missing")
          await route.fulfill({ status: 404, body: "missing" });
        else
          await new Promise((resolve) => {
            held = async () => {
              await route.continue();
              resolve();
            };
          });
      });
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771", {
      waitUntil: "domcontentloaded",
    });
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    if (mode === "normal")
      await page.waitForFunction(
        () => window.libraryDebug().scene.roomWallpaper === "loaded",
      );
    if (mode === "missing")
      await page.waitForFunction(
        () => window.libraryDebug().scene.roomWallpaper === "fallback",
      );
    if (mode === "delayed")
      assert.equal(
        (await page.evaluate(() => window.libraryDebug().scene)).roomWallpaper,
        "loading",
      );
    await page.screenshot({ path: `${out}/${mode}-shelf.png` });
    await page.locator('[data-book="eden"]').click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    if (mode === "delayed") {
      assert.ok(
        held,
        "wallpaper request is held while the story remains usable",
      );
      await held();
      await page.waitForFunction(
        () => window.libraryDebug().scene.roomWallpaper === "loaded",
      );
    }
    await page.waitForTimeout(2300);
    assert.equal(
      (await page.evaluate(() => window.libraryDebug())).state.page,
      0,
    );
    await page.screenshot({ path: `${out}/${mode}-reading.png` });
    assert.deepEqual(errors, []);
    checks.push({
      mode,
      readingReady: true,
      wallpaper: (await page.evaluate(() => window.libraryDebug().scene))
        .roomWallpaper,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: room texture success, fallback and delayed arrival preserve usable shelf and reading.",
);
