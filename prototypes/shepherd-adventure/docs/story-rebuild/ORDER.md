# Order: rebuild the shepherd’s village journey

13 September 2026 · Initial route milestone accepted as sufficient to checkpoint; detailed scenes remain unfinished.

## Why this work exists

The village search needs a clearer narrative and more opportunity for the following camera to show the town. Polishing individual scenes before settling the journey could waste effort on scenes that will disappear. The earlier shortened route would skip too much atmosphere. The chosen direction is a winding search through the village, following plausible reports and traces of Mary and Joseph’s search for shelter.

The full-experience review is inspiration, not canon. The player should follow understandable leads in front of them, rather than need advance knowledge of an overlook or an unexplained back road. Rejection, incomplete help and eventual kindness should give the journey emotional shape. Specific villagers’ reports and tracking details are authored connective fiction, not assertions of scriptural detail.

## Decision and delivery agreement

Build a real traversable route first, with numbered placeholders and a temporary Move to next point button. Keep replay, jump and capture tools so individual scenes can be reviewed without repeating the entire game. This is a rehearsal entry, not the finished public experience. The intro diorama, opening camera sequence and ending are temporarily bypassed; reconnect and review them before release.

The user directs each scene’s feeling, text, options, camera and execution. Implement one bounded scene at a time, provide concrete walkthroughs and screenshots, then revise based on the user’s review. Automated correctness is not creative acceptance. Do not fill in all dialogue or interactions in a single pass.

## Mandatory feature branch

**All subsequent work for this rebuild belongs on `codex/shepherd-story-rebuild`.** Continue that branch, including each point of interest, transitions, assets needed for these scenes, and integrated fixes. Check the branch before editing. Do not create unrelated per-scene branches or apply this feature to main by default.

The initial milestone is authorized for commit and push to `origin` (`JesusFilm/story-lab`). That authorization is not authorization to merge or deploy. Keep the feature unmerged until all detailed scenes and the integrated experience are reviewed and a release is explicitly authorized. Do not enable auto-merge. A main-ref deployment guard protects against manually deploying this feature branch through the existing Pages workflow.

Use focused commits on this same branch as scenes are accepted. Bring main updates into it at deliberate checkpoints when needed. Before release, remove temporary controls from the player experience, restore the complete opening/ending flow, review the publication allowlist and hashes, validate hosted paths, and present the result for an explicit merge decision. The public prototype stays on its existing published version throughout the rebuild.

## Ordered journey and individual work items

| Point | Place | Intended scene | Remaining decisions and implementation |
|---|---|---|---|
| 01 | Lamp workbench | Prepare a light before setting out | Assembly actions, required effort, text, camera, and carrying handoff |
| 02 | House 1 | Resident sends the shepherd away because it is late | Knock or call, response, timing and reaction; house unlit |
| 03 | House 3 | Resident saw Mary and Joseph with a donkey heading toward the gate | Helpful exchange, exact wording, next-direction cue; house lit |
| 04 | Barred timber gate | Cannot pass; seek help near the well | Barrier action, shepherd options and clear reason for the detour |
| 05 | House 5 | Nobody answers; human and animal tracks lead away | Silence, inspection, readable tracks and next lead; house unlit |
| 06 | Village animal pen | Closed pen; the tracks continue past it | Establish nobody entered; observation options and continuation cue |
| 07 | House 8 | Helpful resident recommends the stall beside the gate | Varied interaction and credible partial advice; house lit |
| 08 | Empty stall / gate rear | Nobody at the stall, but opening the gate is progress | Search, opening action and thought/camera reveal of lit House 9 |
| 09a | House 9 owner | The owner offered the family the shelter; gives directions | Dialogue, options and clear destination; house lit |
| 09b | Companion reunion | Shepherds arrive through the opened gate, ask directions and run ahead | Arrival staging, exchange, animation, and explicit follow choice |
| 10 | Nativity shelter | Follow past the sheep and arrive quietly | Quiet approach, recognition, final staging and ending handoff |

See the [scene briefs](README.md#scene-index). Preserve the ten stable point numbers; 09a/09b are sub-beats of point 09, not additional route stops.

## Feedback incorporated in this milestone

- Implemented the winding ten-point route using real movement and the follow camera. Temporary outcomes equip the lantern and open the gate while detailed interactions are pending.
- Added replay of the full incoming leg, staged jumps, restart, pause, reduced-motion control and screenshots. Staged reviews are clearly distinguished from a complete walkthrough.
- Rotated visited houses 1, 3, 5, 8 and 9 toward their actual knocking stops while preserving their centres. Checked all five arrival views and refreshed the rehearsal map.
- Replaced the diagonal wall cutting through Empty stall 1 with a gate-to-stall-side connection, following the annotated correction. The stall opening is clear from the intended rear-gate side.
- Made running the main movement: accelerate toward 4.6 m/s, walk for the final three metres, and ease down at the stop. The final sheep enclosure uses a sustained walk. Existing animation blending remains; running-only arrivals are a fallback if later scene review finds the blend distracting.
- Restricted fixed village lights to helpful houses 3, 8 and 9, the lamp workbench and the nativity. Houses 1 and 5, other homes, well, courtyards and rear passage are unlit. The gate fixture stays unlit even after opening. This supersedes the earlier proposal to light the gate. The carried lantern and moon/sky illumination remain.
- Updated maps, scene briefs and checks. Retained original entry behavior separately for reference; no public deployment occurred.

## Review and evidence

The user walked the initial route start to end, supplied the door, wall, movement and lighting corrections, and then said this was sufficient work for this piece and authorized its first commit/push. Treat that as acceptance of this scaffold milestone, not acceptance of unfinished scenes or final game quality.

[Implementation checks and historical captures](../../review/2026-09-13-route-rehearsal/README.md) record the initial walk, door views, wall correction and technical checks. Earlier screenshots predate subsequent corrections and must not be presented as the current lighting. The one recorded frame-time sample predates the running trial and is not a current performance certification.

Current checks cover route state, running-to-walking sequence, correct fixed-light inventory, model centres and door orientation, stall-wall interior clearance, sampled path clearance and landscape/portrait camera visibility. User scene reviews, integrated performance and physical-device verification remain release work.

## Remaining cross-scene work

### Point 01 checkpoint — 13 September 2026

The lamp workbench now has a generated replacement model and a playable guided
assembly/departure draft. The user selected one part at a time and subsequently
requested that the work be recorded in the audit and committed to this branch.
[Audit update](../navigation-direction-retrospective-2026-09-13.md#13-september-update--lamp-workbench-assembly-and-departure) ·
[Scene direction and remaining decisions](scenes/01-lamp.md) ·
[Screenshots and verification](../../review/2026-09-13-lamp-workbench/README.md).
This checkpoint does not mark the scene creatively accepted. Other scene
placeholders remain, and merge/deployment remain unauthorized.

- Reconnect intro/diorama/cutscene, village entry and complete ending.
- Integrate all clues, available actions and progression so the temporary next-point controls can be removed.
- Address carried-lantern hand attachment and any movement/camera adjustments exposed by scene staging.
- Review text, sound, pacing, readability and camera transitions in the complete journey.
- Validate restart, loading/failure handling, reduced motion, mobile/device behavior and performance with the finished content.
- Complete publication review, hosted-path checks and explicit release review before any merge to main.
