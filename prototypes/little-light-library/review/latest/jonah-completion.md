# Jonah book completion and verification record

## Plan and ownership

The work was divided so the story, generic reader and shelf identity could be
completed in parallel:

- **Root coordinator:** managed integration and performed the production-browser
  reading of Eden, Noah and Jonah.
- **Jonah content:** authored the 13-page Jonah 1–4 retelling, translated its
  text and labels into the other eight library locales, created the scene art,
  and supplied source art briefs and attribution.
- **Core audio:** implemented page-independent soundtrack lifetime and fade
  behavior, localized narration support and transitions, plus the shared audio
  regression checks.
- **Cover/catalog:** added one shared appearance contract for legacy and generic
  books, applied each book's palette to shelf, preview, closed and open table
  materials, generated the per-book review indexes, and added contract/catalog
  tests. Four original ambience beds and their deterministic source generator
  were also added.

The common book renderer and audio transport remain generic. Jonah-specific text,
art, narration and soundtrack ranges live in its JSON and registered media.

## Current authored content

Jonah has 13 spreads from Jonah 1–4, with a current translated segment and
measured narration on every spread in all nine locales: `en-US`, `en-GB`, `es`,
`fr`, `hi`, `it`, `ja`, `pt-BR` and `zh-CN` (the locale list is shown in the
[generated book index](../../docs/books/jonah-and-the-whale.md)). That is 117
narration cues. The source text distinguishes the authored retelling from Bible
quotation; the ending leaves God's question to Jonah about compassion unanswered.
The corrected source and translated retelling notes have matching fingerprints.

The reading includes Joppa and ship scenes, a storm and calming sea, the great
fish and small fish, Nineveh residents, and the shade plant's growth and loss.
Scene placement, labels and restrained actor/prop motion are recorded by page in
the book JSON and linked from the generated index. There are no book-specific
cabinet toys; that optional shelf feature is not required to read the story.

The three books have explicit, distinct cover identities, shared by all physical
views: Eden green (`#536C45` / `#344831`), Noah brown (`#79543E` / `#503829`),
and Jonah sea blue (`#315E78` / `#21445A`), shown as cover/spine colors. Their
accent colors are likewise explicit in the catalog or book JSON. The same cover
art texture and palette follow a book through shelf, preview, closed-table and
open-table states.

## Soundtrack source and measurements

The four WAVs were composed locally by the deterministic NumPy generator at
[`assets/books/jonah-and-the-whale/audio/generate_soundtracks.py`](../../assets/books/jonah-and-the-whale/audio/generate_soundtracks.py).
They use generated noise and synthesized tones only: no downloaded recording,
third-party sample or external audio service. Rerunning the generator reproduced
the same four SHA-256 values below. Each file is mono, 24 kHz, 16-bit PCM,
384,001 frames (16.00004 seconds). The generator checks the quiet ceiling and
loop boundary; independent measurement confirms the first and last PCM samples
match and the wrap step is zero.

| Sound bed | Page span | RMS | Peak | SHA-256 |
| --- | --- | ---: | ---: | --- |
| Harbor calm surf | `jonah-called`–`jonah-boards-ship` | −34.00 dBFS | −19.55 dBFS | `a43f78fbd75451d9a11a9c2810cc21efa7f462aeea291d348bbf55179ed71d97` |
| Storm wind and rain | `storm-at-sea`–`jonah-overboard` | −33.76 dBFS | −18.42 dBFS | `c02e31b18964ccc466f6cff4ae9fc740f073a861f31e287752d35ff712e7f01f` |
| Deep-water prayer | `jonah-rescued`–`jonah-ashore` | −35.50 dBFS | −21.77 dBFS | `0f89c9e2889bab9093cb58fe778891523f8f8574cab1739146c6fd94831483e3` |
| Warm Nineveh breeze | `nineveh-warning`–`jonah-mercy` | −35.00 dBFS | −20.32 dBFS | `decfaaee148bec0ce895a669b82e00590c9f3284bdff4be9e02e3eab961756ad` |

All four loop continuously on their authored inclusive page ranges. Their shared
reader fades them in, fades them out when leaving a range and carries a continuing
layer through page turns. Track levels and fade times are catalogued per book in
the book index. These measurements establish source format, level and loop
boundary only; they are not a listening-quality judgment.

Root also measured all 117 narration WAVs: 13 per locale, non-silent mono 16-bit
files, 4.17–13.5 seconds each, with maximum peak 31,359 of 32,767. Their declared
`recordedText`, duration and voice provenance are stored per localized segment.
Playback and highlighting were exercised in the reader, but there was no
subjective listening or pronunciation audit.

## Checks and observed reading

- Root's final `npm run verify` passed lint, typecheck, index freshness, 166/166
  mechanical tests, catalog validation and production build.
- After the final motion-strength adjustment, Jonah's focused scene-quality test
  passed 8/8 and `npm run book:validate` passed. The alpha-aware checks cover
  source/runtime dimensions and the authored motion ranges. The Nineveh children
  and flock use lively p8 motion strengths of 4.5 and 6, with restrained p9
  strengths of 0.5 and 0.4 respectively.
- Regular catalog validation passes with warnings. Strict validation remains
  blocked by 117 `MISSING_REVIEW` records. No human translation, theological,
  creator or native-language review metadata was added to clear that gate.
- `npm run test:room` passed 9/9 checks with zero page errors and failed
  responses. Checks covered every shelf entry, reduced motion and narrow-screen
  controls, keyboard navigation, mute and volume, Jonah navigation, nested static
  resources and cover continuity. The current machine result is retained in
  [room-results.json](room-results.json).
- `npm run test:audio-continuity` passed in real Chrome: one soundtrack source
  continued through a two-page linger and physical page turn, then faded when the
  reader left its authored range on page three. This generic check is wired into
  `verify:all`.
- Before the latest art revision, root read all 13 Jonah pages in Chrome at
  1280×900 and 390×844. For the September 24 visual revision, root rechecked
  pages 2, 5, 7, 8, 9 and 13 at both sizes, and page 6 against the desktop
  reference:
  - Page 2: the departing boat is clearly afloat and Jonah remains readable.
  - Page 5: Jonah and the open-mouth fish read as separate figures in the
    underwater scene.
  - Page 6: the cutaway clearly shows praying Jonah inside the fish and the
    small fish outside it in the desktop reference.
  - Page 7: the fish-to-shore landing joins wet water to dry sand.
  - Pages 8–9: the same child and goat/lamb identities shift from lively
    Nineveh street life to quiet remorse; the children visibly kneel in prayer.
  - Page 13: happy Jonah remains under the withered plant, and the sunlit
    Nineveh vision has a readable outlined bubble and dots.
- Root also checked the nine locale controls and labels at phone width. Eden and
  Noah were read page by page during the earlier completion run; their shared
  reader and cover transitions were checked again with the final UI.
- No claim of subjective audio approval is made.

### Prior completion-run evidence

Before this visual revision, recovery preserved stale authoring storage and the
failure/retry suite passed 5/5 for missing catalog, invalid catalog path, invalid
definition, missing art and missing audio. Root also read all eight Eden pages
and eight Noah pages; their text and scenes matched their books. The Japanese
page-6 text, Play, highlighting and CJK layout were exercised, as were mute and
keyboard Previous. Cover continuity across shelf and table states, with distinct
green, brown and blue palettes, was checked in that completion run.

Publication fingerprints and the nested static-output digest are retained in
`projects/portal/publication.json` after review of the source-art PNGs, prompt
sidecars, book indexes and all Jonah runtime media. The final Little Light
Library list contains 292 explicit files; all 292 have current hashes, and the
manifest has 698 reviewed hashes overall. Its `dist-static` output digest is
`01de84a01ed5b96bce626b32073eb6bde5a360f7a6f864c779667150d8176dcc`. The
publication check passed against a temporary Git index with current hashes
and module closure for all 698 reviewed files; the user's real Git index was
not staged. This report records verification, not creator approval or
publication; no release or deployment was performed.
