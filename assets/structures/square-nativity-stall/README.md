# Square nativity stall

Generated empty shell with full left, back and right stone walls, a broad front entrance and an interior left door. Floor plane and back-wall direction are measured before alignment. The prepared interior is 6 × 6 m; masonry and eaves extend beyond it. Removed the inferred exterior door awning. The runtime retains the source masonry, timber and roof geometry and UVs.

Style: [Follow the Light](../../../styles/follow-the-light/README.md).

- [Reference](square-nativity-stall-reference.png) and [prompt](square-nativity-stall-reference.prompt.txt).
- [Original Pixal3D model](square-nativity-stall-pixal3d-source.glb), with adjacent generator/hash provenance.
- [Aligned runtime](square-nativity-stall-aligned.glb), with alignment measurements beside it.
- [Front render](aligned-eye.png), [top render](aligned-top.png).

Generated from native ImageGen artwork with TencentARC/Pixal3D. Atlas-preserving preparation uses 2048px matte textures. Sources and earlier preparation variants are preserved. These are illustrative Judean-inspired props, not archaeological reconstructions.

The final reference is a door-placement edit of [the initial reference](square-nativity-stall-reference-initial.png), with both exact prompts retained. Preparation: `projects/pixal3d-assets/align-square-stall.py`. [Roofless plan](cutaway-top.png) shows the interior boundaries.

The final runtime derives from `prepared-detailed/` (about 400k triangles). The earlier 180k derivative was too coarse for the close-up.
