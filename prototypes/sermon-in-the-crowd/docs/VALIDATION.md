# Validation record

- Blender 5.1.2 actually ran `blender/create_assets.py` and produced eight GLB assets and the `.blend` source library.
- All eight assets were parsed with Three.js GLTFLoader; finite bounds, foot/root positions, and human metre scale checked. Human models are approximately 1.77m high.
- Caption tests cover official-style timestamp formats, cue boundaries, gaps, formatting removal, malformed intervals, and time labels.
- FFprobe decoded the HLS manifest, confirmed AAC audio and H.264 video, and reported duration 218.843630 seconds.
- Official HLS master returned HTTP 200 and `Access-Control-Allow-Origin: *`.
- Local subtitle endpoint returned HTTP 200, valid WEBVTT, 55 cues, beginning at 0 seconds with the final cue at 209.45–211.25 seconds. The track naturally has silent intervals and an uncaptained ending before the approximately 219-second video ends.
- Local page returned HTTP 200 and the preview was handed to Codex at the server's printed URL.
- TypeScript and production build checked; all 11 caption and asset tests pass.
- Updated scaffold framework/build dependencies to compatible patched releases; npm audit reports 0 vulnerabilities. The sharp override patches the transitive image library.
- Local rendering emitted a deprecated Three.js shadow-map warning; source was updated to the supported PCFShadowMap.

Not performed: browser interaction tests, visual browser screenshots, end-to-end audible playback verification, or testing on a physical VR headset. Do not infer those from a successful build. The source notes identify artistic reconstruction and film-mix limitations.

## Teaching edit revision

The original-stream checks above describe the first version. The current app plays local edited PCM audio. The performance review documents the reviewed film-frame sequences and editing boundaries. New tests check eleven excerpts, 43 retimed cues, removed crowd exchanges, 136.210-second duration, timeline round-trips, continuity across cuts, and observed gesture beats. Current Blender assets comprise eleven articulated people plus the two environment props.

Final revision checks: all 21 tests pass; TypeScript passes; production build succeeds. The local audio endpoint supports HTTP 206 range requests for seeking, the edited VTT returns HTTP 200, and the page returns HTTP 200. Articulated-joint tests confirm independent crowd transforms, moving instance matrices, observed teacher arm movement, and jaw closure on pause.
