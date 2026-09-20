import { Soundscape } from "./soundscape";
import { assetReferences, checkMediaCapacity, mediaSizes } from "./book-media";
import type { AuthoredBook, BookTranslation } from "./authored-book";
import { narrationIssues } from "./authored-book";
import { BookAudio, buildBookTimeline } from "./book-audio";
import {
  productionLanguages,
  auditBook,
  resolveBook,
  translationIssues,
  reviewIssues,
  reviewFingerprint,
  sourceFingerprint,
  sourceTranslation,
  isAssetUsed,
} from "./book-localization";
import {
  authorLanguages,
  translateBook,
  kokoroVoices,
  synthesize,
  blobData,
  translationSlots,
} from "./book-generation";
import { validateBook } from "./book-validation";
import { createProductionPreview } from "./production-preview";

const html = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const languageName = (locale: string) =>
  authorLanguages.find(([id]) => id === locale)?.[1] ?? locale;
const uid = (prefix: string, book: AuthoredBook) => {
  let n = 1;
  while (book.assets[`${prefix}-${n}`]) n++;
  return `${prefix}-${n}`;
};
const numberField = (
  label: string,
  value: number,
  data: string,
  min: number,
  max: number,
  step = 0.1,
) =>
  `<label>${label}<input type="number" required ${data} min="${min}" max="${max}" step="${step}" value="${value}"></label>`;

export function installBookProduction(
  host: HTMLElement,
  options: {
    book: () => AuthoredBook;
    changed: () => void;
    audio: () => AudioContext;
    exportReviewed: () => Promise<void>;
  },
) {
  let visible = false,
    mode = "soundtrack",
    selectedLocale = "",
    selectedPage = 0;
  let player: BookAudio | undefined;
  let interactionAudio: Soundscape | undefined;
  let preview: ReturnType<typeof createProductionPreview> | undefined;
  let resolved: AuthoredBook | undefined;
  let sourceBook: AuthoredBook | undefined;
  let scenePage = -1,
    sceneReady = false,
    loading = false,
    revision = 0;
  let muted = false,
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let queuedPage: number | undefined;
  let apiKey = "",
    model = "google/gemini-3-flash-preview";
  let voices: string[] = [],
    job: AbortController | undefined;
  const viewed = new Set<string>();
  host.innerHTML = `<div class="production-head"><div><p class="eyebrow">Listen · translate · review</p><h2>Book production</h2><p>Build the sound, prepare each language, then review the complete experience.</p></div><nav aria-label="Production sections"><button data-production-tab="soundtrack">Soundtrack</button><button data-production-tab="languages">Languages & voices</button><button data-production-tab="review">Preview & review</button></nav></div><p class="production-status" role="status" aria-live="polite"></p><button class="production-cancel" hidden>Cancel generation</button><div class="production-preview-area"><div class="production-transport"><label>Preview language<select class="production-locale"></select></label><button class="production-load">Load preview</button><button class="production-play" disabled>▶ Play book</button><button class="production-restart" disabled>↺</button><label class="check"><input class="production-mute" type="checkbox"> Mute</label><label class="check"><input class="production-reduced" type="checkbox"> Reduce motion</label></div><div class="production-viewer"><div class="production-stage"></div><article class="production-reading"><h3>Load a preview to review this book</h3><div class="production-text"></div><div class="production-interactions"></div><p class="production-response" role="status"></p></article></div><div class="production-scrubber"><output>0:00 / 0:00</output><input type="range" aria-label="Book timeline position" min="0" max="1" step="0.01" value="0" disabled></div><div class="book-timeline" aria-label="Soundtrack and page timeline"></div></div><section class="production-editor"></section>`;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!;
  const status = (message: string) => {
    $(".production-status").textContent = message;
  };
  const editor = $(".production-editor");
  const changed = () => {
    options.changed();
    invalidate();
  };
  function invalidate() {
    revision++;
    player?.stop();
    resolved = undefined;
    sceneReady = false;
    scenePage = -1;
    preview?.clear();
    $<HTMLButtonElement>(".production-play").setAttribute("disabled", "");
    $<HTMLButtonElement>(".production-restart").setAttribute("disabled", "");
    $<HTMLInputElement>(".production-scrubber input").disabled = true;
    $(".production-text").textContent = "";
    $(".production-reading h3").textContent =
      "Load preview to hear your latest changes";
    $(".production-interactions").replaceChildren();
  }
  const selectedBook = () => resolveBook(options.book(), selectedLocale);
  function timeline() {
    let timeline;
    try {
      timeline =
        resolved && player
          ? player.timeline
          : buildBookTimeline(selectedBook());
    } catch {
      $(".book-timeline").textContent =
        "Complete this language and correct track ranges to show its timeline.";
      return;
    }
    if (!timeline.total) return;
    const percentage = (v: number) => ((100 * v) / timeline.total).toFixed(4);
    $(".book-timeline").innerHTML =
      `<div class="timeline-row timeline-pages"><strong>Pages</strong><div>${timeline.pages.map((page) => `<button data-timeline-page="${page.index}" style="left:${percentage(page.start)}%;width:${percentage(page.duration)}%" title="${html(options.book().spreads[page.index]?.title)} · ${time(page.start)}–${time(page.end)}">${page.index + 1}<small>${time(page.duration)}</small></button>`).join("")}</div></div><div class="timeline-row"><strong>Narration</strong><div>${timeline.clips
        .filter((clip) => clip.kind === "narration")
        .map(
          (clip) =>
            `<span class="timeline-clip narration-clip" style="left:${percentage(clip.start)}%;width:${percentage(clip.end - clip.start)}%" title="Narration ${time(clip.start)}–${time(clip.end)}"></span>`,
        )
        .join("")}</div></div>${(options.book().soundtracks ?? [])
        .map((track) => {
          const clip = timeline.clips.find(
            (item) => item.id === track.id && item.kind === "soundtrack",
          );
          return `<div class="timeline-row"><strong title="${html(track.label)}">${html(track.label)}</strong><div>${clip ? `<span class="timeline-clip music-clip" style="left:${percentage(clip.start)}%;width:${percentage(clip.end - clip.start)}%" title="${html(track.label)} · ${Math.round(track.volume * 100)}% · fade ${track.fadeIn}s / ${track.fadeOut}s"><i style="width:${Math.min(50, (track.fadeIn / (clip.end - clip.start)) * 100)}%"></i><b>${Math.round(track.volume * 100)}%</b><i style="width:${Math.min(50, (track.fadeOut / (clip.end - clip.start)) * 100)}%"></i></span>` : ""}</div></div>`;
        })
        .join(
          "",
        )}<p class="editor-muted">${time(timeline.total)} total · Click a page or scrub above. Page time expands to fit the selected language’s narration. Short tracks end naturally unless Loop is selected.</p>`;
    host.querySelectorAll<HTMLButtonElement>("[data-timeline-page]").forEach(
      (button) =>
        (button.onclick = () => {
          selectedPage = Number(button.dataset.timelinePage);
          if (resolved && player) {
            player.seek(player.timeline.pages[selectedPage].start);
            void showPage(selectedPage);
          } else void loadPreview(selectedPage);
        }),
    );
  }
  async function showPage(index: number) {
    if (!player || !resolved || !preview) return;
    const token = ++revision,
      wasPlaying = player.playing,
      position = player.position;
    player.pause();
    sceneReady = false;
    scenePage = index;
    selectedPage = index;
    const page = resolved.spreads[index],
      timing = player.timeline.pages[index];
    try {
      if (
        !(await preview.load(resolved, index, timing.segmentDurations)) ||
        token !== revision
      )
        return;
      sceneReady = true;
      $(".production-reading").lang = selectedLocale;
      $(".production-reading h3").textContent = `${index + 1}. ${page.title}`;
      $(".production-text").innerHTML = page.segments
        .map(
          (segment, i) =>
            `<p data-preview-segment="${i}">${html(segment.text)}</p>`,
        )
        .join("");
      $(".production-interactions").innerHTML = page.elements
        .filter((element) => element.interaction)
        .map(
          (element) =>
            `<button data-preview-action="${html(element.id)}">${html(element.interaction!.label)}</button>`,
        )
        .join("");
      $(".production-response").textContent = "";
      host.querySelectorAll<HTMLButtonElement>("[data-preview-action]").forEach(
        (button) =>
          (button.onclick = () => {
            const result = preview?.activate(button.dataset.previewAction!);
            $(".production-response").textContent = result?.response ?? "";
            if (result?.sound && !muted) interactionAudio?.cue(result.sound);
          }),
      );
      viewed.add(
        `${selectedLocale}/${page.id}/${reviewFingerprint(options.book(), selectedLocale, page.id)}`,
      );
      if (wasPlaying) {
        player.seek(position);
        await player.play();
      }
      if (mode === "review") renderEditor();
    } catch (error) {
      if (token === revision) {
        player.pause();
        status(String(error));
      }
    }
  }
  async function loadPreview(page = selectedPage) {
    if (job) return;
    if (loading) {
      queuedPage = page;
      return;
    }
    loading = true;
    invalidate();
    const token = revision;
    status("Loading the book’s audio and artwork…");
    try {
      const result = validateBook(options.book());
      if (!result.book)
        throw Error(
          result.errors
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join("\n"),
        );
      resolved = selectedBook();
      player ??= new BookAudio(options.audio());
      interactionAudio ??= new Soundscape(options.audio());
      interactionAudio.ambience(false);
      interactionAudio.settings(1, !muted);
      interactionAudio.pause(false);
      if (!(await player.load(resolved)) || token !== revision) return;
      player.volume(1, !muted);
      preview ??= createProductionPreview($(".production-stage"));
      selectedPage = Math.max(0, Math.min(page, resolved.spreads.length - 1));
      player.seek(player.timeline.pages[selectedPage].start);
      await showPage(selectedPage);
      if (!sceneReady) return;
      $<HTMLButtonElement>(".production-play").disabled = false;
      $<HTMLButtonElement>(".production-restart").disabled = false;
      const scrubber = $<HTMLInputElement>(".production-scrubber input");
      scrubber.max = String(player.timeline.total);
      scrubber.disabled = false;
      timeline();
      const issues = [
        ...translationIssues(options.book(), selectedLocale),
        ...narrationIssues(resolved),
      ];
      status(
        issues.length
          ? `Preview loaded with ${issues.length} issue(s): ${issues.map((issue) => issue.message).join(" ")}`
          : "Preview ready. Listen, try the interactions and check each page before marking it reviewed.",
      );
    } catch (error) {
      invalidate();
      status(String(error));
    } finally {
      loading = false;
      if (visible && queuedPage !== undefined) {
        const next = queuedPage;
        queuedPage = undefined;
        void loadPreview(next);
      }
    }
  }
  async function runJob(task: (signal: AbortSignal) => Promise<void>) {
    if (job) return;
    const controller = new AbortController();
    job = controller;
    player?.pause();
    $(".production-cancel").hidden = false;
    editor
      .querySelectorAll<
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLButtonElement
        | HTMLTextAreaElement
      >("input,select,button,textarea")
      .forEach((field) => (field.disabled = true));
    try {
      await task(controller.signal);
      if (!controller.signal.aborted)
        status(
          "Finished. Check generated text and listen to recordings before marking pages reviewed.",
        );
    } catch (error) {
      status(
        controller.signal.aborted
          ? "Generation cancelled. Completed languages and recordings were kept."
          : String(error),
      );
    } finally {
      job = undefined;
      $(".production-cancel").hidden = true;
      if (visible) {
        renderEditor();
        timeline();
      }
    }
  }
  async function translate(
    languageIds: string[],
    signal: AbortSignal,
    force = false,
  ) {
    const book = options.book();
    for (const locale of languageIds.filter(
      (candidateLocale) => candidateLocale !== book.locale,
    )) {
      if (!force && !translationIssues(book, locale).length) continue;
      status(`Translating all text into ${languageName(locale)}…`);
      const result = await translateBook(
        book,
        locale,
        { key: apiKey, model },
        signal,
      );
      signal.throwIfAborted();
      if (options.book() !== book) return;
      (book.translations ??= {})[locale] = result;
      changed();
    }
  }
  async function generate(languageIds: string[], signal: AbortSignal) {
    const book = options.book();
    if (!voices.length) voices = await kokoroVoices(signal);
    status("Checking media capacity before recording…");
    const sizes = await mediaSizes(book, signal);
    let mediaBytes = [...sizes.values()].reduce((sum, value) => sum + value, 0);
    for (const locale of languageIds) {
      if (translationIssues(book, locale).length)
        throw Error(
          `Translate and check ${languageName(locale)} before generating its narration.`,
        );
      const selected = book.narrationSettings?.[locale] ?? {
        voice: authorLanguages.find(([id]) => id === locale)?.[3] ?? "",
        speed: 1,
      };
      const prefix = authorLanguages.find(([id]) => id === locale)?.[2];
      if (
        !voices.includes(selected.voice) ||
        !prefix ||
        !selected.voice.startsWith(prefix)
      )
        throw Error(
          `Choose an available Kokoro voice for ${languageName(locale)}.`,
        );
      const pages =
        locale === book.locale
          ? book.spreads
          : book.translations![locale].spreads;
      const provenance = `Kokoro ${selected.voice} · ${selected.speed}×`;
      for (const [pageIndex, page] of pages.entries())
        for (const [segmentIndex, segment] of page.segments.entries()) {
          if (
            segment.narration?.recordedText === segment.text &&
            segment.narration.voice === provenance
          )
            continue;
          status(
            `Recording ${languageName(locale)} · page ${pageIndex + 1}/${pages.length} · phrase ${segmentIndex + 1}/${page.segments.length}…`,
          );
          const blob = await synthesize(
            segment.text,
            selected.voice,
            selected.speed,
            signal,
          );
          const buffer = await options
            .audio()
            .decodeAudioData(await blob.arrayBuffer());
          if (buffer.duration < 0.05 || buffer.duration > 180)
            throw Error(
              "The recording is outside the supported 0.05–180 second phrase length.",
            );
          const src = await blobData(blob);
          signal.throwIfAborted();
          if (options.book() !== book) return;
          const old = segment.narration?.asset;
          const removable =
            old && assetReferences(book, old) === 1
              ? sizes.get(old)
              : undefined;
          checkMediaCapacity(
            Object.keys(book.assets).length,
            mediaBytes,
            blob.size,
            removable,
          );
          const id = uid("voice", book);
          book.assets[id] = {
            kind: "audio",
            src,
            attribution: `Generated locally with ${provenance}`,
          };
          segment.narration = {
            asset: id,
            recordedText: segment.text,
            duration: buffer.duration,
            voice: provenance,
          };
          mediaBytes += blob.size;
          sizes.set(id, blob.size);
          if (old && !isAssetUsed(book, old)) {
            mediaBytes -= sizes.get(old) ?? 0;
            sizes.delete(old);
            delete book.assets[old];
          }
          changed();
        }
    }
  }
  function renderSoundtrack() {
    const book = options.book();
    const pageOptions = (value: string) =>
      (!book.spreads.some((page) => page.id === value)
        ? `<option value="${html(value)}" selected>Missing page: ${html(value)} — choose a page</option>`
        : "") +
      book.spreads
        .map(
          (page, i) =>
            `<option value="${html(page.id)}" ${page.id === value ? "selected" : ""}>${i + 1}. ${html(page.title)}</option>`,
        )
        .join("");
    const audio = Object.entries(book.assets).filter(
      ([, asset]) => asset.kind === "audio",
    );
    editor.innerHTML = `<div class="editor-card"><h3>Page timing & mix</h3><p>Set a minimum time for each page. Narration can extend it, so no words are cut off. Soundtrack ranges follow page IDs when pages move.</p><div class="production-fields">${numberField("Narration volume (0–1)", book.narrationVolume ?? 1, 'data-mix="narration"', 0, 1, 0.05)}${book.spreads.map((page, i) => numberField(`Page ${i + 1} minimum seconds`, page.seconds ?? 8, `data-page-seconds="${i}"`, 1, 600)).join("")}</div></div><div class="editor-card"><div class="editor-card-heading"><h3>Soundtrack layers</h3><button data-production-action="add-track" ${!audio.length || !book.spreads.length ? "disabled" : ""}>＋ Add track</button><label class="file-button">Import soundtrack<input class="soundtrack-file" type="file" accept="audio/wav,audio/mpeg,audio/ogg"></label></div><p>Layer music and ambience across one or more pages. Fade times are seconds; volume is a fraction of the original recording.</p>${
      (book.soundtracks ?? [])
        .map(
          (track, i) =>
            `<fieldset class="soundtrack-card"><legend>Track ${i + 1}</legend><div class="production-fields"><label>Name<input data-track="${i}" data-track-field="label" value="${html(track.label)}"></label><label>Audio<select data-track="${i}" data-track-field="asset">${audio.map(([id]) => `<option value="${html(id)}" ${id === track.asset ? "selected" : ""}>${html(id)}</option>`).join("")}</select></label><label>Starts on page<select data-track="${i}" data-track-field="startPage">${pageOptions(track.startPage)}</select></label><label>Ends on page<select data-track="${i}" data-track-field="endPage">${pageOptions(track.endPage)}</select></label>${(
              [
                ["volume", "Volume (0–1)", 1],
                ["fadeIn", "Fade in seconds", 60],
                ["fadeOut", "Fade out seconds", 60],
                ["startOffset", "Trim from start (seconds)", 600],
                ["endOffset", "Trim from end (seconds)", 600],
              ] as const
            )
              .map(([field, label, max]) =>
                numberField(
                  label,
                  track[field],
                  `data-track="${i}" data-track-field="${field}"`,
                  0,
                  max,
                  field === "volume" ? 0.05 : 0.1,
                ),
              )
              .join(
                "",
              )}<label class="check"><input type="checkbox" data-track="${i}" data-track-field="loop" ${track.loop ? "checked" : ""}> Loop recording to fill range</label></div><button data-remove-track="${i}">Remove track</button></fieldset>`,
        )
        .join("") ||
      `<p class="editor-muted">Import a recording or select an existing audio asset to add the first layer.</p>`
    }</div>`;
  }
  function renderLanguages() {
    const book = options.book(),
      languages = productionLanguages(book);
    const setting = book.narrationSettings?.[selectedLocale] ?? {
      voice: authorLanguages.find(([id]) => id === selectedLocale)?.[3] ?? "",
      speed: 1,
    };
    const prefix = authorLanguages.find(([id]) => id === selectedLocale)?.[2];
    const available = voices.filter((voice) => voice.startsWith(prefix ?? "?"));
    if (setting.voice && !available.includes(setting.voice))
      available.unshift(setting.voice);
    const translation = book.translations?.[selectedLocale];
    editor.innerHTML = `<div class="editor-card"><h3>Book languages</h3><p>The original text is ${html(languageName(book.locale))}. Select the languages you intend to release. Generated text remains a draft for an author to check.</p><div class="production-language-list">${authorLanguages.map(([locale, name]) => `<label class="check"><input data-book-language="${locale}" type="checkbox" ${languages.includes(locale) ? "checked" : ""} ${locale === book.locale ? "disabled" : ""}> ${name}</label>`).join("")}</div><button data-production-action="all-languages">Select all nine languages</button></div><div class="editor-card"><h3>Translation · OpenRouter</h3><p>Only the book’s text is sent to OpenRouter when you choose Generate. Your key stays in memory for this editor session and is never saved in a book.</p><div class="production-fields"><label>OpenRouter API key<input class="openrouter-key" type="password" autocomplete="off" spellcheck="false" placeholder="Enter API key"></label><label>OpenRouter model<input class="openrouter-model" value="${html(model)}" spellcheck="false"></label></div><button data-production-action="clear-key">Clear key</button><button data-production-action="translate-all" class="primary">Generate missing / outdated translations</button><button data-production-action="translate-one" ${selectedLocale === book.locale ? "disabled" : ""}>Regenerate ${html(languageName(selectedLocale))} text</button><p class="editor-muted">Regenerate replaces the selected translation. Unchanged recordings are kept; changed phrases need new narration. Use a model that supports structured outputs, such as google/gemini-3-flash-preview.</p></div><div class="editor-card"><h3>Narration · local Kokoro</h3><p>Start Kokoro Voice Lab on this computer (port 8770), then connect. Generation works in the local development editor. Exported books contain their recordings and need no service.</p><button data-production-action="connect-kokoro">${voices.length ? `Reconnect · ${voices.length} voices` : "Connect to Kokoro"}</button><div class="production-fields"><label>Voice for ${html(languageName(selectedLocale))}<select class="kokoro-voice">${available.map((voice) => `<option ${voice === setting.voice ? "selected" : ""}>${html(voice)}</option>`).join("")}</select></label>${numberField("Recording speed", setting.speed, 'class="kokoro-speed"', 0.5, 2, 0.05)}</div><button data-production-action="voices-all" class="primary">Generate narration for all selected languages</button><button data-production-action="voices-one">Generate ${html(languageName(selectedLocale))} narration</button><p class="editor-muted">Current recordings with the chosen voice and speed are skipped. Completed recordings are saved as the batch runs; Cancel keeps them.</p></div><div class="editor-card"><h3>Check and edit ${html(languageName(selectedLocale))}</h3>${
      selectedLocale === book.locale
        ? `<p>Edit the original text in On the book or Spreads.</p>`
        : translation
          ? `<p>${
              translationIssues(book, selectedLocale).length
                ? "This language needs attention: " +
                  html(
                    translationIssues(book, selectedLocale)
                      .map((issue) => issue.message)
                      .join(" "),
                  )
                : "Translation matches the current source version."
            }</p><div class="translation-fields">${translationSlots(translation)
              .map(
                (slot, i) =>
                  `<label>${html(slot.label)}<small>Source: ${html(translationSlots(sourceTranslation(book))[i]?.get() ?? "")}</small><textarea rows="2" data-translation-slot="${i}">${html(slot.get())}</textarea></label>`,
              )
              .join(
                "",
              )}</div><button data-production-action="translation-current">I checked this translation against the current source</button>`
          : `<p>Generate this language to begin editing its text.</p>`
    }</div>`;
    $<HTMLInputElement>(".openrouter-key").value = apiKey;
  }
  function renderReview() {
    const book = options.book(),
      audit = auditBook(book);
    const issueCount = audit.reduce(
      (sum, language) =>
        sum +
        language.issues.length +
        language.pages.reduce((count, page) => count + page.issues.length, 0),
      0,
    );
    editor.innerHTML = `<div class="editor-card"><div class="editor-card-heading"><h3>Author review</h3><button data-production-action="export-reviewed" class="primary" ${issueCount ? "disabled" : ""}>Export reviewed book</button></div><p>For every selected language, listen to narration and soundtrack, inspect text and animation, and try the interactions. Marking a page records your own review, not an automated quality check. Do so only after checking its current content. Changes invalidate its review.</p><p class="review-summary">${issueCount ? `${issueCount} item(s) still need attention.` : "Every selected language and page is reviewed. Export will also validate all media."}</p><div class="review-grid">${audit
      .map(
        (language) =>
          `<section><h4>${html(languageName(language.locale))}</h4>${language.pages
            .map((page) => {
              const problems = [
                ...language.issues,
                ...page.issues.filter(
                  (issue) => !issue.path.startsWith("/reviews/"),
                ),
              ];
              const canMark =
                !problems.length &&
                viewed.has(`${language.locale}/${page.id}/${page.fingerprint}`);
              return `<div class="review-page ${page.reviewed ? "reviewed" : ""}"><button data-review-preview="${page.index}" data-review-locale="${html(language.locale)}">${page.reviewed ? "✓" : "○"} Page ${page.index + 1} · ${html(book.spreads[page.index].title)}</button><small>${page.reviewed ? "Reviewed" : problems.length ? html(problems.map((issue) => issue.message).join(" ")) : "Preview, then mark reviewed"}</small><button data-review-mark="${page.index}" data-review-locale="${html(language.locale)}" ${canMark ? "" : "disabled"}>I reviewed this page</button></div>`;
            })
            .join("")}</section>`,
      )
      .join("")}</div></div>`;
  }
  function renderEditor() {
    host
      .querySelectorAll<HTMLButtonElement>("[data-production-tab]")
      .forEach((button) =>
        button.classList.toggle(
          "selected",
          button.dataset.productionTab === mode,
        ),
      );
    $(".production-preview-area").classList.toggle(
      "compact-preview",
      mode === "languages",
    );
    if (mode === "soundtrack") renderSoundtrack();
    else if (mode === "languages") renderLanguages();
    else renderReview();
  }
  function locales() {
    const book = options.book(),
      languages = productionLanguages(book);
    if (!languages.includes(selectedLocale)) selectedLocale = book.locale;
    $(".production-locale").innerHTML = languages
      .map(
        (locale) =>
          `<option value="${html(locale)}" ${locale === selectedLocale ? "selected" : ""}>${html(languageName(locale))}</option>`,
      )
      .join("");
  }
  host.addEventListener("input", (event) => {
    const field = event.target as HTMLInputElement;
    if (field.matches(".openrouter-key")) apiKey = field.value;
    if (field.matches(".openrouter-model")) model = field.value;
  });
  host.addEventListener("change", (event) => {
    const field = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement,
      book = options.book();
    if (job) return;
    if (field.matches(".production-locale")) {
      selectedLocale = field.value;
      invalidate();
      renderEditor();
      timeline();
      return;
    }
    if (field.matches(".production-mute")) {
      muted = (field as HTMLInputElement).checked;
      player?.volume(1, !muted);
      interactionAudio?.settings(1, !muted);
      return;
    }
    if (field.matches(".production-reduced")) {
      reduced = (field as HTMLInputElement).checked;
      return;
    }
    if (field.matches(".kokoro-voice,.kokoro-speed")) {
      const speed = Number($<HTMLInputElement>(".kokoro-speed").value);
      if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) {
        status("Recording speed must be between 0.5 and 2.");
        return;
      }
      (book.narrationSettings ??= {})[selectedLocale] = {
        voice: $<HTMLSelectElement>(".kokoro-voice").value,
        speed,
      };
      options.changed();
      return;
    }
    if (field.dataset.bookLanguage) {
      const selected = new Set(productionLanguages(book));
      if ((field as HTMLInputElement).checked)
        selected.add(field.dataset.bookLanguage);
      else selected.delete(field.dataset.bookLanguage);
      book.languages = [...selected];
      changed();
      locales();
      renderEditor();
      timeline();
      return;
    }
    if (field.dataset.translationSlot !== undefined) {
      translationSlots(book.translations![selectedLocale])[
        Number(field.dataset.translationSlot)
      ].set(field.value);
      changed();
      return;
    }
    if (field.dataset.track !== undefined) {
      const track = book.soundtracks![Number(field.dataset.track)];
      const key = field.dataset.trackField!;
      let value: string | number | boolean = field.value;
      if (field instanceof HTMLInputElement && field.type === "checkbox")
        value = field.checked;
      else if (field instanceof HTMLInputElement && field.type === "number") {
        if (!field.checkValidity()) {
          field.reportValidity();
          return;
        }
        value = Number(field.value);
      }
      Object.assign(track, { [key]: value });
      changed();
      timeline();
      return;
    }
    if (field.dataset.pageSeconds !== undefined || field.dataset.mix) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
      if (field.dataset.mix) book.narrationVolume = Number(field.value);
      else
        book.spreads[Number(field.dataset.pageSeconds)].seconds = Number(
          field.value,
        );
      changed();
      timeline();
      return;
    }
    if (field.matches(".soundtrack-file"))
      void runJob(async (signal) => {
        const file = (field as HTMLInputElement).files?.[0];
        if (!file) return;
        if (
          !["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg"].includes(
            file.type,
          )
        )
          throw Error("Choose a WAV, MP3 or Ogg soundtrack.");
        if (file.size > 32 * 1024 * 1024)
          throw Error("Choose a soundtrack smaller than 32 MiB.");
        const buffer = await options
          .audio()
          .decodeAudioData(await file.arrayBuffer());
        if (!buffer.duration) throw Error("This recording has no audio.");
        const sizes = await mediaSizes(book, signal);
        checkMediaCapacity(
          Object.keys(book.assets).length,
          [...sizes.values()].reduce((sum, value) => sum + value, 0),
          file.size,
        );
        const src = await blobData(file);
        signal.throwIfAborted();
        if (options.book() !== book) return;
        const id = uid("soundtrack", book);
        book.assets[id] = {
          kind: "audio",
          src,
          attribution: "Creator-supplied soundtrack",
        };
        addTrack(id, file.name);
        changed();
      });
  });
  function addTrack(asset?: string, label?: string) {
    const book = options.book();
    if (!book.spreads.length) throw Error("Add a page first.");
    asset ??= Object.keys(book.assets).find(
      (id) => book.assets[id].kind === "audio",
    );
    if (!asset) return;
    const tracks = (book.soundtracks ??= []);
    if (tracks.length >= 32) {
      status("This book supports up to 32 soundtrack layers.");
      return;
    }
    let n = 1;
    while (tracks.some((track) => track.id === `track-${n}`)) n++;
    tracks.push({
      id: `track-${n}`,
      label: label ?? `Soundtrack ${n}`,
      asset,
      startPage: book.spreads[0].id,
      endPage: book.spreads.at(-1)!.id,
      startOffset: 0,
      endOffset: 0,
      volume: 0.3,
      fadeIn: 1,
      fadeOut: 1,
      loop: false,
    });
  }
  host.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button) return;
    if (button.matches(".production-cancel")) {
      job?.abort();
      return;
    }
    if (job) return;
    if (button.dataset.productionTab) {
      mode = button.dataset.productionTab;
      renderEditor();
      return;
    }
    if (button.matches(".production-load")) {
      void loadPreview();
      return;
    }
    if (button.matches(".production-play")) {
      if (player?.playing) player.pause();
      else if (sceneReady)
        void player?.play().catch((error) => status(String(error)));
      return;
    }
    if (button.matches(".production-restart")) {
      player?.pause();
      player?.seek(0);
      void showPage(0);
      return;
    }
    if (button.dataset.removeTrack !== undefined) {
      options.book().soundtracks!.splice(Number(button.dataset.removeTrack), 1);
      changed();
      renderEditor();
      timeline();
      return;
    }
    if (button.dataset.reviewPreview !== undefined) {
      selectedLocale = button.dataset.reviewLocale!;
      selectedPage = Number(button.dataset.reviewPreview);
      locales();
      void loadPreview(selectedPage);
      return;
    }
    if (button.dataset.reviewMark !== undefined) {
      const book = options.book(),
        locale = button.dataset.reviewLocale!,
        page = book.spreads[Number(button.dataset.reviewMark)];
      const fingerprint = reviewFingerprint(book, locale, page.id);
      book.reviews = (book.reviews ?? []).filter(
        (review) => review.locale !== locale || review.pageId !== page.id,
      );
      book.reviews.push({
        locale,
        pageId: page.id,
        fingerprint,
        reviewedAt: new Date().toISOString(),
      });
      options.changed();
      renderEditor();
      return;
    }
    const action = button.dataset.productionAction;
    if (action === "clear-key") {
      apiKey = "";
      renderEditor();
      status("API key cleared from this editor session.");
    }
    if (action === "all-languages") {
      options.book().languages = [
        ...new Set([
          options.book().locale,
          ...authorLanguages.map(([locale]) => locale),
        ]),
      ];
      changed();
      locales();
      renderEditor();
    }
    if (action === "translate-all")
      void runJob((signal) =>
        translate(productionLanguages(options.book()), signal),
      );
    if (action === "translate-one")
      void runJob((signal) => translate([selectedLocale], signal, true));
    if (action === "connect-kokoro")
      void runJob(async (signal) => {
        status("Connecting to local Kokoro…");
        voices = await kokoroVoices(signal);
      });
    if (action === "voices-all")
      void runJob((signal) =>
        generate(productionLanguages(options.book()), signal),
      );
    if (action === "voices-one")
      void runJob((signal) => generate([selectedLocale], signal));
    if (action === "translation-current") {
      const book = options.book();
      book.translations![selectedLocale].sourceFingerprint =
        sourceFingerprint(book);
      changed();
      renderEditor();
    }
    if (action === "add-track") {
      addTrack();
      changed();
      renderEditor();
      timeline();
    }
    if (action === "export-reviewed")
      void runJob(async () => {
        if (reviewIssues(options.book()).length)
          throw Error("Review every selected language and page first.");
        await options.exportReviewed();
      });
  });
  $<HTMLInputElement>(".production-scrubber input").oninput = (event) => {
    if (!player || !resolved) return;
    player.seek(Number((event.target as HTMLInputElement).value));
    const found = player.timeline.pages.findIndex(
      (page) => player!.position < page.end,
    );
    const index = found < 0 ? player.timeline.pages.length - 1 : found;
    if (index >= 0 && index !== scenePage) void showPage(index);
  };
  $<HTMLInputElement>(".production-reduced").checked = reduced;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) player?.pause();
    interactionAudio?.pause(document.hidden || !visible);
  });
  function frame() {
    if (visible && player && resolved) {
      interactionAudio?.narration(player.playing);
      const position = player.position,
        index = Math.max(
          0,
          player.timeline.pages.findIndex((page) => position < page.end),
        );
      if (position < player.timeline.total && index !== scenePage)
        void showPage(index);
      if (sceneReady && scenePage >= 0) {
        const timing = player.timeline.pages[scenePage];
        const narrationCurrent = resolved.spreads[scenePage].segments.every(
          (segment) => segment.narration?.recordedText === segment.text,
        );
        preview?.update(
          position - timing.start,
          player.playing,
          reduced,
          narrationCurrent,
        );
        let end = timing.start,
          active = -1;
        for (const [i, duration] of timing.segmentDurations.entries()) {
          end += duration;
          if (position < end) {
            active = i;
            break;
          }
        }
        host
          .querySelectorAll<HTMLElement>("[data-preview-segment]")
          .forEach((line) =>
            line.classList.toggle(
              "active",
              narrationCurrent &&
                Number(line.dataset.previewSegment) === active,
            ),
          );
      }
      $(".production-scrubber output").textContent =
        `${time(position)} / ${time(player.timeline.total)}`;
      $<HTMLInputElement>(".production-scrubber input").value =
        String(position);
      $<HTMLButtonElement>(".production-play").textContent = player.playing
        ? "Ⅱ Pause"
        : "▶ Play book";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    show(page?: number) {
      visible = true;
      host.hidden = false;
      if (sourceBook !== options.book()) {
        sourceBook = options.book();
        selectedLocale = sourceBook.locale;
        selectedPage = 0;
        viewed.clear();
        invalidate();
      }
      if (page !== undefined) {
        selectedPage = page;
        mode = "review";
      }
      locales();
      renderEditor();
      timeline();
      if (page !== undefined) void loadPreview(page);
    },
    hide() {
      visible = false;
      queuedPage = undefined;
      host.hidden = true;
      job?.abort();
      interactionAudio?.pause(true);
      invalidate();
    },
  };
}
