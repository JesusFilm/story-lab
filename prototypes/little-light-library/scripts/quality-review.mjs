import { chromium } from "playwright";
import fs from "node:fs";
const out =
  process.env.REVIEW_OUT || process.env.REVIEW_DIR || "review/03-acting";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const observations = [];
const errors = [];
try {
  for (const [width, height] of [
    [1366, 768],
    [360, 800],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      recordVideo: { dir: `${out}/video`, size: { width, height } },
    });
    const page = await context.newPage();
    const video = page.video();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771/");
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.libraryReview(12));
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${out}/${width}-room.png` });
    for (const name of ["adam", "eve", "noah"]) {
      await page.locator(`[data-character="${name}"]`).click();
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.libraryReview());
    for (const book of ["eden", "noah"]) {
      await page.locator(`[data-book="${book}"]`).click();
      for (let n = 0; n < 8; n++) {
        await page.waitForFunction(() => window.libraryDebug().ready);
        if (n === 0 && book === "eden") {
          for (let k = 0; k < 6; k++) {
            await page.waitForTimeout(350);
            await page.screenshot({ path: `${out}/${width}-opening-${k}.png` });
            observations.push({
              width,
              book,
              page: n,
              phase: k,
              state: await page.evaluate(() => window.libraryDebug()),
            });
          }
        } else await page.waitForTimeout(1300);
        if (await page.evaluate(() => window.libraryDebug().playing))
          await page.locator("#play").click();
        await page.evaluate(() => window.libraryReview(12));
        await page.waitForTimeout(100);
        await page.screenshot({
          path: `${out}/${width}-${book}-${String(n + 1).padStart(2, "0")}.png`,
        });
        observations.push({
          width,
          book,
          page: n,
          state: await page.evaluate(() => window.libraryDebug()),
        });
        await page.evaluate(() => window.libraryReview());
        await page.locator("#next").click();
      }
      await page.locator('[data-book="eden"]').waitFor();
    }
    await context.close();
    await video.saveAs(`${out}/${width}-playthrough.webm`);
  }
} finally {
  await browser.close();
  fs.writeFileSync(
    `${out}/observations.json`,
    JSON.stringify({ errors, observations }, null, 2),
  );
}
if (errors.length) throw Error(errors.join("\n"));
console.log(
  `Saved real-time silent video, frozen stills and scene telemetry in ${out}. Audio and continuous-motion perception are separate review requirements.`,
);
