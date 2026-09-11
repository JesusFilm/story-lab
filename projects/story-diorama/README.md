# Story Diorama

A dependency-free browser library that aligns images, text and music for game storytelling. Version **0.2.0**. Say **“use Story Diorama”** when adding an illustrated introduction, recollection, dialogue passage or ending.

The player renders the story scene. Your game owns its controls, loading screen, keyboard/gamepad input, fonts, media and navigation. No buttons are injected by the player. An optional controls module can either create a selected set of controls or bind your own markup and icons.

## Start here

- **[Integration guide](docs/integration.md)** — copy files or install a local package, author stories, configure presentation, supply custom UI, handle errors and clean up.
- **[API reference](docs/api.md)** — cue schema, every option, layout precedence, events and public methods.
- **[Minimal example](examples/minimal/index.html)** — runnable custom artwork, game-owned SVG button, independent text placement and optional controls. Source: [example.mjs](examples/minimal/example.mjs).
- **[Agent instructions](AGENTS.md)** — boundaries and a concrete integration checklist for agents picking this up.

## Install in another game

With a bundler, install this directory as a local dependency:

```sh
npm install /path/to/story-lab/projects/story-diorama
```

```js
import { StoryDiorama } from '@story-lab/story-diorama';
import '@story-lab/story-diorama/styles.css';
// Optional:
import { createControls, bindControls } from '@story-lab/story-diorama/controls';
import '@story-lab/story-diorama/controls.css';
```

Without a bundler, copy the entire `src/` folder into your game. Import `story-diorama.mjs` and link `story-diorama.css` from that copy. Keep `timeline.mjs` and `appearance.mjs` alongside it. No external runtime downloads or build step are needed. TypeScript declarations accompany the modules.

`npm pack --pack-destination /tmp` produces a small, installable local archive. The package includes runtime, declarations, integration docs and the minimal example; it excludes the Noah artwork/music, development scripts, screenshots and prototype. `private: true` prevents accidental registry publication; local installation and packing still work.

## Quick example

```js
const player = new StoryDiorama(document.querySelector('#story'), {
  cues: [{
    number: '01', title: 'The calling',
    text: 'A great task lay ahead.', reference: 'Original narration',
    version: 'Story edition',
    image: new URL('./assets/calling.webp', import.meta.url).href,
    alt: 'A carpenter beside an unfinished ark.'
  }]
}, {
  mode: 'manual',
  appearance: {
    fontFamily: 'MyGameFont, serif',
    number: { visible: false },
    version: { visible: false },
    title: { position: { top: '8%', left: '7%' } },
    text: { fontSize: '28px' }
  }
});

// Connect your loading/retry UI before waiting for resources.
await player.preload();
// Start from a user action if using sound.
myStartButton.onclick = () => player.start();
myNextButton.onclick = () => player.next();
// On unmount: player.destroy();
```

`number`, `title`, `text`, `reference` and `version` can each be hidden, styled or positioned independently. The default is a responsive caption stack. Set `position: null` to return a field to the stack. `appearance.mobile` applies to a narrow component container; a cue's own `appearance` overrides player defaults. Live `setAppearance()` updates do not restart playback.

## Run the examples from this checkout

Run `npm start` here, then open:

- Noah: `http://127.0.0.1:8768/projects/story-diorama/examples/noah/`
- Minimal integration: `http://127.0.0.1:8768/projects/story-diorama/examples/minimal/`
- Standalone playground: `http://127.0.0.1:8768/prototypes/story-diorama-lab/`

The playground's **Appearance & game controls** section changes field visibility, fonts, individual positions and control visibility live. The separate prototype owns copied component/media files and also runs independently. Edit this project's source, then run `npm run sync-playground` to update the copy.

## Development

`npm test` runs deterministic tests. With Playwright installed and the repository served on port 8768, use `npm run test:integration`, `npm run test:browser` and `npm run test:audio`. Existing Playwright/browser installations can be selected through `PLAYWRIGHT_MODULE` and `BROWSER_PATH`. The runtime has no dependency on these development tools.

Source-checkout content records: [verification](docs/verification.md), [Noah credits](examples/noah/assets/CREDITS.md) and [image prompts](docs/image-prompts.md). Preserve the music attribution if you copy Noah's media; supply your own media otherwise. Source records and Noah assets are deliberately excluded from the installable package.
