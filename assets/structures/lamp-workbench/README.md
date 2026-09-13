# Lamp workbench

A sheltered timber workbench with a linen canopy and clear tabletop for separately
placed interactive items. [Current Follow the Light guide](../../../styles/follow-the-light/README.md).

- [Native ImageGen reference](lamp-workbench-reference.png) · [exact prompt](lamp-workbench-reference-prompt.txt)
- [Original Pixal3D model](lamp-workbench-pixal3d-source.glb) · [runtime GLB](lamp-workbench-pixal3d-runtime.glb)
- [Source front](source-front.png) · [runtime front](runtime-front.png) · [runtime rear](runtime-rear.png)
- [Generation provenance](lamp-workbench-pixal3d-source.provenance.json) · [mesh review](mesh-review.json)

Static, unrigged model generated at resolution 1024 with seed 42. The derivative
uses `projects/pixal3d-assets/prepare-stall.py`: 2.2 m high, 50,000 target triangles,
2K textures, Blender Z rotation 180°. It contains 49,879 triangles, one mesh, one
UV layer and embedded source-atlas textures. The original has 982,091 triangles.
The first generic rebake introduced canopy artifacts; the retained derivative
preserves the original UV atlas. Source and runtime front/rear renders were inspected.

Prepared bounds are approximately 2.38 × 1.82 × 2.20 m (X/Z/Y), with the central
tabletop about 0.95 m above the base. Geometry inferred behind the reference has
minor irregularities. The front is 20.17° off runtime +Z toward −X, measured from
the rear uprights; compensate before setting a world bearing. Surface raycasts
place small objects on the actual uneven boards. No hinges or animation are implied.

An independent copy replaces the procedural bench in Shepherd Adventure. The
existing lantern and oil jar remain separate models; wick and flint are small
runtime shapes supported by detailed inspection imagery. No lamp or loose part
is fused into this reusable workbench. No third-party stock asset was added.
