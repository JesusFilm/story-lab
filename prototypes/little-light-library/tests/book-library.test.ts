import assert from "node:assert/strict";
import test from "node:test";
import { BookLibrary } from "../src/book-library";

test("a failed database open can be retried without reloading the editor", async () => {
  const original = globalThis.indexedDB;
  let attempts = 0;
  const database = {
    transaction() {
      const request = { result: [] };
      const transaction = {
        objectStore: () => ({ getAll: () => request }),
        oncomplete: () => {},
      };
      queueMicrotask(() => transaction.oncomplete());
      return transaction;
    },
  };
  globalThis.indexedDB = {
    open() {
      attempts++;
      const request = {
        result: database,
        error: Error("Temporary storage failure"),
        onerror: () => {},
        onsuccess: () => {},
      };
      queueMicrotask(() => {
        if (attempts === 1) request.onerror();
        else request.onsuccess();
      });
      return request;
    },
  } as unknown as IDBFactory;
  try {
    const library = new BookLibrary();
    await assert.rejects(library.list(), /Temporary storage failure/);
    assert.deepEqual(await library.list(), []);
    assert.equal(attempts, 2);
  } finally {
    globalThis.indexedDB = original;
  }
});
