# Walkthrough environment V2 comparison

- Status: done — implemented and verified; awaiting visual review and playtest
- Owner: Codex
- Last updated: 2026-09-10
- Objective: integrate the generated low-wall-kit, House 01, market stall, animal
  pen, structure lamp and animated sheep outputs into the walkthrough's V2
  presentation while preserving the procedural village as a live V1 comparison.
- Accepted scope: requested by Jaco on 2026-09-10.
- Follow-up scope: Jaco requested replacing all low planted courtyards with homes
  in V2 on 2026-09-10; V1 and Foundry classification remain unchanged.
- Dependencies: the existing walkthrough, its Maze Foundry village map, Three.js
  0.169.0, and the six generated `follow-the-light-aa` asset GLBs.

## Scope

1. Replace every maze solid classified as `low-wall` with the generated straight
   low-wall model in V2.
2. Replace every solid classified as `home` and every `low-courtyard` with House 01
   in V2. Keep the 143 courtyard rectangles classified as-is for collision and V1.
3. Replace all 17 `market` and 15 `animal-stall` solids with the generated market
   stall and animal pen. Face their openings toward the nearest walkable lane.
4. Replace the 82 wall-mounted procedural fixtures with the generated structure
   lamp. Hide V1's freestanding courtyard fixtures when their footprints show V2
   homes while retaining the runtime light pools as warm interior light.
5. Place exactly one generated sheep in every animal pen. Alternate its authored
   idle and in-place walk clips along a short contained pen path.
6. Scale, orient, center and ground each visual model inside its corresponding
   rectangle. Keep the Foundry map and legacy Blender solids authoritative for
   collision, route clearance, minimap rendering and geometry QA.
7. Preserve all other village structures and lighting in both versions.
8. Make the existing V1/V2 button and `V` shortcut switch the character and these
   environment layers together without recreating the run.

## Completion checks

- All 56 `low-wall`, 9 `home`, 143 `low-courtyard`, 17 `market` and 15
  `animal-stall` rectangles receive one V2 replacement. Every `low-courtyard`
  replacement uses House 01.
- Exactly 82 generated wall lamps and 15 sheep load in V2. Every sheep remains
  inside its pen and both `idle` and `preset:quadruped:walk` are active.
- Every generated replacement is grounded and contained within its authoritative
  Foundry rectangle.
- V1 shows all 240 legacy structures and no generated lamps/sheep; V2 shows the inverse.
- Position, heading, distance, elapsed time, footprints, decision, difficulty and
  route state survive a live switch.
- Direct V1/V2 URLs, all five shepherd animation states, controller/map checks and
  the complete desktop/mobile browser suite remain green.

## Results

- V2 loads all six canonical GLBs through narrow loopback-server aliases; no
  generated source asset is copied or edited.
- Runtime fitting uses each GLB's measured bounds. Low walls are inset 0.02 m per
  side and held at 0.90 m high. Houses are inset 0.18 m per side and preserve the
  source model's proportions across the short footprint axis, resulting in an
  approximately 2.98 m height on both the current 12 × 4 m home rectangles and the
  4 × 4 m courtyard footprints. House 01 now appears 152 times in V2.
- Market and pen exports are held at 2.80 m high and their visual fronts face the
  nearest graph lane. Generated tall structures participate in camera-obstruction
  fade; low walls remain see-over scenery. Collision and routing remain unchanged.
- The wall lamp is instanced 82 times to keep draw calls bounded; existing halos,
  ground pools and the six-nearest-light pool provide its runtime illumination.
- Fifteen independently cloned sheep skeletons alternate the six-second authored
  idle and 2.6-second in-place walk while moving 2.7 m inside their pen footprints.
- The actual market, pen and lamp GLBs and both sheep clips were inspected in the
  local read-only asset viewer before integration. Their recorded approval remains pending.
- A focused browser check verified 240/240 fits, including all 143 courtyard-home
  mappings, plus lamp/sheep counts and clips, V1/V2 visibility, direct V1 loading,
  live state preservation and no browser errors. The established controller,
  Foundry, character and complete browser suites also passed.
- The short headless desktop frame sample remained 16.7 ms median / p95. This is
  not a sustained or physical-device performance result.

## Open review

All generated models and sheep motion still await Jaco's visual acceptance. House,
market and pen scale, the dense repeated use of House 01 on the 143 compact former
courtyards, lamp mounting/orientation, sheep foot
contact, texture response under night lighting and device performance need playtesting.
The animal pen's recorded dirt base has an open/missing region which the walkthrough
terrain currently covers; the market similarly relies on the shared terrain floor.
The lamp export is unlit, so runtime halos and point lights remain responsible for
emission and spill. The current low-wall Tripo
output contains one straight segment rather than corner, T, cross and end pieces;
rotated straight segments therefore meet by overlap and may show seams at joins.
This V2 integration does not mark the models or their joins approved.
