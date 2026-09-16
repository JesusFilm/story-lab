# House 9 owner — review draft

14 September 2026 · `codex/shepherd-story-rebuild` · user play-test complete; accepted for checkpoint.
Audit update, focused commit and feature-branch push authorized; release remains pending.

Run `python3 serve.py --port 8766` from the prototype directory.
[Start at House 9](http://127.0.0.1:8766/rehearsal.html?point=9) ·
[Replay the incoming walk](http://127.0.0.1:8766/rehearsal.html?point=9&replay) ·
[Full preceding scene](http://127.0.0.1:8766/rehearsal.html?point=8).

## Targeted user walkthrough

1. Compare the real house with the illustrated doorway. Check the flat parapet,
   window positions, timber lintels, plaster patches, corner stones and door ring.
2. Choose **Knock on the door**. Check the three knocks, free-hand contact and
   step back. Pause during the knock, then continue.
3. Advance the four dialogue cues. Judge the owner's matter-of-fact tone,
   fuller stature, colorful clothing and gesture changes. His account explains
   the woman was about to give birth and why he offered the stall.
4. On the last frame, check his directions and pointing pose. He points to his
   own left, which is image-right in the frontal view, matching the onward path.
   The full house remains unmirrored. Gestures change in illustrated cuts;
   there is no continuous hand or door animation in these images.
5. Choose **Thank you**. Wait: the shepherd must stay put with **Go to the
   Nativity Scene** available. That temporary action walks the existing final
   route; the companion cutscene and detailed ending remain for later work.
6. Replay the approach and repeat in portrait/reduced motion. Text and controls
   should remain readable; the conversation should start fresh.

## Captures

- [Before: original route placeholder](00-before.png)
- [After: arrived from the preceding scene](01-arrival.png)
- [Knock, paused during the live interaction](02-knock.png)
- [Door opens / shepherd's question](03-question.png)
- [Owner: impending birth](04-owner-labor.png)
- [Owner: shelter offered](05-owner-shelter.png)
- [Final pointing pose](06-pointing.png)
- [Temporary onward action](07-onward.png)
- [Preserved Nativity placeholder](08-nativity-placeholder.png)
- [Portrait arrival](09-mobile-arrival.png)
- [Portrait pointing cue, reduced motion](10-mobile-pointing.png)
- [Text fallback with images blocked](11-image-fallback.png)

The before image uses the former arrival framing. The new door-facing focus
slightly changes that view. Landscape interaction captures follow the actual
incoming walk from point 08's staged completed reveal; this is not a complete
point 08 playthrough. Portrait/failure captures use direct staged House 9 entry.

## Verification

- `node checks/verify-house-owner.mjs`: action gating, duplicate activation,
  east-facing door approach, pause, player-paced reading, explicit departure,
  completion, staged prior outcomes, replay and reset pass.
- `node checks/verify-house-advice.mjs` and `node checks/verify-empty-stall.mjs`:
  adjacent scene state checks pass; the established gate clearance check passes.
- `node checks/verify-house-owner-browser.mjs`: incoming walk, three knocks,
  knock/dialogue pause, all text cues, explicit onward action, preserved ending
  placeholder, House 8 shared-presenter regression, interruption/replay, portrait
  touch with sound unavailable and reduced motion, image failure/retry retaining
  reading position pass. No page errors were recorded. Uses `PLAYWRIGHT_MODULE`
  when Playwright is supplied outside local module resolution; preview defaults
  to port 8766, configurable with `WATCH_GAME_TEST_ORIGIN`.
- `REHEARSAL_REVIEW_OUTPUT=../review/2026-09-14-house-9/ node checks/verify-rehearsal.mjs`:
  full route state, run/walk sequence, unchanged model centres/rotations/bounds,
  fixed-light inventory, route clearance and landscape/portrait follow-camera
  samples pass. [Geometry/state](geometry-and-state.json) ·
  [Camera samples](camera-samples.json). These are sampled checks, not a
  performance benchmark or a physical-device certification.
- Modified runtime modules pass syntax checks and the diff has no whitespace errors.

[Scene and exact dialogue](../../docs/story-rebuild/scenes/09-house-9.md) ·
[Saved artwork and complete prompt set](../../assets/house-9/README.md).
Built-in ImageGen produced the owner reference and three runtime PNGs. Only the
three doorway images preload when knocking begins. The shared eight-second
image timeout, full-text fallback and retry remain available.

All changes remain on the feature branch. Other scene placeholders are preserved;
no merge or deployment was performed. The user completed play-testing, accepted the scene, and authorized the audit
update, focused commit and feature-branch push.
