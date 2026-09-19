import { installVisualEditor } from "./visual-editor";
import type {
  AuthoredBook,
  BookAsset,
  BookElement,
  BookIssue,
  BookSpread,
} from "./authored-book";
import { validateBook, validateBookAssets } from "./book-validation";

export class BookHistory {
  private entries: AuthoredBook[] = [];
  get current() {
    return this.entries.at(-1);
  }
  get previous() {
    return this.entries.at(-2);
  }
  get canUndo() {
    return this.entries.length > 1;
  }
  commit(book: AuthoredBook) {
    this.entries.push(structuredClone(book));
    if (this.entries.length > 10) this.entries.shift();
  }
  undo() {
    if (this.canUndo) this.entries.pop();
    return this.current;
  }
}

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
const describe = (issues: BookIssue[]) =>
  issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");

export async function assetBytes(asset: BookAsset): Promise<Blob> {
  const response = await fetch(
    asset.src.startsWith("data:") ? asset.src : `./${asset.src}`,
  );
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (blob.size > 32 * 1024 * 1024) throw Error("Asset exceeds 32 MiB");
  const mime: Record<string, string> = {
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    wav: "audio/wav",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
  };
  const type = asset.src.startsWith("data:")
    ? blob.type
    : mime[asset.src.split(".").at(-1)!];
  return type ? new Blob([blob], { type }) : blob;
}

export async function portableBook(book: AuthoredBook): Promise<AuthoredBook> {
  const copy = structuredClone(book);
  let size = 0;
  for (const asset of Object.values(copy.assets)) {
    const blob = await assetBytes(asset);
    size += blob.size;
    if (size > 96 * 1024 * 1024)
      throw Error("Package exceeds 96 MiB decoded media");
    asset.src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  return copy;
}

export function createBlankBook(): AuthoredBook {
  return {
    format: "little-light-book",
    version: 1,
    id: "new-book",
    title: "Untitled book",
    subtitle: "A new interactive story",
    locale: "en-US",
    status: "draft",
    source: "Source not yet specified.",
    retellingNote: "Draft retelling; add the source and adaptation note.",
    cover: "",
    assets: {},
    spreads: [],
  };
}

const firstAsset = (book: AuthoredBook, kind: "image" | "audio") =>
  Object.entries(book.assets).find(([, asset]) => asset.kind === kind)?.[0] ||
  "";

export function createBlankSpread(book: AuthoredBook): BookSpread {
  const image = firstAsset(book, "image");
  const audio = firstAsset(book, "audio");
  return {
    id: `spread-${book.spreads.length + 1}`,
    title: "New spread",
    source: "",
    stagingNote:
      "Describe the visual staging and what is invented for the scene.",
    segments: [
      {
        id: "segment-1",
        text: "Add the first narration phrase.",
        ...(audio
          ? {
              narration: {
                asset: audio,
                recordedText: "Add the first narration phrase.",
                duration: 1,
                voice: "creator",
              },
            }
          : {}),
      },
    ],
    backdrop: { asset: image },
    elements: image
      ? [
          {
            id: "element-1",
            label: "New element",
            kind: "prop",
            asset: image,
            placement: {
              x: 0,
              depth: 0,
              width: 1.2,
              height: 1.2,
              anchor: "bottom",
              elevation: 0,
              rotation: 0,
            },
          },
        ]
      : [],
  };
}

const getPath = (root: unknown, path: string) =>
  path.split(".").reduce<unknown>((value, part) => {
    if (value === undefined || value === null) return undefined;
    return (value as Record<string, unknown>)[part];
  }, root);

export function setEditorPath(root: unknown, path: string, value: unknown) {
  const parts = path.split(".");
  const leaf = parts.pop()!;
  const parent = parts.reduce<unknown>((current, part) => {
    if (current === undefined || current === null) return undefined;
    return (current as Record<string, unknown>)[part];
  }, root);
  if (parent && typeof parent === "object")
    (parent as Record<string, unknown>)[leaf] = value;
}

const input = (
  label: string,
  path: string,
  value: unknown,
  type = "text",
  help = "",
) =>
  `<label class="editor-field"><span>${escapeHtml(label)}</span><input data-path="${path}" type="${type}" value="${escapeHtml(value)}" ${type === "number" ? 'step="any"' : ""}>${help ? `<small>${escapeHtml(help)}</small>` : ""}</label>`;
const textarea = (label: string, path: string, value: unknown, help = "") =>
  `<label class="editor-field editor-wide"><span>${escapeHtml(label)}</span><textarea data-path="${path}" rows="3">${escapeHtml(value)}</textarea>${help ? `<small>${escapeHtml(help)}</small>` : ""}</label>`;
const select = (
  label: string,
  path: string,
  value: unknown,
  options: Array<[string, string]>,
  help = "",
) =>
  `<label class="editor-field"><span>${escapeHtml(label)}</span><select data-path="${path}">${options.map(([option, labelText]) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(labelText)}</option>`).join("")}</select>${help ? `<small>${escapeHtml(help)}</small>` : ""}</label>`;

const imageOptions = (book: AuthoredBook, value: string, allowBlank = false) =>
  [
    ...(allowBlank ? [["", "No image"] as [string, string]] : []),
    ...Object.entries(book.assets)
      .filter(([, asset]) => asset.kind === "image")
      .map(([id]) => [id, id] as [string, string]),
  ]
    .map(
      ([id, label]) =>
        `<option value="${escapeHtml(id)}" ${id === value ? "selected" : ""}>${escapeHtml(label)}</option>`,
    )
    .join("");

function renderSpreadEditor(book: AuthoredBook, activeSpread: number) {
  const spread = book.spreads[activeSpread];
  if (!spread)
    return `<div class="editor-empty"><h2>No spread yet</h2><p>Add an asset, then add a spread. A spread contains text, narration, staging, ground art and independently placed elements.</p><button data-author-action="add-spread" class="primary">Add first spread</button></div>`;
  const imageSelect = (
    label: string,
    path: string,
    value: string,
    blank = false,
  ) =>
    `<label class="editor-field"><span>${escapeHtml(label)}</span><select data-path="${path}">${imageOptions(book, value, blank)}</select></label>`;
  const segmentMarkup = spread.segments
    .map((segment, index) => {
      const narration = segment.narration;
      const path = `spreads.${activeSpread}.segments.${index}`;
      return `<fieldset class="editor-card"><legend>Phrase ${index + 1} <button data-author-action="remove-segment" data-index="${index}" title="Remove phrase">Remove</button></legend>${input("Segment ID", `${path}.id`, segment.id)}${textarea("Text", `${path}.text`, segment.text, "Readable retelling. Use Speak text to dictate when supported.")}<button data-author-action="dictate" data-path="${path}.text">Speak text</button><div class="editor-subcard"><strong>Narration cue</strong>${
        narration
          ? `${select(
              "Audio asset",
              `${path}.narration.asset`,
              narration.asset,
              [
                ["", "Remove narration"],
                ...Object.entries(book.assets)
                  .filter(([, asset]) => asset.kind === "audio")
                  .map(([id]) => [id, id] as [string, string]),
              ],
            )}${input("Recorded text", `${path}.narration.recordedText`, narration.recordedText, "text", "Must match Text exactly.")}${input("Measured duration (seconds)", `${path}.narration.duration`, narration.duration, "number")}${input("Voice", `${path}.narration.voice`, narration.voice)}<button data-author-action="replace-narration" data-index="${index}">Import narration audio</button>`
          : `<p class="editor-muted">No audio cue yet. Text remains readable and validation will identify missing narration.</p><button data-author-action="add-narration" data-index="${index}">Add narration cue</button>`
      }</div></fieldset>`;
    })
    .join("");
  const elementMarkup = spread.elements
    .map((element, index) => {
      const path = `spreads.${activeSpread}.elements.${index}`;
      const motion = element.motion;
      const interaction = element.interaction;
      const imageAssets = Object.entries(book.assets)
        .filter(([, asset]) => asset.kind === "image")
        .map(([id]) => [id, id] as [string, string]);
      return `<fieldset class="editor-card"><legend>${escapeHtml(element.label || `Element ${index + 1}`)} <button data-author-action="remove-element" data-index="${index}" title="Remove element">Remove</button></legend><div class="editor-grid">${input("Element ID", `${path}.id`, element.id)}${input("Label", `${path}.label`, element.label)}${select(
        "Kind",
        `${path}.kind`,
        element.kind,
        [
          ["actor", "Actor"],
          ["prop", "Prop"],
        ],
      )}${select("Image asset", `${path}.asset`, element.asset, imageAssets)}</div><div class="editor-subcard"><strong>Pose and placement</strong><div class="editor-grid">${element.pose ? `${input("Pose cell", `${path}.pose.index`, element.pose.index, "number")}${input("Atlas columns", `${path}.pose.columns`, element.pose.columns, "number")}<button data-author-action="toggle-pose" data-index="${index}">Use full image</button>` : `<button data-author-action="toggle-pose" data-index="${index}">Use atlas pose</button>`}${input("X", `${path}.placement.x`, element.placement.x, "number", "Page units; left is negative.")}${input("Depth", `${path}.placement.depth`, element.placement.depth, "number")}${input("Width", `${path}.placement.width`, element.placement.width, "number")}${input("Height", `${path}.placement.height`, element.placement.height, "number")}${select(
        "Anchor",
        `${path}.placement.anchor`,
        element.placement.anchor || "bottom",
        [
          ["bottom", "Bottom"],
          ["center", "Center"],
        ],
      )}${input("Elevation", `${path}.placement.elevation`, element.placement.elevation ?? 0, "number")}${input("Rotation degrees", `${path}.placement.rotation`, element.placement.rotation ?? 0, "number")}</div></div><div class="editor-subcard"><strong>Motion</strong>${
        motion
          ? `<div class="editor-grid">${select("Preset", `${path}.motion.preset`, motion.preset, [["rock", "Rock whole card"]])}${select(
              "Trigger",
              `${path}.motion.trigger`,
              motion.trigger,
              [
                ["open", "When spread opens"],
                ["interaction", "After interaction"],
                ["narration", "During narration"],
              ],
            )}${
              motion.trigger === "narration"
                ? select(
                    "Narration segment",
                    `${path}.motion.segment`,
                    motion.segment || "",
                    spread.segments.map(
                      (item) => [item.id, item.id] as [string, string],
                    ),
                  )
                : ""
            }${input("Delay seconds", `${path}.motion.delay`, motion.delay ?? 0, "number")}${input("Duration seconds", `${path}.motion.duration`, motion.duration, "number")}${input("Strength degrees", `${path}.motion.strength`, motion.strength, "number")}${input("Repeats", `${path}.motion.repeat`, motion.repeat ?? 1, "number")}</div><button data-author-action="toggle-motion" data-index="${index}">Remove motion</button>`
          : `<button data-author-action="toggle-motion" data-index="${index}">Add motion cue</button>`
      }</div><div class="editor-subcard"><strong>Interaction</strong>${
        interaction
          ? `${input("Button label", `${path}.interaction.label`, interaction.label)}${input("Response", `${path}.interaction.response`, interaction.response)}${select(
              "Sound",
              `${path}.interaction.sound`,
              interaction.sound || "",
              [
                ["", "None"],
                ["tap", "Paper tap"],
              ],
            )}<button data-author-action="toggle-interaction" data-index="${index}">Remove interaction</button>`
          : `<button data-author-action="toggle-interaction" data-index="${index}">Add keyboard/pointer interaction</button>`
      }</div></fieldset>`;
    })
    .join("");
  return `<div class="editor-split"><aside class="spread-list"><h2>Spreads</h2>${book.spreads.map((item, index) => `<button class="${index === activeSpread ? "selected" : ""}" data-author-action="select-spread" data-index="${index}">${index + 1}. ${escapeHtml(item.title || item.id)}</button>`).join("")}<button data-author-action="add-spread" class="primary">+ Add spread</button></aside><section class="spread-workspace"><div class="editor-card"><div class="editor-card-heading"><h2>Spread setup</h2><button data-author-action="remove-spread" data-index="${activeSpread}">Delete spread</button></div><div class="editor-grid">${input("Spread ID", `spreads.${activeSpread}.id`, spread.id)}${input("Heading", `spreads.${activeSpread}.title`, spread.title)}${input("Source reference", `spreads.${activeSpread}.source`, spread.source)}${imageSelect("Upright backdrop", `spreads.${activeSpread}.backdrop.asset`, spread.backdrop.asset)}</div>${textarea("Staging note", `spreads.${activeSpread}.stagingNote`, spread.stagingNote, "Keep source, retelling and visual staging distinct.")}${spread.ground ? `<div class="editor-subcard"><strong>Ground print</strong><div class="editor-grid">${imageSelect("Ground art", `spreads.${activeSpread}.ground.asset`, spread.ground.asset)}${input("Ground X", `spreads.${activeSpread}.ground.x`, spread.ground.x, "number")}${input("Ground depth", `spreads.${activeSpread}.ground.depth`, spread.ground.depth, "number")}${input("Ground width", `spreads.${activeSpread}.ground.width`, spread.ground.width, "number")}${input("Ground height", `spreads.${activeSpread}.ground.height`, spread.ground.height, "number")}${input("Opacity", `spreads.${activeSpread}.ground.opacity`, spread.ground.opacity ?? 1, "number")}</div><button data-author-action="toggle-ground">Remove ground print</button></div>` : `<button data-author-action="toggle-ground">Add ground print</button>`}</div><div class="editor-card"><div class="editor-card-heading"><h2>Text and narration</h2><button data-author-action="add-segment">+ Add phrase</button></div>${segmentMarkup}</div><div class="editor-card"><div class="editor-card-heading"><h2>Actors and props</h2><button data-author-action="add-element">+ Add element</button></div>${elementMarkup || `<p class="editor-muted">No elements yet. Add an actor or prop after registering an image asset.</p>`}</div></section></div>`;
}

type NewAssetDraft = {
  id: string;
  kind: "image" | "audio";
  attribution: string;
  src: string;
};

function renderAssets(book: AuthoredBook, draft: NewAssetDraft) {
  const rows = Object.entries(book.assets)
    .map(
      ([id, asset]) =>
        `<fieldset class="editor-card asset-row"><legend>${escapeHtml(id)} <button data-author-action="remove-asset" data-asset="${escapeHtml(id)}">Remove</button></legend><div class="editor-grid"><label class="editor-field"><span>Asset ID</span><input value="${escapeHtml(id)}" readonly><small>IDs are stable references used by spreads and narration.</small></label>${select(
          "Kind",
          `assets.${id}.kind`,
          asset.kind,
          [
            ["image", "Image"],
            ["audio", "Audio"],
          ],
        )}${input("Public path or data URI", `assets.${id}.src`, asset.src)}${input("Attribution", `assets.${id}.attribution`, asset.attribution)}</div></fieldset>`,
    )
    .join("");
  return `<div class="editor-card"><h2>Asset library</h2><p>Import image or audio files into this draft, or register an existing public path. Every backdrop, ground print, actor, prop, cover and narration cue points to this list.</p><div class="editor-grid">${input("New asset ID", "__new.id", draft.id)}${select(
    "Kind",
    "__new.kind",
    draft.kind,
    [
      ["image", "Image"],
      ["audio", "Audio"],
    ],
  )}${input("Attribution", "__new.attribution", draft.attribution)}${input("Public path (optional)", "__new.src", draft.src)}</div><label class="file-button">Choose a local file<input id="author-asset-file" type="file" accept="image/png,image/jpeg,image/webp,audio/wav,audio/mpeg,audio/ogg"></label><button data-author-action="add-asset-file" class="primary">Add selected file</button><button data-author-action="add-asset-path">Register public path</button><p class="editor-muted">Local files are embedded as data URIs in this draft and portable exports. Import a WAV, MP3 or Ogg narration when ready.</p></div>${rows || `<div class="editor-empty"><p>No assets yet. Add the first image before adding a spread.</p></div>`}`;
}

export function installAuthoring(options: {
  audio: () => AudioContext;
  pause: () => void;
  preview: (book: AuthoredBook, page?: number) => Promise<void>;
}) {
  const history = new BookHistory();
  let editing = createBlankBook();
  let activeSpread = 0;
  let activeTab: "visual" | "book" | "spreads" | "assets" | "json" = "visual";
  let busy = false;
  let jsonOverride = false;
  let newAssetDraft: NewAssetDraft = {
    id: "",
    kind: "image",
    attribution: "Creator-supplied asset",
    src: "",
  };
  const dialog = document.createElement("dialog");
  dialog.id = "author-dialog";
  dialog.innerHTML = `<div class="author-head"><div><p class="eyebrow">Little Light Library · authoring</p><h1>Book editor</h1><p>Build directly on the book. Add artwork, drag it into place, and try your story as you go.</p></div></div><div class="author-toolbar"><button id="author-demo">Load sample</button><button id="author-new">New blank book</button><label class="file-button">Import JSON<input id="author-file" type="file" accept=".json,application/json"></label><button id="author-preview" class="primary">Validate & preview</button><button id="author-undo" disabled>Undo previous preview</button><button id="author-export" disabled>Export portable JSON</button><button id="author-close">Return to reader</button></div><nav class="author-tabs" aria-label="Editor sections"><button data-author-tab="visual">On the book</button><button data-author-tab="book">Book details</button><button data-author-tab="spreads">Spreads</button><button data-author-tab="assets">Assets</button><button data-author-tab="json">Advanced JSON</button></nav><div id="author-visual"></div><div id="author-form"></div><textarea id="author-json" hidden aria-hidden="true"></textarea><div class="author-feedback"><pre id="author-report" role="status" aria-live="polite"></pre><button id="author-dismiss" aria-label="Dismiss editor status">✕</button></div>`;
  document.body.append(dialog);
  const el = <T extends HTMLElement>(id: string) =>
    dialog.querySelector<T>(`#${id}`)!;
  const form = el<HTMLElement>("author-form");
  const report = el<HTMLElement>("author-report");
  const visual = installVisualEditor(el<HTMLElement>("author-visual"), {
    book: () => editing,
    changed: () => {
      report.textContent = "";
      el<HTMLTextAreaElement>("author-json").value = JSON.stringify(editing);
      el<HTMLButtonElement>("author-export").disabled = false;
    },
    load: (book) => {
      editing = structuredClone(book);
    },
    details: () => {
      activeSpread = visual.page;
      activeTab = "spreads";
      renderEditor();
    },
    read: () => el<HTMLButtonElement>("author-preview").click(),
  });
  el<HTMLButtonElement>("author-dismiss").onclick = () => {
    report.textContent = "";
  };
  dialog.addEventListener("close", () => visual.hide());
  el<HTMLTextAreaElement>("author-json").addEventListener("input", () => {
    jsonOverride = true;
  });
  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  const chooseFile = (accept: string) =>
    new Promise<File | undefined>((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = accept;
      picker.onchange = () => resolve(picker.files?.[0]);
      picker.click();
    });
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    dialog
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((button) => (button.disabled = true));
    try {
      await fn();
    } catch (error) {
      report.textContent = String(error);
    } finally {
      busy = false;
      dialog
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((button) => (button.disabled = false));
      el<HTMLButtonElement>("author-undo").disabled = !history.canUndo;
      el<HTMLButtonElement>("author-export").disabled = !editing.spreads.length;
    }
  };
  const setEditing = (book: AuthoredBook, message: string) => {
    const result = validateBook(book);
    if (!result.book) throw Error(describe(result.errors));
    editing = structuredClone(result.book);
    activeSpread = Math.min(
      activeSpread,
      Math.max(0, editing.spreads.length - 1),
    );
    report.textContent = message;
    renderEditor();
  };
  function renderEditor() {
    dialog.classList.toggle("visual-mode", activeTab === "visual");
    form.hidden = activeTab === "visual";
    if (activeTab === "visual") visual.show();
    else visual.hide();
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-author-tab]")
      .forEach((button) =>
        button.classList.toggle(
          "selected",
          button.dataset.authorTab === activeTab,
        ),
      );
    if (activeTab === "book")
      form.innerHTML = `<div class="editor-card"><h2>Book identity</h2><p>One locale per draft in version 1; the reader's nine-language library remains unchanged.</p><div class="editor-grid">${input("Book ID", "id", editing.id, "text", "Stable lowercase slug; use a new ID for Jonah.")}${input("Title", "title", editing.title)}${input("Subtitle", "subtitle", editing.subtitle)}${input("Locale", "locale", editing.locale)}${input("Source reference", "source", editing.source)}${select(
        "Cover image",
        "cover",
        editing.cover,
        Object.entries(editing.assets)
          .filter(([, asset]) => asset.kind === "image")
          .map(([id]) => [id, id] as [string, string]),
        "Choose an imported image.",
      )}</div>${textarea("Retelling note", "retellingNote", editing.retellingNote, "Say whether this is a retelling, translation or draft adaptation.")}<div class="editor-callout"><strong>Next:</strong> Add assets, then use Spreads to create scenes, text, narration, stage elements and actions.</div></div>`;
    else if (activeTab === "spreads")
      form.innerHTML = renderSpreadEditor(editing, activeSpread);
    else if (activeTab === "assets")
      form.innerHTML = renderAssets(editing, newAssetDraft);
    else if (activeTab === "json") {
      form.innerHTML = `<div class="editor-card"><h2>Advanced JSON</h2><p>This is the same book model as the visual controls. Apply JSON to return it to the form editor.</p><textarea id="author-json-source" class="author-json-source" spellcheck="false">${escapeHtml(JSON.stringify(editing, null, 2))}</textarea><button data-author-action="apply-json" class="primary">Apply JSON to editor</button></div>`;
    }
    el<HTMLTextAreaElement>("author-json").value = JSON.stringify(
      editing,
      null,
      2,
    );
    const assetFile =
      dialog.querySelector<HTMLInputElement>("#author-asset-file");
    if (assetFile) assetFile.disabled = busy;
  }
  const applyPathChange = (
    target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    rerender = true,
  ) => {
    const path = target.dataset.path;
    if (!path) return;
    const value =
      target instanceof HTMLInputElement && target.type === "number"
        ? Number(target.value)
        : target.value;
    if (path.startsWith("__new.")) {
      (newAssetDraft as unknown as Record<string, unknown>)[
        path.slice("__new.".length)
      ] = value;
      return;
    }
    setEditorPath(editing, path, value);
    if (rerender) renderEditor();
  };
  dialog
    .querySelectorAll<HTMLButtonElement>("[data-author-tab]")
    .forEach((button) => {
      button.onclick = () => {
        activeTab = button.dataset.authorTab as typeof activeTab;
        renderEditor();
      };
    });
  form.addEventListener("change", (event) => {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    if (target.matches("[data-path]")) applyPathChange(target);
  });
  form.addEventListener("input", (event) => {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    if (target.matches("[data-path]")) applyPathChange(target, false);
  });
  form.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-author-action]",
    );
    if (!button || busy) return;
    const action = button.dataset.authorAction;
    const index = Number(button.dataset.index);
    const spread = editing.spreads[activeSpread];
    if (action === "select-spread") activeSpread = index;
    if (action === "add-spread") {
      editing.spreads.push(createBlankSpread(editing));
      activeSpread = editing.spreads.length - 1;
    }
    if (action === "remove-spread" && editing.spreads.length > 1) {
      editing.spreads.splice(index, 1);
      activeSpread = Math.min(activeSpread, editing.spreads.length - 1);
    }
    if (action === "add-segment" && spread)
      spread.segments.push({
        id: `segment-${spread.segments.length + 1}`,
        text: "Add a narration phrase.",
      });
    if (action === "remove-segment" && spread && spread.segments.length > 1)
      spread.segments.splice(index, 1);
    if (action === "add-element" && spread) {
      const image = firstAsset(editing, "image");
      if (image)
        spread.elements.push({
          id: `element-${spread.elements.length + 1}`,
          label: "New element",
          kind: "prop",
          asset: image,
          placement: {
            x: 0,
            depth: 0,
            width: 1.2,
            height: 1.2,
            anchor: "bottom",
            elevation: 0,
            rotation: 0,
          },
        });
    }
    if (action === "remove-element" && spread) spread.elements.splice(index, 1);
    if (action === "toggle-ground" && spread) {
      if (spread.ground) delete spread.ground;
      else {
        const image = firstAsset(editing, "image");
        if (image)
          spread.ground = {
            asset: image,
            x: 0,
            depth: 0,
            width: 5.2,
            height: 2.2,
            opacity: 1,
          };
      }
    }
    if (action === "add-narration" && spread) {
      const audio = firstAsset(editing, "audio");
      if (audio)
        spread.segments[index].narration = {
          asset: audio,
          recordedText: spread.segments[index].text,
          duration: 1,
          voice: "creator",
        };
    }
    if (action === "remove-narration" && spread)
      delete spread.segments[index].narration;
    if (action === "replace-narration" && spread)
      void run(async () => {
        const file = await chooseFile("audio/wav,audio/mpeg,audio/ogg");
        if (!file) return;
        const id = `${editing.id}-narration-${activeSpread + 1}-${index + 1}`
          .replace(/[^a-z0-9-]+/gi, "-")
          .toLowerCase();
        editing.assets[id] = {
          kind: "audio",
          src: await readFileAsDataUrl(file),
          attribution: "Creator-supplied recording",
        };
        spread.segments[index].narration = {
          asset: id,
          recordedText: spread.segments[index].text,
          duration: 1,
          voice: "creator",
        };
        report.textContent = `Imported ${id}; preview to measure its duration.`;
        renderEditor();
      });
    if (action === "toggle-pose" && spread) {
      const element = spread.elements[index];
      if (element.pose) delete element.pose;
      else element.pose = { index: 0, columns: 1 };
    }
    if (action === "toggle-motion" && spread) {
      const element = spread.elements[index];
      if (element.motion) delete element.motion;
      else
        element.motion = {
          preset: "rock",
          trigger: "open",
          duration: 1,
          strength: 4,
          delay: 0,
          repeat: 1,
        };
    }
    if (action === "toggle-interaction" && spread) {
      const element = spread.elements[index];
      if (element.interaction) delete element.interaction;
      else
        element.interaction = {
          label: `Explore ${element.label}`,
          response: `${element.label} responds.`,
        };
    }
    if (action === "remove-asset") {
      delete editing.assets[button.dataset.asset || ""];
      if (editing.cover === button.dataset.asset) editing.cover = "";
    }
    if (action === "add-asset-path") {
      const id =
        dialog
          .querySelector<HTMLInputElement>('input[data-path="__new.id"]')
          ?.value.trim() || "";
      const kind = (dialog.querySelector<HTMLSelectElement>(
        'select[data-path="__new.kind"]',
      )?.value || "image") as "image" | "audio";
      const src =
        dialog
          .querySelector<HTMLInputElement>('input[data-path="__new.src"]')
          ?.value.trim() || "";
      const attribution =
        dialog
          .querySelector<HTMLInputElement>(
            'input[data-path="__new.attribution"]',
          )
          ?.value.trim() || "Creator-supplied asset";
      if (id && src) {
        editing.assets[id] = { kind, src, attribution };
        if (!editing.cover && kind === "image") editing.cover = id;
        report.textContent = `Added ${id}.`;
      } else report.textContent = "Enter an asset ID and public path first.";
      renderEditor();
    }
    if (action === "add-asset-file")
      void run(async () => {
        const file =
          dialog.querySelector<HTMLInputElement>("#author-asset-file")
            ?.files?.[0];
        if (!file) throw Error("Choose a file first.");
        const draftId =
          dialog
            .querySelector<HTMLInputElement>('input[data-path="__new.id"]')
            ?.value.trim() || "";
        const attribution =
          dialog
            .querySelector<HTMLInputElement>(
              'input[data-path="__new.attribution"]',
            )
            ?.value.trim() || "Creator-supplied asset";
        const kindDraft = (dialog.querySelector<HTMLSelectElement>(
          'select[data-path="__new.kind"]',
        )?.value || "image") as "image" | "audio";
        const id = (draftId || file.name.replace(/\.[^.]+$/, ""))
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-|-$/g, "");
        if (!id) throw Error("Enter an asset ID or choose a named file.");
        const kind = file.type.startsWith("audio/") ? "audio" : kindDraft;
        const data = await readFileAsDataUrl(file);
        editing.assets[id] = { kind, src: data, attribution };
        if (!editing.cover && kind === "image") editing.cover = id;
        report.textContent = `Added ${id}.`;
        newAssetDraft = {
          id: "",
          kind: "image",
          attribution: "Creator-supplied asset",
          src: "",
        };
        renderEditor();
      });
    if (action === "apply-json")
      void run(async () => {
        const source = form.querySelector<HTMLTextAreaElement>(
          "#author-json-source",
        );
        if (source)
          setEditing(
            JSON.parse(source.value) as AuthoredBook,
            "JSON applied to the visual editor.",
          );
      });
    renderEditor();
  });
  form.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-author-action='dictate']",
    );
    if (!button) return;
    const win = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) {
      report.textContent =
        "Speech input is unavailable in this browser. Type the phrase instead.";
      return;
    }
    const recognition = new (Recognition as {
      new (): {
        lang: string;
        interimResults: boolean;
        onresult: (event: {
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void;
        onerror: () => void;
        start: () => void;
      };
    })();
    recognition.lang = editing.locale || "en-US";
    recognition.interimResults = false;
    recognition.onresult = (result) => {
      setEditorPath(
        editing,
        button.dataset.path!,
        Array.from(result.results)
          .map((item) => item[0].transcript)
          .join(" "),
      );
      report.textContent = "Dictated text added.";
      renderEditor();
    };
    recognition.onerror = () => {
      report.textContent =
        "Speech input ended without a phrase. Type the text instead.";
    };
    recognition.start();
  });
  el<HTMLButtonElement>("author-demo").onclick = () =>
    void run(async () => {
      const response = await fetch("./books/quiet-garden.book.json");
      if (!response.ok) throw Error("Sample could not load.");
      setEditing(await response.json(), "Demo loaded into the visual editor.");
    });
  el<HTMLButtonElement>("author-new").onclick = () => {
    editing = createBlankBook();
    activeSpread = 0;
    activeTab = "visual";
    visual.hide();
    visual.show(true);
    newAssetDraft = {
      id: "",
      kind: "image",
      attribution: "Creator-supplied asset",
      src: "",
    };
    report.textContent =
      "Your blank book is ready. Choose a background or add a character.";
    renderEditor();
  };
  const importBookFile = () => {
    report.textContent = "Imported into the draft; loading…";
    void run(async () => {
      const file = el<HTMLInputElement>("author-file").files?.[0];
      if (!file) return;
      if (file.size > 140 * 1024 * 1024)
        throw Error("Book file exceeds 140 MiB");
      report.textContent =
        "Imported into the draft; reading the book definition…";
      setEditing(
        JSON.parse(await file.text()),
        "Imported into the draft editor. Validate & preview to apply.",
      );
    });
  };
  el<HTMLInputElement>("author-file").onchange = importBookFile;
  el<HTMLInputElement>("author-file").oninput = importBookFile;
  el<HTMLButtonElement>("author-preview").onclick = () =>
    void run(async () => {
      report.textContent = "Checking definition and media…";
      const candidate =
        activeTab === "json"
          ? JSON.parse(el<HTMLTextAreaElement>("author-json-source").value)
          : jsonOverride
            ? JSON.parse(el<HTMLTextAreaElement>("author-json").value)
            : editing;
      jsonOverride = false;
      const result = validateBook(candidate);
      if (!result.book) throw Error(describe(result.errors));
      let totalBytes = 0;
      const errors = await validateBookAssets(result.book, async (asset) => {
        const blob = await assetBytes(asset);
        totalBytes += blob.size;
        if (totalBytes > 96 * 1024 * 1024)
          throw Error("Book exceeds 96 MiB decoded media");
        if (asset.kind === "image") {
          const bitmap = await createImageBitmap(blob);
          bitmap.close();
          return {};
        }
        const buffer = await options
          .audio()
          .decodeAudioData(await blob.arrayBuffer());
        return { duration: buffer.duration };
      });
      if (errors.length) throw Error(describe(errors));
      await options.preview(
        result.book,
        activeTab === "visual" ? visual.page : activeSpread,
      );
      editing = structuredClone(result.book);
      history.commit(result.book);
      report.textContent = result.warnings.length
        ? describe(result.warnings)
        : "Valid draft. All media loaded and narration durations measured.";
      dialog.close();
    });
  el<HTMLButtonElement>("author-undo").onclick = () =>
    void run(async () => {
      const book = history.previous;
      if (!book) return;
      await options.preview(book);
      history.undo();
      editing = structuredClone(book);
      report.textContent = "Restored the previous validated preview.";
      dialog.close();
    });
  el<HTMLButtonElement>("author-export").onclick = () =>
    void run(async () => {
      const draft = validateBook(editing);
      if (!draft.book) throw Error(describe(draft.errors));
      report.textContent =
        "Embedding artwork and audio from your current book…";
      const book = await portableBook(draft.book);
      const result = validateBook(book);
      if (!result.book) throw Error(describe(result.errors));
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(book, null, 2) + "\n"], {
          type: "application/json",
        }),
      );
      const link = Object.assign(document.createElement("a"), {
        href: url,
        download: `${book.id}.book.json`,
      });
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      report.textContent = "Exported the current book with embedded media.";
    });
  el<HTMLButtonElement>("author-close").onclick = () => dialog.close();
  dialog.oncancel = (event) => {
    if (busy) event.preventDefault();
  };
  return {
    open() {
      report.textContent = "";
      options.pause();
      activeTab = "visual";
      renderEditor();
      dialog.showModal();
    },
    history,
  };
}
