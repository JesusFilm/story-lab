import { chromium } from "playwright";
import fs from "node:fs";
const out = process.env.REVIEW_OUT || "review/19-room-orbit/candidate-01";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const checks = [];
try {
  for (const [width, height] of [
    [360, 800],
    [768, 1024],
    [1366, 768],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(process.env.LIBRARY_URL || "http://127.0.0.1:8771");
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.waitForTimeout(1800);
    for (const [name, from, to] of [
      ["center", 0.5, 0.5],
      ["right", 0.25, 0.75],
      ["left", 0.75, 0.1],
    ]) {
      await page.mouse.move(width * from, 120);
      await page.mouse.down();
      await page.mouse.move(width * to, 120, { steps: 18 });
      await page.mouse.up();
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${out}/${width}-${name}.png` });
      checks.push({
        width,
        height,
        name,
        scene: await page.evaluate(() => window.libraryDebug().scene),
      });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/checks.json`, JSON.stringify(checks, null, 2) + "\n");
console.log("PASS: room center and two drag endpoints captured at all3 sizes.");
