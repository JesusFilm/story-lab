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
let entering = false,
  figureRequest = 0;
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
    `<a class="brand" href="https://jesusfilm.github.io/story-lab/" aria-label="${escaped(t("back"))}"><span class="brand-star">✦</span><span>${escaped(t("appTitle"))}</span></a><nav>${entered ? button("author", "Author") : ""}${state.book ? button("shelf", "↩ " + escaped(t("library"))) : ""}${button("language", "🌐", "icon")}${button("settings", "⚙", "icon")}</nav>`;
  $("#language").setAttribute("aria-label", t("language"));
  $("#settings").setAttribute("aria-label", t("settings"));
  $("#language").onclick = () => languageDialog(false);
  $("#settings").onclick = settingsDialog;
  if (entered) $("#author").onclick = () => authoring?.open();
  if (state.book) $("#shelf").onclick = () => void room();
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
        const selection = ++operation;
        narration?.stop();
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
            if (state.book) await showPage(false);
            else await room();
          }
        } catch {
          if (selection !== operation) return;
          if (entered && state.book) await showPage(false);
          notice(t("error"));
        }
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
          preview: async (book, page = 0) => {
            const previousDraft = draft;
            const previousDraftLocale = draftLocale;
            const previousState = { ...state };
            draft = structuredClone(book);
            draftLocale = book.locale;
            state.open(book.id, book.spreads.length);
            state.page = Math.min(page, book.spreads.length - 1);
            try {
              await showPage(false, true);
            } catch (error) {
              draft = previousDraft;
              draftLocale = previousDraftLocale;
              Object.assign(state, previousState);
              if (state.book) await showPage(false);
              else await room();
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
    persist();
  };
  $<HTMLInputElement>("#volume").oninput = (e) => {
    prefs.volume = Number((e.target as HTMLInputElement).value);
    narration?.volume(prefs.volume, prefs.audio);
    soundscape?.settings(prefs.volume, prefs.audio);
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
  const token = ++operation;
  if (state.book) {
    narration?.stop();
    await scene.close();
    if (token !== operation) return;
  }
  soundscape?.ambience(true);
  soundscape?.scene("room");
  soundscape?.cue("close");
  state.close();
  narration?.stop();
  narration = standardNarration;
  soundscape?.pause(false);
  notice();
  ready = false;
  document.body.classList.remove("reading");
  header();
  $("#panel").innerHTML =
    `<div class="shelf-heading"><span class="eyebrow">✦ ${escaped(t("library"))}</span><h1>${escaped(t("chooseBook"))}</h1></div><div class="room-view" role="group" aria-label="${escaped(t("lookAround"))}"><span>${escaped(t("lookAround"))}</span><button data-room-look="-1" aria-label="${escaped(t("lookLeft"))}" title="${escaped(t("lookLeft"))}">‹</button><button data-room-look="0" aria-label="${escaped(t("centerView"))}" title="${escaped(t("centerView"))}">↺</button><button data-room-look="1" aria-label="${escaped(t("lookRight"))}" title="${escaped(t("lookRight"))}">›</button></div><div class="book-choices">${locale.stories.map((s) => `<button data-book="${s.id}"><span>${escaped(s.title)}</span><small>${escaped(s.subtitle)}</small><b aria-hidden="true">↗</b></button>`).join("")}</div><div class="figurines" aria-label="${escaped(t("characters"))}">${(["adam", "eve", "noah"] as const).map((c) => `<button data-character="${c}">${escaped(locale.characters[c])} <span aria-hidden="true">♪</span></button>`).join("")}</div>`;
  document
    .querySelectorAll<HTMLButtonElement>("[data-book]")
    .forEach(
      (b) => (b.onclick = () => void openBook(b.dataset.book as StoryId)),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-character]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          void character(b.dataset.character as "adam" | "eve" | "noah")),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-room-look]")
    .forEach((button) => {
      button.onclick = () =>
        scene?.lookRoom(Number(button.dataset.roomLook) as -1 | 0 | 1);
    });
  const shelfSelection = (button: HTMLButtonElement): Selection =>
    button.dataset.book
      ? (button.dataset.book as Selection)
      : button.dataset.character === "noah"
        ? "figure-noah"
        : (button.dataset.character as "adam" | "eve");
  document
    .querySelectorAll<HTMLButtonElement>("[data-book], [data-character]")
    .forEach((button) => {
      const show = () => scene?.focusSelection(shelfSelection(button));
      const clear = () => {
        const focused = document.activeElement;
        scene?.focusSelection(
          focused instanceof HTMLButtonElement &&
            focused.matches("[data-book], [data-character]")
            ? shelfSelection(focused)
            : null,
        );
      };
      button.onfocus = show;
      button.onpointerenter = show;
      button.onblur = clear;
      button.onpointerleave = clear;
    });
  try {
    await scene.room(locale);
    if (token !== operation) return;
    ready = true;
    window.storyLoading.ready();
  } catch {
    failure();
  }
}
async function openBook(id: StoryId) {
  soundscape?.scene(id === "eden" ? "eden" : "hope");
  soundscape?.cue("open");
  state.open(id, draft?.id === id ? draft.spreads.length : 8);
  await showPage(true);
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
async function showPage(autoplay: boolean, transactional = false) {
  const token = ++operation;
  ready = false;
  lastHighlight = "";
  narration.stop();
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
    soundscape?.cue("page");
    state.turn(state.page - 1);
    void showPage(true);
  };
  $("#next").onclick = () => {
    if (state.page === story.pages.length - 1) void room();
    else {
      soundscape?.cue("page");
      state.turn(state.page + 1);
      void showPage(true);
    }
  };
  $("#play").onclick = async () => {
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
async function character(id: "adam" | "eve" | "noah") {
  if (state.book || !entered) return;
  const request = ++figureRequest;
  const token = operation;
  soundscape?.cue("figure");
  scene.tilt(id);
  narration.stop();
  if (!prefs.audio) return;
  try {
    const loaded = await standardNarration.load([
      manifest[`${locale.id}/names/${id}`],
    ]);
    if (
      loaded &&
      request === figureRequest &&
      token === operation &&
      !state.book &&
      !document.hidden
    )
      await narration.play();
  } catch {
    if (request === figureRequest && token === operation)
      notice(t("audioError"));
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
    figureRequest++;
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
        if (!entered) return;
        if (id === "eden" || id === "noah") void openBook(id);
        else void character(id === "figure-noah" ? "noah" : id);
      },
      () => soundscape?.cue("tap"),
    );
    await scene.room(locale);
    window.storyLoading.ready();
    languageDialog(true);
  } catch {
    failure();
  }
}
void boot();
