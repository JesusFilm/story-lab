# Nature texture provenance audit — 2026-09-23

`checks/verify-nature-assets.mjs` failed on `Bark_DeadTree.png`. This audit checked
every record for the Quaternius nature assets, not only the first failure. The
metadata-only history of the eight runtime PNGs is inferred, not proven: the
pre-strip runtime bytes are unavailable, so their former byte sequences cannot
be compared directly.

## Finding

The runtime and source PNGs are the intended files. Their manifests recorded
hashes from before the library simplification, which stripped PNG metadata without
recompressing pixels (see [library simplification](../../../docs/handoffs/library-simplification.md)).
The repository history shows no later asset-byte edits, but it does not recover the
pre-strip runtime bytes. The conclusion that the eight runtime PNGs changed only by
metadata handling is therefore an evidence-backed inference, not a byte-for-byte
proof.

Evidence:

- **Exact upstream proof boundary (two originals).** The pinned mirror bytes for
  `PathRocks_Diffuse.png` and `Rocks_Diffuse.png` match the recorded upstream hashes
  exactly. The repository copies differ only by a missing 21-byte `pHYs` (72 dpi)
  chunk. Their IDAT streams and decoded pixels are byte-identical to the mirror.
  This proves the metadata-only transformation for those two reconstructable source
  originals; it does not prove the unavailable pre-strip runtime bytes.
- **Supporting inference for the eight runtime PNGs.** The six bark textures,
  `PathRocks_Diffuse.png` and `Rocks_Diffuse.png` retain the expected PNG/zlib
  structure and documented dimensions. The stripped originals keep libpng's 8 KiB
  IDAT layout, while the downscaled runtime textures keep their resizer's different
  16 KiB/`78 01` layout. The six bark textures each lost exactly 80 bytes and
  `Rocks_Diffuse.png` lost 153. These observations are consistent with metadata
  stripping and resize output, but they are not proof of the missing historical
  runtime byte sequences.
- **Content matches the documented export.** Each 1024 px runtime texture differs
  from a bicubic 2048→1024 downscale of its canonical original by a mean of
  0.26–0.50/255, and alpha is unchanged. This is a faithful resize, not substituted
  art. The runtime `PathRocks_Diffuse.png` is already 1024 px and is byte-identical
  to the stripped canonical original.
- **Already reviewed for publication.** `projects/portal/publication.json` and
  `publication-inventory.json` already record the current hashes for all 29 nature
  files that ship.

## Changes

- Updated SHA-256 and byte counts for the eight runtime PNGs. This covers
  `assets/nature/provenance.json`, the library's `runtime-export.json` copy and
  `assets/sources.json`.
- Updated the two stripped source records (`PathRocks_Diffuse.png`,
  `Rocks_Diffuse.png`) in both library manifests. They retain the mirror's values
  as `upstream_sha256`/`upstream_bytes`, so the upstream link stays verifiable.
- The verifier now checks source and runtime byte counts as well as hashes, compares
  the prototype/library/runtime-export manifests, and maps every nature entry in
  `assets/sources.json` to both its runtime and source record.
- Deterministic fixtures cover stale source hashes, stale source sizes, manifest
  disagreement and optional upstream metadata disagreement.

Not changed: `assets/shepherd-prototype.blend` also mismatches its
`sources.json` hash. The simplification handoff records that the Blender files were
sanitized. That file is outside the nature asset scope.

## Runtime entries (all 29 audited)

| File | SHA-256 | Bytes | Status |
| --- | --- | ---: | --- |
| `Bark_DeadTree.png` | `0e382ca7ecd69226b9db4d65bd6099706e154384d6ec4f13ccec119edd8f5f24` | 1,301,290 | updated (was `498c5a20e54d…`, 1,301,370 B; −80 B) |
| `Bark_DeadTree_Normal.png` | `0f525d156830a6b8d80ada85de9c9c85df8f18b3eede1854c697b4941f0ff4f5` | 1,721,722 | updated (was `d3a0dc287eba…`, 1,721,802 B; −80 B) |
| `Bark_NormalTree.png` | `01ca34489206d36a872b6122515157675e826ae92da2ffc834721351520dc838` | 1,228,354 | updated (was `f40d425d8755…`, 1,228,434 B; −80 B) |
| `Bark_NormalTree_Normal.png` | `7503846d460b56b55489e2bd0e68bee279f2c239c9fd70bda4e02c889e4ad421` | 1,365,444 | updated (was `17a53781868c…`, 1,365,524 B; −80 B) |
| `Bark_TwistedTree.png` | `2f6f8388e7d2f09d267360bb481c1a99d23d9039a6669dd47b9d631c420532f8` | 1,375,419 | updated (was `b721ec3a567e…`, 1,375,499 B; −80 B) |
| `Bark_TwistedTree_Normal.png` | `0f525d156830a6b8d80ada85de9c9c85df8f18b3eede1854c697b4941f0ff4f5` | 1,721,722 | updated (was `d3a0dc287eba…`, 1,721,802 B; −80 B) |
| `CommonTree_2.bin` | `a273d69de31a675a9d7e3eb3c43f804aef2d1b031692111b9e76eb3b0b686d0c` | 423,024 | matched |
| `CommonTree_2.gltf` | `7504f9ac12da4e559003d251b08e4b30c4466ca244c29a91df6f436c9cbd068d` | 2,861 | matched |
| `DeadTree_2.bin` | `de7861981fa7ff6faafc30a705e49b45c315a718747e0ae08dc5acb34eedea10` | 453,824 | matched |
| `DeadTree_2.gltf` | `f02b1d88153ed9c2402de3894e07d6ec4a6214962dc0c3798db5e58ddceaab52` | 1,629 | matched |
| `LICENSE.txt` | `120710e542c3ebaf83856c4eb55b4a1e680593b39302eba7fdc5d942dfe78c58` | 852 | matched |
| `Leaves_NormalTree.png` | `171ad1c8fa6ddde351a3b3c9e2b1457d5c7a4a43ba4fd55a83801029db797151` | 158,772 | matched |
| `Leaves_NormalTree_C.png` | `998612bdf0b76a22f5f54d65cd7a457815d2842d89653fa4348a4ebb42933ad3` | 158,796 | matched |
| `Leaves_TwistedTree.png` | `d548e707fa34a558f88f477fa98f7b4ad3afbd4ceb7ab954506be694edf0f2ba` | 69,611 | matched |
| `Leaves_TwistedTree_C.png` | `0e459b56b14c0e81b1b7cf3d1e8c6f0bb71790eb6c46bb02a76a922d8df646ea` | 70,353 | matched |
| `PathRocks_Diffuse.png` | `df31c0574686b94109b40d56057eb3551224c539bd9ff44f719b24622883df1b` | 811,711 | updated (was `85a04abb2c13…`, 811,732 B; −21 B) |
| `Pebble_Round_2.bin` | `1bfde4a0934efd627c559a93d7ec28614b029efc48ce92c86060a6284ea911a9` | 7,468 | matched |
| `Pebble_Round_2.gltf` | `1cb5ab8c7b21931203354096aac49c729cb2c8ceb39cf4ec1d45f2dc037a0b35` | 1,360 | matched |
| `Rock_Medium_1.bin` | `ea79527d4c2b3bdb7a28bf589bf0c1fd96d192a4d0738636753911dd58681e99` | 13,284 | matched |
| `Rock_Medium_1.gltf` | `397bb3e98cea97282c00f5370c15f88e9de410a78c2371b2270ea53b9053b239` | 1,343 | matched |
| `Rock_Medium_2.bin` | `76b60bf8349f71abdb0ed462b3223d93c2dcabdfb5754bc132e18b021cc6c805` | 9,432 | matched |
| `Rock_Medium_2.gltf` | `8b635c9569ae6aee5331f361eb6b2ecce061131498ef89f1a54bab60deab2a77` | 1,337 | matched |
| `Rock_Medium_3.bin` | `63f94bce2d3fb3fe25b2d6c843a828b1bec76855dbaac93fcf5d43582309caad` | 20,124 | matched |
| `Rock_Medium_3.gltf` | `8382224ed9d1db520be04aee848b0ab671832b162ef5a2ba5370fc61b2d33a24` | 1,344 | matched |
| `Rocks_Diffuse.png` | `5d5a055fbac2e9d4d97300162f9117ccbbc873d8571e3138a04da0a75eeb4fc6` | 1,141,957 | updated (was `2dd54656f9a3…`, 1,142,110 B; −153 B) |
| `TwistedTree_1.bin` | `58e4c16c16e0a71051af76a37be0641ea8f7089652687f957383d3c4bd24723b` | 732,456 | matched |
| `TwistedTree_1.gltf` | `67c77864d59d349a96dbdb2a96424ed1a947ef82d598e4db65cad7d3df56710e` | 2,822 | matched |
| `TwistedTree_3.bin` | `04ad394055b72a3d3717d8e3617ae733ea155580330d94d7387238928755eaca` | 771,176 | matched |
| `TwistedTree_3.gltf` | `50f5133306d694e80598a5a1aaccea4d419852493e58e731026eca53a403e9e7` | 2,820 | matched |

Source records: 27 of 29 matched before the two above were updated with upstream
values retained. After the change, all 145 records across the three manifests and
all 29 `sources.json` nature entries agree with the on-disk source/runtime files.
`verify-nature-assets.mjs` and its deterministic fixture tests pass.
