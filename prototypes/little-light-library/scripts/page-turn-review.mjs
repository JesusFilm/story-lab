import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/10-page-turn/candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const width of [1366, 360]) {
    const size = { width, height: width === 360 ? 800 : 768 };
    const context = await browser.newContext({
      viewport: size,
      recordVideo: { dir: `${out}/video`, size },
    });
    const p = await context.newPage();
    const video = p.video();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await p.locator("#enter").click();
    await p.locator('[data-book="eden"]').click();
    await p.waitForFunction(() => window.libraryDebug().ready);
    await p.waitForTimeout(2400);
    for (const direction of ["next", "previous"]) {
      await p.evaluate(() => window.libraryReview());
      await p.locator(`#${direction}`).click();
      await p.waitForFunction(() => window.libraryDebug().ready);
      await p.waitForTimeout(1400);
      if ((await p.evaluate(() => window.libraryDebug())).playing)
        await p.locator("#play").click();
      for (const age of [0, 0.145, 0.29, 0.435, 0.58, 1.1]) {
        await p.evaluate((age) => window.libraryReview(12, age), age);
        await p.waitForTimeout(80);
        await p.screenshot({ path: `${out}/${width}-${direction}-${age}.png` });
        const scene = await p.evaluate(() => window.libraryDebug().scene);
        if (!process.env.BASELINE) {
          assert.equal(
            scene.turnDirection,
            direction === "next" ? "forward" : "backward",
          );
          assert.equal(scene.pageVisible, age < 0.58);
          if (age <= 0.58)
            assert.ok(
              scene.popups.every(
                (a) => Math.min(Math.abs(a), Math.abs(a - Math.PI)) < 0.0001,
              ),
            );
          if (age === 1.1)
            assert.ok(
              scene.popups.every((a) => Math.abs(a - Math.PI / 2) < 0.0001),
            );
        }
        checks.push({ width, direction, age, scene });
      }
    }
    await p.evaluate(() => window.libraryReview());
    await p.locator("#next").click();
    await p.waitForFunction(() => window.libraryDebug().ready);
    await p.waitForTimeout(1700);
    await p.locator("#previous").click();
    await p.waitForFunction(() => window.libraryDebug().ready);
    await p.waitForTimeout(1700);
    assert.deepEqual(errors, []);
    await context.close();
    await video.saveAs(`${out}/${width}-turns.webm`);
    await video.delete();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(
  `Saved ${checks.length} fixed-time page poses and real-time silent turns.`,
);
