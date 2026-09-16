# Resting nativity donkey

A standing brown-gray donkey with a locally authored eight-second head and breathing idle. The lower legs remain fixed. This is an idle-only rig, not a walking rig. The prototype uses 82% scale and places it inside the right side of the shelter, behind the entrance sheep.

Style: [Follow the Light](../../../styles/follow-the-light/README.md).

- [Reference](nativity-donkey-reference.png) and [exact prompt](nativity-donkey-reference.prompt.txt).
- [Original Pixal3D model](nativity-donkey-pixal3d-source.glb), with adjacent generator/settings/hash provenance.
- [Runtime model](nativity-donkey-idle.glb). Source UVs retained; matte materials and 2048px textures.
- [Front review](prepared/runtime-front.png) and [rear review](prepared/runtime-rear.png).

Generated with TencentARC/Pixal3D from a native ImageGen reference. Prepared with `projects/pixal3d-assets/prepare-decoration.py`. The original source remains intact.

Animation: `projects/pixal3d-assets/animate-standing-donkey.py`; editable Blender rig alongside the runtime. [Deformation check](idle-review.json): fixed hooves, about 2 cm maximum upper-body motion, closed loop.
