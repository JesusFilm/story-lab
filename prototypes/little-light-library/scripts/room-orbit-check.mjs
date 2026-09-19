import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.ORBIT_REVIEW_OUT || "review/19-room-orbit/acceptance-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const [width, height, reduced] of [
    [1366, 768, false],
    [768, 1024, false],
    [360, 800, false],
    [360, 800, true],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(1200);
    const debug = () => page.evaluate(() => window.libraryDebug().scene);
    for (const direction of [-1, 1, 0]) {
      const button = page.locator(`[data-room-look="${direction}"]`);
      await button.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (direction) =>
          Math.abs(
            window.libraryDebug().scene.roomOrbitYaw - direction * 0.12,
          ) < 1e-6,
        direction,
      );
      await page.waitForTimeout(reduced ? 80 : 1400);
      const state = await debug();
      for (const f of state.figurines) {
        assert.ok(Math.abs(f.baseBottom - f.shelfTop) < 0.02);
        assert.ok(f.screen.torso.x > 0 && f.screen.torso.x < width);
      }
      const bounds = await button.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44);
      await page.screenshot({
        path: `${out}/${width}-${reduced ? "reduced" : "normal"}-button${direction}.png`,
      });
    }
    // Start on bare wall; horizontal movement must orbit without selecting a story.
    await page.mouse.move(width * 0.25, 120);
    await page.mouse.down();
    await page.mouse.move(width * 0.75, 120, { steps: 14 });
    await page.mouse.up();
    const dragged = await debug();
    assert.ok(Math.abs(dragged.roomOrbitYaw) > 0.1);
    assert.equal(dragged.roomDragging, false);
    assert.equal(await page.locator("[data-book=eden]").count(), 1);
    const yaw = dragged.roomOrbitYaw;
    // A vertical intent must not change yaw or turn its release into a click.
    await page.mouse.move(width * 0.2, 105);
    await page.mouse.down();
    await page.mouse.move(width * 0.2, 210, { steps: 10 });
    await page.mouse.up();
    assert.equal((await debug()).roomOrbitYaw, yaw);
    await page.locator('[data-room-look="0"]').click();
    await page.waitForTimeout(reduced ? 80 : 1400);
    const eve = (await debug()).figurines.find((f) => f.id === "eve").screen
      .torso;
    if (!reduced) {
      await page.evaluate(() => {
        document.querySelector("#scene canvas").addEventListener(
          "pointerdown",
          (event) => {
            window.lastOrbitPointer = event.pointerId;
          },
          { once: true },
        );
      });
      await page.mouse.move(width * 0.2, 105);
      await page.mouse.down();
      const pointerId = await page.evaluate(() => window.lastOrbitPointer);
      await page.dispatchEvent("#scene canvas", "pointercancel", {
        pointerId,
        pointerType: "mouse",
        isPrimary: true,
        buttons: 0,
      });
      await page.mouse.move(width + 20, height + 20);
      await page.mouse.up();
      await page.mouse.move(eve.x, eve.y);
      await page.waitForFunction(
        () => window.libraryDebug().scene.roomLabel === "Eve",
      );
    }
    await page.mouse.click(eve.x, eve.y);
    await page.waitForFunction(
      () => window.libraryDebug().scene.roomLabel === "Eve",
    );
    assert.equal((await debug()).roomLabel, "Eve");
    await page.locator('[data-room-look="1"]').click();
    await page.locator("[data-book=eden]").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(2300);
    assert.equal((await debug()).roomOrbitYaw, 0);
    assert.equal(await page.locator(".room-view").count(), 0);
    await page.locator("#shelf").click();
    await page.locator('[data-room-look="0"]').waitFor();
    assert.equal((await debug()).roomOrbitYaw, 0);
    if (width === 360 && !reduced) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 100, y: 120 }],
      });
      for (let x = 110; x <= 250; x += 10)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: 120 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      assert.ok(
        Math.abs((await debug()).roomOrbitYaw) > 0.1,
        "real touch drag orbits",
      );
      const beforeVertical = (await debug()).roomOrbitYaw;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 90, y: 100 }],
      });
      for (let y = 110; y <= 230; y += 10)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 90, y }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      assert.equal((await debug()).roomOrbitYaw, beforeVertical);
      assert.equal((await debug()).roomDragging, false);
      assert.equal(await page.locator("[data-book=eden]").count(), 1);
      await page.locator("#language").click();
      await page.locator("[data-locale=ja]").click();
      await page.locator("#enter").click();
      await page.waitForFunction(
        () =>
          window.libraryDebug().ready && document.documentElement.lang === "ja",
      );
      assert.equal(
        await page.locator(".room-view").getAttribute("aria-label"),
        "見回す",
      );
      await page.screenshot({ path: `${out}/360-japanese-controls.png` });
      await cdp.detach();
    }
    assert.deepEqual(errors, []);
    checks.push({
      width,
      height,
      reduced,
      buttons: true,
      drag: true,
      verticalIntent: true,
      centerReset: true,
      figureTap: true,
      readingReset: true,
      errors,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: room orbit buttons, mouse/touch gestures, tap safety, grounding, reduced motion, localization and reading reset.",
);
