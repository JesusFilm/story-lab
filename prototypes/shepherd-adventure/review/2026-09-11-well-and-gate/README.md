# Generated well and gate integration

- Status: implemented and programmatically verified; visual review pending.
- Owner: Codex. Last updated: 11 September 2026.
- Authorization: Jaco asked this task to add both completed models to the walkthrough and replace the low-quality placeholders.
- [Asset plan and provenance](../../../../game-concepts/shepherd-adventure/2026-09-11-well-and-gate-assets.md).
- [Playable journey](http://127.0.0.1:8765/journey.html). Reload an already-open page to load the new modules.

## Change

The generated stone-well curb replaces all 36 blockout stones; its center remains open with a separate runtime water surface. The well moved to X 14.2, Z 4.2 beside its existing investigation junction because the old position intersected a nearby lane. The lamp pole sits outside the masonry opening. The conservative measured radial clearance from the well to densely sampled routes is 0.779 m.

The generated timber-gate leaf replaces the old three rails and seven bars. Its axis is corrected and its actual bounds fitted to 3 × 1.9 × 0.15 m. It sits in the existing left-hinge group and retains smooth state-driven opening/closing. Both fixed posts remain outside the moving group. Dynamic leaf bounds keep foreground fading aligned with the moving geometry. Hinge hardware appearance/swing-side aesthetics remain visually unreviewed.

`serve.py` adds two exact asset routes pointing at canonical GLBs. Sources remain unchanged; no GLBs were copied and no new paid tasks were submitted. [before-source.zip](before-source.zip) preserves the prior world, server and README.

## Verification

[POI verification](../../checks/journey-poi-verification.json) loads the actual GLB geometry/material definitions through the running local HTTP server. It checks fitting and grounding, source immutability, absence of duplicate placeholder geometry, well lane clearance, open/closed leaf bounds, fixed post matrices and moving occlusion bounds. Closed gate spans X ±1.5 m; open gate's innermost extent is X −1.266 m in gate coordinates, leaving the central lane clear. Sixteen generated scenery instances load in total.

The test deliberately substitutes lightweight texture objects for headless parsing; it does not decode or render the images. Embedded textures/hashes were verified during asset generation. No Computer Use, browser automation or desktop screenshots were used. Visual composition, texture appearance, interaction-camera framing and physical-device performance await manual review.

The existing state suite passes 11 checks over 113 reachable states. Camera regression checks use the [updated measured scene bounds](../../checks/journey-poi-scene-geometry.json); they cover 54,696 travel frames and 112 stationary cases, with no hidden character-chest frames and no residual stationary movement. Earlier full-playthrough evidence is retained separately and is not claimed as a new visual playthrough of these models.

From the walkthrough folder, with `python3 serve.py` running:

```sh
node checks/verify-journey-poi.mjs
node checks/verify-journey.mjs
node checks/verify-journey-camera.mjs
```
