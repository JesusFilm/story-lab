# Lantern journey — challenge redesign

- Status: superseded — arithmetic challenge and fixed camera rejected by Jaco after playtest
- Owner: Codex
- Last updated: 2026-09-10
- Objective: make remote-controlled wayfinding an atmospheric, legible challenge.
- Authorization: Jaco requested play, critique against the gallery, and ambitious implementation on 10 September. This authorizes the experiment; it does not establish final mechanics or art approval.
- Scope: one coherent alternative mode in the existing walkthrough; preserve the prior maze for comparison. No Forge integration or paid asset generation.
- Dependencies: existing Three.js runtime, generated shepherd/house/market/pen models, gallery narrative frames. Terrain and small dressing are editable runtime geometry.

## Diagnosis and hypothesis

Computer Use baseline: Medium V2, start → left → straight → turn back, 48 metres. At 1440 × 810 the skyline is absent, blank ground dominates, and branches are visually similar. The camera rotates with travel; the minimap carries most useful navigation information. The gallery instead offers landscape depth, darkness around warm lights, readable junctions and a destination beyond the foreground.

Two priorities: (1) give decisions visible consequences and a stable spatial frame; (2) restore the dark field → small settlement → intimate arrival progression.

Proposed challenge: travel between landmark courtyards with a finite lantern. Sheltered lanes use less light than exposed shortcuts; courtyard hearths refill it. Preview costs before committing. No time pressure while choosing, no deaths or score penalty, and free recovery to the last hearth. This is an invented gameplay device, not a claim about Luke 2. The navigation star remains a creative adaptation as documented in the reference pack.

Controls: left/right preview a branch, OK travel/pause, up toggle survey, down open pause/retrace/recovery options. A wide, fixed-bearing decision camera and an independently composed traveling camera replace heading-locked follow. Survey reveals the compact route network without replacing normal play with a permanent minimap.

## Frozen acceptance checks

1. Start in a field outside a small village, with skyline, dark surroundings and localized warm light visible at 16:9.
2. Read destination, route cost, remaining light and refill landmarks before committing. Waiting consumes no light. At least one tempting route is infeasible; a viable route exists via hearths.
3. Finish using arrows + OK only; preview does not move the player, repeated keydown cannot choose the next stop, pause freezes movement, recovery is always available.
4. Travel camera does not rotate with shepherd heading. Survey shows the whole playable route network. Ground has irregular coloration, relief, stones and vegetation rather than a flat road strip.
5. Preserve the original runnable maze and canonical models; no Tripo spend. Record source snapshot, before/after evidence, functional checks and limitations.

## Results

Implemented as `journey.html` with `src/journey-model.mjs`, `src/journey-world.mjs`,
`src/journey.mjs` and `journey.css` inside the existing walkthrough. The original
player remains available. Fourteen logic checks pass, including three 93–113 m
routes and recoverability across 20 resource states. Fourteen structure instances
have at least 0.9218 m sampled path clearance. Both original controller/village
checks pass. Computer Use completed a 93 m journey and verified arrow/OK menus,
recovery, pause/resume, survey, replay and desktop/narrow controls.

See the [review and evidence](../../prototypes/shepherd-adventure/review/2026-09-10-lantern-journey/README.md).
All new scenery is runtime geometry; canonical generated models are reused without
modification. No Tripo credits were spent. The ending is a shelter/manger blockout
with narrative text, and optional synthesized sound remains unassessed.

## Next actions

Jaco playtests whether planning between flames adds interest or distracts from the
story. Retain or reject that rule before further feature work. Production visuals,
audio quality, physical TV performance and Forge integration remain outside this
round. No final-game mechanic or new asset approval has been inferred.

## Follow-up feedback

Jaco accepted the atmosphere, requested a darker far exterior, and rejected both
the arithmetic choices and fixed camera. He selected exploration and reading clues
for the next experiment. See [night search and camera correction](2026-09-10-search-and-camera.md).
The earlier acceptance checks above remain historical; they do not override this feedback.
