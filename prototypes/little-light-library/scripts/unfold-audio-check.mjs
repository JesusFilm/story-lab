import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.addInitScript(() => {
    window.narrationStarts = [];
    const decoded = new WeakSet();
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = async function (...args) {
      const buffer = await decode.apply(this, args);
      decoded.add(buffer);
      return buffer;
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (!decoded.has(this.buffer)) return start.apply(this, args);
      const scene = window.libraryDebug?.().scene;
      window.narrationStarts.push({
        stage: scene?.stageVisible,
        angles: scene?.popups,
        waiting: scene?.transitionWaiting,
      });
      return start.apply(this, args);
    };
  });
  await page.goto("http://127.0.0.1:8771/");
  await page.getByRole("button", { name: "Enter the library" }).click();
  await page
    .getByRole("button", {
      name: "Preview Adam, Eve, and the Garden",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Read", exact: true }).click();
  await page.waitForFunction(() => window.narrationStarts.length > 0);
  const verify = async () => {
    const starts = await page.evaluate(() => window.narrationStarts);
    for (const entry of starts) {
      assert.equal(entry.stage, true);
      assert.equal(entry.waiting, false);
      assert.ok(entry.angles.length > 0);
      assert.ok(
        entry.angles.every((angle) => Math.abs(angle - Math.PI / 2) < 0.0001),
      );
    }
  };
  await verify();
  await page.evaluate(() => {
    window.narrationStarts = [];
  });
  await page.locator("#next").click();
  await page.waitForFunction(() => window.narrationStarts.length > 0);
  await verify();
  console.log(
    "Narration begins only after upright popups on opening and page turn.",
  );
  await page.waitForFunction(() => window.libraryDebug?.().ready);
  await page.evaluate(() => {
    window.narrationStarts = [];
  });
  await page.locator("#next").click();
  await page.locator("#shelf").click();
  await page.waitForFunction(
    () =>
      window.libraryDebug?.().shelf.browsing &&
      !window.libraryDebug?.().shelf.busy,
  );
  assert.equal(await page.evaluate(() => window.narrationStarts.length), 0);
  assert.equal(await page.evaluate(() => window.libraryDebug().playing), false);
  console.log("Returning to the library cancels pending narration.");
} finally {
  await browser.close();
}
