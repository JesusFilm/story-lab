# Staged loading architecture

## Runtime sequence

1. Initial HTML renders the existing option 2 Follow the lantern loading animation,
   with “Loading...” as its message. The classic loader starts before modules.
2. boot.mjs imports only the story controller/player. Opening JSON, image and the
   complete 96 kbps soundtrack load; the image is decoded before the story appears.
3. The story starts automatically, music enabled. Browser-blocked sound exposes an
   Enable music action without stopping the text. Music off preserves playback.
4. After the story gets its first paint, dynamic import initializes the 3D world and
   downloads models/textures behind it. Hidden game rendering/simulation is paused.
5. The final passage waits for Begin. Closing destroys the player, removes image
   DOM and releases scripture references, abort controllers and media object URLs.
   If game preparation is unfinished, the same animation reappears. The star/camera
   opening starts only after the game is ready, followed by interactive play.
6. Reaching arch starts one shared ending preload. Arrival joins it if unfinished.
   A ready ending avoids showing the loader. It also auto-plays and waits for Finish.
7. Restart reuses the loaded 3D game, reacquires opening media and cancels any
   unused ending prefetch. Page exit releases every media lease.

Browser HTTP cache and garbage collection retain control of actual physical memory
reclamation. Revoking URLs/releases does not force immediate OS memory reduction.
There is no service worker, new cache service, paid infrastructure or generated art.

## Size

The original 320 kbps soundtrack was preserved in the source asset library and a
96 kbps runtime copy was created with ffmpeg. This reduces it from about 5.1 MiB to
1.6 MiB. With the opening JPEG and scripture, opening content is about 2.2 MiB.
The 3D asset sizes are unchanged; their network wait now overlaps reading time.

## Validation

`checks/verify-story-loading.mjs` uses actual browser requests with held responses:
- Intro visible and auto-playing before the game module is allowed to arrive.
- Default music-on state, mute without leaving the story, blocked-autoplay recovery.
- No Start Story action; the final passage waits for Begin.
- Early Begin shows the loader until game preparation completes.
- Closing clears image nodes and revokes opening media URLs.
- Camera remains in intro until the story closes; its own skip still works.
- Back-gate arrival starts the ending request, final arrival joins it without a
  duplicate image download, and a fully prefetched ending has no loader flash.
- Restart reuses the game and correctly loads another story lease.
- Failed initial image request can retry; mobile/reduced-motion startup succeeds.
- Existing 12 journey model checks pass (113 knowledge states); JS syntax and diff
  whitespace checks pass. No full walking playthrough or physical mobile device test.

## Public export

The exporter honors owns_loading so its generic eager Three.js wrapper does not
reintroduce the original delay. New runtime/story files are explicitly enumerated
and hashed. No public deployment was performed. The complete export is still blocked
by pre-existing Shepherd Adventure content-review mismatches, beginning with
journey.css; earlier changed world dependencies also need a publication review.
The full browser suite also passed under /story-lab-demos/prototypes/shepherd-adventure/
in a separate local Pages-path simulation. This is not a verified live deployment.
