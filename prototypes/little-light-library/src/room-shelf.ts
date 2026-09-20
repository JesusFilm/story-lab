import * as THREE from "three";

export interface RoomShelfBook {
  key: string;
  title: string;
  cover: string;
}

export interface RoomToy {
  id: string;
  label: string;
  asset: string;
  pose?: { index: number; columns: number };
  animation: "rock" | "float" | "sway" | "pulse" | "spin";
}

export type ShelfBookState = "shelf" | "preview" | "table";

const MAX_BOOKS = 6;
const SLOT_START = -2.38;
const SLOT_STEP = 0.79;
const SHELF_Y = 3.61;
const SHELF_Z = -2.7;
const CLOSED_BOOK_CENTER_X = 1.56;
const CLOSED_BOOK_WIDTH = 3.13;
const CLOSED_BOOK_HEIGHT = 3.6;

export function roomShelfLayout(count: number) {
  const total = THREE.MathUtils.clamp(Math.floor(count), 0, MAX_BOOKS);
  return {
    slots: Array.from({ length: total }, (_, index) => ({
      x: SLOT_START + index * SLOT_STEP,
      y: SHELF_Y,
      z: SHELF_Z,
    })),
    endStopX:
      total > 0 && total < MAX_BOOKS
        ? SLOT_START + (total - 0.5) * SLOT_STEP
        : null,
  };
}

export function shelfTransferPose() {
  return {
    position: { x: CLOSED_BOOK_CENTER_X, y: 1.39, z: 1.1 },
    scale: {
      x: CLOSED_BOOK_WIDTH / 0.66,
      y: CLOSED_BOOK_HEIGHT / 1.24,
      z: 2.5,
    },
    rotationX: -Math.PI / 2,
  };
}

export function roomToyLayout(count: number) {
  const total = THREE.MathUtils.clamp(Math.floor(count), 0, 4);
  return Array.from({ length: total }, (_, index) => ({
    x: -1.08 + index * 0.72,
    y: 1.28,
    z: -2.69,
  }));
}

function smooth(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function coverUrl(src: string) {
  if (/^(?:data:|blob:|https?:)/.test(src)) return src;
  return src.startsWith("/")
    ? `.${src}`
    : src.startsWith("./")
      ? src
      : `./${src}`;
}

function composedCover(title: string, artwork?: THREE.Texture) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 576;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#315954";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#caa96b";
  context.lineWidth = 10;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  if (artwork?.image) {
    const image = artwork.image as CanvasImageSource & {
      width: number;
      height: number;
    };
    const scale = Math.min(324 / image.width, 355 / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(
      image,
      30 + (324 - width) / 2,
      30 + (355 - height) / 2,
      width,
      height,
    );
  }
  context.fillStyle = "#fff0d1";
  context.font = "600 30px Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = `${line} ${word}`.trim();
    if (context.measureText(next).width > 310 && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  lines
    .slice(0, 4)
    .forEach((text, index, all) =>
      context.fillText(text, 192, 474 + (index - (all.length - 1) / 2) * 36),
    );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface ShelfEntry {
  definition: RoomShelfBook;
  root: THREE.Group;
  cover: THREE.Texture;
  slot: THREE.Vector3;
}

interface Motion {
  entry: ShelfEntry;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromRotation: THREE.Euler;
  toRotation: THREE.Euler;
  fromScale: THREE.Vector3;
  toScale: THREE.Vector3;
  started: number;
  duration: number;
  resolve: () => void;
}

export class RoomShelf {
  readonly root = new THREE.Group();
  private entries = new Map<string, ShelfEntry>();
  private order: string[] = [];
  private endStop?: THREE.Group;
  private generation = 0;
  private motion?: Motion;
  previewKey?: string;
  tableKey?: string;

  constructor() {
    this.root.name = "room-book-shelf";
  }

  private slot(index: number) {
    const slot = roomShelfLayout(index + 1).slots[index];
    return new THREE.Vector3(slot.x, slot.y, slot.z);
  }

  private makeBook(
    definition: RoomShelfBook,
    texture: THREE.Texture,
    index: number,
  ) {
    const root = new THREE.Group();
    root.name = `shelf-book:${definition.key}`;
    root.userData.pick = `shelf:${definition.key}`;
    root.position.copy(this.slot(index));
    root.rotation.y = (index % 2 ? 1 : -1) * 0.34;
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 1.24, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x315954, roughness: 0.76 }),
    );
    cover.castShadow = cover.receiveShadow = true;
    root.add(cover);
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 1.18),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    art.position.z = 0.081;
    root.add(art);
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.57, 1.12, 0.035),
      new THREE.MeshStandardMaterial({ color: 0xf2dfb8, roughness: 1 }),
    );
    pages.position.z = -0.098;
    root.add(pages);
    return root;
  }

  private disposeEntry(entry: ShelfEntry) {
    entry.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });
    entry.cover.dispose();
    entry.root.removeFromParent();
  }

  private rebuildEndStop(count: number) {
    if (this.endStop) {
      this.endStop.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      this.endStop.removeFromParent();
    }
    this.endStop = undefined;
    if (!count || count >= MAX_BOOKS) return;
    const stop = new THREE.Group();
    stop.name = "shelf-bookend";
    stop.position.set(roomShelfLayout(count).endStopX!, 2.99, -2.72);
    const material = new THREE.MeshStandardMaterial({
      color: 0xb58a4e,
      metalness: 0.32,
      roughness: 0.45,
    });
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.08, 0.48),
      material,
    );
    base.position.y = 0.04;
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.72, 0.48),
      material,
    );
    upright.position.set(0.17, 0.36, 0);
    stop.add(base, upright);
    this.root.add(stop);
    this.endStop = stop;
  }

  async setBooks(books: readonly RoomShelfBook[]) {
    const definitions = books.slice(0, MAX_BOOKS);
    const generation = ++this.generation;
    const loader = new THREE.TextureLoader();
    const loaded = await Promise.all(
      definitions.map(async (definition) => {
        try {
          const texture = await loader.loadAsync(coverUrl(definition.cover));
          texture.colorSpace = THREE.SRGBColorSpace;
          const cover = composedCover(definition.title, texture);
          texture.dispose();
          return cover;
        } catch {
          return composedCover(definition.title);
        }
      }),
    );
    if (generation !== this.generation) {
      loaded.forEach((texture) => texture.dispose());
      return;
    }
    this.cancelMotion();
    this.entries.forEach((entry) => this.disposeEntry(entry));
    this.entries.clear();
    this.previewKey = undefined;
    this.order = definitions.map((book) => book.key);
    definitions.forEach((definition, index) => {
      const root = this.makeBook(definition, loaded[index], index);
      const entry = {
        definition,
        root,
        cover: loaded[index],
        slot: this.slot(index),
      };
      this.entries.set(definition.key, entry);
      this.root.add(root);
    });
    this.rebuildEndStop(definitions.length);
    this.applyVisibility();
  }

  books() {
    return this.order.map((key) => this.entries.get(key)!.definition);
  }

  pickables() {
    return this.order.map((key) => this.entries.get(key)!.root);
  }

  entry(key: string) {
    return this.entries.get(key);
  }

  slotPosition(key: string) {
    return this.entries.get(key)?.slot.clone();
  }

  coverTexture(key: string) {
    return this.entries.get(key)?.cover;
  }

  setTableKey(key?: string) {
    this.tableKey = key;
    this.applyVisibility();
  }

  private applyVisibility() {
    this.entries.forEach((entry, key) => {
      entry.root.visible = key !== this.tableKey;
    });
  }

  private resetToSlot(entry: ShelfEntry) {
    const index = this.order.indexOf(entry.definition.key);
    entry.root.position.copy(entry.slot);
    entry.root.rotation.set(0, (index % 2 ? 1 : -1) * 0.34, 0);
    entry.root.scale.set(1, 1, 1);
  }

  private cancelMotion() {
    if (!this.motion) return;
    const resolve = this.motion.resolve;
    this.motion = undefined;
    resolve();
  }

  private move(
    entry: ShelfEntry,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
    reduced: boolean,
    duration = 330,
  ) {
    this.cancelMotion();
    if (reduced) {
      entry.root.position.copy(position);
      entry.root.rotation.copy(rotation);
      entry.root.scale.copy(scale);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.motion = {
        entry,
        fromPosition: entry.root.position.clone(),
        toPosition: position,
        fromRotation: entry.root.rotation.clone(),
        toRotation: rotation,
        fromScale: entry.root.scale.clone(),
        toScale: scale,
        started: performance.now(),
        duration,
        resolve,
      };
    });
  }

  async inspect(key: string, reduced: boolean) {
    const entry = this.entries.get(key);
    if (!entry || key === this.tableKey) return false;
    if (this.previewKey && this.previewKey !== key)
      await this.returnPreview(reduced);
    this.previewKey = key;
    entry.root.visible = true;
    // The first beat translates clear of the shelf; the second squares the cover to camera.
    await this.move(
      entry,
      new THREE.Vector3(entry.slot.x, 3.65, -1.35),
      entry.root.rotation.clone(),
      new THREE.Vector3(1.12, 1.12, 1.12),
      reduced,
    );
    await this.move(
      entry,
      new THREE.Vector3(0, 3.28, -0.85),
      new THREE.Euler(0, 0, 0),
      new THREE.Vector3(1.42, 1.42, 1.42),
      reduced,
    );
    return true;
  }

  async returnPreview(reduced: boolean) {
    const key = this.previewKey;
    const entry = key ? this.entries.get(key) : undefined;
    this.previewKey = undefined;
    if (!entry) return;
    await this.move(
      entry,
      entry.slot.clone(),
      new THREE.Euler(0, (this.order.indexOf(key!) % 2 ? 1 : -1) * 0.34, 0),
      new THREE.Vector3(1, 1, 1),
      reduced,
      400,
    );
    this.applyVisibility();
  }

  async landPreview(reduced: boolean) {
    const key = this.previewKey;
    const entry = key ? this.entries.get(key) : undefined;
    if (!key || !entry) return undefined;
    const pose = shelfTransferPose();
    await this.move(
      entry,
      new THREE.Vector3(pose.position.x, pose.position.y, pose.position.z),
      new THREE.Euler(pose.rotationX, 0, 0),
      new THREE.Vector3(pose.scale.x, pose.scale.y, pose.scale.z),
      reduced,
      520,
    );
    this.previewKey = undefined;
    this.tableKey = key;
    this.applyVisibility();
    // The proxy is hidden while its full-size table counterpart exists. Reset it
    // immediately so returning the table book reveals the canonical shelf copy.
    this.resetToSlot(entry);
    return entry.definition;
  }

  update(now: number) {
    const motion = this.motion;
    if (!motion) return;
    const amount = smooth((now - motion.started) / motion.duration);
    motion.entry.root.position.lerpVectors(
      motion.fromPosition,
      motion.toPosition,
      amount,
    );
    motion.entry.root.scale.lerpVectors(
      motion.fromScale,
      motion.toScale,
      amount,
    );
    motion.entry.root.rotation.set(
      THREE.MathUtils.lerp(motion.fromRotation.x, motion.toRotation.x, amount),
      THREE.MathUtils.lerp(motion.fromRotation.y, motion.toRotation.y, amount),
      THREE.MathUtils.lerp(motion.fromRotation.z, motion.toRotation.z, amount),
    );
    if (amount >= 1) {
      this.motion = undefined;
      motion.resolve();
    }
  }

  debug() {
    return {
      max: MAX_BOOKS,
      previewKey: this.previewKey ?? null,
      tableKey: this.tableKey ?? null,
      moving: Boolean(this.motion),
      endStop: this.endStop?.position.toArray() ?? null,
      books: this.order.map((key, index) => {
        const entry = this.entries.get(key)!;
        return {
          key,
          index,
          state: (key === this.tableKey
            ? "table"
            : key === this.previewKey
              ? "preview"
              : "shelf") as ShelfBookState,
          visible: entry.root.visible,
          position: entry.root.position.toArray(),
          rotation: entry.root.rotation.toArray().slice(0, 3),
        };
      }),
    };
  }

  dispose() {
    this.generation++;
    this.cancelMotion();
    this.entries.forEach((entry) => this.disposeEntry(entry));
    this.entries.clear();
    this.rebuildEndStop(0);
    this.root.removeFromParent();
  }
}
