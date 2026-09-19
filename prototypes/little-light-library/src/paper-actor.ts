import * as THREE from "three";

export type PaperActorMood =
  | "welcome"
  | "listen"
  | "warn"
  | "sad"
  | "work"
  | "hope";
export type PaperActorKind = "adam" | "eve" | "noah";

/** An illustrated paper puppet. Its feet and root never move during acting. */
export interface PaperActor {
  root: THREE.Group;
  update(
    time: number,
    mood: PaperActorMood,
    speaking: boolean,
    reduced: boolean,
    reaction?: number,
    hover?: boolean,
  ): void;
  dispose(): void;
}

const smooth = (a: number, b: number, value: number) => {
  const v = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
  return v * v * (3 - 2 * v);
};

type PaperVertex = { x: number; y: number; u: number; v: number };
/** Exact triangle clipping partitions one texture without duplicate silhouettes. */
function partitionForearm(
  source: THREE.BufferGeometry,
  width: number,
  height: number,
  kind: PaperActorKind = "noah",
) {
  const fruit = kind === "eve",
    presenting = kind === "adam";
  const crop = presenting
    ? [184, 18, 301, 854]
    : fruit
      ? [724, 13, 329, 865]
      : [108, 123, 440, 732];
  // The fruit partition stops at exposed elbow skin, above the stationary cuff.
  const sourcePolygon = presenting
    ? [
        [432, 327],
        [449, 325],
        [461, 330],
        [466, 342],
        [462, 355],
        [450, 370],
        [432, 380],
        [413, 388],
        [395, 389],
        [382, 384],
        [371, 377],
        [374, 370],
        [388, 373],
        [402, 363],
        [412, 351],
        [419, 341],
        [426, 338],
      ]
    : fruit
      ? [
          [996, 20],
          [1100, 20],
          [1100, 247],
          [1018, 247],
          [1000, 203],
        ]
      : [
          [90, 100],
          [265, 100],
          [265, 200],
          [175, 365],
          [90, 365],
        ];
  const polygon = sourcePolygon.map(([x, y]) => ({
    x: (x - crop[0]) / crop[2],
    y: 1 - (y - crop[1]) / crop[3],
  }));
  const elbow = presenting ? [440, 335] : fruit ? [1023, 244] : [140, 340];
  const masks = presenting
    ? THREE.ShapeUtils.triangulateShape(
        polygon.map((p) => new THREE.Vector2(p.x, p.y)),
        [],
      ).map((indices) => {
        const triangle = indices.map((i) => polygon[i]);
        const [a, b, c] = triangle;
        if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0)
          triangle.reverse();
        return triangle;
      })
    : [polygon];
  const body: PaperVertex[][] = [],
    arm: PaperVertex[][] = [];
  const uv = source.getAttribute("uv");
  const pos = source.getAttribute("position");
  const split = (
    points: PaperVertex[],
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => {
    const side = (p: PaperVertex) => {
      const cross = (b.x - a.x) * (p.v - a.y) - (b.y - a.y) * (p.u - a.x);
      return Math.abs(cross) < 1e-12 ? 0 : cross;
    };
    const inside: PaperVertex[] = [],
      outside: PaperVertex[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i],
        q = points[(i + 1) % points.length],
        d = side(p),
        e = side(q);
      if (d <= 0) inside.push(p);
      if (d >= 0) outside.push(p);
      if ((d < 0 && e > 0) || (d > 0 && e < 0)) {
        const t = d / (d - e),
          v = {
            x: p.x + (q.x - p.x) * t,
            y: p.y + (q.y - p.y) * t,
            u: p.u + (q.u - p.u) * t,
            v: p.v + (q.v - p.v) * t,
          };
        inside.push(v);
        outside.push(v);
      }
    }
    return { inside, outside };
  };
  const index = source.getIndex()!;
  for (let i = 0; i < index.count; i += 3) {
    let pieces = [
      Array.from({ length: 3 }, (_, j) => {
        const k = index.getX(i + j);
        return { x: pos.getX(k), y: pos.getY(k), u: uv.getX(k), v: uv.getY(k) };
      }),
    ];
    // Triangulated skin masks also support a concave palm outline without carrying clothing.
    for (const mask of masks) {
      const next: PaperVertex[][] = [];
      for (const piece of pieces) {
        let remaining = piece;
        for (let e = 0; e < mask.length && remaining.length >= 3; e++) {
          const result = split(remaining, mask[e], mask[(e + 1) % mask.length]);
          if (result.outside.length >= 3) next.push(result.outside);
          remaining = result.inside;
        }
        if (remaining.length >= 3) arm.push(remaining);
      }
      pieces = next;
    }
    body.push(...pieces);
  }
  const make = (pieces: PaperVertex[][]) => {
    const p: number[] = [],
      t: number[] = [];
    for (const polygon of pieces)
      for (let i = 1; i < polygon.length - 1; i++)
        for (const v of [polygon[0], polygon[i], polygon[i + 1]]) {
          p.push(v.x, v.y, 0);
          t.push(v.u, v.v);
        }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(t, 2));
    geometry.computeVertexNormals();
    return geometry;
  };
  return {
    body: make(body),
    arm: make(arm),
    pivot: new THREE.Vector3(
      ((elbow[0] - crop[0]) / crop[2] - 0.5) * width,
      (1 - (elbow[1] - crop[1]) / crop[3]) * height,
      0.02,
    ),
  };
}

/** Time is elapsed seconds, independent of narration playback rate. Texture stays caller-owned. */
export function createPaperActor(
  texture: THREE.Texture,
  kind: PaperActorKind,
  height: number,
): PaperActor {
  const root = new THREE.Group();
  root.name = `paper-actor-${kind}`;
  const image = texture.image as
    | { width?: number; height?: number }
    | undefined;
  const aspect =
    Number(texture.userData.aspect) ||
    (image?.width || 1024) / (image?.height || 1536);
  const width = height * aspect;
  const geometry = new THREE.PlaneGeometry(width, height, 24, 40);
  geometry.translate(0, height / 2, 0);
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  positions.setUsage(THREE.DynamicDrawUsage);
  const rest = new Float32Array(positions.array);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: false,
    alphaTest: 0.35,
    roughness: 0.95,
    metalness: 0,
    emissive: 0x9d642b,
    emissiveIntensity: 0,
  });
  const puppet = new THREE.Mesh(geometry, material);
  puppet.name = `articulated-${kind}`;
  puppet.castShadow = true;
  puppet.receiveShadow = true;
  // Keep dynamic head/hand edges inside the culling volume.
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius *= 1.15;
  root.add(puppet);
  const visibleRaycast = function (
    this: THREE.Mesh,
    raycaster: THREE.Raycaster,
    hits: THREE.Intersection[],
  ) {
    if (this.visible) THREE.Mesh.prototype.raycast.call(this, raycaster, hits);
  };
  puppet.raycast = visibleRaycast;

  const fruitPose =
    kind === "eve" && texture.userData.poseAtlas && texture.userData.pose === 1;
  const presentationPose =
    kind === "adam" &&
    texture.userData.poseAtlas &&
    texture.userData.pose === 0;
  const split =
    (kind === "noah" && texture.userData.poseAtlas) ||
    fruitPose ||
    presentationPose
      ? partitionForearm(geometry, width, height, kind)
      : undefined;
  const workBody = split ? new THREE.Mesh(split.body, material) : undefined;
  const forearm = split ? new THREE.Mesh(split.arm, material) : undefined;
  const garmentPatch =
    split && presentationPose
      ? new THREE.Mesh(split.arm.clone(), material)
      : undefined;
  if (garmentPatch) {
    garmentPatch.name = "adam-garment-underpatch";
    garmentPatch.position.z = 0.008;
    const uv = garmentPatch.geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i) * 301 + 184,
        y = (1 - uv.getY(i)) * 854 + 18;
      const garmentX = 400 + THREE.MathUtils.clamp((x - 371) / 95, 0, 1) * 32;
      const garmentY = 440 + THREE.MathUtils.clamp((y - 325) / 64, 0, 1) * 30;
      uv.setXY(i, (garmentX - 184) / 301, 1 - (garmentY - 18) / 854);
    }
    garmentPatch.visible = false;
    garmentPatch.raycast = visibleRaycast;
    root.add(garmentPatch);
  }
  if (split && workBody && forearm) {
    forearm.geometry.translate(-split.pivot.x, -split.pivot.y, 0);
    forearm.position.copy(split.pivot);
    forearm.name = `rigid-${kind}-forearm`;
    workBody.name = `${kind}-body-without-forearm`;
    for (const mesh of [workBody, forearm]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      mesh.raycast = visibleRaycast;
      root.add(mesh);
    }
  }
  const workPositions = workBody?.geometry.getAttribute("position") as
    | THREE.BufferAttribute
    | undefined;
  const workRest = workPositions
    ? new Float32Array(workPositions.array)
    : undefined;
  const phase = kind === "adam" ? 0 : kind === "eve" ? 1.8 : 3.6;
  let lastTime: number | undefined;
  let currentGesture = 0;
  let currentTilt = 0;
  let currentSpeech = 0;
  let frozen = false;
  let disposed = false;

  return {
    root,
    update(time, mood, speaking, reduced, reaction = 0, hover = false) {
      if (disposed) return;
      // The caller owns the transient envelope; selection never moves the root.
      const touch = Number.isFinite(reaction)
        ? THREE.MathUtils.clamp(reaction, 0, 1)
        : 0;
      material.emissiveIntensity = touch * 0.16 + (hover ? 0.035 : 0);
      // Sadness stays an inward acknowledgment, not a cheerful wave.
      const acknowledgment = touch * (mood === "sad" ? 0.045 : 0.075);
      const hammering = Boolean(
        split && kind === "noah" && mood === "work" && !reduced,
      );
      const consideringFruit = Boolean(
        fruitPose && mood === "warn" && !reduced,
      );
      const presenting = Boolean(
        presentationPose && (mood === "welcome" || mood === "warn") && !reduced,
      );
      const articulated = hammering || consideringFruit || presenting;
      if (garmentPatch) garmentPatch.visible = presenting;
      puppet.visible = !articulated;
      if (workBody && forearm) {
        workBody.visible = forearm.visible = articulated;
      }
      if (reduced) {
        if (!frozen) {
          positions.array.set(rest);
          positions.needsUpdate = true;
          geometry.computeVertexNormals();
          frozen = true;
        }
        lastTime = time;
        return;
      }
      frozen = false;
      const dt =
        lastTime === undefined
          ? 1 / 60
          : Math.min(0.08, Math.max(0, time - lastTime));
      lastTime = time;
      const blend = dt === 0 ? 1 : 1 - Math.exp(-dt * 5);
      const gestureTarget = {
        welcome: 0.12,
        listen: 0.012,
        warn: 0.19,
        sad: -0.018,
        work: 0.16,
        hope: 0.12,
      }[mood];
      const tiltTarget = {
        welcome: -0.018,
        listen: 0.018,
        warn: -0.025,
        sad: 0.052,
        work: 0.028,
        hope: -0.035,
      }[mood];
      currentGesture += (gestureTarget - currentGesture) * blend;
      currentTilt += (tiltTarget - currentTilt) * blend;
      currentSpeech += ((speaking ? 1 : 0) - currentSpeech) * blend;
      const t = time + phase;
      const breath = Math.sin(t * 1.45) * 0.0035;
      // Long pauses between gestures prevent a constant pendulum effect.
      const phrase = Math.pow((Math.sin(t * 0.78) + 1) / 2, 3);
      const gesture =
        currentGesture * (0.3 + phrase * 0.7) +
        touch * (mood === "sad" ? -0.018 : 0.055);
      const headTilt =
        currentTilt +
        Math.sin(t * 0.67) * 0.013 +
        currentSpeech * Math.sin(t * 3.4) * 0.01 +
        acknowledgment;
      // Pose 0 has the mallet in the raised image-left hand. Pause, strike,
      // briefly hold, then recover: a task beat rather than perpetual waving.
      const hammerPhase = (((time % 2.6) + 2.6) % 2.6) / 2.6;
      const hammerAngle = hammering
        ? -1.9 *
          smooth(0.18, 0.32, hammerPhase) *
          (1 - smooth(0.46, 0.8, hammerPhase))
        : 0;
      // A hesitant outward presentation: pause, move away from the face, hold, return.
      // No eating beat, and no continuously oscillating hand.
      const fruitPhase = ((time % 6.4) + 6.4) % 6.4;
      const fruitAngle = consideringFruit
        ? -0.38 *
          smooth(0.9, 1.8, fruitPhase) *
          (1 - smooth(3, 4.3, fruitPhase))
        : 0;
      const presentationPhase = ((time % 6.4) + 6.4) % 6.4;
      const presentationAngle = presenting
        ? -1.15 *
          smooth(0.8, 1.8, presentationPhase) *
          (1 - smooth(3.2, 4.8, presentationPhase))
        : 0;
      if (forearm)
        forearm.rotation.z =
          (presenting
            ? presentationAngle
            : consideringFruit
              ? fruitAngle
              : hammerAngle) || 0;
      const turn = Math.sin(t * 0.48) * 0.09;
      const cos = Math.cos(headTilt);
      const sin = Math.sin(headTilt);
      const targets = [{ positions, rest }];
      if ((hammering || presenting) && workPositions && workRest)
        targets.push({ positions: workPositions, rest: workRest });
      for (const { positions, rest } of targets) {
        for (let i = 0; i < positions.count; i++) {
          const j = i * 3;
          const x = rest[j];
          const y = rest[j + 1];
          const u = x / width + 0.5;
          const v = y / height;
          // Below the ankles is exactly fixed, even during emphatic speech.
          const anchor = smooth(0.08, 0.34, v);
          const torso = smooth(0.37, 0.62, v) * (1 - smooth(0.79, 0.88, v));
          let nx = x + x * breath * torso;
          let ny = y + height * (breath + touch * 0.004) * torso;
          let nz = height * breath * 0.5 * torso;
          // The raised mallet shares the face's height, but is not part of its joint.
          const head =
            smooth(0.795, 0.865, v) * (hammering ? smooth(0.3, 0.45, u) : 1);
          const neckX = width * 0.015;
          const neckY = height * 0.795;
          const hx = x - neckX;
          const hy = y - neckY;
          nx += (hx * cos - hy * sin - hx) * head;
          ny += (hx * sin + hy * cos - hy) * head;
          // Turn the paper head in depth, with only cosine foreshortening of the face.
          nx += hx * (Math.cos(turn) - 1) * head;
          nz += -hx * Math.sin(turn) * head;
          if (presenting && positions === workPositions) {
            // Keep the cuff and garment fill registered while retaining the existing head joint.
            positions.setXYZ(
              i,
              x + (hx * cos - hy * sin - hx + hx * (Math.cos(turn) - 1)) * head,
              y + (hx * sin + hy * cos - hy) * head,
              -hx * Math.sin(turn) * head || 0,
            );
            continue;
          }
          if (kind === "eve" && !texture.userData.poseAtlas) {
            // Her hands are clasped at the chest; preserve the painted embrace.
            const hands =
              (1 - smooth(0.12, 0.25, Math.abs(u - 0.52))) *
              smooth(0.58, 0.66, v) *
              (1 - smooth(0.73, 0.78, v));
            ny += height * gesture * 0.13 * hands;
            nz += height * gesture * 0.17 * hands;
          } else {
            const armHeight =
              smooth(0.37, 0.46, v) * (1 - smooth(0.73, 0.82, v));
            const left = (1 - smooth(0.3, 0.43, u)) * armHeight;
            const right = smooth(0.59, 0.72, u) * armHeight;
            const reach = height * 0.78 - y;
            nx -= reach * gesture * left;
            nx += reach * gesture * 0.65 * right;
            ny += height * gesture * 0.18 * (left + right);
            if (mood === "work" && !hammering)
              ny += height * 0.035 * Math.sin(t * 3.2) * left;
            nz += reach * gesture * (left + right) * 0.8;
          }
          // Garment motion is local to the loose outer cloth, not sliding feet.
          const hem = smooth(0.17, 0.29, v) * (1 - smooth(0.47, 0.58, v));
          const outer = smooth(0.11, 0.27, Math.abs(u - 0.5));
          nx += height * 0.0018 * Math.sin(t * 1.1 + v * 4) * hem * outer;
          positions.setXYZ(
            i,
            x + (nx - x) * anchor,
            y + (ny - y) * anchor,
            nz * anchor,
          );
        }
        positions.needsUpdate = true;
      }
      geometry.computeVertexNormals();
      if (hammering || presenting) workBody?.geometry.computeVertexNormals();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      split?.body.dispose();
      split?.arm.dispose();
      garmentPatch?.geometry.dispose();
      material.dispose();
      root.clear();
    },
  };
}
