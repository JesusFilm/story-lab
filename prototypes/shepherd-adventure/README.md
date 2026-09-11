# Shepherd Adventure

- Status: current investigation prototype; awaiting further playtesting
- Concept: [Shepherd Adventure](../../game-concepts/shepherd-adventure/concept.md)

## Hypothesis and experience

Can preparing a light, noticing clues and discovering routes make the shepherd's
search for the Nativity more engaging? This experiment moves from an open field
into a quiet nighttime village. Find a wick and oil, light the lamp, investigate
landmarks, discover a way around a gate, and leave the gate open and lit for others.
Inspect the final shelter to complete the journey.

There is no maze generation, fuel arithmetic, timer or loss of lives. The fourteen
locations use authored paths, with observations remembered in a notebook. This is
not free movement or indoor exploration. The tracks, lamp tasks and gate are creative
adaptations; the biblical frame draws on Luke 2:8–20.

## Run

```sh
python3 serve.py
```

Open [the adventure](http://127.0.0.1:8766/). Use `--port 8866` for another port.
Python 3.9+, Node.js/npm and a WebGL 2 browser are required. The server installs
pinned Three.js 0.169.0 into `/tmp/watch-game-blender-runtime` on first use.
`WATCH_GAME_RUNTIME` overrides that location. No Blender or Tripo token is needed.

After the illustrated intro, the camera starts in the distant field and eases into the follow camera over about
eight seconds; OK skips it. Tap a landmark card to walk there. All paths appear together;
hover or keyboard focus brightens the corresponding ground trail. Left/right and
Enter remain available. Arrival automatically gathers supplies and discovers routes;
a short observation appears without stopping play. Longer observations are available
in the notebook under the menu. The gate welcome and shelter ending start on arrival.
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
system, final Nativity cast or production integration is implemented. The last shelter
contains a simple swaddled stand-in. Physical-device behavior requires playtesting.

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

The rear-passage interaction now walks the shepherd to the gate lamp, shares the flame, opens the gate, and returns him to his post. Two animated shepherds then run through to the shelter before manual control resumes. Pause and restart remain available during the sequence. The shelter sits farther beyond a screened stone courtyard, and settlement lamps use fixed lights with constant brightness instead of a proximity-switched light pool.

## Illustrated opening and ending

Story Diorama 0.2 is copied in full into `vendor/story-diorama/`. The prototype owns
all runtime artwork and music in `assets/story/`; no library checkout is needed.
The opening loads its image, full audio file and scripture before importing Three.js.
The Follow the lantern loader shows “Loading...” during foreground waits. The story
starts automatically with music enabled; browser autoplay restrictions may require
Enable music. Music off keeps the story running. Passages advance automatically,
with Next/OK available; the last passage waits for Begin adventure or Finish story.
The game module and models prepare behind the opening, without advancing simulation
or rendering the hidden scene. Begin waits for any remaining game preparation, then
starts the star/settlement establishing shot. Restart reuses the loaded game.

At the back gate (`arch`), the ending image and soundtrack preload silently. Arrival
joins that same request if still pending, or opens immediately if ready. Story close
destroys the player, clears image DOM, aborts outstanding fetches and revokes all
story-owned blob URLs. Browser HTTP cache and garbage collection remain browser-owned;
this does not guarantee immediate OS memory reclamation. Each story’s scripture is fetched as a separate JSON manifest and released with
its media lease; only the small loader/player modules stay in the module cache.

[Review both stories without loading 3D](story-preview.html) (opening then ending,
repeating for review); add `?story=ending` to begin at the Nativity.
Two native ImageGen scenes use Follow the Light AA v003. The announcement shows
three shepherds and an angel with a live HTML thought-style speech bubble.
Full World English Bible verses are split into seven opening and four ending
passages. The final passage waits for your confirmation before leaving the story. At 150 words per minute, the scripture is roughly 1¾ minutes overall.
A return/praise illustration would be the first useful addition; the current
ending holds on the Nativity while recounting Luke 2:20. The heavenly host and
sharing the news likewise use the two establishing images as visual context.

Music: Kevin MacLeod’s gentle solo-piano “Silent Night”, free under CC BY 3.0,
with visible attribution and a local 96 kbps MP3 (1.6 MiB instead of 5.1 MiB). It accompanies the story sequences;
the existing gameplay ambience retains its own Sound switch. See
[media credits](assets/story/CREDITS.md) for sources, license and illustrative choices.

## Loading checks

Run `checks/verify-story-loading.mjs` with `PLAYWRIGHT_MODULE`, `BROWSER_PATH` and
`WATCH_GAME_TEST_ORIGIN` for your installed browser/runtime. It gates game and ending
requests to verify ordering, retries, media cleanup, camera sequencing and mobile
reduced-motion startup. These are staged lifecycle checks, not a full walking test.

The portal exporter now respects `owns_loading` for this prototype, avoiding its
generic eager Three.js wrapper. New story runtime files are explicitly listed.
A full portal rebuild remains blocked by pre-existing source-review mismatches
(first: this prototype’s `journey.css`); the new architecture has not been published.
