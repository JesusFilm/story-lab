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
const out =
  process.env.GARDEN_PERF_OUT || "review/latest-validation/garden-performance";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
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
  await p.locator('[data-book="eden"]').click();
  await p.waitForFunction(() => window.libraryDebug().ready);
  assert.equal(
    await p.evaluate(() => window.libraryDebug().scene.gardenFloor),
    true,
  );
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
  const result = {
    label: "Eden garden; Chromium emulation, not a physical low-end device",
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
  assert.ok(result.fps >= 30, "FPS below 30");
  fs.writeFileSync(
    `${out}/performance.json`,
    JSON.stringify(
      {
        browser: browser.version(),
        host: {
          cpu: os.cpus()[0].model,
          memoryGiB: Math.round(os.totalmem() / 2 ** 30),
        },
        ...result,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
  console.log("PASS: 60-second Eden garden performance gates.");
  await perf.close();
} finally {
  await browser.close();
  server.close();
}
