# Walkthrough character V2 comparison

- Status: done — implemented and verified; awaiting visual review and playtest
- Owner: Codex
- Last updated: 2026-09-10
- Objective: integrate the generated Tripo shepherd and its five clips into the
  local village walkthrough while preserving the current character as a live V1
  comparison.
- Accepted scope: requested by Jaco on 2026-09-10.
- Dependencies: the existing walkthrough, Three.js 0.169.0, and the generated
  `follow-the-light-aa` combined Tripo GLB.

## Scope

1. Keep the current Blender placeholder and procedural limb motion as V1.
2. Add a V2 character path using the canonical combined Tripo output without
   copying or changing the generated asset.
3. Drive V2 with the authored idle, walk, run and turn clips. Use look-around as
   an occasional stationary variation, matching the asset's recorded playback
   intent.
4. Allow V1/V2 switching during intro, play and pause without resetting the
   controller, route, distance, footprints, difficulty or run classification.
5. Provide URL-selectable comparison paths and an in-game version toggle.

## Completion checks

- Both model paths load from the local server and can be selected by URL.
- The character path and URL marker switch correctly; the later
  [environment V2 comparison](2026-09-10-walkthrough-environment-v2.md) deliberately
  extends the same version control to low walls and homes.
- Position, heading, distance, decision, footprints and route state survive each
  switch.
- V2 selects idle, walk, run and turn from actual controller state and can play
  the look-around idle variation.
- Existing controller, map and browser checks remain green; desktop and mobile
  layouts keep the toggle reachable.

## Open review

The Tripo mesh, rig and clips still await Jaco's visual acceptance. Integration is
for comparison and playtesting only. In particular, the generated turn pose,
garment deformation, foot contact, orientation, scale and device performance need
review in the actual walkthrough.

## Results

- V2 is the default and loads the canonical 4.15 MB combined Tripo GLB through a
  narrow server alias. V1 remains the original local GLB and procedural motion.
- `?character=v1` and `?character=v2` select direct paths. The in-game button and
  `V` shortcut switch the mounted character—and, after the linked environment
  extension, the versioned village layer—while retaining the same controller and
  run objects; the URL marker changes with `history.replaceState`.
- Runtime calibration uses skinned vertices from the fully weighted idle pose,
  producing a 1.72 m character with corrected forward direction and ground contact.
- V2 maps walking, running, stationary and turning controller states to the
  authored clips. Look-around plays once after a sustained stationary interval.
- The focused browser suite passed URL selection, all five clips, animation-state
  mapping, exact state preservation in both switch directions and mobile access.
  Controller, Foundry village and the complete existing browser regression suite
  also passed. Short headless frame timing remained 16.7 ms median / 16.8 ms p95;
  this is not a physical-device benchmark.
