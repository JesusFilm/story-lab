# Story Diorama Lab

Prototype **4**, using **loading option 1 · Sheep theatre**.

A standalone playground for the Story Diorama storytelling utility. Explore a Noah story with four paintings, eight BSB passages and three gentle Scott Buckley soundtracks. Choose automatic playback from start to finish or Next-driven reading, with optional continuous replay.

From this folder, run `python3 -m http.server 8769 --bind 127.0.0.1`, then open `http://127.0.0.1:8769/`. No installation, build or network downloads are required. `noah.html` offers the story without the settings panel.

Controls: click Watch or Read; Next reveals the current text before advancing; Space does the same when focus is outside a form control; P pauses/resumes. Chapter cards jump. Sound and volume controls are independent. In the studio, choose settings then Apply & restart. Music settings include authored changes, a continuous track, per-cue restarts, silence, loop/once, delays, fades, starting offsets and excerpts. The event log exposes cue/music changes.

Hidden tabs pause automatically; press Resume when returning. Reduced motion suppresses movement. The full transcript and media credits appear below the player. Missing images show a retry screen; audio failures offer Retry sound or Continue muted.

`component/`, story data and all assets are owned copies. No files load from the private root project or another prototype. To update them, edit `projects/story-diorama` then run its `npm run sync-playground`. Preserve [media credits](assets/CREDITS.md) when reusing the music. The component API lives in the Story Diorama project README.

The Back to Story Lab link goes to the public portal and works from local previews or any static deployment path. The public portal lists this prototype as Story Diorama, a reusable storytelling component. Its clean Noah entry is https://jesusfilm.github.io/story-lab-demos/prototypes/story-diorama-lab/noah.html.

## Reusing the library (0.2)

The **Appearance & game controls** panel changes scene number, title, passage, reference and version independently. Choose fonts and field positions, and hide any host-owned controls. The core component never creates buttons. Its optional `component/controls.mjs` can create a selected subset or bind your own icons/markup.

For a new integration, start with the source project's [integration guide](../../projects/story-diorama/docs/integration.md), [API](../../projects/story-diorama/docs/api.md), and [agent instructions](../../projects/story-diorama/AGENTS.md). These documentation links apply inside the source checkout; the prototype itself remains independent at runtime. A small working custom-UI example lives at `projects/story-diorama/examples/minimal/`.
