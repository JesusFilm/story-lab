# Follow the Light

The shared visual grounding for Follow the Light images and 3D assets.
Use this guide together with the specific asset description and relevant reference
images. Asset details and technical constraints belong with the individual asset.

## Visual intent

Polished semi-realistic AA 3D game art with natural proportions, tactile practical
materials and clearly readable silhouettes. Reverent, hopeful, welcoming and calm.
The atmosphere is cinematic, with restrained painterly softness in distant scenery.
The source is the artwork displayed by the gallery, not its HTML typography or colors.

The three **Follow the light** scenes are primary anchors. The gallery's Jerusalem
section is a separate draft game; its gameplay and brighter daytime staging do not
become requirements here. Existing prompts already describe this style consistently;
this document consolidates them into a reusable asset guide.

## Form and silhouette

Grounded human anatomy and natural facial proportions, expressive but understated
faces, believable hair masses and garments with visible construction. Simplify small
details enough to read at game-camera distance. Avoid exaggerated heads, muscles or
plastic-looking faces. Garment folds should have clear volume rather than noisy relief.
Children retain age-appropriate proportions; the swaddled baby remains a distinct asset.

Environment forms are sturdy, irregular and readable: low limestone buildings,
simple flat roofs, rough timber, clear doors and windows, woven awnings, modest props.
Use the asset brief for exact clothing, identity, dimensions and modular boundaries;
a shared style does not give every person the shepherd's vest or face.

## Palette, materials and detail

Base materials: oatmeal/cream linen, ivory wool, sand and warm limestone, dusty earth,
muted clay, brown leather and rough wood. Muted blue cloth is supported by the Nativity
scene; it is not a universal wardrobe color. Stone and cloth should look matte, worn
and tactile, with restrained imperfections. Keep material identities distinct and
avoid uniformly shiny, smooth or excessively dirty surfaces.

Scene lighting: deep indigo/blue night with warm amber lamps and soft ivory angel or
destination light. Preserve visible paths and silhouettes within shadow. Warmth and
contrast provide much of the gallery's effect; they must be recreated in scene lighting,
not baked as permanent blue shadows or amber highlights into character textures.
Neutral reference lighting reveals true base colors. No fixed RGB palette is prescribed.

## Category rules and exceptions

| Category | Rules / exception |
|---|---|
| Characters and garments | Natural proportions, believable skin, woven linen, fleece, worn leather, simple pastoral clothing. Specific character/wardrobe choices belong in each brief. |
| Animals | Recognizable natural anatomy; wool and fur as readable masses with restrained detail. Neutral standing references; motion requirements stay separate. |
| Objects | Handcrafted timber, clay, straw, simple metal and textiles; isolate each asset. Lamps may have separate emissive parts, but do not paint illumination onto nearby objects. |
| Structures | Modest Judean-inspired limestone and timber forms, flat or simple shelter roofs, visible construction. Open fronts and shallow interiors follow the individual asset brief. Gallery silhouettes inform appearance; procedural tools control dimensions and seams. |
| Terrain | Dry earth, worn stone, sparse grasses and restrained irregularity. Scene dressing may not obstruct playable passages. Procedural ground remains the technical source. |

## Reference presentation


Humanoids: one isolated full-body front orthographic T-pose, empty hands, feet and
fingertips fully visible, neutral expression, square canvas preferred, soft even
neutral lighting and plain light gray backdrop. No text or multiple views on one input.
Additional views are separate files with consistent subject, wardrobe and scale.
Objects/animals use an isolated informative three-quarter view and intended stable pose.
Structures need visible openings plus a separate dimension/connector specification.
The shepherd sheet is a secondary identity and garment reference. Use a separate
isolated character view when generating a model.

## Exclusions

No chibi/anime proportions, toy-like plastics, exaggerated musculature, fantasy armor,
modern objects, medieval European castles, ornate church forms, logos, watermarks or
UI in asset references. Avoid excessive microdetail, merged props, multi-character
collages, clipped extremities, harsh cast shadows and baked cinematic lighting.
Angel wings, a star beacon, specific poses and witnesses are creative narrative
choices in the pack, not global style requirements or historical verification.

## Reference images

- [Angel in the field](references/announcement.png)
- [Follow the light](references/village.png)
- [Nativity arrival](references/nativity.png)
- [Shepherd identity reference](references/shepherd.png)

These reference images were generated with ImageGen. They guide visual design;
they do not establish historical accuracy.
