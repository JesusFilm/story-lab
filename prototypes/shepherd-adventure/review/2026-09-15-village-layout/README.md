# Village layout review — 15 September 2026

Implements the annotated layout: houses 2, 6, 10 and 11 turn their doors inward;
a new generated limestone annex attaches to houses 1, 2, 3, 5, 8 and 9. House
centres and the walking route remain fixed. The six annex placements fit to
house-local walls and stay below their hosts' rooflines.

Twenty existing plant/pot/wall clusters dress all eleven front facades. A seeded
selection varies the four models and chooses one or two per house; reloads and
map exports preserve the same arrangement. Mounting follows each house's yaw,
with a clear doorway between the clusters.

Eleven blue-marked wall runs use the existing low masonry model. Old gate-wing
segments are removed. The outer village boundary and northwest animal enclosure
remain. Both maps are regenerated from actual mesh footprints, including the
annexes, decorations and door-direction markers; obsolete map-only screens are
absent.

The new annex reference and original model are in the
[asset library](../../../../assets/structures/limestone-house-annex/README.md).
The first decimation exposed invalid welded faces; the selected preparation preserves the source atlas and validates
geometry before and after decimation. Runtime geometry is checked separately from the
original source. Generated hidden surfaces remain approximate.

## Captures

- [Updated map](village-map.png)
- [House 3 annex and front decoration](house-3.png)
- [House 8 rear annex](house-8.png)
- [House 9 annex and two decorations](house-9.png)
- [Northern houses and new walls](north-village.png)

## Validation

See [geometry and route checks](geometry-and-state.json) and
[camera samples](camera-samples.json). Additional layout checks cover specified
house rotations, six attached joins, lower annex roofs, one or two decorations
per house, facade mounting and doorway clearance. Browser captures use the actual
game geometry and lighting. This is a local review, not a deployment or user
acceptance record.


Final checks passed: both geometry-derived maps, village layout assertions,
decoration clearance, settlement stalls, full rehearsal route/state checks,
2,002 camera samples in each orientation, and mobile reduced-motion loading.
Browser views reported no JavaScript errors. Annexes retain a rougher generated
surface than the original house models at close range.

The local portal build remains blocked by pre-existing review-hash mismatches
beginning with `index.html`. New and edited publication inputs for this layout
have current hashes. Nothing was deployed.
