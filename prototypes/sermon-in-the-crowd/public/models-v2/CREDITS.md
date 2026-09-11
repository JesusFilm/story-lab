# V2 free model credits

All third-party 3D source assets selected for V2 are dedicated to the public domain under **CC0 1.0**: https://creativecommons.org/publicdomain/zero/1.0/

These licenses cover the models and source motion clips, not the JESUS film audio or subtitles.

| Source | Author | Used in V2 | Source / license evidence |
| --- | --- | --- | --- |
| Universal Base Characters, free Standard edition | Quaternius | Male and female humanoid anatomy, eyes, brows, long/parted/buzzed/bun hairstyles, beard | https://quaternius.com/packs/universalbasecharacters.html · LICENSE-bodies.txt |
| Modular Character Outfits – Fantasy, free Standard edition | Quaternius | Peasant tunics, sleeves and hands; lower belt/tail geometry trimmed | https://quaternius.com/packs/modularcharacteroutfitsfantasy.html · LICENSE-outfits.txt |
| Universal Animation Library, free Standard edition | Quaternius | Idle, talking idle, walking, formal walking, crouching idle, sitting idle, sitting talking | https://quaternius.com/packs/universalanimationlibrary.html · LICENSE-animations.txt |
| Monk, original MONK_1.blend | CDmir; collaborator TinyWorlds | Lower robe geometry, weights and cloth texture, fitted to the target rig and recolored | https://opengameart.org/content/monk · explicitly CC0 on original download page |

The separate “Monk animated” derivative has a different CC-BY-SA license and is **not used**.

## Adaptations in this project

- Assembled six variants from these artist-made meshes. No V1 primitive anatomy is used in V2.
- Used the plain male Quaternius tunic/sleeve parts on both body types to avoid the female outfit’s corset and gloves and the lower CDmir robe; retargeted robe weights to the human rig, fitted the waist, removed original sleeve fragments and source boots and occluded anatomy, and retained the base model's bare feet/lower legs.
- Added a small original cloth sash to bridge the garment join; standardized all variants on the same Quaternius skeleton.
- Added subtle jaw opening, mouth width, eyelid and brow morph targets locally. These are not supplied ARKit/viseme shapes. The face uses a closed mouth mesh and restrained deformation; there is no tongue/teeth animation or phoneme-accurate lip sync.
- Corrected animation rest-pose differences, preserved target bone lengths, retained pelvis movement, and selected seven relevant clips. Teacher walk phase follows traveled distance; film-timed gestures and head turns overlay the library animation.
- Desaturated/tinted garment textures; fitted hair; simplified hair shading; resized texture maps to at most 512 pixels and embedded JPEGs in GLBs.
- Human proportions, body type, garment fit, head shape and animation are stylized. The free human bases are athletic. Clothes are adapted from fantasy/medieval assets; this is an approximate Galilean-inspired study scene, not archaeological evidence.

Downloaded 10 September 2026. Original author archives and the unmodified robe are preserved in the ignored local `.cache/free-models/` directory. Reproduction scripts and SHA-256 records live in this project. No account, payment or paid Source-edition asset was used.
