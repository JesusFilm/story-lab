# Nativity family

Static Mary, Joseph and baby Jesus in a straw-filled timber manger, matching
Shepherd Adventure's ending artwork. [Current Follow the Light guide](../../../styles/follow-the-light/README.md).

- [Reference](nativity-family-reference.png) and [exact ImageGen prompt](nativity-family-reference.prompt.txt).
- [Original Pixal3D model](nativity-family-pixal3d-source.glb).
- [Prepared runtime model](nativity-family-pixal3d-runtime.glb).
- [Runtime front](runtime-front.png), [runtime rear](runtime-rear.png), [source front](source-front.png).
- [Generation provenance](nativity-family-pixal3d-source.provenance.json) and [mesh review](mesh-review.json).

Native ImageGen reference; Pixal3D seed 42, resolution 1024. Runtime is 1.8 m tall,
149,691 triangles, one mesh, one UV layer and two embedded 2K textures. Prepared
with `projects/pixal3d-assets/prepare-stall.py`, height 1.8, target 150000 triangles,
texture size 2048 and Blender rotation (0, 0, 180). The original atlas is retained;
selected-to-active rebaking was unsuitable for the closely spaced forms.

The complete exported front and rear were inspected in Blender. Faces, swaddling,
cloth colors and manger silhouette remain readable. Inferred rear cloth has small
holes and coarse details; this variant is intended for frontal viewing inside a
shelter, with its back toward the wall. It is not rigged and has no animation.
Generated illustration/model, not a historical reconstruction. No third-party
reference artwork was introduced; the underlying Pixal3D software is identified
in the provenance separately from the generated asset.

An independent runtime copy is used in Shepherd Adventure's northwest shelter.
