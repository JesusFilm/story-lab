# Little Light Library — agent entry point

The product is the room and reading experience. Create and revise books through
local files and agent-assisted tools, preview them in the reader, and include
reviewed content through git. The manual visual editor is retired. Do not add
another authoring UI, hidden editor route, dashboard, account system or publishing
service. Git history preserves the removed editor; do not retain a backup copy.
Parent repository instructions still apply.

## Start here

- Setup and current collection: [README.md](README.md).
- Content work: [creator guide](docs/creator-guide.md), [agent instructions](docs/agent-authoring.md),
  [book contract](docs/book-contract.md), the target book and its referenced assets.
- Reusable workflow: [local book skill](../../.agents/skills/little-light-books/SKILL.md).
- Old browser-only work: [read-only draft recovery](docs/draft-recovery.md).
- Runtime or catalog work: [architecture](docs/architecture.md),
  [architecture decisions](docs/authoring-decisions.md), [room behavior](docs/room-shelf.md).
- Narration and localization: [audio and languages](docs/audio-language-authoring.md).
  [Legacy audio production](docs/audio.md) specifically covers Eden/Noah's retained pack.
- New feature planning: [future showcase Feature work](docs/feature-roadmap.md).
- Verification evidence: [implementation handoff](docs/authoring-handoff.md) and
  [retained results](review/latest/). Check what was actually run against this revision.

Inspect the actual files and current git state. Read only historical material
needed for the requested change. Preserve unrelated and concurrent work.

## Content and architecture boundaries

`public/books/catalog.json` is the one explicit, ordered shelf registration.
All four committed entries belong on the shelf: `eden`, `noah`, `quiet-garden`,
`jonah-and-the-whale`. Browser drafts and saved shelf choices do not define the
public collection. Reader preferences may persist independently.

New books use the versioned JSON contract in `src/authored-book.ts`, the shared
validator in `src/book-validation.ts`, and `src/authored-stage.ts` through
`page.authored`. No new story-ID renderer branch is needed for supported content.
Preserve the legacy Eden/Noah adapter: it retains artwork-specific rigs, existing
localized manifests, measured narration and nine working locales without a risky
content rewrite. The exception is bounded to those existing books.

Keep stable book/spread/segment/element IDs. Distinguish source references,
authored retelling and invented staging. Do not label adaptation as Scripture.
Use the [visual guide](../../styles/little-light-library/README.md) and
[editorial record](docs/editorial.md) when relevant. New assets must remain local
to this prototype at runtime, with useful source files and attribution retained.

Generation is a local authoring step. Never put credentials, service endpoints,
machine paths, caches, provider job data or temporary renders into a book or the
hosted runtime. Check available tools before promising synthesis; do not assume
paid services are authorized. Regenerate only affected media. Leave old
`recordedText` intact after a text change until a matching recording exists.

Before retiring a browser draft's only export path, identify and preserve valuable
work that exists only there. Do not clear IndexedDB or site storage as cleanup.
Do not claim the repository contains every browser draft without evidence from
the relevant browser/origin. Recovery status belongs in the implementation handoff.

## Scope and verification

The editor-retirement task preserves content and reader behavior. It does not
complete Eden, Noah or Jonah as showcase books, generate translations, redesign
the room or restart subjective quality scoring. Quiet Garden remains a technical
demonstration. Future feature work is separately specified in the roadmap.

Run checks proportionate to the change. For runtime changes, cover all four
catalog entries, nested static paths, missing-resource failure/retry, desktop and
phone, keyboard/touch, mute/volume and reduced motion. Inspect the actual rendered
scene and repeated book transfers; passing assertions alone cannot establish
that books are level, visible or above the table. Check Library/Continue preserves
the paused position and toys stay attached to the current table book.

Report automated checks, visual inspection, audible playback and creator approval
separately. Never infer human editorial, theological, translation, pronunciation
or listening approval from tests or synthesis success. Review fingerprints are
change detection, not proof of a human review. Do not fabricate approval records.

Publication uses the portal's explicit reviewed-file list and output digest.
Do not publish the private checkout wholesale or bypass manifest checks. Follow
the current user's instructions about commits, push and deployment.

## Parked history and output retention

The autonomous quality-improvement effort is parked. Historical “next cycle”
instructions are records, not assignments. Use [the cycle index](review/README.md)
only for explicit historical questions; round 23 is the retained endpoint.
[HANDOFF.md](docs/HANDOFF.md), [MILESTONES.md](docs/MILESTONES.md) and old ADRs
describe earlier work and may name removed UI. They do not override this direction.

Keep only six selected screenshots and the compact `review/latest/` verification
bundle. Raw captures, recordings and superseded results are disposable. After
verification results are retained, the verification owner runs
`npm run clean:generated`. Do not remove another active agent's build/captures.
See [the cleanup record](docs/repository-cleanup.md). Do not recreate deleted
historical media, archive discarded output or resume the scoring program.
