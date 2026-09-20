---
name: little-light-books
description: Create, revise, validate and prepare committed Little Light Library books with local tools and the shared reader. Use for story briefs and book content changes, not room redesign or a new authoring application.
---

# Little Light books

Work in `prototypes/little-light-library/` relative to the repository root. Read its
`AGENTS.md`, `docs/creator-guide.md`, `docs/book-contract.md` and the current
`styles/little-light-library/README.md` at the repository root. For audio edits also
read `docs/audio-language-authoring.md`; for showcase work read `docs/feature-roadmap.md`.

The website is a reader. Author in repository files and preview the actual reader.
`public/books/catalog.json` is the ordered collection; each generic book is one
`public/books/<id>.book.json`. New books use v1 rather than new renderer branches.
Eden/Noah retain a documented compatibility adapter for their existing rigs/locales;
inspect `docs/architecture.md` before changing either. Use `book:create` for a new
scaffold; test-only fixtures are not content briefs or books to publish.

## Create from a brief

Establish the requested passage, intended reader, language and story scope from the
brief. Clarify only missing choices that materially affect meaning or production.
Prepare ordered pages with short readable segments and stable IDs. Preserve the
distinction between cited Scripture (`source`), authored retelling (`retellingNote`
and segment text), and invented staging (`stagingNote`). Do not invent Bible quotes.

Use the local `book:create` command documented in the creator guide. Put owned runtime
media under `public/assets/books/<id>/`, reference it through the asset registry, and
retain source artwork and prompts outside `public/`. Reuse available art/tools first.
For new raster artwork follow the available imagegen skill and the visual guide;
for new 3D assets use the project create-asset workflow. Generation and paid services
require the scope/cost authority of the actual request. No generation runs in the reader.

Build the minimum complete scene: backdrop, optional quiet ground print, separately
placed cutouts, cover and relevant toys. Prepare genuine alpha edges and consistent
character references. Place by page units, preserve the gutter/text sightline, and
inspect phone and desktop composition. Atlas poses are static selections; motion
presets move whole cards. Choose restrained motion and interactions that support the
story; essential meaning remains in text with mute and reduced motion.

## Revise an existing book

Inspect the JSON, catalog registration and affected media before changing anything.
Preserve IDs and unrelated text, locales, assets and geometry. Revise only requested
content. A text change intentionally leaves old `recordedText` intact until a new
recording exists: never relabel old audio as newly spoken words. Generate or replace
only affected cues using local tools from the audio guide, and measure the new WAV.
Preserve current translations; reconcile source fingerprints only after actual review.
Soundtrack page anchors, narration duration, page minimum time, gain and fades must
agree. Do not fabricate listening, pronunciation, translation or editorial approval.

## Validate, preview and prepare inclusion

Run `npm run book:validate -- public/books/<id>.book.json`, address errors and report
incomplete narration explicitly. Use `book:register` and `book:catalog` as documented;
registration makes the book visible directly, with no browser import or account.
Run the reader and inspect every affected page, narration/highlights, interactions,
toys, page order and cover/spine. Inspect the whole reading experience before calling
a book complete, with phone/desktop, keyboard, mute and reduced-motion coverage.

Run `npm run verify` and the relevant static browser checks before handoff. A finished
narrated book must pass strict validation, but automated checks are not creator review.
Review the exact publication file list and generated output fingerprint when runtime
content changes; never bypass the publication hook. Include JSON, registration, owned
media, useful editable sources/prompts, attribution and necessary documentation in the
commit. Exclude secrets, provider jobs, caches, temporary renders and private recovery
dumps. Follow generated-output retention rules. Commit/push/deploy only within the
user's requested scope; the skill itself does not authorize publication.

Report launch/validation commands, changed book and media paths, checks actually run,
remaining creator decisions and limitations. If browser drafts are involved, use
`docs/draft-recovery.md` before discarding any storage or overwriting a matching book.
