import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { AuthoredStage, authoredRockAngle } from "../src/authored-stage";
import type { AuthoredBook, BookMotion } from "../src/authored-book";

const motion: BookMotion = {
  preset: "rock",
  trigger: "narration",
  segment: "opening-line",
  delay: 0.5,
  duration: 2,
  strength: 20,
  repeat: 2,
};

test("authored rock uses delayed degree strength and returns to rest", () => {
  assert.equal(authoredRockAngle(motion, 0.49), 0);
  assert.ok(Math.abs(authoredRockAngle(motion, 1) - Math.PI / 9) < 0.000001);
  assert.ok(Math.abs(authoredRockAngle(motion, 2) + Math.PI / 9) < 0.000001);
  assert.equal(authoredRockAngle(motion, 4.5), 0);
});

test("authored rock defaults to one repetition", () => {
  const once = { ...motion, delay: undefined, repeat: undefined };
  assert.ok(authoredRockAngle(once, 0.5) > 0);
  assert.equal(authoredRockAngle(once, 2), 0);
});

const bookWith = (elementMotion: BookMotion): AuthoredBook => ({
  format: "little-light-book",
  version: 1,
  id: "stage-test",
  title: "Stage test",
  subtitle: "Bounded motion",
  locale: "en-US",
  status: "draft",
  source: "Test source",
  retellingNote: "Test retelling",
  cover: "cover",
  assets: {
    backdrop: { kind: "image", src: "art/backdrop.webp", attribution: "Test" },
    cover: { kind: "image", src: "art/cover.webp", attribution: "Test" },
    actor: { kind: "image", src: "art/actor.webp", attribution: "Test" },
    intro: { kind: "audio", src: "audio/intro.wav", attribution: "Test" },
    action: { kind: "audio", src: "audio/action.wav", attribution: "Test" },
  },
  spreads: [
    {
      id: "opening",
      title: "Opening",
      source: "Test source",
      stagingNote: "Test staging",
      segments: [
        {
          id: "intro",
          text: "First phrase.",
          narration: {
            asset: "intro",
            recordedText: "First phrase.",
            duration: 1,
            voice: "test",
          },
        },
        {
          id: "action",
          text: "Second phrase.",
          narration: {
            asset: "action",
            recordedText: "Second phrase.",
            duration: 1,
            voice: "test",
          },
        },
      ],
      backdrop: { asset: "backdrop" },
      elements: [
        {
          id: "actor",
          label: "Actor",
          kind: "actor",
          asset: "actor",
          placement: {
            x: 0,
            depth: 0,
            width: 1,
            height: 1.5,
            rotation: 7,
          },
          motion: elementMotion,
        },
      ],
    },
  ],
});

async function makeStage(elementMotion: BookMotion) {
  const calls: string[] = [];
  const loader = {
    async loadAsync(src: string) {
      calls.push(src);
      const texture = new THREE.Texture();
      texture.name = src;
      return texture;
    },
  } as unknown as THREE.TextureLoader;
  const book = bookWith(elementMotion);
  const stage = await AuthoredStage.create(
    book,
    book.spreads[0],
    loader,
    () => true,
  );
  return { stage, calls };
}

const closeTo = (actual: number, expected: number) =>
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `${actual} did not equal ${expected}`,
  );

async function withFakeNow(
  run: (setNow: (value: number) => void) => Promise<void>,
) {
  let now = 0;
  const original = performance.now.bind(performance);
  Object.defineProperty(performance, "now", {
    configurable: true,
    value: () => now * 1000,
  });
  try {
    await run((value) => {
      now = value;
    });
  } finally {
    Object.defineProperty(performance, "now", {
      configurable: true,
      value: original,
    });
  }
}

test("minimum open gesture starts only after the card is visibly unfolded", async () => {
  const { stage } = await makeStage({
    preset: "rock",
    trigger: "open",
    duration: 0.2,
    strength: 10,
  });
  await withFakeNow(async (setNow) => {
    stage.begin();
    setNow(10);
    stage.update(0, false, false, true);
    setNow(20);
    stage.update(0, false, false, true);
    closeTo(stage.debug().elements[0].rocking, 0);

    stage.update(0, false, false, false);
    closeTo(stage.debug().elements[0].rocking, 0);
    setNow(20.05);
    stage.update(0, false, false, false);
    closeTo(stage.debug().elements[0].rocking, THREE.MathUtils.degToRad(10));
    setNow(20.21);
    stage.update(0, false, false, false);
    closeTo(stage.debug().elements[0].rocking, 0);
  });
});

test("reduced motion holds the authored base rotation without rocking", async () => {
  const { stage } = await makeStage({
    preset: "rock",
    trigger: "open",
    duration: 0.2,
    strength: 20,
  });
  await withFakeNow(async (setNow) => {
    stage.begin();
    for (const now of [1, 1.05, 1.1, 1.2]) {
      setNow(now);
      stage.update(0, false, true, false);
      const element = stage.debug().elements[0];
      closeTo(element.rocking, 0);
      closeTo(element.rotation, THREE.MathUtils.degToRad(7));
    }
  });
});

test("narration gesture follows the named segment's measured position", async () => {
  const { stage } = await makeStage({
    preset: "rock",
    trigger: "narration",
    segment: "action",
    duration: 0.4,
    strength: 8,
  });
  stage.update(0.9, true, false, false);
  closeTo(stage.debug().elements[0].rocking, 0);
  stage.update(1.1, true, false, false);
  closeTo(stage.debug().elements[0].rocking, THREE.MathUtils.degToRad(8));
  stage.update(1.1, false, false, false);
  closeTo(stage.debug().elements[0].rocking, 0);
});

test("authored stage loads the declared cover separately from its backdrop", async () => {
  const { stage, calls } = await makeStage({
    preset: "rock",
    trigger: "open",
    duration: 1,
    strength: 1,
  });
  assert.deepEqual(calls, [
    "./art/backdrop.webp",
    "./art/cover.webp",
    "./art/actor.webp",
  ]);
  assert.equal(stage.backdropTexture.name, "./art/backdrop.webp");
  assert.equal(stage.coverTexture.name, "./art/cover.webp");
  assert.notEqual(stage.backdropTexture, stage.coverTexture);
});

test("decoded cue lengths override rounded metadata for narration gestures", async () => {
  const { stage } = await makeStage({
    preset: "rock",
    trigger: "narration",
    segment: "action",
    duration: 0.4,
    strength: 8,
  });
  stage.narrationDurations([1.039, 1]);
  stage.update(1.139, true, false, false);
  closeTo(stage.debug().elements[0].rocking, THREE.MathUtils.degToRad(8));
});
