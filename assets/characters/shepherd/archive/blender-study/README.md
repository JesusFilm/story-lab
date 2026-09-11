# Shepherd — reference-guided Blender study

**Status: model files deleted at Jaco’s request on 10 September 2026; historical study records retained.**

`shepherd.glb` and `shepherd.blend` were deleted and the library model entry removed.
See the deletion record. The nine historical render images were subsequently deleted too; see the
render deletion record. Scripts, source
dependencies and historic checks remain. The descriptions and reproduction commands
below describe the former model; the finished model files and listed render images are no longer available.
Jaco approved archiving this complete source package under the
[asset governance](../../../../README.md#approved-archive-policy). The package was physically archived on 10 September 2026; the original files were preserved at that time, before the later requested deletion. Original README/builder text is retained in `archive-originals/`.
This Blender-built GLB does not satisfy a Tripo pipeline model-existence check.
The separate playable walkthrough retains its own legacy placeholders.

An editable, static T-pose character based on `../../shepherd-reference-sheet.png`.
The model includes a human body, short curls, beard, eyebrows, eyes, knee-length
flax tunic, shearling vest, leather belt and sandals.

## Open the result

- **`shepherd.blend`** — editable model, materials, packed textures, original
  reference sheet, studio lighting and five cameras.
- **`shepherd.glb`** — simplified static export with embedded textures.
- **`renders/shepherd-turnaround.png`** — front, side and back render sheet.
- **`renders/shepherd-beauty.png`** — three-quarter render of the Blender model.
- **`renders/shepherd-detail.png`** — close-up for judging the face and materials.
- **`renders/glb-reimport-check.png`** — render of the actual reimported GLB.

Blender 5.1.2 was used. **No add-on, API key or computer-control setup is needed**
to open or render the saved Blender file. All images used by the model are packed
into it. The MakeHuman application and MPFB add-on are not required.

The model opens in material preview. The character parts are in
`SHEPHERD | editable parts`; cameras and lights are in `STUDIO | cameras and lights`.
Enable the `REFERENCE | toggle in viewport` collection to see the original sheet.
There is also an embedded `README | START HERE` text block and the construction script.

## What this experiment measures

The image was used as a visual modeling guide. The anatomy comes from a modified
MakeHuman base mesh; Blender Python constructs the outfit, accessories and grooming.
Several render-and-inspect passes corrected the pose, garment intersections, eye
placement and sandal attachments.

This is a recognizable prototype with approximate proportions, costume and material
colors. It falls short of the reference's AA-game finish. The face has limited likeness,
the curls and beard look procedural in close-up, and the cloth uses modeled folds
rather than a tailored cloth simulation or hand sculpt. The hair and fleece use mesh
strands, which cost more triangles than a finished game hair-card setup.

The character has **no animation rig, facial controls or LOD chain**. Clothing is
separate, overlapping geometry. The Blender file keeps the editable authoring parts;
the GLB applies modifiers, removes some covered body faces and reduces geometry.
The GLB uses standard PBR materials; Blender-specific skin subsurface scattering and
procedural pore bump are not included in that export.

Exact geometry counts and file sizes are in `model-stats.json`. Reimport checks,
dimensions and texture embedding results are in `verification.json`.

## Reproduce

From this directory, using the Blender executable on this Mac:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build_shepherd.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup shepherd.blend --python scripts/render_and_export.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/verify_export.py
python3 scripts/compose_turnaround.py
```

Blender includes the Python modules used by the modeling scripts. The optional
contact-sheet script uses Pillow. Source assets and generated texture maps are
retained locally; rebuilding requires the reference PNG two directories above this archive.

## Asset provenance

The anatomical mesh, morph targets, skeleton correspondence and source skin/eye assets
come from [MakeHuman](https://github.com/makehumancommunity/makehuman), whose core
assets are [CC0](https://static.makehumancommunity.org/about/license.html).
`sources/LICENSE.ASSETS.md` contains the asset license. `sources/manifest.json` and
`sources/skin-manifest.json` record the exact downloaded files and source URLs.
The original skin texture is retained; the model uses a separate tinted texture.

The reference image was generated in the preceding step of this conversation.

The reproduction helper now resolves the external reference at its new relative
path. Embedded scripts inside preserved `.blend` files may retain historical paths;
use the updated filesystem helper when rebuilding.
