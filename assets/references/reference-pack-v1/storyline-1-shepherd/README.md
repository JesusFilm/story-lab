# Storyline 1 — Follow the light

**Status: Reference exploration for the primary [shepherd maze](../../../../game-concepts/shepherd-maze/concept.md).**
The maze premise is largely settled; controls, lives/recovery and pacing are still proposals.

Three generated inspiration scenes plus one verified map design, supplied in annotated and clean formats.

| Reference | Purpose |
|---|---|
| [Angel in the field](images/01-angel-in-the-field.png) | Establish character, angel lighting, night palette and settlement destination. |
| [Follow the light](images/02-follow-the-light.png) | Third-person junction camera, two readable options, a jump rail and ducking awning, visible star beam. |
| [Nativity arrival](images/03-nativity-arrival.png) | Combines the star-lit destination and arrival: open stall, manger, newborn, standing Mary and Joseph, animals. |
| [Annotated maze](map/maze-annotated.png) | Top-down production layout with successful routes, dead ends, obstacles and endpoints. |

The existing shepherd-reference-sheet.png supplied character/style continuity. Individual generation prompts are in `prompts/`. The gameplay image is a camera and material reference; it does not purport to depict an exact junction in the map.

## Maze handoff

- **140 × 140 metres**, 4 m-wide passages, 8 m spacing between graph nodes, 17 × 17 nodes. Start at southwest; stall destination at northeast.
- Three annotated, simple, successful routes cross the settlement. They diverge and rejoin; they are not three entirely disjoint routes.
- **32 dead ends and eight independent loops.** There are additional possible successful route combinations; the colored lines illustrate three.
- Six obstacle placements: three jump/step rails and three ducking awnings. All are on open edges between degree-two nodes. Their intended interaction does not remove connectivity.
- Solid taupe forms represent building footprints and enclosing walls. Long blocks can be visually subdivided into attached houses without changing their collision footprint. Blue passages are open ground. No roofs should bridge the alleys.
- Coral spurs and × marks identify terminal branches. Cyan A, lavender B and gold C are example successful paths. S/E are start/end. J/D identify jump and duck props.

| Route | Distance | Travel at 3.2 m/s | With 2 s per decision junction |
|---|---:|---:|---:|
| A, shortest | 832 m | 4:20 | 4:46 |
| B | 1,040 m | 5:25 | 6:05 |
| C | 960 m | 5:00 | 5:38 |

Distances are node-center to node-center. Entry/exit thresholds, detours, intro, ending and obstacle animation time are excluded. Time is an estimate, not an observed playtest result. At a slower 2 m/s walk, even the shortest route takes 6:56 before choices. Tune speed, physical scale or assisted shortcuts if audience testing calls for shorter sessions.

### Files and reproduction

- `map/maze-annotated.png`: 2240 × 2240 designer map.
- `map/maze-annotated.svg`: editable vector version with equivalent geometry.
- `map/maze-clean.png` and `.svg`: same environmental geometry without solutions or endpoint overlays; title retained. Use JSON for exact start/end positions.
- `map/walkability-mask.png`: 560 × 560 binary mask, white walkable, black solid, 4 pixels/metre. This is the maze floorplan, without the graphic border/title.
- `map/maze-layout.json`: every node, edge, route, obstacle, terminal branch, solid rectangle and safe default-next-node. Grid uses x east and y south. The file defines world conversion.
- `map/verification.json`: machine-readable checks and timing/strategy results.
- `../scripts/build_maze.py`: deterministic seed 210, requires Python 3, Pillow and networkx. Rendering uses macOS Arial; change the font path when running elsewhere.

Run from watch-game: `python3 references/reference-pack-v1/scripts/build_maze.py`. The script regenerates only this pack's maze outputs.

## Forgiving control proposal

The runner advances automatically, with early direction selection and animated jumping/ducking. Treat this as a succession of choices rather than a reflex test.

1. Announce a junction about 16–20 m ahead using shape, spoken guidance and optionally large directional choices. Slow to a walk approaching its decision area.
2. Accept left/right choices early and allow changes until commit. A choice remains valid until acknowledged. Use a decision ID so delayed duplicate remote messages cannot affect the following junction.
3. With no input, use the exported `default_next` edge: it always decreases graph distance to the goal. The user can deliberately explore another branch. This guarantees progress for a passive viewer if the engine implements it faithfully.
4. Jump defaults to stepping over; duck defaults to automatic ducking. Missed input never damages, kills or restarts the player. Announce obstacles early and slow further where needed; the 8 m grid alone is not a sufficient timing guarantee.
5. At a dead end, turn the camera gently, offer return, and automatically retrace to the last junction. Mark visited branches with subtle footprints or a small stone marker. Preserve progress on pause/reconnect.
6. Offer a persistent pause and “follow the light” assist. Make rewards about discovery and arrival, without equating route performance with faith or worth.

The 2 s choice allowance in the timing table is a pacing assumption, not a deadline imposed on viewers. Real delay compensation, event buffering and feedback must be tested with phone and TV devices.

## Camera and visibility

Use an elevated trailing camera with generous sky space; rotate smoothly at turns. Provisional blockout dimensions: 2.2 m walls, 2.4–3.2 m building heights, 4 m alleys. Avoid overhead roofs and place awnings below the view of the beacon.

A world-space star alone cannot be guaranteed on screen while the player turns away or stands behind a building. Keep a persistent screen-edge star bearing indicator when the beacon is offscreen or occluded, and use a soft beam high above the skyline. These are implementation requirements, not features verified by the map. The inspiration frame shows one favorable view; it does not establish all-route visibility.

## Maze strategies and verification

Connectivity, shortest path, three distinct simple routes, meaningful alternative edges, terminal branches, cycle count, two perimeter openings, route-line clearance against the saved mask, obstacle placement and decreasing default distance all pass. A separate four-neighbor floorplan flood-fill matches graph shortest distance and reaches every walkable tile.

Wall-following was simulated from S, initially facing north. Left-hand following reaches E in 116 edges (4:50 travel); right-hand following reaches E in 178 edges (7:25 travel). Thus wall-following remains a valid strategy here. Loops alone do not defeat it. Breadcrumb exploration and beacon-assisted choices can provide variety without punishing a conventional strategy.

Runtime navmesh, collider sizes, the player capsule, star visibility and hardware latency are still untested. Do not change passages during artistic dressing without rerunning graph/mask and engine-level checks.

## Narrative adaptation

Luke 2:8–20 supplies the shepherds, angelic announcement, baby in a manger and visit. The star as a shepherd navigation beacon, maze, explicit stall staging, and angel's wings are artistic choices. Matthew 2 connects the star with the magi. This pack follows the requested combined visual treatment without presenting it as a detail explicitly recorded in Luke.

Sources: [Luke 2:8–20](https://www.biblegateway.com/passage/?search=Luke+2%3A8-20&version=WEB), [Matthew 2:1–12](https://www.biblegateway.com/passage/?search=Matthew+2%3A1-12&version=WEB).
