# Eden and Noah art review

Review snapshot: 2026-09-24. This report covers the new Eden and Noah paper-theatre staging and its reader regressions. It is a visual/staging report; it does not attest to editorial, native-language, or human audio review.

## Staging changes

- **Eden (8 pages):** Pages 1–5 now use an opaque, continuous garden floor paired with the garden backcloth. Eve faces Adam on page 2. Page 4 adds a low fig-leaf screen that conceals the lower bodies while keeping both faces clear. Page 6 uses a natural rocky garden boundary with symbolic firelight and no divine figure. Pages 6–8 use a matching dry-earth floor; page 7 shows the working poses with separate field tools, and page 8 no longer stages Eden’s fruit tree in exile.
- **Noah (8 pages):** The book now has distinct worksite, storm-water, ark-interior, and shore floor prints paired with the appropriate backcloths. Boarding uses a correctly turned animal group; the storm page stages three independent animated wave layers around a gently floating ark. The ark-interior page has a built-in window onto receding water and a returning dove. The shore departure uses a sober family pose and animals at the boarding scale. The covenant pages share a shore backdrop with a painted rainbow; page 7 adds a separate altar prop.

## Verification

- Computer-use review covered all 16 Eden and Noah spreads at 1280×900 desktop and 390×844 phone sizes. The final Eden page-4 hiding screen and Noah page-6 animal staging passed. The Jonah page-1 visual regression and the Library Continue paused-position behavior also passed.
- `npm run verify` passed: lint, typecheck, book index/catalog checks, build, and 181 tests. The room suite passed 9/9 checks, failure recovery passed 5/5, and audio continuity passed with the authored loop source spanning three pages.
- SHA checks found the 325 existing locale, audio-manifest, and narration files unchanged. No story text, translations, or narration were edited. Jonah’s 117 missing-human-review warnings remain; no human editorial, native-language, or listening attestations were added.
- The six curated screenshots in [`docs/captures/`](../../docs/captures/) are historical and were not regenerated. Current visual evidence comes from the desktop-and-phone read-through above.
- `scripts/garden-floor-check.mjs` passed all four modes against the final static build: lazy loading, missing-ground inline Retry, header locking during a held request, page navigation, and reduced motion. This test required updating its stale shelf selectors and retry expectations to match the shared reader.
- The portal publication check passed against a temporary Git index containing the reviewed worktree snapshot; the real index was not staged. The Little Light Library list contains 344 explicit files and its static build contains 557 files with digest `25cd45f611913b5883ee2159f01773e086950d11b3bd6f048700c5b5b07521ff`. The manifest has 750 reviewed hashes overall, all current. This is publication preparation only; no release or deployment was performed.

Fresh room and failure artifacts were copied from `.test-output/room/` into `review/latest/room-results.json` and `review/latest/failure-results.json`; all nine room checks and all five failure checks report passing.
