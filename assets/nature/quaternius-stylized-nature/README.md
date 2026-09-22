# Quaternius Stylized Nature selection

Non-Tripo, third-party models authored by **Quaternius**, from the free Standard
edition of the [Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html).
The creator's [OpenGameArt distribution](https://opengameart.org/content/stylized-nature-megakit)
also identifies the pack as CC0. These are artist-made source assets, not new AI
or Tripo generations.

License: **CC0 1.0 Universal**; the original license is retained in
[originals/License_Standard.txt](originals/License_Standard.txt).
Downloaded 11 September 2026 from the pinned public mirror commit recorded in
[provenance.json](provenance.json). That manifest records hashes of the original
files; no scripts from the download were executed. PNG metadata was later stripped
without changing pixel data; where that removed a chunk, the entry keeps the
mirror's hash and size as `upstream_sha256`/`upstream_bytes`.

## Selection and use

- `CommonTree_2`, `TwistedTree_1`, `TwistedTree_3`, `DeadTree_2`: broad and gnarled
  silhouettes plus a bare tree for the settlement outskirts. These are visual
  approximations for the established style, not species-accurate olive trees.
- `Rock_Medium_1`, `Rock_Medium_2`, `Rock_Medium_3`: three boulder shapes.
- `Pebble_Round_2`: small instanced ground stones.

The originals retain all selected glTF, binary geometry and texture dependencies.
Shepherd Adventure owns a separate copy in `prototypes/shepherd-adventure/assets/nature/`.
Its runtime export caps textures at 1024 pixels, selects the pack's uncoloured leaf
textures, and applies muted olive foliage and stone tints in code. Scale, rotation
and grouping vary deterministically. Source files remain unchanged.

[Runtime export manifest](runtime-export.json) records the independently copied and
adapted files. Other prototypes can copy these assets without using the Tripo pipeline.
