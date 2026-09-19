# Little Light Library

A local Bible storybook prototype for shared reading, with a child's dimensional bedroom, two illustrated eight-spread books, nine locale options and pre-generated Kokoro phrase narration.

Agents: start with [AGENTS.md](AGENTS.md) for the phase summary and task-specific reading paths. The quality-iteration effort is parked. The first [manual and agent-assisted authoring foundation](docs/creator-guide.md) is implemented; the location and design of a full visual editor remain open.

```sh
npm ci
npm run dev
```

For authoring: enter the library, choose **Author → Load two-spread demo → Validate & preview**. Import or paste your own book JSON into the same dialog. See the [contract and glossary](docs/book-contract.md), [agent instructions](docs/agent-authoring.md), and [authoring handoff](docs/authoring-handoff.md). Export portable JSON to keep a validated draft; previews are session-only.

Open http://127.0.0.1:8771/. Choose a language on every startup; the saved language is preselected. Select a cover, use Previous/Next to turn pages, Play/Pause or Replay to control narration, and Library to close the book. Tap a character on the shelf to hear its localized name. Drag horizontally in the room or use the Look around controls to inspect a nearby viewpoint; the reset arrow centers it. Opening a book restores the reading view. On a book page, hover or tap a character for a name tag and individual paper gesture; Tab and Enter provide keyboard access. The globe always opens language recovery. Settings contain language, speed, narration mute and volume. Muting preserves follow-along timing; changing language or hiding the tab pauses playback.

```sh
npm run verify       # formatting, types, behavior tests, content/assets, build
npm run test:browser # installed Chromium integration/Noah performance checks
npm run verify:all   # all gates, isolated nested static servers; includes both reading performance profiles
```

`npm run build` writes a static `dist/` with relative URLs. Serve it from any nested static directory. The repeatable browser suite uses an installed Google Chrome; set `LIBRARY_URL` only for individual failure/timing scripts against a separate preview. Runtime needs no Kokoro server, Python, credentials or files elsewhere in Story Lab. Production audio tooling does use the existing local lab; see [audio production](docs/audio.md).

The full two-book/nine-locale content scope is implemented. Past visual quality work is recorded in the [scored improvement log](review/README.md), as written observations and decisions; raw iteration media was deleted during cleanup. It is not an active assignment. The current room uses a perspective camera, a table-mounted hinged book, independently folding paper actors with story-specific poses, and original procedural ambience and interaction sounds. Reference-level quality has not yet been established. Independent agent editorial review and automated runtime checks have been performed. Voice audition and listening review for pronunciation, names and pacing remain incomplete; generated audio is not pronunciation approved. This is not a claim of human editorial or family testing. See [handoff and acceptance evidence](docs/HANDOFF.md), [milestones and remaining acceptance gates](docs/MILESTONES.md), [research](docs/research.md), [architecture](docs/adr/001-static-architecture.md), and [editorial notes](docs/editorial.md). Do not push or deploy as part of this task.

For matched page-turn review against the running local preview, run `node scripts/page-turn-review.mjs`. Set `REVIEW_OUT` to a new review directory to preserve previous attempts. The harness captures six forward/backward phases at phone and desktop sizes, checks turn direction and popup clearance, and retains silent recordings. The recording includes frozen review poses followed by actual-time turns; it is not an audio or perceived-smoothness assessment. See the [page geometry decision](docs/adr/004-flexible-page-turns.md).

For printed-page continuity, run `node scripts/printed-page-review.mjs` and `node scripts/printed-page-race.mjs` against the preview. The first records both books in both directions; the second tests interrupted loads and target disposal with normal motion. `REVIEW_OUT` selects a fresh evidence directory. Set `TOUCH_REVIEW_OUT` when running acceptance to preserve older touch captures.

The scene/full acceptance commands include separate 60-second Noah and Eden performance runs. To repeat only the painted-garden measurement after building, run `node scripts/garden-performance.mjs`; it serves the production build under a nested path with the same360×800/DPR1/4×CPU/10Mbps/100ms profile. `GARDEN_PERF_OUT` selects a fresh evidence directory.

For Adam’s jointed-palm comparison, run `REVIEW_OUT=review/my-acting-pass node scripts/adam-acting-review.mjs` against the local preview. It records40 acting states,4folded controls and raw real-time material at phone/desktop sizes. The full gate also tests Adam’s normal/reduced touch and keyboard response. [Rig decision and limits](docs/adr/015-adam-hand-presentation.md).

For reading-camera review, run `REVIEW_OUT=review/my-camera-pass node scripts/reading-focus-review.mjs` against the preview. It captures42 fixed actor/fold/focus states across Eden and Noah at phone/desktop sizes. The scene/full gate includes actual-touch and keyboard response, return, rapid retargeting, wide-family activation and reduced-motion checks; set `FOCUS_REVIEW_OUT` to preserve a fresh run. See the [camera response decision](docs/adr/016-reading-camera-response.md).

For serpent and dove acting review, run `REVIEW_OUT=review/my-creature-pass node scripts/creature-review.mjs` and capture maximum wing poses with `REVIEW_OUT=review/my-creature-peaks node scripts/creature-peak-review.mjs`. The first records 36 acting/folded/reduced states and silent real-time material; the second adds four dove peak poses. Scene acceptance includes normal/reduced touch, keyboard activation, localized names and page/room cleanup. Set `CREATURE_REVIEW_OUT` to preserve interaction evidence. See the [creature acting decision](docs/adr/017-paper-creatures.md).

Generated review output is ignored and disposable. Keep the six curated screenshots and
`review/latest/` results only. After verification, run `npm run clean:generated` to remove
other captures, test output and `dist/`; this preserves installed dependencies and runtime
assets. Historical raw evidence was deleted, not archived. See [the cleanup record](docs/repository-cleanup.md).
