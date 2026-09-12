# Pixal3D asset workflow

Generate a Follow the Light reference, turn it into a textured GLB on the private
GPU server, then prepare and inspect a static game prop locally. Python 3.9+,
OpenSSH and server-side curl are required; Blender is used for preparation.
The client has no third-party Python dependencies and never reads `.env`.

## Generate

1. Read [the current style guide](../../styles/follow-the-light/README.md) and
   relevant scene references. Use native ImageGen to create one isolated object
   under neutral lighting. Save its exact prompt and image in
   `assets/<category>/<asset>/` with descriptive filenames.
2. Inspect the image for shape, unobstructed silhouette, material and clipping.
   Characters need their own pose/rigging workflow; start with static props.
3. Use an existing authorized SSH account and server address.

From the Story Lab root:

```sh
export PIXAL3D_SSH_HOST='USER@HOST'
python3 projects/pixal3d-assets/generate.py \
  assets/objects/oil-jar/oil-jar-reference.png \
  --output assets/objects/oil-jar/oil-jar-pixal3d-source.glb
```

Choose a new output name for another run. Seed defaults to 42, resolution to
1024; `--resolution 1536` uses the higher-resolution profile. The service admits
up to two jobs when safe, rejects a third with 409, and rejects insufficient
resources with 503. It does not queue requests. Do not automatically retry a
submission after an ambiguous network failure; inspect existing jobs first.

The private API receives raw image bytes, returns a job ID, and exposes polling,
artifact, metadata and cancellation endpoints. This client invokes curl through
SSH directly, so it needs no local tunnel, browser, LiteLLM route or bearer token.
It cannot start/reconfigure the service or bypass its admission and monitoring.
Ctrl-C requests cancellation of this job only. Interrupted downloads can resume
with `--resume UUID` and the same image/output. Raw recovery records are saved
outside the repository in the OS temporary directory (or `--state-dir`); retain
them somewhere private if needed long term. The server also retains job records.
The client verifies the returned SHA-256 and GLB header before writing the model.

## Prepare and inspect

```sh
blender --background --python projects/pixal3d-assets/prepare.py -- \
  assets/objects/oil-jar/oil-jar-pixal3d-source.glb \
  assets/objects/oil-jar --height .28 --triangles 8000 --texture-size 1024 --rotate 30 0 0
```

On macOS, Blender may be `/Applications/Blender.app/Contents/MacOS/Blender`.
Preparation retains the original source, normalizes a derived model to metres
with its base at zero, welds split vertices, reduces triangles, unwraps and bakes
base color, roughness and tangent normals from the source, and renders a
matched front source/runtime pair plus the runtime rear. Inspect the opening,
handles, underside, texture seams and silhouette. The jar needs a 30-degree X
correction in Blender coordinates; `--rotate X Y Z` defaults to zero for other
assets. Choose corrections from renders, not from this jar's settings. Decimation is a static-prop
LOD, not animation retopology. Geometry hidden in the image is inferred and may
need manual Blender repair. `mesh-review.json` records the resulting counts.
This preparation profile targets opaque, nonmetallic props. Metallic, emissive,
transparent and animated assets need a material/rigging preparation pass of their own.

Copy the reviewed runtime model into the prototype's own `assets/` directory,
record its source/hash, and wire it into that prototype's normal loading phase.
Keep the high-resolution source, reference, prompt, useful renders and concise
provenance in the asset library. Never put server IDs, logs, credentials or local
machine addresses in the library. Update the portal's explicit publication list
and reviewed hashes if a listed prototype gains a runtime dependency.

The verified installation uses official [TencentARC/Pixal3D](https://github.com/TencentARC/Pixal3D)
with low-VRAM mode, SDPA and public BiRefNet segmentation. Server dependency
and model revisions remain in private job metadata. Model/provider software
licenses are distinct from the provenance of generated artwork; preserve any
required third-party notices when adding outside assets.
