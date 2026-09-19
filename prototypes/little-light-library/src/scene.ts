import {
  createPaperCreature,
  type PaperCreature,
  type PaperCreatureKind,
} from "./paper-creature";
import {
  ReadingFocus,
  readingFocusTarget,
  constrainReadingFocus,
} from "./reading-focus";
import { createGardenFloor } from "./garden-floor";
import { RoomOrbitGesture, orbitRoomGoal } from "./room-orbit";
import {
  wallPaperUv,
  curtainGeometry,
  quiltPatchGeometry,
  quiltWeaveTexture,
  windowViewTexture,
} from "./room-material";
import {
  visiblePaintHit,
  footPivot,
  updateFigureTilts,
} from "./room-interaction";
import * as THREE from "three";
import { bookPose } from "./choreography";
import { popupFoldAngle, popupActorsAtRest } from "./popup-fold";
import { setPrintCrop } from "./print-crop";
import { spreadReveal } from "./spread-reveal";
import { RetainedStage } from "./retained-stage";
import { foldedStagePose } from "./folded-stage-pose";
import { popupFoldSurface } from "./popup-fold-surface";
import {
  captureFoldedPage,
  canCaptureOutgoing,
  LeafPrintStore,
  printLayout,
} from "./leaf-print";
import {
  createTurningLeaf,
  pageTurnDirection,
  type PresentedPage,
  type TurnDirection,
} from "./turning-leaf";
import { stageDirections } from "./stage-direction";
import {
  AuthoredStage,
  type AuthoredInteractionResult,
} from "./authored-stage";
import {
  createPaperActor,
  type PaperActor,
  type PaperActorMood,
} from "./paper-actor";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { LocaleData, Page, Story } from "./contracts";

export type Selection = "eden" | "noah" | "adam" | "eve" | "figure-noah";
type Pickable = THREE.Object3D & { userData: { pick?: Selection } };
const wood = new THREE.MeshStandardMaterial({
  color: 0x805638,
  roughness: 0.9,
});
const paleWood = new THREE.MeshStandardMaterial({
  color: 0xc79b6d,
  roughness: 0.88,
});
const paper = new THREE.MeshStandardMaterial({
  color: 0xfff0d3,
  roughness: 1,
  side: THREE.DoubleSide,
});
const ivory = new THREE.MeshStandardMaterial({
  color: 0xffe9c7,
  roughness: 0.9,
});
const brass = new THREE.MeshStandardMaterial({
  color: 0xb58a4e,
  metalness: 0.32,
  roughness: 0.45,
});

function box(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d, 0.16) * 0.22),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function disc(
  parent: THREE.Object3D,
  r: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.08, 20),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
function labelTexture(text: string, bg: string, fg: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = "#d4b77d";
  ctx.lineWidth = 16;
  ctx.strokeRect(28, 28, 456, 712);
  ctx.fillStyle = fg;
  ctx.font = "bold 48px Georgia, serif";
  ctx.textAlign = "center";
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (ctx.measureText(`${line} ${word}`).width > 390 && line) {
      lines.push(line);
      line = word;
    } else line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  lines.forEach((part, i) =>
    ctx.fillText(part, 256, 420 + (i - (lines.length - 1) / 2) * 58),
  );
  ctx.font = "37px Georgia, serif";
  ctx.fillText("✦", 256, 230);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function coverTitleTexture(text: string, bg: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#fff3d9";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Georgia, serif";
  const spaced = /\s/u.test(text);
  const words = spaced ? text.split(" ") : Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const join = spaced && line ? " " : "";
    if (ctx.measureText(`${line}${join}${word}`).width > 450 && line) {
      lines.push(line);
      line = word;
    } else line += join + word;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((part, i) => ctx.fillText(part, 256, 103 + i * 50));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Deterministic material studies: grain belongs to the timber, never to a screen overlay.
function grainTexture(base: string, kind: "wood" | "cloth" | "paper") {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  let seed = 917;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 6000; i++) {
    ctx.strokeStyle = `rgba(${kind === "wood" ? "46,23,9" : "255,243,214"},${random() * (kind === "wood" ? 0.085 : 0.055)})`;
    ctx.lineWidth = random() * 1.8 + 0.3;
    ctx.beginPath();
    const x = random() * 512,
      y = random() * 512;
    ctx.moveTo(x, y);
    if (kind === "wood")
      ctx.bezierCurveTo(x + 55, y - 2, x + 110, y + 3, x + 200, y);
    else
      ctx.lineTo(
        x + (kind === "cloth" ? 3 : 1),
        y + (kind === "cloth" ? 0 : 1),
      );
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function installHitMask(texture: THREE.Texture) {
  const image = texture.image as HTMLImageElement;
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const alpha = new Uint8Array(c.width * c.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  texture.userData.hitMask = { alpha, width: c.width, height: c.height };
  return { c, data };
}
function fitCutout(texture: THREE.Texture, cell = 0, cells = 1) {
  const { c, data } = installHitMask(texture);
  const cellW = c.width / cells;
  let minX = Math.ceil(cell * cellW),
    maxX = minX,
    minY = c.height,
    maxY = 0;
  const left = minX;
  minX = Math.floor((cell + 1) * cellW);
  for (let y = 0; y < c.height; y++)
    for (let x = left; x < (cell + 1) * cellW; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 32) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  if (maxY <= minY) return;
  texture.repeat.set((maxX - minX + 1) / c.width, (maxY - minY + 1) / c.height);
  texture.offset.set(minX / c.width, 1 - (maxY + 1) / c.height);
  texture.userData.aspect = (maxX - minX + 1) / (maxY - minY + 1);
}
const roomTint = new THREE.Color(0xffdc91);
const roomGlow = new THREE.Color(0x251600);
const ease = (x: number) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
export class LibraryScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 70);
  private roomRoot = new THREE.Group();
  private bookRoot = new THREE.Group();
  private leftLeaf = new THREE.Group();
  private turningPage = new THREE.Group();
  private turningLeaf?: ReturnType<typeof createTurningLeaf>;
  private turnDirection: TurnDirection = "forward";
  private presentedPage?: PresentedPage;
  private loadedPage?: PresentedPage;
  private leafPrint = new LeafPrintStore<THREE.WebGLRenderTarget>();
  private destinationPrint = new LeafPrintStore<THREE.WebGLRenderTarget>();
  private retainedStage = new RetainedStage();
  private transitionWaiting = false;
  private waitingFromRoom = false;
  private waitingPaper?: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial
  >;
  private stationarySource?: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial
  >;
  private destinationPaper?: THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial
  >;
  private coverArt?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private closedMap?: THREE.Texture;
  private foldingOut = 0;
  private closing = 0;
  private reviewTime?: number;
  private reviewAge?: number;
  private reviewFoldProgress?: number;
  private reviewFocusAge?: number;
  private readingFocus = new ReadingFocus();
  private readingFocusIndex = -1;
  private readingWideEnsemble = false;
  private readingFocusScale = 1;
  private readingFocusAmount = 0;
  private readingCameraOffset = new THREE.Vector3();
  private readingLookOffset = new THREE.Vector3();
  private touchUntil = 0;
  private touchedActor = -1;
  private hoveredActor = -1;
  private actorNames: string[] = [];
  private propNames: string[] = [];
  private creatures: {
    creature: PaperCreature;
    kind: PaperCreatureKind;
    label: string;
    button: HTMLButtonElement;
  }[] = [];
  private touchedCreature = -1;
  private hoveredCreature = -1;
  private creatureTouchUntil = 0;
  private creatureUsable() {
    if (
      this.mode !== "spread" ||
      this.transitionWaiting ||
      !this.pageRoot.visible ||
      this.foldingOut ||
      this.closing ||
      (this.reviewFoldProgress ?? 0) > 0
    )
      return false;
    const age =
      this.reviewTime !== undefined
        ? (this.reviewAge ?? 5)
        : (performance.now() - this.turnStarted) / 1000;
    return this.reduced || bookPose(age, this.opening, false).popups === 1;
  }
  private clearCreatureTargets() {
    this.creatures.forEach(({ button }) => button.remove());
    this.touchedCreature = this.hoveredCreature = -1;
    this.creatureTouchUntil = 0;
  }
  private addCreature(
    kind: PaperCreatureKind,
    texture: THREE.Texture,
    width: number,
    label: string,
  ) {
    const creature = createPaperCreature(kind, texture, width);
    const index = this.creatures.length;
    const button = document.createElement("button");
    button.className = "creature-target";
    button.type = "button";
    button.hidden = true;
    button.setAttribute("aria-label", label);
    button.dataset.creature = kind;
    button.onfocus = () => {
      this.hoveredCreature = index;
      this.hoveredActor = -1;
    };
    button.onblur = () => {
      if (this.hoveredCreature === index) this.hoveredCreature = -1;
    };
    button.onclick = () => this.activateCreature(index);
    this.container.append(button);
    this.creatures.push({ creature, kind, label, button });
    return creature.mesh;
  }
  private activateCreature(index: number) {
    if (!this.creatureUsable() || !this.creatures[index]) return;
    this.touchedCreature = index;
    this.creatureTouchUntil = performance.now() + 1400;
    this.touchedActor = this.hoveredActor = -1;
    this.onTouch();
  }
  private hitCreature(event: PointerEvent) {
    if (!this.creatureUsable()) return -1;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    for (const hit of this.ray.intersectObjects(
      this.creatures.map(({ creature }) => creature.mesh),
    )) {
      if (visiblePaintHit(hit))
        return this.creatures.findIndex(
          ({ creature }) => creature.mesh === hit.object,
        );
    }
    return -1;
  }
  private actorButtons: HTMLButtonElement[] = [];
  private actorLabel = document.createElement("span");
  private onLeave = (event: PointerEvent) => {
    if (!this.renderer.domElement.hasPointerCapture(event.pointerId))
      this.roomOrbit.cancel(event.pointerId);
    this.hoveredActor = this.hoveredCreature = -1;
    this.hoveredRoom = null;
    this.renderer.domElement.style.cursor = "";
  };
  private activateActor(index: number) {
    if (this.transitionWaiting || !this.pageRoot.visible) return;
    this.touchedCreature = this.hoveredCreature = -1;
    this.touchedActor = index;
    this.touchUntil = performance.now() + 1400;
    if (this.canFocusActor()) {
      const target = this.actors[index]?.root.localToWorld(
        new THREE.Vector3(0, 1.15, 0),
      );
      if (target) {
        this.readingFocusIndex = index;
        let response = readingFocusTarget(
          this.cameraGoal,
          this.lookGoal,
          target,
          this.renderer.domElement.clientWidth < 600,
          this.readingWideEnsemble,
        );
        this.readingFocusScale = 1;
        if (this.readingWideEnsemble) {
          const roots: THREE.Object3D[] = this.actors.map(
            (actor) => actor.root,
          );
          const family = this.pageRoot.getObjectByName("family-ensemble");
          if (family) roots.push(family);
          const points: THREE.Vector3[] = [];
          roots.forEach((root) => {
            const bounds = new THREE.Box3().setFromObject(root);
            if (bounds.isEmpty()) return;
            for (const x of [bounds.min.x, bounds.max.x])
              for (const y of [bounds.min.y, bounds.max.y])
                for (const z of [bounds.min.z, bounds.max.z])
                  points.push(new THREE.Vector3(x, y, z));
          });
          const base = this.camera.clone();
          base.position.copy(this.cameraGoal);
          const guarded = constrainReadingFocus(
            base,
            this.lookGoal,
            response,
            points,
          );
          response = guarded;
          this.readingFocusScale = guarded.scale;
        }
        this.readingFocus.start(performance.now() / 1000, response);
      }
    }
    this.onTouch();
  }
  private canFocusActor() {
    if (
      this.mode !== "spread" ||
      this.reduced ||
      this.transitionWaiting ||
      !this.pageRoot.visible ||
      this.foldingOut ||
      this.closing ||
      (this.reviewFoldProgress ?? 0) > 0
    )
      return false;
    const age =
      this.reviewTime !== undefined
        ? (this.reviewAge ?? 5)
        : (performance.now() - this.turnStarted) / 1000;
    return bookPose(age, this.opening, false).popups === 1;
  }
  private clearReadingFocus() {
    this.camera.position.sub(this.readingCameraOffset);
    this.look.sub(this.readingLookOffset);
    this.readingCameraOffset.set(0, 0, 0);
    this.readingLookOffset.set(0, 0, 0);
    this.readingFocus.clear();
    this.readingFocusIndex = -1;
    this.readingFocusAmount = 0;
    this.reviewFocusAge = undefined;
  }
  private hitActor(event: PointerEvent): number {
    if (!this.pageRoot.visible || this.transitionWaiting) return -1;
    const b = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - b.left) / b.width) * 2 - 1,
      (-(event.clientY - b.top) / b.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    for (const hit of this.ray.intersectObjects(
      this.actors.map((a) => a.root),
      true,
    )) {
      if (!visiblePaintHit(hit)) continue;
      const index = this.actors.findIndex((a) =>
        a.root.children.includes(hit.object),
      );
      if (index >= 0) return index;
    }
    return -1;
  }
  private rightLeaf = new THREE.Group();
  private pageRoot = new THREE.Group();
  private popups: THREE.Group[] = [];
  private actors: PaperActor[] = [];
  private actorMoods: PaperActorMood[] = [];
  private ark?: THREE.Mesh;
  private actorMood: PaperActorMood = "welcome";
  private speaking = false;
  private figurines = new Map<string, THREE.Group>();
  private pickables: Pickable[] = [];
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private look = new THREE.Vector3(0, 2, -1.5);
  private cameraGoal = new THREE.Vector3();
  private lookGoal = new THREE.Vector3();
  private drift = new THREE.Vector2();
  private roomOrbit = new RoomOrbitGesture();
  private mode: "room" | "spread" = "room";
  private currentTexture?: THREE.Texture;
  private pageMaps: THREE.Texture[] = [];
  private coverTextures: THREE.Texture[] = [];
  private figureTextures: THREE.Texture[] = [];
  private roomTextures = new Set<THREE.Texture>();
  private roomWallpaper: "loading" | "loaded" | "fallback" = "loading";
  private loadGeneration = 0;
  private disposed = false;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private resizeObserver: ResizeObserver;
  private raf = 0;
  private lastFrame = 0;
  private slowFrames = 0;
  private lowQuality = false;
  private turnStarted = 0;
  private opening = false;
  private focusedRoom: Selection | null = null;
  private hoveredRoom: Selection | null = null;
  private roomNames = new Map<Selection, string>();
  private reviewRoomSelection?: Selection;
  private reviewRoomAge?: number;
  private tiltName = "";
  private tiltStart = 0;
  private t0 = performance.now();
  private readTime = 0;
  private wave?: THREE.Mesh;
  private authoredStage?: AuthoredStage;
  private authoredPosition = 0;
  private authoredPlaying = false;
  private onDown = (event: PointerEvent) => {
    if (this.mode !== "room" || event.button !== 0) return;
    this.roomOrbit.down(
      event.pointerId,
      event.clientX,
      event.clientY,
      event.isPrimary,
    );
  };
  private onCancel = (event: PointerEvent) => {
    this.roomOrbit.cancel(event.pointerId);
    this.hoveredRoom = null;
    this.renderer.domElement.style.cursor = "";
  };
  private onMove = (e: PointerEvent) => {
    // Keep canceled ids for late-release safety, but let an unpressed mouse hover again.
    if (this.roomOrbit.has(e.pointerId) && e.buttons !== 0) {
      const intent = this.roomOrbit.move(
        e.pointerId,
        e.clientX,
        e.clientY,
        this.renderer.domElement.clientWidth,
      );
      if (intent === "drag" && this.mode === "room") {
        if (!this.renderer.domElement.hasPointerCapture(e.pointerId))
          this.renderer.domElement.setPointerCapture(e.pointerId);
        this.hoveredRoom = null;
        this.drift.set(0, 0);
        this.renderer.domElement.style.cursor = "grabbing";
        return;
      }
      if (intent === "scroll" || intent === "none") return;
    }
    if (this.mode === "spread") {
      this.hoveredActor = this.hitActor(e);
      this.hoveredCreature = this.hoveredActor < 0 ? this.hitCreature(e) : -1;
      this.renderer.domElement.style.cursor =
        this.hoveredActor >= 0 || this.hoveredCreature >= 0 ? "pointer" : "";
    }
    if (this.mode === "room") {
      this.hoveredRoom = this.hitRoom(e);
      this.renderer.domElement.style.cursor = this.hoveredRoom ? "pointer" : "";
    }
    const r = this.container.getBoundingClientRect();
    this.drift.set(
      (e.clientX - r.left) / r.width - 0.5,
      (e.clientY - r.top) / r.height - 0.5,
    );
  };
  private onPointer = (event: PointerEvent) => {
    const tracked = this.roomOrbit.has(event.pointerId);
    const tap = tracked ? this.roomOrbit.up(event.pointerId) : false;
    if (this.renderer.domElement.hasPointerCapture(event.pointerId))
      this.renderer.domElement.releasePointerCapture(event.pointerId);
    if (tracked && (this.mode !== "room" || !tap)) {
      this.renderer.domElement.style.cursor = "";
      return;
    }
    if (this.mode === "room" && !tap) return;
    const b = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - b.left) / b.width) * 2 - 1,
      (-(event.clientY - b.top) / b.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    if (this.mode === "spread") {
      const index = this.hitActor(event);
      if (index >= 0) this.activateActor(index);
      else {
        const creature = this.hitCreature(event);
        if (creature >= 0) this.activateCreature(creature);
      }
      return;
    }
    const selection = this.hitRoom(event);
    if (selection) this.onSelect(selection);
  };
  private hitRoom(event: PointerEvent): Selection | null {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    for (const hit of this.ray.intersectObjects(this.pickables, true)) {
      if (!visiblePaintHit(hit)) continue;
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.pick) object = object.parent;
      if (object) return object.userData.pick as Selection;
    }
    return null;
  }
  lookRoom(direction: -1 | 0 | 1) {
    if (this.mode !== "room") return;
    this.roomOrbit.look(direction);
    this.drift.set(0, 0);
    this.hoveredRoom = null;
  }
  focusSelection(selection: Selection | null) {
    this.focusedRoom = selection;
  }
  reviewRoom(selection?: Selection, age?: number) {
    this.reviewRoomSelection = selection;
    this.reviewRoomAge = age;
  }
  constructor(
    private container: HTMLElement,
    private onSelect: (id: Selection) => void,
    private onTouch: () => void = () => {},
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.append(this.renderer.domElement);
    this.actorLabel.className = "paper-name";
    this.actorLabel.hidden = true;
    this.container.append(this.actorLabel);
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.style.cssText =
      "width:100%;height:100%;display:block";
    this.renderer.domElement.addEventListener("pointerdown", this.onDown);
    this.renderer.domElement.addEventListener("pointercancel", this.onCancel);
    this.renderer.domElement.addEventListener(
      "lostpointercapture",
      this.onCancel,
    );
    this.renderer.domElement.addEventListener("pointerup", this.onPointer);
    this.renderer.domElement.addEventListener("pointermove", this.onMove);
    this.renderer.domElement.addEventListener("pointerleave", this.onLeave);
    this.scene.background = new THREE.Color(0x273b3a);
    this.scene.fog = new THREE.Fog(0x334240, 18, 38);
    this.scene.add(new THREE.HemisphereLight(0xe3edf2, 0x6f4930, 1.65));
    const sun = new THREE.DirectionalLight(0xffdfad, 2.5);
    sun.position.set(-4, 7, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      near: 0.5,
      far: 25,
    });
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.0002;
    sun.shadow.radius = 3;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9dc4ec, 0.85);
    fill.position.set(-6, 4, -2);
    this.scene.add(fill);
    this.scene.add(this.roomRoot, this.bookRoot);
    this.makeRoom();
    this.makeBook();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.camera.position.copy(this.cameraGoal);
    this.look.copy(this.lookGoal);
    this.animate();
  }
  private resize() {
    const w = Math.max(this.container.clientWidth, 1),
      h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (this.mode === "room") {
      const narrow = this.camera.aspect < 0.8;
      const scale = Math.max(1, 0.68 / this.camera.aspect);
      this.cameraGoal.set(
        (narrow ? 1.7 : 5.5) * scale,
        (narrow ? 3.8 : 4.6) * scale,
        (narrow ? 8.2 : 10.8) * scale,
      );
      this.lookGoal.set(0, narrow ? 2.15 : 2.0, -1.7);
    } else {
      const scale = Math.max(1, 1.25 / this.camera.aspect);
      // Bring the illustrated stage forward, allowing peripheral book edges to crop.
      // Narrow views pull back enough to retain the widest family/actor staging.
      this.lookGoal.set(0, 2.45, 0.4);
      this.cameraGoal.set(1.1 * scale, 2.45 + 3.4 * scale, 0.4 + 5.65 * scale);
    }
  }
  private makeRoom() {
    const timber = new THREE.MeshStandardMaterial({
      map: grainTexture("#93613b", "wood"),
      roughness: 0.7,
    });
    const honey = new THREE.MeshStandardMaterial({
      map: grainTexture("#bc8651", "wood"),
      roughness: 0.67,
    });
    wood.map = timber.map;
    wood.color.set(0xa78160);
    wood.needsUpdate = true;
    paleWood.map = honey.map;
    paleWood.color.set(0xd7bd8f);
    paleWood.needsUpdate = true;
    const wall = new THREE.MeshStandardMaterial({
      map: grainTexture("#c9b394", "cloth"),
      roughness: 1,
    });
    this.roomTextures.add(wall.map!);
    wall.map!.wrapS = wall.map!.wrapT = THREE.RepeatWrapping;
    new THREE.TextureLoader()
      .loadAsync("./assets/art/room/botanical-wallpaper.webp")
      .then((texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(
          4,
          this.renderer.capabilities.getMaxAnisotropy(),
        );
        const fallback = wall.map;
        wall.map = texture;
        this.roomWallpaper = "loaded";
        wall.needsUpdate = true;
        this.roomTextures.add(texture);
        if (fallback) {
          this.roomTextures.delete(fallback);
          fallback.dispose();
        }
      })
      .catch(() => {
        this.roomWallpaper = "fallback";
        /* Existing woven wall remains usable if the optional image fails. */
      });
    const teal = new THREE.MeshStandardMaterial({
      color: 0x3a6260,
      roughness: 0.85,
    });
    box(this.roomRoot, 14, 0.18, 13, timber, 0, -0.1, 0);
    // Side walls and wainscot establish a room, with continuous trim around the corner.
    wallPaperUv(box(this.roomRoot, 14, 7, 0.2, wall, 0, 3.4, -4.5), "back");
    wallPaperUv(box(this.roomRoot, 0.2, 7, 13, wall, -6.9, 3.4, 1.9), "left");
    box(this.roomRoot, 14, 1.7, 0.12, teal, 0, 0.85, -4.32);
    box(this.roomRoot, 0.12, 1.7, 13, teal, -6.75, 0.85, 1.9);
    for (const y of [0.15, 1.65]) {
      box(this.roomRoot, 14, 0.09, 0.15, honey, 0, y, -4.22);
      box(this.roomRoot, 0.15, 0.09, 13, honey, -6.67, y, 1.9);
    }
    for (let x = -6.5; x < 7; x += 0.65)
      box(this.roomRoot, 0.035, 1.4, 0.05, teal, x, 0.85, -4.2);
    for (let x = -6.5; x < 7; x += 0.8)
      box(
        this.roomRoot,
        0.018,
        0.006,
        13,
        new THREE.MeshStandardMaterial({ color: 0x654631 }),
        x,
        0.004,
        0,
      );
    // A substantial recessed cabinet, rounded timber rails, panelled lower doors.
    box(this.roomRoot, 5.9, 3.45, 0.16, teal, 0, 2.87, -3.61);
    for (const y of [1.2, 2.92, 4.55])
      box(this.roomRoot, 6.1, 0.14, 1.28, honey, 0, y, -3.05);
    for (const x of [-2.96, 2.96])
      box(this.roomRoot, 0.2, 4.5, 1.3, timber, x, 2.25, -3.05);
    box(this.roomRoot, 6.3, 0.18, 1.45, honey, 0, 4.69, -3.05);
    box(this.roomRoot, 5.9, 1.05, 1.15, timber, 0, 0.55, -3.08);
    for (const x of [-1.47, 1.47]) {
      box(this.roomRoot, 2.78, 0.86, 0.08, teal, x, 0.6, -2.46);
      disc(this.roomRoot, 0.055, brass, x + 0.6, 0.62, -2.35).rotation.x =
        Math.PI / 2;
    }
    for (let i = 0; i < 7; i++) {
      const m = new THREE.MeshStandardMaterial({
        color: [0x374d42, 0x9b623c, 0x565c73, 0xa4814b][i % 4],
      });
      const b = box(
        this.roomRoot,
        0.23,
        0.62 + (i % 3) * 0.07,
        0.48,
        m,
        -2.55 + i * 0.24,
        3.02 + (0.62 + (i % 3) * 0.07) / 2,
        -3.04,
      );
      b.rotation.z = i === 6 ? -0.1 : 0;
      for (const y of [-0.2, 0.2])
        box(b, 0.235, 0.015, 0.015, brass, 0, y, 0.248);
    }
    // Window with deep casing, blue glass, sill and soft pleated linen.
    box(this.roomRoot, 2.2, 2.7, 0.15, timber, -4.65, 3.7, -4.19);
    const windowView = windowViewTexture();
    this.roomTextures.add(windowView);
    box(
      this.roomRoot,
      1.97,
      2.46,
      0.04,
      new THREE.MeshBasicMaterial({ map: windowView }),
      -4.65,
      3.7,
      -4.08,
    );
    for (const x of [-5.64, -4.65, -3.66])
      box(this.roomRoot, 0.07, 2.54, 0.14, ivory, x, 3.7, -3.98);
    for (const y of [2.44, 3.7, 4.96])
      box(this.roomRoot, 2.08, 0.07, 0.14, ivory, -4.65, y, -3.98);
    box(this.roomRoot, 2.5, 0.1, 0.55, honey, -4.65, 2.39, -3.89);
    const linen = new THREE.MeshStandardMaterial({
      map: grainTexture("#dfcba8", "cloth"),
      roughness: 1,
    });
    linen.side = THREE.DoubleSide;
    for (const x of [-5.85, -3.42]) {
      const curtain = new THREE.Mesh(curtainGeometry(), linen);
      curtain.position.set(x + 0.135, 3.66, -3.78);
      curtain.castShadow = curtain.receiveShadow = true;
      this.roomRoot.add(curtain);
    }
    // Bed frame, quilt squares, headboard and pillow make scale unmistakable.
    box(this.roomRoot, 2.25, 0.3, 3.4, timber, -4.7, 0.49, -0.3);
    box(this.roomRoot, 2.3, 1.2, 0.16, timber, -4.7, 1, -1.93);
    box(this.roomRoot, 2.05, 0.26, 3.2, ivory, -4.7, 0.75, -0.3);
    const quiltColors = [0x5c7979, 0x8c5860, 0xc5a473, 0x627760];
    const quiltWeave = quiltWeaveTexture();
    this.roomTextures.add(quiltWeave);
    const quiltMaterials = quiltColors.map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          map: quiltWeave,
          roughness: 1,
        }),
    );
    for (let x = 0; x < 5; x++)
      for (let z = 0; z < 5; z++) {
        const patch = box(
          this.roomRoot,
          0.405,
          0.07,
          0.46,
          quiltMaterials[(x + z * 3) % 4],
          -5.51 + x * 0.405,
          0.93,
          -0.88 + z * 0.46,
        );
        patch.geometry.dispose();
        patch.geometry = quiltPatchGeometry();
      }
    box(this.roomRoot, 1.5, 0.2, 0.62, linen, -4.7, 0.96, -1.36);
    for (const x of [-5.79, -3.61])
      for (const z of [-1.92, 1.32]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.09, 1.15, 12),
          timber,
        );
        post.position.set(x, 0.6, z);
        this.roomRoot.add(post);
        const finial = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 12, 8),
          honey,
        );
        finial.position.set(x, 1.2, z);
        this.roomRoot.add(finial);
      }
    // Central writing table remains visible during reading.
    box(this.roomRoot, 7.8, 0.23, 4.7, honey, 0.1, 1.18, 1.2);
    box(this.roomRoot, 7.1, 0.28, 4, timber, 0.1, 0.97, 1.2);
    for (const x of [-3.1, 3.3])
      for (const z of [-0.55, 2.9]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.09, 0.94, 16),
          timber,
        );
        leg.position.set(x, 0.47, z);
        leg.castShadow = true;
        this.roomRoot.add(leg);
      }
    const rug = new THREE.MeshStandardMaterial({
      map: grainTexture("#744c44", "cloth"),
      roughness: 1,
    });
    box(this.roomRoot, 8, 0.02, 6, rug, 0, 0.025, 1);
    // Keep the room lamp behind the book rather than overlapping story subjects.
    // One grounded group keeps the shade, fittings and actual light together.
    const lampRoot = new THREE.Group();
    lampRoot.position.set(3.25, 1.295, -0.65);
    lampRoot.scale.setScalar(0.78);
    this.roomRoot.add(lampRoot);
    disc(lampRoot, 0.35, timber, 0, 0.045, 0);
    disc(lampRoot, 0.27, brass, 0, 0.105, 0);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.055, 1.32, 16),
      brass,
    );
    stem.position.set(0, 0.755, 0);
    lampRoot.add(stem);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.57, 0.65, 32, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xf0d2a2,
        side: THREE.DoubleSide,
        emissive: 0xffb65c,
        emissiveIntensity: 0.28,
        roughness: 0.9,
      }),
    );
    shade.position.set(0, 1.575, 0);
    lampRoot.add(shade);
    for (const y of [2.54, 3.2]) {
      const r = y < 3 ? 0.57 : 0.23;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.023, 6, 32),
        brass,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y - 1.295, 0);
      lampRoot.add(ring);
    }
    const lampLight = new THREE.PointLight(0xffbd72, 18, 9, 2);
    lampLight.position.set(0, 1.55, 0);
    lampRoot.add(lampLight);
    // A framed botanical study and star mobile supply small, purposeful room detail.
    box(this.roomRoot, 1.2, 1.55, 0.13, honey, 4.36, 3.85, -4.2);
    box(this.roomRoot, 1.04, 1.38, 0.04, paper, 4.36, 3.85, -4.11);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x66794d });
    box(this.roomRoot, 0.025, 0.9, 0.02, stemMat, 4.36, 3.83, -4.07);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 6),
        stemMat,
      );
      leaf.scale.set(1.6, 0.5, 0.15);
      leaf.position.set(4.36 + (i % 2 ? -0.12 : 0.12), 3.5 + i * 0.12, -4.05);
      leaf.rotation.z = i % 2 ? -0.5 : 0.5;
      this.roomRoot.add(leaf);
    }
  }
  private makeBook() {
    this.bookRoot.position.set(0, 1.39, 1.1);
    this.bookRoot.rotation.x = -Math.PI / 2;
    const cloth = new THREE.MeshStandardMaterial({
      map: grainTexture("#244c48", "cloth"),
      roughness: 0.83,
    });
    paper.map = grainTexture("#f3e1b9", "paper");
    paper.needsUpdate = true;
    for (const [leaf, side] of [
      [this.leftLeaf, -1],
      [this.rightLeaf, 1],
    ] as const) {
      box(leaf, 3.13, 3.6, 0.09, cloth, side * 1.56, 0, -0.15);
      for (let layer = 0; layer < 5; layer++)
        box(
          leaf,
          2.98,
          3.43,
          0.022,
          paper,
          side * 1.53,
          0,
          -0.1 + layer * 0.024,
        );
      box(leaf, 2.98, 3.43, 0.018, paper, side * 1.53, 0, 0.03);
      for (const y of [-1.55, 1.55])
        box(leaf, 2.7, 0.014, 0.009, brass, side * 1.53, y, 0.048);
      this.bookRoot.add(leaf);
    }
    box(this.bookRoot, 0.13, 3.64, 0.16, cloth, 0, 0, -0.12);
    const ribbon = box(
      this.bookRoot,
      0.13,
      2.3,
      0.008,
      new THREE.MeshStandardMaterial({ color: 0xaf6449 }),
      0.15,
      -1.1,
      0.065,
    );
    ribbon.rotation.z = 0.07;
    this.turningLeaf = createTurningLeaf(3.02, 3.43, paper);
    this.turningPage.position.z = 0.11;
    this.turningPage.add(this.turningLeaf.mesh);
    this.bookRoot.add(this.turningPage);
    this.turningPage.visible = false;
    this.waitingPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(6.04, 3.43),
      paper.clone(),
    );
    this.stationarySource = new THREE.Mesh(
      new THREE.PlaneGeometry(3.02, 3.43),
      paper.clone(),
    );
    this.destinationPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(3.02, 3.43),
      paper.clone(),
    );
    for (const plate of [
      this.waitingPaper,
      this.stationarySource,
      this.destinationPaper,
    ]) {
      plate.position.z = 0.1;
      plate.visible = false;
      this.bookRoot.add(plate);
    }
    this.coverArt = new THREE.Mesh(
      new THREE.PlaneGeometry(2.88, 3.3),
      new THREE.MeshBasicMaterial({
        map: labelTexture("Little Light", "#244c48", "#fff1c9"),
      }),
    );
    this.coverArt.rotation.y = Math.PI;
    this.coverArt.position.set(-1.56, 0, -0.2);
    this.leftLeaf.add(this.coverArt);
    this.bookRoot.add(this.pageRoot);
  }
  private addBookCover(
    id: "eden" | "noah",
    title: string,
    x: number,
    color: number,
    artwork?: THREE.Texture,
  ) {
    const group = new THREE.Group();
    group.position.set(x, 2.148, -2.72);
    group.scale.setScalar(1.16);
    group.rotation.y = id === "eden" ? -0.16 : 0.15;
    box(
      group,
      0.95,
      1.48,
      0.18,
      new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
      0,
      0,
      0,
    );
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 1.35),
      new THREE.MeshBasicMaterial({
        map:
          artwork ??
          labelTexture("", id === "eden" ? "#204b42" : "#28476a", "#fff3d9"),
      }),
    );
    front.position.z = 0.102;
    group.add(front);
    const titleMap = coverTitleTexture(
      title,
      id === "eden" ? "#204b42" : "#28476a",
    );
    const titleCard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.43),
      new THREE.MeshBasicMaterial({ map: titleMap }),
    );
    titleCard.position.set(0, -0.46, 0.106);
    group.add(titleCard);
    group.userData.pick = id;
    this.roomRoot.add(group);
    this.pickables.push(group as Pickable);
    const frontMap = (front.material as THREE.MeshBasicMaterial).map;
    if (frontMap) this.coverTextures.push(frontMap);
    this.coverTextures.push(titleMap);
  }
  private addFigurine(
    id: "adam" | "eve" | "noah",
    x: number,
    skin: number,
    robe: number,
    artwork?: THREE.Texture,
  ) {
    const group = new THREE.Group();
    group.position.set(x, 2.99, -2.95);
    const sk = new THREE.MeshStandardMaterial({ color: skin, roughness: 1 }),
      cloth = new THREE.MeshStandardMaterial({ color: robe, roughness: 1 });
    disc(group, 0.23, brass.clone(), 0, 0.04, 0);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.22, 0.58, 12),
      cloth,
    );
    body.position.y = 0.41;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), sk);
    head.position.y = 0.8;
    group.add(head);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.44),
      new THREE.MeshStandardMaterial({
        color: id === "eve" ? 0x33261e : 0x493124,
      }),
    );
    hair.position.y = 0.83;
    group.add(hair);
    const movingParts: THREE.Object3D[] = [body, head, hair];
    let footHeight = 0.12;
    if (artwork) {
      installHitMask(artwork);
      const mask = artwork.userData.hitMask;
      let lastPaintRow = mask.height - 1;
      while (
        lastPaintRow > 0 &&
        !mask.alpha
          .subarray(lastPaintRow * mask.width, (lastPaintRow + 1) * mask.width)
          .some((alpha: number) => alpha >= 90)
      )
        lastPaintRow--;
      footHeight = 0.575 + (0.5 - (lastPaintRow + 1) / mask.height) * 1.02;
      const painted = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 1.02),
        new THREE.MeshBasicMaterial({
          map: artwork,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      painted.name = "shelf-painted-figure";
      painted.position.set(0, 0.575, 0.07);
      group.add(painted);
      movingParts.push(painted);
      body.visible = false;
      head.visible = false;
      hair.visible = false;
    }
    footPivot(group, movingParts, footHeight);
    group.userData.pick = id === "noah" ? "figure-noah" : id;
    this.roomRoot.add(group);
    this.pickables.push(group as Pickable);
    this.figurines.set(id, group);
  }
  async room(locale: LocaleData) {
    this.clearCreatureTargets();
    this.clearReadingFocus();
    this.readingWideEnsemble = false;
    this.roomOrbit.reset();
    this.drift.set(0, 0);
    this.focusedRoom = this.hoveredRoom = null;
    this.tiltName = "";
    this.reviewRoom();
    this.roomNames = new Map<Selection, string>([
      ["adam", locale.characters.adam],
      ["eve", locale.characters.eve],
      ["figure-noah", locale.characters.noah],
      ...locale.stories.map(
        (story) => [story.id as Selection, story.title] as [Selection, string],
      ),
    ]);
    this.retainedStage.clear();
    this.clearSpreadPrints();
    this.transitionWaiting = false;
    this.loadedPage = undefined;
    this.actorLabel.hidden = true;
    this.actorButtons.forEach((b) => b.remove());
    this.actorButtons = [];
    this.hoveredActor = this.touchedActor = -1;
    const generation = ++this.loadGeneration;
    this.mode = "room";
    this.roomRoot.visible = true;
    this.bookRoot.visible = true;
    this.bookRoot.position.set(0, 1.39, 1.1);
    this.bookRoot.scale.setScalar(0.72);
    this.leftLeaf.rotation.y = Math.PI;
    this.pageRoot.visible = false;

    this.resize();
    const titles = new Map(
      locale.stories.map((story) => [story.id, story.title]),
    );
    for (const obj of this.pickables) {
      if (obj.userData.pick === "eden" || obj.userData.pick === "noah") {
        this.roomRoot.remove(obj);
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((m) => m.dispose());
          }
        });
      }
    }
    this.coverTextures.forEach((texture) => texture.dispose());
    this.coverTextures = [];
    this.pickables = this.pickables.filter(
      (x) => x.userData.pick !== "eden" && x.userData.pick !== "noah",
    );
    const loader = new THREE.TextureLoader();
    const [eden, noah] = await Promise.all(
      ["eden-01", "noah-02"].map((id) =>
        loader.loadAsync(`./assets/art/${id}.webp`).catch(() => undefined),
      ),
    );
    if (generation !== this.loadGeneration || this.disposed) {
      eden?.dispose();
      noah?.dispose();
      return;
    }
    [eden, noah].forEach((texture) => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.repeat.x = 0.55;
        texture.offset.x = 0.225;
      }
    });
    this.addBookCover(
      "eden",
      titles.get("eden") || "Adam and Eve",
      -0.82,
      0x204b42,
      eden,
    );
    this.addBookCover(
      "noah",
      titles.get("noah") || "Noah",
      0.82,
      0x28476a,
      noah,
    );
    if (!this.figurines.size) {
      const [adamArt, eveArt, noahArt] = await Promise.all(
        ["adam", "eve", "noah"].map((id) =>
          loader
            .loadAsync(`./assets/art/${id}-figurine.webp`)
            .catch(() => undefined),
        ),
      );
      if (generation !== this.loadGeneration || this.disposed) {
        [adamArt, eveArt, noahArt].forEach((texture) => texture?.dispose());
        return;
      }
      [adamArt, eveArt, noahArt].forEach((texture) => {
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.figureTextures.push(texture);
        }
      });
      this.addFigurine("adam", 0.05, 0x9f684c, 0xcabc80, adamArt);
      this.addFigurine("eve", 0.95, 0x925f47, 0x9c866d, eveArt);
      this.addFigurine("noah", 1.85, 0xb17b55, 0x718989, noahArt);
    }
  }
  async spread(story: Story, page: Page, locale: LocaleData) {
    this.clearCreatureTargets();
    this.clearReadingFocus();
    this.roomOrbit.reset();
    this.drift.set(0, 0);
    const generation = ++this.loadGeneration;
    const wasRoom = this.mode === "room";
    this.focusedRoom = this.hoveredRoom = null;
    this.actorLabel.classList.remove("room-name");
    this.actorLabel.style.maxWidth = "";
    this.actorLabel.style.width = "";
    const presentedPage = {
      story: story.id,
      index: story.pages.findIndex((p) => p.id === page.id),
    };
    const turnDirection = pageTurnDirection(
      wasRoom ? undefined : this.presentedPage,
      presentedPage,
    );
    if (wasRoom || !this.reduced) this.retainedStage.clear();
    // Preserve the last completed image through superseded/partial destination loads.
    if (wasRoom || this.reduced) {
      this.clearSpreadPrints();
    } else if (canCaptureOutgoing(this.presentedPage, this.loadedPage)) {
      // The completed incoming snapshot from the preceding turn is already a full
      // folded image of this page. Transfer ownership rather than allocating a third target.
      if (canCaptureOutgoing(this.presentedPage, this.destinationPrint.page)) {
        const completed = this.destinationPrint.take()!;
        this.leafPrint.replace(
          completed.resource,
          completed.page,
          turnDirection,
        );
      } else {
        this.destinationPrint.clear();
        try {
          // The printed fold and live collapse must share the same planar pose.
          // A first turn has no cached destination print and may begin mid-gesture.
          const actorTime = this.reviewTime ?? this.readTime;
          this.authoredStage?.rest();
          this.actors.forEach((actor, i) =>
            actor.update(
              actorTime + i * 0.8,
              this.actorMoods[i] || this.actorMood,
              false,
              true,
            ),
          );
          this.creatures.forEach(({ creature }) =>
            creature.update(0, { reduced: this.reduced, folded: true }),
          );
          const target = captureFoldedPage(
            this.renderer,
            this.pageRoot,
            turnDirection,
            true,
          );
          this.leafPrint.replace(target, this.presentedPage!, turnDirection);
        } catch {
          // Printing is optional: never expose an incomplete stage when GPU capture fails.
        }
      }
    }
    this.destinationPrint.clear();
    this.configureSpreadPrints(turnDirection);
    this.reviewTime = undefined;
    this.reviewFoldProgress = undefined;
    this.closing = 0;
    if (!wasRoom && !this.reduced && this.popups.length && this.loadedPage) {
      this.foldingOut = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (generation !== this.loadGeneration) return;
    }
    this.foldingOut = 0;
    this.mode = "spread";
    this.resize();
    this.roomRoot.visible = true;
    this.bookRoot.visible = true;
    this.transitionWaiting = true;
    this.waitingFromRoom = wasRoom;
    this.pageRoot.visible = false;
    this.turningPage.visible = false;
    if (this.waitingPaper)
      this.waitingPaper.visible = Boolean(this.leafPrint.resource);
    const outgoingActors = this.actors;
    const outgoingMaps = this.pageMaps;
    if (
      !wasRoom &&
      this.reduced &&
      canCaptureOutgoing(this.presentedPage, this.loadedPage)
    ) {
      this.retainedStage.retain(this.pageRoot, this.presentedPage!, (root) =>
        this.disposePageContents(root, outgoingActors, outgoingMaps),
      );
    } else {
      this.disposePageContents(this.pageRoot, outgoingActors, outgoingMaps);
    }
    this.loadedPage = undefined;
    this.actors = [];
    this.creatures = [];
    this.pageMaps = [];
    this.actorButtons.forEach((b) => b.remove());
    this.actorButtons = [];
    this.actorNames = [];
    this.propNames = [];
    this.actorLabel.hidden = true;
    this.hoveredActor = this.touchedActor = -1;
    this.actorMoods = [];
    this.ark = undefined;
    this.popups = [];
    this.wave = undefined;
    this.authoredStage = undefined;
    this.authoredPosition = 0;
    this.authoredPlaying = false;
    const authored = page.authored;
    const loader = new THREE.TextureLoader();
    let texture: THREE.Texture;
    const popup = (x: number, y: number) => {
      const g = new THREE.Group();
      g.userData.foldStart = Math.PI;
      g.position.set(x, y, 0.075);
      this.pageRoot.add(g);
      this.popups.push(g);
      return g;
    };
    if (authored) {
      const stage = await AuthoredStage.create(
        authored.book,
        authored.spread,
        loader,
        () => !this.disposed && generation === this.loadGeneration,
      );
      if (this.disposed || generation !== this.loadGeneration) return;
      this.pageRoot.add(stage.root);
      this.authoredStage = stage;
      this.pageMaps.push(...stage.textures);
      this.popups.push(...stage.popups);
      this.propNames.push(
        ...authored.spread.elements.map((element) => element.id),
      );
      texture = stage.backdropTexture;
      this.currentTexture = texture;
    } else {
      const direction = stageDirections[page.id];
      this.readingWideEnsemble = Boolean(direction.family);
      const backdrop = direction.background;
      this.actorMood = direction.actors[0]?.mood || "listen";
      texture = await loader
        .loadAsync(`./assets/art/theatre/${backdrop}.webp`)
        .catch(() =>
          loader.loadAsync(
            page.image.startsWith("/") ? `.${page.image}` : `./${page.image}`,
          ),
        );
      if (this.disposed || generation !== this.loadGeneration) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      this.pageMaps.push(texture);
      this.currentTexture = texture;
      // An upright painted backcloth hinges from the rear of real horizontal pages.
      const back = popup(0, 1.22);
      back.userData.foldStart = Math.PI;
      const backArt = new THREE.Mesh(
        new THREE.PlaneGeometry(5.8, 2.7),
        new THREE.MeshStandardMaterial({
          map: texture,
          color: direction.tint || 0xffffff,
          side: THREE.DoubleSide,
          roughness: 1,
        }),
      );
      backArt.position.y = 1.35;
      backArt.castShadow = true;
      backArt.receiveShadow = true;
      back.add(backArt);
      // Paper support triangles remain visible from the reading camera.
      for (const x of [-2.55, 2.55]) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.55, 0);
        shape.lineTo(0, 0.6);
        shape.closePath();
        const support = new THREE.Mesh(new THREE.ShapeGeometry(shape), paper);
        support.userData.foldSupport = true;
        support.rotation.y = Math.PI / 2;
        support.position.set(x, 0.05, -0.02);
        back.add(support);
      }
      for (const actorDirection of direction.actors) {
        const kind = actorDirection.kind;
        const tex = await loader
          .loadAsync(`./assets/art/theatre/${kind}-poses.webp`)
          .catch(() => loader.loadAsync(`./assets/art/${kind}-figurine.webp`));
        if (this.disposed || generation !== this.loadGeneration) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        const atlas = tex.image.width / tex.image.height > 1;
        fitCutout(tex, atlas ? actorDirection.pose : 0, atlas ? 3 : 1);
        tex.userData.poseAtlas = atlas;
        tex.userData.pose = actorDirection.pose;
        this.pageMaps.push(tex);
        const actor = createPaperActor(tex, kind, 1.95);
        const g = popup(actorDirection.x, actorDirection.depth);
        g.add(actor.root);
        const index = this.actors.length;
        const button = document.createElement("button");
        button.className = "paper-target";
        button.hidden = true;
        button.type = "button";
        button.setAttribute("aria-label", locale.characters[kind]);
        button.onfocus = () => {
          this.hoveredCreature = -1;
          this.hoveredActor = index;
        };
        button.onblur = () => {
          if (this.hoveredActor === index) this.hoveredActor = -1;
        };
        button.onclick = () => this.activateActor(index);
        this.container.append(button);
        this.actorButtons.push(button);
        this.actorNames.push(locale.characters[kind]);
        this.actors.push(actor);
        this.actorMoods.push(actorDirection.mood);
      }
      if (direction.family) {
        const tex = await loader
          .loadAsync("./assets/art/theatre/family-seven.webp")
          .catch(() => undefined);
        if (generation !== this.loadGeneration || this.disposed) {
          tex?.dispose();
          return;
        }
        if (tex) {
          tex.colorSpace = THREE.SRGBColorSpace;
          fitCutout(tex);
          this.pageMaps.push(tex);
          const family = popup(0.75, -0.05);
          family.name = "family-ensemble";
          const m = new THREE.Mesh(
            new THREE.PlaneGeometry(3.25, 3.25 / tex.userData.aspect),
            new THREE.MeshStandardMaterial({
              map: tex,
              alphaTest: 0.3,
              side: THREE.DoubleSide,
              roughness: 1,
            }),
          );
          m.position.y = 1.625 / tex.userData.aspect;
          m.castShadow = true;
          family.add(m);
        }
      }
      if (direction.ark) {
        const tex = await loader
          .loadAsync("./assets/art/theatre/ark.webp")
          .catch(() => undefined);
        if (generation !== this.loadGeneration || this.disposed) {
          tex?.dispose();
          return;
        }
        if (tex) {
          tex.colorSpace = THREE.SRGBColorSpace;
          fitCutout(tex);
          this.pageMaps.push(tex);
          const ark = popup(0.15, 0.35);
          const m = new THREE.Mesh(
            new THREE.PlaneGeometry(4.4, 4.4 / tex.userData.aspect),
            new THREE.MeshStandardMaterial({
              map: tex,
              alphaTest: 0.3,
              side: THREE.DoubleSide,
              roughness: 1,
            }),
          );
          m.position.y = 0.5 + 2.2 / tex.userData.aspect;
          m.castShadow = true;
          ark.add(m);
          this.ark = m;
        }
      }
      for (const prop of direction.props || []) {
        const tex = await loader.loadAsync(
          `./assets/art/theatre/${prop.file}.webp`,
        );
        if (generation !== this.loadGeneration || this.disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        fitCutout(tex);
        this.pageMaps.push(tex);
        const stand = popup(prop.x, prop.depth);
        const height = prop.width / tex.userData.aspect;
        const cutout =
          prop.file === "serpent-branch"
            ? this.addCreature("serpent", tex, prop.width, locale.ui.serpent)
            : new THREE.Mesh(
                new THREE.PlaneGeometry(prop.width, height),
                new THREE.MeshStandardMaterial({
                  map: tex,
                  alphaTest: 0.3,
                  side: THREE.DoubleSide,
                  roughness: 1,
                }),
              );
        cutout.position.y = height / 2;
        cutout.castShadow = true;
        cutout.receiveShadow = true;
        stand.add(cutout);
        this.propNames.push(prop.file);
      }
      if (direction.interior) {
        // A small side opening behind the actor, with a sill and surrounding planks.
        const cabin = popup(1.45, 0.7);
        const oak = new THREE.MeshStandardMaterial({
          map: wood.map,
          color: 0x73513b,
          roughness: 0.9,
        });
        for (const x of [-0.68, 0.68])
          box(cabin, 0.18, 1.65, 0.1, oak, x, 0.825, 0);
        for (const y of [0.35, 1.6]) box(cabin, 1.5, 0.15, 0.14, oak, 0, y, 0);
        for (const y of [0.07, 0.19]) box(cabin, 1.5, 0.11, 0.08, oak, 0, y, 0);
      }
      if (direction.rainbow) {
        // Seven separate matte paper arcs stand in front of the distant clouds.
        const bow = popup(0, 0.98);
        const colours = [
          0xc95c50, 0xe69552, 0xe6c76e, 0x86a477, 0x6a9bb2, 0x7685aa, 0x9b80aa,
        ];
        colours.forEach((colour, i) => {
          const radius = 2.55 - i * 0.105;
          const arc = new THREE.Mesh(
            new THREE.RingGeometry(radius - 0.1, radius, 64, 1, 0, Math.PI),
            new THREE.MeshStandardMaterial({
              color: colour,
              roughness: 1,
              side: THREE.DoubleSide,
            }),
          );
          arc.position.set(0, 0.15, 0.025);
          arc.castShadow = true;
          bow.add(arc);
        });
      }
      if (direction.dove) {
        const tex = await loader.loadAsync(
          "./assets/art/theatre/dove-olive.webp",
        );
        if (generation !== this.loadGeneration || this.disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        fitCutout(tex);
        this.pageMaps.push(tex);
        const bird = popup(1.45, 0.55);
        const cutout = this.addCreature("dove", tex, 1.15, locale.ui.dove);
        cutout.position.y = 1.15;
        cutout.castShadow = true;
        bird.add(cutout);
      }
      if (direction.tree !== undefined) {
        const tex = await loader.loadAsync("./assets/art/eden-tree.webp");
        if (generation !== this.loadGeneration || this.disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        this.pageMaps.push(tex);
        const tree = popup(direction.tree, 0.3);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5, 2.15),
          new THREE.MeshStandardMaterial({
            map: tex,
            alphaTest: 0.3,
            side: THREE.DoubleSide,
            roughness: 1,
          }),
        );
        mesh.position.y = 1.075;
        mesh.castShadow = true;
        tree.add(mesh);
      }
      if (direction.waves) {
        const tex = await loader.loadAsync("./assets/art/noah-wave.webp");
        if (generation !== this.loadGeneration || this.disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        this.pageMaps.push(tex);
        for (let row = 0; row < 2; row++) {
          const g = popup(0, -0.8 + row * 0.65);
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(5.45, 1.25),
            new THREE.MeshStandardMaterial({
              map: tex,
              alphaTest: 0.3,
              side: THREE.DoubleSide,
              roughness: 1,
            }),
          );
          mesh.position.y = 0.62;
          mesh.castShadow = true;
          g.add(mesh);
          if (row === 0) this.wave = mesh;
        }
      }
      if (direction.background === "garden") {
        // Complete the page's printed ground before releasing the hidden loading stage.
        const floorTexture = await loader
          .loadAsync("./assets/art/theatre/garden-floor.webp")
          .catch(() => undefined);
        if (this.disposed || generation !== this.loadGeneration) {
          floorTexture?.dispose();
          return;
        }
        if (floorTexture) {
          floorTexture.colorSpace = THREE.SRGBColorSpace;
          floorTexture.anisotropy = 4;
          this.pageMaps.push(floorTexture);
          this.pageRoot.add(createGardenFloor(floorTexture));
        }
      }
    }
    if (generation !== this.loadGeneration) return;
    if (!wasRoom && !this.reduced) {
      try {
        const target = captureFoldedPage(
          this.renderer,
          this.pageRoot,
          turnDirection,
          true,
        );
        this.destinationPrint.replace(target, presentedPage, turnDirection);
      } catch {
        // Continue with a blank reverse rather than leaking a partly built stage.
      }
    }
    this.configureSpreadPrints(turnDirection);
    this.retainedStage.clear();
    this.transitionWaiting = false;
    this.opening = wasRoom;
    this.presentedPage = presentedPage;
    this.loadedPage = { ...presentedPage };
    this.turnDirection = turnDirection;
    this.turningLeaf?.update(0, turnDirection);
    this.turningPage.rotation.y = turnDirection === "forward" ? 0 : -Math.PI;
    this.turnStarted = performance.now();
    this.authoredStage?.begin();
    this.bookRoot.userData.story = story.id;
    this.bookRoot.userData.shelfX = authored
      ? 0
      : story.id === "eden"
        ? -0.82
        : 0.82;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1536;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = authored
      ? "#34524f"
      : story.id === "eden"
        ? "#244c48"
        : "#29455e";
    ctx.fillRect(0, 0, 1024, 1536);
    ctx.drawImage(
      (authored ? this.authoredStage!.coverTexture : texture)
        .image as CanvasImageSource,
      36,
      36,
      952,
      984,
    );
    const title = coverTitleTexture(story.title, ctx.fillStyle);
    ctx.drawImage(title.image, 0, 1024, 1024, 512);
    title.dispose();
    ctx.strokeStyle = "#c4a061";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 984, 1496);
    this.closedMap?.dispose();
    this.closedMap = new THREE.CanvasTexture(c);
    this.closedMap.colorSpace = THREE.SRGBColorSpace;
    if (this.coverArt) {
      this.coverArt.material.map = this.closedMap;
      this.coverArt.material.needsUpdate = true;
    }

    this.leftLeaf.rotation.y = this.reduced || !wasRoom ? 0 : Math.PI;
    this.turningPage.visible = !wasRoom && !this.reduced;
    this.popups.forEach(
      (g) =>
        (g.rotation.x = this.reduced ? Math.PI / 2 : g.userData.foldStart || 0),
    );
    this.bookRoot.rotation.x = -Math.PI / 2;
    this.bookRoot.position.set(0, 1.39, 1.1);
    this.bookRoot.scale.setScalar(1);
  }
  review(
    time?: number,
    age?: number,
    foldProgress?: number,
    focusAge?: number,
  ) {
    this.reviewFocusAge = focusAge;
    this.reviewTime = time;
    this.reviewAge = age;
    this.reviewFoldProgress =
      foldProgress === undefined
        ? undefined
        : THREE.MathUtils.clamp(foldProgress, 0, 1);
  }
  async close() {
    if (this.mode !== "spread") return;
    this.clearReadingFocus();
    this.closing = performance.now();
    this.opening = false;
    if (!this.reduced) await new Promise((resolve) => setTimeout(resolve, 850));
    this.closing = 0;
  }
  playback(playing: boolean) {
    this.speaking = playing;
  }
  authoredPlayback(
    position: number,
    playing: boolean,
    durations: readonly number[] = [],
  ) {
    this.authoredPosition = Number.isFinite(position)
      ? Math.max(0, position)
      : 0;
    this.authoredPlaying = playing;
    this.authoredStage?.narrationDurations(durations);
  }
  activateAuthored(id: string): AuthoredInteractionResult | undefined {
    if (this.mode !== "spread" || this.transitionWaiting) return;
    return this.authoredStage?.activate(id);
  }
  tilt(character: string) {
    if (this.figurines.has(character)) {
      this.tiltName = character;
      this.tiltStart = performance.now();
      updateFigureTilts(this.figurines, character, 0, this.reduced);
    }
  }
  debug() {
    const screenPoint = (object: THREE.Object3D, point: THREE.Vector3) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const projected = object.localToWorld(point).project(this.camera);
      return {
        x: rect.left + ((projected.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - projected.y) * rect.height) / 2,
      };
    };
    return {
      mode: this.mode,
      roomOrbitYaw: this.roomOrbit.yaw,
      roomDragging: this.roomOrbit.dragging,
      roomWallpaper: this.roomWallpaper,
      camera: this.camera.position.toArray(),
      readingFocus: {
        index: this.readingFocusIndex,
        wideEnsemble: this.readingWideEnsemble,
        clearanceScale: this.readingFocusScale,
        amount: this.readingFocusAmount,
        cameraOffset: this.readingCameraOffset.toArray(),
        lookOffset: this.readingLookOffset.toArray(),
      },
      look: this.look.toArray(),
      opening: this.opening,
      hinge: this.leftLeaf.rotation.y,
      pageAngle: this.turningPage.rotation.y,
      pageVisible: this.turningPage.visible,
      turnDirection: this.turnDirection,
      pageCurvature: this.turningLeaf?.curvature || 0,
      printedPage: this.leafPrint.page || null,
      destinationPrintPage: this.destinationPrint.page || null,
      sourcePrintContainment:
        this.leafPrint.resource?.texture.userData.printContainment || null,
      destinationPrintContainment:
        this.destinationPrint.resource?.texture.userData.printContainment ||
        null,
      printTargetCount:
        Number(Boolean(this.leafPrint.resource)) +
        Number(Boolean(this.destinationPrint.resource)),
      gardenFloor: Boolean(this.pageRoot.getObjectByName("garden-floor")),
      stageVisible: this.pageRoot.visible,
      stageScale: this.pageRoot.scale.x,
      stageOffsetY: this.pageRoot.position.y,
      stageOffsetZ: this.pageRoot.position.z,
      transitionWaiting: this.transitionWaiting,
      retainedStagePage: this.retainedStage.page || null,
      retainedStageVisible: this.retainedStage.visible,
      stationarySourceVisible: Boolean(this.stationarySource?.visible),
      destinationPaperVisible: Boolean(this.destinationPaper?.visible),
      waitingPaperVisible: Boolean(this.waitingPaper?.visible),
      printedSide: this.leafPrint.direction
        ? printLayout(this.leafPrint.direction).side
        : null,
      printUvFlip: this.leafPrint.direction
        ? printLayout(this.leafPrint.direction).flipU
        : false,
      outgoingFoldProgress:
        this.reviewFoldProgress ??
        (this.foldingOut
          ? ease((performance.now() - this.foldingOut) / 250)
          : null),
      popups: this.popups.map((g) => g.rotation.x),
      actorCount: this.actors.length,
      props: this.propNames,
      authored: this.authoredStage?.debug() ?? null,
      touchedCreature: this.touchedCreature,
      creatures: this.creatures.map(({ creature, kind }) => ({
        kind,
        position: creature.mesh.position.toArray(),
        deformation: creature.mesh.userData.creatureDeformation ?? 0,
      })),
      touchedActor: this.touchedActor,
      reacting: performance.now() < this.touchUntil,
      hoveredActor: this.hoveredActor,
      roomSelection:
        this.reviewRoomSelection ??
        this.hoveredRoom ??
        this.focusedRoom ??
        (this.tiltName === "noah" ? "figure-noah" : this.tiltName || null),
      roomLabel:
        this.mode === "room" && !this.actorLabel.hidden
          ? this.actorLabel.textContent
          : null,
      figurines: [...this.figurines].map(([id, g]) => ({
        id,
        position: g.position.toArray(),
        baseBottom: g.position.y,
        baseRotation: g.rotation.z,
        bodyRotation: g.getObjectByName("figurine-foot-pivot")?.rotation.z ?? 0,
        shelfTop: 2.99,
        screen: {
          torso: screenPoint(
            g.getObjectByName("shelf-painted-figure") || g,
            new THREE.Vector3(0, 0, 0),
          ),
          base: screenPoint(g, new THREE.Vector3(0, 0.04, 0.2)),
          transparentCorner: screenPoint(
            g.getObjectByName("shelf-painted-figure") || g,
            new THREE.Vector3(-0.35, 0.5, 0),
          ),
        },
      })),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }
  private animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    if (document.hidden) {
      this.lastFrame = 0;
      return;
    }
    const now = performance.now();
    const dt = this.lastFrame
      ? Math.min(0.05, (now - this.lastFrame) / 1000)
      : 0.016;
    if (this.lastFrame && now - this.lastFrame > 28) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 45 && !this.lowQuality) {
      this.lowQuality = true;
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    }
    this.lastFrame = now;
    this.readTime += this.reduced ? 0 : dt;
    const time = (now - this.t0) / 1000;
    // Remove last frame's response before interpolating the authored base camera.
    this.camera.position.sub(this.readingCameraOffset);
    this.look.sub(this.readingLookOffset);
    this.readingCameraOffset.set(0, 0, 0);
    this.readingLookOffset.set(0, 0, 0);
    const orbitGoal =
      this.mode === "room"
        ? orbitRoomGoal(this.cameraGoal, this.lookGoal, this.roomOrbit.yaw)
        : this.cameraGoal;
    const goal = orbitGoal.clone();
    if (!this.reduced && !this.lowQuality && !this.roomOrbit.dragging) {
      goal.x += this.drift.x * 0.32;
      goal.y -= this.drift.y * 0.15;
    }
    this.camera.position.lerp(goal, this.reduced ? 1 : 1 - Math.exp(-dt * 3.4));
    this.look.lerp(this.lookGoal, this.reduced ? 1 : 1 - Math.exp(-dt * 3.4));
    this.camera.lookAt(this.look);
    if (this.reviewTime !== undefined) {
      this.camera.position.copy(orbitGoal);
      this.look.copy(this.lookGoal);
      this.camera.lookAt(this.look);
    }
    const focusEnabled =
      this.canFocusActor() &&
      (this.reviewTime === undefined || this.reviewFocusAge !== undefined);
    const focus = focusEnabled
      ? this.readingFocus.sample(now / 1000, this.reviewFocusAge)
      : undefined;
    this.readingFocusAmount = focus?.amount ?? 0;
    if (focus) {
      this.readingCameraOffset.copy(focus.camera);
      this.readingLookOffset.copy(focus.look);
      this.camera.position.add(focus.camera);
      this.look.add(focus.look);
      this.camera.lookAt(this.look);
    }
    if (this.mode === "spread") {
      const age =
        this.reviewTime !== undefined
          ? (this.reviewAge ?? 5)
          : (now - this.turnStarted) / 1000;
      const pose = bookPose(age, this.opening, this.reduced);
      const progress = this.opening
        ? 1 - pose.cover / Math.PI
        : -pose.page / Math.PI;
      const closingProgress = this.closing
        ? ease((now - this.closing) / 750)
        : 0;
      this.leftLeaf.rotation.y = this.closing
        ? Math.PI * ease((closingProgress - 0.3) / 0.7)
        : this.opening
          ? pose.cover
          : 0;
      this.turningPage.rotation.y =
        this.turnDirection === "forward" ? pose.page : -Math.PI - pose.page;
      this.turningLeaf?.update(-pose.page / Math.PI, this.turnDirection);
      this.turningPage.visible =
        !this.transitionWaiting &&
        !this.opening &&
        progress < 1 &&
        !this.reduced;
      const reveal = spreadReveal(
        this.transitionWaiting,
        age,
        this.opening,
        this.reduced,
        Boolean(this.leafPrint.resource),
        Boolean(this.destinationPrint.resource),
      );
      this.pageRoot.visible = reveal.stage;
      if (this.waitingPaper) this.waitingPaper.visible = reveal.waitingPaper;
      if (this.stationarySource)
        this.stationarySource.visible = reveal.stationarySource;
      if (this.destinationPaper)
        this.destinationPaper.visible = reveal.destinationPaper;
      const outgoingUnfold =
        this.reviewFoldProgress !== undefined
          ? 1 - this.reviewFoldProgress
          : this.foldingOut
            ? 1 - ease((now - this.foldingOut) / 250)
            : undefined;
      const foldFrame = (
        this.foldingOut ? this.leafPrint : this.destinationPrint
      ).resource?.texture.userData.printContainment;
      const stagePose = foldedStagePose(
        this.reduced || (this.opening && outgoingUnfold === undefined)
          ? undefined
          : foldFrame,
        outgoingUnfold ?? pose.popups,
      );
      this.pageRoot.scale.setScalar(stagePose.scale);
      this.pageRoot.position.y = stagePose.y;
      this.pageRoot.position.z = stagePose.z;
      let unfold = outgoingUnfold ?? pose.popups;
      if (this.closing) unfold = 1 - ease(closingProgress / 0.55);
      this.popups.forEach((g, i) => {
        popupFoldSurface(g, i, unfold);
        g.rotation.x = popupFoldAngle(unfold);
        g.visible = !(this.opening && age < 0.95);
      });
      if (this.transitionWaiting && this.waitingFromRoom)
        this.leftLeaf.rotation.y = Math.PI;
      if (this.opening && !this.transitionWaiting) {
        const flight = pose.flight;
        const x = Number(this.bookRoot.userData.shelfX) || 0;
        this.bookRoot.position.set(
          x * (1 - flight),
          THREE.MathUtils.lerp(2.15, 1.39, flight) +
            Math.sin(flight * Math.PI) * 0.45,
          THREE.MathUtils.lerp(-2.72, 1.1, flight),
        );
        this.bookRoot.rotation.x = THREE.MathUtils.lerp(
          0,
          -Math.PI / 2,
          flight,
        );
        this.bookRoot.scale.setScalar(THREE.MathUtils.lerp(0.55, 1, flight));
      }
      const actorTime = this.reviewTime ?? this.readTime;
      this.actors.forEach((a, i) =>
        a.update(
          actorTime + i * 0.8,
          this.actorMoods[i] || this.actorMood,
          this.speaking && i === 0,
          popupActorsAtRest(unfold, this.reduced),
          i === this.touchedActor && now < this.touchUntil
            ? Math.sin(Math.PI * (1 - (this.touchUntil - now) / 1400))
            : 0,
          i === this.hoveredActor,
        ),
      );
      this.creatures.forEach(({ creature }, i) =>
        creature.update(actorTime, {
          reduced: this.reduced,
          folded: popupActorsAtRest(unfold, false),
          touch:
            i === this.touchedCreature && now < this.creatureTouchUntil
              ? this.reduced
                ? 1
                : Math.sin(
                    Math.PI * (1 - (this.creatureTouchUntil - now) / 1400),
                  )
              : 0,
          hover: i === this.hoveredCreature,
        }),
      );
      this.authoredStage?.update(
        this.authoredPosition,
        this.authoredPlaying,
        this.reduced,
        !this.pageRoot.visible || popupActorsAtRest(unfold, false),
      );
      if (this.ark && !this.reduced) {
        this.ark.position.y =
          0.8 + Math.sin((this.reviewTime ?? time) * 0.6) * 0.07;
        this.ark.rotation.z =
          Math.sin((this.reviewTime ?? time) * 0.52) * 0.025;
      }
      if (this.wave && !this.reduced)
        this.wave.rotation.z =
          Math.sin((this.reviewTime ?? time) * 0.8) * 0.015;
    }
    const roomAge = this.reviewRoomAge ?? (now - this.tiltStart) / 1000;
    const roomCharacter =
      this.reviewRoomSelection === "figure-noah"
        ? "noah"
        : (this.reviewRoomSelection ?? this.tiltName);
    updateFigureTilts(this.figurines, roomCharacter, roomAge, this.reduced);
    if (roomAge >= 0.8 && this.reviewRoomAge === undefined) this.tiltName = "";
    const roomSelection =
      this.reviewRoomSelection ??
      this.hoveredRoom ??
      this.focusedRoom ??
      (this.tiltName
        ? ((this.tiltName === "noah"
            ? "figure-noah"
            : this.tiltName) as Selection)
        : null);
    this.pickables.forEach((object) => {
      const selected =
        this.mode === "room" && object.userData.pick === roomSelection;
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          if (!material.color) return;
          material.userData.roomRestColor ??= material.color.clone();
          material.color.copy(material.userData.roomRestColor);
          if (selected) material.color.lerp(roomTint, 0.12);
          if (material.emissive) {
            material.userData.roomRestEmissive ??= material.emissive.clone();
            material.emissive.copy(material.userData.roomRestEmissive);
            if (selected) material.emissive.add(roomGlow);
          }
        });
      });
    });
    if (this.mode === "room") {
      const selected = this.pickables.find(
        (object) => object.userData.pick === roomSelection,
      );
      this.actorLabel.classList.add("room-name");
      this.actorLabel.hidden = !selected;
      if (selected) {
        const isBook = roomSelection === "eden" || roomSelection === "noah";
        const point = selected
          .localToWorld(
            new THREE.Vector3(0, isBook ? -0.78 : 1.12, isBook ? 0.12 : 0),
          )
          .project(this.camera);
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.actorLabel.textContent = this.roomNames.get(roomSelection!) || "";
        this.actorLabel.style.maxWidth = `${Math.max(80, Math.min(240, rect.width - 24))}px`;
        this.actorLabel.style.width = "max-content";
        const half = this.actorLabel.offsetWidth / 2;
        const labelHeight = this.actorLabel.offsetHeight;
        this.actorLabel.style.left = `${Math.max(half + 12, Math.min(rect.width - half - 12, ((point.x + 1) * rect.width) / 2))}px`;
        const anchorY = ((1 - point.y) * rect.height) / 2;
        const labelY = isBook ? anchorY + 8 : anchorY - labelHeight - 8;
        this.actorLabel.style.top = `${Math.max(65, Math.min(rect.height - labelHeight - 12, labelY))}px`;
      }
    }
    if (this.mode === "spread") {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const active =
        now < this.touchUntil ? this.touchedActor : this.hoveredActor;
      this.actorLabel.hidden =
        active < 0 ||
        this.foldingOut > 0 ||
        this.closing > 0 ||
        !this.pageRoot.visible;
      this.actors.forEach((actor, i) => {
        const head = actor.root
          .localToWorld(new THREE.Vector3(0, 2.08, 0))
          .project(this.camera);
        const foot = actor.root
          .localToWorld(new THREE.Vector3(0, 0, 0))
          .project(this.camera);
        const x = ((head.x + 1) * rect.width) / 2,
          y = ((1 - head.y) * rect.height) / 2;
        const bottom = ((1 - foot.y) * rect.height) / 2;
        const button = this.actorButtons[i];
        if (button) {
          button.hidden = !this.pageRoot.visible;
          button.style.left = `${x - 30}px`;
          button.style.top = `${y}px`;
          button.style.height = `${Math.max(44, bottom - y)}px`;
        }
        if (i === active) {
          this.actorLabel.textContent = this.actorNames[i];
          this.actorLabel.style.left = `${Math.max(40, Math.min(rect.width - 40, x))}px`;
          this.actorLabel.style.top = `${Math.max(65, y - 34)}px`;
        }
      });
    }
    if (this.mode === "spread") {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const usable = this.creatureUsable();
      const active =
        now < this.creatureTouchUntil
          ? this.touchedCreature
          : this.hoveredCreature;
      this.creatures.forEach(({ creature, kind, label, button }, i) => {
        const width = creature.mesh.geometry.parameters.width;
        const height = creature.mesh.geometry.parameters.height;
        const anchor = creature.mesh
          .localToWorld(
            new THREE.Vector3(
              width * (kind === "serpent" ? -0.28 : 0.15),
              height * (kind === "serpent" ? 0.22 : -0.1),
              0,
            ),
          )
          .project(this.camera);
        const x = ((anchor.x + 1) * rect.width) / 2;
        const y = ((1 - anchor.y) * rect.height) / 2;
        button.hidden = !usable;
        button.style.left = `${x - 30}px`;
        button.style.top = `${y - 22}px`;
        button.style.height = "44px";
        if (usable && i === active) {
          this.actorLabel.hidden = false;
          this.actorLabel.textContent = label;
          this.actorLabel.style.left = `${Math.max(40, Math.min(rect.width - 40, x))}px`;
          this.actorLabel.style.top = `${Math.max(65, y - 56)}px`;
        }
      });
    }
    this.renderer.render(this.scene, this.camera);
  };
  private disposePageContents(
    root: THREE.Group,
    actors: PaperActor[],
    maps: THREE.Texture[],
  ) {
    // Actors own their meshes; remove those subtrees before releasing the other props.
    for (const actor of actors) {
      actor.root.removeFromParent();
      actor.dispose();
    }
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    new Set(maps).forEach((texture) => texture.dispose());
    root.clear();
  }
  private configureSpreadPrints(direction: TurnDirection) {
    if (this.leafPrint.resource) this.leafPrint.direction = direction;
    const source = this.leafPrint.resource?.texture || null;
    const destination = this.destinationPrint.resource?.texture || null;
    this.turningLeaf?.setSpreadPrint(source, destination, direction);
    if (this.waitingPaper) setPrintCrop(this.waitingPaper.material, source);
    const landingLeft = direction === "forward";
    if (this.stationarySource) {
      this.stationarySource.position.x = landingLeft ? -1.51 : 1.51;
      setPrintCrop(
        this.stationarySource.material,
        source,
        0.5,
        landingLeft ? 0 : 0.5,
      );
    }
    if (this.destinationPaper) {
      this.destinationPaper.position.x = landingLeft ? 1.51 : -1.51;
      setPrintCrop(
        this.destinationPaper.material,
        destination,
        0.5,
        landingLeft ? 0.5 : 0,
      );
    }
  }
  private clearSpreadPrints() {
    this.turningLeaf?.setSpreadPrint(null, null, "forward");
    for (const plate of [
      this.waitingPaper,
      this.stationarySource,
      this.destinationPaper,
    ]) {
      if (plate) {
        setPrintCrop(plate.material, null);
        plate.visible = false;
      }
    }
    this.leafPrint.clear();
    this.destinationPrint.clear();
  }
  dispose() {
    this.clearCreatureTargets();
    this.retainedStage.clear();
    this.clearSpreadPrints();
    this.disposed = true;
    this.loadGeneration++;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.onDown);
    this.renderer.domElement.removeEventListener(
      "pointercancel",
      this.onCancel,
    );
    this.renderer.domElement.removeEventListener(
      "lostpointercapture",
      this.onCancel,
    );
    this.renderer.domElement.removeEventListener("pointerup", this.onPointer);
    this.renderer.domElement.removeEventListener("pointermove", this.onMove);
    this.renderer.domElement.removeEventListener("pointerleave", this.onLeave);
    this.actorLabel.remove();
    this.actorButtons.forEach((b) => b.remove());
    this.actors.forEach((a) => a.dispose());
    this.pageMaps.forEach((t) => t.dispose());
    this.coverTextures.forEach((t) => t.dispose());
    this.figureTextures.forEach((t) => t.dispose());
    this.roomTextures.forEach((t) => t.dispose());
    this.roomTextures.clear();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
