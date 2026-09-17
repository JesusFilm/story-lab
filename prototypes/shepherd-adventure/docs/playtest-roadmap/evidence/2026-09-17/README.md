# Baseline evidence — 17 September 2026

Source `c42b500be64f66fd6ca99bae4e7bbeedb7f162a7`, branch `main`, initially clean.
Captured in Codex's in-app Chromium browser at **1280 × 720 CSS pixels** with the
local prototype server. The browser returned JPEG captures: E01–E04 are 1280 × 720; E05 is 1265 × 712
(the map capture excludes the browser scrollbar area). Browser version, device pixel ratio
and hardware were not recorded; this is not the participant's reproduced setup.
This browser received no explicit reduced-motion override. No simulation/visual
clock freeze was applied. Frames are illustrative baselines, not deterministic
pixel-comparison targets or motion/performance measurements.

The opening, staged House 8 and the existing route map were visually inspected. No audio recording
was supplied or made; sound was not assessed by listening. No full-route
performance recording or participant replay was made. Source findings identify
possible mechanisms and current behavior, not a measured root cause for freezes.

[Annotated comparison board](annotations.html) · [House 2 annotation](companion-search.html) · [Roadmap](../../README.md)

| Evidence | File | Scenario / capture recipe | What it establishes |
| --- | --- | --- | --- |
| E01 | [Opening](01-opening.jpg) | `/`, wait for first scripture preview; before Start | Current lower reading panel, art focus and available Start/Sound/Skip controls. Not musical transition quality. |
| E02 | [House 8 arrival](02-house-8-arrival.jpg) | `/rehearsal.html?point=7`, wait until Knock on door enabled; before interaction | Visible third-person shepherd and actual 3D doorway. The lower-left panel is rehearsal UI, not the normal game's compact panel. |
| E03 | [House 8 advice](03-house-8-advice.jpg) | Knock → wait → Ask about the travellers → Continue; page 3/4 | Separate illustrated composition, no shepherd in the illustration, lower text area and Thank you control before closing. |
| E04 | [House 8 closed door](04-house-8-closed.jpg) | From E03 select Thank you; page 4/4 | Closed-door image, farewell text and Return to the village. House 8 subsequently confirmed as the confusing example; button order does not establish coherent visual/reading timing. |
| E05 | [Entrance map](05-entrance-map.jpg) | Open `/map/rehearsal-map.svg`; scroll to the village entrance | The unused first entrance-right house is House 2; corroborated by layout X=11/Z=19. Map evidence identifies the location, not a proposed companion path or in-game camera visibility. |

House presenter/art are shared by rehearsal and the normal entry. The normal
entry's approach HUD and complete transition sequence still require their own
matched captures before accepting a fix. Raw screenshots contain no annotations;
the board adds observation markers using HTML/CSS without changing raw evidence.
`annotated-overview.jpg` is the earlier board export, before the House 8 follow-up
was resolved. The linked HTML board and visual roadmap carry the updated captions;
use them for current direction. The old export is retained as historical evidence.

## Source observations

- `src/journey-story.mjs`: `close()` destroys the player then releases media.
  `vendor/story-diorama/story-diorama.mjs`: `stop()` pauses voices immediately.
  The player supports cue fades, but those do not establish a fade through close.
- `src/house-sighting-scene.mjs`: `transition:'cut', transitionMs:0`; image
  preparation begins when a house interaction has started; House 8 Thank you is
  on page index 2 and the closed-door farewell is index 3.
- `src/house-scene.mjs`: asynchronous voice loading/decoding begins independently
  of the knock clock. The 3.3 s voice attempt is recorded as played without waiting
  for `voiceBuffer`. This is a plausible race, not a reproduced failure.
- `src/village-game.mjs`: raw walking intervals are sampled; simulation time is
  capped. Samples are useful for investigation, not current performance evidence.
- `src/journey-model.mjs`, `openingActors()`, and `src/companion-reunion.mjs`:
  distinct authored offsets/path rules exist. They do not identify the moment
  described by the participant.

## Evidence gaps to close

House 1 audible reproduction; full-route engine/camera trace (freezes reported on
M1 and M4 Macs); actual loader transition recording and lower-end resource budget;
companion search staging; narrow-screen baseline; normal-speed all-house flow
review and the two House 8 handoff experiments; visual references for art-quality
work and recordings of well/turn/gate motion. House 8, loader style/swaps and audio
direction are now clarified in D014–D019. Browser versions are not an investigation
gate. Original captures remain unchanged; later planning decisions do not turn
them into proof of implemented improvements.
