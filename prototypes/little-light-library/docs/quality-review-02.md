# Independent review of quality round 02

Historical review: raw iteration captures and recordings were deleted during repository cleanup. The observations below record checks performed at the time; removed evidence is not available for reinspection. Current verification is in [review/latest](../review/latest/).

Reviewed the live local prototype in a separate headless Chrome session at **1366×768, 1004×1324 and 360×800**. Entered the room, activated each figurine's labeled control, opened Eden, sampled the opening at four times, read/advanced the first two spreads, then opened Noah and advanced through the flood and aftermath. These observations use captured pixels plus the runtime's scene telemetry. No claim is made about hearing the music, effects or narration, or watching continuously rendered video. I authored the small actor-deformation module; this is an independent integration review, not a blind review of that module.

Evidence is in `review/02-choreography/independent/`. `observations.json` records room/hinge/aftermath state and `flood-observations.json` records the actual fourth flood spread. Every viewport has room, all three figurine activations, Eden 01 at actor times 12 and 15, Eden 02, Noah 04 and Noah 06 captures. Desktop additionally has four opening frames. The frozen review clock snaps the camera to its final target and settles page hinges, so those stills deliberately do not prove camera easing or timing. Opening frames were captured with the review clock disabled.

## What is materially better

The room now reads as a room: a corner, boarded floor, bed, window, substantial bookcase, table and lamp establish scale and perspective. All three figurines are visibly supported by their bases and shelf at all three sizes. Telemetry also places every base bottom at the same 2.99 shelf surface height. There is no reproduction of the previously reported floating figurines in these captures.

The book now occupies the tabletop and has a thick cover, cream leaves, gutter and ribbon. Sampled opening frames and hinge telemetry show a closed cover, an intermediate hinge angle and a flat open leaf; the popup hinges reach an upright orientation afterward. The characters and tree are separate from the rear illustration, with visible shadows on the pages. This is a substantial improvement over the prior picture-frame presentation in `review/01-room-and-book/before/eden-1366.png`.

At all three tested sizes the narration, playback controls and story navigation remain readable and unclipped. Tablet places its reader below the stage instead of over it; desktop keeps the panel to the right. Adam/Eve do not obscure each other's faces. Two frozen actor poses show slight head/hand differences, with intact faces and no obvious torn wrists. Their feet remain planted. These observations support gentle life, not expressive narrative acting.

## Three highest-priority issues

1. **The story is still mostly narrated beside a generic stage, rather than acted out.** Eden 01 and 02 reuse almost the entire composition; Eve's arrival is the principal visible narrative difference. The actors retain their painted standing poses and their tiny gesture differences are difficult to perceive at mobile reading scale. Noah 04 makes the limitation clearer: the ark is baked into the rear painting, while the separate wave layer lies across otherwise empty paper. It cannot visibly lift or respond to the water as the narration describes. Noah 06 returns to a lone standing portrait. Next pass should stage a few explicit narrative beats: an independent ark silhouette above layered waves, page-specific props/poses, and a clearer response between Adam and Eve. Preserve the attractive illustrations, but give the important moving subject its own layer and a specific action. Merely increasing global sprite sway would not solve this.

2. **The opening has moving parts but does not yet read as a convincing paper mechanism throughout.** The desktop intermediate opening frame (`1366-opening-3.png`) shows the left paper rising through the tree's lower trunk while the actor stands almost upright beside it. That contact/intersection makes the popup look separately inserted rather than attached to the unfolding leaf. The settled arrangement is much better. Attach each standee hinge to its supporting leaf or delay its erection until that leaf is sufficiently flat, and inspect the intermediate quarter/half/three-quarter opening frames. The large rear rectangle is useful scenery but should also remain visibly supported within the book's paper structure throughout the fold.

3. **The narrow room view shrinks the discovery targets and exposes empty space.** In `360-room.png`, approximately the upper fifth below the header is dark background before the room begins. The room is shown as a distant cutaway; the figurines are only a few dozen pixels tall and the foreground table occupies much more attention than the bookcase. The buttons remain usable, but this weakens the room's tactile invitation. Use a narrow-screen camera target/framing closer to the shelf, retain enough table for orientation, and fill the scene background naturally. Desktop/tablet framing already fares considerably better; avoid degrading it to fix mobile.

## Scores and retention decision

Scores use the existing five-point rubric: 1 absent/broken, 2 rudimentary, 3 coherent but limited, 4 polished with minor shortcomings, 5 demonstrated reference-level. Baseline values below are the existing round-01 baseline, corroborated for reader composition by its saved desktop still; this reviewer did not replay that old build. Current scores are this reviewer's judgment, not user approval or proof of parity.

| Criterion                      | Recorded baseline | Current review | Basis / limit                                                                                 |
| ------------------------------ | ----------------: | -------------: | --------------------------------------------------------------------------------------------- |
| Room atmosphere / grounding    |               1.5 |            3.2 | Coherent furniture, support and depth; weak mobile framing                                    |
| Physical book choreography     |                 1 |            3.0 | Sampled actual hinges and popup erection; intermediate contact artifact                       |
| Popup depth / character acting |                 1 |            2.7 | Strong separation/shadows, but understated generic acting and painted ark                     |
| Reading composition            |                 2 |            3.8 | Readable, unobstructed at all three sizes                                                     |
| Tactile interaction            |               1.5 |            2.8 | Figurine activation visibly tilts; camera/book staging present; no continuous motion judgment |
| Sound atmosphere               |        Unassessed |     Unassessed | No listening evidence from this review                                                        |

**Retain this direction. Do not mark reference parity achieved.** The highest return next pass is scene-specific stagecraft and visible narrative action, followed by mechanically grounded folds and narrow-screen room composition. No browser page errors occurred during the exercised flows. That functional result does not remove the qualitative deficits above.
