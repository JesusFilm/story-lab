# Story Diorama API · 0.2

## Public modules

- `@story-lab/story-diorama`: `StoryDiorama`, with exported TypeScript types `Story`, `Cue`, `PlayerOptions`, `PlaybackOptions`, `Appearance`, `TextAppearance`, `Position`, `MusicCue`, `PlayerState`, `DioramaEvents`.
- `@story-lab/story-diorama/controls`: `createControls`, `bindControls`, and control types.
- `@story-lab/story-diorama/styles.css`: required default presentation, scoped under `.story-diorama`.
- `@story-lab/story-diorama/controls.css`: optional stock-control styling, scoped under `.sd-controls`.

Equivalent file imports work from a copied `src/` folder. The engine uses browser DOM, media, ResizeObserver, requestAnimationFrame and matchMedia APIs; instantiate only on the client. Server-side rendering can output the empty container and loading UI.

## Story and cues

`new StoryDiorama(container, {title?, cues: [...]}, options?)`. At least one cue and a string `text` per cue are required. Use `text: ''` for a visual-only timed cue. Treat story data as immutable for the lifetime of the player; construct a new instance to load a different story.

| Cue field | Meaning |
|---|---|
| `text` | Required plain string; typewriter/scroll content. |
| `number` | Optional string or number, authored scene label. No automatic numbering. |
| `title` | Optional scene title. |
| `reference` | Optional source/citation/speaker label. |
| `version` | Optional translation, edition or other independent credit. |
| `image`, `alt` | Image URL and description. Omit image to retain the previous visual. |
| `music` | Omit to retain current music/pending start; `null` fades to silence; object replaces track. |
| `options` | Playback overrides for this cue, excluding whole-story `loop`. |
| `appearance` | Presentation overrides for this cue. They reset on the next cue. |

Metadata is never parsed or inferred. Legacy combined strings in `title` and `reference` still work; split them into separate fields to control their parts independently.

## Player options and cue playback overrides

| Option | Default | Meaning |
|---|---|---|
| `mode` | `auto` | `auto` or `manual`. Manual waits after reveal until Next. |
| `reveal` | `typewriter` | `typewriter`, `scroll`, `instant`. |
| `speed` | 32 | Characters/sec; at least 1. Also sets vertical-scroll duration. |
| `hold` | 3500 | Milliseconds after reveal before automatic fade. |
| `fade` | 700 | Passage exit duration in milliseconds; also used after manual Next. |
| `transition` | `dissolve` | `dissolve`, `fade` through black, `drift`, `cut`. |
| `transitionMs` | 1200 | Image transition duration in milliseconds. |
| `loop` | false | Repeat the story; player-level only. |
| `appearance` | default stack | Appearance configuration below; player-level here, or `cue.appearance`. |

Durations must be finite and non-negative. Invalid playback modes, music fields and non-integer seek values fail explicitly. Hiding the passage does not shorten a cue: the authored reveal/hold/fade timing still runs. For a visual-only cue choose empty text or instant reveal and an explicit hold.

Vertical scrolling moves overflowing text from top to bottom; short text stays still. Once revealed, overflow stays manually scrollable. Typewriter follows the last visible line. Reduced motion displays full text immediately while keeping the time allotted to reading.

## Appearance

`appearance` accepts `fontFamily`, `number`, `title`, `text`, `reference`, `version`, `image`, `shade`, `announceText`, and `mobile`. Each named text field accepts:

| Setting | Meaning |
|---|---|
| `visible` | False hides the field; true shows it if content exists. |
| `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `color`, `textAlign` | CSS strings; per-field overrides. |
| `position` | CSS position object, or `null` to return to the default stack. |
| `maxHeight` | CSS scroll viewport height, for the `text` field. |

Position keys: `top`, `right`, `bottom`, `left`, `width`, `maxWidth`, `height`, `maxHeight`, `transform`. They are applied to an absolutely positioned element relative to the entire scene. A configured text position moves the whole scroll window. Example: `{left:'50%', top:'10%', width:'80%', transform:'translateX(-50%)'}`. All supplied layout values are CSS strings. You own collision avoidance and contrast for custom layouts.

`fontFamily` sets all text fields unless a field overrides it. The default style uses serif passage text and system-ui metadata. CSS custom properties can style the default without configuration. `image` accepts `{fit:'cover'|'contain'|'fill'|'none'|'scale-down', position:'50% 30%'}`. `shade: false` hides the readability gradient; a CSS background string replaces it. No custom font or background image is fetched unless your CSS/URLs request one.

`announceText` defaults true. Setting it false disables the component's live passage announcement. Hidden text also suppresses its announcement. Other fields use normal accessible DOM visibility.

Precedence, from lowest to highest:

1. Default CSS and host CSS custom properties.
2. Player appearance, including patches from `setAppearance()`.
3. Player `appearance.mobile` when container width is ≤650px.
4. Current cue `appearance`.
5. Current cue `appearance.mobile` in a compact container.

Objects merge recursively without mutating input data. A cue override is re-resolved from defaults for every cue; it never leaks to the next cue. Patches apply live without restarting playback. `position: null` resets the complete position; use `auto`/empty string to reset a single CSS offset. Explicit appearance styles take precedence over stylesheet declarations of the same property.

Supported player CSS variables: `--sd-background`, `--sd-aspect-ratio`, `--sd-min-height`, `--sd-mobile-aspect-ratio`, `--sd-mobile-min-height`, `--sd-inset`, `--sd-bottom`, `--sd-caption-width`, `--sd-text-height`, `--sd-font`, `--sd-text-size`, `--sd-label-font`, `--sd-shade`. Use the JS appearance API for independent field layout. Internal DOM class structure is not a replacement for that API.

## Music objects

| Field | Default | Meaning |
|---|---|---|
| `src` | required | Audio URL. |
| `name` | omitted | Optional event/debug label. |
| `loop` | false | Repeat the audio file. |
| `volume` | .55 | Per-track gain, 0–1, multiplied by master volume. |
| `fade` | 1800 | Crossfade/excerpt fade duration in milliseconds. |
| `delay` | 0 | Milliseconds from cue entry before changing the track. |
| `duration` | whole file | Milliseconds after the track cue starts before beginning its fade out. |
| `offset` | 0 | Seconds into the audio file. |

The old track continues during a delayed replacement. Excerpt timing uses the pausable story clock, not decoded-media sample time; stalls do not extend the cue. File looping retains encoded silence and is not sample-accurate looping. Pause freezes cue delays, excerpts, fades and image transitions together.

## Methods

| Method | Contract |
|---|---|
| `preload(onProgress?)` | Promise; loads unique images. Progress receives loaded/total. Rejects on error/20-second timeout. Audio loads at cue time. |
| `start(options?)` | Start or replay cue zero. Saves playback overrides. Appearance updates merge. Call from a user action for audio. |
| `next()` | First input completes reveal. Following input fades/advances. Does nothing when paused, stopped or complete. |
| `pause(boolean?)` | Pause/resume; omission toggles. |
| `seek(index)` | While running, jump to integer cue index (clamped to range). Restore inherited image/music. Replays music from configured offset, not historical elapsed time. |
| `setAppearance(patch)` | Merge and apply live appearance. |
| `getState()` | New snapshot: phase, index, progress, paused, running, muted, volume, total. |
| `setMuted(boolean)` | Mute without stopping playback or timing. |
| `setVolume(number)` | Set master volume (default .65); finite number clamped to 0–1. |
| `retryAudio()` | Reload current media sources and attempt playback unless paused. |
| `stop()` | Stop audio/animation; retain current picture. State becomes idle. Next start begins from zero. |
| `destroy()` | Stop, remove observers/listeners, empty dedicated container. Idempotent; recreate to restart. |

## Events

Native EventTarget events with payload on `event.detail`: `state` (PlayerState), `cue` (`{index,cue}`), `music` (music object or `{stop:true,...}`), `pause` (boolean), `complete` (empty object), `audioerror` (`{message,error?}`), `appearance` (resolved config), `destroy` (empty object). State can update every frame: avoid rebuilding a game UI every frame if its visible labels have not changed. Completion occurs before the final 1.8-second music fade has finished; phase is complete while running may still be true during that fade.

## Controls module

`createControls(container, player, {controls?, labels?, label?})` appends a bar and returns `{element, destroy}`. `controls` defaults to all of `play`, `pause`, `next`, `replay`, `mute`, `volume`; pass an explicit subset or `[]`. `label` is the group accessible label. Duplicate control names are unnecessary.

`bindControls(container, player, {labels?})` binds existing descendants with `data-sd-action` and returns `{destroy}`. Actions are the same six names plus `retryAudio`. Add `data-sd-label` to a span if its text should reflect state; other children and icons remain untouched. The binder updates accessible labels even on an icon-only button. Bindings are scoped to the supplied container and automatically detach when the player is destroyed. Manual `destroy()` leaves custom markup in place; stock controls remove their own bar.

Labels: `play`, `pause`, `resume`, `next`, `reveal`, `replay`, `mute`, `unmute`, `volume`, `retryAudio`. Stock CSS variables: `--sd-control-font`, `--sd-control-gap`, `--sd-control-color`, `--sd-control-background`, `--sd-control-border`, `--sd-control-radius`, `--sd-control-accent`.

## 0.1 → 0.2

Existing constructor/playback calls and combined metadata strings remain valid. To independently style/hide labels, split the authored metadata into `number`, `title`, `reference`, `version`. Use `setAppearance()` rather than reaching into internal DOM. The player now shows a static first-cue preview before Start. A dedicated public `getState()` replaces reading timeline internals in integrations. Default control UI remains absent from the core.
