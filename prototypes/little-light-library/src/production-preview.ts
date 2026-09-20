import * as THREE from "three";
import { AuthoredStage } from "./authored-stage";
import type { AuthoredBook } from "./authored-book";

/** Uses exactly the reader's stage geometry and motions. */
export function createProductionPreview(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-label", "Book playback preview");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  camera.position.set(0, 7, 9);
  camera.lookAt(0, 0.9, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbcaa8c, 3));
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(-3, 7, 5);
  scene.add(light);
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  scene.add(root);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6.36, 3.3, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x5e756a, roughness: 1 }),
  );
  base.position.z = -0.15;
  root.add(base);
  for (const x of [-1.54, 1.54]) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(3.05, 3.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xfffbef, roughness: 1 }),
    );
    leaf.position.set(x, 0, -0.03);
    root.add(leaf);
  }
  let stage: AuthoredStage | undefined;
  let generation = 0;
  return {
    async load(book: AuthoredBook, index: number, durations: number[]) {
      const token = ++generation;
      const next = await AuthoredStage.create(
        book,
        book.spreads[index],
        new THREE.TextureLoader(),
        () => generation === token,
      );
      if (token !== generation) {
        next?.dispose();
        return false;
      }
      if (stage) {
        root.remove(stage.root);
        stage.dispose();
      }
      stage = next;
      stage.popups.forEach((popup) => (popup.rotation.x = Math.PI / 2));
      root.add(stage.root);
      stage.narrationDurations(durations);
      stage.begin();
      return true;
    },
    update(
      position: number,
      playing: boolean,
      reduced: boolean,
      narrationEnabled = true,
    ) {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      if (
        renderer.domElement.width !==
          Math.round(width * renderer.getPixelRatio()) ||
        renderer.domElement.height !==
          Math.round(height * renderer.getPixelRatio())
      ) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      stage?.update(position, playing, reduced, false, true, narrationEnabled);
      renderer.render(scene, camera);
    },
    activate(id: string) {
      return stage?.activate(id);
    },
    clear() {
      generation++;
      if (stage) {
        root.remove(stage.root);
        stage.dispose();
        stage = undefined;
      }
    },
  };
}
