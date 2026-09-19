# Book authoring foundation — durable handoff

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
Choose a UI language and enter the library. **Author → Load two-spread demo → Validate &
preview** opens Quiet Garden. Import a `.book.json` file or paste JSON to use your own book.
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
Export uses the last validated preview; unvalidated textarea changes are not exported.
Keep source files or exports: a refresh discards session history.

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
  sound/music tracks, direct canvas selection and a full visual editor are deferred.
- Layout values have bounded ranges, but composition, overlap and framing still need visual
  judgment. There is no automatic layout solver.
- Portable JSON requires this compatible static reader; it is not a standalone HTML executable.
  Base64 increases size. Use small assets for phone performance.
- Recording metadata cannot certify spoken content. Demo narration reuses exact existing
  en-US clips; duration checks are not listening, pronunciation or theological approval.
- Session-only undo has no redo or autosave service. Local files and exports are durable copies.

Recommend one creator-led session on actual story edits next. Use that feedback to choose
which small controls deserve a visual interface over v1. Keep the contract shared with
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
