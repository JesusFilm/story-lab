import * as THREE from "three";
import type {
  AuthoredBook,
  BookElement,
  BookMotion,
  BookSpread,
} from "./authored-book";

export interface AuthoredInteractionResult {
  response: string;
  sound?: "tap";
}

export interface AuthoredStageDebug {
  ground: null | {
    position: number[];
    size: [number, number];
    rotation: number;
    opacity: number;
  };
  elements: {
    id: string;
    kind: "actor" | "prop";
    position: number[];
    anchorPosition: number[];
    meshPosition: number[];
    rotation: number;
    rocking: number;
  }[];
}

type RuntimeElement = {
  definition: BookElement;
  popup: THREE.Group;
  pivot: THREE.Group;
  material: THREE.MeshStandardMaterial;
  baseRotation: number;
  interactionStarted?: number;
};

type RuntimeGround = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  material: THREE.MeshStandardMaterial;
};

const assetPath = (book: AuthoredBook, id: string, kind: "image" | "audio") => {
  const asset = book.assets[id];
  if (!asset || asset.kind !== kind)
    throw new Error(`Missing ${kind} asset: ${id}`);
  if (asset.src.startsWith("data:")) return asset.src;
  return asset.src.startsWith("/") ? `.${asset.src}` : `./${asset.src}`;
};

const makeMaterial = (texture: THREE.Texture, opacity = 1) =>
  new THREE.MeshStandardMaterial({
    map: texture,
    alphaTest: opacity < 1 ? 0 : 0.03,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    roughness: 1,
    emissive: 0x9d642b,
    emissiveIntensity: 0,
  });

function selectAtlasPose(
  texture: THREE.Texture,
  index: number,
  columns: number,
) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeIndex = THREE.MathUtils.clamp(
    Math.floor(index),
    0,
    safeColumns - 1,
  );
  texture.repeat.set(1 / safeColumns, 1);
  texture.offset.set(safeIndex / safeColumns, 0);
  const image = texture.image as CanvasImageSource & {
    width?: number;
    height?: number;
  };
  const width = Number(image?.width);
  const height = Number(image?.height);
  if (!(width > 0 && height > 0)) return;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, width, height).data;
    const cellWidth = width / safeColumns;
    const left = Math.ceil(safeIndex * cellWidth);
    const right = Math.floor((safeIndex + 1) * cellWidth);
    let minX = right,
      maxX = left,
      minY = height,
      maxY = 0;
    for (let y = 0; y < height; y++)
      for (let x = left; x < right; x++)
        if (data[(y * width + x) * 4 + 3] > 32) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
    if (maxX >= minX && maxY >= minY) {
      texture.repeat.set((maxX - minX + 1) / width, (maxY - minY + 1) / height);
      texture.offset.set(minX / width, 1 - (maxY + 1) / height);
    }
  } catch {
    // The validated local/data asset remains usable with its whole atlas cell.
  }
}

const disposeDetached = (root: THREE.Object3D, textures: THREE.Texture[]) => {
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
  new Set(textures).forEach((texture) => texture.dispose());
  root.clear();
};

export function authoredRockAngle(motion: BookMotion, elapsed: number) {
  const delay = motion.delay ?? 0;
  const duration = motion.duration;
  const repeats = Math.max(1, Math.floor(motion.repeat ?? 1));
  const local = elapsed - delay;
  if (!(duration > 0) || local < 0 || local >= duration * repeats) return 0;
  return (
    Math.sin((local / duration) * Math.PI * 2) *
    THREE.MathUtils.degToRad(motion.strength)
  );
}

/** Runtime for the bounded, versioned paper-stage contract. */
export class AuthoredStage {
  readonly root = new THREE.Group();
  readonly popups: THREE.Group[] = [];
  readonly textures: THREE.Texture[] = [];
  readonly interactiveIds: string[];
  readonly backdropTexture: THREE.Texture;
  readonly coverTexture: THREE.Texture;
  private readonly elements: RuntimeElement[];
  private readonly segmentStarts = new Map<string, number>();
  private decodedDurations?: readonly number[];
  private openedAt: number | undefined;

  private constructor(
    backdropTexture: THREE.Texture,
    coverTexture: THREE.Texture,
    elements: RuntimeElement[],
    spread: BookSpread,
    private readonly ground?: RuntimeGround,
  ) {
    this.backdropTexture = backdropTexture;
    this.coverTexture = coverTexture;
    this.elements = elements;
    this.interactiveIds = elements
      .filter(({ definition }) => definition.interaction)
      .map(({ definition }) => definition.id);
    let start = 0;
    for (const segment of spread.segments) {
      this.segmentStarts.set(segment.id, start);
      start += segment.narration?.duration ?? 0;
    }
  }

  static async create(
    book: AuthoredBook,
    spread: BookSpread,
    loader: THREE.TextureLoader,
    stillCurrent: () => boolean,
  ) {
    const root = new THREE.Group();
    root.name = `authored-stage-${spread.id}`;
    const popups: THREE.Group[] = [];
    const textures: THREE.Texture[] = [];
    const elements: RuntimeElement[] = [];
    const load = async (asset: string) => {
      const texture = await loader.loadAsync(assetPath(book, asset, "image"));
      if (!stillCurrent()) {
        texture.dispose();
        throw new Error("authored-stage-superseded");
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      textures.push(texture);
      return texture;
    };
    const popup = (x: number, depth: number) => {
      const group = new THREE.Group();
      group.userData.foldStart = Math.PI;
      group.position.set(x, depth, 0.075);
      root.add(group);
      popups.push(group);
      return group;
    };

    try {
      const backdropTexture = await load(spread.backdrop.asset);
      const coverTexture =
        book.cover === spread.backdrop.asset
          ? backdropTexture
          : await load(book.cover);
      const backdrop = popup(0, 1.22);
      const backdropMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(5.8, 2.7),
        makeMaterial(backdropTexture),
      );
      backdropMesh.position.y = 1.35;
      backdropMesh.castShadow = backdropMesh.receiveShadow = true;
      backdrop.add(backdropMesh);

      let runtimeGround: RuntimeGround | undefined;
      if (spread.ground) {
        const definition = spread.ground;
        const texture = await load(definition.asset);
        const material = makeMaterial(texture, definition.opacity ?? 1);
        material.depthWrite = false;
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(definition.width, definition.height),
          material,
        );
        ground.name = "authored-ground";
        ground.userData.staticPageSurface = true;
        ground.position.set(definition.x, definition.depth, 0.046);
        ground.rotation.z = THREE.MathUtils.degToRad(definition.rotation ?? 0);
        ground.receiveShadow = true;
        root.add(ground);
        runtimeGround = { mesh: ground, material };
      }

      for (const definition of spread.elements) {
        const texture = await load(definition.asset);
        if (definition.pose)
          selectAtlasPose(
            texture,
            definition.pose.index,
            definition.pose.columns,
          );
        const material = makeMaterial(texture);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(
            definition.placement.width,
            definition.placement.height,
          ),
          material,
        );
        mesh.name = `authored-element-${definition.id}`;
        mesh.castShadow = mesh.receiveShadow = true;
        const stand = popup(definition.placement.x, definition.placement.depth);
        const pivot = new THREE.Group();
        pivot.name = `authored-anchor-${definition.id}`;
        pivot.rotation.z = THREE.MathUtils.degToRad(
          definition.placement.rotation ?? 0,
        );
        const elevation = definition.placement.elevation ?? 0;
        pivot.position.y = elevation;
        mesh.position.y =
          definition.placement.anchor === "center"
            ? 0
            : definition.placement.height / 2;
        pivot.add(mesh);
        stand.add(pivot);
        elements.push({
          definition,
          popup: stand,
          pivot,
          material,
          baseRotation: pivot.rotation.z,
        });
      }
      if (!stillCurrent()) throw new Error("authored-stage-superseded");
      const stage = new AuthoredStage(
        backdropTexture,
        coverTexture,
        elements,
        spread,
        runtimeGround,
      );
      stage.root.add(...root.children);
      stage.popups.push(...popups);
      stage.textures.push(...textures);
      return stage;
    } catch (error) {
      disposeDetached(root, textures);
      throw error;
    }
  }

  narrationDurations(durations: readonly number[]) {
    if (
      durations === this.decodedDurations ||
      durations.length !== this.segmentStarts.size
    )
      return;
    this.decodedDurations = durations;
    let offset = 0;
    [...this.segmentStarts.keys()].forEach((id, index) => {
      this.segmentStarts.set(id, offset);
      offset += durations[index];
    });
  }

  activate(id: string): AuthoredInteractionResult | undefined {
    const element = this.elements.find(
      ({ definition }) => definition.id === id && definition.interaction,
    );
    if (!element?.definition.interaction) return;
    element.interactionStarted = performance.now() / 1000;
    return {
      response: element.definition.interaction.response,
      sound: element.definition.interaction.sound,
    };
  }

  begin() {
    this.openedAt = undefined;
  }

  /** Apply editor gestures to the same geometry used by the reader, without reloading media. */
  editPlacement(id: string, definition: BookElement) {
    const element = this.elements.find((item) => item.definition.id === id);
    if (!element) return;
    const placement = definition.placement;
    const mesh = element.pivot.children[0] as THREE.Mesh<THREE.PlaneGeometry>;
    mesh.scale.set(
      placement.width / mesh.geometry.parameters.width,
      placement.height / mesh.geometry.parameters.height,
      1,
    );
    mesh.position.y = placement.anchor === "center" ? 0 : placement.height / 2;
    element.popup.position.set(placement.x, placement.depth, 0.075);
    element.pivot.position.y = placement.elevation ?? 0;
    element.baseRotation = THREE.MathUtils.degToRad(placement.rotation ?? 0);
    element.pivot.rotation.z = element.baseRotation;
    element.definition = definition;
  }

  /** Apply editor ground changes to the loaded mesh without reloading its image. */
  editGround(definition: NonNullable<BookSpread["ground"]>) {
    if (!this.ground) return;
    const { mesh, material } = this.ground;
    mesh.scale.set(
      definition.width / mesh.geometry.parameters.width,
      definition.height / mesh.geometry.parameters.height,
      1,
    );
    mesh.position.set(definition.x, definition.depth, 0.046);
    mesh.rotation.z = THREE.MathUtils.degToRad(definition.rotation ?? 0);
    material.opacity = definition.opacity ?? 1;
    material.transparent = material.opacity < 1;
    material.alphaTest = material.transparent ? 0 : 0.03;
    material.needsUpdate = true;
  }

  dispose() {
    disposeDetached(this.root, this.textures);
  }

  rest() {
    for (const element of this.elements) {
      element.pivot.rotation.z = element.baseRotation;
      element.pivot.userData.authoredRocking = 0;
    }
  }

  update(
    position: number,
    playing: boolean,
    reduced: boolean,
    folded = false,
    timeline = false,
    narrationEnabled = true,
  ) {
    const now = performance.now() / 1000;
    if (!folded && this.openedAt === undefined) this.openedAt = now;
    for (const element of this.elements) {
      const { definition, pivot, material, baseRotation } = element;
      const interactionAge =
        element.interactionStarted === undefined
          ? Infinity
          : now - element.interactionStarted;
      material.emissiveIntensity = interactionAge < 1.4 ? 0.14 : 0;
      const motion = definition.motion;
      let rocking = 0;
      if (motion && !reduced && !folded) {
        if (motion.trigger === "open")
          rocking = authoredRockAngle(
            motion,
            timeline ? position : now - (this.openedAt ?? now),
          );
        else if (motion.trigger === "interaction")
          rocking = authoredRockAngle(motion, interactionAge);
        else if ((playing || timeline) && narrationEnabled) {
          const start = motion.segment
            ? this.segmentStarts.get(motion.segment)
            : 0;
          if (start !== undefined)
            rocking = authoredRockAngle(motion, position - start);
        }
      }
      pivot.rotation.z = baseRotation + rocking;
      pivot.userData.authoredRocking = rocking;
    }
  }

  debug(): AuthoredStageDebug {
    const ground = this.ground;
    return {
      ground: ground
        ? {
            position: ground.mesh.position.toArray(),
            size: [
              ground.mesh.geometry.parameters.width * ground.mesh.scale.x,
              ground.mesh.geometry.parameters.height * ground.mesh.scale.y,
            ],
            rotation: ground.mesh.rotation.z,
            opacity: ground.material.opacity,
          }
        : null,
      elements: this.elements.map(({ definition, popup, pivot }) => ({
        id: definition.id,
        kind: definition.kind,
        position: popup.position.toArray(),
        anchorPosition: pivot.position.toArray(),
        meshPosition: (
          pivot.children[0]?.position ?? new THREE.Vector3()
        ).toArray(),
        rotation: pivot.rotation.z,
        rocking: Number(pivot.userData.authoredRocking ?? 0),
      })),
    };
  }
}
