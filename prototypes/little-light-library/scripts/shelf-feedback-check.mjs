import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out = process.env.SHELF_REVIEW_OUT || "review/latest-validation/shelf";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const [width, reduced] of [
    [1366, false],
    [360, false],
    [360, true],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    const label = page.locator(".room-name");
    await page.locator('[data-character="eve"]').focus();
    await page.waitForFunction(
      () => window.libraryDebug().scene.roomLabel === "Eve",
    );
    await page.keyboard.press("Enter");
    await page.waitForTimeout(220);
    let scene = await page.evaluate(() => window.libraryDebug().scene);
    assert.ok(
      scene.figurines.every(
        (g) => g.baseRotation === 0 && g.baseBottom === g.shelfTop,
      ),
    );
    assert.equal(scene.roomLabel, "Eve");
    if (reduced) assert.ok(scene.figurines.every((g) => g.bodyRotation === 0));
    else
      assert.ok(
        Math.abs(scene.figurines.find((g) => g.id === "eve").bodyRotation) >
          0.04,
      );
    await page.screenshot({
      path: `${out}/${width}-${reduced ? "reduced" : "normal"}-focus.png`,
    });
    for (const id of ["adam", "eve", "noah"]) {
      await page.locator(`[data-character="${id}"]`).click();
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(900);
    scene = await page.evaluate(() => window.libraryDebug().scene);
    assert.ok(
      scene.figurines.every(
        (g) => g.bodyRotation === 0 && g.baseRotation === 0,
      ),
      "all figures must settle after rapid switching",
    );
    await page.locator('[data-character="noah"]').focus();
    await page.waitForFunction(
      () => window.libraryDebug().scene.roomLabel === "Noah",
    );
    const noahBox = await label.boundingBox();
    const noahPoint = (
      await page.evaluate(() => window.libraryDebug().scene)
    ).figurines.find((g) => g.id === "noah").screen.torso;
    assert.ok(
      Math.abs(noahBox.x + noahBox.width / 2 - noahPoint.x) < 22,
      "short name must stay anchored to its figure on narrow screens",
    );
    // Exercise actual canvas raycasting, not only the DOM controls.
    await page.locator("#language").focus();
    let points = (
      await page.evaluate(() => window.libraryDebug().scene)
    ).figurines.find((g) => g.id === "eve").screen;
    await page.mouse.move(points.torso.x, points.torso.y);
    await page.waitForFunction(
      () => window.libraryDebug().scene.roomSelection === "eve",
    );
    assert.equal(
      await page.locator("#scene canvas").evaluate((el) => el.style.cursor),
      "pointer",
    );
    await page.mouse.click(points.torso.x, points.torso.y);
    await page.waitForTimeout(160);
    assert.equal(
      (await page.evaluate(() => window.libraryDebug().scene)).roomLabel,
      "Eve",
    );
    await page.mouse.move(8, 110);
    await page.waitForTimeout(1000);
    points = (
      await page.evaluate(() => window.libraryDebug().scene)
    ).figurines.find((g) => g.id === "eve").screen;
    await page.mouse.move(
      points.transparentCorner.x,
      points.transparentCorner.y,
    );
    await page.waitForTimeout(100);
    assert.equal(
      (await page.evaluate(() => window.libraryDebug().scene)).roomSelection,
      null,
      "transparent margins must not pick a figure",
    );
    await page.locator('[data-book="eden"]').focus();
    await page.waitForFunction(
      () =>
        window.libraryDebug().scene.roomLabel === "Adam, Eve, and the Garden",
    );
    const box = await label.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
    const shelfFigures = (
      await page.evaluate(() => window.libraryDebug().scene)
    ).figurines;
    assert.ok(
      box.y > Math.max(...shelfFigures.map((g) => g.screen.base.y)),
      "book title must stay below unrelated shelf figures",
    );
    await page.screenshot({
      path: `${out}/${width}-${reduced ? "reduced" : "normal"}-book-focus.png`,
    });
    await page.locator("#language").click();
    await page.locator('[data-locale="ja"]').click();
    await page.locator("#enter").click();
    await page.waitForFunction(
      () =>
        window.libraryDebug().ready && document.documentElement.lang === "ja",
    );
    const name = (await page.locator('[data-character="eve"]').innerText())
      .replace("♪", "")
      .trim();
    await page.locator('[data-character="eve"]').focus();
    await page.waitForFunction(
      (name) => window.libraryDebug().scene.roomLabel === name,
      name,
    );
    await page.screenshot({
      path: `${out}/${width}-${reduced ? "reduced" : "normal"}-japanese.png`,
    });
    await page.locator('[data-book="eden"]').click();
    await page.waitForFunction(
      () =>
        window.libraryDebug().ready &&
        window.libraryDebug().scene.mode === "spread",
    );
    await page.waitForTimeout(2200);
    assert.equal(
      await page.locator(".room-name").count(),
      0,
      "shelf label style must leave reading view",
    );
    assert.deepEqual(errors, []);
    checks.push({
      width,
      reduced,
      name,
      rapidSettled: true,
      baseGrounded: true,
      localized: true,
      cleanup: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  "PASS: shelf focus, grounded feedback, rapid settling, localization and reduced motion.",
);
