# Local narration, languages and soundtracks

Generation happens on the author's machine. The static reader plays committed
media and never calls Kokoro, a translation service or an API proxy. Preview all
changes in the reader. The retired audio/language production screen and its
reviewed-export workflow are no longer entrypoints.

The first future showcase target is a complete English (US) experience. Preserve
Eden/Noah's existing nine languages; editor cleanup does not generate translations,
voices or missing Jonah audio.

## Choose the correct content path

Eden and Noah retain `public/content/<locale>.json` and
`public/audio-manifest.json`. Their existing generator and voice inventory are
documented in [legacy audio production](audio.md). Do not apply the generic JSON
CLI to a locale manifest or regenerate all languages to verify a tooling change.

Generic books put exact text and optional narration on each segment in
`public/books/<id>.book.json`. A recording references a registered audio asset
and includes `recordedText`, measured `duration` and descriptive `voice`.
Text and recording must agree exactly. Changing a sentence keeps old
`recordedText` intact until matching audio exists; never relabel old speech.

## Local selective synthesis

Read the [Kokoro Voice Lab setup](../../../projects/kokoro-voice-lab/README.md)
before starting production. The existing lab runs on Apple Silicon with its own
Python environment and model. It is separate from this prototype. Inspect the
available environment/model/voices; do not assume the server is running or install
large dependencies merely to validate books. Initial setup can require downloads.

From `projects/kokoro-voice-lab/`, the lab's documented startup is
`uv run python server.py` after environment setup. It normally binds loopback
port 8770. Existing installations may run `.venv/bin/python server.py`.
Wait for its ready state and inspect the actual available voices.

From the prototype directory, inspect work before synthesis:

```sh
npm run book:narrate -- public/books/my-book.book.json --dry-run --locale en-US
npm run book:narrate -- public/books/my-book.book.json --locale en-US --voice af_heart --speed 1 --spread river-bank --segment welcome
```

These are templates for an existing authored file and IDs, not commands to create
Jonah's missing narration during cleanup. The script:

- Reads existing text in one selected locale; it does not write a story or translate.
- Skips cues whose text and voice/speed provenance match. Filters `--spread` and
  `--segment` select only affected content; `--force` regenerates that selection.
- Uses `--server http://127.0.0.1:8770` by default, querying the local lab's
  voice/synthesis endpoints directly. Only loopback HTTP is accepted and redirects
  are rejected. It does not start/install the model or call a paid provider.
- Writes measured PCM WAVs and updates each completed cue atomically, so rerunning
  resumes completed work. Old media/assets and review records remain; changed
  data makes relevant review fingerprints stale.
- Makes no network requests or file writes with `--dry-run`. Dry-run describes
  planned work, not model availability or voice quality.

New media belongs beneath `public/assets/books/<id>/`, with `audio/<locale>/`
for narration. The script writes `PAGE-SEGMENT-HASH.wav` there and records the
public-relative path. Keep useful source takes separately; do not commit lab caches or
temporary server outputs. Preserve all existing content paths.

Select a same-language voice and listen before accepting it. `narrationSettings`
can hold voice/speed preferences; they are not proof of how old audio was produced.
The cue's voice provenance identifies actual generation choices. Do not erase
provenance solely to make skipping or validation appear successful.

## Supplied recordings and targeted replacement

Copy a matching PCM WAV into the book's owned media directory, then bind it:

```sh
npm run book:replace-audio -- public/books/my-book.book.json river-bank welcome assets/books/my-book/audio/en-US/river-bank-welcome.wav af_heart
npm run book:validate -- public/books/my-book.book.json
```

Use `--locale LOCALE` when replacing a stored translation cue. The command
measures the WAV and updates only the named segment plus a new asset registration.
It preserves other recordings and does not synthesize speech. Replace any default
attribution with truthful rights/provenance. Do not overwrite shared files to
change one cue.

Local validation measures PCM WAV frames directly; MP3/Ogg validation requires
the optional local `ffprobe` executable and fails with an actionable message
when unavailable. The replacement command expects WAV. Browser decoding is an
additional test, not a substitute for correct metadata.

## Timing, page progression and mix

One cue corresponds to a readable phrase, not guessed word timestamps. Measure
the final encoded file after trimming/editing. Shared asset validation rejects a
declared duration more than 0.04 seconds away from measurement. Text equality
cannot prove that speech says those words; listen for names, dropped/repeated
words, clipping, pauses and pacing.

A generic spread lasts `max(seconds ?? 8, sum(narration durations))`. Its
narration cues follow one another on the measured audio clock. The reader uses
decoded durations for highlighting and narration-triggered motions. The current
reader exposes a page range on a full-book timeline; do not assume it automatically
turns pages or guarantees gapless sound through book transitions.

If any segment lacks current narration, narration for the whole spread is
suppressed so phrases cannot skip or mismatch. Text and interactions remain
available. Soundtracks may still play where configured. Jonah currently has
three such missing cues; its narration-triggered whale gesture is not a completed
spoken performance.

A `soundtracks[]` layer names an audio asset, inclusive `startPage` and
`endPage`, offsets trimming the range, `volume`, `fadeIn`, `fadeOut` and
`loop`. Offsets must leave positive playable time. Non-looping media ends when
its file or range ends; looping tracks end with their range. Fades are bounded
by the clip's playable duration. Recheck timing whenever text/audio/page ordering
changes, including any existing translation timeline.

Set a quiet track gain under intelligible narration and verify the complete
mix by ear, including fade boundaries and toy/effect levels. `narrationVolume`
controls narration relative to tracks; reader master volume/mute affects both.
Generic books pause the legacy procedural ambience. No particular numerical
gain guarantees a balanced mix across different recordings or phone speakers.

Test Play/Pause, Replay, speed, mute, page turn, Library/Continue, book swap,
language change and tab hiding. Muting preserves the clock; leaving/changing
content must not leave old audio playing.

## Languages and review records

The source `locale` and text are required. Optional `languages` includes that
source locale. `translations[locale]` reuses spread, segment and element IDs,
with localized text, labels, interaction responses and cue metadata. Geometry
and soundtrack settings stay in the source definition. The source fingerprint
detects translations that became stale after source edits.

The nine UI locales do not imply nine translations for every JSON book.
A valid matching translation is used when available; otherwise the reader opens
the book's source language and identifies it. It must not describe that fallback
as a translated edition. Quiet Garden and Jonah currently contain en-US only.
Toy labels remain in their source language.

Existing `reviews[]` entries are explicit historical creator attestations,
not an automated release switch. Changed text, layout, relevant assets, toys or
timeline can invalidate their fingerprints. Same-path external media-byte changes
also need fresh review even if a data fingerprint is unchanged. Neither a CLI
nor a successful synthesis run may assert that somebody listened.

## Validation and completion

```sh
npm run book:validate -- public/books/my-book.book.json
npm run book:catalog
npm run book:validate -- public/books/my-book.book.json --strict
```

Schema, reference and media failures exit unsuccessfully. Normal validation
reports missing/stale narration, translations and review as warnings.
`--strict` turns all shared warnings into failures; it still cannot certify
editorial or listening approval. The present catalog deliberately retains Jonah's
incomplete narrated draft, so strict catalog validation is not the cleanup's
completion gate.

The CLI enforces 1,024 registered assets, 32 MiB per asset and 96 MiB of registered
media bytes (after base64 decoding for recovered embedded documents). These are
package ceilings, not decoded browser-memory or phone performance targets. Split or
reduce a large book rather than assuming the reader streams everything.

A complete narrated future book needs every intended cue current, measured and
actually listened to, all story/art/audio reviewed by the creator, and a production
static-path pass. Record what was heard, what tools measured, who explicitly
approved the result and what remains unknown separately. Keep the final verification
record in [the implementation handoff](authoring-handoff.md) for this cleanup;
future feature evidence belongs with its own delivery.
