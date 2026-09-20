# Current extension: image animation and flips

Each placed actor/prop has one optional animation per page: Rock, Float, Sway, Pulse
or Spin. The visual inspector supports preset, once/loop playback and cycle duration.
`loop: false` means one cycle; true repeats indefinitely; omitted preserves legacy
`repeat`. Preset changes preserve existing triggers and timing. The whole card moves,
not limbs or sprite-sheet frames. Every completed cycle returns to its original placement.
Ground and backdrop remain static scene surfaces; they support both flip controls.

`book-animation.ts` samples absolute offsets. `AuthoredStage` applies them in both
reader and editor, including audio/language timeline scrubbing and reduced motion.
Image flips modify geometry UVs, preserving atlas selection and shared texture/cover
orientation. Export/reimport and undo retain settings. Older clients may reject the
new optional fields and presets; existing v1 books remain valid in this client.

Verification: 111 unit tests and typecheck pass, including all presets, legacy timing,
loop/once endings, timeline scrubbing, reduced motion and non-compounding UV flips.
Three focused visual browser checks pass, including controls at desktop/tablet/phone widths, undo/redo, export/reimport and reader loop/once behavior. Results are in `review/latest/visual-editor-results.json`.
See [the visual editor guide](visual-editor.md) for control locations.

---

# Current extension: audio, languages and review

The current task adds **Audio & languages** to the editor and **Preview audio & languages**
to the visual toolbar. See [the production guide](audio-language-authoring.md). The
shared format now supports optional translations, soundtracks, page timing, voice
preferences and review attestations. Old books remain valid. The source-of-truth
modules are `book-localization.ts`, `book-audio.ts`, `book-generation.ts` and
`book-production.ts`; the static reader shares the mixer through `book-reader-audio.ts`.
`production-preview.ts` uses `AuthoredStage`, including timeline-based motion scrubbing.

Vite's authoring-only proxy connects loopback Kokoro port 8770. API keys stay in
page memory and never enter the book. OpenRouter uses configurable structured-output
chat completion requests; no live paid request was made. Generated translation and
voice content must receive a human review; generated output is not automatically approved.
Reviewed export is separate from ordinary draft export and publishes nothing.

Verification for this extension: 99 passing unit tests; 10 passing authoring browser
checks; the complete production browser workflow at a nested static URL, including
all nine languages, failure/cancellation, secret exclusion, review invalidation and
reviewed export/re-import; clean typecheck/format/content validation and production
build. Existing loader/chunk-size build warnings remain.

Current verification is recorded in `review/latest/production-results.json` and
`review/latest/authoring-results.json`; do not infer human language/listening approval
from automated checks. The local Kokoro proxy was additionally verified with actual
English and Spanish output at 24 kHz. Continue only the user's requested work; the
historical aesthetic improvement loop remains parked.

---

# Book authoring foundation — durable handoff

**Current editor:** Author opens **My books**, with new/import/edit/delete and restore.
Books and uploaded media autosave in IndexedDB on this device. Selecting a book opens
the live visual editor; blank books have one neutral page and no story-specific art.
**Preview page** provides read-only scene preview with Previous/Next navigation.
The live workspace now also has an overlap chooser and Alt-click cycling, a selected-art
move handle, ground transform controls, page/backdrop guides, static pose-sheet settings,
and growing story-line fields. Ground rotation is an optional backward-compatible v1
field; updated clients support the wider numeric ranges in the contract. Older clients
may reject books using the new field or expanded bounds.
See [the visual editor guide](visual-editor.md). The foundation record below describes
the earlier JSON workflow; direct selection, dragging, resizing, live sliders, visual
undo/redo and current-draft export have since been added.

The first working authoring milestone is implemented locally. The old quality-improvement
loop remains parked. Do not expand this into a visual editor or another aesthetic iteration
without creator steering. No services were purchased; nothing was pushed, merged or deployed.

## Launch and import

From `prototypes/little-light-library`:

```sh
npm ci
npm run dev
```

Open the localhost URL Vite prints (normally port 8771; it chooses the next free port).
Choose a UI language and enter the library. **Author → Edit Quiet Garden → Read book**
opens the demonstration in the reader. Import a `.book.json` file or paste JSON to use your own book.
The draft locale is explicit; changing reader language still preserves both original books'
nine locales and does not translate an imported draft.

The sample is [quiet-garden.book.json](../public/books/quiet-garden.book.json). The [creator
guide](creator-guide.md), [contract and glossary](book-contract.md), [machine schema](../scripts/book.schema.json)
and [reusable agent instructions](agent-authoring.md) are the authoring entry points.
[Audit and decisions](authoring-decisions.md) explain the integration and scope tradeoffs.

## Implemented path

One validated JSON contract carries book/spread identity, source/retelling/staging notes,
text, an attributed asset registry, a cover, upright backdrop, optional horizontal ground,
multiple independently placed actors/props, atlas poses, anchors, a tunable whole-card rock,
native interaction buttons and measured narration. The generic stage uses `page.authored`;
Eden and Noah retain their original renderer path and content.

The Author dialog validates before applying. Invalid data/media retain the current preview;
a runtime failure during apply restores prior draft/state. Up to ten validated in-memory
snapshots support undo. Nothing installs into or replaces the built-in library. Export
embeds the complete registered media set into portable JSON for another static reader.
Export uses the current edited book; apply raw JSON changes before exporting.
Books persist across refresh in this browser; undo history is session-only. Keep exports
as backups and to move between devices. Clearing site data removes local books.
The initial book catalog seeds only once, and imports use separate storage keys so a
matching book ID cannot overwrite another draft. Deletion is recoverable. Existing
Eden/Noah remain reader examples; the editable catalog contains Quiet Garden and Jonah.

`npm run book:validate -- FILE` runs the shared rules plus image-header and PCM WAV checks.
Browser validation fully decodes media. `npm run book:replace-audio -- FILE SPREAD SEGMENT
PUBLIC_RELATIVE_WAV VOICE` measures a supplied recording and changes only that cue plus a
new asset registration. Existing recordings are retained. Text edits leave `recordedText`
unchanged and report exactly the stale cue; its whole spread becomes read-only narration
until repaired. Other spreads can still play. This command does not synthesize speech.

## Review and evidence

See [the current authoring verification](../review/latest/authoring-verification.md) and its
linked automated results for checks actually run, visual observations and remaining limits.
The first usable preview was shown to the creator with a placement edit, followed by ground
opacity and gesture edits to the same JSON. Focused feedback was requested about terms,
control and the preview loop. Silence is not creative approval.

## Known limits and next phase

- Single-locale draft packages; authoring controls are English. Reader UI keeps the existing
  nine locale choices. There is no draft translation fallback.
- Rock is a whole-card gesture, not a limb rig. New rigs, scripts, camera controls, arbitrary
  sound/music tracks remain deferred. Direct canvas selection and resizing are implemented.
- Layout values have bounded ranges, but composition, overlap and framing still need visual
  judgment. There is no automatic layout solver.
- Portable JSON requires this compatible static reader; it is not a standalone HTML executable.
  Base64 increases size. Use small assets for phone performance.
- Recording metadata cannot certify spoken content. Demo narration reuses exact existing
  en-US clips; duration checks are not listening, pronunciation or theological approval.
- Visual undo/redo is session-only. Autosave uses browser IndexedDB, with visible failure
  status and export recovery. There is no account, cloud sync or multi-tab collaboration.

Recommend a creator-led session making a fresh book through My books, filling pages and
previewing them in order. Keep the contract shared with
agent authoring and preserve exact text/audio staleness behavior.

## Local commits

Implementation, documentation, demo and verification: `85dfd7d`
(`feat: add Little Light Library book authoring foundation`). Normal publication and
69-test hooks passed. Later documentation-only handoff references can be found with:

```sh
git log --oneline --grep='book authoring' -5
```

Commit references and final check results are recorded in the delivery response and current
verification note. Normal pre-commit publication and fast-check hooks must remain enabled.

## Publication hook boundary

This prototype already had a portal tile when this milestone began. Its normal commit
hook required the nine changed/new source files to be explicitly listed and hashed in
`projects/portal/publication.json`. Those source changes were reviewed and registered;
no hook was skipped or weakened. The existing `static_output_digest` remains unchanged.
A future portal build will require a separate review/update of the newly generated static
output before it can publish this implementation. No portal tile presentation, deployment or published
artifact was changed in this task.
