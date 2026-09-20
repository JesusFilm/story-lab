import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { LocaleData } from "../src/contracts";
import { sourceTranslation } from "../src/book-localization";
import { RoomLibrary } from "../src/room-library";

import { readerFixture as fixture } from "../scripts/reader-fixture";
const locale = (): LocaleData =>
  JSON.parse(fs.readFileSync("public/content/en-US.json", "utf8"));

function repository(
  catalog: unknown,
  books: Record<string, unknown> = { "fixture-book.book.json": fixture() },
) {
  const requests: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url === "./books/catalog.json") return Response.json(catalog);
    const book = books[url.replace(/^\.\/books\//, "")];
    return book === undefined
      ? new Response("Missing committed file", { status: 404 })
      : Response.json(book);
  };
  return { room: new RoomLibrary({ fetch: fetcher }), requests };
}

test("public catalog contains only the three story books and no extra book files", () => {
  const catalog = JSON.parse(
    fs.readFileSync("public/books/catalog.json", "utf8"),
  );
  assert.deepEqual(
    catalog.map(({ id }: { id: string }) => id),
    ["eden", "noah", "jonah-and-the-whale"],
  );
  assert.deepEqual(
    fs
      .readdirSync("public/books")
      .filter((name) => name.endsWith(".book.json")),
    ["jonah-and-the-whale.book.json"],
  );
});

test("committed order mixes legacy stories and generic books without browser storage", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw Error("The injected fetch must serve all catalog requests");
  });
  const stored = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    get() {
      throw Error("Reader must not access browser authoring storage");
    },
  });
  try {
    const { room, requests } = repository([
      { id: "noah", legacyStory: "noah" },
      { id: "fixture-book", path: "fixture-book.book.json" },
      { id: "eden", legacyStory: "eden" },
    ]);
    const content = locale();
    const resolved = await room.resolve(content);
    assert.deepEqual(
      resolved.map(({ key }) => key),
      ["builtin:noah", "book:fixture-book", "builtin:eden"],
    );
    assert.equal(
      resolved[0].title,
      content.stories.find(({ id }) => id === "noah")!.title,
    );
    assert.equal(resolved[0].storyId, "noah");
    assert.equal(resolved[1].title, fixture().title);
    assert.equal(resolved[1].book!.id, "fixture-book");
    assert.equal(
      resolved[1].cover,
      `./${fixture().assets[fixture().cover].src}`,
    );
    assert.equal(resolved[2].storyId, "eden");
    assert.deepEqual(
      requests.sort(),
      ["./books/catalog.json", "./books/fixture-book.book.json"].sort(),
    );
  } finally {
    if (stored) Object.defineProperty(globalThis, "indexedDB", stored);
    else Reflect.deleteProperty(globalThis, "indexedDB");
  }
});

test("unregistered repository books stay off the shelf", async () => {
  const { room, requests } = repository([{ id: "eden", legacyStory: "eden" }]);
  assert.deepEqual(
    (await room.resolve(locale())).map(({ key }) => key),
    ["builtin:eden"],
  );
  assert.deepEqual(requests, ["./books/catalog.json"]);
});

test("localized shelf titles preserve source text and translations for later reading", async () => {
  const book = fixture();
  const translation = sourceTranslation(book);
  translation.title = "Titre français";
  book.languages = [book.locale, "fr"];
  book.translations = { fr: translation };
  const content = locale();
  content.id = "fr";
  const { room } = repository(
    [{ id: book.id, path: "fixture-book.book.json" }],
    { "fixture-book.book.json": book },
  );
  const [resolved] = await room.resolve(content);
  assert.equal(resolved.title, translation.title);
  assert.deepEqual(resolved.book, book);
  assert.notEqual(resolved.book, book);
});

test("an unavailable book translation retains the source-language shelf title", async () => {
  const content = locale();
  content.id = "fr";
  const { room } = repository([
    { id: "fixture-book", path: "fixture-book.book.json" },
  ]);
  const [resolved] = await room.resolve(content);
  assert.equal(resolved.title, fixture().title);
  assert.equal(resolved.book!.locale, "en-US");
});

test("missing committed book fails visibly instead of silently shrinking the catalog", async () => {
  const { room } = repository([{ id: "missing", path: "missing.book.json" }]);
  await assert.rejects(room.resolve(locale()), /missing|404/i);
});

test("catalog failures can recover on a later resolve", async () => {
  let failing = true;
  const room = new RoomLibrary({
    fetch: async () =>
      failing
        ? new Response("Unavailable", { status: 503 })
        : Response.json([{ id: "eden", legacyStory: "eden" }]),
  });
  await assert.rejects(room.resolve(locale()), /catalog|503/i);
  failing = false;
  assert.deepEqual(
    (await room.resolve(locale())).map(({ key }) => key),
    ["builtin:eden"],
  );
});

test("invalid generic content fails before it becomes a readable room entry", async () => {
  const book = fixture();
  book.spreads[0].backdrop.asset = "missing-art";
  const { room } = repository(
    [{ id: book.id, path: "fixture-book.book.json" }],
    { "fixture-book.book.json": book },
  );
  await assert.rejects(
    room.resolve(locale()),
    /backdrop|missing-art|ASSET_REFERENCE/i,
  );
});
