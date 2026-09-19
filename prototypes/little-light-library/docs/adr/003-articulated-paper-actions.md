# ADR 003 — Articulate a paper limb without warping its painted tool

Status: accepted for the Noah construction spread, quality round07.

The original standing atlas supplies three authored Noah poses. A continuous mesh bend moved the working pose's mallet numerically but folded the painted hand/tool behind the body. The rejected rendered candidate is retained in the quality log. Larger vertex travel alone did not produce better acting.

For Noah's working mood, partition the existing fitted atlas plane into complementary body and forearm polygons. Clip triangles at the authored UV boundary and interpolate their texture coordinates. Rotate the forearm, hand and mallet as one rigid paper piece around the elbow, slightly in front of the body. This preserves the original painting and a recognizable tool through the stroke. The body retains restrained local motion. Align the separate timber prop with the lowest visible mallet pose.

The cut polygon and joint are specific to the shipped Noah pose0 alpha bounds; they are not a universal anatomy detector. A replacement pose must be measured and reviewed again. Other moods and reduced motion use the original full illustration. Hidden meshes cannot receive raycast hits, and all derived geometry is disposed with the actor. No new source raster or external dependency is introduced.

Tests check complementary UV area, rigid limb geometry, planted feet, reduced-motion restoration, hidden-mesh interaction and other moods. Desktop/phone captures decide silhouette and contact quality; tests cannot certify those. The accepted stills show a readable stroke/contact and a slightly stiff cuff. Continuous rhythm, acoustic response and reference parity remain unassessed. See [round07 review](../quality-review-07.md) and [iteration log](../../review/README.md).
