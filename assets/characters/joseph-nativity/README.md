# Joseph — Nativity

[Follow the Light style](../../../styles/follow-the-light/README.md).

A seated Tripo v3.1 character for Shepherd Adventure's final shelter, generated directly in the resting pose with detailed textures.

## Current model

- `joseph-seated-reference.png` and `.prompt.txt`: isolated ImageGen reference derived from the ending artwork.
- `joseph-seated-tripo-source.glb`: original generated model.
- `joseph-seated-tripo-provenance.json`: generation settings and source/reference hashes.
- `tripo-prepared/`: grounded, metre-scale static derivative, orientation and geometry report, and exported idle-motion verification.
- `joseph-seated-tripo-idle.glb` and `.blend`: current runtime model and editable three-bone upper-body rig.
- `tripo-renders/`: front, side, rear and a second idle pose of the exported model.

The eight-second breathing/head loop keeps the feet, stool and lower robe fixed. The rig supports restrained idle motion only, not walking or large gestures. It is authored with `projects/pixal3d-assets/animate-seated-character.py`. Source UVs, topology and detailed textures are retained; materials are matte and nonmetallic.

## Earlier variants

The seated Pixal3D source, `prepared/`, `joseph-seated-idle.glb`, its editable rig and `renders/` retain the earlier staging model for comparison. The standing reference, Tripo source and automatic rig are separate development variants and are not used in the current scene.

Faces, hair, hands and unseen surfaces remain generated approximations. Clothing, stool and pose follow the illustrated outro as artistic staging, not a historically verified reconstruction.
