import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const url = process.env.LIBRARY_URL || "http://127.0.0.1:8771/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = { browser: browser.version(), url, checks: [] };
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.checks.push({ name, passed: true, detail });
  } catch (error) {
    results.checks.push({ name, passed: false, detail: String(error) });
  }
};
const context = async (options = {}) =>
  browser.newContext({ viewport: { width: 360, height: 800 }, ...options });
const enter = async (page) => {
  await page.goto(url);
  await page.locator("#enter").waitFor();
  await page.locator("#enter").click();
  await page.waitForFunction(() => window.libraryDebug().ready);
};
const open = async (page) => {
  await page.locator('[data-book="eden"]').click();
  await page.waitForSelector(".reader");
};
try {
  await check("Startup and keyboard navigation", async () => {
    const c = await context();
    const p = await c.newPage();
    await p.goto(url);
    assert.equal(
      await p.locator("#language-dialog").evaluate((e) => e.open),
      true,
    );
    assert.equal(
      await p.locator('[data-locale="en-US"]').getAttribute("aria-pressed"),
      "true",
    );
    await p.locator("#enter").focus();
    await p.keyboard.press("Enter");
    await p.waitForFunction(() => window.libraryDebug().ready);
    await p.locator('[data-book="eden"]').focus();
    await p.keyboard.press("Enter");
    await p.waitForSelector(".reader");
    await p.locator("#settings").focus();
    await p.keyboard.press("Enter");
    assert.equal(
      await p.locator("#settings-dialog").evaluate((e) => e.open),
      true,
    );
    await p.keyboard.press("Escape");
    await p.locator("#language").focus();
    await p.keyboard.press("Enter");
    assert.equal(
      await p.locator("#language-dialog").evaluate((e) => e.open),
      true,
    );
    await p.locator('[data-locale="ja"]').focus();
    await p.keyboard.press("Enter");
    await p.locator("#enter").click();
    await p.waitForFunction(() => window.libraryDebug().ready);
    assert.equal(await p.locator("html").getAttribute("lang"), "ja");
    assert.equal(
      (await p.evaluate(() => window.libraryDebug())).playing,
      false,
    );
    await c.close();
    return "Chooser, book, settings and visual language recovery worked by keyboard; language switch paused playback.";
  });
  await check("Muted reading timeline", async () => {
    const c = await context();
    const p = await c.newPage();
    await enter(p);
    await p.locator("#settings").click();
    await p.locator("#audio").uncheck();
    await p.locator("#settings-close").click();
    await open(p);
    await p.waitForFunction(() => window.libraryDebug().ready);
    const a = await p.evaluate(() => window.libraryDebug());
    await p.waitForTimeout(400);
    const b = await p.evaluate(() => window.libraryDebug());
    assert.equal(b.audio, false);
    assert.ok(b.position > a.position, `${a.position} → ${b.position}`);
    assert.ok(await p.locator(".story-text .active").count());
    await c.close();
    return `Clock advanced ${Math.round((b.position - a.position) * 1000)} ms with sound off and visible highlight.`;
  });
  await check("Missing audio and retry", async () => {
    const c = await context();
    const p = await c.newPage();
    await p.route("**/*.wav", (route) => route.abort());
    await enter(p);
    await open(p);
    await p.locator("#notice").filter({ hasText: /.+/ }).waitFor();
    assert.ok((await p.locator(".story-text").innerText()).length > 40);
    assert.equal((await p.evaluate(() => window.libraryDebug())).ready, false);
    await p.unroute("**/*.wav");
    await p.locator("#notice button").click({ timeout: 5000 });
    await p.waitForFunction(() => window.libraryDebug().ready, null, {
      timeout: 10000,
    });
    assert.equal(
      (await p.evaluate(() => window.libraryDebug())).playing,
      false,
    );
    await p.locator("#play").click();
    assert.equal((await p.evaluate(() => window.libraryDebug())).playing, true);
    await c.close();
    return "Story remained readable after fetch failure; Retry restored the page paused, then Play resumed narration.";
  });
  await check("Missing page image and retry", async () => {
    const c = await context();
    const p = await c.newPage();
    await enter(p);
    await open(p);
    await p.waitForFunction(() => window.libraryDebug().ready);
    await p.route("**/theatre/garden.webp", (route) => route.abort());
    await p.route("**/eden-02.webp", (route) => route.abort());
    await p.locator("#next").click();
    await p.locator("#notice").filter({ hasText: /.+/ }).waitFor();
    assert.ok((await p.locator(".story-text").innerText()).length > 40);
    const missing = await p.locator("#notice").innerText();
    await p.unroute("**/eden-02.webp");
    await p.unroute("**/theatre/garden.webp");
    const retry = p.locator("#notice button");
    assert.ok(
      await retry.count(),
      `No retry control for image failure: ${missing}`,
    );
    await retry.click();
    await p.waitForFunction(() => window.libraryDebug().ready);
    await c.close();
    return "Image failure was announced and recovered through visible Retry.";
  });
  await check("Missing shelf preview preserves library access", async () => {
    const c = await context();
    const p = await c.newPage();
    await p.route("**/eden-01.webp", (route) => route.abort());
    await p.goto(url);
    await p.locator("#enter").waitFor({ timeout: 10000 });
    await p.locator("#enter").click();
    await p.locator('[data-book="noah"]').waitFor();
    await c.close();
    return "A missing decorative shelf preview did not block access to either book.";
  });
  await check("Hidden tab requires explicit resume", async () => {
    const c = await context();
    const p = await c.newPage();
    await enter(p);
    await open(p);
    await p.waitForFunction(() => window.libraryDebug().playing);
    const other = await c.newPage();
    await other.goto("about:blank");
    await p.waitForFunction(() => !window.libraryDebug().playing);
    const stopped = (await p.evaluate(() => window.libraryDebug())).position;
    await p.bringToFront();
    await p.waitForTimeout(300);
    const visible = await p.evaluate(() => window.libraryDebug());
    assert.equal(visible.playing, false);
    assert.ok(Math.abs(visible.position - stopped) < 0.05);
    await p.locator("#play").click();
    assert.equal((await p.evaluate(() => window.libraryDebug())).playing, true);
    await c.close();
    return "Backgrounding paused; foregrounding stayed paused; Play resumed.";
  });
  await check("Reduced motion and target sizes", async () => {
    const c = await context({ reducedMotion: "reduce" });
    const p = await c.newPage();
    await enter(p);
    assert.equal(
      await p.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    for (const selector of [
      "#language",
      "#settings",
      '[data-book="eden"]',
      '[data-character="adam"]',
    ]) {
      const box = await p.locator(selector).boundingBox();
      assert.ok(
        box.width >= 44 && box.height >= 44,
        `${selector}: ${box.width}×${box.height}`,
      );
    }
    await open(p);
    for (const selector of ["#previous", "#play", "#replay", "#next"]) {
      const box = await p.locator(selector).boundingBox();
      assert.ok(
        box.width >= 44 && box.height >= 44,
        `${selector}: ${box.width}×${box.height}`,
      );
    }
    assert.equal(await p.locator(".story-text").isVisible(), true);
    await c.close();
    return "Reduced-motion preference active; text visible; key controls at least 44×44 CSS px.";
  });
  await check("Renderer startup failure and recovery", async () => {
    const c = await context();
    const p = await c.newPage();
    await p.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (
          kind === "webgl" ||
          kind === "webgl2" ||
          kind === "experimental-webgl"
        )
          return null;
        return original.call(this, kind, ...args);
      };
    });
    await p.goto(url);
    await p.locator("#notice button").waitFor({ timeout: 10000 });
    assert.ok((await p.locator("#notice").innerText()).length > 8);
    assert.equal(await p.locator(".loading-retry").isVisible(), true);
    await c.close();
    return "Simulated unavailable WebGL announced startup failure and exposed retry controls.";
  });
} finally {
  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync(
    "docs/failure-results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
if (results.checks.some((x) => !x.passed)) process.exitCode = 1;
