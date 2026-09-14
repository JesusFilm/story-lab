# Shared house-knocking interaction

13 September 2026 · Baseline: accepted House 1 interaction.

Houses 3 and 8 reuse this interaction. The resident's response is a separate scene
beat; it must not change the established knock rhythm.

- Offer one **Knock on door** action at the house's standing point. Disable
  repeated activation while the interaction runs.
- Step toward the door over 0.55 seconds. Keep the lantern in the right hand;
  raise the free left hand between 0.55 and 2.00 seconds, with three short strikes.
- Strike at 0.85, 1.20 and 1.55 seconds after activation. Synchronize the shepherd's
  hand, one small warm ring on the door and one wooden knock at each strike.
- Each ring lasts 0.30 seconds. Reduced motion uses a fixed-size cue instead of
  an expanding ring. Retain the essential reach and step.
- Reuse the existing synthesized wooden sound: a short decaying noise transient
  with damped 155 Hz and 310 Hz resonances. Sound is supplementary; show
  **You knock on the wooden door.** while the visible action occurs.
- Use active simulation time. Pause/backgrounding freezes the gesture, effects,
  response and audio. Replay, jump and restart cancel outstanding sound and reset
  all interaction state. Do not replay old knocks after returning to a scene.
- Fit approach, hand target and ring placement to the actual door. House 1's
  world coordinates and local step offsets are not universal house coordinates.
- Return to the route standing point before walking onward. Leave the next
  destination to an explicit player action after the response.

Implementation baseline: `src/house-rejection.mjs` (timing and approach),
`src/house-scene.mjs` (hand pose, door cues and audio), and
`src/rehearsal-route.mjs` (local approach/progression). Both scenes now use that same renderer, with a House 3 facade translation and
its own local approach distance. House 1 retains its accepted refusal timing and
temporary light. House 3's response state lives in `src/house-sighting.mjs`;
its illustrated presentation lives in `src/house-sighting-scene.mjs`.

House 3 starts and remains lit. House 1's waking light, refusal recording and
darkening are **not** part of the shared knocking interaction.

Verification when reused: compare both doors in motion; verify three synchronized
strikes, lantern hand preservation, sound-off comprehension, pause/resume,
reduced motion, replay/reset and single explicit departure. Test House 1 →
House 3 → gate without changing the gate placeholder or opening the gate.


## House 8 reuse — 14 September 2026

Point 07 reuses the three-strike gesture, rings and wooden sounds with a House 8
facade translation and its own local step distance. Its fixed light remains on;
House 1's waking light and refusal stay specific to that house. A separate
`houseAdvice` state uses the shared player-paced conversation timing, while the
presenter selects House 8's doorway images and advice. Thank you reveals the
closed-door farewell; Return to the village exposes Explore the empty stall.
The existing curved outgoing route and point 08 placeholder are preserved.

[Scene and accepted play-test](scenes/07-house-8.md) ·
[Verification and captures](../../review/2026-09-14-house-8/README.md).
