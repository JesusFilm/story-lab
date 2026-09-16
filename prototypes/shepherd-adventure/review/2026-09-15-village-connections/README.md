# Annex leveling and wall connections

The prior annex was rotated correctly in plan but its generated mesh contained
13.8° of pitch/roll. Fitting the dominant base plane and rotating that plane to
horizontal fixes the tilt in all six instances. The exported model measures
0.28° at the base and 0.96° at the roof. Terrain mounting retains a small burial
margin. The original generated source is preserved.

The replacement derivative retains 159,783 triangles instead of 79,837, improving
stone edges while keeping the 2K source colors and matte material. Its surface
is still softer and less clean than the main Tripo house. No new generation or
provider switch was needed for this repair.

## Wall connections

The prior blue-line coordinates left gaps because they were not connected to
actual model faces. Each run now names its start/end host. A horizontal ray at
masonry height finds the real surface and embeds the endpoint by 0.32 m. This
avoids using roof overhangs as wall boundaries. Intentional free ends remain.

Connections include houses 2–5, 7–4 and 10–11; house 6–empty stall–house 9 annex;
short runs at houses 1 and 3 and annexes 5 and 8; and the two southern perimeter
joins. All 17 joins pass a separate ray test along the resulting wall segment.

## Current captures

- [House 9: leveled annex and connected wall](house-9.png)
- [House 3](house-3.png) · [House 8](house-8.png)
- [Gate, stall and House 9 connections](gate-connections.png)
- [Houses 2–5 connection](south-connections.png)
- [Houses 10–11 connection](north-village.png)
- [Updated map](village-map.png) · [mobile check](mobile-house-3.png)

## Verification

- [Measured annex planes](annex-level.json): base <1°, roof <2°.
- `checks/verify-village-layout.mjs`: rotations, six annex joins, decorations and
  17 actual-mesh/perimeter wall contacts.
- [Full route/state geometry](geometry-and-state.json): no clearance failures.
- [Camera samples](camera-samples.json): no hidden-player samples in 2,002 frames
  each for landscape and portrait.
- Actual-game screenshots and mobile reduced-motion loading: no JavaScript errors.

The public portal build retains its pre-existing source-review hash blocker.
Changed runtime inputs have current publication hashes. This is a local review;
no commit, push or deployment was performed.
