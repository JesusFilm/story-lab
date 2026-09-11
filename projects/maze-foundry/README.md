# Maze Foundry

Reusable maze generation and a standalone local inspector for Watch Game and future maze games.

- Status: done — initial implementation; numeric difficulty presets await playtesting.
- Owner: Codex (initial implementation); future maintenance unassigned.
- Last updated: 8 September 2026.
- [Plan, decisions and verification](docs/design.md).
- Related: [Shepherd maze](../../game-concepts/shepherd-maze/concept.md), [pacing backlog](../../game-concepts/shepherd-maze/2026-09-08-walk-run-pacing.md).

This project is generation tooling. It does not move the Forge MVP. The [village walkthrough adapter](../../prototypes/shepherd-maze/scripts/generate_village.mjs) now consumes its verified exports for the local Blender prototype. Jerusalem search remains a separate draft with no approved maze mechanic.

## Open the inspector

On macOS, double-click [launch-maze-foundry.command](launch-maze-foundry.command). It starts the local server and opens the inspector. Keep its Terminal window open; press Control+C to stop it. If macOS asks which app to use for `.command`, choose Terminal.

Alternatively, from this project directory:

```sh
npm start
```

Open `http://127.0.0.1:4318`. Requires Node.js 22 or newer and a modern browser supporting module workers and Canvas. There are **no package dependencies and no install step**. All generation, testing and exports run locally. The server binds only to loopback and serves this project. Do not open `index.html` directly: browsers restrict module workers on `file:` URLs. Use `MAZE_PORT=4320 npm start` if the default port is occupied.

1. Pick a difficulty preset, dimensions, physical scale, wall type and acceptance criteria.
2. Generate & verify. The same complete configuration and seed reproduce the same candidate search, wall placement and simulations.
3. Toggle start/exit, win paths, dead-end branches, choice points and wall-width overlays. Zoom or scroll to inspect details.
4. Click a wall, or select it under **Edit a wall segment**, to set a thickness within the active range. Applying an edit reruns raster verification. A garden's uniform mode intentionally permits only its configured thickness; switch to mixed mode to vary individual walls.
5. Review all required checks, replay the adversarial explorer, or test 30 seeds. Failed seeds can be reopened and the full stress report saved.
6. Export the PNG and its JSON manifest together. Configs can also be saved and reloaded. Pending config changes and failed verification disable map exports.

Generation and stress testing run in a worker so **Cancel** remains available. A failed search shows a rejected candidate and the unmet criteria; it never silently reduces targets. Settings are not stored remotely or automatically persisted. Save a config to preserve it.

## Physical size standard

The maze uses an orthogonal grid. Rows/columns count cells, not pixels. One route step moves between adjacent cell centres; turns alone do not count as choices.

| Quantity | Definition |
|---|---|
| Units | Metres in the engine contract. A game may uniformly rescale them. |
| Passage width | Minimum design opening between the thickest corner posts. Thin wall sections open into wider spaces. |
| Cell pitch | Rounded passage width + rounded maximum active wall thickness. |
| Overall footprint | `columns × pitch + outer wall` by `rows × pitch + outer wall`, including the entire closed boundary. |
| Pixel resolution | Integer pixels per metre. Wall and passage dimensions round to the nearest pixel; player width rounds upward. |
| Actual metres | Pixel dimensions divided by pixels/metre. The manifest records realised values. |
| Movement model | Four-neighbour walkability; square player footprint, axis aligned. No diagonal corner cutting. |

Defaults: 20 × 16 cells, 2 m passage, 0.5 / 1.5 m mixed walls, 8 px/m. This gives a **71.5 × 57.5 m** footprint, **572 × 460 px**, and **3.5 m per step**. Increasing the maximum wall thickness increases the pitch and total footprint; thinner sections do not reduce the guaranteed passage. Pixel rounding that would defeat the configured clearance is rejected immediately.

The map has one interior start at the top-left cell and one interior exit/goal at the bottom-right cell. The perimeter stays closed. Start and exit are semantic data in the manifest; there are no special grey or coloured pixels in the PNG.

## Acceptance criteria

| Setting | Meaning |
|---|---|
| `minWinPaths` (1–4) | At least this many distinct **simple** start-to-exit routes. They may share sections; this is not an edge-disjoint route requirement. A side loop attached at one point does not count. The search stops at the requested count; more routes may exist. |
| `minDeadEnds` | Minimum degree-one cells excluding start and exit. Their branches are shown back to the nearest junction or terminal. |
| `minSolutionLength` | Minimum number of grid steps in the shortest successful route. |
| `minChoiceSpacing` | Minimum corridor distance between choice points. A choice has at least three neighbours (two forward options after arriving), or at least two at the start. |
| `maxCorridorLength` | Maximum forced corridor in the entire maze, including dead-end branches and start/exit approaches. Bends do not reset the count. |
| `maxFirstChoice` | Maximum steps from start to the first choice. A branching start measures zero. No choices is a failure. |

Both minimum and maximum spacing are exposed because the original request mentioned a minimum but also described overly long corridors. Presets are **implementation assumptions**, not approved or empirically validated difficulty ratings. The UI reports graph distances and metres, not guessed human completion times. Actual walk/run/turn timing from the Shepherd prototype remains a future adapter.

`branchBias` controls how often generation extends the most recent branch, `loopProbability` adds optional loops, and `maxAttempts` bounds rejection sampling (1–200). The generator also opens useful alternative connections and performs connectivity-preserving rewiring when a wider minimum choice spacing is requested. It can still fail on feasible but hard-to-find combinations. A rejection means **not found within the search budget**, not mathematical impossibility. Grid dimensions are limited to 4–48 per side; rasters to 4 million pixels and 4096 per side.

## Uniform and irregular walls

`wallMode: "uniform"` uses `wallThickness` everywhere. `wallMode: "mixed"` samples `thinWall` or `thickWall` independently per retained segment using `thickProbability`. Both probability 0 (all thin) and 1 (all thick) are valid. The frame and corner posts always use the maximum active thickness to seal intersections.

For authored sections, `wallOverrides` maps segment IDs to thickness in metres:

```json
{ "wallOverrides": { "v-3-2": 0.5, "h-7-4": 1.5 } }
```

`v-x-y` is the divider at column boundary x across row y. `h-x-y` is the divider at row boundary y across column x. Only internal boundaries may be overridden. Values must stay between the active minimum and maximum; IDs must be within the grid. An override applies **if a wall exists there**; it does not close a generated passage. It can be dormant with another seed. Consume the exported `wallSegments` to inspect the realised geometry. Editing one wall does not reshuffle any other wall's random thickness or change the graph.

The UI removes overrides that become invalid when grid bounds or wall ranges change, and reports that removal. Config/API loading rejects invalid overrides. This first version supports irregular thickness and stepped footprints on a rectangular orthogonal grid. It does not model arbitrary polygons, curved walls, building interiors, operable gates or authored exclusion zones. Thin sections can represent a gate's footprint; gate behaviour belongs to the game.

## Engine API and headless export

The engine uses standard JavaScript modules and no DOM, browser, game engine or Node-only APIs:

```js
import { generate, encodePNG, exportManifest } from './src/index.mjs';

const result = generate({
  seed: 'chapter-1', columns: 20, rows: 16,
  wallMode: 'mixed', thinWall: 0.5, thickWall: 1.5,
  thickProbability: 0.4, minWinPaths: 3, minChoiceSpacing: 2
});
if (!result.passed) {
  console.log(result.report.checks.filter(check => !check.pass));
} else {
  const pngBytes = encodePNG(result.raster); // Uint8Array
  const metadata = exportManifest(result);  // JSON-serializable
}
```

`generate()` is synchronous. Use a worker or background thread in interactive hosts. `generateCandidate()` is an explicitly unchecked low-level primitive. `rasterize()` and `verify()` let hosts revalidate geometry edits. `verify()` recomputes graph metrics and independently examines the raster; it does not trust a supplied metrics cache. `encodePNG()` is a low-level codec and does not itself certify a maze. Only export assets from passing results, as the UI and CLI do.

```sh
npm run generate -- examples/garden-config.json exports/garden
npm run generate -- examples/settlement-config.json exports/settlement
```

The CLI writes `.png`, `.json` and `.report.json` beside one another. Failed searches write only a report and exit nonzero. Sample source configs and passing exports are included in [examples](examples).

## PNG and manifest contract (version 1)

- PNG: grayscale 8-bit, exactly 0 (wall) and 255 (walkable), no antialiasing, no alpha, no inspection overlays. The portable encoder uses lossless uncompressed DEFLATE blocks, so files are larger than optimised PNGs.
- JSON: schema and algorithm versions, complete config, seed and accepted attempt, dimensions, scale, start/exit, reciprocal cell adjacency, wall rectangles, verified routes, dead-end branches, checks and simulation traces.
- Origin is image top-left. Pixel x maps to world +X, pixel y to world +Z. Pixel `(x,y)` represents the point `((x+0.5)/scale, (y+0.5)/scale)` metres. Start and exit export both cell and sampled pixel-centre coordinates. Wall rectangle boundaries use integer pixel edges divided by scale.
- Use nearest-neighbour sampling and disable interpolation/mipmaps for collision masks. For a 0–1 normalised texture, values correspond to 0 and 1. Test movement using the player's footprint, not only its centre pixel. Height, mesh construction, cameras and game controls are outside this contract.
- Choose world handedness/up-axis conversion explicitly in the consuming engine. Preserve metadata with its matching PNG; do not resize one without updating scale/coordinates and rerunning collision checks.

## Verification and results

```sh
npm test             # regression, mutation, codec and optional tool-contract tests
npm run stress      # 120 maps: 20 seeds × 3 presets × 2 wall modes
npm run build       # source/import/asset integrity; no bundling or install needed
```

Required checks cover graph integrity, dimensions, binary pixels, boundary closure, every walkable pixel being reachable, square-player clearance to every cell, a swept footprint across **every open passage**, and no holes across **every closed divider**. Route requirements are recomputed. Bounded memory exploration tries geometrically unpromising branches first and must still reach the exit. Both wall-following agents and seeded random explorers are diagnostic; loops may trap them, so their timeouts do not falsely reject otherwise valid mazes.

On 8 September 2026, 15 automated tests passed and **120/120** preset stress maps passed. Tests include deliberate wall pinholes, blocked passages, leaked boundaries, invalid pixels, corrupt adjacency, impossible criteria, scale/clearance contradictions, 4×4 through 48×48 grids, one-pixel mixed walls, two- and three-step choice spacing, deterministic local wall edits, side-loop route overcounting, exhaustive tiny-graph route comparisons, traversal replay legality, and PNG CRC/zlib decoding with an independent decoder. See [saved stress results](checks/stress-report.json).

The page assets and modules parse and resolve, and the local server responds. Browser interaction/visual QA and physical-device/Forge integration have not been performed in this task. Optional WebMCP actions (`generate_maze`, `read_maze_report`) share the UI operations; their contract is covered with a mock registry, but a supporting browser registry was not available for end-to-end validation. The app works without WebMCP.

These checks establish the declared geometry and traversal contract, not human enjoyment, pacing at actual game movement speeds, production engine collision or a guaranteed difficulty level. Cross-engine import, device performance and playtesting remain necessary before game release.
