# Terracotta oil jar

One handcrafted, two-handled oil jar for a lamp-maker's workbench.
[Follow the Light style](../../../styles/follow-the-light/README.md).

- [Reference image](oil-jar-reference.png) and [exact native ImageGen prompt](oil-jar-reference-prompt.txt).
- [Full-resolution Pixal3D source](oil-jar-pixal3d-source.glb): 978,578 triangles, two embedded 4K textures.
- [Runtime model](oil-jar-pixal3d-runtime.glb): 7,998 triangles, baked 1K base color, roughness and normal maps; 28 cm tall, metres, Y-up, base at zero.
- [Source render](source-front.png), [runtime front](runtime-front.png) and [runtime rear](runtime-rear.png).
- [Generation provenance](oil-jar-pixal3d-source.provenance.json) and [mesh preparation record](mesh-review.json).

Generated with [TencentARC/Pixal3D](https://github.com/TencentARC/Pixal3D), seed 42,
resolution 1024, low-VRAM/SDPA with BiRefNet background removal. The source is
retained unchanged. The runtime derivative corrects a 30-degree tilt in Blender X,
welds coincident vertices, decimates, creates new UVs and bakes source appearance.
Directly decimating split GLB vertices tears the mesh; retaining collapsed UVs
produces triangular texture artifacts. Both issues are handled by the
[preparation workflow](../../../projects/pixal3d-assets/README.md).

Front/rear renders show a readable jar with open mouth and distinct handles.
The model is a reconstruction with a softer surface and less regular rim than
the reference; small rear/rim bake blemishes remain. Suitable for a small static
prototype prop, not a finished close-up asset or a rigged character. The source
and derivative have not received a final art acceptance review.

Shepherd Adventure owns an independent runtime copy for its workbench; the
reference and model are also listed in the local portal asset gallery.
