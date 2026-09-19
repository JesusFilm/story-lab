# Paper theatre art pass

Original native ImageGen artwork for the popup book quality iteration. All six outputs were generated separately and visually inspected. No external artwork was copied. Runtime images are WebP quality 84 converted from preserved 1536×1024 PNG originals. Conversion changes format only; it does not generate or edit image content.

The current visual guide remains [Little Light Library](../../../styles/little-light-library/README.md). The new [room study](../../../styles/little-light-library/references/room-theatre-study.png) gives a concrete atmospheric implementation target: enclosed architectural volume, rounded oak furniture, teal wainscoting, quilted bed, warm brass task light against cool window light, and a visibly physical layered paper book. It is a concept reference, not a screenshot of the implemented prototype. Its decorative figurines and castle-like sample popup are mood placeholders, not Genesis assets to reproduce.

## Scenic plates

These images are deliberately empty stages. Human figures are never painted into them, so the implementation can animate separate articulated paper actors without leaving duplicate static figures in the scenery. They are background plates, not finished book spreads. Their lower central area is quiet and open for actor staging. They should stand behind distinct foreground/actor layers rather than masquerade as the entire popup experience.

| Runtime file | Inspected result | Intended use |
| --- | --- | --- |
| `public/assets/art/theatre/garden.webp` | Luminous garden, richly painted outer foliage, broad quiet clearing, no people or animals | Eden abundance and dialogue |
| `public/assets/art/theatre/exile.webp` | Dry ochre ground, thorns and distant green valley, no gate or figures | Exile and consequence |
| `public/assets/art/theatre/shipyard.webp` | Huge coherent timber structure, exposed upper beams, empty sawdust foreground | Ark construction |
| `public/assets/art/theatre/storm.webp` | Enormous enclosed ark, closed side door, serious dark waves, empty water foreground | Flood danger with separate wave layers |
| `public/assets/art/theatre/shore.webp` | Massive resting ark, open ramp, sparse recovering rocky land, quiet foreground | Leaving the ark and covenant |

All plates contain no lettering, UI, borders, human silhouettes, animals, or depiction of God. The ark is an illustrative interpretation, not an archaeological reconstruction. Its roof/hull design is broadly consistent between storm and shore; the viewpoint changes.

## Sources and exact prompts

The preserved sources and verbatim prompts live together in [the theatre reference folder](../../../assets/references/little-light-library/theatre/): `room-theatre-study.png`, `garden.png`, `exile.png`, `shipyard.png`, `storm.png`, and `shore.png`, each with a matching `.prompt.txt`. All were generated with the built-in ImageGen tool. No CLI/API fallback or paid third-party generator was used.

## Visual review limitations

The asset review confirms composition and absence of baked actors at full source resolution. It does not prove runtime book geometry, lighting, animation, crop, or readable stage placement; those require actual browser playthrough and matched captures in the quality iteration log.

## Acting and ark separation pass

The next pass separates the ark from the storm scenery and replaces a single standing pose with story-specific painted gestures. All new images were generated or edited with native ImageGen; Pillow only inspected alpha/dimensions and converted PNG to WebP. No external generator or image-removal service was used.

- `ark.webp`: entire closed-door timber ark, isolated in real alpha, matching the original storm hull and roof. 1536×1024. Its background has 874,569 fully transparent pixels; the large opaque painted areas are mostly alpha 252–253. Hidden RGB around the silhouette may appear dark in viewers that ignore alpha; the alpha channel is authoritative.
- `storm-open-water.webp`: 1536×1024 empty storm sea and sky, no vessel, people or animals. Pair with the independent ark and foreground waves so the ark can rock and rise as a distinct paper layer.
- `adam-poses.webp`: welcoming open palms, ashamed bowed head/hands near face, hopeful open palms. The first and third poses have similar hands but distinct posture and expression; they are not a frame-by-frame animation strip.
- `eve-poses.webp`: welcoming, hesitant fruit gesture, grieving. The fruit's species is unspecified. Clothing is illustrative staging, consistent with the existing prototype.
- `noah-poses.webp`: working with wooden mallet, gently holding a dove, thankful raised hands.
- `family-seven.webp`: 1536×1024 real-alpha group of exactly seven adults: an older wife, three grown bearded sons and three grown wives. Combine with a separate Noah to show eight adults. Visual head/body count confirmed; no children or extra patriarch. 385,201 fully transparent pixels.

The three pose atlases were requested at 3072×1536, but native ImageGen returned **1774×887**. Each uses three equal horizontal UV cells. Every final figure fits inside its cell. Runtime should account for the actual dimensions rather than assuming the requested dimensions. Per-cell alpha >128 bounds, in local cell pixels `(left, top, right, bottom)`, are:

| Atlas | Left pose | Middle pose | Right pose |
| --- | --- | --- | --- |
| Adam | 184,19,484,871 | 184,34,460,873 | 117,17,436,873 |
| Eve | 153,13,548,877 | 134,14,461,878 | 120,17,398,878 |
| Noah | 109,125,548,854 | 134,114,460,851 | 79,114,462,854 |

The initial Adam/Noah generations had a hand reaching across the first cell boundary; Noah's mallet also lacked top margin. Native targeted edits corrected those issues. Both initial sources and corrected `*-poses-aligned.png` sources are preserved with their exact prompts. Runtime Adam and Noah use the aligned versions; Eve uses its initial accepted output. The final poses have unclipped hands, feet and tools, clear silhouette gaps between cells and near-matched foot baselines. This verifies the bitmap inputs, not the final animated acting or page layout; those still need live review.

## Receding waters and olive dove pass

Native ImageGen produced two further original assets, each preserved with its exact matching `.prompt.txt` in the theatre source folder:

- `receding-water.webp`: 1536×1024 RGB gouache/watercolor plate. Quiet teal water, exposed rocky islands, distant mountains and restrained olive greenery under warming daylight. Inspected: no ark, boat, people, bird, rainbow or baked characters. The lower centre remains an open stage.
- `dove-olive.webp`: native 1254×1254 RGBA cutout (the requested 1024×1024 size was not the returned size). A white dove in flight with a large, dark sage olive sprig clearly separated from its breast. All feathers and leaves stay inside the canvas. Alpha ranges from 0 to 255, with 928,812 fully transparent pixels; alpha >128 bounds are `(54,38,1218,1185)`. The leaf cluster was deliberately specified large enough to remain legible on a small stage, unlike the tiny dove in Noah's hands.

WebP conversion preserves the native dimensions and alpha at quality 84. Full-source inspection establishes clear bird/leaf silhouette; actual 0.8-unit scene readability must be checked in the integrated book at desktop and intermediate window sizes. This asset report does not claim that a source image inspection proves runtime legibility.

## Narrative foreground props

Three native ImageGen cutouts add concrete story actions and subjects that cannot be conveyed by generic standing actors. Original PNGs and verbatim `.prompt.txt` files are preserved in the same theatre source directory; runtime WebP conversion uses quality 84 and preserves alpha.

| Runtime | Actual source dimensions | Fully transparent pixels | Alpha >128 bounds |
| --- | --- | ---: | --- |
| `serpent-branch.webp` | 1024×1536 RGBA | 1,176,691 | 40,12,992,1515 |
| `timber-bench.webp` | 1536×1024 RGBA | 1,009,963 | 50,162,1499,969 |
| `animal-pairs.webp` | 1932×814 RGBA | 1,106,350 | 25,168,1911,616 |

Visual inspection confirmed an upright woody fork with a lower stem reaching the cutout baseline, a natural olive-brown serpent coiled around it, its head extending clearly left, and only a few small leaves. There are no human features, limbs or wings. The trestle bench has rough broad timber, wooden pegs and a loose plank, with no hammer or person; its front-left three-quarter perspective is intended to meet Noah's independently held mallet.

The animal strip contains exactly four full adult bodies and heads: two woolly sheep (ram and ewe) followed by two goats, all facing right, with separated silhouettes and visible feet. The native tool returned a wider canvas than requested and substantial transparent top/bottom margin. The animal silhouette is roughly 4.2:1; use alpha-bound cropping and preserve its proportions rather than stretching it to an assumed source size. Their near-common hoof baseline supports a foreground procession. Source inspection confirms counts, shape and alpha; actual page fit and small-scale readability remain live integration checks.

### Boarding continuity correction

Live review found that the construction shipyard plate wrongly left exposed unfinished ribs behind the family during boarding. `boarding.webp` is a new original native ImageGen 1536×1024 RGB plate of a **completed** massive enclosed timber ark, dark open side door and broad ramp to dry ground under gathering storm clouds. Visual inspection confirmed no exposed construction ribs, no people or animals and a quiet empty lower foreground for the separate actors. The PNG and exact prompt are preserved as `boarding.png` and `boarding.prompt.txt`. The original shipyard plate remains appropriate for the earlier construction scene.
