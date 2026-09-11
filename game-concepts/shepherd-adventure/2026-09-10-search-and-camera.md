# Night search and camera correction

- Status: done — implementation and verification complete; awaiting user playtest
- Owner: Codex
- Last updated: 2026-09-10
- Objective: replace the rejected arithmetic challenge, preserve the achieved atmosphere, and keep the shepherd and route ahead visible.
- Authorization: Jaco's follow-up feedback on 10 September under the original prototype redesign request.
- Accepted preference: the new night-village atmosphere works. Darken the far exterior further.
- Rejected by Jaco: per-lane arithmetic as a challenge; fixed camera bearing as it hides the player and interesting details.
- Scope: revise the existing journey mode, no paid assets or production integration. Preserve a source snapshot of the previous round.
- Dependencies: current route model, generated structure bounds, existing models and browser runtime.

## Criteria before implementation

1. Camera turns smoothly toward the actual route ahead, including retracing and reversed travel. It must keep the shepherd visible around the existing structures; test every route in both directions and inspect actual travel.
2. Nearby warm pools and useful route detail remain readable. Far land disappears into near-black; survey must not restore a brightly lit exterior.
3. Remove per-path arithmetic from the central challenge. New choices must change what the player knows or can reach, rather than merely pass a displayed affordability test. No automatic omniscient destination labels or full solution map.
4. Retain arrows + OK, untimed decisions, clear recovery, and the ability to finish. Do not claim fun from functional checks.
5. Record the user's atmosphere acceptance and challenge/camera rejection distinctly from the next candidate's unreviewed status.

## Next actions

Jaco to play the revised investigation and judge whether clues create interesting decisions. Further feature work waits for that feedback.

## Selected challenge direction

Jaco explicitly selected environmental investigation: landmarks, deductions and detours
for information. This selects a family of mechanics, not approval of this specific
candidate. The candidate removes lane costs, fuel restrictions, destination beacon,
unknown destination names and the omniscient survey.

A blocked market gate requires a way around. Investigating the overlook reveals a
previously unrecognized courtyard lane; investigating the ordinary animal fold
reveals a rear gap. These are alternative routes, not a mandatory collection list.
The gate can be unbarred from the far side. The goal only completes after inspecting
the shelter. A notebook retains observations, visited places and discovered routes.
No deaths, timer or resource arithmetic is introduced. The cost of an uncertain route
is a possible detour; its reward can be useful information or a new connection.

All tracks, gates, observations and their route relationships are creative game design,
not additions asserted as biblical facts. The new well, tracks, trough, gate and small
swaddled stand-in are editable scene blockouts, not approved asset-library models.

## Verification and outcome

Ten investigation checks pass, including two routes (123 m and 154 m), gate behavior,
no completion on arrival alone, persistent discoveries and all 75 reachable knowledge
states having a completion path. Camera tests cover 29,632 frames over both lane
directions, wide/narrow framing, and reversed initial headings with zero blocked
chest/look-ahead samples against the measured structure bounds. Tree/prop occlusion,
full-body framing, inspection composition and subjective camera movement still
require visual review; these numerical checks are not a claim of fun.

The 123 m animal-fold route was completed with Computer Use and arrows/OK, including
inspection-gated arrival. The alternative overlook, barred gate, recovery, inspection
orbit and notebook were exercised. Notebook arrow scrolling was checked at 390 × 844.
The source snapshot, paired ridge captures and detailed limits are in the
[second review](../../prototypes/shepherd-adventure/review/2026-09-10-search-and-camera/README.md).
The implementing agent kept this as a bounded candidate; Jaco has not approved its
challenge quality. No new generated assets, paid credits or production integration.

## Follow-up — 11 September

Jaco accepted the route-following camera but reported jitter near obstacles, tree
occlusion and an unclear ↑ interaction. The [next revision](2026-09-11-light-and-camera.md)
records the requested corrections, light preparation and new asset work.
