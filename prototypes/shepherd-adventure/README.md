# Shepherd Adventure

- Status: current investigation prototype; awaiting further playtesting
- Concept: [Shepherd Adventure](../../game-concepts/shepherd-adventure/concept.md)

## Hypothesis and experience

Can preparing a light, noticing clues and discovering routes make the shepherd's
search for the Nativity more engaging? This experiment moves from an open field
into a quiet nighttime village. Make a lamp at one sheltered workbench, investigate
landmarks, discover a way around a gate, and leave the gate open and lit for others.
At the final shelter, the camera eases into first person. Choose “heard the good news” to play the ending diorama.

There is no maze generation, fuel arithmetic, timer or loss of lives. The fourteen
locations use authored paths, with observations remembered in a notebook. This is
not free movement or indoor exploration. The tracks, lamp tasks and gate are creative
adaptations; the biblical frame draws on Luke 2:8–20.

## Village route rebuild (feature branch)

The ten-point winding route is available as a [walking rehearsal](rehearsal.html).
Run the normal local server, then open `/rehearsal.html`. Move to next point walks
the real corridor; Review tools offers jump, replay, capture and reduced motion.
Dialogue, tracks, gate gestures, the House 9 reveal and companion reunion are still
placeholders. The original `/` experience remains available.

[Scene briefs and branch plan](docs/story-rebuild/README.md) ·
[Actual rehearsal map](map/rehearsal-map.svg) ·
[First-pass verification](review/2026-09-13-route-rehearsal/README.md)

This work lives on `codex/shepherd-story-rebuild`; it has not been published.
`node checks/verify-rehearsal.mjs` checks the new route and state.
`node checks/generate-settlement-map.mjs --rehearsal` regenerates its separate map.
The canonical settlement map and original navigation remain unchanged.

## Scene inspector

For fast visual review, run the local server and open `/?debug`. WASD flies,
right-mouse drag looks, Space rises, Left Shift descends, Ctrl boosts speed, and the wheel sets
speed. Jump directly to the Nativity or another scene, then **Freeze & annotate**
and **Capture** to save an annotated PNG into `captures/`.
See the [audited request and controls](docs/debug-capture-workflow.md).

## Run

```sh
python3 serve.py
```

Open [the adventure](http://127.0.0.1:8766/). Use `--port 8866` for another port.
Python 3.9+, Node.js/npm and a WebGL 2 browser are required. The server installs
pinned Three.js 0.169.0 into `/tmp/watch-game-blender-runtime` on first use.
`WATCH_GAME_RUNTIME` overrides that location. No Blender or Tripo token is needed.

After the illustrated intro, a ten-second camera approach passes two running
companions and catches the main shepherd near the settlement; Skip intro ends it. Tap a landmark card to walk there. All paths appear together;
hover or keyboard focus brightens the corresponding ground trail. Left/right and
Enter remain available. Arrival automatically gathers supplies and discovers routes;
a short observation appears without stopping play. Longer observations are available
in the notebook under the menu. The gate welcome starts on arrival; the shelter ending waits for “heard the good news”.
The menu also offers pause, look around, retrace, recovery and restart. Sound is optional.

## Sources and local assets

`src/journey-*.mjs` owns the authored route graph, world, camera and interaction.
The independent `src/character-variants.mjs` retains the latest animation corrections.
The server reads this prototype's own models from `assets/`, including its own
legacy shepherd copy. [sources.json](assets/sources.json) records their origins.
No other prototype or root asset directory is needed to run it. Review ZIPs and
images remain in `review/` as historical evidence.

## Validation

With the adventure server running, run from this folder:

```sh
node checks/verify-nature-assets.mjs
node checks/verify-presentation.mjs
node checks/verify-journey.mjs
node checks/verify-journey-poi.mjs
node checks/verify-journey-camera.mjs
node checks/verify-animation-transitions.mjs
```

For a custom port, set `WATCH_GAME_TEST_ORIGIN=http://127.0.0.1:8866` for the POI check.
Run POI before camera checks so camera inputs reflect the current model geometry.
These check reachable outcomes, lane clearance, gate behavior, visibility bounds and
animation blending. They do not establish enjoyment or finished visual quality.

## Limitations and outcome

The night atmosphere and investigation direction reflect Jaco's feedback. The specific
preparation/discovery loop remains experimental. No general collision solver, save
system or production integration is implemented. The Nativity cast is a static
Pixal3D tableau intended for frontal viewing. Physical-device behavior requires playtesting.

[Restored maze comparison](../shepherd-maze/README.md) · migration record

## Camera and path presentation

Selected routes use wide, terrain-conforming ribbons. Their golden pulse travels
from the current stop toward the chosen destination; reduced motion keeps them still.
The ribbon samples the rendered terrain triangles rather than only the underlying
height formula, preventing the old long line segments from cutting through bumps.

Ordinary observations keep the camera still. Wick, oil, hearth, tracks, gate and
feeding-trough inspections pan toward their physical clue over three seconds;
the overlook also gently raises the camera. Closing returns to the saved viewpoint
over 2.6 seconds. The follow camera is held during inspections, so its collision
solver no longer introduces an incidental orbit. Reduced motion keeps the home view.

The carried lantern and all settlement fixtures now use the same detailed Tripo
model, copied into `assets/portable-lantern-tripo.glb`. The carried version is 30 cm
high including its handle; settlement fixtures are 40 cm. All 22 placements share
geometry and textures. A runtime emission mask warms the glass panes while keeping
the bronze dark; real point lights illuminate the surroundings. The gate and empty
hearth lamp retain their unlit states.

The approved reference and its native ImageGen prompt remain in the asset library
and in `assets/references/portable-lantern/`. Follow the Light AA v003 is the standing
style selection for the entire prototype (see ../AGENTS.md). The original Tripo
export is preserved; runtime fitting and glow do not modify it. Generation used
30 Tripo credits. Model appearance has been checked in the walking prototype;
Jaco's final model acceptance remains unrecorded.

## Settlement boundary and wilderness

### Settlement map and market stalls

[Open the labeled top-down settlement map](map/settlement-map.svg).
The map uses actual placed model footprints, including roof overhangs, with the
same scale on both axes. Houses have instance numbers; two older empty stalls
remain explicitly labeled. [Layout data](map/settlement-layout.json) records the
model positions, dimensions, rotations, routes and boundary segments.

Five stalls occupy the marked outer-lane spaces: vegetables and pottery on the
west side, and tanner, vegetables and pottery from north to south on the east side.
They reuse three independent Pixal3D models, with no identical adjacent shops.
Open counters follow the annotated directions: northeast on the west side,
west-southwest for the tanner, nearly west for eastern vegetables, and
west-northwest for eastern pottery. Each source model has a measured local front
offset (vegetables −25°, pottery −28°, tanner −33°); placement compensates for it
before applying the desired bearing. These offsets were checked using roofless
top-down renders, rather than assuming the GLB +Z axis is its opening. Each has a 2.8 m height, original
proportions, 2K textures and a conservative geometry reduction. They are scenery,
with no new interaction. Sources and comparison renders are linked in
`assets/sources.json`. Inferred backs and small texture seams remain prototype
limitations; verification uses model renders and headless geometry checks.

**Keep this map current whenever a settlement model is added, removed, replaced,
rescaled, moved or rotated. Rotation is essential: the map must show the exact
orientation used in the game, including each stall's actual open-front direction.**
Use transformed model geometry for the footprints; do not substitute unrotated
rectangles or infer the opening from the GLB axes. When changing a stall's bearing,
account for its measured local front offset, visually verify the opening against
the intended direction, and update the expected bearing in
`checks/verify-settlement-stalls.mjs`. Keep the final map free of temporary
annotation rings and arrows.

Register each building or significant prop in
`settlementFeatures` in `src/journey-world.mjs`, then run from this folder:

```sh
node checks/generate-settlement-map.mjs
node checks/verify-settlement-stalls.mjs
```

The generator loads the actual local models and uses the game's placement logic.
It needs the pinned Three.js runtime installed by `serve.py`; `WATCH_GAME_RUNTIME`
can override its cache path. Commit the regenerated SVG and layout JSON with the
model change. The consistency check rejects stale labels, bounds and rotations.

The existing low-wall kit now closes the two gaps beside the market gate and wraps
the settlement in a low perimeter, with a 12 m entrance. Buildings have generous
clearance inside it. The shepherd starts farther into the field, outside the wall.
The wall leaves all authored routes open; movement is still route-based, not a
free-walking collision simulation.

The perimeter uses a separate 5,824-triangle LOD derived from the existing Tripo wall;
the full-resolution library model is unchanged. Ninety-seven wall sections follow
local terrain height and participate in camera obstruction handling.

Trees, boulders and ground stones use free **Quaternius Stylized Nature MegaKit**
models under **CC0 1.0**, with four tree silhouettes and three boulder shapes.
There are 50 trees, 47 larger boulders and 1,659 small instanced stones. Most trees
and all larger boulders are outside the boundary; the entrance route remains clear.
Sizes, rotations and grouping vary. These are approximate visual matches to the
prototype's style, not botanically accurate olive trees.

The non-Tripo library record is `assets/nature/quaternius-stylized-nature/` at the
repository root. Independent runtime files and license are under this prototype's
`assets/nature/`. Original source files, the pinned download mirror, creator URLs,
license, runtime texture adaptations and file hashes are retained in provenance.
No new paid generation was used for this environment pass.

The rear-passage interaction walks the shepherd to the gate lamp, shares the flame
and opens the gate. He stays there while the two distinct animated companions run
past from the entrance-side path. The single “follow the others” option runs him
continuously from the gate to the final shelter. Pause and restart remain available during the sequence. The shelter sits farther beyond a screened stone courtyard, and settlement lamps use fixed lights with constant brightness instead of a proximity-switched light pool.

## Illustrated opening and ending

Story Diorama 0.2 is copied in full into `vendor/story-diorama/`. The prototype owns
all runtime artwork and music in `assets/story/`; no library checkout is needed.
The opening loads its image, full audio file and scripture before importing Three.js.
The Follow the lantern loader shows “Loading...” during foreground waits. The story
opens on a silent first-verse preview with Sound on selected. Start begins music
inside the browser gesture; Next verse advances one passage at a time. The last
passage waits for Start adventure or Finish story.
The game module and models prepare behind the opening, without advancing simulation
or rendering the hidden scene. Begin waits for any remaining game preparation, then
starts the star/settlement establishing shot. Restart reuses the loaded game.

At the back gate (`arch`), the ending image and soundtrack preload silently. Choosing “heard the good news”
joins that same request if still pending, or opens immediately if ready. Story close
destroys the player, clears image DOM, aborts outstanding fetches and revokes all
story-owned blob URLs. Browser HTTP cache and garbage collection remain browser-owned;
this does not guarantee immediate OS memory reclamation. Each story’s scripture is fetched as a separate JSON manifest and released with
its media lease; only the small loader/player modules stay in the module cache.

[Review both stories without loading 3D](story-preview.html) (opening then ending,
repeating for review); add `?story=ending` to begin at the Nativity.
Ten native ImageGen scenes use Follow the Light AA v003. The opening moves through
quiet watch, alarm, reassurance, a gathering heavenly host, joyful praise and
departure. The ending shows the Nativity, sharing the news, Mary pondering and the
return in praise. Eight opening and four ending passages preserve the full World
English Bible text of Luke 2:8–20. Each visual change uses a 1.8-second dissolve;
reduced motion uses an immediate change. The final passage still waits for Begin
or Finish. The scripture appears once in its reading panel rather than being
repeated in a speech bubble.

Original generated PNGs and exact prompts are retained in
[the story reference library](../../assets/references/shepherd-story/README.md).
The prototype owns compressed JPEG copies and has no runtime library dependency.

Music: Kevin MacLeod’s gentle solo-piano “Silent Night”, free under CC BY 3.0,
with attribution in the packaged media credits and a local 96 kbps MP3 (1.6 MiB instead of 5.1 MiB). It accompanies the story sequences;
the diorama sound control sits at bottom left. See
[media credits](assets/story/CREDITS.md) for sources, license and illustrative choices.

## Loading checks

Run `checks/verify-story-loading.mjs` with `PLAYWRIGHT_MODULE`, `BROWSER_PATH` and
`WATCH_GAME_TEST_ORIGIN` for your installed browser/runtime. It gates game and ending
requests to verify ordering, retries, media cleanup, camera sequencing and mobile
reduced-motion startup. These are staged lifecycle checks, not a full walking test.

The portal exporter now respects `owns_loading` for this prototype, avoiding its
generic eager Three.js wrapper. New story runtime files are explicitly listed.
The full portal rebuild succeeds with the expanded explicit image list. These
feature changes have not been deployed.

## Lamp workbench

The feature-branch rehearsal now has a [guided lamp preparation draft](docs/story-rebuild/scenes/01-lamp.md).
A new [Pixal3D lamp workbench](../../assets/structures/lamp-workbench/README.md)
replaces the procedural timber boxes. It owns an independent runtime model with
49,879 triangles and embedded 2K textures; the lantern and oil jar remain separate.
The bench is oriented toward the existing point-01 approach and its maps are current.

In the rehearsal, Prepare your light opens one item at a time: lamp body, wick, oil,
flint and lighting. Large PNGs show each part, with lamp/jar rendered from the actual
models. There are no incorrect combinations. Take lamp awards one +1 Lamp cue,
removes the table lamp and attaches the light to the shepherd's right hand.
Set out continues toward House 1. Back preserves progress; review jumps and restart
reconstruct or clear it. The other nine scene placeholders remain unchanged.

[Screenshots and targeted review](review/2026-09-13-lamp-workbench/README.md).
Run `node checks/verify-lamp-assembly.mjs` and `node checks/verify-rehearsal.mjs`;
`checks/verify-lamp-scene.mjs` uses an installed Playwright module for desktop,
mobile/reduced-motion and loading-retry checks. Text, framing and feel are draft.
The user authorized a branch checkpoint and audit update for this iteration;
final scene acceptance remains pending. No merge or deployment is authorized.

The following describes the earlier recipe in the original entry:

The 3D workbench oil jar now uses an independent 28 cm Pixal3D model, replacing
the stretched-sphere placeholder. It has 7,998 triangles and baked 1K textures,
and loads through the normal foreground model-loading phase. Its reference,
source model and matched Blender renders are in
[the oil jar library entry](../../assets/objects/oil-jar/README.md). The illustrated
crafting interface still uses its own artwork. This replacement was verified with
model renders and structural checks; it has not had a new browser playtest.

The hearth opens a first-person illustrated workbench. Fit and raise the wick to
the brass mark, pour oil to its mark, tighten the cap and strike a spark. Inputs
are discrete; there is no timing window. An incorrect setup fails with a specific
explanation and a fresh retry. Leaving preserves the unfinished setup; restart
clears it. Take your light awards the carried lantern only after a steady flame.
The old wick/oil detours are no longer offered.

[Workbench-only preview](workbench-preview.html). Run
`node checks/verify-lamp-craft.mjs` to verify all 50 component combinations.
The stall is native ImageGen artwork, with an editable SVG lamp cutaway and
controls; no new Tripo model or paid Tripo job was needed.

## Material UI (12 September 2026)

The journey and both scripture sequences share flax linen panels, leather controls and timber route signs, guided by the tanner stall reference. Pause offers Continue and Restart. The opening camera has a quiet bottom-left Skip intro. Scripture waits for Start (which unlocks music), Next verse, and Start adventure or Finish story. Sound defaults on; the first preview is silent until Start. See `assets/story/CREDITS.md` for music attribution. The portal omits its injected return link for this prototype.


## Companion and cutscene update (12 September 2026)

[Requested current-to-new direction and audit](docs/content-update-2026-09-12.md).
The two supporting shepherds use separate Tripo models matching the opening art,
with idle and running clips. Their runtime copies are independent of the library.
The opening path extends into the field with a clear camera corridor and side trees
and boulders. The settlement map includes this approach. Pause and restart work
during the opening and gate sequences; reduced motion avoids the opening fly-through.

Run `node checks/verify-companion-scenes.mjs` and
`node checks/verify-companion-models.mjs` for scene continuity and sampled skinning,
clip playback, bounds and foot contact. See the audit for validation limits.


## Nativity animal area (12 September 2026)

[Request, layout and progress audit](docs/nativity-scene/request-and-progress.md).
A curved approach enters one open southeast gate, passes the sheep and reaches the larger northwest shelter within the same enclosure.
Mary, Joseph and baby Jesus in a manger match the ending artwork. The extended low stone
enclosure surrounds both the shelter and inner sheep pen, with four surrounding trees.
Five stationary sheep reuse the existing model: three in the pen and two at the
shelter. The single livestock gate stands open; the existing village gate remains interactive.
The original village fold still supplies its rear-passage discovery clue.

The family has 149,691 triangles and embedded 2K textures. Small inferred rear-cloth
holes are concealed by frontal staging; the model is static. All animal poses are
held still to preserve the calm setting. No new Tripo generation was needed.

Run `node checks/verify-nativity-area.mjs` for final-route clearance and scene checks,
and `node checks/verify-animal-route-view.mjs` for landscape/portrait sheep visibility,
then the existing journey, companion, POI, camera and settlement-map checks.
Offline composition renders use actual game geometry with simplified environment
materials; they do not establish browser lighting or physical-device performance.

The final route follows the approved light-blue annotation: enter from the southeast,
curve northwest past the pen, then continue north to the shelter without a second
exit. The main shepherd eases to 2 m/s inside the animal area. The follow camera
smoothly widens, rises and looks toward the sheep, then returns to the shelter
approach. Portrait framing allows extra distance to retain both shepherd and sheep.
Pause, reduced motion and the existing companion route remain supported.


## Nativity playtest fixes

The dark horizon hills now stay at least 40 m beyond the north wall. The open
animal gate leaf has two vertical end posts, and every sheep-fence rail terminates
at a post, including both sides of its entrance. The three shepherds finish 2.2 m
apart in a row facing the family.

Arrival takes six seconds to settle behind the main shepherd's shoulder and move
to his eye-level view. The avatar is hidden as the camera reaches his eyes. The
“heard the good news” button appears after the reveal and is the only way to start
the outro. Pause/resume and restart work throughout; reduced motion uses the final
view immediately. Background ending-media prefetch remains intact.

Checks: `verify-nativity-arrival.mjs` covers geometry, spacing and state;
`verify-arrival-browser.mjs` covers landscape/portrait, the camera endpoint,
pause/resume, explicit outro, restart and reduced motion. Browser screenshots:
[landscape](docs/nativity-scene/arrival-landscape.png),
[portrait](docs/nativity-scene/arrival-portrait.png).
