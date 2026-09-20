import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("dist");
const prefix = "/acceptance/little-light-library/";
const output = path.resolve(".test-output/authoring");
const visualOnly = process.argv.includes("--visual");
const summaryPath = path.resolve(
  visualOnly
    ? "review/latest/visual-editor-results.json"
    : "review/latest/authoring-results.json",
);
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".wav": "audio/wav",
  ".webp": "image/webp",
};

assert.ok(
  fs.existsSync(path.join(root, "index.html")),
  "Build first with `npm run build`.",
);
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.dirname(summaryPath), { recursive: true });

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (!url.pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const file = path.resolve(
    root,
    decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
  );
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, bytes) => {
    if (error) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(bytes);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}${prefix}`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = {
  generatedAt: new Date().toISOString(),
  method:
    "Playwright against the production build at a nested static URL. Scene values come from the reader's debug surface; narration samples use the decoded WebAudio clock.",
  browser: browser.version(),
  host: {
    platform: os.platform(),
    arch: os.arch(),
  },
  urlPath: prefix,
  checks: [],
  pageErrors: [],
};

const check = async (name, run) => {
  if (visualOnly && !name.startsWith("visual composition")) return;
  console.log(`Running: ${name}`);
  const started = Date.now();
  try {
    const detail = await run();
    results.checks.push({
      name,
      passed: true,
      durationMs: Date.now() - started,
      detail,
    });
  } catch (error) {
    console.error(`Failed: ${name}: ${error.message}`);
    results.checks.push({
      name,
      passed: false,
      durationMs: Date.now() - started,
      detail: error.stack || String(error),
    });
  }
};

const makeContext = (options = {}) =>
  browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    ...options,
  });

const watchErrors = (page) =>
  page.on("pageerror", (error) => results.pageErrors.push(error.message));

const enter = async (page) => {
  await page.goto(url);
  await page.locator("#enter").waitFor();
  await page.locator("#enter").click();
  await page.waitForFunction(() => window.libraryDebug().ready);
};

const openAuthor = async (page) => {
  await page.locator("#author").click();
  await page.waitForFunction(
    () => document.querySelector("#author-dialog")?.open === true,
  );
  await page.locator('[data-edit-book="included-quiet-garden"]').click();
  await page.locator('[data-studio="details"]').click();
};

const loadDemo = openAuthor;

const preview = async (page) => {
  await page.locator("#author-preview").click();
  try {
    await page.waitForFunction(
      () =>
        document.querySelector("#author-dialog")?.open === false &&
        window.libraryDebug().scene?.authored,
      null,
      { timeout: 30_000 },
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      dialogOpen: document.querySelector("#author-dialog")?.open,
      report: document.querySelector("#author-report")?.textContent,
      notice: document.querySelector("#notice")?.textContent,
      debug: window.libraryDebug?.(),
    }));
    throw new Error(
      `${error.message}\nPreview diagnostics: ${JSON.stringify(diagnostic)}`,
    );
  }
};

const waitForSettledStage = (page) =>
  page.waitForFunction(() => {
    const debug = window.libraryDebug();
    return (
      debug.ready &&
      debug.scene?.authored &&
      debug.scene.popups.every((angle) => Math.abs(angle - Math.PI / 2) < 0.01)
    );
  });

const authorJson = async (page) =>
  JSON.parse(await page.locator("#author-json").inputValue());

const setAuthorJson = async (page, book) => {
  await page.locator('[data-author-tab="json"]').click();
  await page.locator("#author-json-source").fill(JSON.stringify(book, null, 2));
};

let portablePath;

await check("Responsive two-spread demo preview", async () => {
  const sizes = [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
  ];
  const seen = [];
  for (const viewport of sizes) {
    const context = await makeContext({
      viewport,
      hasTouch: viewport.width === 360,
    });
    const page = await context.newPage();
    watchErrors(page);
    await enter(page);
    await loadDemo(page);
    await preview(page);
    await waitForSettledStage(page);
    let debug = await page.evaluate(() => window.libraryDebug());
    assert.equal(debug.state.book, "quiet-garden");
    assert.equal(debug.state.pageCount, 2);
    assert.equal(debug.state.page, 0);
    assert.equal(debug.scene.authored.elements.length, 2);
    assert.ok(debug.scene.authored.ground);
    assert.equal(
      await page.locator(".reader-meta").innerText(),
      "Quiet Garden\n1 / 2",
    );
    await page
      .locator(".authored-interactions button")
      .scrollIntoViewIfNeeded();
    const target = await page
      .locator(".authored-interactions button")
      .boundingBox();
    assert.ok(target.width >= 44 && target.height >= 44);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(output, `${viewport.width}-spread-1.png`),
    });
    await page.locator("#next").click();
    await page.waitForFunction(
      () =>
        window.libraryDebug().state.page === 1 &&
        window.libraryDebug().scene?.authored &&
        window
          .libraryDebug()
          .scene?.authored?.elements.some((element) => element.id === "branch"),
    );
    debug = await page.evaluate(() => window.libraryDebug());
    assert.equal(debug.scene.authored.elements.length, 3);
    assert.equal(
      await page.locator(".reader-meta").innerText(),
      "Quiet Garden\n2 / 2",
    );
    await waitForSettledStage(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(output, `${viewport.width}-spread-2.png`),
    });
    seen.push(`${viewport.width}×${viewport.height}`);
    await context.close();
  }
  return `Validated and rendered both authored spreads at ${seen.join(", ")}.`;
});

await check(
  "Placement, ground, measured gesture, interaction, rejection, undo and export",
  async () => {
    const context = await makeContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    watchErrors(page);
    await enter(page);
    await loadDemo(page);
    await preview(page);

    await openAuthor(page);
    const edited = await authorJson(page);
    const first = edited.spreads[0];
    first.ground.x = 0.3;
    first.ground.width = 4.8;
    const adam = first.elements.find((element) => element.id === "adam");
    adam.placement.x = -1.25;
    adam.placement.elevation = 0.12;
    adam.placement.rotation = 9;
    adam.motion = {
      preset: "rock",
      trigger: "narration",
      segment: first.segments[0].id,
      delay: 0.2,
      duration: 1.4,
      strength: 12,
      repeat: 1,
    };
    await setAuthorJson(page, edited);
    await preview(page);
    let authored = (await page.evaluate(() => window.libraryDebug())).scene
      .authored;
    const renderedAdam = authored.elements.find(
      (element) => element.id === "adam",
    );
    assert.ok(Math.abs(renderedAdam.position[0] + 1.25) < 0.001);
    assert.ok(Math.abs(renderedAdam.anchorPosition[1] - 0.12) < 0.001);
    assert.ok(Math.abs(renderedAdam.rotation - (9 * Math.PI) / 180) < 0.001);
    assert.ok(Math.abs(authored.ground.position[0] - 0.3) < 0.001);
    assert.deepEqual(authored.ground.size, [4.8, 2.3]);

    await waitForSettledStage(page);
    await page.locator("#replay").click();
    await page.waitForFunction(() => window.libraryDebug().playing);
    const samples = [];
    while ((await page.evaluate(() => window.libraryDebug().position)) < 1.9) {
      samples.push(
        await page.evaluate(() => {
          const debug = window.libraryDebug();
          const element = debug.scene.authored.elements.find(
            (candidate) => candidate.id === "adam",
          );
          return { position: debug.position, rocking: element.rocking };
        }),
      );
      await page.waitForTimeout(40);
    }
    const active = samples.filter((sample) => Math.abs(sample.rocking) > 0.005);
    assert.ok(
      active.length >= 10,
      `Only ${active.length} moving frame samples`,
    );
    assert.ok(active[0].position >= 0.18 && active[0].position <= 0.38);
    assert.ok(
      Math.max(...active.map((sample) => Math.abs(sample.rocking))) > 0.17,
    );
    assert.ok(
      samples
        .filter((sample) => sample.position > 1.7)
        .every((sample) => Math.abs(sample.rocking) < 0.01),
      "Gesture did not return to authored rest angle",
    );

    const interaction = page.locator(
      '.authored-interactions button[data-element="tree"]',
    );
    await interaction.focus();
    await page.keyboard.press("Enter");
    await page.locator("#notice").filter({ hasText: "quiet rustle" }).waitFor();
    await interaction.click();
    assert.match(await page.locator("#notice").innerText(), /quiet rustle/);

    await openAuthor(page);
    const stale = structuredClone(edited);
    stale.spreads[0].segments[0].text += " A small edit.";
    await setAuthorJson(page, stale);
    await preview(page);
    await page
      .locator("#notice")
      .filter({ hasText: "missing or stale narration" })
      .waitFor();
    assert.equal(await page.locator("#play").isDisabled(), true);
    assert.equal(await page.locator("#replay").isDisabled(), true);

    await openAuthor(page);
    const invalidVersion = structuredClone(stale);
    invalidVersion.version = 2;
    await setAuthorJson(page, invalidVersion);
    await page.locator("#author-preview").click();
    await page
      .locator("#author-report")
      .filter({ hasText: "SCHEMA" })
      .waitFor();
    assert.equal(
      await page.locator("#author-dialog").evaluate((dialog) => dialog.open),
      true,
    );

    const brokenReference = structuredClone(stale);
    brokenReference.spreads[0].elements[0].asset = "not-an-asset";
    await setAuthorJson(page, brokenReference);
    await page.locator("#author-preview").click();
    await page
      .locator("#author-report")
      .filter({ hasText: "ASSET_REFERENCE" })
      .waitFor();

    const missingAsset = structuredClone(stale);
    missingAsset.assets["tree-cutout"].src =
      "assets/art/missing-authoring-check.webp";
    await setAuthorJson(page, missingAsset);
    await page.locator("#author-preview").click();
    await page
      .locator("#author-report")
      .filter({ hasText: "MISSING_OR_INVALID_ASSET" })
      .waitFor();
    await page.locator("#author-close").click();
    assert.match(
      await page.locator(".story-text").innerText(),
      /A small edit\./,
    );
    assert.equal(await page.locator("#play").isDisabled(), true);

    await openAuthor(page);
    await page.locator("#author-undo").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#author-dialog")?.open === false &&
        window.libraryDebug().scene?.authored,
    );
    assert.doesNotMatch(
      await page.locator(".story-text").innerText(),
      /A small edit\./,
    );
    assert.equal(await page.locator("#play").isDisabled(), false);
    authored = (await page.evaluate(() => window.libraryDebug())).scene
      .authored;
    assert.ok(
      Math.abs(
        authored.elements.find((element) => element.id === "adam").position[0] +
          1.25,
      ) < 0.001,
    );

    await openAuthor(page);
    await page.route("**/assets/**", async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "content-type": "application/octet-stream",
        },
      });
    });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#author-export").click(),
    ]);
    portablePath = path.join(output, "quiet-garden-portable.book.json");
    await download.saveAs(portablePath);
    const portable = JSON.parse(fs.readFileSync(portablePath, "utf8"));
    assert.equal(portable.version, 1);
    assert.equal(portable.spreads[0].ground.x, 0.3);
    assert.equal(portable.spreads[0].elements[0].placement.x, -1.25);
    assert.equal(portable.spreads[0].elements[0].motion.strength, 12);
    assert.ok(
      Object.values(portable.assets).every((asset) =>
        asset.src.startsWith("data:"),
      ),
    );
    assert.match(portable.assets["cover-art"].src, /^data:image\/webp;base64,/);
    assert.match(
      portable.assets["narration-garden-1"].src,
      /^data:audio\/wav;base64,/,
    );
    const authoredWithoutSources = (book) => {
      const copy = structuredClone(book);
      for (const asset of Object.values(copy.assets)) delete asset.src;
      return copy;
    };
    assert.deepEqual(
      authoredWithoutSources(portable),
      authoredWithoutSources(edited),
    );
    for (const [id, original] of Object.entries(edited.assets)) {
      assert.ok(
        !original.src.startsWith("data:"),
        `${id}: expected demo file path`,
      );
      const encoded = portable.assets[id].src.split(",", 2)[1];
      assert.ok(encoded, `${id}: missing embedded payload`);
      assert.deepEqual(
        Buffer.from(encoded, "base64"),
        fs.readFileSync(path.join(root, original.src)),
        `${id}: exported bytes differ from source`,
      );
    }
    assert.ok(fs.statSync(portablePath).size > 100_000);
    await context.close();
    return {
      movingFrameSamples: active.length,
      firstMotionPositionSeconds: active[0].position,
      peakRockDegrees:
        (Math.max(...active.map((sample) => Math.abs(sample.rocking))) * 180) /
        Math.PI,
      portableBytes: fs.statSync(portablePath).size,
    };
  },
);

await check("Late stage asset failure restores the prior preview", async () => {
  const context = await makeContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  watchErrors(page);
  await enter(page);
  await loadDemo(page);
  await preview(page);
  const prior = await page.evaluate(() => window.libraryDebug());
  assert.equal(prior.state.book, "quiet-garden");
  assert.equal(prior.state.page, 0);

  await openAuthor(page);
  let treeRequests = 0;
  await page.route("**/assets/art/eden-tree.webp", (route) => {
    treeRequests++;
    return treeRequests === 2 ? route.abort() : route.continue();
  });
  await page.locator("#author-preview").click();
  await page
    .locator("#author-report")
    .filter({ hasText: "Stage preview failed" })
    .waitFor();
  assert.ok(treeRequests >= 2, `Only ${treeRequests} tree requests observed`);
  assert.equal(
    await page.locator("#author-dialog").evaluate((dialog) => dialog.open),
    true,
  );
  await page.locator("#author-close").click();
  await page.waitForFunction(
    () =>
      window.libraryDebug().ready &&
      window.libraryDebug().state.book === "quiet-garden" &&
      window.libraryDebug().state.page === 0 &&
      window
        .libraryDebug()
        .scene?.authored?.elements.some((element) => element.id === "tree"),
  );
  assert.equal(
    await page.locator(".reader-meta").innerText(),
    "Quiet Garden\n1 / 2",
  );
  await context.close();
  return `Observed ${treeRequests} tree requests: validation passed, stage loading failed, and the prior preview was restored.`;
});

await check("Portable re-import uses embedded media", async () => {
  assert.ok(portablePath && fs.existsSync(portablePath));
  const context = await makeContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  watchErrors(page);
  await enter(page);
  await page.locator("#author").click();
  await page.locator("#author-library .library-book").first().waitFor();
  await page
    .locator("#author-library img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode().catch(() => {}))),
    );
  let assetRequests = 0;
  await page.route("**/assets/**", (route) => {
    assetRequests++;
    return route.abort();
  });
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator("#author-file").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(portablePath);
  await page
    .locator("#author-report")
    .filter({ hasText: "Imported into the draft" })
    .waitFor();
  await page.locator("#author-visual").waitFor();
  await page.locator('[data-studio="details"]').click();
  await preview(page);
  assert.equal(
    assetRequests,
    0,
    "Portable preview requested public asset files",
  );
  const debug = await page.evaluate(() => window.libraryDebug());
  assert.equal(debug.state.book, "quiet-garden");
  assert.ok(
    Math.abs(
      debug.scene.authored.elements.find((element) => element.id === "adam")
        .position[0] + 1.25,
    ) < 0.001,
  );
  await page.locator("#replay").click();
  await page.waitForFunction(() => window.libraryDebug().playing);
  const before = (await page.evaluate(() => window.libraryDebug())).position;
  await page.waitForTimeout(250);
  const after = (await page.evaluate(() => window.libraryDebug())).position;
  assert.ok(after > before);
  assert.equal(assetRequests, 0);
  await context.close();
  return `Re-imported ${fs.statSync(portablePath).size} embedded bytes with no /assets/ request.`;
});

await check("Reduced motion and muted narration timeline", async () => {
  const context = await makeContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  watchErrors(page);
  await enter(page);
  await loadDemo(page);
  await preview(page);
  assert.equal(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    true,
  );
  await page.locator("#settings").click();
  await page.locator("#audio").uncheck();
  await page.locator("#settings-close").click();
  await page.locator("#replay").click();
  const before = (await page.evaluate(() => window.libraryDebug())).position;
  await page.waitForTimeout(500);
  const debug = await page.evaluate(() => window.libraryDebug());
  assert.equal(debug.audio, false);
  assert.ok(debug.position > before + 0.25);
  assert.ok(
    debug.scene.authored.elements.every(
      (element) => Math.abs(element.rocking) < 0.000001,
    ),
  );
  const interaction = page.locator(
    '.authored-interactions button[data-element="tree"]',
  );
  await interaction.focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#notice").innerText(), /quiet rustle/);
  await context.close();
  return "Muted WebAudio clock advanced and drove highlights while reduced motion kept authored cutouts static; keyboard response remained available.";
});

await check("10-second authored-stage phone performance smoke", async () => {
  const context = await makeContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: true,
  });
  const page = await context.newPage();
  watchErrors(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await enter(page);
  await loadDemo(page);
  await preview(page);
  await waitForSettledStage(page);
  await page.locator("#replay").click();
  await page.waitForFunction(() => window.libraryDebug().playing);
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = [];
        let last = performance.now();
        const end = last + 10_000;
        const tick = (now) => {
          samples.push(now - last);
          last = now;
          if (now >= end) resolve(samples);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  const stable = frames.slice(1);
  const ordered = [...stable].sort((a, b) => a - b);
  const elapsed = stable.reduce((sum, value) => sum + value, 0);
  const fps = stable.length / (elapsed / 1000);
  const p95Ms = ordered[Math.floor(ordered.length * 0.95)];
  assert.ok(fps >= 30, `Gross frame regression: ${fps.toFixed(1)} FPS`);
  await context.close();
  return {
    label: "Short smoke, not the historical 60-second performance profile",
    viewport: "360×800",
    devicePixelRatio: 1,
    cpuSlowdown: 4,
    durationMs: elapsed,
    frames: stable.length,
    fps,
    p95Ms,
  };
});

await check("Legacy books and nine locales remain complete", async () => {
  const context = await makeContext();
  const page = await context.newPage();
  watchErrors(page);
  await enter(page);
  for (const book of ["eden", "noah"]) {
    await page.locator(`[data-book="${book}"]`).click();
    for (let spread = 0; spread < 8; spread++) {
      await page.waitForFunction(
        (expected) =>
          window.libraryDebug().ready &&
          window.libraryDebug().state.page === expected,
        spread,
      );
      assert.equal(
        (await page.locator(".reader-meta").innerText()).endsWith(
          `${spread + 1} / 8`,
        ),
        true,
      );
      await page.locator("#next").click();
    }
    await page.locator('[data-book="eden"]').waitFor();
  }
  const locales = [
    "en-US",
    "en-GB",
    "es",
    "fr",
    "hi",
    "it",
    "ja",
    "pt-BR",
    "zh-CN",
  ];
  for (const locale of locales) {
    await page.locator("#language").click();
    await page.locator(`[data-locale="${locale}"]`).click();
    await page.waitForFunction(
      (id) => document.documentElement.lang === id,
      locale,
    );
    await page.locator("#enter").click();
    await page.locator('[data-book="eden"]').click();
    await page.waitForFunction(
      (id) =>
        window.libraryDebug().ready &&
        window.libraryDebug().state.language === id &&
        window.libraryDebug().state.page === 0,
      locale,
    );
    assert.ok((await page.locator(".story-text").innerText()).length > 50);
    await page.locator("#shelf").click();
    await page.locator('[data-book="eden"]').waitFor();
  }
  await context.close();
  return "Traversed all 16 legacy spreads and opened Eden spread 1 in every supported locale.";
});

await check(
  "visual composition: add, drag, resize, undo, pages, export and reader fidelity",
  async () => {
    const context = await makeContext();
    const page = await context.newPage();
    watchErrors(page);
    await enter(page);
    await page.locator("#author").click();
    await page.locator("#author-new").click();
    await page.locator("#new-book-title").fill("Jonah — composed on the book");
    await page
      .getByRole("button", { name: "Create book", exact: true })
      .click();
    await page.locator("#author-visual").waitFor();
    const state = () =>
      page.locator("#author-json").inputValue().then(JSON.parse);
    const ready = () =>
      page.locator(".scene-loading").waitFor({ state: "hidden" });
    const art = async (kind, id) => {
      await page.locator(`.studio-tools [data-studio="${kind}"]`).click();
      assert.equal(await page.locator('[data-art="jonah-cutout"]').count(), 0);
      const chooserPromise = page.waitForEvent("filechooser");
      await page.locator("#visual-image-upload").click();
      await (
        await chooserPromise
      ).setFiles(path.resolve(`public/assets/art/jonah/${id}.png`));
      await page.locator(".art-tray").waitFor({ state: "hidden" });
      await ready();
    };
    await page
      .getByLabel("Book title", { exact: true })
      .fill("Jonah — composed on the book");
    await art("background", "underwater-backdrop");
    await art("character", "jonah-cutout");
    const before = (await state()).spreads[0].elements[0].placement;
    await page.locator(".selection-frame").waitFor({ state: "visible" });
    const rect = await page.locator(".selection-frame").boundingBox();
    assert.ok(rect && rect.width > 20);
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      rect.x + rect.width / 2 - 55,
      rect.y + rect.height / 2 + 8,
      { steps: 8 },
    );
    await page.mouse.up();
    const moved = (await state()).spreads[0].elements[0].placement;
    assert.ok(moved.x < before.x - 0.3);
    await page.locator('[data-studio="undo"]').click();
    await ready();
    assert.equal((await state()).spreads[0].elements[0].placement.x, before.x);
    await page.locator('[data-studio="redo"]').click();
    await ready();
    assert.equal((await state()).spreads[0].elements[0].placement.x, moved.x);
    await page.locator('[data-select="character-1"]').click();
    await page.locator(".resize-art").waitFor({ state: "visible" });
    const handle = await page.locator(".resize-art").boundingBox();
    await page.mouse.move(
      handle.x + handle.width / 2,
      handle.y + handle.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      handle.x + handle.width / 2 + 16,
      handle.y + handle.height / 2 - 16,
      { steps: 6 },
    );
    await page.mouse.up();
    assert.ok(
      (await state()).spreads[0].elements[0].placement.height > moved.height,
    );
    await page.getByLabel("Rotation", { exact: true }).fill("18");
    await page.getByLabel("Rotation", { exact: true }).press("Tab");
    assert.equal((await state()).spreads[0].elements[0].placement.rotation, 18);
    await art("image", "whale-cutout");
    assert.equal((await state()).spreads[0].elements[1].kind, "prop");
    await art("ground", "sandy-ground");
    await page
      .getByLabel("Page title", { exact: true })
      .fill("Jonah in the deep");
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("Jonah prayed from the shelter of the great fish.");
    await page.locator('.studio-tools [data-studio="page"]').click();
    await ready();
    await art("background", "jonah-shore");
    await page
      .getByLabel("Page title", { exact: true })
      .fill("Back on the shore");
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("Jonah was ready to listen again.");
    await page.locator('[data-page="0"]').click();
    await ready();
    assert.equal(
      await page.getByLabel("Page title", { exact: true }).inputValue(),
      "Jonah in the deep",
    );
    assert.equal((await state()).spreads[0].elements.length, 2);
    // The export must contain the current visible draft, without a separate validate/apply step.
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#author-export").click();
    const download = await downloadPromise;
    const exported = path.join(output, "visual.book.json");
    await download.saveAs(exported);
    const saved = JSON.parse(fs.readFileSync(exported, "utf8"));
    assert.equal(saved.spreads[0].title, "Jonah in the deep");
    assert.ok(
      Object.values(saved.assets).every((asset) =>
        asset.src.startsWith("data:"),
      ),
    );
    const draft = await state();
    await page.locator('[data-studio="read"]').click();
    try {
      await page.waitForFunction(() => {
        const debug = window.libraryDebug();
        return (
          !document.querySelector("#author-dialog").open &&
          debug.scene?.authored &&
          debug.scene.popups.every(
            (angle) => Math.abs(angle - Math.PI / 2) < 0.01,
          )
        );
      });
    } catch (error) {
      throw Error(
        `${error.message}\n${JSON.stringify(await page.evaluate(() => ({ report: document.querySelector("#author-report").textContent, open: document.querySelector("#author-dialog").open, debug: window.libraryDebug() })))}`,
      );
    }
    const rendered = await page.evaluate(
      () => window.libraryDebug().scene.authored,
    );
    assert.equal(rendered.elements.length, 2);
    assert.equal(
      rendered.elements[0].position[0],
      draft.spreads[0].elements[0].placement.x,
    );
    assert.ok(
      Math.abs(rendered.elements[0].rotation - (18 * Math.PI) / 180) < 1e-6,
    );
    await page.locator("#author").click();
    await page
      .getByRole("button", {
        name: "Edit Jonah — composed on the book",
        exact: true,
      })
      .click();
    await page.locator('[data-page="1"]').click();
    await ready();
    await page.locator('[data-studio="read"]').click();
    await page.waitForFunction(
      () =>
        !document.querySelector("#author-dialog").open &&
        window.libraryDebug().state.page === 1 &&
        window.libraryDebug().scene?.authored,
    );
    await page.locator("#author").click();
    await page
      .getByRole("button", {
        name: "Edit Jonah — composed on the book",
        exact: true,
      })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await ready();
    assert.ok(
      await page.locator('.studio-tools [data-studio="character"]').isVisible(),
    );
    assert.ok(await page.locator(".studio-viewport canvas").isVisible());
    const overflow = await page
      .locator("#author-dialog")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 2);
    assert.equal(overflow, false);
    await context.close();
    return "Created two pages from a blank book with backgrounds, character, image and ground; direct drag/resize, slider, undo/redo, page switching, portable current-draft export, identical reader placement, selected-page reading and 390px layout passed.";
  },
);

await check(
  "Book library: new books, isolated art, page preview, autosave and restore",
  async () => {
    const context = await makeContext();
    const page = await context.newPage();
    watchErrors(page);
    await enter(page);
    await page.locator("#author").click();
    await page.locator('[data-edit-book="included-quiet-garden"]').waitFor();
    assert.equal(await page.locator("#author-visual").isVisible(), false);
    assert.equal(await page.locator("[data-edit-book]").count(), 2);
    await page.locator('[data-edit-book="included-quiet-garden"]').click();
    assert.equal(await page.locator("#author-export").isEnabled(), true);
    await page.locator('[data-studio="details"]').click();
    const original = await authorJson(page);
    const narration = original.spreads[0].segments[0].narration;
    const chooserPromise = page.waitForEvent("filechooser");
    await page
      .locator('[data-author-action="replace-narration"][data-index="0"]')
      .click();
    await (
      await chooserPromise
    ).setFiles(path.resolve("public", original.assets[narration.asset].src));
    await page
      .locator("#author-report")
      .filter({ hasText: "measured" })
      .waitFor();
    const replaced = (await authorJson(page)).spreads[0].segments[0].narration;
    assert.ok(Math.abs(replaced.duration - narration.duration) < 0.02);
    assert.ok(replaced.duration > 1);
    await page.locator('[data-author-tab="assets"]').click();
    await page
      .locator(
        `[data-author-action="remove-asset"][data-asset="${original.cover}"]`,
      )
      .click();
    await page
      .locator("#author-report")
      .filter({ hasText: "This asset is in use" })
      .waitFor();
    assert.ok((await authorJson(page)).assets[original.cover]);
    await page.locator('input[data-path="__new.id"]').fill(original.cover);
    await page
      .locator('input[data-path="__new.src"]')
      .fill("assets/art/unused.png");
    await page.locator('[data-author-action="add-asset-path"]').click();
    await page
      .locator("#author-report")
      .filter({ hasText: "already exists" })
      .waitFor();
    assert.deepEqual(
      (await authorJson(page)).assets[original.cover],
      original.assets[original.cover],
    );
    await page.locator("#author-books").click();

    const create = async (title) => {
      await page.locator("#author-new").click();
      await page.locator("#new-book-title").fill(title);
      await page
        .getByRole("button", { name: "Create book", exact: true })
        .click();
      await page.locator("#author-visual").waitFor();
      await page.locator(".scene-loading").waitFor({ state: "hidden" });
    };
    await create("A brand new story");
    const id = (await authorJson(page)).id;
    assert.equal(await page.locator("#author-export").isEnabled(), true);
    assert.equal((await authorJson(page)).spreads.length, 1);
    assert.doesNotMatch(JSON.stringify(await authorJson(page)), /jonah/i);
    assert.equal(
      await page.locator('[data-studio="previous-page"]').isDisabled(),
      true,
    );
    await page.locator('.studio-tools [data-studio="background"]').click();
    assert.equal(await page.locator("[data-art]").count(), 0);
    await page.locator(".art-empty").waitFor();
    await page.locator('[data-studio="close-tray"]').click();
    await page.getByLabel("Page title", { exact: true }).fill("First morning");
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("A new story begins here.");
    await page.locator('.studio-tools [data-studio="page"]').click();
    await page.getByLabel("Page title", { exact: true }).fill("Second morning");
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("The adventure continues.");
    await page.locator('[data-studio="preview"]').click();
    assert.equal(
      await page
        .getByLabel("Story line 1", { exact: true })
        .evaluate((el) => el.readOnly),
      true,
    );
    assert.equal(
      await page.locator('[data-studio="next-page"]').isDisabled(),
      true,
    );
    await page.locator('[data-studio="previous-page"]').click();
    assert.equal(
      await page.getByLabel("Story line 1", { exact: true }).inputValue(),
      "A new story begins here.",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Back to editing", exact: true })
        .isVisible(),
      true,
    );
    await page.locator('[data-studio="next-page"]').click();
    assert.equal(
      await page.getByLabel("Page title", { exact: true }).inputValue(),
      "Second morning",
    );
    await page.locator('[data-studio="preview"]').click();
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("The saved adventure continues.");
    await page.locator("#author-books").click();
    await page
      .getByRole("button", { name: "Edit A brand new story", exact: true })
      .waitFor();
    await page.reload();
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug()?.ready);
    await page.locator("#author").click();
    await page
      .getByRole("button", { name: "Edit A brand new story", exact: true })
      .click();
    assert.equal((await authorJson(page)).id, id);
    await page.locator('[data-studio="next-page"]').click();
    assert.equal(
      await page.getByLabel("Story line 1", { exact: true }).inputValue(),
      "The saved adventure continues.",
    );
    await page.locator("#author-books").click();
    await page
      .getByRole("button", { name: "Delete A brand new story", exact: true })
      .click();
    await page.getByText("Recently deleted (1)", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Edit A brand new story", exact: true })
        .count(),
      0,
    );
    await page.reload();
    await page.locator("#enter").click();
    await page.waitForFunction(() => window.libraryDebug()?.ready);
    await page.locator("#author").click();
    await page.getByText("Recently deleted (1)", { exact: true }).click();
    await page
      .getByRole("button", { name: "Restore book", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit A brand new story", exact: true })
      .waitFor();
    await create("Another original book");
    assert.notEqual((await authorJson(page)).id, id);
    assert.equal(await page.locator("#author-export").isEnabled(), true);
    assert.equal((await authorJson(page)).spreads.length, 1);
    assert.equal((await authorJson(page)).spreads[0].elements.length, 0);
    await page.locator('.studio-tools [data-studio="character"]').click();
    assert.equal(await page.locator("[data-art]").count(), 0);
    await page.locator('[data-studio="close-tray"]').click();
    await page.locator("#author-books").click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page
        .locator("#author-dialog")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 2),
      false,
    );
    await context.close();
    return "Library-first entry; neutral one-page books with unique IDs and empty art; editing and read-only sequential previews; browser refresh persistence; isolated second book; recoverable deletion across refresh; phone library layout.";
  },
);

results.passed =
  results.checks.every((item) => item.passed) &&
  results.pageErrors.length === 0;
fs.writeFileSync(summaryPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
if (!results.passed) process.exitCode = 1;
