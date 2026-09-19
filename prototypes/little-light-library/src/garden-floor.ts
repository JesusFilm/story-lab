import * as THREE from "three";

/** Two printed page surfaces. Texture belongs to the caller's stage, never to this helper. */
export function createGardenFloor(texture: THREE.Texture) {
  const root = new THREE.Group();
  root.name = "garden-floor";
  root.userData.staticPageSurface = true;
  root.position.z = 0.045;
  const halfWidth = 2.86,
    gutter = 0.045,
    depth = 3;
  for (const side of [-1, 1]) {
    const width = halfWidth - gutter;
    const geometry = new THREE.PlaneGeometry(width, depth);
    const center = (side * (halfWidth + gutter)) / 2;
    geometry.translate(center, 0, 0);
    const position = geometry.getAttribute("position");
    const uv = geometry.getAttribute("uv");
    for (let i = 0; i < position.count; i++) {
      uv.setXY(
        i,
        (position.getX(i) + halfWidth) / (halfWidth * 2),
        position.getY(i) / depth + 0.5,
      );
    }
    // Independent materials let the existing stage traversal release each exactly once.
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      side: THREE.DoubleSide,
      roughness: 1,
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.name = side < 0 ? "garden-floor-left" : "garden-floor-right";
    panel.receiveShadow = true;
    root.add(panel);
  }
  return root;
}
