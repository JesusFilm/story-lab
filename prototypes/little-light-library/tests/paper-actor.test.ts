import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createPaperActor, type PaperActorKind } from "../src/paper-actor";

function fixture(kind: PaperActorKind, atlas = false) {
  const texture = new THREE.Texture();
  texture.userData.poseAtlas = atlas;
  const actor = createPaperActor(texture, kind, 1);
  const mesh = actor.root.children[0] as THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshStandardMaterial
  >;
  const positions = mesh.geometry.getAttribute("position");
  const rest = new Float32Array(positions.array);
  return {
    actor,
    mesh,
    positions,
    rest,
    release: () => {
      actor.dispose();
      texture.dispose();
    },
  };
}

test("touch changes the selected paper actor locally while feet and root remain planted", () => {
  for (const kind of ["adam", "eve", "noah"] as const) {
    for (const atlas of [false, true]) {
      const selected = fixture(kind, atlas);
      const other = fixture(kind, atlas);
      selected.actor.root.position.set(2, 3, 4);
      for (const f of [selected, other])
        f.actor.update(2, "listen", false, false);
      // Repeated time settles mood identically; only selection differs.
      other.actor.update(2, "listen", false, false);
      selected.actor.update(2, "listen", false, false, 1);
      let headChange = 0;
      let handsChange = 0;
      for (let i = 0; i < selected.positions.count; i++) {
        const j = i * 3;
        const y = selected.rest[j + 1];
        const distance = Math.hypot(
          ...[0, 1, 2].map(
            (axis) =>
              selected.positions.array[j + axis] -
              other.positions.array[j + axis],
          ),
        );
        if (y > 0.85) headChange = Math.max(headChange, distance);
        if (y > 0.4 && y < 0.78) handsChange = Math.max(handsChange, distance);
        if (y < 0.08) {
          for (const axis of [0, 1, 2])
            assert.equal(
              selected.positions.array[j + axis],
              selected.rest[j + axis],
            );
        }
        assert.ok(Number.isFinite(distance));
        assert.ok(
          distance < 0.05,
          "reaction stays restrained relative to actor height",
        );
      }
      assert.ok(headChange > 0.006, `${kind}: perceivable head acknowledgment`);
      assert.ok(handsChange > 0.003, `${kind}: local hand/shoulder response`);
      assert.deepEqual(selected.actor.root.position.toArray(), [2, 3, 4]);
      assert.deepEqual(selected.actor.root.rotation.toArray(), [
        0,
        0,
        0,
        "XYZ",
      ]);
      assert.equal(other.mesh.material.emissiveIntensity, 0);
      assert.ok(selected.mesh.material.emissiveIntensity > 0);
      selected.release();
      other.release();
    }
  }
});

test("reduced motion gives static touch and hover feedback without deforming the illustration", () => {
  const f = fixture("eve", true);
  f.actor.update(1, "sad", true, false, 1);
  f.actor.update(2, "sad", true, true, 1, true);
  assert.deepEqual(new Float32Array(f.positions.array), f.rest);
  assert.ok(f.mesh.material.emissiveIntensity > 0.1);
  f.actor.update(3, "sad", false, true, 0, true);
  assert.deepEqual(new Float32Array(f.positions.array), f.rest);
  assert.ok(
    f.mesh.material.emissiveIntensity > 0 &&
      f.mesh.material.emissiveIntensity < 0.1,
  );
  f.actor.update(4, "sad", false, true);
  assert.equal(f.mesh.material.emissiveIntensity, 0);
  assert.deepEqual(new Float32Array(f.positions.array), f.rest);
  f.release();
});

test("a sad actor acknowledges touch without acquiring the expansive welcome gesture", () => {
  const sad = fixture("adam");
  const welcome = fixture("adam");
  for (let i = 0; i < 120; i++) {
    sad.actor.update(i / 60, "sad", false, false, 1);
    welcome.actor.update(i / 60, "welcome", false, false, 1);
  }
  // Inspect the left hand region: sadness keeps it closer to the body.
  let sadReach = 0;
  let welcomeReach = 0;
  for (let i = 0; i < sad.positions.count; i++) {
    if (
      sad.rest[i * 3] < -0.16 &&
      sad.rest[i * 3 + 1] > 0.4 &&
      sad.rest[i * 3 + 1] < 0.55
    ) {
      sadReach = Math.max(
        sadReach,
        Math.abs(sad.positions.getX(i) - sad.rest[i * 3]),
      );
      welcomeReach = Math.max(
        welcomeReach,
        Math.abs(welcome.positions.getX(i) - welcome.rest[i * 3]),
      );
    }
  }
  assert.ok(sadReach < welcomeReach / 2);
  sad.release();
  welcome.release();
});

test("Noah's hammer specialization leaves other atlas moods unchanged", () => {
  const atlas = fixture("noah", true);
  const plain = fixture("noah", false);
  for (const mood of ["welcome", "listen", "warn", "sad", "hope"] as const) {
    for (let frame = 0; frame < 10; frame++) {
      atlas.actor.update(frame / 60, mood, true, false);
      plain.actor.update(frame / 60, mood, true, false);
      assert.deepEqual(atlas.positions.array, plain.positions.array);
    }
  }
  atlas.release();
  plain.release();
});

test("Noah's rigid forearm partitions the illustration without duplicate UV coverage", () => {
  const f = fixture("noah", true);
  const body = f.actor.root.getObjectByName(
    "noah-body-without-forearm",
  ) as THREE.Mesh;
  const arm = f.actor.root.getObjectByName("rigid-noah-forearm") as THREE.Mesh;
  let area = 0;
  for (const mesh of [body, arm]) {
    const uv = mesh.geometry.getAttribute("uv");
    assert.ok(uv.count > 0);
    for (let i = 0; i < uv.count; i += 3) {
      area +=
        Math.abs(
          (uv.getX(i + 1) - uv.getX(i)) * (uv.getY(i + 2) - uv.getY(i)) -
            (uv.getY(i + 1) - uv.getY(i)) * (uv.getX(i + 2) - uv.getX(i)),
        ) / 2;
    }
  }
  assert.ok(
    Math.abs(area - 1) < 0.00001,
    "complementary body and forearm cover the original texture once",
  );
  const armRest = new Float32Array(arm.geometry.getAttribute("position").array);
  f.actor.update(0, "work", false, false);
  assert.equal(f.mesh.visible, false);
  assert.ok(body.visible && arm.visible);
  for (let frame = 0; frame < 157; frame++) {
    f.actor.update(frame / 60, "work", false, false);
    assert.deepEqual(
      arm.geometry.getAttribute("position").array,
      armRest,
      "rigid hand/tool never melt",
    );
    assert.ok(Number.isFinite(arm.rotation.z));
    for (let i = 0; i < f.positions.count; i++)
      if (f.rest[i * 3 + 1] < 0.08) {
        assert.equal(f.positions.getX(i), f.rest[i * 3]);
        assert.equal(f.positions.getY(i), f.rest[i * 3 + 1]);
      }
  }
  f.actor.update(3, "work", false, true);
  assert.ok(f.mesh.visible);
  assert.equal(arm.visible, false);
  assert.equal(body.visible, false);
  assert.deepEqual(new Float32Array(f.positions.array), f.rest);
  const hits: THREE.Intersection[] = [];
  arm.raycast(new THREE.Raycaster(), hits);
  assert.equal(hits.length, 0, "hidden arm cannot create ghost clicks");
  f.release();
});

test("the rigid Noah tool reaches waist height without translating its root", () => {
  const texture = new THREE.Texture();
  texture.userData.poseAtlas = true;
  texture.userData.aspect = 440 / 732;
  const actor = createPaperActor(texture, "noah", 1.95);
  const arm = actor.root.getObjectByName("rigid-noah-forearm") as THREE.Mesh;
  const point = new THREE.Vector3(
    (((210 - 108) / 440 - 0.5) * 1.95 * 440) / 732,
    (1 - (180 - 123) / 732) * 1.95,
    0,
  ).sub(arm.position);
  actor.update(0, "work", false, false);
  actor.root.updateMatrixWorld(true);
  const high = arm.localToWorld(point.clone());
  actor.update(1, "work", false, false);
  actor.root.updateMatrixWorld(true);
  const low = arm.localToWorld(point.clone());
  assert.ok(high.y > 1.7 && low.y > 0.85 && low.y < 1.2);
  assert.ok(high.y - low.y > 0.55);
  assert.deepEqual(actor.root.position.toArray(), [0, 0, 0]);
  actor.dispose();
  texture.dispose();
});

function eveFruitFixture(pose = 1) {
  const texture = new THREE.Texture();
  texture.userData.poseAtlas = true;
  texture.userData.pose = pose;
  texture.userData.aspect = 329 / 865;
  texture.repeat.set(329 / 1774, 865 / 887);
  texture.offset.set(724 / 1774, 1 - 878 / 887);
  const actor = createPaperActor(texture, "eve", 1.95);
  return {
    actor,
    texture,
    release() {
      actor.dispose();
      texture.dispose();
    },
  };
}

test("Eve's fruit forearm partitions pose1 exactly and moves rigidly while the cuff and feet stay planted", () => {
  const f = eveFruitFixture();
  const original = f.actor.root.children[0] as THREE.Mesh;
  const body = f.actor.root.getObjectByName(
    "eve-body-without-forearm",
  ) as THREE.Mesh;
  const arm = f.actor.root.getObjectByName("rigid-eve-forearm") as THREE.Mesh;
  assert.ok(body && arm, "pose1 needs the dedicated fruit-hand partition");
  let area = 0;
  for (const mesh of [body, arm]) {
    const uv = mesh.geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i += 3)
      area +=
        Math.abs(
          (uv.getX(i + 1) - uv.getX(i)) * (uv.getY(i + 2) - uv.getY(i)) -
            (uv.getY(i + 1) - uv.getY(i)) * (uv.getX(i + 2) - uv.getX(i)),
        ) / 2;
  }
  assert.ok(Math.abs(area - 1) < 1e-5);
  const armRest = Array.from(arm.geometry.getAttribute("position").array);
  const bodyRest = Array.from(body.geometry.getAttribute("position").array);
  const fullRest = Array.from(original.geometry.getAttribute("position").array);
  let maximum = 0;
  for (let i = 0; i <= 64; i++) {
    f.actor.update(i / 10, "warn", true, false);
    assert.equal(original.visible, false);
    assert.ok(arm.visible && body.visible);
    assert.deepEqual(
      Array.from(arm.geometry.getAttribute("position").array),
      armRest,
    );
    assert.deepEqual(
      Array.from(body.geometry.getAttribute("position").array),
      bodyRest,
    );
    maximum = Math.max(maximum, Math.abs(arm.rotation.z));
  }
  assert.ok(
    maximum > 0.3 && maximum < 0.5,
    "clear but restrained elbow motion",
  );
  assert.equal(
    arm.rotation.z,
    0,
    "a full gesture returns to the authored pose",
  );
  f.actor.update(2.4, "warn", true, true);
  assert.ok(original.visible && !body.visible && !arm.visible);
  assert.deepEqual(
    Array.from(original.geometry.getAttribute("position").array),
    fullRest,
  );
  assert.deepEqual(f.actor.root.position.toArray(), [0, 0, 0]);
  const hits: THREE.Intersection[] = [];
  arm.raycast(new THREE.Raycaster(), hits);
  assert.equal(hits.length, 0, "hidden fruit hand cannot accept ghost clicks");
  assert.equal((arm.material as THREE.MeshStandardMaterial).map, f.texture);
  f.actor.update(2.4, "warn", false, false, 1);
  assert.ok((arm.material as THREE.MeshStandardMaterial).emissiveIntensity > 0);
  let textureDisposals = 0;
  f.texture.addEventListener("dispose", () => textureDisposals++);
  f.actor.dispose();
  assert.equal(
    textureDisposals,
    0,
    "actor never disposes the caller-owned texture",
  );
  f.release();
});

test("Eve fruit specialization does not alter other moods or atlas poses", () => {
  const f = eveFruitFixture(1),
    other = eveFruitFixture(0);
  assert.equal(
    other.actor.root.getObjectByName("rigid-eve-forearm"),
    undefined,
  );
  for (const mood of ["welcome", "listen", "sad", "work", "hope"] as const) {
    f.actor.update(2, mood, false, false);
    other.actor.update(2, mood, false, false);
    const a = f.actor.root.children[0] as THREE.Mesh;
    const b = other.actor.root.children[0] as THREE.Mesh;
    assert.deepEqual(
      a.geometry.getAttribute("position").array,
      b.geometry.getAttribute("position").array,
    );
    assert.ok(a.visible);
  }
  f.release();
  other.release();
});

function adamPresentationFixture(pose = 0) {
  const texture = new THREE.Texture();
  texture.userData.poseAtlas = true;
  texture.userData.pose = pose;
  texture.userData.aspect = 301 / 854;
  const actor = createPaperActor(texture, "adam", 1.95);
  return {
    actor,
    texture,
    release() {
      actor.dispose();
      texture.dispose();
    },
  };
}

test("Adam presentation partitions skin once, holds rigid dimensions and restores the complete original pose", () => {
  const f = adamPresentationFixture();
  const full = f.actor.root.children[0] as THREE.Mesh;
  const arm = f.actor.root.getObjectByName("rigid-adam-forearm") as THREE.Mesh;
  const body = f.actor.root.getObjectByName(
    "adam-body-without-forearm",
  ) as THREE.Mesh;
  const patch = f.actor.root.getObjectByName(
    "adam-garment-underpatch",
  ) as THREE.Mesh;
  assert.ok(
    arm && body && patch,
    "presentation requires an isolated skin joint and garment-only fill",
  );
  let area = 0;
  const triangles: number[][] = [];
  for (const mesh of [arm, body]) {
    const uv = mesh.geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i += 3) {
      const t = Array.from({ length: 6 }, (_, j) =>
        j % 2 ? uv.getY(i + Math.floor(j / 2)) : uv.getX(i + Math.floor(j / 2)),
      );
      area +=
        Math.abs(
          (t[2] - t[0]) * (t[5] - t[1]) - (t[3] - t[1]) * (t[4] - t[0]),
        ) / 2;
      triangles.push(t);
    }
  }
  assert.ok(Math.abs(area - 1) < 1e-5);
  // Interior sample coverage catches overlapping triangles that an area sum alone could conceal.
  for (let u = 0.017; u < 1; u += 0.041137)
    for (let v = 0.019; v < 1; v += 0.043197) {
      let count = 0;
      for (const t of triangles) {
        const signs = [0, 1, 2].map((i) => {
          const j = (i + 1) % 3;
          return (
            (t[j * 2] - t[i * 2]) * (v - t[i * 2 + 1]) -
            (t[j * 2 + 1] - t[i * 2 + 1]) * (u - t[i * 2])
          );
        });
        if (signs.every((x) => x > 1e-10) || signs.every((x) => x < -1e-10))
          count++;
      }
      assert.equal(
        count,
        1,
        "original texture has neither holes nor duplicate triangle coverage",
      );
    }
  const armRest = Array.from(arm.geometry.getAttribute("position").array);
  const bodyRest = Array.from(body.geometry.getAttribute("position").array);
  const fullRest = Array.from(full.geometry.getAttribute("position").array);
  for (const time of [0, 2, 4, 6]) {
    f.actor.update(time, "welcome", true, false);
    assert.ok(arm.visible && body.visible && patch.visible && !full.visible);
    assert.deepEqual(
      Array.from(arm.geometry.getAttribute("position").array),
      armRest,
    );
    const bodyPositions = body.geometry.getAttribute("position");
    for (let i = 0; i < bodyPositions.count; i++) {
      if (bodyRest[i * 3 + 1] <= 1.95 * 0.795) {
        assert.equal(bodyPositions.getX(i), bodyRest[i * 3]);
        assert.equal(bodyPositions.getY(i), bodyRest[i * 3 + 1]);
        assert.equal(bodyPositions.getZ(i), bodyRest[i * 3 + 2]);
      }
      assert.ok(
        Number.isFinite(bodyPositions.getX(i)) &&
          Number.isFinite(bodyPositions.getY(i)) &&
          Number.isFinite(bodyPositions.getZ(i)),
      );
    }
    assert.ok(
      Array.from(bodyPositions.array).some(
        (value, i) => Math.abs(value - bodyRest[i]) > 1e-5,
      ),
      "existing head articulation remains alive",
    );
    assert.ok(Number.isFinite(arm.rotation.z));
    f.actor.root.updateMatrixWorld(true);
    const armPositions = arm.geometry.getAttribute("position");
    for (let i = 0; i < armPositions.count; i++) {
      const point = arm.localToWorld(
        new THREE.Vector3().fromBufferAttribute(armPositions, i),
      );
      assert.ok(
        Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          Number.isFinite(point.z),
      );
      assert.ok(
        Math.abs(point.x) <= (1.95 * 301) / 854 / 2 + 1e-6 &&
          point.y >= 0 &&
          point.y <= 1.95,
        "hand stays within original actor envelope",
      );
    }
    if (time === 2)
      assert.ok(
        Math.abs(arm.rotation.z) > 1.1 && Math.abs(arm.rotation.z) < 1.2,
      );
    if (time === 0 || time === 6) assert.equal(arm.rotation.z, 0);
  }
  const uv = patch.geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    const x = uv.getX(i) * 301 + 184,
      y = (1 - uv.getY(i)) * 854 + 18;
    assert.ok(
      x >= 399.9 && x <= 432.1 && y >= 439.9 && y <= 470.1,
      "underpatch samples verified opaque garment only",
    );
  }
  f.actor.update(2, "welcome", true, true);
  assert.ok(full.visible && !arm.visible && !body.visible && !patch.visible);
  assert.deepEqual(
    Array.from(full.geometry.getAttribute("position").array),
    fullRest,
  );
  const hits: THREE.Intersection[] = [];
  for (const mesh of [arm, body, patch])
    mesh.raycast(new THREE.Raycaster(), hits);
  assert.equal(hits.length, 0);
  assert.deepEqual(f.actor.root.position.toArray(), [0, 0, 0]);
  f.release();
});

test("Adam presentation leaves other poses and moods on their existing full-pose animation", () => {
  const rig = adamPresentationFixture(),
    plain = adamPresentationFixture(1);
  assert.equal(
    plain.actor.root.getObjectByName("rigid-adam-forearm"),
    undefined,
  );
  for (const mood of ["sad", "hope", "listen", "work"] as const) {
    rig.actor.update(2, mood, false, false);
    plain.actor.update(2, mood, false, false);
    const a = rig.actor.root.children[0] as THREE.Mesh,
      b = plain.actor.root.children[0] as THREE.Mesh;
    assert.ok(a.visible);
    assert.deepEqual(
      a.geometry.getAttribute("position").array,
      b.geometry.getAttribute("position").array,
    );
  }
  rig.release();
  plain.release();
});
