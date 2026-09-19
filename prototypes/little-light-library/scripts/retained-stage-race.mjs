import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.RETAINED_REVIEW_OUT || "review/latest-validation/retained-stage";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const action of ["next", "shelf"]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const debug = () => page.evaluate(() => window.libraryDebug());
    const ready = () => page.waitForFunction(() => window.libraryDebug().ready);
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator('[data-book="noah"]').click();
    await ready();
    await page.locator("#next").click();
    await ready();
    let heldRoute;
    const held = new Promise((resolve) => {
      heldRoute = resolve;
    });
    await page.route("**/family-seven.webp", (route) => heldRoute(route));
    await page.locator("#next").click();
    const route = await Promise.race([
      held,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(Error("Family request not intercepted")),
          10000,
        ),
      ),
    ]);
    const pending = await debug();
    assert.equal(pending.ready, false);
    assert.deepEqual(pending.scene.retainedStagePage, {
      story: "noah",
      index: 1,
    });
    assert.equal(pending.scene.retainedStageVisible, true);
    assert.equal(pending.scene.stageVisible, false);
    assert.equal(pending.scene.printTargetCount, 0);
    await page.locator(`#${action}`).click();
    if (action === "shelf") await page.locator('[data-book="noah"]').waitFor();
    else await ready();
    let state = await debug();
    assert.equal(state.scene.retainedStageVisible, false);
    assert.equal(state.scene.retainedStagePage, null);
    assert.equal(state.scene.printTargetCount, 0);
    if (action === "next") assert.equal(state.state.page, 3);
    else assert.equal(state.scene.mode, "room");
    await route.continue();
    await page.waitForTimeout(500);
    state = await debug();
    assert.equal(state.scene.retainedStagePage, null);
    if (action === "next") assert.equal(state.state.page, 3);
    else assert.equal(state.scene.mode, "room");
    await page.screenshot({ path: `${out}/${action}-after-release.png` });
    assert.deepEqual(errors, []);
    results.push({ action, passed: true, pending, complete: state });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log(
  "PASS: reduced-motion retained stage survives supersession and releases on completion/room exit.",
);
