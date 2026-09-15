# Full-flow integration review

Scope: compact player actions and restoration of the complete opening/ending around the already implemented village scenes. Performance is excluded by user direction. Work remains on `codex/shepherd-story-rebuild`, unmerged and unpublished.

## Implementation

- `index.html` and `src/boot.mjs` launch the existing opening scripture diorama first, prepare the rebuilt village, run the ten-second introduction, then hand over at the route entry.
- `src/village-game.mjs` hosts the shared scene runtime. The player presentation removes draft labels, point numbers, repeated status instructions and debug controls, preserving each scene's action and story line. The assembly and illustrated conversations retain their own controls.
- `rehearsal.html` keeps the targeted scene review tools through a small wrapper. `legacy.html` and `src/legacy-boot.mjs` preserve the older route for reference/diagnostics.
- Arrival at the nativity runs the existing six-second camera approach, then triggers the complete ending diorama once. Completing it offers a full restart from the opening.
- Pause/restart/reduced-motion controls are available in the player menu. The running introduction reuses the same lead and two companion models. The existing lantern attachment is retained.

## Verification scope

The pure checks for lamp assembly, house rejection/sighting/advice/owner, barred gate, tracks, empty stall, reunion, nativity arrival and scripture sequencing pass. Existing scripture manifests are unchanged: Luke 2:8–15 in the opening, then Luke 2:16–20 in four ending cues.

Browser verification uses the real player entry and visible controls. No progression injection, teleport or scene skipping is used in the integrated route test. Changes made during the test were limited to presentation/accessibility fixes; the final entry is reopened before handoff.

The user accepted this checkpoint after their review and subsequent scenery fixes. Publication manifest/hashes, hosted deployment, physical-device validation and performance are separate release work, not claimed here.

The desktop route playthrough reached all ten points using the authored actions,
including lamp assembly, three illustrated house conversations, gate attempt,
track search/follow, gate lighting/opening, reunion dialogue and explicit follow.
The nativity camera automatically opened the ending diorama; browser error logs
were empty at that handoff. Pause/resume was checked during the ground search.

The ending displayed sharing the news, Mary pondering and the return in praise
through Luke 2:20. Finish story reached the completion screen, and Experience the
story again reopened the first opening cue. The final version was then reloaded
at that first cue for the user's playthrough. The user subsequently authorized the checkpoint commit and feature-branch push;
no merge or deployment is authorized.


## Accepted follow-up fixes

House 8 now previews the stall in a held wide shot before explicit departure.
Pause blocks departure and the route reaches the stall correctly. The workbench
is level and lowered into the soil; its four foot regions were measured below
local ground height. Side and approach inspector views were reviewed. The old
village-pen block props and tall screening wall were removed and visually checked.
The rebuilt entry now supports `?debug` again. Lamp assembly, House 8 advice,
tracks and empty-stall checks passed after the relevant changes, along with syntax
and whitespace checks. These are targeted checks, not a second full playthrough.

Next work is user-directed models and decoration on the same feature branch.
