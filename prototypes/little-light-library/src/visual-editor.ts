import * as THREE from "three";
import { AuthoredStage } from "./authored-stage";
import type { AuthoredBook, BookSpread } from "./authored-book";

const html = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const clamp = THREE.MathUtils.clamp;
const src = (book: AuthoredBook, id: string) => {
  const value = book.assets[id]?.src || "";
  return value.startsWith("data:image/")
    ? value
    : /^(?!.*\.\.)[a-zA-Z0-9_./-]+$/.test(value)
      ? `./${value}`
      : "";
};
const uid = (prefix: string, ids: string[]) => {
  let i = 1;
  while (ids.includes(`${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
};
type Target =
  | "character"
  | "image"
  | "background"
  | "ground"
  | "cover"
  | "replace";

/** Live composition workspace. The shared AuthoredStage is also the reader's renderer. */
export function installVisualEditor(
  host: HTMLElement,
  options: {
    book: () => AuthoredBook;
    changed: () => void;
    load: (book: AuthoredBook) => void;
    details: () => void;
    read: () => void;
  },
) {
  let page = 0;
  let selected = "";
  let target: Target | undefined;
  let visible = false;
  let revision = 0;
  let stage: AuthoredStage | undefined;
  let stageBook: AuthoredBook | undefined;
  let stagePage: string | undefined;
  let previewing = false;
  let playing = false;
  let playStart = 0;
  let back: AuthoredBook[] = [];
  let forward: AuthoredBook[] = [];
  let gestureSnapshot: AuthoredBook | undefined;
  let pending = false;
  // Asset strings are immutable; sharing them keeps undo cheap for uploaded images.
  const snapshot = () => {
    const book = options.book();
    return {
      ...book,
      assets: Object.fromEntries(
        Object.entries(book.assets).map(([id, asset]) => [id, { ...asset }]),
      ),
      spreads: structuredClone(book.spreads),
    };
  };
  const record = (before = snapshot()) => {
    back.push(before);
    if (back.length > 30) back.shift();
    forward = [];
  };
  const notify = () => {
    options.changed();
    updateHistory();
  };
  const spread = () => options.book().spreads[page];
  const element = () => spread()?.elements.find((item) => item.id === selected);
  const message = (text: string) => {
    host.querySelector<HTMLElement>(".visual-status")!.textContent = text;
  };
  host.innerHTML = `<div class="studio-bar"><div><span class="eyebrow">Build your story</span><input id="visual-book-title" aria-label="Book title" placeholder="Name your book"></div><div class="studio-actions"><button data-studio="undo" aria-label="Undo edit">↶ Undo</button><button data-studio="redo" aria-label="Redo edit">↷ Redo</button><button data-studio="details">Book details</button><button data-studio="preview" class="primary">Preview page</button><button data-studio="read">Read book ↗</button></div></div>
  <div class="studio-tools" aria-label="Add to your book"><button data-studio="page">＋ Add page</button><button data-studio="character">＋ Character</button><button data-studio="image">＋ Image</button><button data-studio="background">▧ Background</button><button data-studio="ground">▱ Ground</button><button data-studio="cover">Cover art</button><button data-studio="play">▷ Try motion</button><button data-studio="retry" hidden>Retry artwork</button></div>
  <div class="page-navigation"><button data-studio="previous-page">← Previous page</button><span class="page-counter"></span><button data-studio="next-page">Next page →</button></div><div class="studio-body"><div class="studio-composition"><div class="studio-viewport" tabindex="0" aria-label="Interactive book canvas. Select a character or image and drag to move it. Arrow keys move the selected artwork."><div class="canvas-hint">Click artwork to select · drag to move · use the corner to resize</div><div class="selection-frame" hidden><span></span><button class="resize-art" aria-label="Drag to resize selected artwork">↗</button></div><div class="scene-loading" role="status" hidden>Loading artwork…</div></div><div class="page-writing"><input aria-label="Page title" id="visual-page-title" placeholder="Name this page"><div class="page-phrases"></div><button data-studio="phrase">＋ Add a line</button></div><p class="visual-status" role="status">Your book updates as you work.</p></div><aside class="studio-inspector" aria-label="Selected artwork"></aside></div><div class="studio-pages" aria-label="Book pages"></div><button class="art-scrim" aria-label="Dismiss artwork chooser" hidden></button><section class="art-tray" aria-label="Choose artwork" hidden></section>`;
  const viewport = host.querySelector<HTMLElement>(".studio-viewport")!;
  const inspector = host.querySelector<HTMLElement>(".studio-inspector")!;
  const tray = host.querySelector<HTMLElement>(".art-tray")!;
  const scrim = host.querySelector<HTMLButtonElement>(".art-scrim")!;
  const closeTray = () => {
    tray.hidden = true;
    scrim.hidden = true;
    target = undefined;
  };
  scrim.onclick = closeTray;
  const frame = host.querySelector<HTMLElement>(".selection-frame")!;
  const loader = host.querySelector<HTMLElement>(".scene-loading")!;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", "Live three-dimensional book");
  viewport.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  camera.position.set(0, 7, 9);
  camera.lookAt(0, 0.9, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbcaa8c, 3));
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(-3, 7, 5);
  scene.add(light);
  const bookRoot = new THREE.Group();
  bookRoot.rotation.x = -Math.PI / 2;
  scene.add(bookRoot);
  // The same six-unit page stage as the reader, framed closely for editing.
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(6.36, 3.3, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x5e756a, roughness: 1 }),
  );
  cover.position.z = -0.15;
  bookRoot.add(cover);
  for (const x of [-1.54, 1.54]) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 3.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xfffbef, roughness: 1 }),
    );
    leaf.position.set(x, 0, -0.03);
    bookRoot.add(leaf);
  }
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.075);
  const pointerRay = (event: PointerEvent) => {
    const rect = viewport.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  };
  const planePoint = (event: PointerEvent) => {
    pointerRay(event);
    return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
  };
  function updateHistory() {
    host.querySelector<HTMLButtonElement>('[data-studio="undo"]')!.disabled =
      !back.length;
    host.querySelector<HTMLButtonElement>('[data-studio="redo"]')!.disabled =
      !forward.length;
  }
  function ensurePage() {
    const book = options.book();
    if (!Object.keys(book.assets).length) {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff9e9";
      ctx.fillRect(0, 0, 16, 16);
      book.assets["blank-paper"] = {
        kind: "image",
        src: canvas.toDataURL("image/png"),
        attribution: "Plain paper created in the book editor",
      };
      book.cover = "blank-paper";
    }
    if (!book.spreads.length) book.spreads.push(newPage());
    page = clamp(page, 0, book.spreads.length - 1);
  }
  function newPage(): BookSpread {
    const book = options.book();
    const background =
      spread()?.backdrop.asset || book.cover || Object.keys(book.assets)[0];
    return {
      id: uid(
        "page",
        book.spreads.map((item) => item.id),
      ),
      title: "A new page",
      source: book.source || "Source not yet specified.",
      stagingNote: "Visual composition created in the book editor.",
      segments: [{ id: "line-1", text: "Your story starts here." }],
      backdrop: { asset: background },
      elements: [],
    };
  }
  function pages() {
    host.querySelector<HTMLElement>(".page-counter")!.textContent =
      `Page ${page + 1} of ${options.book().spreads.length}`;
    host.querySelector<HTMLButtonElement>(
      '[data-studio="previous-page"]',
    )!.disabled = page === 0;
    host.querySelector<HTMLButtonElement>(
      '[data-studio="next-page"]',
    )!.disabled = page === options.book().spreads.length - 1;
    host.querySelector<HTMLElement>(".studio-pages")!.innerHTML =
      `<button data-studio="cover" class="page-tile"><img src="${html(src(options.book(), options.book().cover))}" alt="Book cover"><span>Cover art</span></button>` +
      options
        .book()
        .spreads.map(
          (item, index) =>
            `<button data-page="${index}" class="page-tile ${index === page ? "active" : ""}" aria-label="Page ${index + 1}: ${html(item.title)}" aria-pressed="${index === page}"><img src="${html(src(options.book(), item.backdrop.asset))}" alt=""><span>${index + 1}. ${html(item.title)}</span></button>`,
        )
        .join("") +
      `<button data-studio="page" class="page-tile add-page">＋<span>Add page</span></button>`;
  }
  const range = (
    label: string,
    key: string,
    value: number,
    min: number,
    max: number,
    step = 0.01,
  ) =>
    `<label class="studio-range"><span>${label}<output>${value.toFixed(2)}</output></span><input aria-label="${label}" data-placement="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  function controls() {
    host.classList.toggle("page-previewing", previewing);
    host.querySelector<HTMLButtonElement>(
      '[data-studio="preview"]',
    )!.textContent = previewing ? "Back to editing" : "Preview page";
    if (previewing) {
      inspector.innerHTML = `<p class="eyebrow">Page preview</p><h2>${html(spread().title)}</h2><p>Review this page, then use Next page to continue. Return to editing to make changes.</p><div class="preview-interactions">${spread()
        .elements.filter((item) => item.interaction)
        .map(
          (item) =>
            `<button data-try-element="${html(item.id)}">${html(item.interaction!.label)}</button>`,
        )
        .join("")}</div>`;
      return;
    }
    const item = element();
    inspector.innerHTML = item
      ? `<p class="eyebrow">${item.kind === "actor" ? "Character" : "Image"}</p><input aria-label="Artwork name" data-element-name value="${html(item.label)}"><p class="editor-muted">Drag on the book. Arrow keys nudge; Shift moves farther.</p>${range("Size", "size", item.placement.height, 0.2, 2.7, 0.01)}${range("Left / right", "x", item.placement.x, -2.8, 2.8)}${range("Front / back", "depth", item.placement.depth, -1.2, 1.2)}${range("Lift", "elevation", item.placement.elevation ?? 0, 0, 2)}${range("Rotation", "rotation", item.placement.rotation ?? 0, -45, 45, 1)}<div class="inspector-actions"><button data-studio="replace">Replace art</button><button data-studio="duplicate">Duplicate</button><button data-studio="remove">Remove</button></div><p class="eyebrow">Bring it to life</p><label class="studio-check"><input type="checkbox" data-rock ${item.motion ? "checked" : ""}> Gentle rocking</label><button data-studio="play">▷ Try motion</button>`
      : `<p class="eyebrow">Page ${page + 1}</p><h2>Make it yours</h2><p>Choose a background, then add characters and images. Click anything on the book to move or resize it.</p><button data-studio="background">Choose background</button><button data-studio="character">Add a character</button><button data-studio="image">Add an image</button><hr><button data-studio="duplicate-page">Duplicate page</button><button data-studio="page-left" ${page === 0 ? "disabled" : ""}>Move page earlier</button><button data-studio="page-right" ${page === options.book().spreads.length - 1 ? "disabled" : ""}>Move page later</button><button data-studio="remove-page" ${options.book().spreads.length < 2 ? "disabled" : ""}>Delete page</button>`;
    if (item)
      inspector.dataset.baseSize = JSON.stringify([
        item.placement.width,
        item.placement.height,
      ]);
    const layers = document.createElement("div");
    layers.className = "studio-layers";
    layers.innerHTML =
      `<p class="eyebrow">On this page</p><button data-select="" aria-pressed="${!selected}">▧ Background & page</button>` +
      spread()
        .elements.map(
          (item) =>
            `<button data-select="${html(item.id)}" aria-pressed="${item.id === selected}"><img src="${html(src(options.book(), item.asset))}" alt="">${html(item.label)}</button>`,
        )
        .join("");
    inspector.append(layers);
  }
  function writing() {
    host.querySelector<HTMLInputElement>("#visual-book-title")!.value =
      options.book().title;
    host.querySelector<HTMLInputElement>("#visual-page-title")!.value =
      spread().title;
    host.querySelector<HTMLInputElement>("#visual-page-title")!.readOnly =
      previewing;
    host.querySelector<HTMLInputElement>("#visual-book-title")!.readOnly =
      previewing;
    host.querySelector<HTMLElement>(".page-phrases")!.innerHTML = spread()
      .segments.map(
        (item, index) =>
          `<textarea ${previewing ? "readonly" : ""} data-line="${index}" aria-label="Story line ${index + 1}" rows="2">${html(item.text)}</textarea>`,
      )
      .join("");
  }
  async function rebuild() {
    if (!visible) return;
    const ticket = ++revision;
    loader.hidden = false;
    pending = true;
    if (stage) stage.root.visible = false;
    try {
      const next = await AuthoredStage.create(
        snapshot(),
        structuredClone(spread()),
        new THREE.TextureLoader(),
        () => visible && ticket === revision,
      );
      if (ticket !== revision || !visible) {
        next.dispose();
        return;
      }
      if (stage) {
        bookRoot.remove(stage.root);
        stage.dispose();
      }
      stage = next;
      stageBook = options.book();
      stagePage = spread().id;
      for (const item of spread().elements) stage.editPlacement(item.id, item);
      bookRoot.add(stage.root);
      stage.popups.forEach((popup) => (popup.rotation.x = Math.PI / 2));
      stage.root.updateMatrixWorld(true);
      stage.begin();
      host.querySelector<HTMLButtonElement>('[data-studio="retry"]')!.hidden =
        true;
      message(
        previewing
          ? "Page preview · use Previous and Next to review your book."
          : "Live on the page · changes save automatically to My books.",
      );
    } catch (error) {
      if (ticket === revision && visible) {
        if (stage && stageBook === options.book() && stagePage === spread().id)
          stage.root.visible = true;
        host.querySelector<HTMLButtonElement>('[data-studio="retry"]')!.hidden =
          false;
        message(
          `Artwork could not load. Choose another image or retry. ${String(error)}`,
        );
      }
    } finally {
      if (ticket === revision) {
        loader.hidden = true;
        pending = false;
      }
    }
  }
  function refresh(load = true) {
    ensurePage();
    pages();
    controls();
    writing();
    updateHistory();
    if (load) void rebuild();
  }
  function selectElement(id: string) {
    selected = id;
    playing = false;
    stage?.rest();
    controls();
  }
  function livePlacement() {
    const item = element();
    if (item) stage?.editPlacement(item.id, item);
    options.changed();
  }
  function artTray(kind: Target) {
    target = kind;
    tray.hidden = false;
    scrim.hidden = false;
    const entries = new Map(
      Object.entries(options.book().assets)
        .filter(([id, asset]) => asset.kind === "image" && id !== "blank-paper")
        .map(([id]) => [
          id,
          { name: id.replace(/-/g, " "), path: src(options.book(), id) },
        ]),
    );

    tray.innerHTML = `<div class="tray-heading"><div><p class="eyebrow">${kind === "replace" ? "Replace selected artwork" : `Add ${kind}`}</p><h2>Choose a picture</h2></div><label class="file-button primary">Upload image<input id="visual-image-upload" type="file" accept="image/png,image/jpeg,image/webp"></label><button data-studio="close-tray" aria-label="Close artwork tray">✕</button></div><p class="art-empty" ${entries.size ? "hidden" : ""}>No artwork in this book yet. Upload your own image to get started.</p><div class="art-grid">${[...entries].map(([id, asset]) => `<button data-art="${html(id)}"><img src="${html(asset.path)}" alt="${html(asset.name)}"><span>${html(asset.name)}</span></button>`).join("")}</div><p>Choose a thumbnail or upload a PNG, JPEG or WebP. Transparent images work well as characters.</p>`;
    tray.querySelector<HTMLInputElement>("input")!.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const uploadBook = options.book(),
        uploadPage = page,
        uploadTarget = target;
      try {
        if (file.size > 32 * 1024 * 1024)
          throw Error("Choose an image smaller than 32 MiB.");
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        if (
          !visible ||
          options.book() !== uploadBook ||
          page !== uploadPage ||
          target !== uploadTarget
        )
          return;
        const id = uid("image", Object.keys(options.book().assets));
        record();
        options.book().assets[id] = {
          kind: "image",
          src: data,
          attribution: "Creator-supplied artwork",
        };
        notify();
        await addArt(id, false);
      } catch (error) {
        message(String(error));
      }
    };
  }
  async function addArt(id: string, saveHistory = true) {
    if (!target) return;
    if (
      (target === "character" || target === "image") &&
      spread().elements.length >= 16
    ) {
      message("This page has 16 pieces of artwork. Add a new page for more.");
      return;
    }
    const book = options.book(),
      artPage = page,
      artTarget = target,
      artSelection = selected;
    if (saveHistory) record();
    if (!book.assets[id]) throw Error("Choose an image from this book.");
    if (target === "cover") book.cover = id;
    else if (target === "background") {
      spread().backdrop.asset = id;
      if (book.cover === "blank-paper") book.cover = id;
      selected = "";
    } else if (target === "ground") {
      spread().ground = {
        asset: id,
        x: 0,
        depth: 0,
        width: 5.2,
        height: 2.2,
        opacity: 1,
      };
      selected = "";
    } else if (target === "replace" && element()) element()!.asset = id;
    else {
      const image = new Image();
      image.src = src(book, id);
      await image.decode();
      if (
        !visible ||
        options.book() !== book ||
        page !== artPage ||
        target !== artTarget ||
        selected !== artSelection
      )
        return;
      const aspect = image.naturalWidth / image.naturalHeight;
      const height = Math.min(1.9, 2.4 / aspect);
      const width = height * aspect;
      const name = id.replace(/-/g, " ");
      selected = uid(
        target === "character" ? "character" : "image",
        spread().elements.map((item) => item.id),
      );
      spread().elements.push({
        id: selected,
        label: name,
        kind: target === "character" ? "actor" : "prop",
        asset: id,
        placement: {
          x: 0,
          depth: -0.3,
          width,
          height,
          elevation: 0,
          rotation: 0,
          anchor: "bottom",
        },
      });
    }
    closeTray();
    refresh();
    notify();
  }
  host.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button) return;
    if (button.dataset.tryElement) {
      const result = stage?.activate(button.dataset.tryElement);
      if (result) message(result.response);
      return;
    }
    if (button.dataset.page !== undefined) {
      page = Number(button.dataset.page);
      selected = "";
      refresh();
      return;
    }
    if (button.dataset.select !== undefined) {
      selectElement(button.dataset.select);
      return;
    }
    if (button.dataset.art) {
      void addArt(button.dataset.art).catch((error) => message(String(error)));
      return;
    }
    const action = button.dataset.studio;
    if (!action) return;
    if (
      [
        "character",
        "image",
        "background",
        "ground",
        "cover",
        "replace",
      ].includes(action)
    ) {
      artTray(action as Target);
      return;
    }
    if (action === "close-tray") {
      closeTray();
      return;
    }
    if (action === "previous-page" || action === "next-page") {
      page = clamp(
        page + (action === "previous-page" ? -1 : 1),
        0,
        options.book().spreads.length - 1,
      );
      selected = "";
      playStart = performance.now() / 1000;
      refresh();
      return;
    }
    if (action === "preview") {
      previewing = !previewing;
      selected = "";
      playing = previewing;
      playStart = performance.now() / 1000;
      stage?.begin();
      stage?.rest();
      controls();
      writing();
      message(
        previewing
          ? "Page preview · use Previous and Next to review your book."
          : "Editing this page.",
      );
      return;
    }
    if (action === "details") {
      options.details();
      return;
    }
    if (action === "retry") {
      void rebuild();
      return;
    }
    if (action === "read") {
      options.read();
      return;
    }
    if (action === "play") {
      playing = !playing;
      playStart = performance.now() / 1000;
      stage?.begin();
      message(
        playing
          ? "Trying movement on this page. Click artwork to edit again."
          : "Editing again.",
      );
      return;
    }
    if (action === "undo" || action === "redo") {
      const from = action === "undo" ? back : forward,
        to = action === "undo" ? forward : back;
      const book = from.pop();
      if (book) {
        to.push(snapshot());
        options.load(book);
        selected = "";
        refresh();
        notify();
      }
      return;
    }
    record();
    if (action === "page" || action === "duplicate-page") {
      if (options.book().spreads.length >= 40) {
        message("A book can hold up to 40 pages.");
        return;
      }
      const next = action === "page" ? newPage() : structuredClone(spread());
      next.id = uid(
        "page",
        options.book().spreads.map((item) => item.id),
      );
      options.book().spreads.splice(page + 1, 0, next);
      page++;
      selected = "";
    }
    if (action === "page-left" || action === "page-right") {
      const next = page + (action === "page-left" ? -1 : 1);
      if (next >= 0 && next < options.book().spreads.length) {
        const [item] = options.book().spreads.splice(page, 1);
        options.book().spreads.splice(next, 0, item);
        page = next;
      }
    }
    if (action === "remove-page" && options.book().spreads.length > 1) {
      options.book().spreads.splice(page, 1);
      page = Math.min(page, options.book().spreads.length - 1);
      selected = "";
    }
    if (action === "phrase" && spread().segments.length < 12)
      spread().segments.push({
        id: uid(
          "line",
          spread().segments.map((item) => item.id),
        ),
        text: "What happens next?",
      });
    if (action === "remove") {
      spread().elements = spread().elements.filter(
        (item) => item.id !== selected,
      );
      selected = "";
    }
    if (action === "duplicate" && element() && spread().elements.length < 16) {
      const copy = structuredClone(element()!);
      copy.id = uid(
        "copy",
        spread().elements.map((item) => item.id),
      );
      copy.placement.x = clamp(copy.placement.x + 0.3, -2.8, 2.8);
      spread().elements.push(copy);
      selected = copy.id;
    }
    refresh();
    notify();
  });
  host.addEventListener("focusin", (event) => {
    if ((event.target as HTMLElement).matches("input,textarea"))
      gestureSnapshot = snapshot();
  });
  host.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    if (!gestureSnapshot) gestureSnapshot = snapshot();
    if (input.id === "visual-book-title") options.book().title = input.value;
    else if (input.id === "visual-page-title") {
      spread().title = input.value;
      pages();
    } else if (input.dataset.line !== undefined)
      spread().segments[Number(input.dataset.line)].text = input.value;
    else if (input.hasAttribute("data-element-name") && element()) {
      element()!.label = input.value;
    } else if (input.dataset.placement && element()) {
      const key = input.dataset.placement;
      const value = Number(input.value);
      const item = element()!;
      if (key === "size") {
        const [width, height] = JSON.parse(inspector.dataset.baseSize!);
        const scale = Math.min(value / height, 5.6 / width, 2.7 / height);
        item.placement.width = Math.max(0.1, width * scale);
        item.placement.height = Math.max(0.1, height * scale);
      } else (item.placement as unknown as Record<string, number>)[key] = value;
      input.previousElementSibling!.querySelector("output")!.textContent =
        value.toFixed(2);
      livePlacement();
    }
    options.changed();
  });
  host.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.type === "file") return;
    if (input.hasAttribute("data-rock") && element()) {
      if (input.checked)
        element()!.motion = {
          preset: "rock",
          trigger: "open",
          duration: 2,
          strength: 6,
          repeat: 3,
        };
      else delete element()!.motion;
      void rebuild();
    }
    if (gestureSnapshot) {
      record(gestureSnapshot);
      gestureSnapshot = undefined;
    }
    notify();
  });
  type Drag = {
    id: number;
    point: THREE.Vector3;
    x: number;
    depth: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
    resize: boolean;
    before: AuthoredBook;
    moved: boolean;
  };
  let drag: Drag | undefined;
  viewport.addEventListener("pointerdown", (event) => {
    if (pending || !stage || event.button !== 0) return;
    const resize =
      (event.target as HTMLElement).closest(".resize-art") !== null;
    pointerRay(event);
    if (previewing) {
      const hit = raycaster
        .intersectObject(stage.root, true)
        .find((hit) => hit.object.name.startsWith("authored-element-"));
      if (hit) {
        const result = stage.activate(
          hit.object.name.slice("authored-element-".length),
        );
        if (result) message(result.response);
      }
      return;
    }
    if (!resize) {
      const hit = raycaster
        .intersectObject(stage.root, true)
        .find((hit) => hit.object.name.startsWith("authored-element-"));
      selectElement(
        hit ? hit.object.name.slice("authored-element-".length) : "",
      );
    }
    const item = element(),
      point = planePoint(event);
    if (!item || !point) return;
    event.preventDefault();
    viewport.focus();
    viewport.setPointerCapture(event.pointerId);
    drag = {
      id: event.pointerId,
      point,
      x: item.placement.x,
      depth: item.placement.depth,
      width: item.placement.width,
      height: item.placement.height,
      startX: event.clientX,
      startY: event.clientY,
      resize,
      before: snapshot(),
      moved: false,
    };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id || !element()) return;
    const item = element()!;
    if (drag.resize) {
      const scale = clamp(
        1 + (event.clientX - drag.startX - (event.clientY - drag.startY)) / 180,
        Math.max(0.1 / drag.width, 0.1 / drag.height),
        Math.min(5.6 / drag.width, 2.7 / drag.height),
      );
      item.placement.width = drag.width * scale;
      item.placement.height = drag.height * scale;
    } else {
      const point = planePoint(event);
      if (!point) return;
      item.placement.x = clamp(drag.x + point.x - drag.point.x, -2.8, 2.8);
      item.placement.depth = clamp(
        drag.depth - (point.z - drag.point.z),
        -1.2,
        1.2,
      );
    }
    drag.moved = true;
    livePlacement();
  });
  const finishDrag = (cancel = false) => {
    if (!drag) return;
    if (cancel) {
      options.load(drag.before);
      void rebuild();
    } else if (drag.moved) record(drag.before);
    drag = undefined;
    controls();
    notify();
  };
  viewport.addEventListener("pointerup", () => finishDrag());
  viewport.addEventListener("pointercancel", () => finishDrag(true));
  viewport.addEventListener("keydown", (event) => {
    const item = element();
    if (!item) return;
    if (event.key === "Escape") {
      selectElement("");
      return;
    }
    const delta = event.shiftKey ? 0.2 : 0.05;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      record();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight")
        item.placement.x = clamp(
          item.placement.x + (event.key === "ArrowLeft" ? -delta : delta),
          -2.8,
          2.8,
        );
      else
        item.placement.depth = clamp(
          item.placement.depth + (event.key === "ArrowUp" ? delta : -delta),
          -1.2,
          1.2,
        );
      livePlacement();
      controls();
      notify();
    }
  });
  function selectionFrame() {
    const mesh = stage?.root.getObjectByName(`authored-element-${selected}`);
    frame.hidden = !mesh || !selected;
    if (!mesh) return;
    const bounds = new THREE.Box3().setFromObject(mesh),
      points = [];
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          points.push(new THREE.Vector3(x, y, z).project(camera));
    const left =
      ((Math.min(...points.map((p) => p.x)) + 1) / 2) * viewport.clientWidth;
    const right =
      ((Math.max(...points.map((p) => p.x)) + 1) / 2) * viewport.clientWidth;
    const top =
      ((1 - Math.max(...points.map((p) => p.y))) / 2) * viewport.clientHeight;
    const bottom =
      ((1 - Math.min(...points.map((p) => p.y))) / 2) * viewport.clientHeight;
    Object.assign(frame.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
    });
    frame.querySelector("span")!.textContent = element()?.label || "";
  }
  let raf = 0;
  let lastWidth = 0,
    lastHeight = 0;
  function draw() {
    if (!visible) return;
    const width = viewport.clientWidth,
      height = viewport.clientHeight;
    if (width && height) {
      if (width !== lastWidth || height !== lastHeight) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.set(0, 5.8, Math.max(7.6, 9 / camera.aspect));
        camera.lookAt(0, 0.9, 0);
        camera.updateProjectionMatrix();
        lastWidth = width;
        lastHeight = height;
      }
      if (playing)
        stage?.update(
          performance.now() / 1000 - playStart,
          true,
          matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
      renderer.render(scene, camera);
      selectionFrame();
    }
    raf = requestAnimationFrame(draw);
  }
  return {
    syncButtons() {
      if (visible) {
        pages();
        updateHistory();
      }
    },
    show(reset = false) {
      if (reset) {
        back = [];
        forward = [];
        page = 0;
        selected = "";
        previewing = false;
        playing = false;
      }
      host.hidden = false;
      if (!visible) {
        visible = true;
        refresh();
        draw();
      } else refresh();
    },
    hide() {
      closeTray();
      visible = false;
      revision++;
      cancelAnimationFrame(raf);
      host.hidden = true;
    },
    refresh() {
      refresh();
    },
    get page() {
      return page;
    },
  };
}
