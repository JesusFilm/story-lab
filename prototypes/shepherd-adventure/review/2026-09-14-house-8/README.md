# House 8 — helpful advice about the empty stall

14 September 2026 · `codex/shepherd-story-rebuild` · **Accepted for checkpoint after user play-test**.
The user completed their play-test and authorized feature documentation updates,
a focused commit and remote push on the feature branch.
No merge or deployment. Other scene placeholders are preserved.

[Stage House 8](../../rehearsal.html?point=7) ·
[Replay the full incoming approach](../../rehearsal.html?point=7&replay) ·
[Scene brief](../../docs/story-rebuild/scenes/07-house-8.md) ·
[Artwork and exact ImageGen prompts](../../assets/house-8/README.md).
Local server: `python3 serve.py --port 8766` from this prototype.

## Implemented behavior

Knock on door uses the shared three strikes and free left hand, fitted to this
house's translated facade. The right hand retains the lantern. After stepping back,
a manual illustrated exchange shows the door opening and a friendly old man with
a staff. He has not seen the travellers and suggests the empty stall as a possible
resting place. Thank you shows the closed facade again. Return to the village
exposes Explore the empty stall; that action follows the existing curved corridor.
The gate remains closed at point 08 and its detailed scene stays a placeholder.

The diorama uses two still illustrations with cuts, including reuse of the exact
closed-door image for farewell. The 3D model has no new hinged door or resident.
There is no voice recording. Text, illustration alt text and speaker labels carry
the whole exchange without sound. The shared image failure/timeout and retry path
is retained; new runtime assets are loaded only on knocking.

## Captures

- [Arrival after the full incoming replay](arrival.png).
- [Paused first knock: free hand and door contact cue](knock.png).
- [Old man's advice](advice.png).
- [Door closed after Thank you](closed-again.png).
- [Explicit exploration action](explore-stall.png).
- [Arrival at the unchanged stall placeholder](stall-arrival.png).
- Phone-width [arrival](mobile-arrival.png) and [advice](mobile-advice.png).

Desktop captures use the app browser's default viewport. Phone-width captures use
390 × 844 emulation; this is not a physical-device test.

## Verification

- `node checks/verify-house-advice.mjs`: duplicate knock prevention, paused active
  time, held reading, return to anchor, no early or duplicate departure, closed
  gate at the stall, deterministic replay/jump/reset and prior-scene outcomes.
- `node checks/verify-house-sighting.mjs` and `verify-house-rejection.mjs`: pass.
- `node checks/verify-rehearsal.mjs`: full route progresses with the new required
  advice action; settlement/path checks pass; landscape and portrait camera
  samples report zero hidden-player samples. No scenery or corridor was changed.
- Browser: point 07 exposes Knock on door; full exchange, explicit departure and
  walk to point 08 passed. Full incoming replay ends at the correct knock action.
  Paused first strike shows hand/contact cue alignment; resume continues.
- Phone-width conversation: complete text and action visible; DOM checks report
  no page or dialogue overflow; pause disables advancement and retains page 3.
- House 3 browser regression: its own original closed-door cue and knock-to-dialogue
  still load correctly through the shared presenter. No observed browser error logs.
- Syntax check and `git diff --check`: pass.

Image-failure/retry code is inherited from the existing presenter and was inspected;
a fresh network-failure injection was not run in this review. No new performance
benchmark, hosted deployment-path test or sound-quality certification is claimed.

## Specific user walkthrough

1. Reload the staged link. Confirm Knock on door replaces Move to next point.
2. Knock: judge the three taps, hand contact and brief return to the standing point.
3. Compare the illustrated facade with the 3D front, especially plaster, undivided
   window, lintels, roofline and left-side ring / right-side door pivot.
4. Read the old man's advice. Judge his warmth, age, clothing and whether the
   proposed place to rest sounds like a credible helpful suggestion.
5. Choose Thank you: the closed facade appears. Return to the village: the shepherd
   waits until Explore the empty stall is chosen. Follow the route to point 08.
6. Review phone width, pause during the knock and while reading, and replay.

Keep/revise decision: **keep** after the user completed their play-test.
Accepted checkpoint: **Implement House 8 advice and consistent doorway art**.
This does not accept unfinished scenes or authorize merging/deployment.
