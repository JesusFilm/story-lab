import "./style.css";
import {
  localeIds,
  type LocaleId,
  type LocaleData,
  type AudioManifest,
  type StoryId,
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
  narration: Narration,
  entered = false,
  ready = false,
  operation = 0;
let soundscape: Soundscape | undefined;
let entering = false,
  figureRequest = 0;
let lastHighlight = "";
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
function notice(message = "") {
  $("#notice").textContent = message;
}
async function fetchLocale(id: LocaleId) {
  const r = await fetch(`./content/${id}.json`);
  if (!r.ok) throw Error("locale");
  return (await r.json()) as LocaleData;
}
function header() {
  $("#header").innerHTML =
    `<a class="brand" href="https://jesusfilm.github.io/story-lab/" aria-label="${escaped(t("back"))}"><span class="brand-star">✦</span><span>${escaped(t("appTitle"))}</span></a><nav>${state.book ? button("shelf", "↩ " + escaped(t("library"))) : ""}${button("language", "🌐", "icon")}${button("settings", "⚙", "icon")}</nav>`;
  $("#language").setAttribute("aria-label", t("language"));
  $("#settings").setAttribute("aria-label", t("settings"));
  $("#language").onclick = () => languageDialog(false);
  $("#settings").onclick = settingsDialog;
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
        narration = new Narration();
        await narration.unlock();
        soundscape = new Soundscape(narration.context);
        soundscape.settings(prefs.volume, prefs.audio);
        narration.speed(prefs.speed);
        narration.volume(prefs.volume, prefs.audio);
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
  soundscape?.scene("room");
  soundscape?.cue("close");
  state.close();
  narration?.stop();
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
      ? (button.dataset.book as StoryId)
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
  state.open(id);
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
async function showPage(autoplay: boolean) {
  const token = ++operation;
  ready = false;
  lastHighlight = "";
  narration.stop();
  notice();
  document.body.classList.add("reading");
  header();
  const story = locale.stories.find((s) => s.id === state.book)!;
  const page = story.pages[state.page];
  soundscape?.scene(
    story.id === "eden" ? "eden" : state.page === 3 ? "storm" : "hope",
  );
  $("#panel").innerHTML =
    `<article class="reader"><div class="reader-meta"><span>${escaped(story.title)}</span><span>${state.page + 1} / 8</span></div><h1>${escaped(page.title)}</h1><div class="story-text">${page.segments.map((s, i) => `<span data-segment="${i}">${escaped(s.text)}</span>`).join(" ")}</div><div class="reader-footer"><small>${escaped(t("source"))} · ${escaped(page.passage)}</small><span id="play-status" role="status">${escaped(t("loading"))}</span></div><div class="reader-controls">${button("previous", "←")}${button("play", "▶ " + escaped(t("play")), "primary")}${button("replay", "↻")}${button("next", "→")}</div></article>`;
  $("#previous").setAttribute("aria-label", t("previous"));
  $("#next").setAttribute(
    "aria-label",
    t(state.page === 7 ? "library" : "next"),
  );
  $("#replay").setAttribute("aria-label", t("replay"));
  $<HTMLButtonElement>("#previous").disabled = state.page === 0;
  $("#previous").onclick = () => {
    soundscape?.cue("page");
    state.turn(state.page - 1);
    void showPage(true);
  };
  $("#next").onclick = () => {
    if (state.page === 7) void room();
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
      await narration.play();
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
    await narration.replay();
    state.play();
  };
  try {
    await scene.spread(story, page, locale);
    if (token !== operation) return;
  } catch {
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
    const cues = page.segments.map(
      (s) => manifest[`${locale.id}/${story.id}/${page.id}/${s.id}`],
    );
    const loaded = await narration.load(cues);
    if (token !== operation || !loaded) return;
    ready = true;
    if (autoplay && !document.hidden) {
      await narration.play();
      state.play();
    } else state.hide();
  } catch {
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
    const loaded = await narration.load([manifest[`${locale.id}/names/${id}`]]);
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
  if (playing && ready) {
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
  soundscape?.pause(document.hidden);
  if (document.hidden) {
    figureRequest++;
    narration?.pause();
    state.hide();
    updatePlayback();
  }
});
function frame() {
  scene?.playback(Boolean(narration?.clock.playing));
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
