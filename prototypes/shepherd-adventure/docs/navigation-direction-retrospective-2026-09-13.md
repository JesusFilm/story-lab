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
