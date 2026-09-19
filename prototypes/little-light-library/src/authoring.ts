import type { AuthoredBook, BookAsset, BookIssue } from "./authored-book";
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
const describe = (issues: BookIssue[]) =>
  issues.map((i) => `${i.path}: ${i.message}`).join("\n");
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
export function installAuthoring(options: {
  audio: () => AudioContext;
  pause: () => void;
  preview: (book: AuthoredBook) => Promise<void>;
}) {
  const history = new BookHistory();
  const dialog = document.createElement("dialog");
  dialog.id = "author-dialog";
  dialog.innerHTML = `<h1>Author a draft book</h1>
    <p>Edit the same book JSON by hand or with an agent. Preview is temporary; export to keep your work. Existing library books stay available.</p>
    <div class="author-actions"><button id="author-demo">Load two-spread demo</button><label class="file-button">Import book JSON<input id="author-file" type="file" accept=".json,application/json"></label></div>
    <label for="author-json">Book definition</label><textarea id="author-json" spellcheck="false" aria-describedby="author-help"></textarea>
    <p id="author-help">Asset paths start at this reader’s public folder. Portable export embeds images and audio. <a href="./books/quiet-garden.book.json" target="_blank" rel="noopener">View sample JSON</a></p>
    <pre id="author-report" role="status" aria-live="polite"></pre>
    <div class="author-actions"><button id="author-preview" class="primary">Validate & preview</button><button id="author-undo" disabled>Undo previous preview</button><button id="author-export" disabled>Export portable JSON</button><button id="author-close">Return to reader</button></div>`;
  document.body.append(dialog);
  const el = <T extends HTMLElement>(id: string) =>
    dialog.querySelector<T>(`#${id}`)!;
  const input = el<HTMLTextAreaElement>("author-json");
  const report = el<HTMLElement>("author-report");
  let busy = false;
  const setBusy = (value: boolean) => {
    busy = value;
    dialog
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((b) => (b.disabled = value));
    el<HTMLInputElement>("author-file").disabled = value;
    input.readOnly = value;
    if (!value) {
      el<HTMLButtonElement>("author-undo").disabled = !history.canUndo;
      el<HTMLButtonElement>("author-export").disabled = !history.current;
    }
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      report.textContent = String(e);
    } finally {
      setBusy(false);
    }
  };
  el<HTMLButtonElement>("author-demo").onclick = () =>
    void run(async () => {
      const response = await fetch("./books/quiet-garden.book.json");
      if (!response.ok) throw Error("Demo could not load. Retry Load demo.");
      input.value = JSON.stringify(await response.json(), null, 2);
      report.textContent =
        "Demo loaded into the draft. Edit or choose Validate & preview.";
    });
  el<HTMLInputElement>("author-file").onchange = () =>
    void run(async () => {
      const file = el<HTMLInputElement>("author-file").files?.[0];
      if (!file) return;
      if (file.size > 140 * 1024 * 1024)
        throw Error("Book file exceeds 140 MiB");
      input.value = await file.text();
      report.textContent =
        "Imported into the draft only. Validate & preview to apply.";
      el<HTMLInputElement>("author-file").value = "";
    });
  el<HTMLButtonElement>("author-preview").onclick = () =>
    void run(async () => {
      report.textContent = "Checking definition and media…";
      if (input.value.length > 140 * 1024 * 1024)
        throw Error("Book JSON exceeds 140 MiB");
      let parsed: unknown;
      try {
        parsed = JSON.parse(input.value);
      } catch (e) {
        throw Error(
          `JSON: ${String(e)}. Fix the draft; your last preview is unchanged.`,
        );
      }
      const result = validateBook(parsed);
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
      // Commit only after validation; validation never mutates the existing library.
      await options.preview(result.book);
      history.commit(result.book);
      report.textContent = result.warnings.length
        ? describe(result.warnings)
        : "Valid draft. All media loaded and narration durations measured.";
      dialog.close();
    });
  el<HTMLButtonElement>("author-undo").onclick = () =>
    void run(async () => {
      const book = history.previous;
      if (book) {
        input.value = JSON.stringify(book, null, 2);
        await options.preview(book);
        history.undo();
        report.textContent = "Restored the previous validated preview.";
        dialog.close();
      }
    });
  el<HTMLButtonElement>("author-export").onclick = () =>
    void run(async () => {
      if (!history.current) return;
      report.textContent = "Embedding assets from the last validated preview…";
      const book = await portableBook(history.current);
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
      report.textContent =
        "Exported the last validated preview with embedded media. Unvalidated textarea edits are not exported.";
    });
  el<HTMLButtonElement>("author-close").onclick = () => dialog.close();
  dialog.oncancel = (event) => {
    if (busy) event.preventDefault();
  };
  return {
    open() {
      options.pause();
      dialog.showModal();
      input.focus();
    },
    history,
  };
}
