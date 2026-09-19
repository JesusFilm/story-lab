# ADR008 — shared popup fold direction

Status: retained after independent round14 visual review; final scene acceptance passes.

Opposite hinge directions let the rear illustration pass through the figures during both unfolding and outgoing collapse. Angular staggering also makes neighboring illustrated planes intersect. Every popup now follows the same forward angle from PI (flat) to PI/2 (upright), with the existing opening and page-clearance timing. Full-open positions are unchanged.

Character geometry remains in its unwarped rest pose while folding. Acting resumes upright. The print capture and live folded surface must use the same rest pose and layer offsets. Complete folded bounds still determine the print framing; the live stage follows that framing before returning to its authored size.

The tradeoffs require visual review: figures point toward the reader when flat, folded composition changes, and acting resumes at the endpoint. Positive flat Z offsets briefly reverse layer ordering extremely near flat. Parallel planes can become coplanar at that swap; tests establish that a rear plane does not obliquely slice across an actor, not physically perfect paper simulation or strictly positive separation at every angle. Existing supports and shadows stay hidden near flat and return when standing.

Evidence: round14 contains matched turn, close handoff, outgoing-collapse, and all-spread middle/settled captures at desktop and phone sizes. Geometric checks sample the shared path against story actor placements. Independent review retains the change at popup/acting4.3 (previously4.2); book choreography remains4.4. Middle-fold edge-on silhouettes and detached shadows remain visible.
