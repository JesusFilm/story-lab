import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.GARDEN_REVIEW_OUT || "review/latest-validation/garden-floor";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const mode of ["normal", "missing", "delayed", "reduced"]) {
    const page = await browser.newPage({
      viewport: { width: 360, height: 800 },
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const debug = () => page.evaluate(() => window.libraryDebug());
    const ready = () =>
      page.waitForFunction(
        () =>
          window.libraryDebug().ready &&
          window.libraryDebug().shelf.books.length >= 2 &&
          window.libraryDebug().shelf.busy === false,
      );
    const selectEden = async () => {
      await page.locator('[data-shelf-key="builtin:eden"]').click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().shelf.inspected === "builtin:eden" &&
          window.libraryDebug().shelf.busy === false,
      );
    };
    const openEden = async () => {
      await page.locator("#shelf-read").click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().state.book === "eden" &&
          window.libraryDebug().shelf.table === "builtin:eden" &&
          window.libraryDebug().scene.stageGround &&
          window.libraryDebug().ready &&
          window.libraryDebug().shelf.busy === false,
      );
    };
    let held;
    let requests = 0;
    await page.route("**/continuous-garden-ground.webp", async (route) => {
      requests++;
      if (mode === "missing" && requests === 1)
        return route.fulfill({ status: 404, body: "missing" });
      if (mode === "delayed" && requests === 1) {
        held = route;
        return;
      }
      await route.continue();
    });
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator('[data-locale="en-US"]').click();
    await page.locator("#enter").click();
    await ready();
    assert.equal(requests, 0, "garden art is not fetched for the shelf");
    if (mode === "missing") {
      await selectEden();
      await page.locator("#shelf-read").click();
      await page.locator("#notice button").waitFor();
      assert.equal(
        (await debug()).scene.stageGround,
        false,
        "a missing required ground keeps the incomplete spread hidden",
      );
      assert.equal((await debug()).ready, false);
      await page.unroute("**/continuous-garden-ground.webp");
      await page.locator("#notice button").click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().state.book === "eden" &&
          window.libraryDebug().shelf.table === "builtin:eden" &&
          window.libraryDebug().scene.stageGround &&
          window.libraryDebug().ready &&
          window.libraryDebug().shelf.busy === false,
      );
    } else if (mode === "delayed") {
      await selectEden();
      await page.locator("#shelf-read").click();
      for (let i = 0; !held && i < 100; i++) await page.waitForTimeout(100);
      assert.ok(held, "floor request intercepted");
      assert.equal(
        (await debug()).ready,
        false,
        "no incomplete garden stage is released",
      );
      assert.equal(await page.locator("#shelf").isDisabled(), true);
      await held.continue();
      await page.waitForFunction(
        () =>
          window.libraryDebug().state.book === "eden" &&
          window.libraryDebug().shelf.table === "builtin:eden" &&
          window.libraryDebug().scene.stageGround &&
          window.libraryDebug().ready &&
          window.libraryDebug().shelf.busy === false,
      );
    } else {
      await selectEden();
      await openEden();
    }
    let state = await debug();
    assert.equal(state.scene.gardenFloor, true);
    await page.screenshot({ path: `${out}/${mode}-settled.png` });
    if (mode === "normal" || mode === "reduced") {
      await page.locator("#next").click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().state.page === 1 &&
          window.libraryDebug().ready &&
          !document.querySelector("#previous").disabled,
      );
      assert.equal((await debug()).scene.gardenFloor, true);
      await page.locator("#previous").click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().state.page === 0 &&
          window.libraryDebug().ready &&
          document.querySelector("#previous").disabled,
      );
      assert.equal((await debug()).scene.gardenFloor, true);
      if (mode === "reduced")
        assert.equal((await debug()).scene.printTargetCount, 0);
    }
    await page.locator("#shelf").click();
    await page.waitForFunction(
      () =>
        window.libraryDebug().shelf.browsing === true &&
        window.libraryDebug().shelf.busy === false &&
        window.libraryDebug().scene.mode === "room",
    );
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
  "PASS: garden floor lazy loading, missing-ground retry, held-request locking, page navigation and reduced motion.",
);
