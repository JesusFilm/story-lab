// Optional browser test dependency: install Playwright, or set PLAYWRIGHT_MODULE.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_PATH,
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8768/projects/story-diorama/examples/noah/");
await page.locator("#loading").waitFor({ state: "hidden" });
console.log(
  await page.evaluate(async () => {
    const { StoryDiorama } = await import(
      "/projects/story-diorama/src/story-diorama.mjs"
    );
    const RealAudio = window.Audio,
      made = [];
    window.Audio = class extends EventTarget {
      constructor(src) {
        super();
        this.src = src;
        this.paused = true;
        this.ended = false;
        made.push(this);
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
      pause() {
        this.paused = true;
      }
      load() {}
    };
    const assert = (value, msg) => {
      if (!value) throw Error(msg);
    };
    const root = document.createElement("section");
    document.body.append(root);
    const p = new StoryDiorama(
      root,
      {
        cues: [
          { text: "a", music: { src: "A", loop: true, fade: 100, delay: 300 } },
          { text: "b" },
          {
            text: "c",
            music: { src: "B", loop: false, fade: 100, duration: 300 },
          },
          { text: "d", music: null },
        ],
      },
      { mode: "manual", reveal: "instant", fade: 0 },
    );
    p.start();
    cancelAnimationFrame(p.frame);
    let now = p.last;
    function step(ms) {
      for (let i = 0; i < ms; i += 50) {
        now += Math.min(50, ms - i);
        p.update(now);
        cancelAnimationFrame(p.frame);
      }
    }
    step(200);
    assert(made.length === 0, "delay started early");
    p.pause(true);
    step(500);
    assert(made.length === 0, "pause advanced delay");
    p.pause(false);
    step(100);
    assert(made.length === 1 && made[0].loop, "delayed loop did not start");
    step(100);
    assert(made[0].volume > 0, "fade-in failed");
    p.next();
    step(100);
    assert(made.length === 1, "retained track restarted");
    p.next();
    step(50);
    assert(made.length === 2 && !made[1].loop, "one-shot failed");
    assert(!made[0].paused && !made[1].paused, "crossfade overlap missing");
    step(100);
    assert(made[0].paused, "outgoing track leaked");
    p.pause(true);
    const life = p.voices[0].life;
    step(500);
    assert(
      p.voices[0].life === life && made[1].paused,
      "pause advanced excerpt",
    );
    p.pause(false);
    step(400);
    assert(made[1].paused && p.voices.length === 0, "excerpt did not end");
    p.seek(1);
    step(450);
    assert(made.at(-1).src === "A", "seek did not restore inherited track");
    p.seek(3);
    step(150);
    assert(p.voices.length === 0, "seek into silence did not stop");
    p.start();
    cancelAnimationFrame(p.frame);
    now = p.last;
    step(450);
    assert(p.voices.length === 1, "replay failed");
    p.destroy();
    assert(
      made.every((v) => v.paused),
      "destroy leaked audio",
    );
    window.Audio = RealAudio;
    root.remove();
    return "Audio lifecycle: delay, pause, inherit, overlap, once, excerpt, seek, silence, replay, destroy passed";
  }),
);
await page.addInitScript(() => {
  const RealAudio = window.Audio;
  window.testVoices = [];
  window.Audio = function (...args) {
    const a = new RealAudio(...args);
    window.testVoices.push(a);
    return a;
  };
});
await page.reload();
await page.locator("#loading").waitFor({ state: "hidden" });
await page.locator("#start-manual").click();
await page.locator("#pause").click();
await page.waitForTimeout(300);
if (await page.locator("#audio-alert").isVisible())
  throw Error("Immediate pause showed a false audio error");
await page.locator("#pause").click();
await page.waitForTimeout(2300);
console.log(
  "real MP3",
  await page.evaluate(() =>
    window.testVoices.map((a) => ({
      src: a.src.split("/").pop(),
      duration: a.duration,
      currentTime: a.currentTime,
      paused: a.paused,
      error: a.error?.message,
      volume: a.volume,
    })),
  ),
);
await page.locator("#pause").click();
const a = await page.evaluate(() => window.testVoices[0].currentTime);
await page.waitForTimeout(500);
const b = await page.evaluate(() => window.testVoices[0].currentTime);
if (b - a > 0.1) throw Error("real music did not pause");
console.log("real audio pause passed");
await browser.close();
