import { BookLibrary, type SavedBook } from "./book-library";
import type { AuthoredBook } from "./authored-book";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function installBookShelf(
  host: HTMLElement,
  options: {
    open: (book: AuthoredBook, key: string) => void;
    blank: () => AuthoredBook;
    book: () => AuthoredBook;
    status: (message: string) => void;
  },
) {
  const library = new BookLibrary();
  let currentKey: string | undefined;
  let initialized = false;
  let dirty = false;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<void> = Promise.resolve();
  function failure(error: unknown) {
    options.status(
      `Not saved on this device: ${String(error)}. Export a copy to keep your work.`,
    );
  }
  async function flush() {
    clearTimeout(timer);
    if (!dirty || !currentKey) {
      await queue;
      return;
    }
    const key = currentKey,
      revision = version;
    const entry = {
      key,
      book: structuredClone(options.book()),
      updatedAt: Date.now(),
    };
    dirty = false;
    queue = queue.catch(() => {}).then(() => library.save(entry));
    try {
      await queue;
      if (key === currentKey && version === revision)
        options.status("Saved on this device");
    } catch (error) {
      if (key === currentKey) dirty = true;
      failure(error);
      throw error;
    }
  }
  function changed() {
    if (!currentKey) return;
    dirty = true;
    version++;
    options.status("Saving…");
    clearTimeout(timer);
    timer = setTimeout(() => void flush().catch(() => {}), 350);
  }
  async function edit(entry: SavedBook) {
    await flush();
    currentKey = entry.key;
    host.hidden = true;
    options.open(entry.book, entry.key);
    changed();
    await flush();
  }
  async function create(book: AuthoredBook) {
    await edit({ key: crypto.randomUUID(), book, updatedAt: Date.now() });
  }
  async function show() {
    await flush();
    currentKey = undefined;
    host.hidden = false;
    host.innerHTML = "<h1>My books</h1><p>Loading your books…</p>";
    try {
      if (!initialized) {
        await library.seed();
        initialized = true;
      }
      const entries = await library.list();
      const card = (entry: SavedBook) => {
        const asset = entry.book.assets[entry.book.cover];
        const src =
          asset?.src &&
          (asset.src.startsWith("data:image/") ||
            /^(?!.*\.\.)[a-zA-Z0-9_./-]+$/.test(asset.src))
            ? asset.src.startsWith("data:")
              ? asset.src
              : "./" + asset.src
            : "";
        return `<article class="library-book">${src ? `<img src="${escape(src)}" alt="">` : '<div class="book-placeholder">✦</div>'}<h2>${escape(entry.book.title)}</h2><p>${entry.book.spreads.length} pages · ${escape(entry.book.locale)}</p><div>${entry.deletedAt ? `<button data-restore-book="${escape(entry.key)}">Restore book</button>` : `<button class="primary" data-edit-book="${escape(entry.key)}" aria-label="Edit ${escape(entry.book.title)}">Edit book</button><button data-delete-book="${escape(entry.key)}" aria-label="Delete ${escape(entry.book.title)}">Delete</button>`}</div></article>`;
      };
      const live = entries.filter((entry) => !entry.deletedAt),
        deleted = entries.filter((entry) => entry.deletedAt);
      host.innerHTML = `<header class="library-heading"><p class="eyebrow">Your writing room</p><h1>My books</h1><p>Create a new story or pick up where you left off. Books and artwork save in this browser on this device.</p></header><form id="new-book-form" hidden><label>New book title<input id="new-book-title" required maxlength="200" placeholder="What is your book called?"></label><button class="primary" type="submit">Create book</button><button type="button" id="cancel-new-book">Cancel</button></form><div class="book-library-grid">${live.map(card).join("") || "<p>No books yet. Choose New book to start your first story.</p>"}</div>${deleted.length ? `<details class="deleted-books"><summary>Recently deleted (${deleted.length})</summary><div class="book-library-grid">${deleted.map(card).join("")}</div></details>` : ""}`;
      host.querySelector<HTMLFormElement>("form")!.onsubmit = (event) => {
        event.preventDefault();
        const submit = host.querySelector<HTMLButtonElement>(
          "button[type=submit]",
        )!;
        if (submit.disabled) return;
        submit.disabled = true;
        const book = options.blank();
        book.id = `book-${crypto.randomUUID()}`;
        book.title =
          host
            .querySelector<HTMLInputElement>("#new-book-title")!
            .value.trim() || "Untitled book";
        void create(book).catch((error) => {
          submit.disabled = false;
          failure(error);
        });
      };
      host.querySelector<HTMLButtonElement>("#cancel-new-book")!.onclick =
        () => {
          host.querySelector<HTMLFormElement>("form")!.hidden = true;
        };
      host.onclick = (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "[data-edit-book],[data-delete-book],[data-restore-book]",
        );
        if (!button || button.disabled) return;
        const key =
          button.dataset.editBook ||
          button.dataset.deleteBook ||
          button.dataset.restoreBook;
        const entry = entries.find((entry) => entry.key === key);
        if (!entry) return;
        button.disabled = true;
        void (async () => {
          if (button.dataset.editBook) await edit(entry);
          else {
            await library.save({
              ...entry,
              deletedAt: button.dataset.deleteBook ? Date.now() : undefined,
            });
            await show();
          }
        })().catch((error) => {
          button.disabled = false;
          failure(error);
        });
      };
    } catch (error) {
      host.innerHTML =
        '<h1>My books</h1><p>Your books could not be loaded. Try again; no books have been replaced.</p><button id="retry-library">Try again</button>';
      host.querySelector<HTMLButtonElement>("#retry-library")!.onclick = () =>
        void show();
      failure(error);
    }
  }
  return {
    show,
    changed,
    flush,
    create,
    newBook() {
      const form = host.querySelector<HTMLFormElement>("#new-book-form");
      if (form) {
        form.hidden = false;
        host.querySelector<HTMLInputElement>("#new-book-title")!.focus();
      }
    },
  };
}
