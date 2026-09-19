import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out =
  process.env.REVIEW_OUT || "review/14-popup-folding/stages-candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const width of [1366, 360]) {
    const p = await browser.newPage({
      viewport: { width, height: width === 360 ? 800 : 768 },
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await p.locator("#enter").click();
    for (const book of ["eden", "noah"]) {
      await p.locator(`[data-book="${book}"]`).click();
      for (let index = 0; index < 8; index++) {
        await p.waitForFunction(() => window.libraryDebug().ready);
        await p.waitForTimeout(index === 0 ? 2300 : 1300);
        if ((await p.evaluate(() => window.libraryDebug())).playing)
          await p.locator("#play").click();
        for (const phase of ["middle", "settled"]) {
          const age =
            phase === "middle"
              ? index === 0
                ? 1.8
                : 0.85
              : index === 0
                ? 2.1
                : 1.1;
          await p.evaluate((age) => window.libraryReview(12, age), age);
          await p.waitForTimeout(80);
          const scene = await p.evaluate(() => window.libraryDebug().scene);
          if (phase === "settled") {
            assert.ok(
              scene.popups.every((a) => Math.abs(a - Math.PI / 2) < 1e-6),
            );
            assert.equal(scene.stageScale, 1);
          }
          await p.screenshot({
            path: `${out}/${width}-${book}-${index + 1}-${phase}.png`,
          });
          checks.push({ width, book, index, phase, age, scene });
        }
        await p.evaluate(() => window.libraryReview());
        if (index < 7) await p.locator("#next").click();
      }
      await p.locator("#shelf").click();
      await p.locator('[data-book="eden"]').waitFor();
    }
    assert.deepEqual(errors, []);
    await p.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(`PASS: ${checks.length} all-spread popup composition poses.`);
