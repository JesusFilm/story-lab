# Reusable agent instructions for book authoring

Use these instructions when asking an agent to create or revise a Little Light book. The agent edits the same JSON a person edits and must not introduce an agent-only representation.

## Instructions

1. Read [`docs/book-contract.md`](book-contract.md), [`src/authored-book.ts`](../src/authored-book.ts), the generated schema at [`scripts/book.schema.json`](../scripts/book.schema.json), and the target book before editing. Use [`public/books/quiet-garden.book.json`](../public/books/quiet-garden.book.json) as the version 1 example.
2. Clarify the smallest requested story, staging, motion, interaction, text or asset change. Preserve all unrelated authored settings and stable IDs.
3. Edit only the book JSON and explicitly supplied or approved local assets. Do not edit renderer source to accomplish a supported authoring change. Do not invent file paths, asset IDs, motion presets, rig capabilities, dialogue, biblical quotations or attribution.
4. Keep source, retelling and staging distinct. `source` cites underlying material; segment `text` is authored retelling; `stagingNote` identifies visual interpretation. Retain `status: "draft"`.
5. Use only the supported version 1 behavior. Atlas `pose.index` selects a zero-based horizontal cell. It is not a joint or anatomical rig. `rock` moves the whole card around its anchor; its `strength` and placement `rotation` are degrees. If the request needs unsupported behavior, state that limitation instead of encoding pseudo-fields.
6. Treat `src` as relative to the reader's `public` root. Reject external URLs, absolute paths and traversal. Register every referenced asset with the correct kind and attribution. Portable data URIs should come from the reader's export flow.
7. When segment text changes, leave its old `recordedText` intact so validation truthfully identifies stale narration. Do not relabel an old recording as current. Replace only the affected cue when a matching WAV and voice are available:

   ```sh
   npm run book:replace-audio -- BOOK_FILE SPREAD_ID SEGMENT_ID PUBLIC_RELATIVE_WAV VOICE
   ```

   The command measures the WAV duration and snapshots the current text. Never regenerate or replace unchanged recordings. A missing or stale cue suppresses narration for its whole spread so playback cannot skip phrases.

8. Run the shared validator after each coherent edit:

   ```sh
   npm run book:validate -- BOOK_FILE
   ```

   Resolve every structural, reference and asset error. A stale-narration issue may remain only when reporting that a new recording is still required; do not claim the narrated book is complete.

9. Preview through **Author → import or paste JSON → Validate & preview**. Check the requested change at relevant phone, tablet and desktop sizes and use keyboard activation, mute and reduced motion when the edit affects them. Visual inspection and listening are human judgments; report them separately from automated validation.
10. Report the exact JSON paths changed, validation actually run, stale or missing narration still outstanding, and the focused preview checks for the creator. Invite the creator to judge terminology, control and staging. Do not expand into unrelated polish.

## Example requests

Placement:

> In `public/books/my-book.book.json`, move the element with ID `miriam` 0.25 page units left on spread `river-bank`. Preserve its depth, size, anchor and all other fields. Validate and report the changed JSON path.

Ground print:

> Change spread `river-bank` to use the registered image asset `reeds-ground` as its horizontal ground print. Keep the upright backdrop. Start from the existing ground placement, preview at phone and desktop sizes, and validate.

Gesture:

> Make element `miriam`'s existing `rock` motion quieter by reducing only `strength`. Keep its trigger, segment, delay, duration and repeat. Remember that this moves the complete anchored card; do not describe it as an arm rig.

Text and narration:

> Revise segment `welcome` on spread `river-bank` to the supplied sentence. Preserve its segment ID and leave the old narration metadata untouched so it is reported stale. Validate, list only the affected cue, and do not replace audio until I supply or approve a matching recording.

These requests are intentionally precise enough to review in a JSON diff. A useful agent response names the book and IDs, makes the bounded change, validates it, and leaves taste decisions with the creator after preview.
