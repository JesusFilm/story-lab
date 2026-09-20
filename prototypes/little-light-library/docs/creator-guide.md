# Create and preview a book

Author opens **My books**. Create a blank book, edit an existing book, import a book, or delete and restore a saved book here. Each book opens into a live page editor with **Preview page**, **Previous page** and **Next page**. Changes save in this browser on this device. Follow the [visual editor guide](visual-editor.md) for adding pages and artwork, dragging and resizing characters, live sliders, undo/redo and export. The structured workflow below remains available for advanced edits. Both workflows update the same versioned document.

## Start with the demonstration book

1. Copy [`public/books/quiet-garden.book.json`](../public/books/quiet-garden.book.json) and give the copy a new `id`, `title` and `subtitle`. Do not use the reserved IDs `eden` or `noah`.
2. Keep all referenced files under `public/` and enter their paths relative to that directory. Add every file to the book's `assets` registry with its kind and attribution.
3. Edit spreads, validate the file, and correct every reported JSON path:

   ```sh
   npm run book:validate -- public/books/my-book.book.json
   ```

4. Run the reader, choose **Author → Edit Quiet Garden**, or use **Import book** from My books. Advanced JSON is available inside an open book. Choose **Validate & preview**. A failed validation leaves the current preview unchanged.
5. Judge the result at phone, tablet and desktop widths. Use **Undo previous preview** if the new composition is worse. **Return to reader** exits authoring and leaves the built-in library unchanged.
6. Choose **Export portable JSON** when the preview is ready to move. Export saves the current draft and embeds images and narration so the result is independently playable.

For soundtrack layering, bulk translation, Kokoro voices and reviewing every language before release, follow the [production guide](audio-language-authoring.md).

Read the [contract and glossary](book-contract.md) before adding new behavior. It lists the exact supported vocabulary and distinguishes an atlas pose from a rig.

## Make small, visible edits

JSON paths below refer to the demonstration file. Array indexes are zero-based.

Move Adam left on the first spread by changing:

```text
/spreads/0/elements/0/placement/x
```

For example, change `-0.65` to `-1.05`, validate, and preview. Keep width and height positive; use the preview rather than source-image pixels to judge placement.

Change or remove the horizontal ground without changing the upright backdrop:

```text
/spreads/0/ground/asset
/spreads/0/ground/x
/spreads/0/ground/depth
/spreads/0/ground/width
/spreads/0/ground/height
/spreads/0/ground/opacity
```

The ground asset must be a registered image. Removing the whole `ground` object produces an unprinted page surface; it does not remove `backdrop`.

Make Adam's whole-card gesture quieter or slower. Strength and placement rotation are measured in degrees; duration and delay are seconds:

```text
/spreads/0/elements/0/motion/strength
/spreads/0/elements/0/motion/duration
```

The `rock` preset pivots the complete paper card at its anchor. It does not bend an arm or infer joints from the painting. To choose another illustrated stance, edit the zero-based horizontal atlas cell at:

```text
/spreads/0/elements/0/pose/index
```

Change a line of text at:

```text
/spreads/0/segments/0/text
```

Validation will then report that segment's narration as stale because its `recordedText` still describes the old words. Other narration remains current. Record or supply the replacement WAV, put it under `public/`, and update only that segment:

```sh
npm run book:replace-audio -- public/books/my-book.book.json garden-begins garden-made assets/audio/my-garden-made.wav af_heart
```

The command measures the new WAV duration and copies the current segment text into `recordedText`. Run validation again and listen to the replacement in preview. If any cue on a spread is stale or missing, the preview suppresses narration for that spread rather than skipping or reordering phrases. Automated duration checks do not establish pronunciation, tone or suitability.

## Protect the meaning of the story

Keep three kinds of authorship visible:

- Cite the underlying material in book and spread `source` fields.
- Describe adaptation choices in `retellingNote`; never imply the retelling is a verbatim Bible translation when it is not.
- Put invented visual composition and action in `stagingNote` rather than presenting it as source text.

Use interactions and movement to support the retelling. Keep essential meaning in readable text so mute, keyboard and reduced-motion readers receive it too.

## Recover from an unwanted change

In the Author screen, **Undo previous preview** restores the valid preview immediately before the current one. Invalid JSON never replaces the current preview. Keep the editable source file under version control or save a copy before large text or asset changes; portable export is a transport package, not a substitute for source history.
