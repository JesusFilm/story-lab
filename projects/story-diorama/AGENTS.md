# Story Diorama: integration and maintenance instructions

This is the authoritative reusable library. Begin with `README.md`, `docs/integration.md` and `docs/api.md`. The runnable integration reference is `examples/minimal/`; Noah is an authored example, not the library's content model.

## Integrating in another game

1. Inspect that game's existing UI, inputs, lifecycle and deployment path. Use its controls, fonts and art by default; ask only when a missing choice materially blocks the work.
2. Install this local package / its `npm pack` archive with a bundler, or copy **all of `src/`** into the game. Prototypes own their component/media copies. Do not use runtime imports into the private Story Lab checkout or another prototype.
3. Create a dedicated DOM container, include the core stylesheet, author game-owned cue data and resolve media paths with `new URL(..., import.meta.url)`. Do not copy Noah media unless requested; preserve its separate credits if used.
4. Treat number, title, text, reference and version as independent authored fields. Do not parse labels out of combined strings. Use `appearance`, `cue.appearance` and `setAppearance()` for typography/visibility/placement, including narrow-container overrides.
5. The core has no buttons. Bind the game's custom controls with `bindControls()`, use a requested subset through `createControls()`, or call public player methods from the game's input system. Do not add pause/replay/volume controls merely because the Noah example has them. Ensure manual mode still has Next and background pauses still have a resume path.
6. Wire image loading/retry, audio failure/retry/muted reading, user-gesture start and completion. Destroy bindings and player on unmount. Avoid reading implementation fields such as `timeline`, `front` and `voices`; use the documented methods, events and `getState()`.
7. Verify longest text, custom fonts, per-field hiding, intended controls, compact layout, repeated mounts, failures, and the game's deployed base path. Report the supported runtime and any checks not performed.

## Maintaining this library

Keep code content-agnostic and dependency-free at runtime. Keep controls optional, styling scoped and story data separate from layout. Maintain public exports and `.d.mts` declarations with API changes. Do not couple the library to React, Three.js, Noah, a portal, global IDs or global keyboard handlers. Do not import example CSS as core CSS.

Edit `src/` and examples here, then run `npm run sync-playground` to refresh `prototypes/story-diorama-lab/`. Do not hand-edit the copied component. Leave unrelated in-progress repository work alone. Preserve the prototype's assigned loader and self-contained assets.

Run `npm test` for engine/configuration changes. Run the relevant Playwright integration/browser/audio checks for changed behavior; record meaningful limits in `docs/verification.md`. Inspect `npm pack --dry-run` after changing exports/files. The installable package must exclude Noah media, development screenshots and private-repository content. Keep `private: true` unless the user explicitly requests registry publication.
