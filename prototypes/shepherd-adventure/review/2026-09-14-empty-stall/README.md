# Point 08 — Empty stall review draft

14 September 2026 · `codex/shepherd-story-rebuild` · user play-test completed; accepted for checkpoint.

Run `python3 serve.py --port 8766` in the prototype directory.
[Direct review](http://127.0.0.1:8766/rehearsal.html?point=8) ·
[Incoming walk from House 8](http://127.0.0.1:8766/rehearsal.html?point=8&replay).

## Targeted review

1. Let the short empty-stall search finish. Check that no people or trail are
   suggested and that discovering the gate feels useful.
2. Choose **Light the lantern**. Watch the approach, hand-held lamp lift and
   return to idle. The fixture should illuminate before **Open the gate** appears.
3. Open the gate. Listen for timber, watch the free-hand reach, step back and
   swing. Pause partway through and resume; the action must not skip ahead.
4. Read “What else can we try?” and watch the view settle on lit House 9. Wait
   before choosing **Go to the house**; then follow the full walk to its placeholder.
5. Replay point 08: the gate should start closed and dark. Jump to point 09:
   it should be open and lit. Restart restores the initial outcomes.
6. Repeat in portrait and with Reduced motion. Buttons should remain readable;
   the House 9 view should identify the same destination without a camera sweep.

## Captures

Search, lantern and open-gate images are paused, staged poses. The two House 9
images were captured after live action sequences (landscape incoming replay and
portrait reduced-motion review). None implies user creative acceptance.

- [Empty stall](empty-stall-search.png)
- [Lantern reach](lantern-contact.png)
- [Open gate](gate-open.png)
- [House 9 reveal](house-9-reveal.png)
- [Portrait lantern](portrait-lantern.png)
- [Portrait House 9, reduced-motion live sequence](portrait-house-9.png)

Review poses use `?point=8&stall-pose=search|contact|open|house`. The normal entry has
no `stall-pose` parameter. Model gesture quality needs the user's in-motion review;
still captures cannot establish contact timing or sound quality.

## Verification

- `node checks/verify-empty-stall.mjs`: ordered/duplicate actions, delayed lighting
  and opening, pause, route lock, House 9 arrival, replay, staged outcomes, reset;
  sampled close-approach wall clearance at least 0.468 m.
- `node checks/verify-barred-gate.mjs`: earlier failed gate attempt and detour pass.
- `node checks/verify-house-advice.mjs`: House 8 progression/replay/reset pass.
- `node checks/verify-rehearsal.mjs`: full route progression, running/walking,
  unchanged building centres/rotations, route clearance and landscape/portrait
  following-camera geometry pass. [Geometry/state](geometry-and-state.json) ·
  [Camera samples](camera-samples.json). These following-camera samples do not
  certify the new authored reveal camera.
- Browser review at 1280×720 and 390×844: both explicit gate actions, reveal,
  House 9 arrival and reduced-motion progression checked. Incoming route replay
  reviewed separately. No physical-device or performance certification claimed.

The fixed gate lamp retains its original height, with a softer rehearsal light
intensity. No new assets, footprints or people were added. The shared timber sound
was extracted without changing point 04's timing. Other scene placeholders remain.
The user subsequently completed play-testing and authorized the audit update,
focused commit and feature-branch push. Point 08 is accepted for this checkpoint;
no merge or deployment is authorized.
