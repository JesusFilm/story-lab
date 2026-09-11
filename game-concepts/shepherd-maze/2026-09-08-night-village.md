# Lamplit night village

- Status: done — implemented and verified; awaiting playtest
- Owner: Codex
- Last updated: 2026-09-08
- Objective: play the village at night, with structure lamps lighting paths and softly glowing neon footprints.
- Accepted scope: Jaco requested this visual direction in the current task on 2026-09-08.
- Implementation choices: cool moonlight, warm amber lamps, mint neon footprints. Colour/intensity tuning awaits playtest.
- Dependencies: current [village](2026-09-08-village-map.md), existing Three.js runtime and generated geometry.
- Scope: runtime lighting, visible lanterns, footprint rendering and minimap treatment; preserve map and gameplay.

## Implementation

1. Preserve daylight source, add structure-mounted lamps and night lighting with a bounded active light count.
2. Add feathered footprint halos that share the existing lifetime and pause behaviour.
3. Inspect desktop/mobile night views, check browser errors and frame pacing, and record reproduction and limits.

## Completion checks

Night reads clearly while the shepherd and path choices remain visible. Warm lamps visibly illuminate paths. Footprints have soft neon glow and retain their 60-second lifetime. No map/collision changes. Browser controls and renders remain valid. Physical-device verification remains open.

## Results and limits

- Runtime [night module](../../prototypes/shepherd-maze/src/night-village.mjs) builds amber lanterns on the village structures, blends six nearby point lights, and adds warm ground pools. Cool directional moonlight and low sky fill establish night while keeping the shepherd readable.
- Soft mint footprint halos and bright cores share the existing trail-age buffer; the minimap uses matching glow. Existing expiry, pause and controls remain unchanged.
- Existing headless Chrome suite passes geometry bounds, walking, early/late choices, pause, assistance policies, completion, reset and mobile touch, with no browser errors. Desktop and 390 × 844 night captures inspected. Records: [night browser verification](../../prototypes/shepherd-maze/checks/night-browser-verification.json).
- The map, collision grid, route logic and Blender geometry were not changed. Daylight source was archived before editing; historical daylight captures remain.
- Lighting is authored at runtime, so the saved Blender geometry overview remains daylight. Lantern lights do not cast individual shadows; light spill is approximate. Physical-device performance and colour/intensity preferences await playtesting.

Next: Jaco to playtest the night palette and trail readability; physical-device checks remain unassigned.
