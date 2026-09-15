# Order: rebuild the shepherd’s village journey

13 September 2026 · Initial route milestone accepted as sufficient to checkpoint; detailed scenes remain unfinished.

## Current checkpoint — village dressing and dialogue continuity, 15 September 2026

The user requested this work be documented, committed and pushed to
`codex/shepherd-story-rebuild`. **Do not merge to main or deploy.** The earlier
sections below preserve the original route order; the integrated opening and
ending already exist as described in the [scene index](README.md).

### Assets and placement

- Recovered the original House 3 doorway illustrations as the reference for
  terracotta pots, olive-like foliage, low limestone edging and wicker baskets.
- Generated four reusable Pixal3D decoration assets: two wall/pot clusters and
  two basket/pot clusters. Preserved references, exact ImageGen prompts, original
  models, prepared derivatives, renders and provenance in the asset library;
  the prototype owns independent runtime copies. Transparent reference repairs
  recovered missing foliage on two variants.
- Distributed twenty decorations across all eleven house fronts, one or two per
  house with stable seeded variation. Mounts follow each host's rotation, sit
  against its facade and keep its doorway clear.
- Rotated houses 2, 6, 10 and 11 inward according to the annotated plan. Preserved
  the established house centres, visited-house approaches and walking route.
- Generated a lower limestone annex and attached it to houses 1, 2, 3, 5, 8 and 9.
  Corrected both its top-down alignment and the 13.8° tilt baked into its mesh.
  The prepared base now measures 0.28° from horizontal, roof 0.96°. The selected
  derivative retains 159,783 triangles, a 2K base-color texture and matte material.
  Its finish remains softer than the main Tripo house; a future Tripo replacement
  can be considered separately. No Tripo generation was submitted.
- Added eleven low-wall runs following the blue annotations. Replaced approximate
  endpoint coordinates with named structure attachments, raycast at masonry
  height and embedded into actual surfaces. Seventeen intended structure or
  perimeter joins are checked geometrically.
- Restored the original gate-side wall wings at the user's request, including
  the stall-side connection and opposite return. These remain alongside the new
  decorative runs; the village perimeter and animal enclosure remain intact.
- Regenerated the settlement and rehearsal maps from actual model footprints,
  with annexes, decorations, current wall runs and house-door direction markers.

### Illustrated house conversations

- Captured the actual settled player camera at Houses 3, 8 and 9 using the same
  renderer/camera as normal play. Saved player views, matching architectural
  plates and camera transforms; the plates hide only the shepherd and carried
  lantern geometry while retaining scene lighting and viewpoint.
- Generated and integrated eight replacement images: House 3 closed/open/speaking,
  House 8 closed/open, and House 9 opening/speaking/pointing. References include
  current decorations, visible annexes, connecting walls and neighboring scenery.
- Preserved the existing three resident identities, clothing, door hinge/ring
  sides and the owner's final pointing direction. Dialogue text and chronology
  are unchanged. Original illustrations and exact replacement prompts are kept.
- Audited House 1's live 3D voice refusal and House 5's unanswered visit; neither
  has an illustrated owner conversation needing replacement.

### Evidence and remaining limits

- [Initial decoration review](../../review/2026-09-15-house-decorations/README.md).
- [Annotated layout implementation](../../review/2026-09-15-village-layout/README.md).
- [Annex leveling and wall connections](../../review/2026-09-15-village-connections/README.md).
- [Restored gate and dialogue continuity](../../review/2026-09-15-dialogue-continuity/README.md).

Validation covers mesh base/roof planes, six annex attachments, facade/doorway
clearance, seventeen wall joins, current maps, stalls, full route/state checks,
and 2,002 camera samples each in landscape and portrait with no hidden-player
samples. Browser checks passed all twelve illustrated dialogue pages, replacement
image loading, return to play and mobile reduced-motion layout without JavaScript
errors. Generated texture details can vary between illustrations even where
composition and scene dressing match the captured geometry.

Performance optimization remains separate work. The portal's reviewed list/hashes
include this work's changed runtime inputs, but the full local portal build still
stops at a pre-existing review-hash mismatch beginning with `index.html`. Public
release review, merge and deployment remain explicitly unauthorized.

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
| 02 | House 1 | Resident sends the shepherd away because it is late | Knock, temporary waking light, refusal and departure accepted in user play-test; dark before/after |
| 03 | House 3 | Resident saw Mary and Joseph with a donkey heading toward the gate | Brief illustrated exchange and continuity revision accepted for checkpoint; house lit |
| 04 | Barred timber gate | Cannot pass; seek help near the well | Barrier action, shepherd options and clear reason for the detour |
| 05 | House 5 | Nobody answers; human and animal tracks lead away | Silence, inspection, readable tracks and next lead; house unlit |
| 06 | Village animal pen | Closed pen; the tracks continue past it | Establish nobody entered; observation options and continuation cue |
| 07 | House 8 | Helpful resident recommends the stall beside the gate | Knock, old man’s illustrated advice, closed-door farewell and explicit stall exploration accepted in user play-test; house lit |
| 08 | Empty stall / gate rear | Nobody at the stall, but opening the gate is progress | Search, opening action and thought/camera reveal of lit House 9 |
| 09a | House 9 owner | The owner offered the family the shelter; gives directions | Knock and illustrated owner exchange accepted in user play-test; house lit |
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

### Integration checklist — completed checkpoint, 15 September 2026

- [x] Reconnect opening diorama, running introduction, village entry and full ending/scriptures.
- [x] Replace temporary progression controls with compact scene actions in the player entry.
- [x] Preserve completed lantern carrying and accepted movement; add House 8 destination framing.
- [x] Review the complete journey and address this session's workbench/scenery feedback.
- [x] Verify full restart, scene progression and targeted interaction checks.
- [ ] Continue user-directed model and decorative improvements on this feature branch.
- [ ] Run separate performance and physical-device/release validation with finished content.
- [ ] Complete publication review, hosted-path checks and explicit release approval before merging.


### Point 02 accepted checkpoint — 13 September 2026

House 1 now has a single knock action, a short free-hand gesture with three wooden
knocks, a temporary warm window light, an unseen resident's voiced/subtitled
refusal, and an explicit action to try lit House 3 after darkness returns.
The transient waking light updates the earlier unlit-house direction for this
scene only. The existing House 3 corridor and later placeholders are preserved.
[Scene direction and timing](scenes/02-house-1.md) ·
[Play-test captures and checks](../../review/2026-09-13-house-1/README.md).
The user completed a successful play-test and accepted this scene, authorizing
a focused commit and feature-branch push after the audit update.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#13-september-update--house-1-rejection-response-and-timing).
No merge or deployment is authorized or performed.

### Point 03 review draft — 13 September 2026

House 3 now reuses the House 1 knock, then presents three consistent illustrations
and a short player-paced exchange. The resident describes seeing the travellers
and directs the shepherd up the lane to the gate. **Thank you** returns to the
village; **Go to the gate** starts the existing route. House 1’s departure thought
now suggests the neighbour’s light. Its refusal timing remains unchanged.
[Shared knocking contract](house-knocking.md) ·
[Scene brief](scenes/03-house-3.md) ·
[Review and verification](../../review/2026-09-13-house-3/README.md).
The user approved the gentle, brief direction; creative acceptance of this
implementation remains pending. Points 04–10 remain placeholders. No merge or deployment.

### Point 03 accepted checkpoint — 13 September 2026

The user reviewed the corrected house imagery and more realistic resident, judged
the revision much better, and authorized the feature audit update, commit and push.
House 3 is accepted for this checkpoint. See the
[audit entry](../navigation-direction-retrospective-2026-09-13.md#13-september-update--house-3-helpful-sighting-and-visual-continuity).
Points 04–10 remain placeholders; no merge or deployment is authorized.

### Point 04 review draft — 14 September 2026

Implemented the user-directed **Open the gate** attempt, two resisted tugs with timber sound and contact cues, obstruction thought and explicit choice to seek help near the well. A camera comparison favored the gentle push and following view because the well-facing shot obscured orientation behind another house. [Scene brief](scenes/04-barred-gate.md) · [Review evidence](../../review/2026-09-14-barred-gate/README.md). User creative acceptance is pending. Points 05–10 remain placeholders. No merge or deployment.

### Point 04 accepted checkpoint — 14 September 2026

The user reported a successful play-test and authorized the feature audit update,
focused commit and branch push. Point 04 is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--barred-gate-discovery-and-well-detour).
Points 05–10 remain placeholders. No merge to main or deployment is authorized.

### Point 05 review draft — 14 September 2026

Implemented the approved two-knock silence, unanswered thought, explicit well
inspection and readable human/hoof trail with steady gold outlines. Follow the
tracks reconnects to the market-side route; point 06 and later placeholders remain.
[Scene brief](scenes/05-house-5.md) · [Review evidence](../../review/2026-09-14-house-5/README.md).
Creative acceptance awaits the user's play-test. No merge or deployment.

### Point 06 accepted checkpoint — 14 September 2026

The animal pen now presents the approved quiet observation and **Follow the tracks** action. Marks continue outside the closed entrance and gradually fade toward the houses. The user completed their play-test and authorized the audit update, commit and feature-branch push. Point 06 is accepted at this checkpoint; points 07–10 retain their placeholders. [Scene and acceptance](scenes/06-animal-pen.md) · [Review evidence](../../review/2026-09-14-animal-pen/README.md). No merge or deployment.


### Point 07 accepted checkpoint — 14 September 2026

House 8 now offers **Knock on door**, a player-paced illustrated exchange with a
friendly grey-haired old man, a closed-door farewell, and **Explore the empty
stall**. The illustrations use the actual House 8 facade and original shepherd
style reference. [Scene brief](scenes/07-house-8.md) ·
[Review evidence](../../review/2026-09-14-house-8/README.md).
The user completed their play-test and authorized the feature documentation update,
focused commit and remote feature-branch push. Point 07 is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--house-8-helpful-advice-and-doorway-continuity).
Points 08–10 retain their placeholders. No merge or deployment is authorized.


### Point 08 review draft — 14 September 2026

Implemented the user-approved empty-stall search, **Light the lantern**, **Open the
gate**, searching thought and lit House 9 reveal, followed by **Go to the house**.
The user's new direction supersedes the earlier dark-gate rule: the gate lamp stays
dark until the explicit lighting action, then remains lit. Point 04 stays dark.
[Scene direction](scenes/08-empty-stall-and-gate.md) ·
[Captures and verification](../../review/2026-09-14-empty-stall/README.md).
Point 08 is ready for user review; points 09–10 retain placeholders. House 9's owner
conversation is the next separately directed area after this review. No acceptance,
merge or deployment is implied.


### Point 08 accepted checkpoint — 14 September 2026

The user completed their play-test and authorized the audit update, focused commit
and remote feature-branch push. Point 08 is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--empty-stall-open-gate-and-house-9-reveal) ·
[Scene and review](scenes/08-empty-stall-and-gate.md).
Points 09–10 remain placeholders. No merge to main or deployment is authorized.

### Point 09a review draft — 14 September 2026

House 9 now offers **Knock on the door**, a player-paced illustrated exchange
with a matter-of-fact animal owner, and **Go to the Nativity Scene** after
**Thank you**. The owner describes the woman's impending birth and the stall
he offered. Matched facade images show opening, explaining and pointing to his
left toward the onward route. [Scene and dialogue](scenes/09-house-9.md) ·
[Screenshots and verification](../../review/2026-09-14-house-9/README.md).
Point 09a is ready for user review; 09b companion reunion/cutscene and point 10
ending remain placeholders. No creative acceptance, merge or deployment is implied.

### Point 09a accepted checkpoint — 14 September 2026

The user reported play-testing good and authorized the audit update, focused
commit and remote feature-branch push. Point 09a is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--house-9-shelter-owner-and-directions) ·
[Scene and review](scenes/09-house-9.md).
The companion reunion/cutscene at 09b and point 10 ending remain placeholders.
No merge to main or deployment is authorized.


### Point 09b review draft — 15 September 2026

Implemented the approved brief reunion: entrance-side companions visibly cross
the opened timber gate, stop at House 9, ask and receive directions, then run ahead
and wait for an explicit follow action. The names Mary and Joseph are omitted from
the shepherd's report because Luke does not establish that he knows them yet.
[Scene](scenes/09-house-9.md) · [Review](../../review/2026-09-15-companion-reunion/README.md) ·
[Standing continuity guidance](biblical-and-historical-continuity.md).
User creative acceptance is pending. Point 10 remains a placeholder; no merge or deployment.


### Point 09b accepted checkpoint — 15 September 2026

The user completed play-testing and authorized the feature audit update, focused
commit and remote feature-branch push. Point 09b is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#15-september-update--companion-reunion-and-biblical-continuity) ·
[Scene and review](scenes/09-house-9.md).
Point 10 remains unfinished. No merge to main or deployment is authorized.


### Point 10 approach accepted checkpoint — 15 September 2026

The user accepted running past the sheep with a short final walk near the shelter.
Companions have idle/run clips only, so they run ahead and wait while the player
walks the final eight metres. This supersedes the sustained enclosure walk.
[Scene](scenes/10-nativity.md) · [Review](../../review/2026-09-15-nativity-approach/README.md) ·
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#15-september-update--nativity-approach-pacing).
The user authorized the audit update, focused commit and remote feature-branch push.
Recognition, active final interaction and ending remain pending. No merge or deployment.

### Full-flow integration — 15 September 2026

The user reports the individual scene work complete and requests the smaller
player-facing actions, restoration of the opening diorama and running introduction,
and the full nativity outro/scripture sequence. Existing scene progression and the
completed lantern-hand attachment are retained. Performance is explicitly out of
scope for this session.

The normal index now hosts the rebuilt scene runtime with compact action/subtitle
presentation. The separate rehearsal entry retains review tools. Original opening
and ending story manifests are reused unchanged. The ten-second running opening
hands off at the new route entry; the nativity arrival camera automatically opens
the ending story once, and completion offers replay. The user accepted the completed integration checkpoint after review and follow-up
fixes. Commit and feature-branch push are authorized; merge and deployment are not.

### Follow-up: ground contact and obsolete scenery — 15 September 2026

User review found the leveled workbench floating. Lowered the corrected model
47 cm, leaving its uneven feet embedded in the soil; tabletop parts follow the
surface and the hanging lamp is lowered with it. Removed the unused procedural
trough and two block props beside the village pen, plus both tall shelter-screen
wall runs. The current footprint clue and pen remain. Restored `?debug` in the
rebuilt runtime and added Lamp workbench, Lamp side and Village pen presets.
Side/approach and pen inspector views reviewed; lamp assembly and tracks checks
pass. The user accepted this checkpoint and authorized its commit and remote push.
