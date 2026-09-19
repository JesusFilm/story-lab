# Preserve outgoing artwork on the turning leaf

A cream leaf with correct motion still breaks visual continuity when it suddenly replaces the folded illustration. Before disposing a completed outgoing stage, the renderer now makes one orthographic offscreen capture of that stage folded flat. Only the relevant half-page is captured: right for Next, left for Previous. The room is excluded.

The flexible sheet uses separate front/back material groups. Next prints the front; Previous prints the back and reverses U coordinates so the left page retains its orientation. The other face remains cream. Existing artwork is reused at runtime; no external artwork, provider job, library asset or new source raster is produced.

The render target is independent of the outgoing stage's disposed geometry and image maps. The snapshot uses temporary unlit material copies, then restores renderer state. Only one target is retained; replacement, room exit and application disposal release it. Reduced motion skips both the print target and moving leaf. This adds one offscreen pass per eligible navigation, not one per frame.

A source must be both fully loaded and the last successfully presented page. A partially loaded replacement clears this eligibility, so rapid navigation cannot stamp destination fragments with an earlier page's identity. Missing eligibility safely uses the existing cream leaf. Source identity and target count are exposed through review telemetry.

Verification covers face/UV mapping, ownership and renderer-state failure restoration, plus normal-motion browser interruption, replacement, room disposal and reduced motion. Matched captures cover both books in both directions at phone/desktop sizes. A printed half may differ slightly in shading from live folded geometry; rendered review, rather than texture metadata alone, decides whether the result is retained.
