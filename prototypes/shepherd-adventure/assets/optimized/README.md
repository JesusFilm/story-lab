# Memory experiment runtime assets

These are derivatives of the prototype-owned originals listed in
[provenance.json](provenance.json). Original files, source references and attribution
remain in their existing locations; the prototype has no new external dependency.

The family keeps its geometry and animation, with textures limited to 2048 px.
Scenery textures are limited to 1024 px, except the nativity shelter at 2048 px.
Static scenery uses meshoptimizer simplification with an error bound of 0.005;
the requested ratios are targets, not guaranteed triangle counts. Provenance
records actual before/after geometry, texture dimensions and hashes.

Run `node checks/build-memory-assets.mjs` from the prototype to rebuild. The script
lists the pinned tool installation command; `SHEPHERD_ASSET_TOOLS` can point to a
separate tooling directory. Build tools are not loaded by the game. The generated
files are a local proof of concept pending visual review, not a publication change.
