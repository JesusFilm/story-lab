# Independent quality review of round 13

Historical review: raw iteration captures and recordings were deleted during repository cleanup. The observations below record checks performed at the time; removed evidence is not available for reinspection. Current verification is in [review/latest](../review/latest/).

Reviewed all 48 matched Eden and Noah Next/Previous poses at 1366px and 360px in `before/`, `candidate-03/`, and `candidate-04/`. I also inspected all 32 closely spaced 0.575, 0.58, 0.7, and 0.85 poses in `handoff-candidate-03/` and `handoff-candidate-04/`, plus the normal and reduced loading pairs. Earlier candidate assessments are preserved in [`quality-review-13-candidate01.md`](quality-review-13-candidate01.md) and [`quality-review-13-candidate03.md`](quality-review-13-candidate03.md). I did not implement this pass or launch a browser. The stills and silent recordings do not establish perceived continuous motion, response latency, or sound.

**Retain candidate 04.** It preserves candidate 03's complete capture and repaired scale registration while cleaning the live flat-stage handoff. Noah Previous phase 0.145 retains Noah and all seven family members inside the moving sheet, and the phone pose keeps the same complete silhouettes. Eden's actors and tree remain contained in both directions. No new head crop, viewport clipping, paper/bookmark collision, or settled framing change appears in the 48 matched poses.

The 0.575→0.58 handoff now holds both registration and image integrity. Candidate 03's Noah Next 0.58 shows striped lower silhouettes, protruding supports, and muddy self-shadowing. Candidate 04's matched pose keeps all figures and animals clean against the ark print, without exposed support triangles. The progression through 0.7 grows the stage gradually from the registered print scale, and phase 1.1 restores the full-size upright scene and grounded shadows. The same improvements hold for Eden, Previous, and phone framing.

Reduced-motion loading retains the complete outgoing carpentry stage until the complete destination is ready. Normal loading likewise avoids a partially built upright destination. The already-updated destination text beside the held source stage remains a brief semantic mismatch, but this behavior predates candidate 04. The supplied candidate and handoff checks contain no recorded errors across 48 and 32 poses respectively.

**Strongest remaining defect:** the unfolding backdrop still crosses directly in front of the actors at phase 0.85. In Noah Next desktop, the dark ark panel obscures the family's torsos while their heads and legs remain visible on opposite sides; Eden has the same temporary horizontal bar. This is a clear but inherited transition pose, not a candidate 04 regression. Some softness also remains where the live flat illustration replaces the printed capture, though the severe striping and false support silhouettes are gone.

Fixed five-point rubric: 1 absent/broken, 2 rudimentary, 3 coherent but limited, 4 polished with minor shortcomings, 5 directly demonstrated reference-level. Scores are review judgments, not user approval.

| Criterion | Round 12 | Round 13 | Evidence / limit |
| --- | ---: | ---: | --- |
| Room atmosphere / grounding | 3.7 | 3.7 | No room change assessed |
| Physical book choreography | 4.2 | 4.4 | Complete folded figures, registered scale growth, clean flat-stage layers, and preserved reduced loading materially improve continuity; the 0.85 backdrop crossing remains |
| Popup depth / character acting | 4.2 | 4.2 | Settled acting, depth, and shadows are restored unchanged; the gain is concentrated in the transition |
| Reading composition | 4.1 | 4.1 | Settled desktop and phone framing remains clear; the held-source/destination-text mismatch remains during loading |
| Tactile interaction | 3.6 | 3.6 | Frozen poses and assertions do not demonstrate perceived response quality |
| Sound atmosphere | Unassessed | Unassessed | No listening evidence |

Candidate 04 is the strongest round 13 version. It repairs the cropped figures and reduced-motion blank state, removes candidate 01's scale snap, and resolves candidate 03's striped/support-heavy live handoff without changing the full upright scene.
