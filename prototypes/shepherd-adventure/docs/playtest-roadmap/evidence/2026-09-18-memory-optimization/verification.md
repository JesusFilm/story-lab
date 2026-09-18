# Verification record

- Camera numerical comparison against the original module: 10,000 frames, varying movement, heading, collision bounds, portrait mode, interest target and reset; maximum position/look deviation **0** and identical visibility flags.
- Full camera check: 61,816 sampled route frames, zero hidden player-chest frames; stationary convergence passes. New borrowed-output check preserves independent default snapshots.
- Nativity geometry and animation: passes wall closure, floor level, clearance, placement, independent idles, pause/reduced motion. New checks establish one shared sheep geometry/material and five separate skeletons/bone roots.
- House decoration clearance and settlement stall footprints: pass with the regenerated maps. All feature centres remain unchanged from the baseline map.
- Full rehearsal state and route camera checks: pass; output copied into this evidence directory rather than replacing the historical empty-stall review.
- Animal route views, nativity arrival, story sequence, audio owner, ambience scheduling, gate progression, empty stall and profiler accounting checks pass.
- Browser-specific legacy scripts were not run successfully: they import an unavailable Playwright package. Normal browser verification uses CUA instead; no passing result is claimed for those scripts.

The first rehearsal/stall checks correctly rejected stale maps after geometry changed. Regenerated both maps and reran successfully. The headless loader needed Three addon resolution for SkeletonUtils; its resolver was updated. These are resolved setup/fixture failures, not suppressed assertions.

These checks do not establish human visual/listening acceptance or physical mobile performance.

## Allocation investigation

The first pass lowered retained memory but did not materially lower the fixed-scene
sampled positive heap movement (56.0 → 54.9 MiB/s). Its exports are retained as
`first-pass-*`; they are not the final result. An isolated 1,800-frame Node inspector
allocation sample, including collected objects, identified the dynamic-axis slab
intersection calculation as a dominant source. Replacing it with direct coordinate
access preserved the arithmetic and substantially reduced sampled allocations.
The top 20 sampled stack entries are preserved in the two allocation JSON files;
they are diagnostic estimates for a headless subset, not a browser benchmark.
`checks/profile-camera-allocations.mjs` can repeat the subset and accepts an optional
absolute camera-module path for another revision. The first-pass camera is saved
as `first-pass-camera.mjs` here for that comparison; it is not a runtime dependency.

Final parity check: another 10,000 camera frames and 10,000 segment intersections
match the original exactly. The full browser route and idle probe were repeated
after this last runtime change. First-pass CUA also checked pause → 390 × 844 resize
→ resume and movement; the world remained drawn. This is layout coverage, not
mobile hardware performance.

Browser completion: both optimized normal routes reach the replay invitation.
The final run includes all verses and ten route stops with no skips, plus the
separate fixed idle window. No console warnings or errors were observed. Replay
returned to the opening in both passes. The second pass revalidates the last
camera arithmetic change; no assets or scene/lifecycle behaviours changed between
those passes. See final raw exports for timings, audio counts and errors.

## Release review (D043)

The final camera and profiler regressions passed again. Production portal build,
354-file dependency/privacy validation under all three deployment prefixes, and
the Shepherd Adventure browser smoke test passed. The release check found a
pre-existing publication omission for `src/rehearsal.mjs`; explicitly including
that entry module fixed the rehearsal page dependency. SkeletonUtils was already
included by the portal vendor dependency builder. The publication inventory was
regenerated from the reviewed build. Quick source review found no blocking issue
in pooled-state ownership, shared skeletons, pause handling or profiler opt-in.
