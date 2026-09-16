# Olive wall cluster A

Reusable static house decoration for Shepherd Adventure: terracotta containers,
low limestone edging and olive-like foliage rooted behind the props. The basket
variants add woven wicker. Botanical identity and historical details are illustrative.

[Follow the Light style guide](../../../styles/follow-the-light/README.md).
Inspired by the [original House 3 illustration](../../../prototypes/shepherd-adventure/review/2026-09-13-house-3/first-draft-art/lit-door.png).

- [Reference](olive-wall-cluster-a-reference.png) · [exact ImageGen prompt](olive-wall-cluster-a-reference-prompt.txt)
- [Transparent model input](olive-wall-cluster-a-reference-cutout.png) · [extraction prompt](olive-wall-cluster-a-cutout-prompt.txt)
- [Original selected model](olive-wall-cluster-a-cutout-pixal3d-source.glb)
- [Prepared model](runtime-cutout/olive-wall-cluster-a-cutout-pixal3d-runtime.glb)
- [Front render](runtime-cutout/runtime-front.png) · [rear render](runtime-cutout/runtime-rear.png)
- [Mesh review](runtime-cutout/mesh-review.json) · [provenance](provenance.json)

Native ImageGen reference and Pixal3D model, 15 September 2026. Prepared with
150,000 target triangles and 2K source textures. The generic re-bake damages thin
foliage; this derivative retains the source UV atlas. Local +Z faces forward,
Y is up, and the base is near zero. House placement fits width/height, compresses
excess inferred depth and grounds each independent copy on the terrain.

Hidden surfaces and fine leaves are inferred. Inspect at intended game distance;
these are decorative props, with no animation or interaction. The prototype owns
its own model copy. No external model pack or stock texture was incorporated.

The original opaque-input source is retained; it omitted much of the foliage.
The selected model uses an ImageGen alpha cutout to preserve the full silhouette.
