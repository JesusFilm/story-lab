# Prototype assets

These files belong to shepherd-adventure. They are independent copies: changing the root
asset collection or another prototype does not update them. Copy anything useful
into your own prototype and adapt that copy.

[sources.json](sources.json) records the copied files, original paths and hashes.
The copied GLBs embed their textures and buffers. Generation records under
`provenance/` describe their origins and historical review status; they are not
required by the player. Existing Blender sources remain editable here.

## Portable lantern

`portable-lantern-tripo.glb` is the independent copy of the new Follow the Light AA
v003 lantern. Its source, reference, task, hash and runtime sizes are recorded in
`provenance/portable-lantern-tripo.json`; the approved image and prompt are in
`references/portable-lantern/`. Tripo generation cost 30 credits. The model is used
by all 22 carried, settlement and hearth lantern mounts. It is a static prop;
flame, glass emission and point lighting are applied at runtime.

## Settlement boundary and free nature models

`low-wall-perimeter.glb` is a lighter derivative of the existing low-wall kit.
`nature/` contains independent glTF files and their binary/texture dependencies from
Quaternius's free CC0 Stylized Nature MegaKit. They are **non-Tripo** assets;
`nature/LICENSE.txt` and `nature/provenance.json` retain licensing and source details.
The corresponding originals and manifests are in the root `assets/nature/` library.

## Nativity family

`nativity-family-pixal3d.glb` is the independent 1.8 m static family tableau.
Its embedded textures and geometry need no external library files. Five sheep
reuse `sheep-tripo-v2.glb` in a fixed idle pose around the new enclosure and shelter.
