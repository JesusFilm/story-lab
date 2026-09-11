# Light preparation and camera stability

Status: gameplay implementation verified; model inputs await Jaco's approval.
Owner: Codex. Date: 11 September 2026.

[Play](http://127.0.0.1:8765/journey.html) · [Plan](../../../../game-concepts/shepherd-adventure/2026-09-11-light-and-camera.md) · [Asset task](../../../../game-concepts/shepherd-adventure/2026-09-11-well-and-gate-assets.md)

Jaco accepted the following camera's engagement, but reported repeated orbit jitter
around the sleeping market, opaque tree interiors, and failure to discover the ↑
interaction. He requested a quiet discovery payoff, a modestly expanded challenge,
a light-making loop, a helpful rear-gate action, more character clips and better well/gate models.

## Changes and evidence

| Problem | Change | Check |
|---|---|---|
| Collision correction fed back into camera candidate scoring. | Score desired arms independently of corrected position; retain a clear arm through small score changes. | 112 stationary location/heading cases settle without continued movement. |
| Trees and nearby props were absent from visibility handling. | Register full tree/prop/model bounds; fade foreground obstructions and geometry surrounding the camera. | All 11 trees included; real route sampling exercises 2,402 foliage-fade opportunities. |
| ↑ was lost in the control legend. | Large contextual action immediately beneath path selection; unseen places gently highlight the action. | [First prompt](first-interaction.jpg), [first material reward](wick-discovery.jpg). |
| Discovery lacked a memorable result. | Warm light motif, explanatory reward, optional quiet ascending three-note phrase. No repeated reward at already-collected items. | State tests; actual visual inspection. Sound quality remains unassessed. |
| Floating light did not belong to the story. | Remove orb sprite; begin without carried illumination. Gather wick/oil, return to the hearth and light the lamp; equipment icon records progress. | Two material orders, incomplete recipes, dark-lane refusal, recovery and replay. |
| Short journey, little use of clips. | Three preparation stops, brief runs on familiar/selected later lanes, turn clip on reversals and look-around on inspection. | Full route checks; run acceleration test; browser play. |
| Gate felt like an arbitrary main mission. | Lift a timber bar from behind and light the gate lamp for the shepherds following; this opens the final approach. | Both discovery branches reach the rear passage; no key hunt. |

## Automated checks

[Investigation checks](../../checks/journey-verification.json): 11 pass; completion
is reachable from all 113 independently enumerated states. Two completion routes
with preparation are 211 m and 242 m. Items and light are never spent by waiting.
Only the overlook and fold reveal new routes; rear-gate interaction opens the bar.

[Camera checks](../../checks/journey-camera-verification.json): 54,696 frames across
304 directed configurations, at walking/running speeds and wide/narrow framing.
No blocked character-chest rays against measured buildings. Eleven sampled
look-ahead rays intersected buildings during travel; foreground fading is the
additional visibility aid. All 112 stationary cases converged to zero measured
late-frame movement. These tests do not prove subjective smoothness, full-body
visibility, every transparency-sorting outcome or TV performance.

The [scene bounds](scene-geometry.json) include 14 placed structure instances,
11 trees and preparation/inspection props. Conservative whole-object bounds may
fade an object sooner than necessary. This intentionally favors visibility over
keeping every foreground branch opaque. Transparent foliage is an acknowledged
visual compromise; it avoids the camera weaving around individual branches.

## Full Computer Use playthrough

Keyboard run completed field → threshold → hearth → wick → hearth → oil → hearth →
threshold → olive courtyard → overlook → olive courtyard → market → courtyard →
well → ridge → fold → rear passage → shelter. All 14 areas were visited. The [visible ending](completed-full-run.jpg)
reported **312 metres, eight places investigated, gate lit and open**.
The run used arrow/OK input throughout. The market camera settled after approach and
route preview changes. [Market framing](market-settled.jpg), [lantern reward](lantern-lit.jpg)
and [route reward](route-discovery.jpg) retain useful keyframes. This was exploratory
play, not a frame-perfect motion recording or physical-TV test.

## Repeatable focused review

The [camera scenarios](../../checks/camera-scenarios.html) stage the sleeping market,
olive trees or closed rear gate with a supplied lantern and known routes. A visible
banner distinguishes these from a normal run. They are for reproducing obstruction,
turning and gate-light transitions; they do not count as a completed playthrough.
The final gate scenario was checked [closed/unlit](gate-before.jpg) and
[open/lit](gate-after.jpg), then traversed back to the market. The runtime
[motion log](motion-log.json) confirms idle, look-around, turn, walk and run clips.
[Narrow controls](narrow-controls.jpg) were inspected at 390 × 844; the contextual
interaction and equipment icon remain visible. [Captured warnings/errors](browser-errors.json)
were empty. Sound was left off, so its audible quality remains unassessed.

## Source and scope

[Before source](before-source.zip) preserves the prior journey. The original maze,
canonical models and shared asset approvals remain intact. The shared character
adapter gains only an explicit inspection state using its existing look-around clip.
No new animation jobs were requested. Model readiness remains separate from gameplay.

Well and gate native ImageGen ref-001 candidates are saved in the asset library.
Tripo generation is pending exact style/input approval, with an estimate of 60 credits
for both meshes; no paid jobs have been submitted for this round. They are candidates,
not approved historical reconstructions. Wick/oil/lamp and the welcoming gate are
creative adaptations around Luke 2, not events asserted as biblical source material.

## Remaining playtest question

Does the preparation/discovery sequence teach you to investigate naturally, and
does fading foreground foliage feel calmer than the former camera circling?

[Final source hashes](final-source-hashes.json) identify the delivered gameplay revision.
