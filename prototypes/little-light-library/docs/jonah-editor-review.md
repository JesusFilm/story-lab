# Jonah editor review

The visual editor was used to create `public/books/jonah-and-the-whale.book.json`.
The draft has three spreads, five image assets, three readable narration segments,
separate backdrop and ground art, placed Jonah and whale actors, opening and
narration-timed rock motion, and keyboard/pointer interactions. The generated
art is in `public/assets/art/jonah/` and is referenced through the same portable
book contract as the existing authored demo.

The preview was validated in the browser and opened the first spread with its
cover, shore backdrop, sandy ground, Jonah, whale, text and two interactions.
The editor correctly reported that the three segments have no narration files;
the text and interactions stayed available while the play controls remained
disabled. This is an intentional capability finding for the next pass rather
than a silent failure.

## Comparison with the current library

The legacy Eden and Noah books each contain eight spreads with two text
segments per spread and are available in all nine library locales. Their
illustrations, character pose atlases, names, passages, narration and audio
manifest are maintained as separate runtime content. The authored `quiet-garden`
demo is smaller at two spreads, but already carries measured WAV narration,
ground art, cover art, staged elements, motion and interactions.

Jonah now matches the authored contract for book metadata, source and retelling
notes, spread references, backdrops, ground prints, element placement, motion,
interactions, image assets, validation and portable export. It also adds the
form controls needed to create and edit these values without hand-writing JSON.

The next challenges are:

1. **Narration production.** The editor can import an audio file and can dictate
   text when the browser exposes SpeechRecognition, but it cannot record a voice,
   synthesize a voice, trim a take, inspect a waveform, or bind a measured cue
   to the right locale. Jonah therefore previews as readable text with an audio
   warning until recordings are supplied.
2. **Localization.** A draft has one locale. There is no duplicate-to-locale,
   translation workflow, side-by-side source review, or consistency check against
   the nine existing locales.
3. **Visual layout.** Placement is currently numeric. There is no drag-on-stage
   canvas, slider-based depth/scale controls, crop tool, atlas-cell preview,
   visual collision check, or camera framing guide.
4. **Animation and sound.** The contract exposes one `rock` preset and a tap
   response. Existing books use story-specific pose specialization and richer
   timing; the editor needs reusable gestures, custom keyframes, ambience and
   per-element sound cues.
5. **Asset workflow.** The editor registers public paths or embeds selected files,
   but it does not provide a durable shared asset library, thumbnail/contact-sheet
   view, generated-art provenance UI, model import, or a guided attribution and
   license review.
6. **Story structure.** Spreads and phrases append in order, with no drag reorder,
   branching, reusable phrase library, or source passage lookup. Cover art is an
   asset selector rather than a cover composition tool.
7. **Publishing.** Validation and export are local editor actions. There is no
   editor-side portal tile preview, deployment-path check, or reviewed-file handoff
   for adding a new book to the public Story Lab portal.

These gaps are the useful boundary between the current JSON contract and a
production authoring tool: the contract already carries the data, while the next
work should make media production, localization, direct visual layout and
publishing reliable for non-technical creators.
