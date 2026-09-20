import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { AuthoredBook } from "../src/authored-book";
import { isAssetUsed } from "../src/book-localization";
import { validateBook } from "../src/book-validation";
import { handleToyEdit, renderToyEditor } from "../src/toy-editor";

const source = fs.readFileSync("public/books/quiet-garden.book.json", "utf8");
const fixture = () => JSON.parse(source) as AuthoredBook;

const event = (type: string, selector: string, dataset = {}, value = "") => {
  const target = {
    dataset,
    value,
    checked: value === "checked",
    closest(query: string) {
      return query === selector ? target : null;
    },
  };
  return { type, target } as unknown as Event;
};

test("toy editor adds, edits and removes one bounded toy definition", () => {
  const book = fixture();
  assert.match(renderToyEditor(book), /No shelf toys yet/);
  assert.equal(handleToyEdit(book, event("click", "[data-toy-add]")), true);
  assert.equal(book.toys?.length, 1);
  const toy = book.toys![0];
  assert.equal(toy.animation, "rock");
  assert.equal(book.assets[toy.asset].kind, "image");

  handleToyEdit(
    book,
    event(
      "change",
      "[data-toy-index][data-toy-field]",
      { toyIndex: "0", toyField: "label" },
      "A small light",
    ),
  );
  handleToyEdit(
    book,
    event("change", "[data-toy-pose]", { toyPose: "0" }, "checked"),
  );
  handleToyEdit(
    book,
    event(
      "change",
      "[data-toy-index][data-toy-field]",
      { toyIndex: "0", toyField: "animation" },
      "float",
    ),
  );
  assert.equal(toy.label, "A small light");
  assert.deepEqual(toy.pose, { index: 0, columns: 1 });
  assert.equal(toy.animation, "float");
  assert.match(renderToyEditor(book), /A small light/);

  handleToyEdit(book, event("click", "[data-toy-remove]", { toyRemove: "0" }));
  assert.equal(book.toys, undefined);
});

test("toy validation enforces count, IDs, asset kinds, pose bounds and short labels", () => {
  const valid = fixture();
  const image = Object.keys(valid.assets).find(
    (id) => valid.assets[id].kind === "image",
  )!;
  const audio = Object.keys(valid.assets).find(
    (id) => valid.assets[id].kind === "audio",
  )!;
  valid.toys = [
    {
      id: "garden-light",
      label: "Garden light",
      asset: image,
      pose: { index: 0, columns: 2 },
      animation: "pulse",
      sound: audio,
    },
  ];
  assert.ok(validateBook(valid).book);
  assert.equal(isAssetUsed(valid, image), true);
  assert.equal(isAssetUsed(valid, audio), true);

  const mutations: [string, (book: AuthoredBook) => void, RegExp][] = [
    [
      "duplicate IDs",
      (book) => book.toys!.push(structuredClone(book.toys![0])),
      /DUPLICATE_ID/,
    ],
    [
      "image kind",
      (book) => {
        book.toys![0].asset = audio;
      },
      /ASSET_KIND/,
    ],
    [
      "sound kind",
      (book) => {
        book.toys![0].sound = image;
      },
      /ASSET_KIND/,
    ],
    [
      "pose bounds",
      (book) => {
        book.toys![0].pose = { index: 2, columns: 2 };
      },
      /POSE/,
    ],
    [
      "short label",
      (book) => {
        book.toys![0].label = "x".repeat(61);
      },
      /must NOT have more than 60 characters/,
    ],
    [
      "four toy limit",
      (book) => {
        book.toys = Array.from({ length: 5 }, (_, index) => ({
          ...structuredClone(book.toys![0]),
          id: `toy-${index}`,
        }));
      },
      /must NOT have more than 4 items/,
    ],
  ];
  for (const [name, mutate, expected] of mutations) {
    const book = structuredClone(valid);
    mutate(book);
    assert.match(
      validateBook(book)
        .errors.map(({ message }) => message)
        .join("\n"),
      expected,
      name,
    );
  }
});

test("toy controls stop at four and ignore ordinary editor clicks", () => {
  const book = fixture();
  for (let index = 0; index < 5; index++)
    handleToyEdit(book, event("click", "[data-toy-add]"));
  assert.equal(book.toys?.length, 4);
  assert.match(renderToyEditor(book), /data-toy-add disabled/);
  assert.equal(
    handleToyEdit(
      book,
      event(
        "click",
        "[data-toy-index][data-toy-field]",
        { toyIndex: "0", toyField: "label" },
        "Should not apply on click",
      ),
    ),
    false,
  );
  assert.notEqual(book.toys![0].label, "Should not apply on click");
});
