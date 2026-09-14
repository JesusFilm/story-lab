# House 5 — review draft, 14 September 2026

The user approved the implementation plan. This playable draft awaits creative
acceptance. The user subsequently authorized the feature audit update, focused
commit and branch push. Work remains on `codex/shepherd-story-rebuild`; no merge
or deployment is authorized.

## Local walkthrough

With the prototype server running at port 8766:

- [Stage House 5](http://127.0.0.1:8766/rehearsal.html?point=5)
- [Replay the full gate-to-house approach](http://127.0.0.1:8766/rehearsal.html?point=5&replay)

1. Choose **Knock on door**. Watch the first three strikes, silent wait, and
   automatic second set. The window should remain dark throughout.
2. Read **“No one is answering.”**, then choose **Look around**.
3. Follow the walking arc beside the well. Check that human soles and rounded
   hoofprints read as different marks, with their direction leading past the stalls.
4. At discovery, judge the downward camera transition and steady gold outlines.
5. Choose **Follow the tracks**. Confirm continuous movement to the unchanged
   animal-pen placeholder. Pause during a knock or search and resume; Replay
   approach should restore the fresh Knock on door action.

## Current captures

All are staged local browser captures, not a full incoming-leg walkthrough.

- [Arrival](arrival.png), [knocking](knock.png), [unanswered thought](unanswered.png)
- [Well inspection, paused](well-search.png), [discovered trail](tracks.png)
- [Portrait arrival](mobile-arrival.png), [portrait trail](mobile-tracks.png)

The existing gate review's `house-5-arrival.png` is the pre-implementation comparison.

## Verification

Passed:

- `node checks/verify-house-tracks.mjs`: phases, single activation, pause, departure
  gating, continuity into point 06, replay/jump/reset and placeholder continuation.
- `node checks/verify-house-rejection.mjs` and `node checks/verify-barred-gate.mjs`:
  existing house rejection and gate progression regressions.
- `node checks/verify-rehearsal.mjs`: full ten-point progression, stable settlement
  transforms/lights, sampled path clearance including the new inspection and
  departure corridors, and landscape/portrait route camera samples. See
  [geometry/state](geometry-and-state.json) and [camera samples](camera-samples.json).
- `checks/verify-house-tracks-browser.mjs`: actual Chrome runs at 1280×720 and
  390×844 (portrait uses reduced motion), six knock events, pause during search,
  discovery/action availability, and arrival at the unchanged point 06. Both
  runs reported zero page errors. Supply `PLAYWRIGHT_MODULE` for a local runtime.
- `git diff --check`.

The browser pass exposed a door-camera collision. Holding the arrival camera
while the shepherd steps forward corrected the reviewed knock view. The well
walk and discovery use the following camera and a separate ground-focused view.

These checks establish functionality and sampled geometry, not user acceptance,
physical mobile performance, or an audio listening assessment. Public hosting and
publication files remain unchanged.
