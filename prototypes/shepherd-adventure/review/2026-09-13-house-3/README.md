# House 3 — helpful sighting and gate direction

13 September 2026 · `codex/shepherd-story-rebuild` · **Ready for user review**.
The user approved the gentle, brief exchange direction. Acceptance of the playable
implementation remains pending. No commit, push, merge or deployment in this pass.

[Stage House 3](../../rehearsal.html?point=3) ·
[Replay its incoming walk](../../rehearsal.html?point=3&replay) ·
[Start at House 1](../../rehearsal.html?point=2) ·
[Scene brief](../../docs/story-rebuild/scenes/03-house-3.md)

Use the prototype server at `http://127.0.0.1:8766`. If needed, run
`python3 serve.py --port 8766` from the prototype directory.

## What changed

House 1 now suggests trying the neighbour's lit house. House 3 offers **Knock on
door**, with the same free-left-hand gesture, three ring cues and synthesized
wooden knocks. House 3's light stays on. At three seconds the shepherd is back
at the route anchor and the player-paced illustrated exchange appears.

Three consistent illustrations show the closed door, opening door and helpful
resident. Four reading beats cover footsteps, the shepherd's question and the
resident's two replies. **Thank you** returns to the village; **Go to the gate**
starts the existing path. The gate and points 04–10 remain placeholders.

There is no House 3 voice recording. Visible speaker labels, resident illustration
and persistent text communicate the exchange without sound. Images load when the
knock begins. Failed images or an eight-second timeout retain every line of text
and offer a retry that preserves the reading position.

## Captures

These are first-pass captures. The [continuity revision](continuity/README.md)
contains the current screenshot-referenced house and more realistic resident.

The earlier [House 3 placeholder capture](../2026-09-13-house-1/05-house-3.png)
is historical baseline evidence, not a fresh before screenshot.

- [New House 1 departure wording](01-next-door.png).
- [House 3 arrival after walking from House 1](02-arrival.png).
- [Free hand, lantern and door cue, paused during first knock](03-knock.png).
- [Closed-door illustration and footsteps](04-footsteps.png).
- [Opening door and shepherd's question](05-question.png).
- [Resident's sighting](06-resident.png).
- [Direction toward the gate](07-gate-clue.png).
- [Explicit gate choice back in the village](08-gate-choice.png).
- [Arrival at the unchanged gate placeholder](09-gate-placeholder.png).
- Portrait: [arrival](10-mobile-arrival.png), [complete gate clue](11-mobile-clue.png).
- [Image-failure text fallback](12-image-fallback.png).

Desktop is 1440 × 900. Portrait is a 390 × 844 emulated touch viewport with reduced
motion and deliberately unavailable AudioContext. These are browser emulations,
not evidence of a physical phone test. The illustration is an interpretation of
the house; the actual 3D door does not animate open.

## Specific play-test

1. Start at House 1, knock and wait for its refusal. Does **Try next door** make
   the lit neighbour feel like a natural next attempt?
2. Walk to House 3 and knock. Compare hand contact, three taps and door rings with
   House 1. Check that the right hand continues carrying the lamp.
3. Read the exchange once. Judge whether the illustration transition feels
   natural, the resident feels gently helpful, and the text is brief enough.
4. Leave the gate clue on screen. It must wait for you. Choose **Thank you**;
   confirm you remain at the house until choosing **Go to the gate**.
5. Walk to the gate. Does the reported direction make sense along this lane?
6. Try sound off, pause during knocking and while reading, and replay the incoming
   walk. Repeat at phone width; no line or button should be cut off.

## Verification completed

- `node checks/verify-house-sighting.mjs`: single knock, pause, return to anchor,
  held reading, explicit departure, closed gate, deterministic jump/replay/reset.
- `node checks/verify-house-rejection.mjs`: accepted rejection timing, temporary
  light, pause, departure gating and House 3 handoff.
- `node checks/verify-lamp-assembly.mjs`: existing lamp preparation remains valid.
- `node checks/verify-rehearsal.mjs`: ten corridors, run/walk transitions, fixed
  lighting and settlement geometry checks; landscape and portrait camera samples
  have no hidden-player samples. The check now completes House 3 before continuing.
- `checks/verify-house-sighting-scene.mjs`, using Playwright with installed local
  Chrome: House 1 → House 3 → gate, three knock events, pause, held dialogue,
  repeated-knock/departure protection, replay and interrupted loading cleanup,
  silent portrait/reduced-motion play, no horizontal or text overflow, image
  failure and successful retry at the same reading position, no page errors.
- `checks/verify-house-scene.mjs`: full House 1 desktop/mobile regression including
  its decoded refusal voice, darkness before departure, lamp-to-house integration,
  unavailable voice fallback, and interruption/replay. This run saved captures
  outside the repository so the accepted checkpoint's images were not overwritten.
- `git diff --check`: pass.

Browser checks establish playback dispatch and state correctness; the user's
judgment of sound, warmth and pacing remains the next review. No new performance
benchmark or release validation is claimed. Original generated artwork and the
built-in ImageGen prompt set are documented in
[the local asset folder](../../assets/house-3/README.md).

## Accepted checkpoint

Following the continuity revision, the user judged the result much better and
authorized the feature audit update, focused commit and push on
`codex/shepherd-story-rebuild`. This supersedes the pending-review status above
for this checkpoint. No merge or deployment is authorized.
