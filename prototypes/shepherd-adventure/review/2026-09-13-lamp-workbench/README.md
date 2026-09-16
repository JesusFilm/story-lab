# Lamp workbench — first playable draft

13 September 2026 · `codex/shepherd-story-rebuild` · user review pending.

The user subsequently requested an [audit update](../../docs/navigation-direction-retrospective-2026-09-13.md#13-september-update--lamp-workbench-assembly-and-departure)
and branch commit. This is a draft checkpoint; final creative acceptance remains pending.

[Scene brief and draft copy](../../docs/story-rebuild/scenes/01-lamp.md) ·
[Direct local stage](http://127.0.0.1:8766/rehearsal.html?point=1) ·
[Replay incoming walk](http://127.0.0.1:8766/rehearsal.html?point=1&replay)

The user chose a guided sequence, one part at a time. This is a playable proposal
for feel/text/camera review, not an accepted finished scene.

## Evidence

- [Before: staged point 01](before-staged.png) · [After: same staged stop](after-staged.png)
- [Lamp body and new bench](01-lamp-body.png) · [Wick](02-wick.png) · [Oil](03-oil.png) · [Flint](04-flint.png)
- [Ready to light](05-ready-to-light.png) · [Lit on the table](06-lit.png) · [Collected](07-collected.png)
- [Actual departure toward House 1](08-departure.png) · [House 1 placeholder](09-house-1-placeholder.png)
- [Full incoming walk, arrival](10-full-incoming-walk.png)
- [Mobile item card](11-mobile-body.png) · [Mobile lit](12-mobile-lit.png) · [Model failure/retry](13-model-failure.png)

Before/after stages use a 1440 × 900 viewport and the same point anchor. The before
capture serves the committed scaffold files at HEAD. Item shots use the new close
camera; they are not matched camera comparisons to the old distant arrival view.
Mobile captures use 390 × 844. Departure and incoming screenshots come from real
movement. Other shots are deliberately staged for repeated review.

## Specific review steps

1. Replay the incoming walk. Is the workbench inviting and identifiable?
2. Choose Prepare your light. Can you identify each item immediately and read the
   text without the panel covering what matters?
3. After selecting the lamp, go back, then continue. Progress should remain at Wick.
4. Pause at Oil. The action should disable. Continue and finish the sequence.
5. Light lamp. It should glow on the table before collection. Take lamp should
   show one +1 Lamp cue and remove the table lamp.
6. Set out. Watch the right-hand light and the movement transition. House 1 should
   still show its unfinished scene placeholder.
7. Jump to point 01, then restart. Both clear the lamp; jumping to a later point
   reconstructs it. Repeat on phone width and with reduced motion. The card can
   scroll on short screens.

## Verification

- `node checks/verify-lamp-assembly.mjs`: ordered actions, duplicate protection,
  pause/back/resume, departure gating, one award and deterministic reset/jumps.
- `node checks/verify-rehearsal.mjs`: ten corridors and outcomes, measured model
  footprints, fixed-light inventory, unchanged structure centres and sampled camera
  visibility. [Geometry/state](geometry-and-state.json) and
  [camera samples](camera-samples.json) report no failures.
- `node checks/verify-settlement-stalls.mjs`: existing stall locations, bearings,
  map bounds and route clearance remain consistent.
- `checks/verify-lamp-scene.mjs` with an installed `PLAYWRIGHT_MODULE`: real incoming
  walk, five item actions, back/resume, pause, flame before collection, reward,
  departure to House 1, jump/restart, mobile reduced motion and cold model failure
  with successful retry. No desktop page errors were reported.
- Blender source/runtime front/rear renders reviewed. The retained 49,879-triangle
  derivative uses the source atlas at 2K. A generic bake with canopy artifacts was
  rejected. Actual 3D lamp/jar renders provide their inspection PNGs.

The new bench is more detailed than the old boxes. Triangle reduction relative to
the generated source is not a measured frame-rate improvement over the old scene.
No controlled performance comparison or physical-device certification is claimed.
Item actions use state changes, not new assembly animation clips. The carried
lantern follows the right hand but retains the existing animation pose.

## Publication boundary

The asset gallery entry, model dependency and reviewed hashes are updated for local
portal validation. Validation also exposed two stale hashes and a missing shared
scene module from the earlier rebuild; those existing changes were inspected and
the local export manifest repaired. The rehearsal remains a development entry and
is not added to the public demo allowlist. Nothing was deployed or merged.
