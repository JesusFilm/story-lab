# Little Light Library visual guide

Current style for the Little Light Library prototype. [Eden garden reference](references/eden-garden.png) is the primary painted anchor; it was generated for this project, not a historical reconstruction.

## Visual intent

A well-loved picture book in a warm child's room. The art is dense, hand-painted gouache and watercolor on visible paper grain. Natural but expressive faces, readable silhouettes, layered leaves, fabric folds, and subtle irregular edges carry detail. Painted artwork dominates; simple wood, paper, metal, and cloth geometry gives it a tactile setting. A gentle amber lamp and cooler window fill shape the bedroom. Movement is restrained and never necessary to understand the story.

## Story treatment

People of the Genesis stories have Middle Eastern appearance, natural proportions, simple linen garments, and human expressions. Eden begins abundant and luminous, then narrows into uncertainty, sorrow, and a difficult landscape. The flood is large and dangerous. The ark is a massive timber structure that dwarfs people and trees. Waves and dark skies show peril; non-graphic distant staging can establish human loss. Do not turn the flood into a cheerful boat ride. The covenant is hopeful with the destruction still remembered. Do not picture God as a human figure.

## Asset rules

- Artwork: 1536×1024 landscape source, no baked lettering, cover title, UI, border, or watermark. Keep crop-safe subject placement across the book gutter. Runtime WebP at quality 84; preserve the generated PNG source outside the runtime and the exact prompt in `prototypes/little-light-library/docs/visual.md`.
- Cutouts: isolated painterly subject with real alpha, unclipped edges, and paper-theater placement at modest depth. Do not fake depth by duplicating the whole backdrop.
- Geometry: plain timber, cream page block, brass trim, and simple stable props. Opaque matte materials with soft shadows; no shiny plastic. Models for 3D generation should be isolated with neutral light and clear shape before any painted bedroom lighting.
- Room: books and figurines must read at ordinary laptop and phone sizes. Cover words are rendered from the chosen locale, never baked into art.

## Reference set

- [Eden garden](references/eden-garden.png): palette, foliage, painted texture, and distant scenic depth.
- [Flood spread](../../prototypes/little-light-library/public/assets/art/noah-04.webp): ark scale and serious storm treatment.
- [Transparent tree](../../prototypes/little-light-library/public/assets/art/eden-tree.webp): physical paper layer and alpha edge standard.

## Theatre revision — architectural and motion reference

[Room theatre study](references/room-theatre-study.png) is the new atmosphere target: honey oak, dusty teal wainscot, brass lamp, quilted bed, blue window fill, enclosed corners and strong contact shadows. It is a direction image, not a screenshot of the current implementation. Match warmth, scale, material variation and composition; do not claim the runtime already matches its finish.

The book must be a physical object on the table. A selection travels from its shelf to the reading surface; the cover pivots around the spine; scenery folds from paper hinges after landing. Standees stand perpendicular to the paper with visible cast shadows and paper supports. No duplicated painted people behind the actors; use the new empty theatre plates. Faces and gestures stay clear of foliage and the reading card.

Actors remain planted on their paper tabs. Head, shoulders, hands and garments can act independently; moving an entire rigid card up and down is not character animation. Distinguish welcoming, warning, sorrow, work and hope. Use subdued motion and minor-mode ambience during judgment; never make the flood jaunty. Reduced motion shows a fully unfolded static stage. Sound is subtle beneath narration and respects mute, volume and tab visibility.

Runtime review must include small/intermediate windows, not only a wide screenshot. A room improvement that makes books or figurines hard to find is a regression. A character must never float above its base or stand beyond the cabinet. See the [iterative review log](../../prototypes/little-light-library/review/README.md) for evidence and current scores.

## Room material refinement

[Botanical wallpaper source](../../assets/textures/little-light-botanical-wallpaper/botanical-wallpaper-source.png) supplies a restrained cream, sage and ochre material palette. Keep motifs small enough to read as wallpaper, with the books and figures dominant. Preserve the same world scale on adjoining walls. Woven quilts, stitched edges and soft folded linen should carry the handcrafted quality of the paintings into the room. Cool window color balances the amber timber and lamp; avoid a noisy or high-contrast landscape behind the story. Runtime evidence, not this source tile, determines acceptance.

## Printed stage surfaces

[Garden ground](../../assets/textures/little-light-garden-floor/README.md) connects a garden backcloth to planted characters with quiet earthy detail and restrained foliage. Print on the horizontal paper while preserving cream margins, the gutter, ribbon and readable cast shadows. It must still look like a crafted book, not an opaque terrain slab. Keep characters dominant and do not carry lush garden staging into exile or flood scenes.
