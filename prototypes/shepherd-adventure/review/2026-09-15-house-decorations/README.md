# House decoration placement review

Four new ImageGen → Pixal3D static clusters: two limestone-wall-and-pot variants
and two basket-and-pot variants. Olive-like plants grow from earth behind the
containers. Eight copies decorate Houses 3, 8 and 9; House 9 has adjacent wall
variants along its window-side flank. House centres, door approaches, routes,
lighting and dialogue are preserved. Existing illustrated conversations have
not been regenerated to include the new dressing.

## Actual browser screenshots

- [House 3: wall A and basket A](after-point-3.png)
- [House 8: wall B and basket B](after-point-7.png)
- [House 9 front](after-point-9.png)
- [House 9 paired wall clusters](house-9-paired-wall-clusters.png)
- [Mobile House 3](mobile-house-3.png)
- [Model-loading failure](loading-failure.png)

Before captures are retained for the same three staged arrival points. The
paired-wall image uses the game's frozen debug camera; other captures use the
ordinary rehearsal camera. These are rendered model placements, not illustrations.

## Verification

- `node checks/verify-house-decorations.mjs`: all four variants, eight placements,
  house-relative mounting, scale and sampled route clearance. Minimum clearance
  from decoration bounding boxes to the ten route corridors exceeds 1.6 metres.
- `node checks/verify-rehearsal.mjs`: state transitions, all route legs, house
  orientation, fixed-light inventory and landscape/portrait camera checks passed.
  [Geometry/state](geometry-and-state.json) · [camera samples](camera-samples.json).
- Both settlement maps regenerated; `node checks/verify-settlement-stalls.mjs`
  passed placement, overlap and map/hash checks.
- Headless Chrome: three desktop arrivals without page errors; mobile 390×844
  reduced-motion view without horizontal overflow; a failed decoration request
  shows the loading error and reload recovers after the request is restored.
- Four gallery entries and explicit model/module review hashes added. The full
  portal build remains blocked by pre-existing review-hash mismatches in
  `index.html`, `src/boot.mjs`, `src/journey-boundaries.mjs`,
  `src/companion-character.mjs`, `src/journey-debug.mjs` and
  `src/lamp-workbench-model.mjs`. Those hashes were not broadened by this work.
  No deployment or hosted-browser verification was performed.

## Model preparation and limits

Two opaque inputs lost foliage during reconstruction; transparent ImageGen
cutouts produced complete replacements. Original sources remain in the library.
Conservative atlas-preserving reduction retains thin leaves; duplicate faces
must be removed before reduction. The final basket uses a higher triangle budget.
The runtime models total about 43 MiB; physical-device performance remains to be
measured. Hidden surfaces, leaf geometry and basket interiors are inferred.
Technical verification is not the user's creative acceptance.
