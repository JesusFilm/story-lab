# Pottery market stall

A stocked static shop for Shepherd Adventure. [Follow the Light style](../../../styles/follow-the-light/README.md).

- [Reference image](pottery-market-stall-reference.png) · [Exact native ImageGen prompt](pottery-market-stall-prompt.txt)
- [Original Pixal3D model](pottery-market-stall-pixal3d-source.glb)
- [Prepared runtime model](pottery-market-stall-pixal3d-runtime.glb)
- [Source comparison](source-front.png) · [Runtime front](runtime-front.png) · [Runtime rear](runtime-rear.png)
- [Generation settings and hashes](pottery-market-stall-pixal3d-source.provenance.json) · [Mesh review](mesh-review.json)

Prepared at 2.8 m high, base at zero, centered in X/Z. The counter faces approximately -28° from +Z
(measured toward +X), as checked in a roofless top-down render. Compensate
for this local front offset when setting a world-facing direction.
Runtime proportions are preserved with uniform scaling. The model is one static
mesh: canopy, counter and stock are not separate interactive pieces; no animation.
The runtime has approximately 149,894 triangles and two embedded 2K
material textures. The original full-resolution export remains unchanged.

Preparation uses [prepare-stall.py](../../../projects/pixal3d-assets/prepare-stall.py)
with 150,000 target triangles, 2048 textures and Blender rotation `0 0 180`.
It welds and conservatively simplifies geometry while retaining source UVs;
source and reimported runtime renders check silhouette and texture preservation.
Hidden surfaces are inferred, with some simplified stock and small texture seams.
This is a route-side prototype asset, not a finished close-up shop interior.

Artwork: native ImageGen reference, reconstructed with TencentARC/Pixal3D at
resolution 1024, seed 42. Model software licensing is separate from generated
artwork provenance; no third-party stock models or textures were incorporated.
Shepherd Adventure owns an independent runtime copy in its own assets folder.
