# Preserve a complete spread through loading and turning

Round12 extends ADR005's half-page snapshot to a complete folded spread. The previous implementation juxtaposed an outgoing printed half with a live destination half, and exposed incrementally loaded destination objects before the scene was ready.

During construction, the live stage is hidden and a complete outgoing image covers the open book. Once the destination is complete, its folded image is captured too. The departing face carries the outgoing illustration, its reverse carries the destination's landing half, and stationary halves beneath the sheet complete the two spreads. The live destination appears after the 0.58-second sheet clearance; popup unfolding retains its existing timing.

At most two render targets are retained. A completed destination transfers ownership into the outgoing slot on the next navigation, avoiding a third allocation. Superseded partial construction keeps the last complete source and its real identity. Returning to the room and disposal release both targets. Reduced motion allocates neither target and still hides incomplete construction.

Material-specific shader crops sample the original render-target texture. They do not clone textures or alter shared repeat/offset state. Both targets remain available after the turn for deterministic review rewind and are replaced on navigation. Capture failure falls back without exposing a partly built scene.

The review harness checks 48 matching poses across both stories, directions and desktop/phone sizes. Delayed family loading checks normal and reduced motion; a separate normal-motion race checks skipped construction, replacement and release. These supplement the complete static deployment-path acceptance suite. Visual retention and scores are recorded separately in the round12 review log; state assertions alone are not a quality verdict.
