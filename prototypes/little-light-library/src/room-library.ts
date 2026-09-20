import type { AuthoredBook, BookAsset } from "./authored-book";
import { BookLibrary, type SavedBook } from "./book-library";
import { resolveBook } from "./book-localization";
import { validateBook, validateBookAssets } from "./book-validation";
import type { LocaleData } from "./contracts";

export const ROOM_SHELF_LIMIT = 6;
export const BUILTIN_ROOM_KEYS = ["builtin:eden", "builtin:noah"] as const;
const SETTING = "room-shelf-v1";

export interface RoomEntry {
  key: string;
}

export interface ResolvedRoomEntry {
  key: string;
  title: string;
  cover: string;
  book?: AuthoredBook;
  storyId?: string;
}

interface RoomStore {
  list(): Promise<SavedBook[]>;
  mutateSetting<T>(
    key: string,
    change: (current: T | undefined) => T,
  ): Promise<T>;
}

export interface RoomLibraryOptions {
  library?: RoomStore;
  fetch?: typeof globalThis.fetch;
  image?: (blob: Blob) => Promise<void>;
  audio?: (bytes: ArrayBuffer) => Promise<{ duration: number }>;
  validate?: (book: AuthoredBook) => Promise<void>;
}

const isBuiltin = (key: string) =>
  (BUILTIN_ROOM_KEYS as readonly string[]).includes(key);

export function normalizeRoomKeys(
  value: unknown,
  liveKeys: ReadonlySet<string>,
): string[] {
  const source = value === undefined ? [...BUILTIN_ROOM_KEYS] : value;
  if (!Array.isArray(source)) return [...BUILTIN_ROOM_KEYS];
  const result: string[] = [];
  for (const item of source) {
    if (
      typeof item === "string" &&
      (isBuiltin(item) || liveKeys.has(item)) &&
      !result.includes(item) &&
      result.length < ROOM_SHELF_LIMIT
    )
      result.push(item);
  }
  return result;
}

const path = (asset: BookAsset) =>
  asset.src.startsWith("data:") ? asset.src : `./${asset.src}`;

async function bytes(asset: BookAsset, fetcher: typeof globalThis.fetch) {
  const response = await fetcher(path(asset));
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response.blob();
}

export async function validateRoomBook(
  book: AuthoredBook,
  options: Pick<RoomLibraryOptions, "fetch" | "image" | "audio"> = {},
) {
  const result = validateBook(book);
  if (!result.book)
    throw Error(
      result.errors
        .map(({ path, message }) => `${path}: ${message}`)
        .join("\n"),
    );
  const fetcher = options.fetch ?? globalThis.fetch;
  const image =
    options.image ??
    (async (blob: Blob) => {
      const bitmap = await createImageBitmap(blob);
      bitmap.close();
    });
  if (options.audio) {
    const errors = await validateBookAssets(result.book, async (asset) => {
      const blob = await bytes(asset, fetcher);
      if (asset.kind === "image") {
        await image(blob);
        return {};
      }
      return options.audio!(await blob.arrayBuffer());
    });
    if (errors.length)
      throw Error(
        errors.map(({ path, message }) => `${path}: ${message}`).join("\n"),
      );
    return;
  }
  for (const asset of Object.values(result.book.assets))
    if (asset.kind === "image") await image(await bytes(asset, fetcher));
}

export class RoomLibrary {
  private readonly library: RoomStore;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly validate: (book: AuthoredBook) => Promise<void>;

  constructor(options: RoomLibraryOptions = {}) {
    this.library = options.library ?? new BookLibrary();
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.validate =
      options.validate ?? ((book) => validateRoomBook(book, options));
  }

  private async books() {
    return (await this.library.list()).filter(({ deletedAt }) => !deletedAt);
  }

  async read(): Promise<RoomEntry[]> {
    const books = await this.books();
    const live = new Set(books.map(({ key }) => key));
    const keys = await this.library.mutateSetting<unknown>(SETTING, (value) =>
      normalizeRoomKeys(value, live),
    );
    return (keys as string[]).map((key) => ({ key }));
  }

  async add(key: string): Promise<void> {
    const books = await this.books();
    const live = new Set(books.map(({ key: bookKey }) => bookKey));
    if (!isBuiltin(key)) {
      const entry = books.find(({ key: bookKey }) => bookKey === key);
      if (!entry) throw Error("This book is no longer available.");
      await this.validate(structuredClone(entry.book));
    }
    await this.library.mutateSetting<unknown>(SETTING, (value) => {
      const keys = normalizeRoomKeys(value, live);
      if (keys.includes(key)) return keys;
      if (keys.length >= ROOM_SHELF_LIMIT)
        throw Error(`The room shelf has ${ROOM_SHELF_LIMIT} books already.`);
      return [...keys, key];
    });
  }

  async remove(key: string): Promise<void> {
    const books = await this.books();
    const live = new Set(books.map(({ key }) => key));
    await this.library.mutateSetting<unknown>(SETTING, (value) =>
      normalizeRoomKeys(value, live).filter((item) => item !== key),
    );
  }

  async resolve(locale: string | LocaleData): Promise<ResolvedRoomEntry[]> {
    const books = await this.books();
    const byKey = new Map(books.map((entry) => [entry.key, entry]));
    const entries = await this.read();
    let content = typeof locale === "string" ? undefined : locale;
    const localeId = typeof locale === "string" ? locale : locale.id;
    if (!content && entries.some(({ key }) => isBuiltin(key))) {
      const response = await this.fetcher(
        `./content/${encodeURIComponent(localeId)}.json`,
      );
      if (!response.ok) throw Error("The room stories could not load.");
      content = (await response.json()) as LocaleData;
    }
    const resolved: ResolvedRoomEntry[] = [];
    for (const { key } of entries) {
      if (isBuiltin(key)) {
        const storyId = key.slice("builtin:".length);
        const story = content?.stories.find(({ id }) => id === storyId);
        if (story)
          resolved.push({
            key,
            storyId,
            title: story.title,
            cover: story.pages[0]?.image ?? "",
          });
        continue;
      }
      const saved = byKey.get(key);
      if (!saved) continue;
      const book = structuredClone(saved.book);
      let title = book.title;
      try {
        title = resolveBook(saved.book, localeId).title;
      } catch {
        /* Shelf metadata stays readable in the authored source language. */
      }
      const cover = book.assets[book.cover];
      resolved.push({
        key,
        title,
        cover: cover ? path(cover) : "",
        book,
      });
    }
    return resolved;
  }
}
