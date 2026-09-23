# Small-asset derivatives

These files are reproducible quality variants of this prototype's existing,
reviewed assets. They introduce no new generated subjects or provider jobs.
Original geometry, textures, rigs, clips and sources remain in place.

Visual direction remains [Follow the Light AA](../../../../styles/follow-the-light/README.md).
Source provenance and attribution: [asset index](../README.md),
[prior optimized assets](../optimized/README.md),
[Quaternius nature license](../nature/LICENSE.txt), and the original encounter/
audio directories. The same source licenses apply to these derivatives.
`sources.json` records source SHA-256, sizes and logical mesh/texture inventories.
It is build evidence, not an extra runtime download.

Run `npm ci && npm run generate` in `../../tools/quality/`. Pinned Node dependencies
perform build-time simplification, animation resampling and texture resizing.
The minimal tier targets 256 px textures, low 512 px. Native JPEG or PNG is embedded
in self-contained GLB files; illustrations use WebP. No new runtime WASM decoder
is required. Static disconnected meshes can use spatial clustering, while skinned
meshes retain topology-aware simplification, bone weights and animation names.
Repeated wall geometry has a tighter triangle target. Both tiers preserve
material/node names used by the gameplay code.

Runtime routing is generated into `../../src/quality-assets.js`; it runs before
original model or picture downloads. Review the actual output and public file
list before refreshing portal publication hashes. The generator does not publish.

[Investigation, measurements and hardware limits](../../../../docs/reports/shepherd-adventure-constrained-startup.md).
