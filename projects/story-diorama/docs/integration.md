# Integrating Story Diorama

## 1. Choose a delivery method

**Bundled game:** install the local project folder or an archive produced by `npm pack`, then import `StoryDiorama` from `@story-lab/story-diorama` and its `styles.css` export. This is an ES module package with TypeScript definitions. It can coexist with React, Three.js, Phaser or a custom Canvas game because its only rendering requirement is an HTML container.

**Static game:** copy the whole `src/` directory into a game-owned folder, include its CSS and import its `.mjs` entry. Do not copy only `story-diorama.mjs`: it imports `timeline.mjs` and `appearance.mjs`. Serve through HTTP rather than double-clicking a file URL. Keep assets in the game; no runtime imports should point back to Story Lab.

```html
<link rel="stylesheet" href="./vendor/story-diorama/story-diorama.css">
<section id="story-scene" aria-label="The story"></section>
```

The player owns the children of its dedicated container, replacing them on construction and clearing them on destruction. Put controls outside that container. It does not change global page styles or register global key handlers. For an in-game overlay, your game supplies the overlay's dimensions and z-index.

## 2. Author content without coupling it to layout

```js
const asset = name => new URL(`./assets/${name}`, import.meta.url).href;
const story = { cues: [
  {
    number: '01', title: 'The workshop',
    text: 'The work began before the first drop of rain.',
    reference: 'Original dramatization', version: 'Story edition',
    image: asset('workshop.webp'), alt: 'Timber frames under construction.',
    music: { src: asset('workshop.mp3'), loop: true, fade: 1800 }
  },
  { text: 'Day after day, the structure grew.' },
  {
    number: '02', title: 'The rain', text: 'The sky changed.',
    image: asset('rain.webp'), alt: 'Rain falling across a dark sea.',
    music: { src: asset('rain.mp3'), loop: false, delay: 800 }
  },
  { text: 'Then came silence.', music: null }
] };
```

Images and music persist if omitted. Text metadata (`number`, `title`, `reference`, `version`) does **not** persist: supply it on each cue where it should appear. Reuse a scene object with JavaScript spread if several cues share metadata. `number` is an authored scene label; it is never inferred from the cue index. Several passages can therefore share one scene number. Plain text is rendered as text, not HTML.

The fields are content-agnostic: `reference` may be a citation or speaker credit, and `version` may be an edition label. You can omit both. Use separate fields if you need separate visibility; the library does not parse a combined `"Genesis 6 · BSB"` string. Existing combined strings remain visible unchanged.

## 3. Configure fonts and independently position fields

```js
const options = {
  mode: 'manual', reveal: 'typewriter', speed: 32,
  appearance: {
    fontFamily: 'MyGameFont, sans-serif',
    number: { visible: false },
    title: {
      fontFamily: 'MyHeadingFont, serif', fontSize: '32px',
      position: { top: '6%', left: '7%', right: '7%' }
    },
    text: {
      fontSize: 'clamp(20px, 2.5vw, 32px)', color: '#fff5da',
      position: { left: '7%', right: '7%', bottom: '18%' },
      maxHeight: '240px'
    },
    reference: { position: { left: '7%', bottom: '7%' } },
    version: { visible: false },
    image: { fit: 'contain', position: 'center' },
    shade: 'linear-gradient(transparent, rgba(0,0,0,.85))',
    mobile: { title: { fontSize: '24px' }, text: { fontSize: '22px' } }
  }
};
```

Each field supports visibility, typography and its own CSS position relative to the **whole diorama**, not the caption box. Without `position`, it remains in the default caption stack. The text position controls its scroll window. Positioned fields do not reserve space in the stack or avoid one another: choose non-overlapping offsets, test the longest text, and supply mobile overrides as needed. `%`, `px`, `rem`, `clamp()` and `calc()` are CSS strings; bare numeric layout values are not supported.

`appearance.mobile` activates at a **container width of 650px or less**, including a narrow panel inside a wide game window. CSS custom properties control stage dimensions; for example:

```css
#story-scene {
  --sd-aspect-ratio: 16 / 9;
  --sd-min-height: 420px;
  --sd-mobile-aspect-ratio: 3 / 4;
  --sd-mobile-min-height: 500px;
  --sd-caption-width: 900px;
  --sd-text-height: 220px;
}
@font-face {
  font-family: MyGameFont;
  src: url('./assets/my-game-font.woff2') format('woff2');
  font-display: swap;
}
```

Font names do not download fonts. Your game loads and licenses the font files. For exact first-frame typography, await `document.fonts.load('24px MyGameFont')` before starting. Test fonts against the languages your game supports.

Change appearance while playing without resetting progress:

```js
player.setAppearance({ version: { visible: true }, title: { position: null } });
```

Patches merge recursively. `position: null` clears earlier positioning. To clear a single inherited offset use `'auto'` (or an empty CSS string), and set `transform: 'none'` when replacing a centered transform. Cue appearance overrides the global patch until that cue ends. The [API reference](api.md) defines precedence.

## 4. Supply only the controls the game wants

The core constructor never creates pause, replay, mute, volume, status or navigation buttons. You can render no controls at all and start the player from a game action. An auto story needs only an entry point; a manual story must have a path to `next()` even if that is a keyboard/gamepad action.

**Optional stock controls:**

```js
import { createControls } from '@story-lab/story-diorama/controls';
import '@story-lab/story-diorama/controls.css';
const ui = createControls(myControlsContainer, player, {
  controls: ['next'], // omit every other control
  labels: { next: 'Continue', reveal: 'Show full passage' }
});
// Or controls: [] for no controls. Omitted controls default to all six.
```

Use control CSS variables (see the API reference) to change the stock styling, or omit its stylesheet and style `.sd-controls` yourself.

**Your own artwork, icons and markup:**

```html
<div id="game-story-actions">
  <button type="button" data-sd-action="next">
    <svg aria-hidden="true" viewBox="0 0 24 24"><!-- your icon --></svg>
    <span data-sd-label>Continue</span>
  </button>
</div>
```

```js
import { bindControls } from '@story-lab/story-diorama/controls';
const ui = bindControls(document.querySelector('#game-story-actions'), player, {
  labels: { next: 'Continue', reveal: 'Reveal passage' }
});
```

The binding preserves your markup and updates only marked `data-sd-label` spans, accessible labels, disabled state, volume and mute state. Labels are plain text and can be localized. Binding never inserts icons or global key handlers. Supply `type="button"` when inside a form. A volume input uses `min="0" max="1" step="0.01"` and `data-sd-action="volume"`. Bind once per controls container; destroy the binding before replacing its markup.

**Your own event system:** call public methods directly; neither helper is required. `getState()` and `state`, `cue`, `complete`, `pause`, `audioerror` events are the integration surface. Do not read `timeline`, `front`, `voices`, or other implementation fields.

## 5. Loading, audio and screen lifecycle

Create the player and error handlers, show your loading screen, then await `preload(onProgress)`. This preloads images and rejects on an image error or 20-second timeout. Retry by calling `preload()` again. Audio is streamed when its cue starts; `preload()` does not download or validate all soundtracks. Keep the Start button disabled until images are ready. The minimal example shows this sequence and its error paths.

Call `start()` from a user click/tap, particularly when using audio. Listen for `audioerror` and offer `retryAudio()` or `setMuted(true)`. Retry uses the current media sources; fix the source or replace the player if a URL is wrong. A hidden tab pauses the story and requires explicit resume. If you omit pause controls, provide a game-owned resume path calling `pause(false)` when appropriate. The `pause` event lets your UI reflect automatic background pauses.

Use `complete` to return control to the game. The final soundtrack continues fading for 1.8 seconds after that event. Leave the component mounted for the fade, or call `destroy()` for immediate removal. On screen unmount:

```js
ui?.destroy(); // stock UI removes its own bar; custom binding leaves your markup
player.destroy(); // pauses audio, cancels animation, disconnects resize/visibility listeners
```

Destroy is idempotent. Create a fresh player to remount. `stop()` keeps the visual scene but stops sound and time; `start()` replays from cue zero. For React, create and destroy in an effect tied to the mounted container, rather than recreating the player on each render. Do not combine React-managed children with the player's owned container.

## 6. Accessibility and media ownership

Provide image alt text, readable contrast and labelled controls. The component announces the complete passage once per cue and hides character-by-character text from assistive technology. Setting `text.visible: false` also hides that announcement; `announceText: false` lets a host-owned transcript or announcer take over. Reduced motion shows text immediately and removes image motion while retaining authored reading time. Consider a static transcript for long passages and for stories with no controls.

Copy your own visuals/audio alongside your game; never rely on development URLs, another prototype's assets, credentials or this private checkout. If using the Noah media, also copy its credits and retain the required Scott Buckley attribution. The installable library includes none of those large media files. The minimal SVG is a small code-native demonstration asset that you can replace.

Before shipping, test a cold load, image and audio failures, longest passage, custom fonts, small container, hidden-tab resume, both entry modes if offered, repeat mount/unmount and the actual deployment path.
