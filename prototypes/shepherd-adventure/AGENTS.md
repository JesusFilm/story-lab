# Shepherd Adventure rebuild

## Playtest improvement roadmap

For feedback review and subsequent improvement work, read the current
[playtest roadmap](docs/playtest-roadmap/README.md) and its
[repeatable workflow](docs/playtest-roadmap/WORKFLOW.md). Keep feedback IDs,
decisions and evidence linked. Work in bounded increments; update item/milestone
status and append completion, verification, human review and any new decisions or
deviations in the same checkpoint as the change. Technical checks alone do not
establish player-facing acceptance. Do not infer release authorization from a
completed roadmap item. Historical rebuild guidance follows below.

The roadmap's D015–D019 record current user direction: rework this prototype's
loader art/transitions to match the narrative, optimize for lower-powered devices
first, and follow the initial feedback programme with M5 multilingual text/voices.
The scoped loader redesign supersedes treating option-2 artwork as fixed; preserve
immediate initial HTML, truthful progress, retry, pause/reduced motion and lightweight
startup. Use the roadmap's decisions when implementing; do not infer paid generation
or release authorization from these planning milestones.

The active village-journey rebuild is a long-running feature on **`codex/shepherd-story-rebuild`**. Read [the order](docs/story-rebuild/ORDER.md) and [scene index](docs/story-rebuild/README.md) before continuing it.

All subsequent rebuild scene work and integration must continue on that feature branch. Verify the current branch before editing; do not implement these scenes on main. Keep focused commits on the feature branch. Do not merge, enable auto-merge or deploy without explicit release authorization. The initial push authorization is not release authorization.

Develop each numbered scene with the user’s direction and review. A functioning placeholder or passing automated test does not make a scene accepted. Preserve the rehearsal entry for targeted walkthroughs while the complete opening and ending are being reconnected.

## Biblical continuity and historical plausibility

For every new or revised scene, check the relevant biblical passage and what each
character could know at that moment. Distinguish narrator knowledge from character
knowledge; do not give a character names, destinations or facts without an established
source. Keep chronology, dialogue and gestures consistent with earlier scenes.
Use [the continuity guide](docs/story-rebuild/biblical-and-historical-continuity.md)
for the current evidence and unresolved issues.

Review clothing, materials, tools, architecture and customs for historical
plausibility within the standing Follow the Light AA visual style. Verify uncertain
or consequential details with reliable biblical, archaeological or museum sources;
record uncertainty rather than claiming a reconstruction is proven. Separate
explicit scriptural detail, evidence-based reconstruction and invented connective
storytelling in scene documentation. Do not present invented encounters as scripture.
Record a focused follow-up when this review exposes an issue in another accepted
scene; do not silently expand the current scene into a wholesale redesign.
