# Among the Crowd — a sermon in Galilee

A self-contained personal Bible study prototype using **Three.js**, **Blender**, an edited selection of Jesus’ English teaching from the JESUS film, and retimed official subtitles. Everything specific to this initiative lives in this directory. No root-level project files are required or modified.

## Story Lab / GitHub Pages

This prototype now lives in `prototypes/sermon-in-the-crowd/` and owns all its
runtime assets. The portal has one tile; V1/V2 selection stays inside the experience.

For a standalone static preview:

```sh
npm ci
npm run dev:static -- --host 127.0.0.1 --port 8767
```

For GitHub Pages, run `npm run build:static`. Serve `dist-static/` with any static
HTTP server. Relative asset URLs support nested deployment paths. The retained
Vinext/Sites build below is optional; Pages uses the same React screen and Three.js
engine directly, without the unused subtitle API relay or a server runtime.
Local source caches, dependencies and Blender working files moved with the project
but are excluded from the public export.

## Original server preview

Requires Node 22.13+ and npm. From this directory:

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Open the local address printed by the server. Click **Enter the sermon** to unlock audio. This working copy contains the 2:16 teaching edit locally. Original source media is kept in an ignored review cache; the edited WAV/VTT files are included with this prototype so a fresh checkout can build the requested demonstration. See the media permissions notes below.

- **Drag** to look; **WASD / arrow keys** to walk; **Shift** to walk faster.
- **Walk freely** locks the pointer; **Esc** releases it. **Space** toggles audio when the scene has focus.
- **Your place** returns to the initial viewpoint; playback continues.
- Transport supports pause, seek, restart, previous/next teaching excerpt, volume, and captions. Open **About this scene** for the eleven named excerpts and individual WAV download links.
- Phones/tablets: drag to look and use the four directional buttons.
- **VR:** on a supported WebXR browser, enter VR; left stick moves, right stick snap-turns 30°, either trigger toggles playback. Captions render on a stereo-visible panel at a comfortable distance.

WebXR requires a secure context. Localhost is allowed on the same computer, but a headset opening a computer's plain HTTP LAN address will not be allowed to enter immersive VR. Use a trusted HTTPS origin or HTTPS local reverse proxy for headset access. The app does not install certificates or expose a public tunnel.

## Selected sermon

[JESUS Film Project: Sermon on the Mount, English](https://www.jesusfilm.org/watch/jesus.html/sermon-on-the-mount-2/english.html), about 219 seconds, media core ID `1_jf6112-0-0`, language `529`. This is the JESUS chapter, not the similarly named Magdalena chapter. The film title is retained; its source passage is Luke 6:24–42.

The revised playback is **136.210 seconds** in eleven teaching excerpts. Separate crowd dialogue and long interaction pauses have been cut. Music and ambience underneath Jesus’ voice remain; this is not an isolated vocal stem. A Web Audio panner follows the moving teacher. Media time drives both retimed captions and the broad performance; speech energy drives approximate jaw opening.

The animation is based on reviewed source-film frame sequences: restrained walking/turning, a raised-hand cheek illustration, lowering beside a seated listener, and a mostly planted judgment passage. See [the review and edit notes](docs/PERFORMANCE-REVIEW.md).

## Files and extension points

- `app/page.tsx`, `app/globals.css`: screen interface.
- `lib/sermon/experience.ts`: renderer, original landscape, model placement, movement, collisions, WebXR, sound and captions.
- `lib/sermon/media.ts`: verified original source URLs, caption parser and cue selection.
- `lib/sermon/performance.ts`: edited/source timeline mapping and observed choreography.
- `lib/sermon/actors.ts`: articulated people, independent idle motion and instanced crowd rendering.
- `app/api/subtitles/route.ts`: retained original-track reference relay; edited playback uses local VTT directly.
- `public/models/*.glb`: thirteen original Blender exports; eleven articulated human variants, olive tree and jar.
- `blender/sermon-assets.blend`: original environment/asset library.
- `blender/sermon-characters.blend`: current articulated human library.
- `blender/create_characters.py`: rebuilds the current human variants.
- `scripts/teaching-edit.json`: editable source cut list.
- `scripts/build_teaching_audio.py`: rebuilds local clips, combined audio, captions and speech envelope.
- `public/audio/`: numbered clips, combined teaching track and timeline metadata.
- `blender/create_assets.py`: deterministic generation script.
- `docs/SOURCES.md`: source selection, visual observations and historical choices.
- `docs/INITIATIVE.md`: scope, limitations and next phase.
- `tests/media.test.ts`: caption parsing and synchronization boundary checks.

### Rebuild Blender assets

```sh
blender -b --python blender/create_assets.py
blender -b --python blender/create_characters.py
```

The scene uses metres. Exported characters face +Z, stand on Y=0, and are approximately 1.8m high. Each file is loaded into an anchor so the model can be swapped without changing audio or navigation. Keep those conventions when replacing GLBs. Characters currently use rigid articulated parts with named joint metadata. Higher-detail replacements can use skinned rigs with an adapter for these joints. The crowd is instanced per moving part; scenery is batched statically. Models are shared among instances; high-detail assets need LODs and an appropriate headset performance budget.

## Rebuild the teaching edit

```sh
python3 scripts/build_teaching_audio.py .cache/film-review/sermon-review.mp4
```

The script requires FFmpeg and curl; caption retrieval needs internet. Edit the eleven source ranges in `scripts/teaching-edit.json`, then rebuild. Do not edit the generated timing manifest by hand.

## Validation

```sh
npx tsc --noEmit
npm test
npm run build
```

Build and parser checks do not certify headset performance, browser audio permission behavior, or controller mappings. See `docs/INITIATIVE.md` for remaining device acceptance checks.

## Media permissions

Audio excerpts and accompanying captions are from **JESUS**, produced by **Jesus Film Project**. They are included for this ministry prototype with the maintainer’s authorization. Film media and trademarks remain the property of their respective rights holders; this repository does not grant a separate license to reuse them. Code and third-party model licenses are documented separately.

## V2 — free artist-made models

The experience opens in V1. Use the **V1 · Blender / V2 · Free models** switch near the top of the screen. V2 becomes available after its local assets load. The switch preserves the camera, sermon time, playback and captions. **Closer view** moves nearer to Jesus; **Your place** restores the original viewpoint. V1's original files remain intact.

V2 assembles six variants from Quaternius' free CC0 human/hair/tunic assets and the CC0 lower robe by CDmir / TinyWorlds. Seven Quaternius motion clips supply proper skinned idle, walking, talking, sitting and crouching. See [credits](public/models-v2/CREDITS.md), [research and limitations](docs/v2/ASSET-RESEARCH.md), and [a reusable prompting brief](docs/v2/PROMPTING.md).

V2's restrained facial morphs are added locally and follow speech energy. They do not provide phoneme-accurate lip sync. Clothes are adapted period-inspired placeholders. Both versions still use Three.js; Blender is used for deterministic asset conversion/adaptation in V2, rather than inventing the human anatomy.

Rebuild the V2 assets separately (downloads are large; the much smaller runtime exports are already included):

```sh
python3 scripts/fetch_free_assets.py
blender --background --python-exit-code 1 --python blender/prepare_free_characters.py
node scripts/prepare_free_animations.mjs
```

The new runtime adapter is `lib/sermon/actors-v2.ts`. It uses independent cloned skeletons, AnimationMixer clips, facial morphs and ground contact adjustment. V2 does not reuse V1's rigid-part crowd instancing. Profile on a real headset before choosing a crowd budget for deployment.
