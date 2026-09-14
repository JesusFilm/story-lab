# Companion reunion — accepted checkpoint

15 September 2026 · `codex/shepherd-story-rebuild` · user play-test complete; accepted for checkpoint.
The user authorized the audit update, focused commit and feature-branch push.
No merge, deployment or new asset generation. Other scene placeholders remain.

## Open and review

The local server uses `python3 serve.py --port 8766` from this prototype.

- [Reunion only](http://127.0.0.1:8766/rehearsal.html?point=9&reunion)
- [Owner conversation, then reunion](http://127.0.0.1:8766/rehearsal.html?point=9)
- [Start at the empty stall](http://127.0.0.1:8766/rehearsal.html?point=8)

1. After **Thank you**, watch both companions approach from the House 3 lane,
   crossing the opened timber gate beside the lit lamp. Check that the direction
   matches the green route in the supplied map.
2. Watch the camera carry the arrival into the loose group at House 9. Judge
   the short pause, run-to-idle transition and feeling of relief.
3. Choose **Tell them what you learned**. The shepherd says **the couple**, turns
   toward the animal pen and gestures with his free hand. Take time to read.
4. **Continue** shows the invitation to see the child the angel told them about.
   Choose **Let’s go**. Watch the others run ahead; **Follow the others** appears
   when both have reached their waiting positions. Wait before following:
   they should remain visible, with no timer or disappearance.
5. Choose **Follow the others**. Check the camera handoff and spacing along the
   existing approach. Arrival remains the unfinished point 10 placeholder.
6. Pause during arrival and dialogue; resume. Repeat in portrait with Reduced
   motion selected in Review tools. Jump/replay/reset should clear the reunion.

## Text and historical continuity

[Exact scene wording](../../docs/story-rebuild/scenes/09-house-9.md) ·
[Standing continuity guide](../../docs/story-rebuild/biblical-and-historical-continuity.md).
Luke 2:10–12 describes an already-born Savior and the sign of the wrapped baby in
a manger. It does not give the shepherds the parents’ names. This invented
exchange uses **the couple** and **the child**. The owner's past-tense report
about impending birth at the earlier arrival remains intact. Existing costumes
and props were reused; they have not received a comprehensive historical audit.
The earlier donkey premise is recorded for a separate continuity pass.

## Captures

- [Before: House 9 without companions](00-before-house-9.png)
- [Gate crossing, final paused rehearsal pose](01-gate-crossing.png)
- [Gate crossing during the integrated walkthrough](01b-integrated-gate-crossing.png)
- [Gathering after the integrated arrival](02b-group.png)
- [Shepherd giving directions](02-directions.png)
- [Waiting ahead](03-waiting.png)
- [Portrait group](04-portrait-group.png)
- [Portrait waiting view](05-portrait-waiting.png)

The PNGs are real rendered canvas captures with the rehearsal banner. They do not
include the HTML dialogue panel. Text/layout was inspected in the live browser;
the exact wording is in the linked scene brief. The before image is the prior
House 9 implementation. The integrated run began from **staged point 08**, then
used the lighting, gate, House 9 walk and owner actions. It is not a complete
playthrough from point 01. The final gate pose runs the same state transitions
and animation mixers, then pauses; it is not evidence of a complete walkthrough.
The integrated/portrait captures precede the final companion-spacing refinement;
the House 9 framing, dialogue and waiting positions are unchanged.

## Verification

Passed:

- `node checks/verify-companion-reunion.mjs`: arrival/action gating, held reading,
  pause, waiting without leaving, rapid follow input, replay/reset, unnamed couple,
  and preserved point 10 placeholder. Both paths cross the measured gate centre.
  Sampled scenery clearance exceeds 1.18 m; loaded open-gate mesh clearance exceeds
  1.34 m. Onward sampling requires over 1 m from the player and over 1.4 m between
  companions, including slowing and their final stopping positions.
- `node checks/verify-house-owner.mjs`, `verify-empty-stall.mjs` and
  `verify-house-advice.mjs`: owner and adjacent-scene state regressions pass.
- `REHEARSAL_REVIEW_OUTPUT=../review/2026-09-15-companion-reunion/ node checks/verify-rehearsal.mjs`:
  complete route/state checks, preserved model placements and route clearance,
  running/walking sequence, replay/reset, and sampled landscape/portrait follow
  camera visibility pass. [Geometry/state](geometry-and-state.json) ·
  [Camera samples](camera-samples.json).
- Native browser review: actual point 08 actions through the House 9 owner and
  reunion; held directions; pause/resume in the arrival; waiting and follow;
  portrait/reduced-motion exchange and waiting view; onward route to the point 10
  placeholder. No browser warning/error entries in the inspected local run.
- Modified runtime modules and the maintained House 9 browser regression script
  pass syntax checks; `git diff --check` passes. The standalone House 9 browser
  script was updated for the reunion handoff but was not executed in this run.

These are functional and sampled geometry checks, not creative acceptance,
physical-device testing or a new performance benchmark. Companion-load failure
uses the existing loader/reload behavior; failure injection was not repeated.
Detailed final grouping and the ending still require the point 10 review.


## User acceptance

The user completed play-testing and authorized committing this work together with
its feature audit update, then pushing the current feature branch. Point 09b is
accepted at this checkpoint; point 10 remains unfinished.
[Audit entry](../../docs/navigation-direction-retrospective-2026-09-13.md#15-september-update--companion-reunion-and-biblical-continuity).
No merge or deployment is authorized.
