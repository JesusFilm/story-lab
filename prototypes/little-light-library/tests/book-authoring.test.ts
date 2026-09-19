import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  validateBook,
  validateBookAssets,
  bookSchema,
} from "../src/book-validation";
import type { AuthoredBook } from "../src/authored-book";
import { BookHistory } from "../src/authoring";
import { ReaderState } from "../src/state";
const source = fs.readFileSync("public/books/quiet-garden.book.json", "utf8");
const fixture = () => JSON.parse(source) as AuthoredBook;

test("demo and generated schema agree with the live versioned contract", () => {
  const result = validateBook(fixture());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(
    JSON.parse(fs.readFileSync("scripts/book.schema.json", "utf8")),
    bookSchema,
  );
});
test("invalid versions, unsupported behavior, duplicate IDs, unsafe sources and broken references give paths", () => {
  const cases: [(b: AuthoredBook) => void, string][] = [
    [
      (b) => {
        b.version = 9 as 1;
      },
      "/version",
    ],
    [
      (b) => {
        b.id = "eden";
      },
      "/id",
    ],
    [
      (b) => {
        b.spreads[1].id = b.spreads[0].id;
      },
      "/spreads/1/id",
    ],
    [
      (b) => {
        b.spreads[0].backdrop.asset = "missing";
      },
      "/spreads/0/backdrop/asset",
    ],
    [
      (b) => {
        b.assets["cover-art"].src = "../secret.png";
      },
      "/assets/cover-art/src",
    ],
    [
      (b) => {
        b.assets["cover-art"].src = "https://example.com/a.png";
      },
      "/assets/cover-art/src",
    ],
    [
      (b) => {
        b.spreads[0].elements[0].motion!.segment = "bad";
      },
      "/spreads/0/elements/0/motion/segment",
    ],
    [
      (b) => {
        b.spreads[0].elements[0].motion!.preset = "fly" as "rock";
      },
      "/spreads/0/elements/0/motion/preset",
    ],
    [
      (b) => {
        b.spreads[0].elements[0].placement.x = Infinity;
      },
      "/spreads/0/elements/0/placement/x",
    ],
    [
      (b) => {
        b.spreads[0].elements[0].pose!.index = 3;
      },
      "/spreads/0/elements/0/pose/index",
    ],
    [
      (b) => {
        Object.assign(b.spreads[0].elements[0].placement, { depthh: 1 });
      },
      "/spreads/0/elements/0/placement",
    ],
  ];
  for (const [mutate, at] of cases) {
    const book = fixture();
    mutate(book);
    const result = validateBook(book);
    assert.equal(result.book, undefined);
    assert.ok(
      result.errors.some((e) => e.path === at),
      JSON.stringify(result.errors),
    );
  }
});
test("text changes identify exactly one stale cue; targeted WAV replacement preserves other recordings", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "light-book-"));
  try {
    const book = fixture(),
      original = fixture();
    const replacement = book.spreads[1].segments[0];
    book.spreads[0].segments[0].text = replacement.text;
    const result = validateBook(book);
    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0].message, /Stale/);
    const file = path.join(directory, "book.json");
    fs.writeFileSync(file, JSON.stringify(book));
    execFileSync(process.execPath, [
      "--import",
      "tsx",
      "scripts/book-cli.ts",
      "replace-audio",
      file,
      book.spreads[0].id,
      book.spreads[0].segments[0].id,
      book.assets[replacement.narration!.asset].src,
      replacement.narration!.voice,
    ]);
    const updated = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(validateBook(updated).warnings.length, 0);
    assert.deepEqual(
      updated.spreads[0].segments[1],
      original.spreads[0].segments[1],
    );
    assert.deepEqual(updated.spreads[1], original.spreads[1]);
    for (const [id, asset] of Object.entries(original.assets))
      assert.deepEqual(updated.assets[id], asset);
    assert.equal(
      updated.spreads[0].segments[0].narration.duration,
      replacement.narration!.duration,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
test("media validation rejects missing assets and mismatched measured durations", async () => {
  const book = fixture();
  const errors = await validateBookAssets(book, async (asset) => {
    if (asset.kind === "image") throw Error("not found");
    return { duration: 1 };
  });
  assert.ok(errors.some((e) => e.path === "/assets/cover-art/src"));
  assert.equal(
    errors.filter((e) => e.message.startsWith("AUDIO_DURATION")).length,
    4,
  );
});
test("validated snapshots undo actual authored data; failed validation leaves history intact", () => {
  const history = new BookHistory(),
    manual = fixture();
  history.commit(manual);
  const agent = fixture();
  agent.spreads[0].elements[0].placement.x = -1.2;
  agent.spreads[0].ground!.opacity = 0.4;
  history.commit(agent);
  agent.title = "Uncommitted mutation";
  assert.equal(history.current!.title, manual.title);
  const bad = fixture();
  bad.cover = "unknown";
  assert.equal(validateBook(bad).book, undefined);
  assert.equal(history.current!.spreads[0].ground!.opacity, 0.4);
  assert.deepEqual(history.undo(), manual);
});
test("reader navigation uses imported count while preserving eight-spread default", () => {
  const state = new ReaderState();
  state.open("arbitrary-book", 2);
  state.turn(12);
  assert.equal(state.page, 1);
  state.open("eden");
  state.turn(12);
  assert.equal(state.page, 7);
});
