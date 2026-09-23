# Eden paper-theatre art

This folder is the source catalog for new Eden staging art. Read-aloud text, all nine locale files, narration, full-spread illustrations, and the published review index remain separate:

- Story text and localized titles: [public/content](../../../public/content/)
- Existing page illustrations: [public/assets/art/eden-01.webp–eden-08.webp](../../../public/assets/art/)
- Eden/Noah staging types and directions: [src/eden-stage-direction.ts](../../../src/eden-stage-direction.ts) and [src/stage-direction.ts](../../../src/stage-direction.ts)
- Per-page passages, text, cues, and scene notes: [docs/books/eden.md](../../../docs/books/eden.md)
- Localized measured narration: [public/audio-manifest.json](../../../public/audio-manifest.json) and [public/assets/audio](../../../public/assets/audio/)

Each active image has an editable original PNG under `source-art/`, its production prompt under `prompts/`, and a runtime WebP under `public/assets/art/theatre/`. Transparent foreground cutouts retain alpha in both formats. Runtime images use WebP quality 84.

## Active art catalog

| Asset                    | Use                                                                                                                                                                                                 | Source PNG                                                                  | Prompt                                                                   | Runtime WebP                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Continuous garden ground | Flat opaque floor print for Eden pages 1–5; fills both pages and meets the garden backcloth.                                                                                                        | [continuous-garden-ground.png](source-art/continuous-garden-ground.png)     | [continuous-garden-ground.txt](prompts/continuous-garden-ground.txt)     | [continuous-garden-ground.webp](../../../public/assets/art/theatre/continuous-garden-ground.webp)     |
| Fig-leaf hiding screen   | Low, transparent foreground foliage on page 4; covers lower bodies while leaving the characters’ faces visible.                                                                                     | [fig-leaf-hiding-screen.png](source-art/fig-leaf-hiding-screen.png)         | [fig-leaf-hiding-screen.txt](prompts/fig-leaf-hiding-screen.txt)         | [fig-leaf-hiding-screen.webp](../../../public/assets/art/theatre/fig-leaf-hiding-screen.webp)         |
| Guarded-way backcloth    | Natural rocky opening between the garden and exile on page 6, with a small symbolic band of firelight across the path. It does not depict God or an angel and does not change the narrated account. | [eden-guarded-way-backcloth.png](source-art/eden-guarded-way-backcloth.png) | [eden-guarded-way-backcloth.txt](prompts/eden-guarded-way-backcloth.txt) | [eden-guarded-way-backcloth.webp](../../../public/assets/art/theatre/eden-guarded-way-backcloth.webp) |
| Exile earth ground       | Flat opaque dry-earth print used on pages 6–8. The muted brown surface bridges the backcloth and paper stage.                                                                                       | [exile-earth-ground.png](source-art/exile-earth-ground.png)                 | [exile-earth-ground.txt](prompts/exile-earth-ground.txt)                 | [exile-earth-ground.webp](../../../public/assets/art/theatre/exile-earth-ground.webp)                 |
| Fieldwork tools          | Separate hoe, basket, barley, and seed pouch on page 7, supporting the work scene without attaching a tool to an actor’s hand.                                                                      | [fieldwork-tools.png](source-art/fieldwork-tools.png)                       | [fieldwork-tools.txt](prompts/fieldwork-tools.txt)                       | [fieldwork-tools.webp](../../../public/assets/art/theatre/fieldwork-tools.webp)                       |

## Page staging map

| Page | Backcloth                     | Ground                   | Additional staging                                                                                                                                           |
| ---- | ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–3  | Garden                        | Continuous garden ground | Existing Adam/Eve pose atlases; page 3 retains the interactive serpent-and-branch prop. Eve faces Adam on page 2.                                            |
| 4    | Garden                        | Continuous garden ground | Existing sad poses sit behind the low fig-leaf screen; the painted faces stay unobscured.                                                                    |
| 5    | Garden                        | Continuous garden ground | Existing consequence scene, tree, and actor poses.                                                                                                           |
| 6    | Guarded-way natural backcloth | Exile earth ground       | Existing Adam and Eve figures leave the lush garden for the dry land. The firelight is a symbolic visual cue for the guarded way, not a human divine figure. |
| 7    | Exile                         | Exile earth ground       | Adam and Eve use their neutral working poses; the independent fieldwork-tool group suggests cultivation.                                                     |
| 8    | Exile                         | Exile earth ground       | Hopeful actor poses remain on the dry landscape; no Eden fruit tree is staged outside the garden.                                                            |

The older `garden.webp`, `exile.webp`, `eden-tree.webp`, actor-pose atlases, and `serpent-branch.webp` remain shared legacy runtime art. Full-page Eden illustrations remain in `public/assets/art/eden-01.webp` through `eden-08.webp`; they are not substitutes for the layered stage backcloth, horizontal ground, and cutout contract.
