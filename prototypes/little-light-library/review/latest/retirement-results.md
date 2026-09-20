# Editor retirement verification — 20 September 2026

## Follow-up — 21 September 2026: demonstration removed

At the creator's request, Quiet Garden's JSON and catalog entry were deleted.
Eden, Noah and Jonah are the only three committed books. Shared media and all
remaining story definitions/locales were preserved. Current guides and the book
skill no longer direct creators to the removed example. It remains recoverable
in git history; no browser data was cleared.

`npm run verify:all` passes: 144 tests, catalog/media validation, production build,
nine nested-static browser checks, draft recovery and five failure/retry cases.
Generic narration/translation/soundtrack tests now construct a disposable adapter
from existing Noah media, injected only into isolated test pages. That fixture is
not in `public/`, the catalog or the static output. The live preview was refreshed
and visually inspected with only the three intended shelf spines.

Portal build and verification pass (765 files) under all three deployment prefixes.
Reviewed catalog hash, output digest and publication inventory are updated; the
generated artifact contains no removed book. Current machine-readable room/failure
results replace the earlier versions. No push or deployment was performed.

The remainder below records the original four-book retirement baseline, not the
current collection. Its listening/live-synthesis limitations still apply.

## Original retirement baseline

This is regression and workflow evidence, not acceptance of showcase-book quality.
The editor is archived in git; the room/reader and all existing story/media content
are preserved. No push, merge or deployment was performed.

## Executed checks

- `npm run verify`: formatting, TypeScript, all 143 unit/local-tool tests, catalog,
  existing content/theatre/audio validation and production build pass. The sandbox
  denied loopback ports for disposable narration fixtures; the approved host run
  passed. No test was skipped or weakened for that restriction.
- `npm run book:catalog`: four ordered entries. Nine legacy locales, 144 localized
  spreads, 288 phrase cues plus 27 character-name cues, and 16 directed spreads/
  17 theatre plates or atlases validate. All 315 WAV measurements and text/voice
  fingerprints pass. Jonah retains exactly three missing-narration warnings.
- `npm run test:room`: all nine production-browser checks pass at
  `/acceptance/little-light-library/`, using installed Chrome and isolated storage.
  Zero page errors, failed resources or unexpected/external runtime requests.
  See [machine-readable results](room-results.json).
- `npm run test:recovery`: absent DB is not created; live and deleted drafts,
  duplicate book IDs, settings and embedded media are preserved; relative media
  are embedded in the download; missing media are reported; original storage is
  unchanged. This used disposable synthetic storage, not a real person's drafts.
- `npm run test:failures`: five nested-static failure/retry cases pass: unavailable
  catalog, invalid catalog path, invalid definition reference, missing generic
  artwork and missing narration. Errors identify the problem; retry restores the
  shelf or readable/playable book without a stuck loader. Zero page errors or
  unexpected requests. See [failure results](failure-results.json).
- Local authoring fixtures exercise scaffold creation, append/idempotent catalog
  registration, conflict preservation, unsupported settings, missing assets,
  malformed WAVs, stale audio, targeted replacement, selective/resumable narration,
  cancellation and preservation of edits made during synthesis. No real book media
  was generated. Quiet Garden's narration dry run skips all four current cues.
- The existing Kokoro service did not return usable status/voice responses during
  the live availability check. No live synthesis was submitted. The local client
  is verified against controlled HTTP/PCM fixtures; real model synthesis remains
  an explicit unverified integration limit for this session.
- Skill-creator's `quick_validate.py` passes for
  `.agents/skills/little-light-books`; current documentation links were checked.
- Portal `npm run build`, `npm test` and `npm run test:unit` pass. The complete
  artifact has 766 files (654.0 MB); dependency and sensitive-content checks pass
  at `/`, `/story-lab/` and `/story-lab-demos/`. Fifteen Python and three JavaScript
  portal tests include PNG sanitization and overlapping source/runtime path cases.

## Browser coverage and visual inspection

The room suite covers initial committed catalog order; independence from stale
author DB data without touching it; cover Read/Return; busy-input serialization;
repeated Eden/Noah swaps; full table position/rotation/scale resets; closed cover
up in Library; saved page and paused narration position on Continue; toys and their
audio lifecycle; source/translated reader text; mute gain, volume and speed; phone,
keyboard and reduced motion. A disposable catalog fills both 15-slot shelves and
checks top toys. Unit checks cover the stop threshold at 12/13 books.

Every generic spread was navigated, with interaction responses and Quiet Garden's
decoded narration/highlights. Jonah stays readable with disabled unrecorded
narration. A disposable language/soundtrack fixture confirms the language selector
and shared audio mixer still work after editor style removal. Synthetic content
exists only in intercepted responses/test temporary directories.

The agent inspected actual rendered output: the four-book shelf, closed table
cover/toys, cover rotation and landing during a swap, settled Noah phone rendering,
Quiet Garden's stage/text/highlights and Jonah's existing phone composition.
The browser worker also inspected generic desktop/phone, translated controls and
dense shelf/toy framing. Stages are upright after unfolding; transfer snapshots
show the old book returning before the incoming book lands. Table clearance and
level final transforms pass repeated swaps. No room redesign was made.

An early phone capture showed a still-folding stage. It was not treated as settled
acceptance: captures now wait for popup angles, stage visibility, camera/look
settling and resize rendering. Fresh captures confirmed the finished state. Raw
captures are disposable; the six previously curated screenshots remain historical.

## Audio evidence and its limits

The browser decoded/scheduled existing narration and observed clock/highlight
progression and mute gain. Existing en-US Eden opening (7.88 s) and Noah opening
(6.69 s) also completed macOS `afplay` playback with exit 0. Audio output initially
failed inside the sandbox and succeeded in the approved host run.

The agent cannot claim those recordings were heard and judged for pronunciation,
tone, biblical interpretation, pacing or mix. Neither automated timing checks nor
successful playback establish human listening, editorial or translation approval.
Those judgments remain explicit future creator review.

## Repaired failures and publication review

The browser found a new catalog-loader boot failure from invoking native `fetch`
with the wrong receiver; binding the default fetch fixed it. Existing shared
reader stage, animation, audio, language and toy modules remained in place.

Full portal integration exposed two fingerprint inconsistencies: source PNGs were
hashed before their metadata was stripped by copying, and explicit source paths
could exclude runtime files at the same path. Build fingerprints now cover the
sanitized upload bytes; upload verification excludes only extra source copies.
Source-file hashes still cover original bytes. Dedicated tests verify that changed
runtime content fails the fingerprint. No publication gate was bypassed.

Little Light's static build contains 382 files: 315 WAVs, 40 WebPs, five PNGs, one
GLB, thirteen JSON files, three scripts, two stylesheets, two notices and HTML.
It uses system fonts. Runtime code inspection finds no author DB, editor dialog,
generation endpoint, localhost dependency or credential header. Reviewed source
list, sanitized artifact fingerprint and publication inventory were updated.

Existing public story definitions, text/locales, audio and artwork have no content
changes; only `public/books/catalog.json` changed. The three-showcase roadmap is
future Feature work. Quiet Garden remains a technical demonstration; Jonah has
not been completed. The classic-loader and bundle-size build warnings remain.

## Recovery, retention and local commits

No Little Light author storage was found in the accessible Chrome origin-directory
inventory. Other profiles/browsers/devices were not certified; see
[draft recovery](../../docs/draft-recovery.md). No browser data was deleted.

After review, `npm run clean:generated` removed raw captures, disposable fixtures
and prototype build directories. Runtime assets, editable sources, dependencies,
the six curated captures and the small current evidence bundle are retained.

Implementation commit: `77cada0` — `refactor: retire Little Light editor for committed books`.
The normal pre-commit hook passed the 437-file publication manifest/module-closure
check, TypeScript and all 143 tests (zero skipped). The editor is recoverable from
this commit's parent. Final evidence is committed separately as
`docs: record Little Light retirement verification and handoff`; locate its hash
with `git log --oneline --grep='Little Light' -5`. No hooks were bypassed.
