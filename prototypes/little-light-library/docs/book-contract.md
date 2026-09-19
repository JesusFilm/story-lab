# Little Light book contract

Version 1 is a small, declarative format for paper-stage books. A creator and an agent edit the same JSON, run the same validator and preview through the same reader. The format deliberately supports a bounded vocabulary rather than executable scripts or arbitrary character rigs.

The working example is [`public/books/quiet-garden.book.json`](../public/books/quiet-garden.book.json). The generated JSON Schema is [`scripts/book.schema.json`](../scripts/book.schema.json); the TypeScript source of truth is [`src/authored-book.ts`](../src/authored-book.ts).

## Creator glossary

- **Book:** the metadata, asset registry and ordered spreads in one JSON document.
- **Spread:** one open-book scene with its own text and stage direction.
- **Backdrop:** the upright scenic image behind the elements.
- **Ground print:** optional artwork laid on the horizontal page surface. It is independent of the backdrop.
- **Element:** a separately placed actor or prop.
- **Actor:** a named story subject. Version 1 can select a cell from a horizontal pose atlas, but it does not create an anatomical rig.
- **Prop:** an independently placed scenic or story object.
- **Cutout:** a flat illustrated card used for either an actor or a prop.
- **Pose:** one illustrated stance; v1 selects a cell in a horizontal atlas.
- **Rig:** movable parts and their pivots. Existing books have artwork-specific rigs; v1 does not infer or author them.
- **Placement:** an element's position, displayed size, anchor, elevation and rotation.
- **Anchor:** the point kept on the support surface. `bottom` plants the bottom center; `center` places the image around its center.
- **Motion cue:** the bounded `rock` gesture plus its trigger and timing controls. It rocks the whole paper card around its anchor.
- **Interaction:** labeled pointer or keyboard activation with visible text feedback and an optional built-in `tap` sound.
- **Narration cue:** a measured audio asset tied to one text segment. `recordedText` records exactly which words are in that file.
- **Stage direction:** the authored composition and behavior of one spread. It is an interpretation and should not be presented as biblical source text.

## Top-level fields

Every document has `format: "little-light-book"`, `version: 1`, a stable slug `id`, display `title` and `subtitle`, one BCP-47-like `locale`, and `status: "draft"`. Version 1 carries one locale per file. The reader shows that locale as a badge; it does not substitute content when the reader's normal nine-locale preference differs. `eden` and `noah` are reserved for the built-in books and cannot be imported as authored IDs.

`source` describes the biblical or other source material. `retellingNote` identifies what kind of adaptation the words are. `cover` references an image in `assets`. `spreads` is the reading order; array position, not an ID naming pattern, controls that order.

IDs are stable references, not display text. Keep book, spread, segment and element IDs unchanged when revising their labels or words. IDs must be unique within their scope.

## Assets and portability

`assets` maps an asset ID to `{ kind, src, attribution }`. `kind` is `image` or `audio`. In an editable repository book, `src` is relative to the reader's `public` root, such as `assets/art/theatre/garden.webp`; do not add a leading slash. External URLs, absolute file paths and `..` traversal are unsupported.

The Author screen's portable export embeds every referenced image and audio file as a data URI in the JSON. That exported JSON can be imported in another copy of the static reader without the repository, an agent, synthesis service or credentials. Both public-root paths and exporter-produced data URIs describe the same contract; hand-authored external data URLs are not a substitute for keeping source assets and attribution.

Each asset needs nonempty attribution. The validator also checks that references have the right kind: covers, backdrops, grounds and element artwork use images; narration uses audio.

## Spread text and staging

Each spread has a stable `id`, visible `title`, `source`, and `stagingNote`. Keep these boundaries explicit:

- `source` points to the underlying passage or source material.
- segment `text` is the authored retelling shown and narrated by the reader.
- `stagingNote` describes invented composition, movement and interaction.

`segments` contains one or more stable segment IDs and readable text. Segment IDs are also used by narration-triggered motion. `backdrop.asset` references the upright image. Optional `ground` references a horizontal image and supplies its own placement and opacity.

The stage uses reader page units. `x` moves left (negative) and right (positive). `depth` moves across the horizontal page stage: positive values move toward the upright backdrop and negative values toward the reader. `width` and `height` are displayed page-unit dimensions rather than source pixels. The page is about 6 units wide by 3 units deep; validation bounds individual coordinate and size values; it does not guarantee that arbitrary combinations fit inside the page or avoid overlap. `elevation` lifts an element above its support. `rotation` is in degrees. See the demo's moderate values before making large changes, then judge them in preview at phone, tablet and desktop sizes.

For element placement, `anchor` defaults to `bottom`, `elevation` to `0`, and `rotation` to `0`. Ground `opacity` defaults to `1`. Omitted optional values retain their omission in editable JSON while playback applies these defaults.

## Poses, motion and interaction

An element may select `{ "index": 0, "columns": 3 }` from a horizontal image atlas. `index` is zero-based and must be smaller than `columns`. Omitting `pose` uses the complete image. A new image does not acquire movable limbs: the version 1 `rock` preset moves the complete card around its placement anchor.

`motion.preset` is `rock`. Its trigger is `open`, `interaction`, or `narration`. A narration trigger also names a segment in the same spread. `duration` is seconds; `strength` is the peak rock angle in degrees; optional `delay` is seconds and defaults to `0`; optional `repeat` defaults to `1`. An `open` motion starts when the stage is upright and visible. Narration motions use the reader’s decoded audio durations and playback position, so rounding in declared durations does not accumulate drift. Reduced-motion playback keeps a stable final presentation and does not depend on repeated movement to communicate meaning.

Imported drafts currently inherit the reader’s quiet `hope` ambience; there is no authored ambience or music selector in v1. The existing mute/volume control applies to narration, ambience and interaction sound.

`interaction` supplies a concise accessible `label`, a visible `response`, and optionally `sound: "tap"`. The reader provides named buttons below the text for both pointer activation and a keyboard equivalent (Tab, Enter or Space). Canvas cutouts are not direct hit targets in v1. Do not hide story-critical information exclusively inside an interaction.

## Narration and stale recordings

A segment's optional `narration` references an audio asset and records its measured `duration` in seconds, descriptive `voice` provenance, and exact `recordedText`. The cue is current only when `recordedText` exactly equals the segment's `text`. Editing text therefore produces a focused stale-narration issue instead of silently playing mismatched words; unrelated cues remain reusable. If one cue is missing or stale, preview suppresses narration for that spread so phrases cannot skip or play out of order.

Use the targeted replacement command after recording or supplying a new public-root WAV:

```sh
npm run book:replace-audio -- public/books/quiet-garden.book.json garden-begins garden-made assets/audio/my-garden-made.wav af_heart
```

The command measures the WAV, changes only that segment's narration and its asset registration, and snapshots its current text as `recordedText`. It does not synthesize speech. Missing narration still permits text preview but is reported so a finished narrated spread cannot pass unnoticed. Browser imports can decode WAV, MP3 or Ogg audio, while this bounded replacement command accepts WAV.

## Validation and import behavior

Validate a file before previewing it:

```sh
npm run book:validate -- public/books/quiet-garden.book.json
```

Shared validation covers the format/version, IDs, references, supported presets and triggers, numeric ranges, safe asset locations and narration freshness. The CLI checks image file headers and PCM WAV duration; reader import fully decodes images and browser-supported audio and checks measured duration within 0.04 seconds. Messages include the JSON path and a direct explanation, for example a missing asset reference or stale recording.

Import is transactional: the reader validates the complete document before changing the preview. An invalid import displays its issues and leaves the current book untouched. A valid import is an ephemeral preview; **Undo previous preview** restores the immediately preceding valid preview, and **Return to reader** leaves authoring without installing or altering Eden or Noah.

Version 1 does not promise a general rig editor, arbitrary scripts, remote assets, accounts, collaboration or publishing. Unknown fields and unsupported behavior are errors rather than silently ignored instructions.

## Bounds, defaults and rendering rules

| Field                           | Supported range / rule                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| IDs                             | Lowercase letter first, then letters/digits/hyphens; maximum 64 characters   |
| Book size                       | 1–40 spreads; 1–12 text segments and 0–16 elements per spread; 1–128 assets  |
| Element x / depth               | −2.8…2.8 / −1.2…1.2 page units                                               |
| Element width / height          | 0.1…5.6 / 0.1…2.7 page units                                                 |
| Elevation / rotation            | 0…2 page units / −45…45 degrees; defaults 0 / 0                              |
| Anchor                          | `bottom` (default) or `center`; center at elevation 0 extends below the page |
| Ground x / depth                | −2.8…2.8 / −1.2…1.2 page units; center placement                             |
| Ground width / height / opacity | 0.1…5.6 / 0.1…2.4 units / 0…1 (default 1)                                    |
| Motion duration / strength      | 0.2…30 seconds per cycle / 0…20 degrees peak                                 |
| Motion delay / repeat           | 0…60 seconds (default 0) / integer 1…10 cycles (default 1)                   |
| Narration duration              | 0.05…180 seconds per cue, measured from the file                             |
| Media                           | PNG, JPEG, WebP images; browser-supported WAV, MP3, Ogg audio                |

The fixed backdrop is 5.8 × 2.7 units at depth 1.22. Artwork stretches to the authored
rectangle; pre-crop it if a different framing is needed. An atlas pose trims transparent
borders inside the selected cell; a non-atlas image uses its full rectangle including alpha.
The floor stays horizontal; cutouts rise perpendicular to it. There is no automatic layout,
occlusion correction or camera adjustment. Check your composition in preview.

Assets above 32 MiB each are rejected. Portable export caps decoded media at 96 MiB;
file import caps JSON at 140 MiB. Use modest media for phone performance. The exporter
embeds the complete registered asset set, including unused entries, preserving authored
settings and attribution. Unknown versions must be migrated explicitly before import.
