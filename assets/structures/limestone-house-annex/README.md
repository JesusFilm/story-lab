# Limestone house annex

Low flat-roofed side room for the Shepherd Adventure village, matching the cream
plaster, limestone corners and timber shutters of House 01. This is illustrative
game architecture, not a documented historical reconstruction.

[Follow the Light style](../../../styles/follow-the-light/README.md).

- [Reference](limestone-house-annex-reference.png) · [exact prompt](limestone-house-annex-prompt.txt)
- [Original Pixal3D model](limestone-house-annex-pixal3d-source.glb)
- [Prepared runtime](runtime-level/limestone-house-annex-pixal3d-runtime.glb)
- [Front render](runtime-level/runtime-front.png) · [rear render](runtime-level/runtime-rear.png)
- [Mesh review](runtime-level/mesh-review.json) · [provenance](provenance.json)

Native ImageGen reference based on the existing house reference, then Pixal3D,
seed 42, resolution 1024. Prepared at 2.65 m high with a 160,000 triangle target and
2K source textures. Welded geometry is validated before decimation to remove
invalid duplicate faces. A 28.5° alignment correction makes walls parallel to
the runtime axes. The generated base had 13.8° of pitch/roll; leveling its fitted
plane reduces this to 0.28°. The roof remains within 1° of horizontal. The
material uses nonmetallic matte stone. The original source
is preserved.

Local +Z faces the shutter, Y is up, base near zero. The prototype rotates the
shutter toward the host facade and fits the footprint to each attachment side.
House-local connector centres: ±4.4 m on Z for side rooms; −3.9 m on X for the
rear room. Runtime placement overlaps the main wall slightly to conceal seams.
No exterior entrance or interaction; hidden surfaces are generated inferences.

The prototype owns an independent model copy. No external model pack or stock
texture was incorporated.

The selected derivative has 159,783 triangles. Retaining more geometry improves
stone edges, but the generated surface remains softer and less clean than the
main Tripo house. This local repair did not run another generation.
