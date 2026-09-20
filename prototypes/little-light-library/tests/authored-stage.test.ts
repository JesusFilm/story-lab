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
    ground: { kind: "image", src: "art/ground.webp", attribution: "Test" },
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
      ground: {
        asset: "ground",
        x: 0.1,
        depth: -0.2,
        width: 4,
        height: 2,
        rotation: 5,
        opacity: 0.8,
      },
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
    "./art/ground.webp",
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

test("live editor transforms match a freshly loaded reader scene without reloading or compounding", async () => {
  const { stage, calls } = await makeStage(motion);
  const book = bookWith(motion);
  const actor = book.spreads[0].elements[0];
  for (const anchor of ["bottom", "center"] as const) {
    actor.placement = {
      x: -1.4,
      depth: 0.65,
      width: 2.3,
      height: 2.1,
      elevation: 0.6,
      rotation: -23,
      anchor,
    };
    stage.editPlacement("actor", actor);
    stage.editPlacement("actor", actor);
    const fresh = await AuthoredStage.create(
      book,
      book.spreads[0],
      {
        loadAsync: async () => new THREE.Texture(),
      } as unknown as THREE.TextureLoader,
      () => true,
    );
    for (const current of [stage, fresh]) {
      current.popups.forEach((p) => (p.rotation.x = Math.PI / 2));
      current.root.updateMatrixWorld(true);
    }
    const liveBounds = new THREE.Box3().setFromObject(
      stage.root.getObjectByName("authored-element-actor")!,
    );
    const freshBounds = new THREE.Box3().setFromObject(
      fresh.root.getObjectByName("authored-element-actor")!,
    );
    for (const edge of ["min", "max"] as const)
      for (const axis of ["x", "y", "z"] as const)
        closeTo(liveBounds[edge][axis], freshBounds[edge][axis]);
    stage.rest();
    closeTo(stage.debug().elements[0].rotation, THREE.MathUtils.degToRad(-23));
    fresh.dispose();
  }
  assert.equal(calls.length, 4, "gestures must not reload any image");
  stage.dispose();
  assert.equal(stage.root.children.length, 0);
});

test("live ground edits match a freshly loaded stage without reloading or compounding", async () => {
  const { stage, calls } = await makeStage(motion);
  const book = bookWith(motion);
  const ground = book.spreads[0].ground!;
  Object.assign(ground, {
    x: -1.2,
    depth: -1.4,
    width: 5.9,
    height: 3.05,
    rotation: -37,
    opacity: 0.35,
  });
  stage.editGround(ground);
  stage.editGround(ground);
  const fresh = await AuthoredStage.create(
    book,
    book.spreads[0],
    {
      loadAsync: async () => new THREE.Texture(),
    } as unknown as THREE.TextureLoader,
    () => true,
  );
  assert.deepEqual(stage.debug().ground, fresh.debug().ground);
  const debug = stage.debug().ground!;
  assert.deepEqual(debug.position, [-1.2, -1.4, 0.046]);
  assert.deepEqual(debug.size, [5.9, 3.05]);
  closeTo(debug.rotation, THREE.MathUtils.degToRad(-37));
  closeTo(debug.opacity, 0.35);
  assert.equal(calls.length, 4, "ground edits must not reload any image");
  fresh.dispose();
  stage.dispose();
});
