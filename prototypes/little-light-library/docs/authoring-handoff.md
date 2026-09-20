# Editor retirement and committed-book handoff

The visual editor is retired. This document supersedes its historical delivery notes.
The active product is the room and reader; local agents author committed files.
The autonomous quality-scoring program remains parked.

## Current implementation

- `public/books/catalog.json` is the explicit ordered shelf. Every visitor gets
  Eden, Noah, Quiet Garden and the existing Jonah draft without browser setup.
- Generic books use the existing v1 JSON contract, shared validation, paper stage,
  measured narration, soundtrack mixer, translation resolution and toys.
- Eden/Noah retain their localized manifests and bespoke rigs through an explicit
  compatibility entry. This preserves working content; it is not a new-book path.
- Author UI, forms, inspectors, previews, browser book/room storage management,
  generation controls/credentials, the local-development synthesis proxy and
  exclusive code/styles/tests are removed. Git history is their archive.
- Reader preferences still persist. Old author IndexedDB is never deleted,
  overwritten or consulted by the reader. See [draft recovery](draft-recovery.md)
  for a standalone read-only export, including soft-deleted entries and media.
- Local commands create a scaffold, validate, register, replace a measured cue
  and selectively narrate with the existing local Kokoro Voice Lab. No provider,
  account, editor application or publishing service was added.

Existing story JSON, localized text, artwork, recordings and translations were
preserved byte-for-byte. Only the catalog changed under `public/`. Jonah remains
three spreads without narration. Quiet Garden remains a two-spread technical
demonstration, not one of the proposed showcase books.

## Start and author

From `prototypes/little-light-library/`:

```sh
npm ci
npm run dev
npm run book:catalog
npm run verify
npm run test:room
npm run test:recovery
npm run test:failures
```

Use the URL Vite prints; it may choose another port if the default is occupied.
The static tests build on `npm run build` and start isolated servers beneath a
nested URL. They do not use Vite's development server or a generation proxy.

Follow [creator guide](creator-guide.md) for create/revise/register examples,
[book contract](book-contract.md) for data, [audio and languages](audio-language-authoring.md)
for selective generation and mix/timing, and the project-local
[Little Light books skill](../../../.agents/skills/little-light-books/SKILL.md).
The skill was written using the installed skill-creator guidance and validated
with its bundled validator.

`npm run book:validate -- FILE --strict` is the completeness gate for an individual
finished book. Ordinary validation keeps missing narration visible as warnings so
existing unfinished content remains previewable. A passing command never certifies
human editorial, translation, pronunciation or listening approval.

## Architecture and future Feature work

[Architecture](architecture.md) explains catalog loading, runtime/content/tool
boundaries, asset ownership, contract behavior and the legacy exception.
[Feature roadmap](feature-roadmap.md) is the future-agent handoff for Adam/Eve,
Noah and Jonah. It identifies existing content, missing media, genuine blockers,
optional capabilities, milestones and creator decisions.

No showcase text, artwork, narration, translations or new reader interactions
were produced in this cleanup. Future polish and any larger rig migration require
their own feature work. No push, merge or deployment is part of this delivery.

## Verification and limitations

The current evidence is [retirement results](../review/latest/retirement-results.md)
and [room results](../review/latest/room-results.json). These replace editor-era
verification as the current workflow reference. Historical quality and performance
results remain historical, not new acceptance evidence.

The browser suite uses isolated storage and committed production content, injects
disposable 30-book/soundtrack/translation fixtures where needed, and verifies that
stale browser author data is preserved but does not change the public catalog.
Synthetic recovery checks do not prove absence of drafts on every real browser.

No Little Light author database was found in the accessible Chrome origin-directory
inventory and no current Little Light browser tab was open before this task.
Other browsers/profiles/devices were not inspected; the recovery guide preserves a
path for them. No browser site data was cleared.

Two existing US English phrases (Eden opening 7.88 s; Noah opening 6.69 s) completed
playback through macOS `afplay` with exit status 0. The sandbox initially prevented
audio output; the approved host playback succeeded. This is output-path evidence,
not an assertion that the agent heard or approved their pronunciation, meaning,
tone or mix. Browser playback and measured timing are checked separately.

The local Kokoro service returned no usable status/voice response during this
session. Selective synthesis, cancellation and resumption pass controlled HTTP/
PCM fixtures, but live model synthesis was not performed or verified.

Known retained limits: bespoke legacy rigs, fixed generic backdrop geometry,
whole-card presets/static atlas cells, source-language toy labels, full-book
generic audio decoding, and data-based review fingerprints that do not certify
unchanged bytes at an asset path. The Vite classic-loader notices and large-bundle
warning remain; their runtime files must still load in static verification.

## Publication and generated files

The portal's reviewed source list removes retired modules and adds the catalog
parser. The complete generated static artifact is reviewed and fingerprinted;
normal publication checks remain enabled. The local portal build is verification,
not deployment. No generation endpoints, credentials or machine paths belong in it.

After reviewing disposable screenshots and preserving the small current evidence
bundle, run `npm run clean:generated`. This removes raw output, `dist/`,
`dist-static/` and `.test-output/`, retaining dependencies, content and the six
previously selected screenshots. Those old selected screenshots are not new
visual acceptance evidence.

## Local commits

Implementation: `77cada0` (`refactor: retire Little Light editor for committed books`).
Final evidence: `docs: record Little Light retirement verification and handoff`.
The retirement results record hook verification. Locate both local commits with:

```sh
git log --oneline --grep='Little Light' -5
```

The editor can be inspected in the parent of the retirement implementation commit
with `git show <commit>^:prototypes/little-light-library/src/authoring.ts`.
Do not restore its code into the runtime as a recovery mechanism.
