# Detailed Tripo Nativity family

16 September 2026. Ready for visual review; not a release or final scene acceptance.

## Result

Replaced Mary and Joseph's seated Pixal3D staging models with directly posed Tripo v3.1 models. Regenerated the baby and manger with detailed textures. All three reuse their existing isolated ImageGen references. The adults retain eight-second locally authored breathing/head idles, with the stools, feet and lower robes fixed. The baby remains static.

Preserved the adults' inward placement and scene rotations and the baby/manger scale of 0.81225. Corrected the generated source orientations inside the assets (Mary −90°, Joseph −75° around Blender Z). Uniform preparation retains source UVs, topology and normal maps with matte nonmetallic materials. No new reference generation or Tripo animation jobs were needed.

| Model | Triangles | Base height | Runtime file |
|---|---:|---:|---:|
| Mary | 57,320 | 1.25 m | 4.41 MiB |
| Joseph | 57,392 | 1.35 m | 4.29 MiB |
| Baby and manger | 56,736 | 0.72 m before scene scale | 4.11 MiB |

The adults have approximately half the geometry of the Pixal3D staging versions. Source textures are 4K; lower triangle counts do not imply lower texture memory. Device performance optimization remains separate work.

## Review

- [Before](before.png) and [after](after.png): same debug Nativity camera and landscape viewport.
- [Portrait](portrait.png): 390 × 844 viewport; family remains readable.
- Standalone front, side, rear and alternate idle-pose renders are retained with each asset.
- Faces, fingers, robes and the manger read more clearly in this pass. Generated hair and unseen details remain approximate; the adult rigs only support small idle movements.

## Validation

- `verify-nativity-area.mjs`: passes with the actual runtime models, independent sheep/adult idles, reduced-motion and paused-state holds.
- `verify-nativity-arrival.mjs`: passes arrival, framing state, deliberate ending, pause and reset checks.
- `verify-seated-idle.py`: actual deformed vertices confirm zero lower-body displacement, visible head motion and a closed loop for both exported adults. Reports live in each asset's `tripo-prepared/motion-review.json`.
- Both settlement maps regenerated from current geometry.
- Browser landscape and portrait visual checks, capture and resume passed; no browser console errors recorded.
- Runtime source records and publication hashes updated. Full portal build remains blocked by the pre-existing public-review hash mismatch at `prototypes/shepherd-adventure/index.html`.

## Assets and reproduction

- [Mary](../../../../assets/characters/mary-nativity/README.md)
- [Joseph](../../../../assets/characters/joseph-nativity/README.md)
- [Baby and manger](../../../../assets/characters/jesus-manger/README.md)

Prepare the posed sources with `projects/pixal3d-assets/prepare-posed-character.py`, using the height and orientation from `tripo-prepared/mesh-review.json`. Add adult idles using `animate-seated-character.py`, then run the Blender motion verification with `--python-exit-code 1`. Previous sources, staging models and editable rigs are retained in the library.

The scene retains its existing Luke 2:16 grounding and artistic interpretation of garments, stools and shelter. No dialogue, chronology or character knowledge changed.
