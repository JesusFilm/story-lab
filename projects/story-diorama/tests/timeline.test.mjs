import test from "node:test";
import assert from "node:assert/strict";
import { Timeline } from "../src/timeline.mjs";
const cues = [{ text: "ABCD" }, { text: "EFGH" }];
test("automatic reveal → hold → fade → next → complete", () => {
  const t = new Timeline(cues, { speed: 4, hold: 500, fade: 200 });
  t.tick(999);
  assert.equal(t.phase, "revealing");
  t.tick(1);
  assert.equal(t.phase, "holding");
  t.tick(500);
  assert.equal(t.phase, "fading");
  t.tick(200);
  assert.equal(t.index, 1);
  t.tick(1700);
  assert.equal(t.phase, "complete");
  assert.equal(t.next(), false);
});
test("manual waits indefinitely; first input reveals, second fades before advancing", () => {
  const t = new Timeline(cues, { mode: "manual", speed: 4, fade: 200 });
  t.tick(100);
  t.next();
  assert.equal(t.progress, 1);
  t.tick(60000);
  assert.equal(t.index, 0);
  assert.equal(t.phase, "waiting");
  t.next();
  assert.equal(t.phase, "fading");
  t.next();
  t.tick(199);
  assert.equal(t.index, 0);
  t.tick(1);
  assert.equal(t.index, 1);
});
test("pausing freezes both reveal and manual exit fade", () => {
  const t = new Timeline(cues, { mode: "manual", fade: 200 });
  t.paused = true;
  t.tick(100000);
  t.next();
  assert.equal(t.elapsed, 0);
  t.paused = false;
  t.next();
  t.next();
  t.paused = true;
  const elapsed = t.elapsed;
  t.tick(1000);
  assert.equal(t.elapsed, elapsed);
  t.paused = false;
  t.tick(200);
  assert.equal(t.index, 1);
});
test("loop and replay return to first cue with fresh elapsed time", () => {
  const t = new Timeline(cues, {
    reveal: "instant",
    hold: 10,
    fade: 0,
    loop: true,
  });
  t.tick(10);
  t.tick(10);
  assert.equal(t.index, 0);
  assert.equal(t.finished, false);
  assert.equal(t.elapsed, 0);
  t.options.loop = false;
  t.tick(10);
  t.tick(10);
  assert.equal(t.finished, true);
  t.seek(0);
  assert.equal(t.phase, "holding");
});
test("per-cue modes can mix automatic and reader-controlled passages", () => {
  const t = new Timeline(
    [{ text: "", options: { mode: "manual" } }, { text: "done" }],
    { reveal: "instant", hold: 0, fade: 0 },
  );
  t.tick(10000);
  assert.equal(t.index, 0);
  t.next();
  t.tick(1);
  assert.equal(t.finished, true);
});
test("unicode reveal duration counts code points and invalid stories fail early", () => {
  assert.equal(new Timeline([{ text: "🐑" }], { speed: 1 }).duration, 1000);
  assert.throws(() => new Timeline([]));
  assert.throws(() => new Timeline([{ text: null }]));
});
