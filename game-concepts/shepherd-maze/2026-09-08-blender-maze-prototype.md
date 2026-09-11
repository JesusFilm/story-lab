# Blender maze and arrow controller experiment

- Status: done — experiment built and verified; awaiting user review
- Owner: Codex (current task); integration owner unassigned
- Last updated: 2026-09-08
- Objective: make a smooth, front-on 3D character preview and a playable arrow-controlled world matching the saved maze.
- Scope: isolated [prototype](../../prototypes/shepherd-maze/README.md), editable Blender character/world, GLB exports, basic walls/buildings/cars, collision, camera views, destination feedback.

## Direction and assumptions

Jaco requested this experiment on 2026-09-08. The authoritative floorplan is
[maze-layout.json](../../assets/references/reference-pack-v1/storyline-1-shepherd/map/maze-layout.json).
Its 168 solid rectangles, 35 × 35 walkability grid, 140 m footprint and endpoints
must remain unchanged. The source labels the destination E, not 1; provisionally
show E as point 1, pending clarification of the user's screen reference.

For this experiment, left/right turn, up moves forward, and down reverses.
The character appears front-on before entering the maze; camera views remain
available during play. These controls implement the current request and do not
settle the earlier auto-running proposal. Cars are requested geometric blockout
props placed outside the mapped passages; they are not biblical/historical claims.
Character styling is a simplified creative study informed by the existing costume.

The [project-start record](../../docs/README.md)
still places the MVP in Forge. This local asset/controller experiment does not
move the MVP or claim Forge integration. Existing sources and binaries are preserved.
No competing local experiment/implementation plan was present when inspected.

## Completed implementation and dependencies

1. Build an editable smooth character and exact maze blockout using Blender 5.1.2.
2. Export the actual Blender geometry to GLB and load it in a local Three.js player.
3. Add smooth turn/move controls, collision, front/follow/overview cameras and point 1 arrival.
4. Verify footprint equality, route clearance, runtime input, completion and visual framing.
5. Record results, limitations, run/rebuild commands and handoff links.

Dependencies: local Blender, Python 3, Node/npm, pinned Three.js runtime. Install
runtime dependencies outside the shared directory; keep source and generated assets
inside this experiment. Browser/WebGL support required. No Forge runtime dependency.

## Completion checks

- Editable .blend and exported .glb files exist and load.
- World footprint/collision uses the canonical map; no dressing closes passages.
- Arrow input turns and moves the character; walls stop movement; blur clears input.
- Front-on preview, follow camera, map and restart are usable.
- Point 1 can be reached through the original maze and produces completion feedback.
- Captures and verification records distinguish measured checks from device assumptions.

## Results

Completed 2026-09-08. The [local player](http://127.0.0.1:8765) loads the original
Blender-authored character and maze GLBs. Both editable sources, procedural builder,
run instructions, provenance and captured views are in the prototype. Original
assets/reference files were preserved. Cars remain outside the mapped passages.

All 168 loaded GLB wall bounds match the canonical layout within 0.001 m. All
296 graph edges pass 23,976 player-clearance samples, and all 1,160 solid tile
boundaries stop movement. The real controller completes all three saved routes.
Browser checks cover actual keyboard movement/turning, collision, front/follow/map
views, route display, pause, focus loss, reset and destination completion. Mobile
layout and emulated touch input were checked. A short desktop headless frame sample
was approximately 60 fps; physical phone/TV behavior remains unverified.

See [verification records and limitations](../../prototypes/shepherd-maze/README.md#verification-and-outcome).
Point 1 remains a provisional interpretation of map endpoint E; the user has not
confirmed its meaning. This experiment displays completion there and does not open
a second world. The character uses animated object pivots rather than a skin rig.
The staff and roof caps can intersect/occlude at close camera angles.

## Next actions

- User review: confirm point 1, control feel and camera preference.
- Unassigned: identify the Forge branch and coordinate integration with its owner.
- Unassigned: physical phone/TV testing, final character animation and art direction.

Completion of this task records a verified experiment, not acceptance of those open
game-design decisions or proof of Forge integration.
