# Shepherd Adventure staged-loading export handoff

The independently runnable prototype, copied Story Diorama runtime, two generated
illustrations, music, scripture manifests, and loading checks are committed together.
The portal project was still largely untracked when this work was committed; it is
not included wholesale in this change. The source repository remains private.

When incorporating the pending portal tooling:

- Set `owns_loading: true` on the Shepherd Adventure publication entry.
- In build.py, preserve its direct boot.mjs script instead of injecting the generic
  prototype-loader.js wrapper. Keep the portal link and deployment-path rewrites.
  The generic wrapper eagerly imports Three.js, defeating story-first startup.
- Review and explicitly add the runtime paths below to the prototype's file list;
  pin their SHA-256 hashes after review. Do not discover/export the prototype folder.
- Refresh other previously changed game dependencies only after reviewing them.
  The existing complete portal build first stops on journey.css; its prior review
  pins and asset/module closure do not yet represent the current game.
- Validate the exported prototype under the GitHub Pages subdirectory and perform
  the deployed tile-to-play check before calling the public release complete.

Additional runtime files (relative to prototypes/shepherd-adventure):

```
src/boot.mjs
src/journey-story.mjs
src/story-media.mjs
src/journey-story-data.mjs
story.css
assets/story/opening.json
assets/story/ending.json
assets/story/announcement.jpg
assets/story/nativity.jpg
assets/story/silent-night-96k.mp3
vendor/story-diorama/story-diorama.mjs
vendor/story-diorama/story-diorama.css
vendor/story-diorama/timeline.mjs
vendor/story-diorama/appearance.mjs
```

Also review updated index.html, src/journey.mjs and loading-theatre.js. Preserve
visible Kevin MacLeod / CC BY 3.0 attribution and the soundtrack adaptation notice.
Do not publish the original source references, review evidence or source-only prompts
by including entire directories.

The local portal working files already contain the owns_loading conditional and
these explicit additions. This handoff records those changes without committing
unrelated portal scaffolding or implying a live Pages deployment.
