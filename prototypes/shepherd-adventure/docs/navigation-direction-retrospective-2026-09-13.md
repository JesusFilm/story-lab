# Navigation redesign — retrospective direction audit

Recorded 13 September 2026, after the full experience review. This is a retrospective decision record, not a contemporaneous request transcript. It separates recoverable implementation evidence, the user's recalled intent and new direction. The dated implementation update below records subsequent work; the historical findings remain unchanged.

## Why navigation changed

The user recalls that cycling routes with left/right arrows, confirming through a large central button and separately pressing ↑ to investigate was painful and difficult to read. The redesign significantly improved usability. Preserve its readable, directly actionable destination controls and quiet presentation; restoring the old carousel is not the remedy for missing scenes.

The primary commit is **`f2fcb3c2c5e53011aa2cdb5b007612699f1bf4f3` — Replace route cycling with visual choices and automatic discovery**, 12 September 2026. Its [contemporaneous review](../review/2026-09-12-navigation/README.md) records minimal text, simultaneous visible choices, automatic discovery, and a stationary choice camera. It explicitly sought arrival-only discoveries and nonblocking observations. That record supports the redesign's intention; it does not establish that every former scene was assessed and intentionally retired.

## What changed, and what was lost

| Evidence | Change | Consequence to review |
|---|---|---|
| Parent of `f2fcb3c`, `src/journey.mjs`, `input`, `followingFrame`, `updateCamera` | Left/right selected a route; confirm walked; ↑ entered inspection. The camera preview followed the selected destination; some inspections used authored moves | Old scenes depended on a distinct inspection state and a different camera model |
| `f2fcb3c`, `src/journey-routes.mjs` and `journey.css` | Added direct landmark cards; hid carousel, investigation controls and help | Better visible navigation, but the primary visible entrance to clue views disappeared |
| Same commit, `Journey.noticeArrival()` in `src/journey-model.mjs` | Arrival calls `inspect()`, then immediately `closeInspection()` for ordinary inspections, retaining a short message | Knowledge can unlock without the inspection camera playing. Successful route completion does not prove the clue was communicated visually |
| Same commit, `followingFrame()` | Removed selected-route camera preview while at a choice | Stable choices, but an arrival can keep the travel heading instead of facing its named clue |
| Same commit, pause menu | Added “Look around here” to reopen inspection | Initially retained a pointer-accessible fallback |
| `a5d0fce8bb07a06b9f3b689736bb2f6e2cef2005` — Unify shepherd adventure UI and simplify journey controls | Reduced pause menu to Continue / Restart, removing “Look around here” and notebook access | Remaining ↑ inspection behavior became effectively undiscoverable to pointer/touch players. See the [UI review](../review/2026-09-12-material-ui/README.md) |
| Current source and [full play-through](../review/2026-09-12-full-experience/README.md) | Inspection code and discovery records remain; keyboard inspections still reveal different compositions | This is partly an integration loss, not simply absent models or a need for more buttons |

Related changes `4cdd0f5` (unfinished lamp work remains accessible) and `beb54fd` (quieter annotated HUD) help explain the transition. They are not the main cause of the lost inspection camera interval.

## The remembered roof reveal

The user remembers investigating beside the settlement, looking behind it and seeing the Nativity stall roof. Historical source confirms an overlook action labelled **“Look beyond the roofs”**, a camera destination raised by 4 m and looking toward `(-2.5, 0, -19)`, and an `overlook` discovery. Its written observation describes a lane behind the courtyard wall reaching the far side of the market gate. A separate ridge observation is titled **“A roof in the darkness”** and describes an animal enclosure.

This establishes related reveal machinery, but does **not** conclusively identify a historical shot of the Nativity roof. The shelter has since moved: the old goal was near `(3, -66)`; the later [Nativity direction record](nativity-scene/request-and-progress.md) relocates and revises the approach. Do not restore the old camera coordinates blindly or claim the remembered composition has been reproduced. Review the overlook and ridge independently against current geography and the desired clue.

## Direction recorded now

The experience should be simple, beautiful and engaging: participate as a shepherd responding to the news of Jesus' birth. Fewer available choices and more meaningful discoveries should carry a winding route through the settlement. The player does not initially know the way. Direct choices remain useful; displaying every physically reachable branch before the shepherd learns about it is no longer the desired default.

The intended progression is:

1. Enter the settlement and prepare a lantern at its entrance, much more easily than the current multi-step workbench. Preserve the urgency of setting out.
2. Find the barred gate on the apparently ideal route. Make the obstruction and reason to seek another way visible.
3. Return into the settlement toward the well, then through courtyards where tracks or other clues provide direction.
4. Reach the animal fold or high ridge, then discover the rear path. Decide which stop/reveal earns its place before retaining both as branches.
5. At the rear gate, let the player intentionally light the fixed lantern and open the gate. Stage a visible physical action, followed by companions passing through.
6. Follow the other shepherds to the Nativity, preserving the quiet approach, family reveal and explicit ending action.

This is a direction, not a finalized route graph or an instruction to implement the whole sequence in one batch. The manual gate interaction refines the earlier [companion direction](content-update-2026-09-12.md): preserve the player at the gate and “follow the others,” while reviewing when the player initiates the lighting/opening.

### Exploratory idea: asking at doors

Consider a few short dioramas in which the shepherd knocks and asks for directions. Early villagers cannot help; eventually the animal-stall owner explains that Mary and Joseph are using his stall at the far end of the village. It is late, and the shepherd must find the way without a guide. The conversation would reveal a useful path instead of exposing all destinations at the start.

This is an idea to prototype and review, not an approved script, number of doors or asset commission. Keep unsuccessful answers brief and humane, each advancing understanding; avoid repetitive rejection, guessing every door or a dialogue maze. These villagers, conversations and route details are authored connective fiction, not quotations or events asserted by the Luke passages. Maintain a clear distinction from scripture presentation.

## How to process the critique

Take **one scenario at a time**. Before replacing its props, answer: what should the shepherd learn or do; how did the old implementation communicate it; what survived the UI redesign; and does that purpose still fit the current route?

For each scenario, record:

- Current evidence: normal arrival, intended clue view, departure, both screen orientations, and relevant critique IDs.
- Decision: retain, restore in the new UI, reinterpret or retire; note historical intent separately from the new choice.
- The visible cause and effect: clue or conversation → what the player understands → newly meaningful action/path. Do not unlock a route silently before the player can understand the clue.
- A small implementation boundary: interaction, camera and only the assets needed for that scenario. Choose automatic brief reveal or a clear contextual action as appropriate; do not reintroduce mandatory generic investigation everywhere.
- Acceptance: a first-time player notices the clue and knows the next action; mouse/touch and keyboard work; skip/reduced motion preserve meaning and state; return visits do not replay unwanted exposition; transitions and frame pacing remain comfortable.
- Before/after evidence, performance comparison and a dated decision/outcome before opening the next scenario.

A useful first scenario is the overlook: establish whether it reveals a rear lane, a destination roof or something else, then compose it in current geography. Small independent defects such as completion contrast can be addressed separately. Catalogue priorities indicate visible severity, not authorization for a batch of replacement assets.

## Status and related records

Historical source/diffs and existing review records inspected; retrospective and current direction documented. No old build was replayed in that historical investigation. The original critique's screenshots and observations remain evidence of the reviewed build, rather than the rebuilt lamp scene described below.

## 13 September update — lamp workbench assembly and departure

The [rebuild order](story-rebuild/ORDER.md) now governs the ten-point winding route and supersedes the exploratory progression above. In particular, the gate fixture remains unlit, and companions reunite at House 9. Work stays on `codex/shepherd-story-rebuild`, one scene at a time.

**Decision: reinterpret point 01 as a short, guided preparation.** The user requested a generated lamp workbench, a clearly visible existing lamp and loose parts, large item close-ups, and a collection cue followed by carried light. They selected **one part at a time**. The old wick-height/oil-level recipe is not used in the rehearsal.

Implemented in this checkpoint:

- Replaced the procedural box-built bench with a new native ImageGen → Pixal3D workbench. Preserved its reference, exact prompt, source model and review renders in the [asset library](../../../assets/structures/lamp-workbench/README.md), with an independent runtime copy in the prototype. The centre and approach remain fixed; the open front faces the stopping point, and both settlement maps reflect the measured geometry.
- Reused the existing lamp and oil jar. Wick and flint remain separate small tabletop props. The guided item panel presents **Lamp body → Wick → Oil → Flint & tinder → Light lamp**, with one action per step, clear feedback and no incorrect combinations. Lamp/jar PNGs are renders of the actual models; wick/flint close-ups are generated illustrations.
- Added a close scene camera, visible table-lamp illumination, explicit **Take lamp**, one **+1 Lamp** cue and **Set out — House 1**. The table lamp disappears on collection; the carried light follows the shepherd's right hand. Reduced the old workbench light's intensity to preserve material readability and distinguish lighting the new lamp.
- Preserved progress when backing out, blocked actions during pause, prevented unfinished departure and repeated awards, and made restart/review staging reconstruct the correct lamp state. Points 02–10 retain their placeholders.
- Updated source records, the local gallery, reviewed publication inputs and dependencies. Local export validation exposed two stale hashes and a missing shared scene module from the earlier scaffold; those existing changes were inspected and the manifest repaired. The rehearsal was not added to the public demo allowlist.

**Verification and evidence:** [targeted walkthrough and screenshots](../review/2026-09-13-lamp-workbench/README.md) include staged before/after arrivals, all item steps, actual incoming movement and departure, mobile reduced motion and model failure/retry. Ordered-state, duplicate/pause/reset, ten-route geometry/camera and existing-stall checks passed. Browser walkthroughs passed; local portal build and dependency/sensitive-content checks passed at root and project deployment paths. No deployment occurred.

**Asset cost and limits:** the source has 982,091 triangles; the selected derivative has 49,879 triangles, embedded 2K textures and a roughly 3.3 MiB GLB. A generic rebake introduced dark canopy artifacts and was rejected; the retained derivative preserves the source atlas. These counts do not establish improved frame rate over the old box bench. A controlled before/after performance comparison and physical-device validation remain outstanding. Item actions do not include bespoke assembly/pouring/striking animation, and the carrying grip uses the existing hand pose.

**Review outcome:** the user authorized an audit update and a branch commit after the playable draft was presented. This is a checkpoint of that work, not final creative acceptance of its exact text, timing, framing or sound. See [point 01's current brief](story-rebuild/scenes/01-lamp.md). No merge, push or deployment is part of this checkpoint request.

- [Full experience critique and model catalogue](../review/2026-09-12-full-experience/README.md)
- [Asset performance experiment and ongoing process](asset-performance-process-2026-09-13.md)
- [Companion/cutscene direction](content-update-2026-09-12.md)
- [Nativity direction and revisions](nativity-scene/request-and-progress.md)


## 13 September update — House 1 rejection, response and timing

**Decision: implement and retain point 02 as a brief, player-initiated rejection.**
The user asked for an obvious knock action, visible and audible knocking, an
irritated resident disturbed at night, a waking light, a refusal and an explicit
choice to continue. The next mapped stop remains lit House 3, reached along the
existing winding western lane. This is authored connective fiction, not a
scriptural quotation or an asserted biblical conversation.

Implemented in this checkpoint:

- **Knock on door** replaces the House 1 placeholder action. The shepherd steps
  toward the door and raises his free left hand while keeping the carried lamp
  in his right hand. Three door cues coincide with three synthesized wooden taps.
- A temporary warm window light appears at 2.5 seconds. At 3.3 seconds the unseen
  resident responds, **“Go away! It is late!”**, with matching subtitles. The
  window goes dark at 5.9 seconds and the shepherd steps back. This transient
  waking light is the sole update to House 1's otherwise unlit state.
- At 6.7 seconds the shepherd observes that another light is visible farther
  along, and **Try the lit house — House 3** becomes available. Departure is
  explicit; the existing corridor and House 3 interaction placeholder are retained.
- Pause/backgrounding freezes the scene and sound. Repeated knocks and premature
  departure are blocked. Replay, jump and restart reset or reconstruct the scene
  and cancel interrupted audio. Subtitles preserve meaning if the voice fails to
  load. Reduced motion uses fixed-size knock cues.
- Scene state and presentation are separate small modules. No settlement models,
  house transforms, corridor geometry, later scene placeholders, publication
  allowlist or deployment configuration were changed for this scene.

**Verification and evidence:** [House 1 walkthrough and screenshots](../review/2026-09-13-house-1/README.md)
record the previous placeholder, knock, lit response, darkness, House 3 arrival,
full incoming replay, portrait reduced motion and actual lamp assembly/departure.
Model and browser checks passed for timing, action gating, pause, replay/reset,
interrupted/missing audio, desktop/touch layout and adjacent-scene progression.
The existing ten-route geometry/camera and lamp-assembly checks also passed.

**Sound and implementation limits:** the roughly 1.6-second response is local
speech synthesis using the installed macOS Daniel voice at 185 words/minute,
filtered to 180–1800 Hz to suggest a closed door. It is not a recorded actor's
performance. Knocks are generated with brief noise transients and damped wood
resonances. The hand gesture is procedural. Controlled frame-rate comparison and
physical-device verification remain outstanding; passing automated checks does
not establish either. Voice type and emotional delivery can be refined separately.

**Review outcome:** the user completed the play-test successfully, reported that
the scene worked really well, and authorized the audit update, focused commit
and push to `codex/shepherd-story-rebuild`. **House 1 is accepted at this checkpoint.**
See [the accepted scene brief](story-rebuild/scenes/02-house-1.md). This acceptance
covers the reviewed scene, not the unfinished journey or a release. Merge into
`main` and deployment remain unauthorized.

## 13 September update — House 3 helpful sighting and visual continuity

**Decision: retain point 03 as a gentle, brief illustrated exchange following the
shared knock.** House 1's onward thought now suggests trying the neighbour's lit
house. At House 3 the resident reports seeing a couple with a donkey seeking
shelter and heading up the lane toward the gate. This remains authored connective
fiction; the resident does not inexplicably know the travellers' names.

Implemented in this checkpoint:

- Reused House 1's free-left-hand gesture, three synchronized door-ring effects
  and synthesized wooden knocks, fitting the approach and effect positions to
  House 3. Documented the [shared knocking interaction](story-rebuild/house-knocking.md).
  House 1's accepted refusal and temporary-light timing remain unchanged.
- Added three consistent images and four player-paced reading beats: footsteps,
  the shepherd's question, the resident's sighting and the gate direction. Speaker
  labels and persistent text make the exchange understandable without sound.
  House 3 remains lit and uses no new voice recording or 3D resident model.
- **Thank you** returns to the village view; **Go to the gate** explicitly starts
  the existing route to point 04. Pause, replay/reset and repeated-action guards
  remain functional. Image failure or timeout preserves the full text and offers
  retry without losing the reading position. Points 04–10 remain placeholders.
- Reworked the first image set after user review exposed continuity errors:
  added roof beams, a divided window, exposed-brick treatment, reversed handle,
  extra decorative props and a cartoon-like resident. The selected replacements
  use the actual knocking screenshot as the house reference and the original
  shepherd T-pose plus Follow the Light guide for natural character proportions.
- The revised illustrations preserve the plastered facade, undivided window and
  its timber lintel, beam-free parapet and left-side handle/right-jamb door opening.
  The resident is serious and attentive, with realistic proportions and plain
  linen clothing. Pots, plants and baskets are deferred until matching 3D dressing
  is deliberately added. First-pass art remains review evidence, not runtime input.

**Verification and evidence:** [initial implementation checks](../review/2026-09-13-house-3/README.md)
and [revised continuity captures](../review/2026-09-13-house-3/continuity/README.md)
record the House 1 → House 3 → gate walkthrough, hand/door alignment, manual
reading, explicit departure, pause/replay, silent portrait/reduced-motion play,
image failure/retry and unchanged gate placeholder. House 1 browser regression,
House 3 state checks, lamp assembly and ten-route geometry/camera checks passed.
The existing browser walkthrough passed again against the revised image set.
Selected local artwork and exact built-in ImageGen prompts are preserved in the
[prototype asset folder](../assets/house-3/README.md).

**Limits:** these are illustrated interpretations of the model, not animated
renders of its door. Browser captures use desktop and emulated mobile viewports;
physical-device validation and controlled performance comparison remain outstanding.
The rehearsal has not been added to the publication allowlist.

**Review outcome:** the user approved the gentle, brief exchange, requested the
continuity corrections, then judged the revision much better and authorized this
audit update, focused commit and branch push. **House 3 is accepted for this
checkpoint.** The unfinished journey and release remain unaccepted. All work stays
on `codex/shepherd-story-rebuild`; no merge to `main` or deployment is authorized.

## 14 September update — barred gate discovery and well detour

**Decision: let the player discover the obstruction by trying the gate, then give
the shepherd a clear reason to seek help near the well.** Point 04 initially says
**Timber gate** and offers **Open the gate**, withholding the barred-state reveal
until the attempt.

Implemented in this checkpoint:

- The shepherd steps closer with the lantern in his right hand and reaches with
  his free left hand. Two resisted tugs at 1.10 and 1.85 seconds synchronize small
  gate movements, warm contact cues and synthesized timber creak/stop sounds.
- At 2.8 seconds the thought reads, **“It’s barred from the other side. I can’t get
  through here.”** At 5.7 seconds it becomes **“I saw some houses near the well.
  Perhaps someone there can help.”** The explicit **Try the houses near the well**
  action starts the existing winding route to House 5. The gate stays closed and
  unlit; subsequent scene placeholders remain intact.
- Selected a gentle camera push during the attempt, returning to the following
  view. A well-facing camera trial framed an intervening house and lost the
  shepherd and obstacle, weakening orientation. The selected version lets the
  player initiate the turn through the village with the departure action.
- Separate gate state and presentation preserve the accepted house interactions.
  Repeated attempts and early departures are blocked. Pause/backgrounding freezes
  active time and suspends sound; replay/jump/reset reconstruct state and cancel
  interrupted sounds. Reduced motion removes the push, gate shake and expanding
  cue while preserving the reach and readable text. A paused gate-time review
  entry supports matched gesture captures.

**Verification and evidence:** [gate review and screenshots](../review/2026-09-14-barred-gate/README.md)
include incoming arrival, the staged tug, the next thought, narrow layout,
rejected camera trial and arrival at the preserved House 5 placeholder. Gate
state checks, the ten-point route geometry/camera walkthrough and existing House
1/House 3 state checks passed. Browser review covered the incoming leg, gate
interaction, reduced-motion completion and outgoing detour. The reach was adjusted
to keep the gate solid under the existing camera-occlusion treatment.

**Limits:** gesture and sound are procedural. Narrow-screen evidence is a desktop
browser viewport, not a physical-device or controlled performance certification.
The rehearsal remains outside the publication allowlist.

**Review outcome:** the user reported a successful play-test and authorized this
audit entry, focused commit and push to the feature branch. **Point 04 is accepted
at this checkpoint.** Points 05–10 remain placeholders; this does not accept the
unfinished journey or authorize release. All work remains on
`codex/shepherd-story-rebuild`; no merge to `main` or deployment.
