# Shepherd companions and cutscene direction

Requested 12 September 2026. Baseline: main before branch
`codex/shepherd-companions-cutscenes`. This document records the requested change;
implementation and validation status are recorded separately below.

## Characters

Replace the two supporting shepherd stand-ins with two new Tripo characters
matching the supporting shepherds in the opening diorama artwork. They must be
distinct from the playable shepherd. Each requires idle and running animations.
Use the current [Follow the Light guide](../../../styles/follow-the-light/README.md).
The departure illustration identifies a taller companion on the left in a dark
brown mantle and beige headcloth, and a shorter companion on the right with a
reddish brown cap, beige wrap and brown mantle. The central fleece-vest shepherd
is the playable character. Isolated generation references omit handheld staffs
to keep hands and limbs suitable for animation.

## Scene 1: after the opening diorama

**Current:** The camera travels from a distant position toward the stationary
main shepherd, then yields to player control.

**Requested:** Begin far from the settlement. Reveal the two new shepherds
running along the approach path toward it. Move the camera past them, revealing
the main shepherd running ahead near the settlement. Close in on the main
shepherd and end the cutscene when the camera reaches him. Keep trees out of
the camera corridor and path, with trees and boulders dressing the sides.

## Scene 2: opening the gate

**Current:** At the lamp on the hidden rear path, the main shepherd walks to the
locked gate, lights its lamp and opens it. He returns to the post before a
cutscene shows two shepherds arriving from screen right.

**Requested:** Use the new shepherd models. Bring them from left-center along
the path connected to the settlement entrance and lamp-assembly area. Keep the
main shepherd at the gate after lighting and opening it, watching them run past.
Then present one option, **“follow the others”**. Selecting it makes the main
shepherd run all the way to the final point of interest where baby Jesus is.

## Acceptance checks

- Both distinct models have usable idle and running clips, with intact skinning.
- Opening shows the companions before passing them and reaching the running lead.
- Camera and running path remain clear; side trees and boulders remain visible.
- Gate lighting/opening precede the companions passing the player at the gate.
- No return-to-post movement or teleport occurs before the gate cutscene.
- Exactly one onward choice runs continuously to the shelter and ending.
- Skip, pause, restart, reduced motion, loading failures and independent static
  deployment remain functional.
- Preserve references and original models in the library; runtime copies belong
  to this prototype. Update source records and explicit portal publication inputs.

## Implementation status

Implemented on `codex/shepherd-companions-cutscenes`.

- Two separate Tripo source models, rigs and animated exports retained in the
  library. Independent runtime copies contain idle/run clips, at 1.78 m and
  1.66 m tall. Non-destructive runtime preparation corrects facing, scale and
  the run clips' constant vertical offset.
- Ten-second opening shows both companions behind the running lead and passes
  them before meeting the gameplay camera. Skip lands at the same endpoint.
- Gate sequence has approach, light and watch stages; the return stage is removed.
  Companions run on the entrance/olive-court/market route through the open gate.
  The camera looks from the opposite side so their approach is from the left;
  portrait framing raises the camera. The player stays beside the gate.
- One “follow the others” route starts at that exact position and runs to the
  shelter. Companions continue ahead while the choice is available.
- Added side trees/boulders, cleared the extended approach, updated the map,
  source records and explicit portal model/reference/prompt entries.

## Validation and limits

Passed: `verify-companion-scenes.mjs`, `verify-companion-models.mjs`,
`verify-journey.mjs`, `verify-presentation.mjs`, `verify-animation-transitions.mjs`,
`verify-journey-poi.mjs`, `verify-journey-camera.mjs` and
`verify-settlement-stalls.mjs`. The gameplay camera check covered 59,888 frames
with zero hidden-player-chest frames.
The model check samples 48 poses per companion across both clips and checks
skinning, dimensions, foot contact, playback switching and pause. Blender renders
show front/back and four phases of each animation. Camera projection and real
scene geometry were inspected headlessly. Local HTTP geometry/model loading passes.
The portal build and validation pass: 232 public files, dependency and sensitive-
content checks under `/`, `/story-lab/` and `/story-lab-demos/`.

`verify-nature-assets.mjs` fails on an existing `Bark_DeadTree.png` provenance hash
mismatch; the actual texture hash matches the baseline commit. This update does
not change that texture or its provenance. This is a pre-existing check failure.

No new browser or physical-device playtest has been performed. Headless checks do
not establish final screen composition, cold-load/retry interaction, perceived
animation quality or mobile performance. Garments use skeletal deformation rather
than cloth simulation. The final shelter retains the existing baby stand-in.
No merge or deployment has been performed.
