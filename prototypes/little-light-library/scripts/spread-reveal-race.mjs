import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const out =
  process.env.SPREAD_RACE_OUT ||
  process.env.REVIEW_OUT ||
  "review/latest-validation/spread-race";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 768, height: 1024 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = () => page.waitForFunction(() => window.libraryDebug().ready);
  const debug = () => page.evaluate(() => window.libraryDebug());
  await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
  await page.locator("#enter").click();
  await page.locator('[data-book="eden"]').click();
  await ready();
  await page.waitForTimeout(2300);
  await page.locator("#next").click();
  await ready();
  await page.waitForTimeout(1300);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/serpent-branch.webp", (route) => release(route));
  await page.locator("#next").click();
  const route = await Promise.race([
    held,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(Error("Serpent request was not intercepted")),
        10000,
      ),
    ),
  ]);
  assert.equal((await debug()).ready, false);
  await page.locator("#next").click();
  await ready();
  let state = await debug();
  assert.equal(state.state.page, 3);
  assert.deepEqual(state.scene.printedPage, { story: "eden", index: 1 });
  assert.deepEqual(state.scene.destinationPrintPage, {
    story: "eden",
    index: 3,
  });
  assert.equal(state.scene.printTargetCount, 2);
  await route.continue();
  await page.waitForTimeout(500);
  state = await debug();
  assert.equal(state.state.page, 3);
  assert.deepEqual(state.scene.printedPage, { story: "eden", index: 1 });
  results.push({
    check: "Interrupted construction retains the last complete outgoing spread",
    passed: true,
  });
  await page.locator("#next").click();
  await ready();
  state = await debug();
  assert.deepEqual(state.scene.printedPage, { story: "eden", index: 3 });
  assert.equal(state.scene.printTargetCount, 2);
  await page.locator("#previous").click();
  await ready();
  state = await debug();
  assert.deepEqual(state.scene.printedPage, { story: "eden", index: 4 });
  assert.equal(state.scene.printTargetCount, 2);
  results.push({
    check:
      "Completed stage replaces both print targets with correct source and destination",
    passed: true,
  });
  await page.locator("#shelf").click();
  await page.locator('[data-book="eden"]').waitFor();
  assert.equal((await debug()).scene.printTargetCount, 0);
  results.push({
    check: "Returning to room releases both print targets",
    passed: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator("#enter").click();
  await page.locator('[data-book="noah"]').click();
  await ready();
  await page.locator("#next").click();
  await ready();
  state = await debug();
  assert.equal(state.scene.printTargetCount, 0);
  assert.equal(state.scene.printedPage, null);
  assert.equal(state.scene.pageVisible, false);
  results.push({
    check: "Reduced motion allocates no print target and shows no moving leaf",
    passed: true,
  });
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2) + "\n");
console.log(results);
