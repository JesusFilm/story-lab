# J051 — hardened Firefox playability check for PR #11

Date: 23 September 2026 (NZST). The live `origin/ops/j037` ref was verified at
`d521b7f4e9fb7bf9c45693eff50919ba9c69aa3b` before editing. PR #11 remains a
draft with that branch as its head; this follow-up keeps the existing check,
README, and report scope.

## Implemented

`checks/verify-firefox-playability.mjs` now:

- opens Firefox BiDi before navigation, awaits a bounded `session.subscribe`
  response, validates the success result, fails on transport or unexpected
  socket closure, and requires observed same-origin page requests before
  declaring telemetry valid;
- captures bounded, sanitized stdout/stderr tails for the prototype server and
  geckodriver, checks for early child exit during startup and waits, and writes
  those safe diagnostics into `trace.json`;
- handles SIGINT/SIGTERM through an idempotent cleanup path that attempts the
  WebDriver session, BiDi socket, geckodriver, and server cleanup without
  replacing the original failure;
- requests and verifies a 1440 × 900 CSS viewport, records the WebDriver
  window rect, outer size, device pixel ratio, focus, and visibility, checks
  that WebGL is not lost, and records available route/frame signals plus an
  in-page requestAnimationFrame progress probe;
- observes the first walking state, pauses immediately, verifies destination 0
  remains a paused walking state, and only then captures the stable walking
  screenshot. Route-entry is recorded as state-only so screenshot latency
  cannot turn a healthy first movement into an arrival or pause timeout;
- documents the shared `DISPLAY=:0` focus constraint and places no-DISPLAY /
  headless guidance before browser-session creation.

The check deliberately has no pixel threshold or image-diff gate. Its telemetry
claim is limited to the subscribed events and page requests actually observed;
it is not a complete performance or visual oracle.

## Verification

From `prototypes/shepherd-adventure`:

```sh
node --check checks/verify-firefox-playability.mjs
git diff --check
FIREFOX_HEADLESS=1 node checks/verify-firefox-playability.mjs
node checks/verify-firefox-playability.mjs
```

All four commands passed. Both smoke runs used Node 22.22.1, Firefox 155.0.1,
and geckodriver 0.37.1. The headed run used the existing shared `DISPLAY=:0`
and passed with focus and visibility true at every recorded stage.

Headed evidence:

- trace: `captures/firefox-playability/2026-09-23T03-00-14-381Z/trace.json`;
- verified CSS viewport 1440 × 900, outer window 1492 × 1037, device pixel
  ratio 1;
- requestAnimationFrame probe advanced from 33 to 269;
- BiDi subscription acknowledged, 131 same-origin page requests observed, 168
  response events recorded, zero JavaScript errors, zero failed network
  events, and no unexpected socket close;
- visual captures: `01-opening.png`, `04-route-moving-paused.png`,
  `06-restart-opening.png`, and `07-direct-ending-story-preview.png`.

Headless evidence:

- trace: `captures/firefox-playability/2026-09-23T03-06-13-872Z/trace.json`;
- verified CSS viewport 1440 × 900, outer window 1440 × 986, device pixel
  ratio 1;
- requestAnimationFrame probe advanced from 29 to 199;
- BiDi subscription acknowledged, 131 same-origin page requests observed, 169
  response events recorded, zero JavaScript errors, zero failed network
  events, and no unexpected socket close.

The trace keeps the child-process tails for diagnosis. The expected server
SIGTERM during cleanup and the browser's incidental `/favicon.ico` 404 are not
reported as run failures; the latter is excluded from asset/module failure
telemetry.

## Wording and limits

`story-preview.html?story=ending` is documented as an isolated review of the
ending story component and replay control. It is not the game's ending
diorama/arrival transition and does not claim that the shepherd walked the
route.

The full ten-stop route, lamp/arrival journey, pixel scoring or image-diff
oracle, and device/mobile coverage remain deferred. No packages were installed,
and this work did not comment on, merge, deploy, or otherwise change production
state.
