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

## Decorative-wall collision repair

The stale assertion exposed 29 route samples inside the decorative-wall runs
added with the annex/decorative scenery. The layout keeps the authored walls but
opens the route junction and turns the two open-ended runs away from the lanes:

| Run | Repair | Why this is stable |
| --- | --- | --- |
| 2 · House 1 | Rerouted north, then west/south to `[-10, 25] → [-12, 22]` | Clears both the canonical gate-to-hearth lane and the House 1 rehearsal corridor |
| 5 · House 8 annex | Turns south to `[6, -22] → [8, -25]` | Keeps the open end on the far side of the square-to-pen lane |
| 6/11 · House 7 / House 4 | Splits at the square: the House 7 section ends at `[-0.1, -12.8]`; a new open-ended tail reaches House 4 from `[5.2, -5]` | Leaves a deliberate opening at the route junction while retaining both host connections |

The POI check retains its original all-wall/all-route point assertion and adds
continuous-segment regressions for the formerly colliding lane/run pairs. Final
minimum excess clearances beyond the existing `wall.width / 2 + 0.6` rule are:

| Route / wall run(s) | Minimum excess clearance |
| --- | ---: |
| `lane-0` / 2 | 0.452 m |
| `lane-14` / 5 | 5.165 m |
| `lane-13` / 6, 11 | 1.122 m |
| `lane-14` / 6, 11 | 2.695 m |
| `lane-9` / 6, 11 | 1.034 m |
| `lane-11` / 6, 11 | 1.648 m |
| `lane-15` / 6, 11 | 2.695 m |

Each regression requires more than 0.25 m excess clearance, so the check does
not merely encode the current point samples or replace `28` with `63`.

## Verification

- Baseline: `node checks/verify-journey-poi.mjs` stopped at the stale assertion
  with `63 !== 28`.
- `node checks/verify-journey-poi.mjs`: passed. The later POI geometry, well
  clearance, wall, gate opening, support-post, and moving-occlusion assertions
  executed; model count is 63, wall segments are 178, and all seven named
  route-wall regression groups passed.
- `node checks/verify-village-layout.mjs`: passed, including 17 host/perimeter
  wall joins, six annex joins, and the 1–2 decorations per house checks.
- `node checks/verify-rehearsal.mjs`: passed with 0 sampled corridor failures;
  its 2,002-frame landscape and 2,002-frame portrait walkthroughs reported 0
  hidden-player samples.
- `node checks/generate-settlement-map.mjs` and
  `node checks/generate-settlement-map.mjs --rehearsal`: regenerated the
  committed settlement and rehearsal layout/map artifacts.

The standalone `node checks/verify-journey-camera.mjs` was also rerun against
the fresh 63-model POI geometry evidence and remains red: 804 hidden-player
chest frames out of 61,816, first appearing on forward `lane-0` at distances
5.787–6.440 m. A focused diagnostic identifies the blocker as the current
House 1 annex occluder (occluder index 19; bounds approximately
`x[-10.289,-5.110]`, `z[20.477,24.930]`), not a repaired decorative-wall
segment. The route-wall, rehearsal, and layout checks are green. Fixing that
annex/camera occlusion would expand beyond the authorized decorative-wall
collision repair, so it is recorded here rather than changing gameplay or
camera behavior in this PR.
