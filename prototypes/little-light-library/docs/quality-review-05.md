# Integration review of quality round 05

Historical review: raw iteration captures and recordings were deleted during repository cleanup. The observations below record checks performed at the time; removed evidence is not available for reinspection. Current verification is in [review/latest](../review/latest/).

Reviewed the paired Eden 02 captures in `review/05-touch/before/` and `review/05-touch/after/`, the saved desktop/mobile interaction results, and the scene's selection/reaction integration. **I implemented `paper-actor.ts`, so this is an integration review, not a blind review of that module.** No browser was launched for this review. Continuous motion, perceived response latency and sound remain unassessed.

**Retain the pass.** Before, the idle and tap stills give almost no clear indication of which character was touched. After, tapping Eve produces her name above her own head, a subtle warm change and a changed local pose while Adam remains unselected. The result is legible at both 1366px and 360px widths without covering the narration or Eve's face. The Japanese capture correctly shows `エバ`; keyboard selection has a visible focus outline. The label is now the clearest immediate acknowledgment of interaction.

The saved results report actor 1 selected, blank paper ignored, keyboard activation working and the localized label at both sizes. Source inspection supports that scope: ray hits check texture alpha, selection targets one actor, the reaction envelope is passed only to that actor, and authored moods are preserved. The reduced-motion branch supplies static highlighting without deformation. These are stronger evidence than merely seeing a reaction callback in source, but they do not prove all possible overlap/pose/locale combinations or smooth animation.

**Top remaining defect:** the touch response still communicates identification more strongly than character behavior. In the mobile pair, the name tag is obvious while the hand/head change is slight at reading scale. This is a useful tactile improvement, but not yet evidence of the reference's expressive, responsive character acting. The next live comparison should establish whether the full nod/gesture is perceptible and satisfying at ordinary speed; if it is not, give each narrative pose a distinct, restrained response rather than adding whole-sprite sway or more generic glow. Preserve sad/warning moods and planted feet. The outstanding scene-specific omissions/material issues recorded in rounds 03/04 are not resolved by this interaction pass.

Fixed five-point rubric: 1 absent/broken, 2 rudimentary, 3 coherent but limited, 4 polished with minor shortcomings, 5 directly demonstrated reference-level. Scores remain review judgments, not user approval.

| Criterion                      |   Round 04 |   Round 05 | Evidence / limit                                                                          |
| ------------------------------ | ---------: | ---------: | ----------------------------------------------------------------------------------------- |
| Room atmosphere / grounding    |        3.6 |        3.6 | Not changed by the inspected pass                                                         |
| Physical book choreography     |        3.6 |        3.6 | No new continuous-motion assessment                                                       |
| Popup depth / character acting |        3.8 |        3.8 | Selected pose changes locally; stills insufficient to increase acting score               |
| Reading composition            |        3.9 |        3.9 | Labels avoid faces and reader in checked views                                            |
| Tactile interaction            |        2.8 |        3.6 | Target-specific visible feedback, alpha-aware selection, keyboard access and localization |
| Sound atmosphere               | Unassessed | Unassessed | No listening evidence                                                                     |

This pass materially improves the weakest previously assessed criterion. Full reference parity remains unproven, particularly for continuous acting and sound; a higher tactile score should not be used to conceal those evidence gaps.
