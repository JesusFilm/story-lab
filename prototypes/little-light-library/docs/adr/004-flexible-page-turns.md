# Flexible, directional page turns

The reader previously rotated a rigid blank slab from right to left for both Next and Previous. The book now uses one subdivided, double-sided paper sheet whose cross-section bends during travel while preserving segment length. Its spine stays fixed, and the curl vanishes at either resting endpoint. Existing paper material and lighting are reused; this is authored geometry, not a cloth simulation or a new raster asset.

The last successfully presented page determines travel direction. Moving to an earlier page in the same story turns left to right. Opening another book and re-presenting the same page use the forward default. A superseded asynchronous load cannot commit the presented-page identity. Existing page timing remains 0.58 seconds, with popup lift beginning at 0.6 seconds; reduced motion omits the moving leaf.

The optional second argument of `libraryReview(time, age)` freezes book choreography independently of character time for matched review captures. Omitting it preserves the existing settled-book review behavior. The normal user path uses elapsed time.

Tests verify constant paper length, fixed spine, finite coordinates, positive height above the support plane, mirrored travel, and direction selection. `scripts/page-turn-review.mjs` captures and checks both directions at six phases on desktop and phone. Still images and sampled geometry establish pose and direction, but do not establish perceived continuous smoothness. Silent recordings retain the actual-time final forward/backward turns after the frozen samples.
