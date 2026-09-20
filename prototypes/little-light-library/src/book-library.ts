import type { AuthoredBook } from "./authored-book";
import { validateBook } from "./book-validation";

export interface SavedBook {
  key: string;
  book: AuthoredBook;
  updatedAt: number;
  deletedAt?: number;
}

/** Browser-local books, including embedded media. Separate keys protect imported IDs. */
export class BookLibrary {
  private database?: Promise<IDBDatabase>;
  private open() {
    return (this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      let blocked = false;
      const request = indexedDB.open("little-light-author-books", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("books", { keyPath: "key" });
        request.result.createObjectStore("settings");
      };
      request.onsuccess = () => {
        if (blocked) {
          request.result.close();
          return;
        }
        request.result.onversionchange = () => {
          request.result.close();
          this.database = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        blocked = true;
        reject(Error("Close other editor tabs and try again."));
      };
    }).catch((error) => {
      this.database = undefined;
      throw error;
    }));
  }
  private async transaction<T>(
    name: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ) {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(name, mode);
      const request = action(tx.objectStore(name));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () =>
        reject(tx.error || request.error || Error("Book storage failed."));
    });
  }
  async list(): Promise<SavedBook[]> {
    const entries = await this.transaction("books", "readonly", (store) =>
      store.getAll(),
    );
    return entries.sort(
      (a: SavedBook, b: SavedBook) => b.updatedAt - a.updatedAt,
    );
  }
  async save(entry: SavedBook) {
    await this.transaction("books", "readwrite", (store) => store.put(entry));
  }
  async setting<T>(key: string): Promise<T | undefined> {
    return this.transaction("settings", "readonly", (store) => store.get(key));
  }
  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.transaction("settings", "readwrite", (store) =>
      store.put(value, key),
    );
  }
  async mutateSetting<T>(
    key: string,
    change: (current: T | undefined) => T,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("settings", "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.get(key);
      let next: T;
      request.onsuccess = () => {
        try {
          next = change(request.result);
          store.put(next, key);
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onerror = transaction.onabort = () =>
        reject(
          transaction.error || request.error || Error("Book storage failed."),
        );
    });
  }
  async seed() {
    if (
      await this.transaction("settings", "readonly", (store) =>
        store.get("initialized"),
      )
    )
      return;
    const response = await fetch("./books/catalog.json");
    if (!response.ok)
      throw Error("The existing book list could not load. Try again.");
    const paths: string[] = await response.json();
    for (const path of paths) {
      if (!/^[a-z0-9-]+\.book\.json$/.test(path))
        throw Error("Invalid book catalog entry.");
      const response = await fetch(`./books/${path}`);
      if (!response.ok)
        throw Error("An existing book could not load. Try again.");
      const result = validateBook(await response.json());
      if (!result.book)
        throw Error("An existing book has an invalid definition.");
      const key = `included-${result.book.id}`;
      const existing = await this.transaction("books", "readonly", (store) =>
        store.get(key),
      );
      if (!existing)
        await this.save({ key, book: result.book, updatedAt: Date.now() });
    }
    await this.transaction("settings", "readwrite", (store) =>
      store.put(true, "initialized"),
    );
  }
}
