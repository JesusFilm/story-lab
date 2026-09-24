# Shepherd Adventure · post-repair adversarial follow-up

This review records the focused repairs for the existing Shepherd Adventure PR #12. It does not claim that the separate House 1 camera-attribution finding is fixed.

## Branch and scope gate

Before editing, the existing draft PR target was checked end to end:

- `origin/ops/j036` resolved to `cfd351c688ea6fb3b4ea63d30dba0561631a5a94`.
- The local `ops/j036` reference, `origin/ops/j036`, and the checked-out starting commit all matched that target.
- The complete PR diff against `origin/main` was inspected before changes.

The repair stayed on the existing branch scope. No comment, merge, deployment, or replacement PR was made.

## Geometry repair

The prior run 2 and run 5 paths were checked against the actual transformed canonical and rehearsal structure geometry. They reproduced the reviewed intersections at the House 1 annex and at House 8/its annex.

The authored wall paths now use:

```js
// run 2 / House 1
[[-5.5,18.5],[-5,17]]

// run 5 / House 8 annex
[[6,-8],[7,-15.25],[8,-16]]
```

The new House 8 middle point keeps the wall north of the House 8 footprint in both orientations while retaining the route margin. The existing House 1 route repair and POI geometry remain intact.

## Continuous regression coverage

`checks/wall-structure-regressions.mjs` uses each loaded structure root, applies its actual world transform to every mesh vertex, projects those vertices to X/Z, and computes a convex hull. Each repaired decorative-wall segment is then checked by continuous segment-versus-convex-footprint distance; this is not a vertex-only test.

The check runs in both `verify-journey-poi.mjs` (canonical) and `verify-rehearsal.mjs` (rehearsal). It is deliberately scoped to the two reviewed repaired paths, 2 and 5, rather than becoming an unrelated all-wall audit. The only negative clearance accepted is a narrowly scoped intended host join: the wall segment must declare that exact structure as its start or end host, and the segment beyond a 1 m host collar must clear the same footprint. Other structure intersections fail the check.

Final reported non-host clearances:

- Canonical: minimum non-host clearance `0.5583 m`; House 1 annex `1.9300 m`; House 8 `0.5583 m`.
- Rehearsal: minimum non-host clearance `0.0802 m`; House 1 annex `1.8842 m`; House 8 `0.0802 m`.
- The House 1 and House 8 annex endpoint joins are the two recorded intentional host exceptions; no other structure footprint intersection was accepted.
- Canonical repaired-lane margins remain above the existing focused threshold: run 2/lane 0 `3.7995 m`, run 5/lane 14 `0.3635 m` versus the required `>0.25 m` regression margin. Rehearsal corridor sampling passed its `0.45 m` minimum, with the House 8 leg's closest wall clearance at `0.7082 m`.

## Verification

Passed:

- `node checks/verify-village-layout.mjs`
- `node checks/verify-journey.mjs`
- `node checks/verify-journey-poi.mjs` — 63 models, 177 wall segments, canonical continuous wall/structure regression passed.
- `node checks/verify-rehearsal.mjs` — full route, state transitions, sampled corridor clearances, and rehearsal continuous wall/structure regression passed.
- `node checks/verify-settlement-stalls.mjs`
- `git diff --check`

The canonical/rehearsal settlement maps, POI scene geometry, and POI verification output were regenerated and inspected. Unrelated generated files from the rehearsal/stall checks were left at their pre-run state to keep the PR focused.

## Deferred findings and limitations

`node checks/verify-journey-camera.mjs` still reports the separate House 1 annex camera-occlusion issue: `804` hidden-player-chest frames out of `61,816`, `1,307` ahead-occlusion frames, and first failures on lane 0 around `d=5.7867–6.4400`. This is the reviewed attribution/annex issue and remains deferred; the annex and camera were not redesigned.

`node checks/verify-nature-assets.mjs` remains blocked by the pre-existing integrity mismatch for `assets/nature/Bark_DeadTree.png` (actual SHA-256 begins `0e382c…`, recorded SHA-256 begins `498c5a…`). It is unrelated to this wall repair and was not changed.

These are headless geometry/state checks; they do not establish subjective composition, image decoding quality, device performance, or full-body camera visibility.
