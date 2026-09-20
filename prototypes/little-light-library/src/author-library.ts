import { BookLibrary, type SavedBook } from "./book-library";
import type { AuthoredBook } from "./authored-book";
import { ROOM_SHELF_LIMIT, RoomLibrary } from "./room-library";

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
    roomChanged?: () => void;
    decodeAudio?: (bytes: ArrayBuffer) => Promise<{ duration: number }>;
  },
) {
  const library = new BookLibrary();
  const room = new RoomLibrary({ audio: options.decodeAudio });
  let currentKey: string | undefined;
  let initialized = false;
  let dirty = false;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<void> = Promise.resolve();
  const roomActions = new Set<Promise<void>>();
  const trackRoomAction = (action: Promise<void>) => {
    roomActions.add(action);
    action.then(
      () => roomActions.delete(action),
      () => roomActions.delete(action),
    );
    return action;
  };
  const waitForRoomActions = async () => {
    while (roomActions.size) await Promise.all([...roomActions]);
  };
  function failure(error: unknown) {
    options.status(
      `Not saved on this device: ${String(error)}. Export a copy to keep your work.`,
    );
  }
  async function flush() {
    clearTimeout(timer);
    if (!dirty || !currentKey) {
      await queue;
      await waitForRoomActions();
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
      await waitForRoomActions();
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
      const lineup = await room.read();
      const roomKeys = new Set(lineup.map(({ key }) => key));
      const remaining = ROOM_SHELF_LIMIT - lineup.length;
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
        const roomAction = roomKeys.has(entry.key)
          ? `<button data-room-remove="${escape(entry.key)}">Remove from room</button>`
          : `<button data-room-add="${escape(entry.key)}" ${remaining ? "" : "disabled"}>Add to room</button>`;
        return `<article class="library-book">${src ? `<img src="${escape(src)}" alt="">` : '<div class="book-placeholder">✦</div>'}<h2>${escape(entry.book.title)}</h2><p>${entry.book.spreads.length} pages · ${escape(entry.book.locale)}</p><div>${entry.deletedAt ? `<button data-restore-book="${escape(entry.key)}">Restore book</button>` : `<button class="primary" data-edit-book="${escape(entry.key)}" aria-label="Edit ${escape(entry.book.title)}">Edit book</button>${roomAction}<button data-delete-book="${escape(entry.key)}" aria-label="Delete ${escape(entry.book.title)}">Delete</button>`}</div></article>`;
      };
      const live = entries.filter((entry) => !entry.deletedAt),
        deleted = entries.filter((entry) => entry.deletedAt);
      const builtins = [
        ["builtin:eden", "Eden"],
        ["builtin:noah", "Noah"],
      ] as const;
      host.innerHTML = `<header class="library-heading"><p class="eyebrow">Your writing room</p><h1>My books</h1><p>Create a new story or pick up where you left off. Books and artwork save in this browser on this device.</p></header><section class="room-shelf"><h2>Room shelf</h2><p>${remaining} of ${ROOM_SHELF_LIMIT} spaces remaining. Removing a book from the room keeps it in My books.</p><div>${builtins.map(([key, title]) => `<span>${title} <button data-room-${roomKeys.has(key) ? "remove" : "add"}="${key}" ${!roomKeys.has(key) && !remaining ? "disabled" : ""}>${roomKeys.has(key) ? "Remove" : "Restore"}</button></span>`).join("")}</div></section><form id="new-book-form" hidden><label>New book title<input id="new-book-title" required maxlength="200" placeholder="What is your book called?"></label><button class="primary" type="submit">Create book</button><button type="button" id="cancel-new-book">Cancel</button></form><div class="book-library-grid">${live.map(card).join("") || "<p>No books yet. Choose New book to start your first story.</p>"}</div>${deleted.length ? `<details class="deleted-books"><summary>Recently deleted (${deleted.length})</summary><div class="book-library-grid">${deleted.map(card).join("")}</div></details>` : ""}`;
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
          "[data-edit-book],[data-delete-book],[data-restore-book],[data-room-add],[data-room-remove]",
        );
        if (!button || button.disabled) return;
        const key =
          button.dataset.editBook ||
          button.dataset.deleteBook ||
          button.dataset.restoreBook ||
          button.dataset.roomAdd ||
          button.dataset.roomRemove;
        if (!key) return;
        if (button.dataset.roomAdd || button.dataset.roomRemove) {
          button.disabled = true;
          options.status(
            button.dataset.roomAdd
              ? "Checking this book before adding it to the room…"
              : "Updating the room shelf…",
          );
          const action = trackRoomAction(
            button.dataset.roomAdd ? room.add(key) : room.remove(key),
          );
          void action
            .then(async () => {
              options.roomChanged?.();
              await show();
            })
            .catch((error) => {
              button.disabled = false;
              failure(error);
            });
          return;
        }
        const entry = entries.find((entry) => entry.key === key);
        if (!entry) return;
        button.disabled = true;
        if (button.dataset.editBook) {
          void edit(entry).catch((error) => {
            button.disabled = false;
            failure(error);
          });
        } else {
          const action = trackRoomAction(
            (async () => {
              if (button.dataset.deleteBook) {
                await room.remove(entry.key);
                options.roomChanged?.();
              }
              await library.save({
                ...entry,
                deletedAt: button.dataset.deleteBook ? Date.now() : undefined,
              });
            })(),
          );
          void action.then(show).catch((error) => {
            button.disabled = false;
            failure(error);
          });
        }
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
