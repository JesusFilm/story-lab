import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assetReferences, checkMediaCapacity } from "../src/book-media";
import type { AuthoredBook } from "../src/authored-book";

test("media limits allow net-neutral replacements but block additions and oversize recordings", () => {
  const MiB = 1024 * 1024;
  assert.doesNotThrow(() => checkMediaCapacity(1024, 96 * MiB, MiB, 2 * MiB));
  assert.throws(() => checkMediaCapacity(1024, MiB, MiB), /1,024/);
  assert.throws(() => checkMediaCapacity(12, 96 * MiB, MiB), /96 MiB/);
  assert.throws(() => checkMediaCapacity(12, MiB, 33 * MiB), /32 MiB/);
});
test("shared narration and soundtrack references prevent deleting a replaced asset", () => {
  const book = JSON.parse(
    fs.readFileSync("public/books/quiet-garden.book.json", "utf8"),
  ) as AuthoredBook;
  const asset = book.spreads[0].segments[0].narration!.asset;
  assert.equal(assetReferences(book, asset), 1);
  book.soundtracks = [
    {
      id: "music",
      label: "Music",
      asset,
      startPage: book.spreads[0].id,
      endPage: book.spreads[1].id,
      startOffset: 0,
      endOffset: 0,
      volume: 0.3,
      fadeIn: 0,
      fadeOut: 0,
      loop: true,
    },
  ];
  assert.equal(assetReferences(book, asset), 2);
});
