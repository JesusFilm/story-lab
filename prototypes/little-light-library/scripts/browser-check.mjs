import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
const root = path.resolve("dist");
const prefix = "/review/little-light-library/";
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith(prefix)) {
    res.writeHead(404).end();
    return;
  }
  const file = path.resolve(
    root,
    decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    res.end(data);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}${prefix}`;
const out = "docs/captures";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = {
  browser: browser.version(),
  host: {
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0].model,
    memoryGiB: Math.round(os.totalmem() / 2 ** 30),
  },
  checks: [],
  errors: [],
};
const check = (name) => results.checks.push(name);
try {
  for (const size of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
  ]) {
    const context = await browser.newContext({
      viewport: size,
      deviceScaleFactor: 1,
      hasTouch: size.width === 360,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => results.errors.push(e.message));
    await page.goto(url);
    await page.locator("#enter").waitFor();
    assert.equal(
      await page.locator("#language-dialog").evaluate((e) => e.open),
      true,
    );
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug().ready);
    await page.screenshot({ path: `${out}/room-${size.width}.png` });
    for (const book of ["eden", "noah"]) {
      await page.locator(`[data-book="${book}"]`).click();
      await page.waitForFunction(() => window.libraryDebug().ready);
      if (book === "eden")
        await page.screenshot({ path: `${out}/eden-${size.width}.png` });
      for (let i = 0; i < 8; i++) {
        await page.waitForFunction(() => window.libraryDebug().ready);
        assert.equal(
          (await page.evaluate(() => window.libraryDebug())).state.page,
          i,
        );
        if (book === "noah" && i === 3)
          await page.screenshot({ path: `${out}/flood-${size.width}.png` });
        if (book === "noah" && i === 5)
          await page.screenshot({ path: `${out}/aftermath-${size.width}.png` });
        const box = await page.locator(".reader").boundingBox();
        assert.ok(
          box.x >= 0 && box.x + box.width <= size.width + 1,
          "reader width",
        );
        const control = await page.locator("#next").boundingBox();
        assert.ok(
          control.width >= 44 && control.height >= 44,
          `44px target ${JSON.stringify(control)}`,
        );
        assert.ok(control.y + control.height <= size.height, "reachable next");
        if (i < 7) {
          await page.locator("#next").click();
        } else {
          assert.equal(await page.locator("#next").isDisabled(), true);
          assert.equal(
            await page.locator("#next .transport-label").textContent(),
            "Next",
          );
          const lastPage = (await page.evaluate(() => window.libraryDebug()))
            .state.page;
          await page.locator("#next").evaluate((button) => button.click());
          assert.equal(
            (await page.evaluate(() => window.libraryDebug())).state.page,
            lastPage,
            "disabled Next cannot navigate past the last page",
          );
          await page.locator("#play").focus();
          const playingBeforeKey = (
            await page.evaluate(() => window.libraryDebug())
          ).playing;
          await page.keyboard.press("Enter");
          await page.waitForFunction(
            (playing) => window.libraryDebug().playing !== playing,
            playingBeforeKey,
          );
          const playingAfterKey = (
            await page.evaluate(() => window.libraryDebug())
          ).playing;
          await page.keyboard.press("Enter");
          await page.waitForFunction(
            (playing) => window.libraryDebug().playing !== playing,
            playingAfterKey,
          );
        }
      }
      await page.locator("#shelf").click();
      await page.waitForSelector(`[data-shelf-key="builtin:${book}"]`);
    }
    for (const name of ["adam", "eve", "noah"]) {
      await page.locator(`[data-character="${name}"]`).click();
      await page.waitForTimeout(120);
    }
    await page.screenshot({ path: `${out}/figurines-${size.width}.png` });
    assert.equal(
      await page.locator(".brand").getAttribute("href"),
      "https://jesusfilm.github.io/story-lab/",
    );
    check(
      `Both books, 16 spreads, figurines, nested assets and layout at ${size.width}×${size.height}`,
    );
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.locator("#enter").click();
  await page.locator('[data-book="eden"]').click();
  await page.waitForFunction(() => window.libraryDebug().ready);
  await page.locator("#next").click();
  await page.waitForFunction(() => window.libraryDebug().ready);
  for (const locale of [
    "en-US",
    "en-GB",
    "es",
    "fr",
    "hi",
    "it",
    "ja",
    "pt-BR",
    "zh-CN",
  ]) {
    await page.locator("#language").click();
    await page.locator(`[data-locale="${locale}"]`).click();
    await page.waitForFunction(
      (l) =>
        window.libraryDebug().state.language === l &&
        window.libraryDebug().ready,
      locale,
    );
    await page.locator("#enter").click();
    let d = await page.evaluate(() => window.libraryDebug());
    assert.equal(d.state.page, 1);
    assert.equal(d.playing, false);
    assert.equal(d.position, 0);
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    const ui = JSON.parse(
      fs.readFileSync(path.join("public/content", `${locale}.json`), "utf8"),
    ).ui;
    assert.deepEqual(
      await page.locator(".reader-controls .transport-label").allTextContents(),
      [ui.previous, ui.play, ui.next],
      `${locale} transport labels are localized and visible`,
    );
    assert.equal(await page.locator(".reader-controls button").count(), 3);
    assert.equal(await page.locator("#replay").count(), 0);
    assert.equal(await page.locator(".reader h1").count(), 1);
    assert.equal(await page.locator(".story-text").count(), 1);
    assert.equal(await page.locator(".reader-meta").count(), 1);
    assert.equal(await page.locator(".reader-footer small").count(), 0);
    assert.equal(
      await page
        .locator(".book-note, .book-context, .reader-book-language")
        .count(),
      0,
    );
    assert.equal(await page.locator("#language").count(), 1);
    const initialWidths = await page
      .locator(".reader-controls button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().width),
      );
    assert.ok(Math.max(...initialWidths) - Math.min(...initialWidths) < 1);
    const labelWeights = await page
      .locator(".transport-label, .transport-icon")
      .evaluateAll((items) =>
        items.map((item) => Number(getComputedStyle(item).fontWeight)),
      );
    assert.ok(labelWeights.every((weight) => weight >= 700));
    for (const speed of [0.75, 1, 1.25, 1.5]) {
      await page.locator("#settings").click();
      await page.locator("#speed").selectOption(String(speed));
      await page.locator("#settings-close").click();
      await page.locator("#play").click();
      await page.waitForTimeout(150);
      d = await page.evaluate(() => window.libraryDebug());
      assert.equal(d.speed, speed);
      assert.ok(d.playing);
      await page.locator("#play").click();
      const stopped = (await page.evaluate(() => window.libraryDebug()))
        .position;
      await page.waitForTimeout(120);
      assert.equal(
        (await page.evaluate(() => window.libraryDebug())).position,
        stopped,
      );
    }
  }
  check(
    "All nine locales show localized equal transport controls and support play/pause at all four rates",
  );
  await page.locator("#settings").click();
  await page.locator("#audio").uncheck();
  await page.locator("#volume").focus();
  await page.locator("#volume").press("Home");
  for (let i = 0; i < 7; i++) await page.locator("#volume").press("ArrowRight");
  await page.locator("#settings-close").click();
  await page.locator("#play").click();
  const before = (await page.evaluate(() => window.libraryDebug())).position;
  await page.waitForTimeout(250);
  assert.ok(
    (await page.evaluate(() => window.libraryDebug())).position > before,
  );
  await page.reload();
  await page.locator("#enter").waitFor();
  assert.equal(
    await page.locator('[data-locale="zh-CN"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#enter").click();
  const saved = await page.evaluate(() => window.libraryDebug());
  assert.equal(saved.speed, 1.5);
  assert.equal(saved.audio, false);
  assert.equal(saved.volume, 0.35);
  check("Mute advances clock and saved settings survive startup");
  await context.close();
  // Real cold browser load, fixed emulation profile, no cache; performance over 60 s.
  const perf = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
  });
  const p = await perf.newPage();
  const cdp = await perf.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: 10_000_000 / 8,
    uploadThroughput: 1_000_000 / 8,
    latency: 100,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let bytes = 0;
  cdp.on("Network.loadingFinished", (e) => (bytes += e.encodedDataLength));
  const start = Date.now();
  await p.goto(url);
  await p.locator("#enter").waitFor();
  const chooserMs = Date.now() - start;
  await p.locator("#enter").click();
  await p.waitForFunction(() => window.libraryDebug().ready);
  const shelfMs = Date.now() - start;
  const shelfBytes = bytes;
  await p.locator('[data-book="noah"]').click();
  await p.waitForFunction(() => window.libraryDebug().ready);
  await p.evaluate(() => {
    window.frameSample = [];
    window.sampleUntil = performance.now() + 60000;
    let last = performance.now();
    function tick(now) {
      window.frameSample.push(now - last);
      last = now;
      if (now < window.sampleUntil) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(10000);
    if (i < 5) {
      await p.locator("#next").click();
      await p.waitForFunction(() => window.libraryDebug().ready);
    }
  }
  const frames = await p.evaluate(() => window.frameSample);
  frames.sort((a, b) => a - b);
  const p95 = frames[Math.floor(frames.length * 0.95)];
  const duration = frames.reduce((a, b) => a + b, 0);
  results.performance = {
    label: "Chromium emulation, not a physical low-end device",
    viewport: "360×800",
    devicePixelRatio: 1,
    cpuSlowdown: 4,
    downMbps: 10,
    upMbps: 1,
    latencyMs: 100,
    chooserMs,
    shelfMs,
    shelfBytes,
    totalTransferredBytes: bytes,
    frames: frames.length,
    p95Ms: p95,
    fps: frames.length / (duration / 1000),
    heap: await p.evaluate(() => performance.memory?.usedJSHeapSize ?? null),
  };
  assert.ok(shelfMs <= 5000, `Shelf ${shelfMs} ms > 5000`);
  assert.ok(p95 <= 33, `p95 ${p95} ms > 33`);
  assert.ok(results.performance.fps >= 30, "FPS below 30");
  check("60-second throttled reading performance gates");
  await perf.close();
  assert.deepEqual(results.errors, []);
  results.passed = true;
} catch (error) {
  results.passed = false;
  results.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(
    "docs/browser-results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
}
