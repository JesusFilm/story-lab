// Run with the repository root served on port 8768. Runtime has no Playwright dependency.
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_PATH,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "http://127.0.0.1:8768/projects/story-diorama/examples/minimal/",
  );
  await page.waitForFunction(() =>
    document.querySelector("#status").textContent.startsWith("Ready"),
  );
  assert.equal(await page.locator("#game-controls svg").count(), 1);
  await page.locator('#game-controls [data-sd-action="play"]').click();
  await page.locator('#game-controls [data-sd-action="next"]').click();
  await page.screenshot({
    path: "/tmp/story-diorama-minimal-desktop.png",
    fullPage: true,
  });
  console.log(
    await page.evaluate(async () => {
      const { StoryDiorama } = await import("../../src/story-diorama.mjs");
      const { bindControls, createControls } = await import(
        "../../src/controls.mjs"
      );
      const check = (v, m) => {
        if (!v) throw Error(m);
      };
      const root = document.createElement("section"),
        other = document.createElement("section"),
        buttons = document.createElement("div"),
        custom = document.createElement("div");
      document.body.append(root, other, buttons, custom);
      root.style.width = "900px";
      other.style.width = "700px";
      const cue = {
        number: "01",
        title: "Heading",
        text: "A standalone passage.",
        reference: "Book 1:1",
        version: "Edition",
      };
      const a = new StoryDiorama(
        root,
        {
          cues: [
            cue,
            {
              ...cue,
              title: "Hidden here",
              appearance: { title: { visible: false } },
            },
            { ...cue, title: "Visible again" },
          ],
        },
        {
          mode: "manual",
          reveal: "instant",
          fade: 0,
          appearance: {
            fontFamily: "monospace",
            number: { visible: false },
            version: { visible: false },
            title: { position: { top: "5%", left: "8%" }, fontSize: "30px" },
            mobile: { text: { fontSize: "20px" } },
          },
        },
      );
      const b = new StoryDiorama(other, { cues: [cue] }, { mode: "manual" });
      check(
        root.querySelectorAll("button").length === 0,
        "Core created unwanted controls",
      );
      check(
        a.elements.number.hidden && a.elements.version.hidden,
        "Independent metadata visibility failed",
      );
      check(
        !a.elements.reference.hidden && !a.elements.text.hidden,
        "Hiding version also hid reference/text",
      );
      check(
        getComputedStyle(a.text).fontFamily === "monospace",
        "Font configuration failed",
      );
      check(
        getComputedStyle(b.text).fontFamily !== "monospace",
        "Appearance leaked into second player",
      );
      const bar = createControls(buttons, a, { controls: ["pause", "next"] });
      check(
        bar.element.querySelectorAll("button").length === 2 &&
          !bar.element.querySelector("input"),
        "Omitted controls were created",
      );
      check(
        bar.element.querySelector('[data-sd-action="next"]').disabled,
        "Idle Next is enabled",
      );
      custom.innerHTML =
        '<button data-sd-action="next"><svg aria-hidden="true"></svg><span data-sd-label>Continue</span></button>';
      const binding = bindControls(custom, a, { labels: { next: "Continue" } });
      a.start();
      b.start();
      check(
        !bar.element.querySelector('[data-sd-action="next"]').disabled,
        "Active Next is disabled",
      );
      const top = a.elements.title.getBoundingClientRect(),
        bounds = root.getBoundingClientRect();
      check(
        Math.abs(top.top - bounds.top - bounds.height * 0.05) < 2,
        "Title is not positioned relative to the full stage",
      );
      a.setAppearance({
        text: { visible: false },
        reference: { position: { bottom: "5%", right: "7%" } },
        title: { color: "rgb(255, 0, 0)" },
      });
      check(
        a.elements.text.hidden && a.sr.hidden,
        "Hidden text still announced",
      );
      a.setAppearance({
        text: { visible: true },
        title: { position: null },
        reference: { position: null },
      });
      check(
        a.elements.title.parentElement === a.heading &&
          a.elements.reference.parentElement === a.meta,
        "Reset did not restore stack",
      );
      check(
        a.stack.children[0] === a.heading &&
          a.stack.children[1] === a.window &&
          a.stack.children[2] === a.meta,
        "Caption stack ordering changed",
      );
      custom.querySelector("button").click();
      check(
        a.getState().index === 1 && b.getState().index === 0,
        "Controls crossed player boundaries",
      );
      check(
        a.elements.title.hidden,
        "Cue appearance did not override player settings",
      );
      a.setAppearance({ title: { visible: true } });
      check(a.elements.title.hidden, "Global patch ignored cue precedence");
      custom.querySelector("button").click();
      check(
        !a.elements.title.hidden,
        "Cue overrides leaked to following scene",
      );
      check(
        custom.querySelector("svg") &&
          custom.querySelector("[data-sd-label]").textContent === "Continue",
        "Custom markup/labels changed",
      );
      a.setAppearance({
        number: { visible: true },
        version: { visible: true },
      });
      check(
        !a.elements.number.hidden && !a.elements.version.hidden,
        "Hidden fields could not be restored",
      );
      a.setAppearance({
        text: { position: { left: "5%", right: "5%", bottom: "15%" } },
      });
      root.style.width = "380px";
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      );
      check(
        root.hasAttribute("data-sd-compact") &&
          getComputedStyle(a.text).fontSize === "20px",
        "Container responsive appearance failed",
      );
      const textBounds = a.window.getBoundingClientRect(),
        smallBounds = root.getBoundingClientRect();
      check(
        textBounds.left >= smallBounds.left &&
          textBounds.right <= smallBounds.right + 1,
        "Compact text escapes container",
      );
      a.pause(true);
      check(
        bar.element.querySelector('[data-sd-action="pause"]').textContent ===
          "Resume",
        "Pause label did not update",
      );
      a.stop();
      check(
        bar.element.querySelector('[data-sd-action="next"]').disabled,
        "Stopped controls remain enabled",
      );
      a.start();
      a.seek(999);
      check(a.getState().index === 2, "Clamped seek failed");
      a.destroy();
      a.destroy();
      b.destroy();
      check(
        root.children.length === 0 && buttons.children.length === 0,
        "Destroy leaked owned DOM",
      );
      check(custom.querySelector("svg"), "Destroy removed game-owned markup");
      custom.querySelector("button").click();
      check(
        a.getState().running === false,
        "Custom binding remained active after destroy",
      );
      let threw = false;
      try {
        a.start();
      } catch {
        threw = true;
      }
      check(threw, "Destroyed instance restarted");
      binding.destroy();
      bar.destroy();
      [root, other, buttons, custom].forEach((el) => el.remove());
      return "Independent fields, CSS positions/reset, fonts, cue/mobile precedence, isolated players, custom controls and lifecycle passed";
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/story-diorama-minimal-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.goto("http://127.0.0.1:8768/prototypes/story-diorama-lab/");
  await page.locator("#loading").waitFor({ state: "hidden" });
  await page.getByText("Appearance & game controls", { exact: true }).click();
  await page.locator("#show-version").uncheck();
  await page.locator("#show-number").uncheck();
  await page.locator("#appearance-font").fill("monospace");
  await page.locator("#control-pause").uncheck();
  await page.locator("#control-replay").uncheck();
  await page.locator("#control-mute").uncheck();
  await page.locator("#control-volume").uncheck();
  assert.equal(await page.locator(".sd-version").isVisible(), false);
  assert.equal(await page.locator(".sd-reference").isVisible(), true);
  assert.equal(await page.locator("#pause").isVisible(), false);
  await page.locator("#position-title").selectOption("top-left");
  await page.locator("#start-manual").click();
  await page.locator("#next").click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/story-diorama-configured.png",
    fullPage: true,
  });
  await page.locator("#appearance-reset").click();
  assert.equal(await page.locator("#pause").isVisible(), true);
  assert.equal(await page.locator(".sd-version").isVisible(), true);
  assert.deepEqual(errors, []);
  console.log(
    "Minimal example and live playground controls passed; no browser exceptions.",
  );
} finally {
  await browser.close();
}
