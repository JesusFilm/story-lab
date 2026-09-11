import test from "node:test";
import assert from "node:assert/strict";
import { mergeAppearance, resolveAppearance } from "../src/appearance.mjs";
import { Timeline } from "../src/timeline.mjs";
test("appearance patches preserve sibling styles and allow restoring stacked positions", () => {
  const base = {
    title: {
      visible: false,
      fontSize: "30px",
      position: { left: "5%", top: "8%" },
    },
    text: { fontFamily: "GameFont" },
  };
  const result = mergeAppearance(base, {
    title: { visible: true, position: null },
  });
  assert.deepEqual(result.title, {
    visible: true,
    fontSize: "30px",
    position: null,
  });
  assert.equal(result.text.fontFamily, "GameFont");
  assert.equal(base.title.visible, false);
});
test("container-responsive defaults and cue overrides do not leak into following scenes", () => {
  const base = {
    fontFamily: "serif",
    title: { visible: true },
    mobile: { text: { fontSize: "22px" }, title: { visible: false } },
  };
  const cue = {
    title: { visible: true },
    mobile: { text: { fontSize: "24px" } },
  };
  assert.equal(resolveAppearance(base, cue, true).title.visible, true);
  assert.equal(resolveAppearance(base, cue, true).text.fontSize, "24px");
  assert.equal(resolveAppearance(base, undefined, true).title.visible, false);
  assert.equal(resolveAppearance(base, undefined, false).title.visible, true);
});
test("invalid playback, music configuration and fractional seek fail explicitly", () => {
  for (const options of [
    { mode: "typo" },
    { speed: 0 },
    { hold: -1 },
    { fade: NaN },
    { transition: "spin" },
  ])
    assert.throws(() => new Timeline([{ text: "ok" }], options));
  assert.throws(() => new Timeline([{ text: "ok", music: { src: "" } }]));
  assert.throws(
    () => new Timeline([{ text: "ok", music: { src: "a.mp3", volume: 2 } }]),
  );
  assert.throws(() => new Timeline([{ text: "ok" }]).seek(0.5));
});
