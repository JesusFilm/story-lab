# Square nativity stall revision — 16 September 2026

## Result

Regenerated the building reference with closed left, back and right walls and a broad front entrance. Moved the reference door into the inner left wall before generating the new Pixal3D shell. Generated the feeding trough independently so placement controls its alignment.

The shell's floor tilt and yaw were corrected using measured interior surfaces, rather than scaling its bounding box and assuming the walls were square. The interior is approximately 6 × 6 m, with exterior masonry/eaves beyond it. Preserved generated stone and timber detail; removed the exterior door awning. The final shell retains about 400k triangles; the trough retains about 150k triangles. Earlier lighter derivatives remain for comparison but are not used.

Four hay troughs align to the wall axes: left, right, back and the short front-left return. The front copy is shorter to preserve the entrance. Family transforms and baby scale remain unchanged. The donkey stands inside the back-right space, clear of family and trough bounds. The sheep stand in front of the right side. The existing lantern hangs from a small metal bracket anchored to the actual inside right-wall surface. Ground-stone scattering excludes the enlarged footprint. The wide debug camera steps back to frame the complete building.

## Review evidence

- [Annotated previous scene](before-annotated.png), [annotated previous reference](reference-annotated.png).
- [Final close-up](after-close.png), [final wide view](after-wide.png).
- [New shell reference, source, runtime, prompts and roofless plan](../../../../assets/structures/square-nativity-stall/README.md).
- [Separate trough reference, source, runtime and prompt](../../../../assets/objects/straight-feeding-trough/README.md).

The reference images were made with native ImageGen. Both models use Pixal3D. No Tripo work was required.

## Checks

`verify-nativity-area.mjs` passes checks against actual GLB geometry: left/back/right wall alignment and six-metre room boundaries, a right-wall closure grid at four heights, level earth floor, four aligned troughs within the walls, family/trough/donkey bounds without intersection, a bracket attached to the wall, and a hanger meeting the lantern handle. Existing animal/adult idle, reduced-motion, pause, gate and final-route checks also pass.

`verify-nativity-arrival.mjs` passes. Settlement and rehearsal maps were regenerated. Local close/wide review completed with no browser console errors. `git diff --check` passes.

Full portal build remains blocked by the pre-existing public-review hash mismatch for `prototypes/shepherd-adventure/index.html`; this pass updates only its own new/changed publication inputs. No merge or deployment.

## Limits

Visual acceptance is pending. The shell contains inferred timber braces and relief on its inner right wall that are not exact copies of the illustration. Surface detail is still softer than the Tripo family. Geometry checks establish practical layout and clearance, not pixel-exact image reconstruction. Architectural details remain illustrative staging rather than a verified historical reconstruction.
