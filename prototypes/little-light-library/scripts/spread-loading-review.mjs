import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.LOADING_REVIEW_OUT ||
  process.env.REVIEW_OUT ||
  "review/latest-validation/loading";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const cases = [
    { width: 1366, reduced: false },
    { width: 360, reduced: false },
  ];
  if (!process.env.BASELINE) cases.push({ width: 360, reduced: true });
  for (const { width, reduced } of cases) {
    const name = `${width}${reduced ? "-reduced" : ""}`;
    const page = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
    });
    await page.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const ready = () => page.waitForFunction(() => window.libraryDebug().ready);
    const debug = () => page.evaluate(() => window.libraryDebug());
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator('[data-book="noah"]').click();
    await ready();
    await page.waitForTimeout(2300);
    await page.locator("#next").click();
    await ready();
    await page.waitForTimeout(1300);
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/family-seven.webp", (route) => release(route));
    await page.locator("#next").click();
    const route = await Promise.race([
      held,
      new Promise((_, reject) =>
        setTimeout(() => reject(Error("Family request not held")), 10000),
      ),
    ]);
    await page.waitForTimeout(400);
    const pending = await debug();
    await page.screenshot({ path: `${out}/${name}-pending-family.png` });
    assert.equal(pending.ready, false);
    if (!process.env.BASELINE) {
      assert.equal(pending.scene.stageVisible, false);
      assert.equal(pending.scene.transitionWaiting, true);
      assert.deepEqual(
        pending.scene.printedPage,
        reduced ? null : { story: "noah", index: 1 },
      );
      assert.equal(pending.scene.printTargetCount, reduced ? 0 : 1);
      assert.equal(pending.scene.retainedStageVisible, reduced);
      assert.deepEqual(
        pending.scene.retainedStagePage,
        reduced ? { story: "noah", index: 1 } : null,
      );
    }
    await route.continue();
    await ready();
    await page.waitForTimeout(1300);
    const complete = await debug();
    await page.screenshot({ path: `${out}/${name}-complete-family.png` });
    if (!process.env.BASELINE) {
      assert.equal(complete.scene.stageVisible, true);
      assert.equal(complete.scene.transitionWaiting, false);
      assert.equal(complete.scene.actorCount, 1);
      assert.deepEqual(
        complete.scene.destinationPrintPage,
        reduced
          ? null
          : {
              story: "noah",
              index: 2,
            },
      );
      assert.equal(complete.scene.printTargetCount, reduced ? 0 : 2);
      assert.equal(complete.scene.retainedStageVisible, false);
      assert.equal(complete.scene.retainedStagePage, null);
    }
    assert.deepEqual(errors, []);
    results.push({ width, reduced, pending, complete, errors });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log("PASS: held-family loading and completed reveal at both sizes.");
