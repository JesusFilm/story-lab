import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("dist");
const prefix = "/acceptance/little-light-library/";
const output = path.resolve(".test-output/production");
const summaryPath = path.resolve("review/latest/production-results.json");
const wav = fs.readFileSync(
  path.resolve("public/assets/audio/ja/names/noah-c4df2a798d302e8dfd35.wav"),
);
const voices = [
  "af_heart",
  "bf_emma",
  "ef_dora",
  "ff_siwis",
  "hf_alpha",
  "if_sara",
  "jf_alpha",
  "pf_dora",
  "zf_xiaobei",
];
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
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
  const requestUrl = new URL(request.url, "http://localhost");
  if (!requestUrl.pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const file = path.resolve(
    root,
    decodeURIComponent(requestUrl.pathname.slice(prefix.length)) ||
      "index.html",
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
    "Playwright against a production build at a nested static URL, with isolated browser storage and deterministic OpenRouter/Kokoro route mocks.",
  browser: browser.version(),
  host: { platform: os.platform(), arch: os.arch() },
  urlPath: prefix,
  checks: [],
  pageErrors: [],
};

const check = async (name, run) => {
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

const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", (error) => results.pageErrors.push(error.message));

let wrongTranslation = false;
let interruptSynthesis = false;
let syntheses = 0;
let releaseSynthesis;
const translationRequests = [];
const synthesisRequests = [];

await page.route(
  "https://openrouter.ai/api/v1/chat/completions",
  async (route) => {
    const body = route.request().postDataJSON();
    const system = String(body.messages?.[0]?.content ?? "");
    const locale = / into ([^.]+)\./.exec(system)?.[1] ?? "unknown";
    const texts = JSON.parse(body.messages?.[1]?.content ?? "{}").texts ?? [];
    translationRequests.push({
      locale,
      authorization: route.request().headers().authorization,
      count: texts.length,
    });
    const translated = texts.map((text) => `[${locale}] ${text}`);
    if (wrongTranslation) translated.pop();
    await new Promise((resolve) => setTimeout(resolve, 40));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify({ texts: translated }) },
          },
        ],
      }),
    });
  },
);
await page.route("**/api/kokoro/voices", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 40));
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ voices }),
  });
});
await page.route("**/api/kokoro/synthesize", async (route) => {
  const body = route.request().postDataJSON();
  synthesisRequests.push(body);
  syntheses++;
  if (interruptSynthesis && syntheses === 2)
    await new Promise((resolve) => {
      releaseSynthesis = resolve;
    });
  try {
    await route.fulfill({ status: 200, contentType: "audio/wav", body: wav });
  } catch {
    // An intentionally aborted generation request can close before fulfillment.
  }
});

const authorJson = async () =>
  JSON.parse(await page.locator("#author-json").inputValue());
const status = () => page.locator(".production-status");
const waitForJob = async () => {
  await page.locator(".production-cancel").waitFor({ state: "visible" });
  await page.locator(".production-cancel").waitFor({
    state: "hidden",
    timeout: 120_000,
  });
};
const openQuietGarden = async () => {
  await page.goto(url);
  await page.locator("#enter").click();
  await page.waitForFunction(() => window.libraryDebug?.().ready);
  await page.locator("#author").click();
  await page.waitForFunction(
    () => document.querySelector("#author-dialog")?.open === true,
  );
  await page.locator('[data-edit-book="included-quiet-garden"]').click();
  await page.waitForFunction(() =>
    document
      .querySelector("#author-dialog")
      ?.classList.contains("book-editing"),
  );
  await page.locator('[data-studio="details"]').click();
  await page.locator('[data-author-tab="production"]').click();
  await page.locator("#author-production").waitFor({ state: "visible" });
};

let exportedPath;
await check(
  "Production translation, narration, soundtrack, playback, review and portable round trip",
  async () => {
    await openQuietGarden();

    await page.locator('[data-production-tab="languages"]').click();
    await page.locator('[data-production-action="all-languages"]').click();
    assert.equal(await page.locator("[data-book-language]:checked").count(), 9);
    await page.locator(".openrouter-key").fill("browser-only-secret");
    await page.locator('[data-production-action="translate-all"]').click();
    await waitForJob();
    assert.equal(translationRequests.length, 8);
    assert.deepEqual(
      new Set(translationRequests.map((request) => request.locale)),
      new Set(["en-GB", "es", "fr", "hi", "it", "ja", "pt-BR", "zh-CN"]),
    );
    assert.ok(
      translationRequests.every(
        (request) =>
          request.authorization === "Bearer browser-only-secret" &&
          request.count > 0,
      ),
    );
    let draft = await authorJson();
    assert.equal(Object.keys(draft.translations).length, 8);
    assert.doesNotMatch(JSON.stringify(draft), /browser-only-secret/);

    await page.locator(".production-locale").selectOption("en-GB");
    const priorTranslation = structuredClone(
      (await authorJson()).translations["en-GB"],
    );
    wrongTranslation = true;
    await page.locator('[data-production-action="translate-one"]').click();
    await waitForJob();
    await status().filter({ hasText: "No text was changed" }).waitFor();
    assert.deepEqual(
      (await authorJson()).translations["en-GB"],
      priorTranslation,
    );
    wrongTranslation = false;

    await page.locator('[data-production-action="connect-kokoro"]').click();
    await waitForJob();
    assert.match(await page.locator(".kokoro-voice").inputValue(), /^b/);
    await page.locator(".production-locale").selectOption("en-US");
    interruptSynthesis = true;
    syntheses = 0;
    await page.locator('[data-production-action="voices-all"]').click();
    await status()
      .filter({ hasText: "phrase 2/2" })
      .waitFor({ timeout: 30_000 });
    assert.equal(
      Object.keys((await authorJson()).assets).filter((id) =>
        id.startsWith("voice-"),
      ).length,
      1,
    );
    await page.locator(".production-cancel").click();
    releaseSynthesis?.();
    await page.locator(".production-cancel").waitFor({ state: "hidden" });
    await status().filter({ hasText: "cancelled" }).waitFor();
    const interrupted = await authorJson();
    assert.match(
      interrupted.spreads[0].segments[0].narration.voice,
      /^Kokoro /,
    );
    assert.doesNotMatch(
      interrupted.spreads[0].segments[1].narration.voice,
      /^Kokoro /,
    );

    interruptSynthesis = false;
    syntheses = 0;
    await page.locator('[data-production-action="voices-all"]').click();
    await waitForJob();
    draft = await authorJson();
    const localizedPages = [draft.spreads].concat(
      Object.values(draft.translations).map(
        (translation) => translation.spreads,
      ),
    );
    assert.equal(localizedPages.length, 9);
    for (const pages of localizedPages)
      for (const producedPage of pages)
        for (const segment of producedPage.segments) {
          assert.equal(segment.narration.recordedText, segment.text);
          assert.match(segment.narration.voice, /^Kokoro /);
          assert.ok(segment.narration.duration >= 0.05);
        }
    assert.equal(synthesisRequests.length >= 36, true);

    await page.locator('[data-production-tab="soundtrack"]').click();
    await page.locator('[data-production-action="add-track"]').click();
    await page.locator('[data-production-action="add-track"]').click();
    await page
      .locator('[data-track="0"][data-track-field="label"]')
      .fill("Garden bed");
    await page
      .locator('[data-track="0"][data-track-field="label"]')
      .press("Tab");
    await page
      .locator('[data-track="0"][data-track-field="volume"]')
      .fill("0.2");
    await page
      .locator('[data-track="0"][data-track-field="volume"]')
      .press("Tab");
    await page
      .locator('[data-track="0"][data-track-field="fadeIn"]')
      .fill("0.3");
    await page
      .locator('[data-track="0"][data-track-field="fadeIn"]')
      .press("Tab");
    await page
      .locator('[data-track="0"][data-track-field="fadeOut"]')
      .fill("0.4");
    await page
      .locator('[data-track="0"][data-track-field="fadeOut"]')
      .press("Tab");
    await page.locator('[data-track="0"][data-track-field="loop"]').check();
    await page
      .locator('[data-track="1"][data-track-field="label"]')
      .fill("Bird layer");
    await page
      .locator('[data-track="1"][data-track-field="label"]')
      .press("Tab");
    await page
      .locator('[data-track="1"][data-track-field="volume"]')
      .fill("0.55");
    await page
      .locator('[data-track="1"][data-track-field="volume"]')
      .press("Tab");
    draft = await authorJson();
    assert.equal(draft.soundtracks.length, 2);
    assert.deepEqual(
      draft.soundtracks.map(({ label, volume, fadeIn, fadeOut, loop }) => ({
        label,
        volume,
        fadeIn,
        fadeOut,
        loop,
      })),
      [
        {
          label: "Garden bed",
          volume: 0.2,
          fadeIn: 0.3,
          fadeOut: 0.4,
          loop: true,
        },
        {
          label: "Bird layer",
          volume: 0.55,
          fadeIn: 1,
          fadeOut: 1,
          loop: false,
        },
      ],
    );

    await page.locator(".production-locale").selectOption("en-GB");
    await page.locator(".production-load").click();
    await page.locator(".production-play").waitFor({ state: "visible" });
    await assert.doesNotReject(async () =>
      page.locator(".production-play").click(),
    );
    await page.waitForFunction(
      () =>
        Number(document.querySelector(".production-scrubber input")?.value) > 0,
    );
    await page.locator(".production-play").click();
    await page
      .getByLabel("Book timeline position")
      .fill(String(draft.spreads[0].seconds ?? 8));
    await page
      .locator(".production-reading h3")
      .filter({ hasText: "2." })
      .waitFor();
    await page.locator(".production-locale").selectOption("fr");
    await page.locator(".production-load").click();
    await page
      .locator('.production-reading[lang="fr"] h3')
      .filter({ hasText: "[fr]" })
      .waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page
        .locator("#author-dialog")
        .evaluate((element) => element.scrollWidth > element.clientWidth + 2),
      false,
    );
    await page.screenshot({ path: path.join(output, "production-phone.png") });
    await page.setViewportSize({ width: 1366, height: 768 });

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#author-export").click();
    const download = await downloadPromise;
    exportedPath = path.join(output, "production.book.json");
    await download.saveAs(exportedPath);
    const exported = JSON.parse(fs.readFileSync(exportedPath, "utf8"));
    assert.doesNotMatch(JSON.stringify(exported), /browser-only-secret/);
    assert.equal(Object.keys(exported.translations).length, 8);
    assert.equal(exported.soundtracks.length, 2);

    await page.locator("#author-books").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#author-dialog")
        ?.classList.contains("library-mode"),
    );
    await page.waitForFunction(
      () => !document.querySelector("#author-new")?.hasAttribute("disabled"),
    );
    await page.locator("#author-file").setInputFiles(exportedPath);
    try {
      await page.waitForFunction(
        () =>
          document
            .querySelector("#author-dialog")
            ?.classList.contains("book-editing"),
        null,
        { timeout: 30_000 },
      );
    } catch (error) {
      throw Error(
        `Portable import did not open: ${await page.locator("#author-report").innerText()} (${await page.locator("#author-save-status").innerText()})`,
        { cause: error },
      );
    }
    await page.locator('[data-studio="details"]').click();
    const imported = await authorJson();
    assert.deepEqual(imported.translations, exported.translations);
    assert.deepEqual(imported.soundtracks, exported.soundtracks);
    assert.doesNotMatch(JSON.stringify(imported), /browser-only-secret/);

    await page.locator('[data-author-tab="production"]').click();
    await page.locator('[data-production-tab="languages"]').click();
    for (const locale of [
      "en-GB",
      "es",
      "fr",
      "hi",
      "it",
      "ja",
      "pt-BR",
      "zh-CN",
    ])
      await page.locator(`[data-book-language="${locale}"]`).uncheck();
    assert.deepEqual((await authorJson()).languages, ["en-US"]);
    await page.locator('[data-production-tab="review"]').click();
    const originalLine = imported.spreads[0].segments[0].text;
    await page
      .locator('[data-review-preview="0"][data-review-locale="en-US"]')
      .click();
    await page
      .locator('[data-review-mark="0"][data-review-locale="en-US"]')
      .waitFor({ state: "visible" });
    await page.waitForFunction(
      () =>
        !document
          .querySelector('[data-review-mark="0"][data-review-locale="en-US"]')
          ?.hasAttribute("disabled"),
    );
    await page
      .locator('[data-review-mark="0"][data-review-locale="en-US"]')
      .click();
    assert.match(
      await page
        .locator('[data-review-preview="0"][data-review-locale="en-US"]')
        .innerText(),
      /^✓/,
    );
    await page.locator('[data-author-tab="visual"]').click();
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("The garden changed after review.");
    await page.locator('[data-studio="details"]').click();
    await page.locator('[data-author-tab="production"]').click();
    await page.locator('[data-production-tab="review"]').click();
    assert.doesNotMatch(
      await page
        .locator('[data-review-preview="0"][data-review-locale="en-US"]')
        .innerText(),
      /^✓/,
    );
    await page.locator('[data-author-tab="visual"]').click();
    await page.getByLabel("Story line 1", { exact: true }).fill(originalLine);
    await page.locator('[data-studio="details"]').click();
    await page.locator('[data-author-tab="production"]').click();
    await page.locator('[data-production-tab="review"]').click();
    await page
      .locator('[data-review-preview="1"][data-review-locale="en-US"]')
      .click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector('[data-review-mark="1"][data-review-locale="en-US"]')
          ?.hasAttribute("disabled"),
    );
    await page
      .locator('[data-review-mark="1"][data-review-locale="en-US"]')
      .click();
    assert.equal((await authorJson()).reviews.length, 2);

    const reviewedDownloadPromise = page.waitForEvent("download");
    await page.locator('[data-production-action="export-reviewed"]').click();
    const reviewedDownload = await reviewedDownloadPromise;
    const reviewedPath = path.join(output, "production.reviewed.book.json");
    await reviewedDownload.saveAs(reviewedPath);
    const reviewed = JSON.parse(fs.readFileSync(reviewedPath, "utf8"));
    assert.equal(reviewed.reviews.length, 2);
    assert.deepEqual(reviewed.languages, ["en-US"]);

    await page.locator("#author-books").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("#author-dialog")
          ?.classList.contains("library-mode") &&
        !document.querySelector("#author-new")?.hasAttribute("disabled"),
    );
    await page.locator("#author-file").setInputFiles(reviewedPath);
    await page.waitForFunction(() =>
      document
        .querySelector("#author-dialog")
        ?.classList.contains("book-editing"),
    );
    await page.locator('[data-studio="details"]').click();
    assert.deepEqual((await authorJson()).reviews, reviewed.reviews);

    await page.locator("#author-preview").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#author-dialog")?.open === false &&
        window.libraryDebug?.().ready,
    );
    assert.equal(await page.locator(".reader").getAttribute("lang"), "en-US");
    await page.locator("#play").click();
    await page.waitForFunction(() => window.libraryDebug?.().playing === true);
    const currentPlayback = await page.evaluate(() => window.libraryDebug());
    assert.equal(currentPlayback.state.book, "quiet-garden");
    assert.ok(currentPlayback.segment >= 0);
    await page.locator("#play").click();

    await page.locator("#author").click();
    await page.waitForFunction(
      () => document.querySelector("#author-dialog")?.open === true,
    );
    await page.locator("[data-edit-book]").first().click();
    await page.waitForFunction(() =>
      document
        .querySelector("#author-dialog")
        ?.classList.contains("book-editing"),
    );
    await page
      .getByLabel("Story line 1", { exact: true })
      .fill("This narration is deliberately stale.");
    await page.locator('[data-studio="details"]').click();
    await page.locator("#author-preview").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#author-dialog")?.open === false &&
        window.libraryDebug?.().ready,
    );
    await page.locator("#play").click();
    await page.waitForFunction(() => window.libraryDebug?.().playing === true);
    await page.waitForTimeout(350);
    const stalePlayback = await page.evaluate(() => window.libraryDebug());
    assert.equal(stalePlayback.segment, -1);
    assert.equal(
      await page.locator(".story-text [data-segment].active").count(),
      0,
    );
    assert.equal(
      stalePlayback.scene.authored.elements.find(({ id }) => id === "adam")
        .rocking,
      0,
    );

    await page.waitForFunction(async () => {
      const request = indexedDB.open("little-light-author-books", 1);
      const db = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const transaction = db.transaction("books", "readonly");
      const all = transaction.objectStore("books").getAll();
      const entries = await new Promise((resolve, reject) => {
        all.onsuccess = () => resolve(all.result);
        all.onerror = () => reject(all.error);
      });
      db.close();
      return !JSON.stringify(entries).includes("browser-only-secret");
    });

    return "All nine languages translated without persisting the API key; wrong-cardinality translation was transactional; interrupted narration retained one completed phrase and resumed to 36 current localized cues; two soundtrack layers, preview play/page seek/language switch, phone layout, portable draft and reviewed export/import, reader playback, review invalidation, and soundtrack-only stale narration behavior passed.";
  },
);

results.passed =
  results.checks.every((item) => item.passed) &&
  results.pageErrors.length === 0;
fs.writeFileSync(summaryPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
await context.close();
await browser.close();
server.close();
if (!results.passed) process.exitCode = 1;
