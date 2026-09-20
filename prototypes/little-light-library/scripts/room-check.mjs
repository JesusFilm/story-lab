import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve("dist");
const prefix = "/acceptance/little-light-library/";
const output = path.resolve(".test-output/room");
const summaryPath = path.resolve("review/latest/room-results.json");
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
    "Playwright against a production build at a nested static URL, using an isolated browser context and browser-local IndexedDB.",
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
    const diagnostic = await page
      .evaluate(() => ({
        debug: window.libraryDebug?.(),
        bodyClasses: document.body.className,
        header: [...document.querySelectorAll("#header button")].map(
          (button) => ({
            id: button.id,
            label: button.textContent?.trim(),
            disabled: button.disabled,
          }),
        ),
        shelfTargets: [
          ...document.querySelectorAll("[data-shelf-key],[data-toy-id]"),
        ].map((button) => ({
          key: button.dataset.shelfKey ?? button.dataset.toyId,
          hidden: button.hidden,
          label: button.getAttribute("aria-label"),
          bounds: button.getBoundingClientRect().toJSON(),
        })),
      }))
      .catch(() => null);
    results.checks.push({
      name,
      passed: false,
      durationMs: Date.now() - started,
      detail: { error: error.stack || String(error), diagnostic },
    });
  }
};

const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  acceptDownloads: false,
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);
page.on("pageerror", (error) => results.pageErrors.push(error.message));

const debug = () => page.evaluate(() => window.libraryDebug());
const enter = async () => {
  await page.goto(url);
  await page.locator("#enter").click();
  await page.waitForFunction(() => window.libraryDebug?.().ready);
  await page.waitForFunction(
    () =>
      window.libraryDebug?.().shelf.books.length >= 2 &&
      window.libraryDebug?.().shelf.busy === false,
  );
};
const waitShelf = async (predicate, argument) =>
  page.waitForFunction(predicate, argument, { timeout: 30_000 });
const selectBook = async (key) => {
  await page.locator(`[data-shelf-key="${key}"]`).click();
  await waitShelf(
    (selected) =>
      window.libraryDebug?.().shelf.inspected === selected &&
      window.libraryDebug?.().shelf.busy === false,
    key,
  );
};
const readSelected = async (key) => {
  await page.locator("#shelf-read").click();
  await waitShelf((selected) => {
    const state = window.libraryDebug?.();
    return (
      state?.shelf.table === selected &&
      state.shelf.browsing === false &&
      state.shelf.busy === false &&
      state.scene?.tableShelfKey === selected
    );
  }, key);
};
const assertTablePose = (state) => {
  const close = (actual, expected, label) =>
    assert.ok(
      Math.abs(actual - expected) < 1e-6,
      `${label}: expected ${expected}, received ${actual}`,
    );
  const pose = state.scene.bookTransform;
  [0, 1.495, 1.1].forEach((value, index) =>
    close(pose.position[index], value, `table position ${index}`),
  );
  [-Math.PI / 2, 0, 0].forEach((value, index) =>
    close(pose.rotation[index], value, `table rotation ${index}`),
  );
  [1, 1, 1].forEach((value, index) =>
    close(pose.scale[index], value, `table scale ${index}`),
  );
  close(state.scene.hinge, 0, "open table-book hinge");
};
const waitForOpenTablePose = () =>
  page.waitForFunction(
    () => {
      const scene = window.libraryDebug?.().scene;
      return (
        scene?.mode === "spread" &&
        Math.abs(scene.hinge) < 1e-6 &&
        Math.abs(scene.bookTransform.rotation[0] + Math.PI / 2) < 1e-6 &&
        Math.abs(scene.bookTransform.rotation[1]) < 1e-6 &&
        Math.abs(scene.bookTransform.rotation[2]) < 1e-6
      );
    },
    undefined,
    { timeout: 15_000 },
  );
const waitForClosedBrowsingTable = () =>
  page.waitForFunction(
    () => {
      const state = window.libraryDebug?.();
      return (
        state?.shelf.browsing === true &&
        state.shelf.busy === false &&
        state.scene.shelfBrowsingTable === true &&
        state.scene.shelfCoverMoving === false &&
        Math.abs(state.scene.hinge - Math.PI) < 1e-6 &&
        state.scene.stageVisible === false &&
        state.scene.camera.every(
          (value, index) =>
            Math.abs(value - state.scene.cameraGoal[index]) < 0.02,
        ) &&
        state.scene.look.every(
          (value, index) =>
            Math.abs(value - state.scene.lookGoal[index]) < 0.02,
        )
      );
    },
    undefined,
    { timeout: 15_000 },
  );
const assertToyTargetsInView = async () => {
  const framing = await page.evaluate(() => {
    const headerBottom = document
      .querySelector("#header")
      .getBoundingClientRect().bottom;
    return [...document.querySelectorAll("[data-toy-id]:not([hidden])")].map(
      (target) => {
        const bounds = target.getBoundingClientRect();
        return {
          id: target.dataset.toyId,
          top: bounds.top,
          bottom: bounds.bottom,
          headerBottom,
          viewportHeight: window.innerHeight,
        };
      },
    );
  });
  assert.ok(framing.length > 0, "expected visible shelf toy targets");
  framing.forEach(({ id, top, bottom, headerBottom, viewportHeight }) => {
    assert.ok(top >= headerBottom, `${id} is obscured by the header`);
    assert.ok(bottom <= viewportHeight, `${id} extends below the viewport`);
  });
};

await check(
  "Physical shelf selection, reading, returning and toy lifecycle",
  async () => {
    await enter();
    let state = await debug();
    assert.equal(state.shelf.browsing, true);
    assert.equal(state.shelf.table, null);
    assert.equal(state.shelf.inspected, null);
    assert.deepEqual(
      state.shelf.books.map(({ key }) => key),
      ["builtin:eden", "builtin:noah"],
    );
    assert.equal(
      await page.locator(".book-choices,.room-footer,#story-choices").count(),
      0,
      "legacy room overlays must not return",
    );

    await selectBook("builtin:eden");
    await page.locator("#shelf-read").waitFor({ state: "visible" });
    await page.locator("#shelf-return").waitFor({ state: "visible" });
    assert.equal((await debug()).scene.shelf.previewKey, "builtin:eden");
    await page.locator("#shelf-return").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.inspected === null &&
        window.libraryDebug?.().shelf.busy === false,
    );
    state = await debug();
    assert.equal(state.shelf.table, null);
    assert.equal(state.scene.shelf.previewKey, null);

    await selectBook("builtin:eden");
    await readSelected("builtin:eden");
    state = await debug();
    assert.equal(state.state.book, "eden");
    assert.deepEqual(
      state.shelf.toys.map(({ id }) => id),
      ["adam", "eve", "garden-tree"],
    );
    assert.deepEqual(
      state.scene.shelfToys.map(({ id }) => id),
      ["adam", "eve", "garden-tree"],
    );

    await page.evaluate(() => {
      document.querySelector("#next")?.click();
      document.querySelector("#shelf")?.click();
    });
    await waitShelf(
      () =>
        window.libraryDebug?.().state.page === 1 &&
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await waitForClosedBrowsingTable();
    state = await debug();
    assert.equal(state.state.book, "eden");
    assert.equal(state.state.page, 1);
    assert.equal(state.shelf.table, "builtin:eden");
    assert.equal(state.shelf.toys.length, 3);
    assert.equal(state.scene.stageVisible, false);
    assert.equal(state.scene.shelfBrowsingTable, true);
    await page.screenshot({ path: path.join(output, "room-browsing.png") });

    const pausedPosition = state.position;
    assert.equal(state.playing, false);
    await page.waitForTimeout(150);
    assert.ok(Math.abs((await debug()).position - pausedPosition) < 0.01);
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === false &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await waitForOpenTablePose();
    state = await debug();
    assert.equal(state.state.page, 1);
    assert.equal(state.playing, false);
    assert.ok(Math.abs(state.position - pausedPosition) < 0.01);
    await page.locator("#shelf").click();
    await waitForClosedBrowsingTable();
    state = await debug();

    const englishToyLabels = state.shelf.toys.map(({ label }) => label);
    await page.locator("#language").click();
    await page.locator('[data-locale="es"]').click();
    await waitShelf(
      () =>
        window.libraryDebug?.().state.language === "es" &&
        window.libraryDebug?.().state.page === 1 &&
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false &&
        window.libraryDebug?.().scene.mode === "room",
    );
    await page.locator("#enter").click();
    state = await debug();
    assert.notDeepEqual(
      state.shelf.toys.map(({ label }) => label),
      englishToyLabels,
      "browsing language change should refresh toy labels",
    );
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === false &&
        window.libraryDebug?.().shelf.busy === false &&
        window.libraryDebug?.().state.language === "es" &&
        window.libraryDebug?.().state.page === 1 &&
        window.libraryDebug?.().scene.mode === "spread",
    );
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );

    await selectBook("builtin:noah");
    await page.locator("#shelf-return").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.inspected === null &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await waitForClosedBrowsingTable();
    state = await debug();
    assert.equal(state.shelf.table, "builtin:eden");
    assert.equal(state.state.book, "eden");
    assert.equal(state.state.page, 1);
    assert.deepEqual(
      state.shelf.toys.map(({ id }) => id),
      ["adam", "eve", "garden-tree"],
    );

    await selectBook("builtin:noah");
    await readSelected("builtin:noah");
    await waitForOpenTablePose();
    state = await debug();
    assertTablePose(state);
    assert.equal(state.state.book, "noah");
    assert.equal(state.state.page, 0);
    assert.deepEqual(
      state.shelf.toys.map(({ id }) => id),
      ["noah", "ark", "dove"],
    );
    assert.equal(
      state.scene.shelf.books.find(({ key }) => key === "builtin:eden").state,
      "shelf",
    );
    assert.equal(
      state.scene.shelf.books.find(({ key }) => key === "builtin:noah").state,
      "table",
    );
    await page.screenshot({
      path: path.join(output, "second-book-desktop.png"),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, "second-book-phone.png") });
    await page.setViewportSize({ width: 1366, height: 768 });

    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await selectBook("builtin:eden");
    await readSelected("builtin:eden");
    await waitForOpenTablePose();
    state = await debug();
    assertTablePose(state);
    assert.equal(state.state.book, "eden");
    assert.equal(state.scene.shelf.tableKey, "builtin:eden");
    return {
      table: state.shelf.table,
      page: state.state.page,
      toys: state.shelf.toys.map(({ id }) => id),
    };
  },
);

await check("Busy lock rejects rapid shelf taps", async () => {
  await enter();
  await page.evaluate(() => {
    document.querySelector('[data-shelf-key="builtin:eden"]')?.click();
    document.querySelector('[data-shelf-key="builtin:noah"]')?.click();
  });
  await page.waitForFunction(() => window.libraryDebug?.().shelf.busy === true);
  assert.equal(await page.locator("#author").isDisabled(), true);
  await waitShelf(() => window.libraryDebug?.().shelf.busy === false);
  const state = await debug();
  assert.equal(state.shelf.inspected, "builtin:eden");
  assert.equal(state.scene.shelf.previewKey, "builtin:eden");
  await page.locator("#shelf-return").click();
  await waitShelf(() => window.libraryDebug?.().shelf.busy === false);
  return { inspected: state.shelf.inspected, headerLocked: true };
});

await check(
  "Reduced motion and narrow room controls remain usable",
  async () => {
    await enter();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await selectBook("builtin:eden");
    const controls = page.locator(".shelf-preview");
    await controls.waitFor({ state: "visible" });
    const bounds = await controls.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390.5);
    assert.equal(await page.locator("#shelf-read").isVisible(), true);
    assert.equal(await page.locator("#shelf-return").isVisible(), true);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 2,
      ),
      true,
    );
    assert.equal((await debug()).scene.shelf.moving, false);
    await page.screenshot({ path: path.join(output, "room-phone.png") });
    await page.locator("#shelf-return").click();
    await waitShelf(() => window.libraryDebug?.().shelf.busy === false);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    return { width: 390, controlsVisible: true, horizontalOverflow: false };
  },
);

await check(
  "Authored toy installs on the room shelf and persists across reload",
  async () => {
    await enter();
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
    await page.locator('[data-author-tab="book"]').click();
    await page.locator("[data-toy-add]").click();
    await page
      .locator('[data-toy-index="0"][data-toy-field="id"]')
      .fill("little-tree");
    await page
      .locator('[data-toy-index="0"][data-toy-field="id"]')
      .dispatchEvent("change");
    await page
      .locator('[data-toy-index="0"][data-toy-field="label"]')
      .fill("Little tree");
    await page
      .locator('[data-toy-index="0"][data-toy-field="label"]')
      .dispatchEvent("change");
    await page
      .locator('[data-toy-index="0"][data-toy-field="asset"]')
      .selectOption("tree-cutout");
    await page
      .locator('[data-toy-index="0"][data-toy-field="animation"]')
      .selectOption("pulse");
    await page
      .locator('[data-toy-index="0"][data-toy-field="sound"]')
      .selectOption("narration-garden-1");
    await page.locator("#author-books").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#author-dialog")
        ?.classList.contains("library-mode"),
    );
    await page.locator('[data-room-add="included-quiet-garden"]').click();
    await page
      .locator('[data-room-remove="included-quiet-garden"]')
      .waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("#author-close").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#author-dialog")?.open === false &&
        window.libraryDebug?.().shelf.busy === false &&
        window
          .libraryDebug?.()
          .shelf.books.some(({ key }) => key === "included-quiet-garden"),
    );

    await selectBook("included-quiet-garden");
    await readSelected("included-quiet-garden");
    let state = await debug();
    assert.deepEqual(state.shelf.toys, [
      { id: "little-tree", label: "Little tree" },
    ]);
    assert.equal(state.scene.shelfToys[0].id, "little-tree");
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await page.locator('[data-toy-id="little-tree"]').click();
    await page.waitForFunction(
      () => window.libraryDebug?.().shelf.toyAudioPlaying === true,
    );

    await page.reload();
    await page.locator("#enter").click();
    await page.waitForFunction(
      () =>
        window.libraryDebug?.().ready &&
        window
          .libraryDebug?.()
          .shelf.books.some(({ key }) => key === "included-quiet-garden"),
    );
    state = await debug();
    assert.deepEqual(
      state.shelf.books.map(({ key }) => key),
      ["builtin:eden", "builtin:noah", "included-quiet-garden"],
    );
    await selectBook("included-quiet-garden");
    await readSelected("included-quiet-garden");
    state = await debug();
    assert.deepEqual(state.shelf.toys, [
      { id: "little-tree", label: "Little tree" },
    ]);
    await page.screenshot({ path: path.join(output, "authored-room.png") });
    return {
      lineup: state.shelf.books.map(({ key }) => key),
      authoredToy: state.shelf.toys[0],
      persisted: true,
    };
  },
);

await check(
  "Thirty spine-out books and top toys fit at desktop and phone sizes",
  async () => {
    await page.evaluate(async () => {
      const book = await fetch("./books/quiet-garden.book.json").then(
        (response) => response.json(),
      );
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open("little-light-author-books", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(
          ["books", "settings"],
          "readwrite",
        );
        const books = transaction.objectStore("books");
        const keys = ["builtin:eden", "builtin:noah"];
        for (let index = 0; index < 28; index++) {
          const key = `dense-${String(index + 1).padStart(2, "0")}`;
          keys.push(key);
          books.put({
            key,
            updatedAt: Date.now() + index,
            book: {
              ...structuredClone(book),
              id: `dense-book-${index + 1}`,
              title: `Garden volume ${index + 1}`,
            },
          });
        }
        transaction.objectStore("settings").put(keys, "room-shelf-v1");
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () =>
          reject(transaction.error);
      });
      database.close();
    });

    await enter();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.books.length === 30 &&
        window.libraryDebug?.().scene.shelf.books.length === 30,
    );
    let state = await debug();
    assert.equal(state.scene.shelf.max, 30);
    assert.equal(state.scene.shelf.endStops.length, 0);
    assert.equal(await page.locator("[data-shelf-key]:visible").count(), 30);
    state.scene.shelf.books.forEach(({ rotation }, index) => {
      assert.ok(Math.abs(rotation[0]) < 1e-6, `book ${index} rotation x`);
      assert.ok(
        Math.abs(rotation[1] - Math.PI / 2) < 1e-6,
        `book ${index} spine yaw`,
      );
      assert.ok(Math.abs(rotation[2]) < 1e-6, `book ${index} rotation z`);
    });
    assert.deepEqual(
      [...new Set(state.scene.shelf.books.map(({ position }) => position[1]))],
      [3.7, 1.98],
    );
    for (const key of [
      "builtin:eden",
      "builtin:noah",
      "dense-13",
      "dense-14",
      "dense-15",
      "dense-28",
    ]) {
      await selectBook(key);
      assert.equal((await debug()).shelf.inspected, key);
      await page.locator("#shelf-return").click();
      await waitShelf(
        () =>
          window.libraryDebug?.().shelf.inspected === null &&
          window.libraryDebug?.().shelf.busy === false,
      );
    }
    await page.screenshot({ path: path.join(output, "dense-30-desktop.png") });

    await selectBook("builtin:eden");
    await readSelected("builtin:eden");
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await waitForClosedBrowsingTable();
    state = await debug();
    assert.deepEqual(
      state.scene.shelfToys.map(({ id }) => id),
      ["adam", "eve", "garden-tree"],
    );
    assert.ok(
      state.scene.shelfToys.every(({ position }) => position[1] === 4.78),
    );
    await assertToyTargetsInView();
    await page.screenshot({
      path: path.join(output, "dense-toys-desktop.png"),
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await enter();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.books.length === 30 &&
        window.libraryDebug?.().scene.shelf.books.length === 30,
    );
    assert.equal(await page.locator("[data-shelf-key]:visible").count(), 30);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 2,
      ),
      true,
    );
    await page.screenshot({ path: path.join(output, "dense-30-phone.png") });
    await selectBook("builtin:eden");
    await readSelected("builtin:eden");
    await page.locator("#shelf").click();
    await waitShelf(
      () =>
        window.libraryDebug?.().shelf.browsing === true &&
        window.libraryDebug?.().shelf.busy === false,
    );
    await waitForClosedBrowsingTable();
    await assertToyTargetsInView();
    await page.screenshot({ path: path.join(output, "dense-toys-phone.png") });
    await page.setViewportSize({ width: 1366, height: 768 });
    return { books: 30, rows: 2, toys: 3, desktopAndPhone: true };
  },
);

await context.close();
await browser.close();
await new Promise((resolve) => server.close(resolve));
results.passed =
  results.checks.every(({ passed }) => passed) && !results.pageErrors.length;
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
if (!results.passed) process.exitCode = 1;
