import { validateBook } from "./book-validation";
import { ShelfToyAudio } from "./shelf-toy-audio";
import { shelfToys, type ShelfToy } from "./room-toys";
import { RoomLibrary } from "./room-library";
import { BookNarration } from "./book-reader-audio";
import {
  productionLanguages,
  resolveBook,
  translationIssues,
} from "./book-localization";
import { installAuthoring } from "./authoring";
import { narrationIssues, type AuthoredBook } from "./authored-book";
import "./style.css";
import {
  localeIds,
  type LocaleId,
  type LocaleData,
  type AudioManifest,
  type StoryId,
  type Story,
} from "./contracts";
import { readPreferences, savePreferences } from "./preferences";
import { ReaderState } from "./state";
import { Narration } from "./playback";
import { LibraryScene, type Selection } from "./scene";
import { Soundscape } from "./soundscape";
declare global {
  interface Window {
    lightBootUi: Record<string, string>;
    storyLoading: {
      status: (s: string) => void;
      ready: () => void;
      fail: (s: string) => void;
    };
    libraryDebug: () => unknown;
    libraryReview: (
      time?: number,
      age?: number,
      foldProgress?: number,
      focusAge?: number,
    ) => void;
    libraryRoomReview: (selection?: Selection, age?: number) => void;
  }
}
const names: Record<LocaleId, string> = {
  "en-US": "English · US",
  "en-GB": "English · UK",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  it: "Italiano",
  ja: "日本語",
  "pt-BR": "Português · Brasil",
  "zh-CN": "简体中文",
};
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const prefs = readPreferences(localStorage),
  state = new ReaderState();
state.language = prefs.language;
let locale: LocaleData,
  manifest: AudioManifest = {},
  scene: LibraryScene,
  narration: Narration | BookNarration,
  entered = false,
  ready = false,
  operation = 0;
let soundscape: Soundscape | undefined;
let entering = false;
let toyAudio: ShelfToyAudio | undefined;
let currentToys: ShelfToy[] = [];
let lastHighlight = "";
let draft: AuthoredBook | undefined;
let draftLocale = "";
let standardNarration: Narration;
let bookNarration: BookNarration;
let viewBook: AuthoredBook | undefined;
let viewSource: AuthoredBook | undefined;
function draftView() {
  if (viewSource !== draft || viewBook?.locale !== draftLocale) {
    viewSource = draft;
    viewBook = resolveBook(draft!, draftLocale || draft!.locale);
  }
  return viewBook!;
}
let authoring: ReturnType<typeof installAuthoring> | undefined;
const roomLibrary = new RoomLibrary();
type RoomBook = Awaited<ReturnType<RoomLibrary["resolve"]>>[number];
let roomBooks: RoomBook[] = [];
let browsingShelf = true;
let shelfBusy = false;
let inspectedBook: RoomBook | undefined;
let tableKey: string | undefined;
let shelfStatus = "";
let pendingPage: Promise<void> | undefined;
let readerNeedsReload = false;

async function shelfAction(action: () => Promise<void>) {
  if (shelfBusy) return;
  shelfBusy = true;
  header();
  document
    .querySelectorAll<HTMLButtonElement>(".shelf-preview button")
    .forEach((b) => (b.disabled = true));
  try {
    await action();
  } catch (error) {
    notice(`The book could not be moved: ${String(error)}. Please try again.`);
  } finally {
    shelfBusy = false;
    shelfStatus = "";
    header();
    if (browsingShelf) renderShelf();
  }
}
async function refreshRoomBooks() {
  const books = await roomLibrary.resolve(locale);
  if (tableKey && !books.some((book) => book.key === tableKey)) {
    toyAudio?.stop();
    currentToys = [];
    await scene.setShelfToys([]);
    await scene.close();
    tableKey = undefined;
    state.close();
  }
  roomBooks = books;
  await scene.setShelfBooks(books);
}
async function openAuthor() {
  await shelfAction(async () => {
    await pendingPage;
    await scene.returnShelfPreview();
    inspectedBook = undefined;
    toyAudio?.stop();
    authoring?.open();
  });
}
function renderShelf() {
  $("#panel").replaceChildren();
  if (inspectedBook) {
    const entry = inspectedBook;
    $("#panel").innerHTML =
      `<section class="shelf-preview" aria-label="Selected book"><p class="eyebrow">${entry.book ? escaped(entry.book.locale) : escaped(locale.name)}</p><h1>${escaped(entry.title)}</h1><div><button id="shelf-read" class="primary" ${shelfBusy ? "disabled" : ""}>Read</button><button id="shelf-return" ${shelfBusy ? "disabled" : ""}>Return</button></div><p role="status">${escaped(shelfStatus)}</p></section>`;
    $("#shelf-read").onclick = () => void readShelfBook();
    $("#shelf-return").onclick = () => void returnShelfBook();
  } else if (shelfStatus) {
    const status = document.createElement("p");
    status.className = "shelf-status";
    status.role = "status";
    status.textContent = shelfStatus;
    $("#panel").append(status);
  }
}
async function inspectShelfBook(key: string) {
  if (
    shelfBusy ||
    !entered ||
    document.querySelector<HTMLDialogElement>("#author-dialog")?.open
  )
    return;
  if (key === tableKey) {
    await resumeReading();
    return;
  }
  const entry = roomBooks.find((book) => book.key === key);
  if (!entry || inspectedBook?.key === key) return;
  await shelfAction(async () => {
    narration?.pause();
    state.hide();
    soundscape?.pause(true);
    await scene.returnShelfPreview();
    inspectedBook = entry;
    shelfStatus = "Taking the book from the shelf…";
    renderShelf();
    await scene.inspectShelfBook(key);
  });
  $("#shelf-read")?.focus();
}
async function returnShelfBook() {
  const key = inspectedBook?.key;
  await shelfAction(async () => {
    shelfStatus = "Returning the book to its place…";
    renderShelf();
    await scene.returnShelfPreview();
    inspectedBook = undefined;
  });
  if (key)
    document
      .querySelector<HTMLButtonElement>(`[data-shelf-key="${CSS.escape(key)}"]`)
      ?.focus();
}
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    inspectedBook &&
    !shelfBusy &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    void returnShelfBook();
  }
});
async function readShelfBook() {
  const entry = inspectedBook;
  if (!entry) return;
  await shelfAction(async () => {
    if (entry.book) {
      const validation = validateBook(entry.book);
      if (!validation.book)
        throw Error(
          validation.errors
            .map(({ path, message }) => `${path}: ${message}`)
            .join("; "),
        );
    }
    ++operation;
    narration.stop();
    state.hide();
    shelfStatus = state.book
      ? "Returning the open book to the shelf…"
      : "Moving your book to the table…";
    renderShelf();
    toyAudio?.stop();
    currentToys = [];
    await scene.setShelfToys([]);
    await scene.close();
    tableKey = undefined;
    state.close();
    shelfStatus = "Moving your book to the table…";
    renderShelf();
    await scene.landShelfBook(entry.key);
    draft = entry.book ? structuredClone(entry.book) : undefined;
    draftLocale =
      draft &&
      productionLanguages(draft).includes(locale.id) &&
      !translationIssues(draft, locale.id).length
        ? locale.id
        : draft?.locale || "";
    tableKey = entry.key;
    inspectedBook = undefined;
    browsingShelf = false;
    const id = draft?.id || entry.storyId!;
    state.open(
      id,
      draft?.spreads.length ||
        locale.stories.find((story) => story.id === id)!.pages.length,
    );
    soundscape?.cue("open");
    await showPage(true);
    currentToys = shelfToys(draft, id, locale, manifest);
    await scene.setShelfToys(currentToys);
  });
}
async function resumeReading() {
  if (!state.book) return;
  await shelfAction(async () => {
    await scene.returnShelfPreview();
    inspectedBook = undefined;
    browsingShelf = false;
    scene.resumeTable();
    document.body.classList.add("reading");
    await showPage(false, false, !readerNeedsReload);
    soundscape?.pause(document.hidden);
  });
}

function currentStory(): Story {
  if (draft && state.book === draft.id) {
    const book = draftView();
    return {
      id: draft.id,
      title: book.title,
      subtitle: book.subtitle,
      pages: book.spreads.map((spread) => ({
        id: spread.id,
        title: spread.title,
        passage: spread.source,
        segments: spread.segments,
        image: book.assets[spread.backdrop.asset].src,
        authored: { book, spread },
      })),
    };
  }
  return locale.stories.find((s) => s.id === state.book)!;
}
const onsetSamples: {
  locale: string;
  book: string;
  page: number;
  segment: number;
  speed: number;
  errorMs: number;
}[] = [];
const escaped = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const t = (key: string) => locale?.ui[key] || window.lightBootUi?.[key] || key;
const button = (id: string, label: string, cls = "") =>
  `<button id="${id}" class="${cls}">${label}</button>`;
const persist = () => savePreferences(localStorage, prefs);
function notice(message = "", language: string = locale?.id) {
  $("#notice").lang = language;
  $("#notice").textContent = message;
}
async function fetchLocale(id: LocaleId) {
  const r = await fetch(`./content/${id}.json`);
  if (!r.ok) throw Error("locale");
  return (await r.json()) as LocaleData;
}
function header() {
  $("#header").innerHTML =
    `<a class="brand" href="https://jesusfilm.github.io/story-lab/" aria-label="${escaped(t("back"))}"><span class="brand-star">✦</span><span>${escaped(t("appTitle"))}</span></a><nav>${entered ? button("author", "Author") : ""}${state.book ? button("shelf", browsingShelf ? "↪ Continue reading" : "↩ " + escaped(t("library"))) : ""}${button("language", "🌐", "icon")}${button("settings", "⚙", "icon")}</nav>`;
  $("#language").setAttribute("aria-label", t("language"));
  $("#settings").setAttribute("aria-label", t("settings"));
  $("#language").onclick = () => languageDialog(false);
  $("#settings").onclick = settingsDialog;
  if (entered) $("#author").onclick = () => void openAuthor();
  if (state.book)
    $("#shelf").onclick = () => void (browsingShelf ? resumeReading() : room());
  $("#header")
    .querySelectorAll<HTMLButtonElement>("button")
    .forEach((b) => (b.disabled = shelfBusy));
}
function localizeLoader() {
  document.documentElement.lang = locale.id;
  document.title = t("appTitle");
  $("#loading h2").textContent = t("appTitle");
  $("#loading").setAttribute("aria-label", t("loading"));
  $("#loading-text").textContent = t("loading");
  $(".loading-retry").textContent = t("retry");
  $(".loading-pause").setAttribute("aria-label", t("loadingPause"));
}
function languageDialog(startup: boolean) {
  const d = $<HTMLDialogElement>("#language-dialog");
  d.innerHTML = `<span class="eyebrow">✦</span><h1>${escaped(t("appTitle"))}</h1><p>${escaped(t("chooseLanguage"))}</p><div class="language-grid">${localeIds.map((id) => `<button lang="${id}" data-locale="${id}" class="${id === prefs.language ? "selected" : ""}" aria-pressed="${id === prefs.language}">${names[id]}</button>`).join("")}</div>${button("enter", escaped(t(startup ? "enter" : "close")), "primary wide")}`;
  d.oncancel = (e) => {
    if (startup) e.preventDefault();
  };
  d.querySelectorAll<HTMLButtonElement>("[data-locale]").forEach(
    (b) =>
      (b.onclick = async () => {
        const id = b.dataset.locale as LocaleId;
        const applyLanguage = async () => {
          await pendingPage;
          const selection = ++operation;
          narration?.stop();
          toyAudio?.stop();
          readerNeedsReload = Boolean(state.book);
          state.hide();
          ready = false;
          notice();
          try {
            const fetched = await fetchLocale(id);
            if (selection !== operation) return;
            locale = fetched;
            state.changeLanguage(id);
            if (
              draft &&
              productionLanguages(draft).includes(id) &&
              !translationIssues(draft, id).length
            )
              draftLocale = id;
            prefs.language = id;
            persist();
            localizeLoader();
            header();
            languageDialog(startup);
            if (entered) {
              if (state.book && !browsingShelf) {
                await showPage(false);
                currentToys = shelfToys(draft, state.book, locale, manifest);
                await scene.setShelfToys(currentToys);
              } else {
                await scene.returnShelfPreview();
                inspectedBook = undefined;
                await refreshRoomBooks();
                if (state.book) {
                  currentToys = shelfToys(draft, state.book, locale, manifest);
                  await scene.setShelfToys(currentToys);
                }
                scene.browseShelf();
                if (!state.book) ready = true;
                renderShelf();
              }
            }
          } catch {
            if (selection !== operation) return;
            if (entered && state.book) await showPage(false);
            notice(t("error"));
          }
        };
        if (entered) await shelfAction(applyLanguage);
        else await applyLanguage();
      }),
  );
  $("#enter").onclick = async () => {
    if (startup) {
      if (entering || entered) return;
      entering = true;
      try {
        standardNarration = new Narration();
        narration = standardNarration;
        bookNarration = new BookNarration(narration.context);
        await narration.unlock();
        soundscape = new Soundscape(narration.context);
        toyAudio = new ShelfToyAudio(narration.context);
        toyAudio.settings(prefs.volume, prefs.audio);
        soundscape.settings(prefs.volume, prefs.audio);
        narration.speed(prefs.speed);
        narration.volume(prefs.volume, prefs.audio);
        authoring ??= installAuthoring({
          audio: () => narration.context,
          pause: () => {
            narration.pause();
            soundscape?.pause(true);
            state.hide();
          },
          closed: async () => {
            if (browsingShelf && !shelfBusy)
              await shelfAction(async () => {
                await refreshRoomBooks();
                scene.browseShelf();
              });
          },
          preview: async (book, page = 0) => {
            const previousTableKey = tableKey;
            const previousToys = currentToys;
            await scene.returnShelfPreview();
            inspectedBook = undefined;
            toyAudio?.stop();
            currentToys = [];
            await scene.setShelfToys([]);
            await scene.close();
            tableKey = undefined;
            browsingShelf = false;
            const previousDraft = draft;
            const previousDraftLocale = draftLocale;
            const previousState = { ...state };
            draft = structuredClone(book);
            draftLocale = book.locale;
            state.open(book.id, book.spreads.length);
            state.page = Math.min(page, book.spreads.length - 1);
            try {
              await showPage(false, true);
              currentToys = shelfToys(draft, book.id, locale, manifest);
              await scene.setShelfToys(currentToys);
            } catch (error) {
              draft = previousDraft;
              draftLocale = previousDraftLocale;
              Object.assign(state, previousState);
              if (state.book) {
                if (previousTableKey) {
                  await scene.landShelfBook(previousTableKey);
                  tableKey = previousTableKey;
                }
                await showPage(false);
                currentToys = previousToys;
                await scene.setShelfToys(currentToys);
              } else await room();
              throw error;
            }
          },
        });
        entered = true;
        d.close();
        await room();
      } catch {
        soundscape?.dispose();
        void narration?.context.close().catch(() => {});
        entered = false;
        notice(t("error"));
      } finally {
        entering = false;
      }
    } else d.close();
  };
  if (!d.open) d.showModal();
}
function settingsDialog() {
  const d = $<HTMLDialogElement>("#settings-dialog");
  d.innerHTML = `<h2>${escaped(t("settings"))}</h2><label>${escaped(t("speed"))}<select id="speed">${[0.75, 1, 1.25, 1.5].map((v) => `<option ${prefs.speed === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="check">${escaped(t("audio"))}<input id="audio" type="checkbox" ${prefs.audio ? "checked" : ""}></label><label>${escaped(t("volume"))}<input id="volume" type="range" min="0" max="1" step=".05" value="${prefs.volume}"></label>${button("settings-language", "🌐 " + escaped(t("language")), "wide")}<p class="help">${escaped(t("helpText"))}</p>${button("settings-close", escaped(t("close")), "primary wide")}`;
  $<HTMLSelectElement>("#speed").onchange = (e) => {
    prefs.speed = Number((e.target as HTMLSelectElement).value);
    narration?.speed(prefs.speed);
    persist();
  };
  $<HTMLInputElement>("#audio").onchange = (e) => {
    prefs.audio = (e.target as HTMLInputElement).checked;
    narration?.volume(prefs.volume, prefs.audio);
    soundscape?.settings(prefs.volume, prefs.audio);
    toyAudio?.settings(prefs.volume, prefs.audio);
    persist();
  };
  $<HTMLInputElement>("#volume").oninput = (e) => {
    prefs.volume = Number((e.target as HTMLInputElement).value);
    narration?.volume(prefs.volume, prefs.audio);
    soundscape?.settings(prefs.volume, prefs.audio);
    toyAudio?.settings(prefs.volume, prefs.audio);
    persist();
  };
  $("#settings-language").onclick = () => {
    d.close();
    languageDialog(false);
  };
  $("#settings-close").onclick = () => d.close();
  d.showModal();
}
async function room() {
  await shelfAction(async () => {
    await pendingPage;
    ++operation;
    narration?.pause();
    state.hide();
    browsingShelf = true;
    soundscape?.ambience(true);
    soundscape?.scene("room");
    soundscape?.pause(false);
    notice();
    document.body.classList.remove("reading");
    await refreshRoomBooks();
    scene.browseShelf();
    if (!state.book) ready = true;
    window.storyLoading.ready();
  });
}
function failure() {
  notice(t("error"));
  $("#notice").append(
    Object.assign(document.createElement("button"), {
      textContent: t("retry"),
      onclick: () => location.reload(),
    }),
  );
  window.storyLoading.fail(t("error"));
}
function showPage(autoplay: boolean, transactional = false, resume = false) {
  if (!resume) readerNeedsReload = false;
  const loading = renderPage(autoplay, transactional, resume).finally(() => {
    if (pendingPage !== loading) return;
    pendingPage = undefined;
    const previous = document.querySelector<HTMLButtonElement>("#previous");
    const next = document.querySelector<HTMLButtonElement>("#next");
    if (previous) previous.disabled = state.page === 0;
    if (next) next.disabled = false;
  });
  pendingPage = loading;
  document
    .querySelectorAll<HTMLButtonElement>("#previous, #next")
    .forEach((button) => (button.disabled = true));
  return loading;
}
async function renderPage(
  autoplay: boolean,
  transactional = false,
  resume = false,
) {
  const token = ++operation;
  const previousReady = ready;
  ready = false;
  lastHighlight = "";
  if (!resume) narration.stop();
  notice();
  document.body.classList.add("reading");
  header();
  const story = currentStory();
  const page = story.pages[state.page];
  narration = page.authored ? bookNarration : standardNarration;
  narration.speed(prefs.speed);
  narration.volume(prefs.volume, prefs.audio);
  soundscape?.pause(document.hidden);
  soundscape?.ambience(!page.authored);
  soundscape?.scene(
    page.authored
      ? "hope"
      : story.id === "eden"
        ? "eden"
        : state.page === 3
          ? "storm"
          : "hope",
  );
  $("#panel").innerHTML =
    `<article class="reader"><div class="reader-meta"><span>${escaped(story.title)}</span><span>${state.page + 1} / ${story.pages.length}</span></div><h1>${escaped(page.title)}</h1><div class="story-text">${page.segments.map((s, i) => `<span data-segment="${i}">${escaped(s.text)}</span>`).join(" ")}</div><div class="reader-footer"><small>${escaped(t("source"))} · ${escaped(page.passage)}</small><span id="play-status" role="status">${escaped(t("loading"))}</span></div><div class="reader-controls">${button("previous", "←")}${button("play", "▶ " + escaped(t("play")), "primary")}${button("replay", "↻")}${button("next", "→")}</div></article>`;
  if (page.authored) {
    const { book, spread } = page.authored;
    $(".reader").setAttribute("lang", book.locale);
    $(".reader-controls").setAttribute("lang", locale.id);
    const note = document.createElement("p");
    note.className = "draft-note";
    note.textContent = `Draft retelling · ${book.locale} · ${book.retellingNote}`;
    $(".reader-meta").after(note);
    if (draft && productionLanguages(draft).length > 1) {
      const label = document.createElement("label");
      label.className = "reader-book-language";
      label.textContent = "Book language ";
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Book language");
      select.innerHTML = productionLanguages(draft)
        .map(
          (id) =>
            `<option value="${escaped(id)}" ${id === draftLocale ? "selected" : ""} ${translationIssues(draft!, id).length ? "disabled" : ""}>${escaped(names[id as LocaleId] ?? id)}</option>`,
        )
        .join("");
      select.onchange = () => {
        draftLocale = select.value;
        void showPage(false);
      };
      label.append(select);
      note.after(label);
    }
    const interactions = document.createElement("div");
    interactions.className = "authored-interactions";
    interactions.setAttribute("aria-label", "Story interactions");
    for (const element of spread.elements.filter((e) => e.interaction)) {
      const b = document.createElement("button");
      b.textContent = element.interaction!.label;
      b.dataset.element = element.id;
      b.onclick = () => {
        const result = scene.activateAuthored(element.id);
        if (result) {
          notice(result.response, book.locale);
          if (result.sound) soundscape?.cue(result.sound);
        }
      };
      interactions.append(b);
    }
    $(".reader-controls").before(interactions);
  }
  $("#previous").setAttribute("aria-label", t("previous"));
  $("#next").setAttribute(
    "aria-label",
    t(state.page === story.pages.length - 1 ? "library" : "next"),
  );
  $("#replay").setAttribute("aria-label", t("replay"));
  $<HTMLButtonElement>("#previous").disabled = state.page === 0;
  $("#previous").onclick = () => {
    if (shelfBusy || pendingPage) return;
    soundscape?.cue("page");
    state.turn(state.page - 1);
    void showPage(true);
  };
  $("#next").onclick = () => {
    if (shelfBusy || pendingPage) return;
    if (state.page === story.pages.length - 1) void room();
    else {
      soundscape?.cue("page");
      state.turn(state.page + 1);
      void showPage(true);
    }
  };
  $("#play").onclick = async () => {
    if (shelfBusy) return;
    if (!ready) {
      await showPage(true);
      return;
    }
    if (narration.clock.playing) {
      narration.pause();
      state.hide();
    } else {
      const active = narration;
      await active.play();
      if (token !== operation || narration !== active || !ready) return;
      state.play();
    }
    updatePlayback();
  };
  $("#replay").onclick = async () => {
    if (shelfBusy) return;
    if (!ready) {
      await showPage(true);
      return;
    }
    lastHighlight = "";
    const active = narration;
    await active.replay();
    if (token !== operation || narration !== active || !ready) return;
    state.play();
  };
  if (resume) {
    ready = previousReady;
    if (
      page.authored &&
      narrationIssues({
        ...page.authored.book,
        spreads: [page.authored.spread],
      }).length &&
      !page.authored.book.soundtracks?.length
    ) {
      $<HTMLButtonElement>("#play").disabled = true;
      $<HTMLButtonElement>("#replay").disabled = true;
      $("#play-status").textContent = "Narration needs an update";
    }
    updatePlayback();
    return;
  }
  try {
    await scene.spread(story, page, locale);
    if (token !== operation) return;
  } catch (error) {
    if (token === operation && page.authored && transactional) {
      state.hide();
      throw Error(
        `Stage preview failed: ${String(error)}. The previous preview has been restored; retry or revise the asset.`,
      );
    }
    if (token === operation) {
      notice(t("imageError"));
      $("#notice").append(
        Object.assign(document.createElement("button"), {
          textContent: t("retry"),
          onclick: () => void showPage(false),
        }),
      );
    }
  }
  if (token !== operation) return;
  try {
    const authored = page.authored;
    if (
      authored &&
      narrationIssues({ ...authored.book, spreads: [authored.spread] }).length
    ) {
      notice(
        "This spread has missing or stale narration. Replace the affected recording, then validate again. Text and interactions remain available.",
      );
      $("#play-status").textContent = "Narration needs an update";
      if (!authored.book.soundtracks?.length) {
        $<HTMLButtonElement>("#play").disabled = true;
        $<HTMLButtonElement>("#replay").disabled = true;
        state.hide();
        return;
      }
    }
    const loaded = authored
      ? await bookNarration.loadBook(authored.book, state.page)
      : await standardNarration.load(
          page.segments.map(
            (s) => manifest[`${locale.id}/${story.id}/${page.id}/${s.id}`],
          ),
        );
    if (token !== operation || !loaded) return;
    ready = true;
    if (autoplay && !document.hidden) {
      const active = narration;
      await active.play();
      if (token !== operation || !ready || narration !== active) return;
      state.play();
    } else state.hide();
  } catch (error) {
    if (token === operation && page.authored && transactional) {
      state.hide();
      throw Error(
        `Narration preview failed: ${String(error)}. Retry or replace the recording.`,
      );
    }
    if (token === operation) {
      notice(t("audioError"));
      $("#notice").append(
        Object.assign(document.createElement("button"), {
          textContent: t("retry"),
          onclick: () => void showPage(false),
        }),
      );
      $("#play-status").textContent = t("audioError");
      state.hide();
    }
  }
  updatePlayback();
}
async function playToy(id: string) {
  if (shelfBusy || !entered || document.hidden) return;
  const toy = currentToys.find((item) => item.id === id);
  if (!toy?.sound) return;
  try {
    await toyAudio?.play(toy.sound);
  } catch {
    notice("This toy’s sound could not play. Check its audio in Book details.");
  }
}
function updatePlayback() {
  if (!state.book) return;
  const playing = narration?.clock.playing;
  const b = $("#play");
  const label = (playing ? "Ⅱ " : "▶ ") + t(playing ? "pause" : "play");
  if (b && b.textContent !== label) b.textContent = label;
  if (
    playing &&
    ready &&
    (!(narration instanceof BookNarration) || narration.narrationActive)
  ) {
    const segment = narration.clock.segment;
    const key = `${operation}/${segment}`;
    if (key !== lastHighlight) {
      lastHighlight = key;
      const boundary = narration.clock.durations
        .slice(0, segment)
        .reduce((a, b) => a + b, 0);
      const errorMs =
        ((narration.clock.position - boundary) / prefs.speed) * 1000;
      onsetSamples.push({
        locale: locale.id,
        book: state.book!,
        page: state.page,
        segment,
        speed: prefs.speed,
        errorMs,
      });
      if (onsetSamples.length > 1000) onsetSamples.shift();
    }
  }
  document
    .querySelectorAll<HTMLElement>("[data-segment]")
    .forEach((el) =>
      el.classList.toggle(
        "active",
        ready && Number(el.dataset.segment) === narration.clock.segment,
      ),
    );
  const status = $("#play-status");
  if (status && ready) {
    const label = narration.clock.ended ? t("finished") : "";
    if (status.textContent !== label) status.textContent = label;
  }
}
document.addEventListener("visibilitychange", () => {
  soundscape?.pause(
    document.hidden ||
      !!document.querySelector<HTMLDialogElement>("#author-dialog")?.open,
  );
  if (document.hidden) {
    toyAudio?.stop();
    narration?.pause();
    state.hide();
    updatePlayback();
  }
});
function frame() {
  scene?.playback(Boolean(narration?.clock.playing));
  scene?.authoredPlayback(
    narration?.clock.position || 0,
    narration instanceof BookNarration
      ? narration.narrationActive
      : Boolean(narration?.clock.playing),
    narration?.clock.durations,
  );
  soundscape?.narration(Boolean(narration?.clock.playing));
  updatePlayback();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.libraryReview = (time, age, foldProgress, focusAge) =>
  scene?.review(time, age, foldProgress, focusAge);
window.libraryRoomReview = (selection, age) =>
  scene?.reviewRoom(selection, age);
window.libraryDebug = () => ({
  scene: scene?.debug(),
  state: { ...state },
  ready,
  shelf: {
    browsing: browsingShelf,
    busy: shelfBusy,
    inspected: inspectedBook?.key ?? null,
    table: tableKey ?? null,
    books: roomBooks.map((book) => ({ key: book.key, title: book.title })),
    toys: currentToys.map(({ id, label }) => ({ id, label })),
    toyAudioPlaying: toyAudio?.playing ?? false,
  },
  position: narration?.clock.position,
  playing: narration?.clock.playing,
  segment: narration?.clock.segment,
  speed: prefs.speed,
  volume: prefs.volume,
  audio: prefs.audio,
  onsetSamples: [...onsetSamples],
});
async function boot() {
  try {
    locale = await fetchLocale(prefs.language);
    localizeLoader();
    header();
    try {
      const r = await fetch("./audio-manifest.json");
      if (r.ok) manifest = await r.json();
    } catch {
      /* Missing audio retains readable story and retry. */
    }
    scene = new LibraryScene(
      $("#scene"),
      (id) => {
        if (
          !entered ||
          shelfBusy ||
          document.querySelector<HTMLDialogElement>("#author-dialog")?.open
        )
          return;
        if (id.startsWith("shelf:")) void inspectShelfBook(id.slice(6));
        else if (id.startsWith("toy:")) void playToy(id.slice(4));
      },
      () => soundscape?.cue("tap"),
    );
    roomBooks = await roomLibrary.resolve(locale);
    await scene.room(locale, roomBooks);
    window.storyLoading.ready();
    languageDialog(true);
  } catch {
    failure();
  }
}
void boot();
