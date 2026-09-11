# Night investigation — second review

Status: implementation complete; awaiting Jaco's playtest. Owner: Codex. Date: 10 September 2026.
This verdict is the implementing agent's assessment, not user approval.

[Play](http://127.0.0.1:8765/journey.html) · [Plan and criteria](../../../../game-concepts/shepherd-adventure/2026-09-10-search-and-camera.md) · [Previous round](../2026-09-10-lantern-journey/README.md)

## Direction and changes

Jaco accepted the first round's atmosphere, requested a darker exterior, and rejected
both its arithmetic challenge and fixed camera. He explicitly selected “Explore and
read clues: investigate landmarks, make deductions, and risk detours for useful
information.” The gallery remains the visual reference; warm nearby light against a
largely unreadable night is the specific quality pursued here. No new assets or
Tripo credits were needed.

| Observation | Player consequence | Change | Evidence |
|---|---|---|---|
| Lane costs reduce the challenge to arithmetic. | Little reason to read the village. | Remove fuel/costs; tracks, a barred gate, an overlook and a fold reveal alternative routes. Notebook retains discoveries. | Full 123 m keyboard playthrough; two independently checked completion routes. |
| Fixed bearing lets structures hide the shepherd and direction ahead. | Travel misses details and becomes frustrating. | Camera turns with route look-ahead, chooses clear arms around buildings, and frames clues during inspection. | Route sampling and actual travel; inspection captures. |
| Far terrain remains readable. | Night feels too open and illuminated. | Reduced ambient/moon light, nearer dark fog and near-black distant hills. Keep local lamps. | Same ridge location and 1440 × 810 viewport before/after. |

The uncertain route's cost is extra exploration, not death or a numerical penalty.
The fold yields a rear passage; the overlook reveals a courtyard connection. Neither
is a mandatory item in a collection checklist. The final shelter requires inspection.
This remains a short authored puzzle; automatic discovery on inspection may still
be too easy. Human playtesting must judge the curiosity and deduction it creates.

## Evidence

- [Before ridge](before-ridge.jpg) and [after ridge](after-ridge.jpg).
- [Threshold](after-threshold.jpg), [well inspection](after-well-inspection.jpg),
  [fold discovery](after-fold-inspection.jpg), [gate inspection](after-gate-inspection.jpg).
- [Ending after the complete investigation](after-arrival.jpg).
- [Overlook inspection](after-lookout-inspection.jpg), [notebook](after-notebook.jpg),
  [narrow notebook](after-narrow-notebook.jpg).
- [Gate with the readability correction](after-lit-gate.jpg) and
  [stone well correction](after-stone-well.jpg). Earlier well/gate
  inspection captures above document issues encountered during the round.
- [Source baseline](before-source.zip), [feedback and hashes](baseline.json).
- [Measured structure geometry](scene-geometry.json),
  [logic checks](../../checks/journey-verification.json),
  [camera checks](../../checks/journey-camera-verification.json).

Ridge images match the place and viewport, not the camera pose: changing the camera
is part of the requested correction. Captures were taken in normal play with lamp
animation running. No pixel-difference score is claimed. Still frames demonstrate
composition, not smoothness or latency. Camera motion was explored through keyboard
play, but no motion recording or physical remote test was performed.

## Verification

The complete Computer Use route was field → threshold → well → courtyard → fold →
rear passage → shelter. Investigations at the well, fold, rear passage and shelter
produced the visible ending: 123 metres, four places investigated. Arriving at the
shelter alone did not complete the story. Arrow inspection orbit, recovery and a
separate climb to the overlook were also exercised. On a 390 × 844 viewport,
notebook down-arrow input moved its scroll position from 0 to its 28 px maximum
and OK returned to play. The notebook retained earlier observations after recovery.

Ten model checks pass, including both discovery routes, gate refusal, idempotent
inspection, recovery/reset and completion reachability from all 75 tested knowledge
states. The camera suite samples 29,632 frames in 128 configurations: every lane in
both directions, wide/narrow framing, and reversed initial headings. It found zero
blocked chest or look-ahead rays against measured building bounds. Minimum camera
arm was 2.776 m; maximum per-frame yaw change was 0.0533 radians at 30 Hz.

This proves neither full-body visibility nor clearance from all trees and small
props. Inspection composition is assessed separately through screenshots. The overlook shot was raised after foreground roofs competed with its route hint;
[the earlier framing](before-overlook-adjustment.jpg) is retained. Distant route
geometry remains faint and partly hidden by roofs: the text and notebook still carry
some of that discovery. This is a remaining environmental-readability tradeoff.
Existing
structure clearance remains at least 0.9218 m along sampled paths. The original
maze and canonical models remain unchanged. Final module syntax and documentation
links passed; [captured browser errors/warnings](browser-errors.json) were empty.
[Final source hashes](final-source-hashes.json) identify the reviewed revision.

## Keep, limits, next playtest

Keep this bounded candidate for Jaco's review. It replaces the rejected cost rule,
uses discoveries to alter routes, and gives the camera a direction and an obstacle
response. The new props are deliberately simple editable geometry. The clue copy,
routes and gate are creative adaptations, not claims about Luke 2. The scene lacks
a finished Nativity cast. Sound, actual TV legibility, hardware transport and fun
remain unassessed. No further feature expansion is implied by the completed checks.

Next question for the playtest: did a clue make you reconsider where to go, or did
it still feel like following prompts until a route unlocked?
