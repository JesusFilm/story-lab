# Research and implementation decisions

## Direct observation, 19 September 2026

The live [StoryComet](https://storycomet.app/) opened without account access. Browser inspection showed a wood shelf with dimensional illustrated covers, small shelf objects, a lamp and toy train. Selecting Otto moved its closed book to a tabletop and exposed an explicit Open the book button. Activating it visibly rotated a hinged cover and exposed page-navigation and narration controls. The initial download showed real byte/resource counts. Browser session ended before a settled illustrated spread and sustained narration could be inspected; this session did not verify audible narration quality or word synchronization. No underlying architecture is inferred from appearance.

The first-party page claims read-aloud narration, word highlighting, pop-up scenes and five languages. These remain claims where not directly exercised. Earlier [project source notes](../../../game-concepts/little-light-library/source-notes.md) separately document observation of the creator's demonstration, including layered scenes, reading panel and Japanese text; those are not new live tests.

## Dimensional illustration decisions

[Three.js material documentation](https://threejs.org/docs/pages/Material.html) documents alpha testing and transparent materials. Its [renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html) cautions about transparency sorting. Use opaque backdrops and separated cutouts with alpha testing where possible, explicit depth separation, modest plane counts and no overlapping translucent effects. Artwork supplies detail; simple geometry supplies shelves, pages, supports and room forms. Frame the scene to its actual container, use one renderer and cap pixel ratio. Dispose replaced geometry/materials/textures; lazy-load the selected story art.

A restrained opening/page tilt establishes a physical book. Reduced motion removes decorative movement. UI remains DOM text for legibility, localization and keyboard access; essential meaning never depends on a visual effect.

## Production and verification limits

No reference artwork or source code was copied. Original image prompts and output provenance live with new assets. The acceptance matrix and milestone state distinguish measured results from intended behavior; agent editorial review is not human review.


## Integrated visual review

All sixteen original paintings were inspected using the Eden and Noah contact sheets. Eden visibly moves from abundance through temptation, hiding, judgment, exile and toil. Modest clothing before the Fall, architecture, depicted faces and guardian form are illustrative staging rather than textual details. Noah art conveys an enormous ark, threatening waves and distant non-graphic peril. The first Noah set inaccurately included children in the ark family; it was returned for replacement with adult sons and daughters-in-law. A visible open door in the flood was also returned for correction. These are agent visual checks, not historical reconstruction or family testing.
