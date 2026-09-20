import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { AuthoredBook } from "../src/authored-book";
import type { SavedBook } from "../src/book-library";
import { sourceTranslation } from "../src/book-localization";
import {
  BUILTIN_ROOM_KEYS,
  ROOM_SHELF_LIMIT,
  RoomLibrary,
  normalizeRoomKeys,
  validateRoomBook,
} from "../src/room-library";

const source = fs.readFileSync("public/books/quiet-garden.book.json", "utf8");
const fixture = () => JSON.parse(source) as AuthoredBook;

class MemoryStore {
  books: SavedBook[] = [];
  settings = new Map<string, unknown>();
  async list() {
    return structuredClone(this.books);
  }
  async mutateSetting<T>(key: string, change: (current: T | undefined) => T) {
    const next = change(structuredClone(this.settings.get(key)) as T);
    this.settings.set(key, structuredClone(next));
    return next;
  }
}

const saved = (key: string, title = key): SavedBook => {
  const book = fixture();
  book.title = title;
  return { key, book, updatedAt: 1 };
};

test("room lineup defaults to built-ins and normalizes stale, duplicate and excess keys", () => {
  const live = new Set(["one", "two", "three", "four", "five"]);
  assert.deepEqual(normalizeRoomKeys(undefined, live), BUILTIN_ROOM_KEYS);
  assert.deepEqual(
    normalizeRoomKeys(
      ["one", "one", "missing", "builtin:noah", "two", "three", "four", "five"],
      live,
    ),
    ["one", "builtin:noah", "two", "three", "four", "five"],
  );
});

test("room membership uses saved keys, enforces capacity and keeps collection entries", async () => {
  const store = new MemoryStore();
  store.books = Array.from({ length: 7 }, (_, index) =>
    saved(`saved-${index}`, "Same authored ID"),
  );
  let validations = 0;
  const room = new RoomLibrary({
    library: store,
    validate: async () => {
      validations++;
    },
  });
  assert.deepEqual(
    (await room.read()).map(({ key }) => key),
    BUILTIN_ROOM_KEYS,
  );
  for (let index = 0; index < 4; index++) await room.add(`saved-${index}`);
  await room.add("saved-0");
  assert.equal((await room.read()).length, ROOM_SHELF_LIMIT);
  await assert.rejects(room.add("saved-4"), /6 books already/);
  await room.remove("builtin:eden");
  await room.add("saved-4");
  assert.equal(store.books.length, 7);
  assert.equal(validations, 7);
  assert.deepEqual(
    (await room.read()).map(({ key }) => key),
    ["builtin:noah", "saved-0", "saved-1", "saved-2", "saved-3", "saved-4"],
  );
});

test("deleted and stale saved keys are pruned and restoring a book leaves it off shelf", async () => {
  const store = new MemoryStore();
  store.books = [saved("live"), { ...saved("deleted"), deletedAt: 1 }];
  store.settings.set("room-shelf-v1", [
    "builtin:eden",
    "live",
    "deleted",
    "missing",
  ]);
  const room = new RoomLibrary({ library: store, validate: async () => {} });
  assert.deepEqual(await room.read(), [
    { key: "builtin:eden" },
    { key: "live" },
  ]);
  store.books[1].deletedAt = undefined;
  assert.deepEqual(await room.read(), [
    { key: "builtin:eden" },
    { key: "live" },
  ]);
});

test("resolve preserves duplicate authored IDs by saved key and prefixes public covers", async () => {
  const store = new MemoryStore();
  const first = saved("copy-a", "First copy");
  const second = saved("copy-b", "Second copy");
  assert.equal(first.book.id, second.book.id);
  store.books = [first, second];
  store.settings.set("room-shelf-v1", ["copy-a", "copy-b"]);
  const room = new RoomLibrary({ library: store, validate: async () => {} });
  const resolved = await room.resolve("en-US");
  assert.deepEqual(
    resolved.map(({ key, title }) => ({ key, title })),
    [
      { key: "copy-a", title: "First copy" },
      { key: "copy-b", title: "Second copy" },
    ],
  );
  assert.match(resolved[0].cover, /^\.\/assets\//);
});

test("localized shelf titles retain the complete source authored book", async () => {
  const store = new MemoryStore();
  const entry = saved("localized", "Source title");
  const translation = sourceTranslation(entry.book);
  translation.title = "Titre français";
  entry.book.languages = [entry.book.locale, "fr"];
  entry.book.translations = { fr: translation };
  store.books = [entry];
  store.settings.set("room-shelf-v1", [entry.key]);
  const room = new RoomLibrary({ library: store, validate: async () => {} });

  const [resolved] = await room.resolve("fr");
  assert.equal(resolved.title, "Titre français");
  assert.equal(resolved.book!.locale, entry.book.locale);
  assert.equal(
    resolved.book!.spreads[0].segments[0].text,
    entry.book.spreads[0].segments[0].text,
  );
  assert.deepEqual(resolved.book!.translations, entry.book.translations);
  assert.notEqual(resolved.book, entry.book);
});

test("adding validates structure and decodes every image before changing lineup", async () => {
  const book = fixture();
  let images = 0;
  await validateRoomBook(book, {
    fetch: async () => new Response(new Blob(["image"]), { status: 200 }),
    image: async () => {
      images++;
    },
  });
  assert.equal(
    images,
    Object.values(book.assets).filter(({ kind }) => kind === "image").length,
  );
  const broken = fixture();
  broken.spreads[0].backdrop.asset = "missing";
  await assert.rejects(
    validateRoomBook(broken, {
      fetch: async () => new Response(new Blob()),
      image: async () => {},
    }),
    /ASSET_REFERENCE/,
  );
});
