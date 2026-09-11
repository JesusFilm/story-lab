// Optional browser test dependency: install Playwright, or set PLAYWRIGHT_MODULE.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_PATH,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8768/prototypes/story-diorama-lab/");
await page.locator("#loading").waitFor({ state: "hidden" });
await page.screenshot({ path: "/tmp/story-lab-desktop.png", fullPage: true });
console.log("loaded", await page.title());
await page.locator("#start-manual").click();
await page.locator("#next").click();
await page.waitForTimeout(300);
console.log(
  "manual reveal",
  await page.locator("#status").innerText(),
  await page.locator(".sd-text").innerText(),
);
await page.locator("#pause").click();
const before = await page.locator("#status").innerText();
await page.waitForTimeout(500);
if ((await page.locator("#status").innerText()) !== before)
  throw Error("Pause moved");
await page.locator("#pause").click();
await page.locator("#next").click();
await page.waitForTimeout(900);
console.log("next cue", await page.locator("#status").innerText());
await page.getByRole("button", { name: "Jump to The deep" }).click();
await page.waitForTimeout(2200);
await page.locator("#next").click();
await page.locator("#pause").click();
await page.screenshot({ path: "/tmp/story-lab-flood.png", fullPage: true });
await page.getByText("Soundtrack timing & playback", { exact: true }).click();
await page.locator("#reveal").selectOption("instant");
await page.locator("#hold").fill("0.5");
await page.locator("#fade").fill("0.1");
await page.locator("#music-mode").selectOption("none");
await page.locator("#apply").click();
await page.waitForFunction(
  () =>
    document.querySelector("#status").textContent.includes("Story complete"),
  {},
  { timeout: 15000 },
);
console.log("auto completed");
await page.locator("#loop").check();
await page.locator("#apply").click();
await page.waitForTimeout(5500);
console.log("loop remains running", await page.locator("#status").innerText());
if ((await page.locator("#status").innerText()).includes("complete"))
  throw Error("Loop failed");
await page.locator("#pause").click();
await page.locator("#mode").selectOption("manual");
await page.locator("#reveal").selectOption("scroll");
await page.locator("#speed").fill("200");
await page.locator("#apply").click();
await page.waitForTimeout(2000);
console.log(
  "scroll",
  await page.locator(".sd-window").evaluate((e) => ({
    height: e.clientHeight,
    total: e.scrollHeight,
    top: e.scrollTop,
  })),
);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "/tmp/story-lab-mobile.png", fullPage: true });
console.log(
  "mobile overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
if (
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
)
  throw new Error("Mobile page overflow");
await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("#reveal").selectOption("typewriter");
await page.locator("#apply").click();
console.log("reduced full text", await page.locator(".sd-text").innerText());
const failure = await browser.newPage();
await failure.route("**/assets/building.png", (r) => r.abort());
await failure.goto("http://127.0.0.1:8768/prototypes/story-diorama-lab/");
await failure.waitForFunction(() =>
  document
    .querySelector("#loading-text")
    .textContent.includes("could not load"),
);
console.log(
  "failure retry",
  await failure.locator(".loading-retry").isVisible(),
);
await failure.close();
await page.goto("http://127.0.0.1:8768/projects/story-diorama/examples/noah/");
await page.locator("#loading").waitFor({ state: "hidden" });
await page.locator("#start-manual").click();
await page.waitForTimeout(1600);
await page.locator("#next").click();
await page.locator("#pause").click();
await page.screenshot({ path: "/tmp/story-noah-desktop.png", fullPage: true });
console.log("errors", errors);
if (errors.length) throw Error(errors.join("\n"));
await browser.close();
