import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { inflateSync } from "node:zlib";
import { edenStageDirections } from "../src/eden-stage-direction";

const publicRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public",
);
const edenSourceRoot = path.resolve(publicRoot, "../assets/books/eden");
const theatrePath = (asset: string) =>
  asset.startsWith("assets/")
    ? path.resolve(publicRoot, asset)
    : path.resolve(publicRoot, "assets/art/theatre", `${asset}.webp`);
const edenSourcePath = (asset: string) =>
  path.resolve(publicRoot, `../assets/books/eden/source-art/${asset}`);
const pageIds = Array.from(
  { length: 8 },
  (_, index) => `eden-${String(index + 1).padStart(2, "0")}`,
);

/** Decode the local RGBA PNG's alpha bounds, matching scene.ts's >32 crop. */
function paintedPngSize(filename: string) {
  const png = readFileSync(filename);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const imageData: Buffer[] = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const kind = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      assert.equal(data[12], 0, "source PNG is not interlaced");
    } else if (kind === "IDAT") imageData.push(data);
    offset += length + 12;
    if (kind === "IEND") break;
  }
  assert.equal(bitDepth, 8);
  assert.equal(colorType, 6, "source cutout retains RGBA pixels");
  const stride = width * 4;
  const decoded = inflateSync(Buffer.concat(imageData));
  let prior = Buffer.alloc(stride);
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let cursor = 0;
  for (let y = 0; y < height; y++) {
    const filter = decoded[cursor++];
    const row = Buffer.from(decoded.subarray(cursor, cursor + stride));
    cursor += stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= 4 ? row[i - 4] : 0;
      const up = prior[i];
      const upperLeft = i >= 4 ? prior[i - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const base = left + up - upperLeft;
        const leftDistance = Math.abs(base - left);
        const upDistance = Math.abs(base - up);
        const upperLeftDistance = Math.abs(base - upperLeft);
        predictor =
          leftDistance <= upDistance && leftDistance <= upperLeftDistance
            ? left
            : upDistance <= upperLeftDistance
              ? up
              : upperLeft;
      } else assert.equal(filter, 0, "source PNG uses a supported row filter");
      row[i] = (row[i] + predictor) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      if (row[x * 4 + 3] <= 32) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    prior = row;
  }
  assert.ok(maxX >= minX && maxY >= minY, "source has painted pixels");
  return { width: maxX - minX + 1, height: maxY - minY + 1 };
}

test("Eden has explicit staging for all eight pages with matching ground assets", () => {
  assert.deepEqual(Object.keys(edenStageDirections).sort(), pageIds);

  for (const stem of [
    "continuous-garden-ground",
    "fig-leaf-hiding-screen",
    "eden-guarded-way-backcloth",
    "exile-earth-ground",
    "fieldwork-tools",
  ]) {
    assert.ok(
      existsSync(path.resolve(edenSourceRoot, `source-art/${stem}.png`)),
      `${stem} source image is cataloged`,
    );
    assert.ok(
      existsSync(path.resolve(edenSourceRoot, `prompts/${stem}.txt`)),
      `${stem} prompt note is cataloged`,
    );
  }

  for (const id of pageIds) {
    const direction = edenStageDirections[id];
    assert.ok(direction.ground, `${id} must name its horizontal print`);
    assert.ok(existsSync(theatrePath(direction.ground)), `${id} ground exists`);
    assert.ok(
      existsSync(theatrePath(direction.background)),
      `${id} backdrop exists`,
    );
    for (const prop of direction.props || [])
      assert.ok(
        existsSync(theatrePath(prop.file)),
        `${id} prop ${prop.file} exists`,
      );
  }

  for (const id of pageIds.slice(0, 5))
    assert.equal(
      edenStageDirections[id].ground,
      "assets/art/theatre/continuous-garden-ground.webp",
      `${id} keeps the continuous garden print`,
    );
  for (const id of pageIds.slice(5))
    assert.equal(
      edenStageDirections[id].ground,
      "assets/art/theatre/exile-earth-ground.webp",
      `${id} moves to the dry-earth print`,
    );
});

test("Eden scene beats stay distinct and the actors remain readable", () => {
  const companion = edenStageDirections["eden-02"].actors.find(
    (actor) => actor.kind === "eve",
  );
  assert.equal(companion?.flipX, true, "Eve faces Adam on the companion page");

  assert.equal(
    edenStageDirections["eden-03"].props?.find(
      (prop) => prop.file === "serpent-branch",
    )?.creature,
    "serpent",
    "the serpent retains its localized interactive character rig",
  );

  const hiding = edenStageDirections["eden-04"];
  const screen = hiding.props?.find(
    (prop) => prop.file === "assets/art/theatre/fig-leaf-hiding-screen.webp",
  );
  assert.ok(screen, "shame-and-hiding scene has foreground leaves");
  const actorSpan = Math.abs(hiding.actors[1].x - hiding.actors[0].x);
  assert.ok(
    screen.width >= actorSpan * 2,
    "leaf screen reaches across both character positions",
  );
  const alphaBounds = paintedPngSize(
    edenSourcePath("fig-leaf-hiding-screen.png"),
  );
  const leafHeight = screen.width / (alphaBounds.width / alphaBounds.height);
  const actorHeight = 1.95;
  assert.ok(
    leafHeight >= actorHeight * 0.55 && leafHeight <= actorHeight * 0.68,
    `leaf screen height ${leafHeight.toFixed(2)} stays below faces while hiding lower bodies`,
  );
  assert.ok(
    hiding.actors.every(
      (actor) => Math.abs(screen.depth - actor.depth) <= 0.15,
    ),
    "leaf screen is close to each actor's ground depth so it hides lower bodies",
  );
  assert.ok(
    hiding.actors.every((actor) => screen.depth < actor.depth),
    "leaf screen is in the foreground of both adult figures",
  );
  assert.ok(
    hiding.actors.every(
      (actor) => actor.kind === "adam" || actor.kind === "eve",
    ),
    "the image keeps both faces as separate readable character cutouts",
  );

  const guardedWay = edenStageDirections["eden-06"];
  assert.equal(
    guardedWay.background,
    "assets/art/theatre/eden-guarded-way-backcloth.webp",
    "the expulsion page has its natural guarded threshold backcloth",
  );
  assert.deepEqual(
    guardedWay.actors.map((actor) => actor.kind).sort(),
    ["adam", "eve"],
    "the guarded-way illustration adds no human divine figure",
  );

  const work = edenStageDirections["eden-07"];
  assert.ok(
    work.actors.every((actor) => actor.pose === 0 && actor.mood === "work"),
  );
  assert.ok(
    work.props?.some(
      (prop) => prop.file === "assets/art/theatre/fieldwork-tools.webp",
    ),
    "the field-work page shows tools instead of repeating the hiding pose",
  );

  const promise = edenStageDirections["eden-08"];
  assert.equal(
    promise.tree,
    undefined,
    "the exile page does not reuse Eden's fruit tree",
  );
});
