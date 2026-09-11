# Animation follow-up

Status: implemented. Owner: Codex. Updated: 2026-09-11.

User request: remove authored turning and prevent the apparent jump on inspection.
Source before changes is preserved in `before-source.zip`.

The journey avatar’s world Y is terrain height + 0.015 and inspection does not
move its position. The animation adapter could fade a restarted active look from
zero, briefly exposing the original pose. It now preserves active looks and uses
normalized, interruptible blending. Camera inspection previously changed collision
anchor to the clue and snapped aim; it now uses the real player anchor and eased aim.
Route rotation continues during locomotion, without a turn clip or pause.

Passed: `node checks/verify-animation-transitions.mjs`, `node checks/verify-journey.mjs`,
`node checks/verify-journey-camera.mjs`, and syntax checks. The animation regression
uses a deliberately displaced rest pose to detect blending leaks through rapid
interruptions. The actual model translation tracks were inspected, but that alone
is not a full skinned-pose analysis. A browser inspection check showed grounded feet;
no complete playthrough or frame-by-frame visual certification was performed.
