import * as THREE from "three";

export const FOLD_LAYER_GAP = 0.004;

/** Keep flat cutouts on distinct paper layers and restore their original lighting as they rise. */
export function popupFoldSurface(
  popup: THREE.Group,
  index: number,
  unfolded: number,
) {
  const open = THREE.MathUtils.clamp(unfolded, 0, 1);
  popup.userData.foldBaseZ ??= popup.position.z;
  popup.position.z =
    popup.userData.foldBaseZ + index * FOLD_LAYER_GAP * (1 - open);
  const standing = open > 0.04;
  popup.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.userData.foldShadowState ??= {
      cast: object.castShadow,
      receive: object.receiveShadow,
    };
    const original = object.userData.foldShadowState;
    object.castShadow = standing && original.cast;
    object.receiveShadow = standing && original.receive;
    if (object.userData.foldSupport) object.visible = standing;
  });
}
