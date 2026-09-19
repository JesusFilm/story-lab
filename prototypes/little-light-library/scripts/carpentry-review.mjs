import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const out = process.env.REVIEW_OUT || "review/07-carpentry/after";
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
    for (const book of ["noah"]) {
      await p.locator(`[data-book="${book}"]`).click();
      for (let n = 1; n <= 2; n++) {
        await p.waitForFunction(() => window.libraryDebug().ready);
        if (n === 2) {
          await p.waitForTimeout(1300);
          if ((await p.evaluate(() => window.libraryDebug())).playing)
            await p.locator("#play").click();
          await p.evaluate(() => window.libraryReview(12));
          await p.waitForTimeout(100);
          const state = await p.evaluate(() => window.libraryDebug().scene);
          const expected = "timber-bench";
          assert.ok(state.props.includes(expected));
          await p.screenshot({ path: `${out}/${width}-${book}-0${n}.png` });
          checks.push({ width, book, page: n, props: state.props });
          if (n === 2) {
            for (const phase of [0, 0.65, 1, 1.6, 2.2]) {
              await p.evaluate((t) => window.libraryReview(t), phase);
              await p.waitForTimeout(100);
              await p.screenshot({
                path: `${out}/${width}-hammer-${phase}.png`,
              });
            }
            await p.evaluate(() => window.libraryReview());
            await p.waitForTimeout(5200);
            await p.locator(".paper-target").press("Enter");
            assert.equal(
              (await p.evaluate(() => window.libraryDebug().scene))
                .touchedActor,
              0,
            );
          }
        }
        await p.evaluate(() => window.libraryReview());
        if (n < 2) await p.locator("#next").click();
      }
      await p.locator("#shelf").click();
      await p.locator('[data-book="eden"]').waitFor();
    }
    assert.deepEqual(errors, []);
    await context.close();
    await video.saveAs(`${out}/${width}-props.webm`);
    await video.delete();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log(checks);
