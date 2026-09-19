import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.FOCUS_REVIEW_OUT || "review/22-reading-focus/interaction";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
try {
  for (const reduced of [false, true]) {
    const size = { width: 360, height: 800 };
    const context = await browser.newContext({
      viewport: size,
      hasTouch: true,
      reducedMotion: reduced ? "reduce" : "no-preference",
      recordVideo: { dir: `${out}/video`, size },
    });
    const page = await context.newPage();
    const video = page.video();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const scene = () => page.evaluate(() => window.libraryDebug().scene);
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.locator("[data-book=eden]").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(2500);
    await page.locator("#next").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(2000);
    if ((await page.evaluate(() => window.libraryDebug())).playing)
      await page.locator("#play").click();
    const before = await scene();
    const cardBefore = await page.locator("#next").boundingBox();
    const target = page.locator(".paper-target").nth(1);
    const box = await target.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.5);
    await page.waitForTimeout(650);
    const focused = await scene();
    assert.equal(focused.touchedActor, 1);
    const moved = distance(before.camera, focused.camera);
    assert.ok(
      reduced ? moved < 0.005 : moved > 0.02,
      `camera response ${moved}, reduced=${reduced}`,
    );
    assert.deepEqual(await page.locator("#next").boundingBox(), cardBefore);
    await page.screenshot({
      path: `${out}/${reduced ? "reduced" : "normal"}-touch.png`,
    });
    await page.waitForTimeout(3100);
    const returned = await scene();
    assert.ok(
      distance(before.camera, returned.camera) < 0.02,
      "camera returns to base",
    );
    for (let i = 0; i < 6; i++) {
      await page
        .locator(".paper-target")
        .nth(i % 2)
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
    }
    const rapid = await scene();
    assert.ok(
      distance(before.camera, rapid.camera) < 1.2,
      "rapid taps bounded",
    );
    await page.locator("#next").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(1600);
    const changed = await scene();
    assert.equal(changed.touchedActor, -1);
    assert.equal(changed.readingFocus.index, -1);
    assert.equal(changed.readingFocus.amount, 0);
    await page.locator(".paper-target").first().focus();
    await page.keyboard.press("Enter");
    await page.locator("#shelf").click();
    await page.locator("[data-book=eden]").waitFor({ state: "visible" });
    await page.waitForTimeout(1800);
    const room = await scene();
    assert.equal(room.touchedActor, -1);
    assert.equal(room.readingFocus.index, -1);
    assert.equal(room.readingFocus.amount, 0);
    await page.locator("[data-book=noah]").click();
    for (let n = 1; n <= 3; n++) {
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(n === 1 ? 2300 : 1600);
      if (n < 3) await page.locator("#next").click();
    }
    if ((await page.evaluate(() => window.libraryDebug())).playing)
      await page.locator("#play").click();
    const wideBefore = await scene();
    await page.locator(".paper-target").first().focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(650);
    const wide = await scene();
    assert.equal(wide.readingFocus.wideEnsemble, true);
    if (reduced) assert.ok(distance(wideBefore.camera, wide.camera) < 0.005);
    else
      assert.ok(
        wide.readingFocus.clearanceScale >= 0 &&
          wide.readingFocus.clearanceScale <= 1,
      );
    await page.screenshot({
      path: `${out}/${reduced ? "reduced" : "normal"}-family.png`,
    });
    assert.deepEqual(errors, []);
    results.push({
      wideBefore,
      wide,
      reduced,
      moved,
      before,
      focused,
      returned,
      rapid,
      changed,
      room,
    });
    await context.close();
    await video.saveAs(
      `${out}/${reduced ? "reduced" : "normal"}-interaction.webm`,
    );
    await video.delete();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log(
  "PASS: actual touch, camera return, fixed controls, rapid keyboard retarget, page/room cancellation and reduced motion.",
);
