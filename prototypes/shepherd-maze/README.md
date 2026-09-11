# Shepherd Maze

- Status: restored comparison prototype
- Concept: [Shepherd Maze](../../game-concepts/shepherd-maze/concept.md)

## Hypothesis and experience

Can automatic walking, clear junction choices and memory make a satisfying journey
through a nighttime village maze? The original Blender-built world and character
are the default V1 presentation. Press V to compare the Tripo character and environment
without losing progress. This is the maze alternative, preserved after the pivot to
[Shepherd Adventure](../shepherd-adventure/README.md).

## Retrospective

[What the prototype taught us](learnings/retrospective.html) is a standalone visual
retrospective with reference art, a saved gameplay image and an interactive diagram.
Download and open the HTML in a browser; its images are embedded for offline sharing.
It separates the original maze findings from later adventure lessons.

## Run

```sh
python3 serve.py
```

Open [the maze](http://127.0.0.1:8765/). Use `--port 8865` for another port.
Run from this folder, or invoke the script by path. Python 3.9+ and Node.js/npm are
needed. Three.js 0.169.0 installs into `/tmp/watch-game-blender-runtime` on first use;
`WATCH_GAME_RUNTIME` overrides the cache. A WebGL 2 browser is required.
No Blender installation, Tripo credential or paid call is needed to play.

Choose difficulty with left/right, then OK/Enter. Walking is automatic. At junctions,
tap left/up/right to queue the next direction; with no choice, the shepherd waits.
Down turns back and up resumes. OK opens pause/help. Easy shows the full map and
route help; Medium and Maximum let the player request guidance, with a local map on
Maximum. Footprints fade. V changes presentation; R starts a new walk after confirmation.

[Blender V1](http://127.0.0.1:8765/?character=v1) · [Tripo V2](http://127.0.0.1:8765/?character=v2)

## Sources and dependencies

`src/` owns maze behavior. `maps/village/` contains the Foundry export and player map.
`assets/` retains the editable Blender worlds, character and exported GLBs.
`renders/`, `checks/` and the saved baseline ZIPs preserve historical verification.
The server reads independent models from this prototype's `assets/` directory.
[sources.json](assets/sources.json) records their origins. The original map is local too.
Maze rebuilding imports the canonical Maze Foundry implementation.

From the repository root, with Blender installed for rebuilding only:

```sh
node prototypes/shepherd-maze/scripts/generate_village.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python prototypes/shepherd-maze/scripts/build_village.py
```

## Validation and outcome

Run from this folder:

```sh
node checks/verify-controller.mjs
node checks/verify-village.mjs
```

Browser verification scripts remain available for explicitly requested deeper checks;
the migration uses only brief launch verification. The restoration recovers the eight
HTML/CSS/behavior files in the 10 September pre-adventure snapshot. Only the default
presentation and comparison link change in those files. The copied asset revisions and
maze data are retained; this does not claim to recover every earlier historical build.

The original concept led to the adventure pivot. Physical TV/phone controls, enjoyment,
performance and Forge integration remain unverified. Progress is in memory.
