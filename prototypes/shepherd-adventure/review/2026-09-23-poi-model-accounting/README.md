# POI model accounting verification

The POI check's former `world.modelCount === 28` assertion described an older
scene. The current `createJourneyWorld().dress()` accounting is split into
independent inventory categories:

| Category | Current count | Source of the invariant |
| --- | ---: | --- |
| Nativity | 14 | shelter, four troughs, three family models, five sheep and one donkey |
| Workbench | 2 | one workbench and one oil jar |
| Well/gate POIs | 2 | one fitted well and one fitted gate model |
| Authored scenery | 19 | 11 houses, two empty stalls, one village animal pen, two vegetable stalls, two pottery stalls and one tanner stall |
| House annexes | 6 | `HOUSE_ANNEXES` layout entries |
| House decorations | 20 | `HOUSE_DECORATIONS` layout entries |
| **Total** | **63** | derived from the checked category counts |

The replacement check verifies each category before comparing the reported
aggregate with their sum. It also inspects the placed POI geometry, not only the
unparented source fit: the well is `[2.2, 0.85, 2.2]` metres and the gate is
`[3, 1.9, 0.15]` metres in their authored parent spaces; both remain grounded
and centered on their anchors. The existing well path-clearance, wall, gate
opening, support-post, and occlusion-bound assertions remain unchanged.

## Verification

- Before the change, `node checks/verify-journey-poi.mjs` stopped at the stale
  assertion with `63 !== 28`.
- After the change, the new category and placed-geometry assertions pass and
  execution reaches the existing wall-clearance loop.
- The POI check then reports an existing layout failure: 29 samples from the
  canonical `world.paths` are within the prohibited clearance of newly added
  `decoration-wall` segments. The worst sample is `(-6.2299, 23.7074)` against
  the wall from `(-7.8, 24)` to `(-4.2, 23.4)`, at `-0.8595` metres after the
  required margin. This is outside the model-count assertion and has not been
  weakened or changed here.
- `node checks/verify-journey-camera.mjs` passes its current evidence input:
  61,816 frames, zero hidden-player samples, and 317 foliage-fade frames.
- `node checks/verify-village-layout.mjs`, `node checks/verify-settlement-stalls.mjs`,
  `node checks/verify-house-decorations.mjs`, and `node checks/verify-rehearsal.mjs`
  pass independently.

The canonical-route/decorative-wall collisions need a separate layout decision
before the full POI check can be reported green. Repairing those collisions
would require changing scenery/layout or changing the scope of the existing
wall assertion, neither of which is part of this focused model-count repair.
