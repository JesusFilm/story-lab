import { chromium } from "playwright";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8771");
await page.locator("#enter").click();
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/captures/room-desktop.png" });
await page.locator('[data-book="eden"]').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: "docs/captures/eden-desktop.png" });
console.log({
  errors,
  state: await page.evaluate(() => window.libraryDebug()),
});
await browser.close();
