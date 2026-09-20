# Little Light Library

A biblical picture-book reader in a child's dimensional bedroom. The committed
shelf contains **Adam, Eve, and the Garden**, **Noah and the Great Flood**,
**Quiet Garden**, and **Jonah and the Whale**. Eden and Noah retain eight spreads
each, nine locales and recorded narration. Quiet Garden is a narrated two-spread
technical demonstration; Jonah is an existing three-spread, English-only draft
with no narration recordings. Shelf inclusion does not certify editorial readiness.

Creators work with a local coding agent on book files and media, preview in this
reader, then include reviewed content through a repository commit. The visual
editor is retired; git history is its archive. The hosted reader needs no author
account, browser import, generation service or credentials.

## Run and read

From this directory:

```sh
npm ci
npm run dev
```

Open the URL Vite prints; do not assume a free port. Choose a language and enter
the library. Select a spine to slide out its book and reveal its cover, then choose
**Read** or **Return**. Previous/Next turns pages; Play/Pause and Replay control
narration where recordings exist. **Library** closes the current book on the table;
**Continue reading** restores its page and paused narration position. Selecting
another book returns the previous one before placing the next.

The globe opens language selection. Settings control speed, mute and volume.
Muting preserves timing; hiding the tab pauses playback. Use Tab and Enter/Space
for controls and interaction buttons. Reduced motion preserves the reading flow.
Book toys appear on top of the cabinet for the current table book; books without
toy definitions show none. See [room behavior](docs/room-shelf.md).

## Create or revise a book

- [Creator guide](docs/creator-guide.md): files, practical edit/preview loop and
  commit checklist.
- [Agent authoring](docs/agent-authoring.md): scoped implementation and reporting.
- [Book contract](docs/book-contract.md): exact supported content vocabulary.
- [Audio and languages](docs/audio-language-authoring.md): measured narration,
  selective replacement, mix and review.
- [Book skill](../../.agents/skills/little-light-books/SKILL.md): reusable local
  agent workflow; [draft recovery](docs/draft-recovery.md) preserves old browser work.
- [Architecture](docs/architecture.md): catalog, runtime boundaries, legacy adapter
  and static packaging.
- [Future Feature work](docs/feature-roadmap.md): existing inventory,
  gaps and acceptance for the three showcase books; this is future work.

The shelf source is [`public/books/catalog.json`](public/books/catalog.json).
New books use `public/books/<id>.book.json`, assets under `public/assets/`, and
one catalog registration. Eden and Noah retain their localized manifests and
specialized paper rigs through a compatibility adapter. Do not rewrite them
merely to make their storage look like newer books.

Agents start with [AGENTS.md](AGENTS.md). The historical autonomous quality loop
is parked. Existing content and working translations are preserved during cleanup;
completing or polishing the showcase books requires a future feature assignment.

## Validate and package

```sh
npm run book:validate -- public/books/quiet-garden.book.json
npm run book:validate -- public/books/jonah-and-the-whale.book.json
npm run book:catalog
npm run verify
npm run test:room
npm run test:recovery
npm run test:failures
```

Read warnings as well as the exit status: Jonah's missing narration is a known
draft gap. Structural validation and measured duration checks cannot establish
story quality, pronunciation or listening approval.

`npm run verify:all` runs verification, the current room browser suite, draft recovery
and missing-resource/retry checks;
`test:browser` is an alias for that room suite. Older footer-targeting browser
and acceptance scripts are historical and are not the current recommended gates.

`npm run build` produces `dist/` with relative URLs. Test that production output
under a nested static URL, with generation services stopped, and inspect the
shelf-to-reading flow on desktop and phone. The [architecture guide](docs/architecture.md)
describes the static-hosting and publication checks. The main implementation
handoff, [authoring-handoff.md](docs/authoring-handoff.md), records checks actually
executed and remaining limitations; commands in this README are instructions,
not a claim that verification has passed.

Retain only the six curated screenshots and the small `review/latest/` evidence
bundle. After the verification owner has saved current results and finished with
the build, `npm run clean:generated` removes disposable captures, `.test-output/`,
`dist/` and `dist-static/`.
See [retention rules](docs/repository-cleanup.md). Historical reviews and ADRs
remain available through [the cycle index](review/README.md); old scores and
removed captures are not current evidence.
