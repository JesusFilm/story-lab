import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.GARDEN_REVIEW_OUT || "review/latest-validation/garden-floor";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const mode of [
    "normal",
    "missing",
    "delayed",
    "superseded",
    "reduced",
  ]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const debug = () => page.evaluate(() => window.libraryDebug());
    const ready = () => page.waitForFunction(() => window.libraryDebug().ready);
    let held;
    let requests = 0;
    await page.route("**/garden-floor.webp", async (route) => {
      requests++;
      if (mode === "missing")
        return route.fulfill({ status: 404, body: "missing" });
      if ((mode === "delayed" || mode === "superseded") && requests === 1) {
        held = route;
        return;
      }
      await route.continue();
    });
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await ready();
    assert.equal(requests, 0, "garden art is not fetched for the shelf");
    await page.locator('[data-book="eden"]').click();
    if (mode === "delayed" || mode === "superseded") {
      for (let i = 0; !held && i < 100; i++) await page.waitForTimeout(100);
      assert.ok(held, "floor request intercepted");
      assert.equal(
        (await debug()).ready,
        false,
        "no incomplete garden stage is released",
      );
      if (mode === "superseded") {
        await page.locator("#shelf").click();
        await page.locator('[data-book="noah"]').click();
        await ready();
      }
      await held.continue();
    }
    await ready();
    await page.waitForTimeout(2300);
    let state = await debug();
    assert.equal(
      state.scene.gardenFloor,
      mode !== "missing" && mode !== "superseded",
    );
    if (mode === "superseded") assert.equal(state.state.book, "noah");
    await page.screenshot({ path: `${out}/${mode}-settled.png` });
    if (mode === "normal" || mode === "reduced") {
      await page.locator("#next").click();
      await ready();
      assert.equal((await debug()).scene.gardenFloor, true);
      await page.waitForTimeout(1300);
      await page.locator("#previous").click();
      await ready();
      await page.waitForTimeout(1300);
      assert.equal((await debug()).scene.gardenFloor, true);
      if (mode === "reduced")
        assert.equal((await debug()).scene.printTargetCount, 0);
    }
    await page.locator("#shelf").click();
    await page.locator('[data-book="eden"]').waitFor();
    assert.equal(
      (await debug()).scene.stageVisible,
      false,
      "closed-book stage is hidden on room exit",
    );
    assert.deepEqual(errors, []);
    checks.push({ mode, passed: true });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: garden floor lazy loading, fallback, held completion, stale arrival, page navigation and reduced motion.",
);
