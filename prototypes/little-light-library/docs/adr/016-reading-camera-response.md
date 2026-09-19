# ADR 016 — brief camera response to paper-character activation

Status: candidate03 retained after independent visual review and full scene acceptance.

The room already offers bounded inspection, while a paper-character activation originally changed only the actor pose and local name. In round22, fresh StoryComet play showed that tapping Otto also changed the scene framing while its reading card stayed fixed. We test that spatial feedback in the existing full-spread reader.

Keep the authored reading camera as the permanent baseline. Character activation supplies bounded additive camera and look offsets: a small move closer plus horizontal emphasis toward the selected actor. Ease in, hold briefly, and return completely by2.4 seconds. A rapid new activation starts from the current offset instead of adding another zoom. Text and controls retain their layout. Reduced motion receives the existing static actor/name feedback and no camera movement.

The response is allowed only when the paper stage is complete and upright. Loading, folding, closing, page replacement and room return cancel it. Existing deterministic captures remain unchanged unless the optional fourth `libraryReview` argument explicitly supplies a focus age; this freezes a chosen camera sample along with actor and folding clocks. Camera/look offsets and selection are exposed in the local debug object for repeatable interaction checks.

Candidate01 failed visual acceptance: focus on Noah in the wide family spreads clipped the opposite-edge adult at phone and desktop widths. A small numerical offset is not intrinsically safe. Candidate02 accounts for the projected extent of the whole narrative ensemble, preserving baseline clearance before accepting camera movement. Candidate03 fixes the narrow-view selection to use canvas width below600px rather than aspect ratio. Ordinary paired Eden scenes retain their directional response; phone family spreads use smaller offsets even before projected clearance limiting. The guard checks actor and family bounds at activation, preserving existing tight edges and a 3% viewport margin where space allows. It does not replace authored story staging.

Evidence: [quality review](../quality-review-22.md), matched captures, `scripts/reading-focus-review.mjs`, and actual-touch/keyboard checks in `scripts/reading-focus-check.mjs`. The latter is part of scene/full acceptance. Stills and positional assertions establish framing and behavioral correctness; they do not prove perceived easing, rhythm or sound quality.
