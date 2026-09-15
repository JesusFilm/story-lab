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

## 14 September update — House 5 silence and readable tracks

**Decision: shift the search from asking residents to observing the ground.**
The user directed two attempts at the dark house, an unanswered thought, an
explicit inspection near the well, and human/animal tracks leading past the
market stalls. The user approved steady gold outlines and a gentle downward
camera move for discovery.

Implemented in this checkpoint:

- **Knock on door** reuses the established free-hand gesture and wooden sound.
  Three strikes are followed by a short silent wait and three more automatic
  strikes. At 7.2 active seconds, **“No one is answering.”** and **Look around**
  appear. The house stays dark, with no resident or reply.
- The shepherd returns from the door and walks a short arc beside the well.
  Human sandal soles and rounded donkey hoofprints are visible on the ground
  before discovery. On spotting them, steady gold outlines reveal their route
  past the market stalls toward the animal pen.
- The discovery thought describes the marks and their direction without claiming
  who made them. **Follow the tracks** explicitly starts a continuous departure
  into the existing route. Point 06 and subsequent placeholders are preserved.
- A browser pass exposed camera collision during the door approach. Holding the
  arrival framing through the knock corrected the view. The inspection resumes
  the following camera; discovery gently reframes the ground. Reduced motion
  cuts to that view and retains fixed knock cues.
- Scene state gates repeated actions and early departure. Pause freezes active
  timing and inspection movement; replay/jump/reset reconstruct scene state.
  No new assets, fixed lights or publication entries were required.

**Verification and evidence:** [House 5 review and captures](../review/2026-09-14-house-5/README.md)
include arrival, knocking, silence, the well inspection and desktop/portrait trail
views. State tests cover action gating, pause, continuous departure, point 06,
and replay/reset. Existing House 1 and gate state regressions passed. The full
route check passed with unchanged settlement transforms and lights, sampled
clearance for the new inspection/departure corridors, and landscape/portrait
camera samples. Chrome walkthroughs at 1280×720 and 390×844 (reduced motion)
verified six knock events, paused inspection, discovery and point-06 arrival,
with zero page errors. Diff whitespace checks passed.

**Limits:** these are staged browser walkthroughs and sampled geometry checks,
not physical-device performance certification or an audio listening assessment.
The rehearsal remains outside the publication allowlist.

**Review outcome:** after delivery of the playable draft, the user authorized
this audit update, focused commit and feature-branch push. This records an
implementation checkpoint; no explicit creative acceptance or successful user
play-test was reported. House 5 remains ready for user review. The unfinished
journey and release remain unaccepted. All work stays on
`codex/shepherd-story-rebuild`; no merge to `main` or deployment is authorized.

## 14 September update — Animal pen and continuing tracks

**Decision: a quiet observation redirects the search toward the houses.**
The user approved an automatic observation at the closed animal pen and the
**Follow the tracks** action. The thought reads: “No one seems awake here. The
tracks pass the pen and lead back toward the houses.” The entrance stays closed;
the visible trail continues outside it without implying the gate proves nobody
entered earlier.

Existing sandal and donkey hoof marks extend along the established House 8
corridor. Both the marks and their steady gold outlines gradually fade on the
firmer residential path, ending before the doorway approach. A gentle arrival
reframe includes the pen and returning trail; portrait framing pulls farther back
after browser review exposed cropping. House 8 and later placeholders remain
unchanged. No new assets, lights, route changes or publication entries were needed.

**Verification:** [scene review and capture](../review/2026-09-14-animal-pen/README.md).
House 5 state/regression and full route geometry/camera checks passed, as did
syntax and diff checks. Browser review confirmed the observation, departure to
House 8 with its placeholder preserved, a track-free doorway and adjusted
390×844 portrait framing. The route camera samples do not certify the new
observation camera; physical-device performance was not measured.

**Review outcome:** the user reported their play-test done and authorized the
feature audit update, commit and remote push. **Point 06 is accepted at this
checkpoint.** This does not accept other unfinished scenes or authorize release.
All work remains on `codex/shepherd-story-rebuild`; no merge to main or deployment.


## 14 September update — House 8 helpful advice and doorway continuity

**Decision: a friendly resident offers a plausible place to look.** The user
requested the House 3 knock/diorama pattern at House 8, followed by a closed door
and an explicit action to explore the nearby empty stall. They emphasized matching
the actual facade before generating artwork and matching the original shepherd's
character style. The new resident is an old man with grey hair and beard, layered
robes, a wooden staff and a warm, restrained expression.

Point 07 now offers **Knock on door**, using the shared free-left-hand gesture and
three wooden strikes fitted to House 8. The illustration shows the door opening.
The shepherd asks about a couple travelling with a donkey. The old man replies:
“I haven’t seen them, friend. But there’s an empty stall beside the gate. They
might have stopped there to rest.” **Thank you** shows the closed facade;
**Return to the village** exposes **Explore the empty stall**. Departure follows
the unchanged curved route around House 7. Point 08's search/gate scene and later
placeholders remain unchanged; arriving at the stall does not open the gate.

Built-in ImageGen produced full-body and portrait character references and two
matching doorway images. The actual House 8 screenshot anchors plaster patches,
stone corners, undivided left window, timber lintels and flat parapet. The left-side
ring and right-side door pivot remain the intended continuity contract. Reusing the
closed frame for farewell avoids facade drift. The diorama uses still-image cuts;
no new animated 3D door or resident was introduced. Text is instant and player-paced,
with no voice recording; the shared image fallback/retry behavior is retained.

**Verification:** [House 8 review and screenshots](../review/2026-09-14-house-8/README.md).
New state checks cover duplicate actions, pause, held reading, return to anchor,
explicit departure, closed gate and deterministic replay/jump/reset. House 1 and
House 3 state regressions pass. Full route geometry/camera checks pass, with zero
hidden-player samples in landscape/portrait. Browser review verified the full
incoming approach, knock contact, advice, farewell, explicit stall walk and phone-width
text/buttons without overflow. House 3's original cue still loads through the shared
presenter. Syntax and diff checks pass. Network-failure injection and a new
performance benchmark were not run; phone-width emulation is not a physical-device test.

**Review outcome:** the user completed their play-test and authorized updating the
feature docs, committing and pushing the feature branch. **Point 07 is accepted at
this checkpoint.** This does not accept the other unfinished scenes or authorize
release. All work remains on `codex/shepherd-story-rebuild`; no merge to main or
deployment is authorized. The publication allowlist is unchanged.


## 14 September update — Empty stall, open gate and House 9 reveal

**Decision: a dead end still offers a way to help the others.** The user directed
an empty stall with neither people nor footprints, followed by lighting the gate
lantern and opening the gate for the other shepherds. This explicitly supersedes
the earlier instruction to keep the gate fixture dark after opening. The gate
remains dark and closed during the earlier point 04 encounter.

Point 08 begins with a short automatic search: “No footprints. No one here.”
The shepherd notices the gate and thinks of the others. **Light the lantern**
approaches the fixture, raises the carried lamp using its hand attachment, lights
the fixture, and returns to idle. **Open the gate** uses a free-hand reach and the
shared timber sound; the shepherd steps back as the gate swings open. “What else
can we try?” accompanies a look around, followed by a camera move toward lit
House 9: “Perhaps they have an answer.” **Go to the house** starts the existing
route. House 9's owner conversation and reunion remain separate unfinished work.

The two gate actions cannot be skipped or repeated during their gestures. Pause
freezes progress, while replay/jump/reset reconstruct dark/closed or lit/open
outcomes. Reduced motion provides the same destination view without the camera
sweep. The lamp's original height and existing settlement transforms are retained;
the new light is softer in the rehearsal. No new assets or publication entries
were added. The close approach was adjusted for wall clearance, and portrait
framing was widened to include the gate and shepherd.

**Verification:** [review notes and screenshots](../review/2026-09-14-empty-stall/README.md).
Point 08 checks cover action order, duplicate input, delayed outcomes, pause,
route locking, House 9 arrival, staged outcomes, replay and reset. Sampled action
clearance from the wall is at least 0.468 m. Earlier barred-gate and House 8 checks
pass, as do the full route state, geometry and following-camera checks. Browser
review covered the incoming walk, both actions, reveal and House 9 arrival, plus
portrait and reduced-motion behavior, with no recorded browser errors. These
checks do not constitute physical-device performance certification or certify
sound quality; the new authored reveal is assessed through browser/user review,
not the generic following-camera samples.

**Review outcome:** the user reported their play-testing complete and authorized
this audit update, a focused feature-branch commit and remote push. **Point 08 is
accepted at this checkpoint.** Points 09–10 remain placeholders. This does not
accept other unfinished scenes or authorize release. All work remains on
`codex/shepherd-story-rebuild`; no merge to main or deployment is authorized.

## 14 September update — House 9 shelter owner and directions

**Decision: the owner gives a practical account of the shelter he offered.**
The user directed a middle-aged, shorter, fuller man with a large beard,
colorful robes and a coordinated headwrap. His tone is matter-of-fact; he
explains that the woman was about to give birth when the couple came to him.

Point 09a now offers **Knock on the door**, with the shared three knocks and
free-left-hand gesture fitted to House 9's east-facing facade. Four player-paced
dialogue cues ask about the couple and donkey, confirm the impending birth,
establish his ownership of the large animal pen and explain that he offered
the stall at its far end because his house had no room. **Thank you** returns
to the village, where **Go to the Nativity Scene** remains an explicit temporary
onward action. The companion reunion/cutscene and detailed ending remain unfinished.

Built-in ImageGen produced the owner reference and three matching doorway
illustrations: opening, explaining with an open hand, and pointing to his left.
That is image-right in the frontal view and agrees with the existing onward
route. The actual house screenshot anchors its plaster patches, stone corners,
flat parapet, undivided windows, timber lintels and door placement. The ring
stays on the door's free left edge and the illustrated door opens inward at
the viewer-right jamb. Gestures use illustrated cuts; the 3D door remains
static. The house stays lit, and no new voice recording was added.

**Verification:** [House 9 walkthrough and screenshots](../review/2026-09-14-house-9/README.md).
State checks cover repeated input, approach direction, pause, held reading,
explicit departure, staged outcomes and replay/reset. House 8 and empty-stall
regressions pass. Full route state, geometry, fixed lights and landscape/portrait
follow-camera samples pass. Browser review covers the incoming walk, knock
contact, all dialogue, pause, onward route, preserved Nativity placeholder,
House 8 shared presentation, interruption/replay, silent portrait/reduced-motion
play and image failure/retry retaining reading position, with no page errors.
Syntax and diff checks pass. No new performance benchmark or physical-device
certification is claimed.

**Review outcome:** the user reported play-testing good and authorized the audit
update, focused feature-branch commit and remote push. **Point 09a is accepted
at this checkpoint.** Point 09b and point 10 remain placeholders. All work
remains on `codex/shepherd-story-rebuild`; no merge to main or deployment is
authorized. The publication allowlist is unchanged.


## 15 September update — Companion reunion and biblical continuity

**Decision: the opened way brings the shepherds together.** The user chose a
brief relieved gathering at House 9, followed by renewed urgency and an explicit
follow choice. The supplied green route establishes the House 1 / House 3 side
of the timber gate as the companions' approach, replacing the former west-side
cinematic direction.

After the owner's **Thank you**, the camera looks back toward the opened, lit
gate. Both existing companion characters approach in the lane, cross the actual
opening and gather beside the main shepherd at House 9. **Tell them what you
learned** shares the owner's directions. The main shepherd turns and gestures
toward the animal pen; a further invitation recalls the angel's message.
**Let’s go** sends the companions ahead. Once both reach visible waiting
positions, **Follow the others** lets the player depart. Waiting has no penalty;
pause, replay, staged review and reset remain supported. The companions maintain
spacing as they slow and stop clear of the player's final walking path. Point 10
retains its unfinished scene/ending handoff.

**Textual continuity:** the user asked whether the shepherds could know the names
Mary and Joseph. Luke 2:10–12 records an already-born Savior and the sign of the
wrapped baby in a manger, without giving parental names. The new dialogue uses
**the couple** and **the child the angel told us about**. The owner's earlier
past-tense report of impending birth remains unchanged. The prototype instructions
now require biblical continuity and historical-plausibility checks for character
knowledge, chronology, clothing, props and environment details. The linked
[continuity guide](story-rebuild/biblical-and-historical-continuity.md) distinguishes
scriptural evidence from invented connective storytelling and records the earlier
unestablished donkey premise for a separate review. Existing assets were reused;
this work does not certify their historical accuracy.

**Verification:** [reunion review, captures and checks](../review/2026-09-15-companion-reunion/README.md).
State checks cover arrival/action gating, held reading, pause, waiting, rapid input,
replay/reset and the preserved ending placeholder. Both companion paths cross the
measured timber-gate centre, with more than 1.34 m clearance from loaded open-gate
mesh hulls. Onward samples maintain over 1 m from the player and over 1.4 m between
companions. House 9 owner, empty-stall and House 8 state regressions pass. Full
route checks preserve settlement placements, route clearance and sampled following
camera visibility in landscape/portrait. Browser review covered the point 08
lighting/opening actions through House 9 and reunion, plus portrait/reduced-motion
reading and waiting, and the final follow handoff. Captures distinguish staged
poses from the integrated walkthrough. Syntax and whitespace checks pass; no new
performance benchmark or physical-device certification is claimed.

**Review outcome:** the user completed play-testing and explicitly authorized
this audit update, a focused commit and remote feature-branch push. **Point 09b is
accepted at this checkpoint.** This does not accept the unfinished point 10 scene
or authorize release. All work remains on `codex/shepherd-story-rebuild`; no merge
to main or deployment is authorized. The publication allowlist is unchanged.


## 15 September update — Nativity approach pacing

**Decision: run past the sheep, then approach the shelter quietly.** The user
reported that the long final route felt slow: companions played running clips
while travelling at walking speed, and the player walked most of the enclosure.
All three now run along the long path at the existing 4.6 m/s target speed.
The player settles into walking for only the final eight metres near the shelter.
Both companion models have idle/run clips only, so the approved fallback lets
them run ahead to their existing stopping positions and wait for the player.
This supersedes the earlier sustained quiet walk through the sheep enclosure.

The route, camera, dialogue, assets and other scenes remain unchanged. The rebuild
still ends at its disabled **Route complete** placeholder. Recognition, an active
Nativity interaction and the ending remain separate user-directed follow-up work.
This movement change adds no character knowledge or scriptural claims.

**Verification:** [approach walkthrough, screenshots and checks](../review/2026-09-15-nativity-approach/README.md).
Companion regression checks cover running speeds past the sheep, the final walking
transition, spacing, pause, action gating, replay/reset and the preserved ending
placeholder. The leg completes in 13.2 simulated seconds with 50 ms steps; this is
not a device performance benchmark. Full route/state/geometry checks and sampled
landscape/portrait cameras pass. Browser review confirms the run and walk poses,
companions waiting ahead, pause/resume and the unchanged arrival placeholder;
no warning/error entries were observed. Screenshots are current captures from a
walkthrough beginning at staged point 09, not a complete game playthrough.

**Review outcome:** the user accepted this approach change and explicitly requested
an audit update, focused commit and remote feature-branch push. **Point 10 approach
pacing is accepted at this checkpoint; recognition and ending remain unfinished.**
All work remains on `codex/shepherd-story-rebuild`. No merge to main or deployment
is authorized. The publication allowlist remains unchanged.


## 15 September update — full story integration and scenery checkpoint

**Decision:** complete the playable story around the rebuilt village, then keep
iterating on models and decoration before release. The user accepted this session's
checkpoint and authorized a commit and push to `codex/shepherd-story-rebuild`.
This supersedes the pending integration/ending status in earlier audit entries.

- Restored compact player actions while preserving the separate scene rehearsal.
- Reconnected the opening scripture diorama, running introduction and player
  handoff; nativity arrival triggers the full ending and scripture sequence.
  Completion can restart the experience from the opening.
- Preserved the previously completed scene progression and lantern hand attachment.
- Added a House 8 pullback showing the shepherd and empty stall together. It holds
  for **Go to the stall**, then blends into the following camera on departure.
- Corrected the workbench's baked tilt, then lowered it 47 cm after user feedback
  identified floating feet. Tabletop items and hanging light follow the correction.
- Removed the obsolete trough/block props at the village pen and both tall
  shelter-screen walls. The footprint trail and pen remain.
- Restored the debug inspector for the rebuilt runtime, including workbench side,
  approach and village-pen presets for direct visual inspection.

**Verification:** the real desktop playthrough completed the opening, all ten
stops, ending scriptures and restart. Targeted scene/state checks passed; follow-up
browser review covered House 8 framing, pause, departure and arrival, workbench
side/approach views and the cleared pen surroundings. No browser warnings/errors
were observed in the final inspector review. See the
[full-flow verification record](../review/2026-09-15-full-flow/README.md).
No new performance benchmark, physical-device certification or hosted release
validation is claimed.

**Next:** model and decorative work, directed individually by the user, continues
on this same feature branch. Performance is deferred to a separate session.
Publication validation and explicit release approval remain outstanding. Do not
merge to main or deploy this checkpoint.
