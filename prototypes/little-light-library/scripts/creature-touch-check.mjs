import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.CREATURE_REVIEW_OUT || "review/23-paper-creatures/interaction";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const variant of [
    { width: 1366, reduced: false, locale: "en-US" },
    { width: 360, reduced: false, locale: "en-US" },
    { width: 360, reduced: true, locale: "en-US" },
    { width: 360, reduced: false, locale: "ja" },
  ]) {
    const { width, reduced, locale } = variant;
    const page = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
      hasTouch: true,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const scene = () => page.evaluate(() => window.libraryDebug().scene);
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    if (locale !== "en-US")
      await page.locator(`[data-locale="${locale}"]`).click();
    await page.locator("#enter").click();
    for (const [book, spread, kind] of [
      ["eden", 3, "serpent"],
      ["noah", 5, "dove"],
    ]) {
      await page.locator(`[data-book=${book}]`).click();
      for (let n = 1; n <= spread; n++) {
        await page.waitForFunction(() => window.libraryDebug().ready);
        await page.waitForTimeout(n === 1 ? 2300 : 1300);
        if (n < spread) await page.locator("#next").click();
      }
      if ((await page.evaluate(() => window.libraryDebug())).playing)
        await page.locator("#play").click();
      await page.evaluate(() => window.libraryReview(6.2, 5, 0));
      await page.waitForTimeout(100);
      const idle = await scene();
      assert.equal(idle.creatures.length, 1);
      assert.equal(idle.creatures[0].deformation, 0);
      const target = page.locator(`[data-creature=${kind}]`);
      const box = await target.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForFunction(
        () => window.libraryDebug().scene.touchedCreature === 0,
      );
      const expected =
        locale === "ja"
          ? kind === "serpent"
            ? "蛇"
            : "鳩"
          : kind === "serpent"
            ? "Serpent"
            : "Dove";
      await page.waitForFunction(
        (text) => document.querySelector(".paper-name")?.textContent === text,
        expected,
      );
      await page.waitForTimeout(450);
      const touched = await scene();
      assert.ok(
        reduced
          ? touched.creatures[0].deformation === 0
          : touched.creatures[0].deformation > 0.01,
      );
      assert.deepEqual(
        touched.creatures[0].position,
        idle.creatures[0].position,
      );
      await target.focus();
      await page.keyboard.press("Enter");
      assert.equal((await scene()).touchedCreature, 0);
      await page.screenshot({
        path: `${out}/${width}-${locale}-${reduced ? "reduced" : "normal"}-${kind}.png`,
      });
      await page.evaluate(() => window.libraryReview(2, 5, 0.5));
      await page.waitForTimeout(100);
      assert.equal((await scene()).creatures[0].deformation, 0);
      assert.equal(await target.isVisible(), false);
      await page.evaluate(() => window.libraryReview());
      await page.locator("#next").click();
      await page.waitForFunction(() => window.libraryDebug().ready);
      await page.waitForTimeout(1300);
      assert.equal((await scene()).creatures.length, 0);
      assert.equal(await page.locator(".creature-target").count(), 0);
      results.push({
        ...variant,
        book,
        spread,
        kind,
        idle,
        touched,
        localizedName: expected,
      });
      await page.locator("#shelf").click();
      await page.locator(`[data-book=${book}]`).waitFor({ state: "visible" });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log(
  "PASS: serpent/dove actual touch, keyboard, localization, fixed supports, folded rest, reduced motion and page disposal.",
);
