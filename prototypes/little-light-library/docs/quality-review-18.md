# Independent quality review of round 18

Historical review: raw iteration captures and recordings were deleted during repository cleanup. The observations below record checks performed at the time; removed evidence is not available for reinspection. Current verification is in [review/latest](../review/latest/).

Reviewed all 48 matched settled reading views—every Eden and Noah spread at 1366×768, 768×1024, and 360×800—in `before/` and final `candidate-02/`. I also inspected all 40 final folding captures for Eden 02/03 and Noah 02/03 at fractions 0, 0.25, 0.5, 0.75, and 1 on desktop and phone in `folding-final/`. I did not inspect the implementation or launch a browser. Candidate 01 was rejected before final scoring because phone Noah 06 clipped Noah's raised left hand; candidate 02 keeps the candidate 01 desktop/tablet view and pulls the narrow camera back enough to restore that figure. These stills establish sampled framing and visibility, not perceived page-turn motion, performance, or sound.

**Retain candidate 02.** The baseline devotes a large part of the rendered book to empty foreground paper. Its figures and props are complete, but they sit at the far edge of a broad leaf and read more like small decorations than the story's active subjects. Compare baseline desktop Eden 01 with the candidate desktop Eden 01: Adam and the tree gain substantial presence, the backdrop becomes an enveloping setting, and the gutter, page surface, fore edge, and grounded shadows still make the object legibly a physical pop-up book.

The framing holds across different stage widths rather than working only for the first Eden scene. Candidate desktop Noah 03 keeps all eight adults' heads and bodies, four foreground animals, the ramp, and the ark readable. Desktop Noah 04 preserves the full ark and wave silhouette. Desktop Noah 08 keeps Noah, the seven-person family group, and the complete rainbow while making them considerably larger than the baseline. Tall Eden trees, the serpent, the dove frame, and the carpentry bench likewise remain within their story views.

Tablet receives the strongest balanced result. In Noah 03 the ensemble fills the upper panel without losing any head, animal, or book edge; Noah 08 gives the covenant image a clear visual hierarchy while the reading card remains fully separate. Across all 16 tablet captures the stage is larger and the former blank foreground is reduced, yet enough cream paper and the center ribbon remain to explain the construction.

The final phone correction is necessary and successful. Noah 06 now includes Noah's raised hand and robe with a small but visible margin. Noah 03 and Noah 08 keep the left-side Noah and the full family heads, while Eden 01 and 05 retain complete trunks, roots, and readable foliage masses. The actors remain more present than in the corresponding baseline phone views. Text, highlighted lines, story count, navigation, playback control, and top controls remain intact in all 48 final captures.

As supplementary evidence, `framing-measurements.json` reports a median interactive actor-target height increase of 9.6% on phone and 20.7% on tablet/desktop, with no measured target rectangle extending offscreen horizontally. Those rectangles are interaction bounds, not painted-silhouette or noninteractive-prop measurements, so the visual review above remains the basis for the cropping judgment.

The closer camera does crop more of the surrounding bedroom and outer tabletop at desktop, but this is appropriate for the reading state and does not erase the page, gutter, book edge, lamp, or shelf context. The wide Noah ensembles leave only narrow side margins on phone—Noah begins around 10–16px from the viewport in spreads 03, 06, and 08—so future pose expansion should retain explicit silhouette-margin checks. That residual pressure is minor in the final stills and does not justify reverting the much stronger subject scale.

The 40-pose folding follow-up shows no new framing crop regression. Desktop Noah 03 at 0.25 keeps Noah's raised hands, all family heads, and the animal row visible as the panels move forward; phone Noah 03 at 0.25 retains the same subjects within the narrower canvas. Phone Eden 03 at 0.5 keeps the folded stage and its shadow within the page view, and desktop Eden 03 at 0.75 preserves the page edges during the return toward flat. The familiar edge-on darkening and thin flat silhouettes remain visible at middle fractions, but the closer camera does not worsen their containment. The physical-book score therefore remains 4.4.

**Strongest remaining defect:** phone ensemble scenes still balance close to the left boundary, and the foreground paper remains visually plain even after being reduced. Further camera tightening would likely reintroduce clipping; the next reading improvement should come from page surface craft, stage grounding, or responsive per-spread composition rather than a universal zoom.

Fixed five-point rubric: 1 absent/broken, 2 rudimentary, 3 coherent but limited, 4 polished with minor shortcomings, 5 directly demonstrated reference-level. Scores are review judgments, not user approval.

| Criterion | Round 17 | Round 18 | Evidence / limit |
| --- | ---: | ---: | --- |
| Room atmosphere / grounding | 4.0 | 4.0 | Shelf room is unchanged; reading views intentionally show less peripheral room |
| Physical book choreography | 4.4 | 4.4 | Settled book context and all 40 sampled folding poses retain containment; perceived continuous motion remains unassessed |
| Popup depth / character acting | 4.3 | 4.3 | Larger subjects expose the existing depth and poses more clearly, but neither acting nor popup construction changed |
| Reading composition | 4.1 | 4.3 | All 48 views give the story stage more presence and reduce blank foreground while preserving critical figures, props, text, controls, and sufficient physical-book context |
| Tactile interaction | 4.0 | 4.0 | No interaction change assessed |
| Sound atmosphere | Unassessed | Unassessed | No listening evidence |

Candidate 02 should replace the baseline. It makes the illustrated stage the clear focus at every tested size and across all 16 spreads. The rejected candidate 01 phone crop shows why the final narrow margin should remain guarded rather than tightened again.
