import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/13-fold-continuity/candidate-04";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
const ages = process.env.REVIEW_AGES
  ? process.env.REVIEW_AGES.split(",").map(Number)
  : [0, 0.145, 0.29, 0.435, 0.58, 1.1];
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
    for (const book of ["eden", "noah"]) {
      await p.locator(`[data-book="${book}"]`).click();
      await p.waitForFunction(() => window.libraryDebug().ready);
      await p.waitForTimeout(2400);
      await p.locator("#next").click();
      await p.waitForFunction(() => window.libraryDebug().ready);
      await p.waitForTimeout(1400);
      for (const direction of ["next", "previous"]) {
        await p.evaluate(() => window.libraryReview());
        await p.locator(`#${direction}`).click();
        await p.waitForFunction(() => window.libraryDebug().ready);
        await p.waitForTimeout(1400);
        if ((await p.evaluate(() => window.libraryDebug())).playing)
          await p.locator("#play").click();
        for (const age of ages) {
          await p.evaluate((age) => window.libraryReview(12, age), age);
          await p.waitForTimeout(80);
          await p.screenshot({
            path: `${out}/${width}-${book}-${direction}-${age}.png`,
          });
          const scene = await p.evaluate(() => window.libraryDebug().scene);
          if (!process.env.BASELINE) {
            assert.equal(
              scene.turnDirection,
              direction === "next" ? "forward" : "backward",
            );
            assert.equal(scene.pageVisible, age < 0.58);
            assert.deepEqual(scene.printedPage, {
              story: book,
              index: direction === "next" ? 1 : 2,
            });
            assert.deepEqual(scene.destinationPrintPage, {
              story: book,
              index: direction === "next" ? 2 : 1,
            });
            assert.equal(scene.printTargetCount, 2);
            assert.equal(scene.sourcePrintContainment.contained, true);
            assert.equal(scene.destinationPrintContainment.contained, true);
            if (age <= 0.58) {
              assert.ok(
                Math.abs(
                  0.075 * scene.stageScale + scene.stageOffsetZ - 0.075,
                ) < 1e-9,
              );
              assert.ok(
                Math.abs(
                  scene.stageScale - scene.destinationPrintContainment.scale,
                ) < 1e-9,
              );
              assert.ok(
                Math.abs(
                  scene.stageOffsetY +
                    scene.destinationPrintContainment.centerY *
                      scene.destinationPrintContainment.scale,
                ) < 1e-9,
              );
            }
            if (age === 1.1) {
              assert.equal(scene.stageScale, 1);
              assert.equal(scene.stageOffsetY, 0);
            }
            assert.equal(scene.transitionWaiting, false);
            assert.equal(scene.stageVisible, age >= 0.58);
            assert.equal(scene.stationarySourceVisible, age < 0.58);
            assert.equal(scene.destinationPaperVisible, age < 0.58);
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
          checks.push({ width, book, direction, age, scene });
        }
      }
      await p.evaluate(() => window.libraryReview());
      await p.locator("#next").click();
      await p.waitForFunction(() => window.libraryDebug().ready);
      await p.waitForTimeout(1700);
      await p.locator("#previous").click();
      await p.waitForFunction(() => window.libraryDebug().ready);
      await p.waitForTimeout(1700);
      await p.locator("#shelf").click();
      await p.locator('[data-book="eden"]').waitFor();
      if (!process.env.BASELINE) {
        const scene = await p.evaluate(() => window.libraryDebug().scene);
        assert.equal(scene.printedPage, null);
        assert.equal(scene.printTargetCount, 0);
      }
    }
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
