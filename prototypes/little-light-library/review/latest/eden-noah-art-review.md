# Eden modesty and Noah rig review

Review snapshot: 2026-09-24. This revision adds story-matched Eden clothing and
concealment, and rigid character motion for Eden and Noah. It does not attest to
editorial, native-language, or human audio review.

## Current visual review

- All eight Eden pages were reviewed in Chrome at 1280×900 and 390×844. Pages
  1–3 show standing adults concealed behind tall shrubs, with their faces,
  shoulders, and arms visible. Pages 4–5 use leaf garments; pages 6–8 use
  animal-hide garments. The painted silhouettes use alpha-derived widths for a
  common 1.95-page-unit adult height; page 7 is 1.75 units for its crouched pose.
  Both actors remain individually selectable, including Eve's p2 interaction.
- Noah pages 3, 7, and 8 retain their intended actor scale on desktop and phone.
  The final p2 hammer was inspected at deterministic raised/strike frames of
  0, 0.86, and 1.15 seconds; the joint reads cleanly with no duplicate arm/tool
  or rotating cuff wedge.
- The six retained curated captures now include an updated Eden p2 desktop view
  with the tall-shrub treatment; the other five remain historical. The current
  capture is [Eden p2 at 1280×900](../../docs/captures/eden-1280.png).

## Mechanical verification

- `npm run verify` passed: lint, index freshness, typecheck, catalog validation,
  production build, and all 185 tests. This used local-server access for the
  narration test fixtures; the sandbox-only run had been blocked by `listen
  EPERM`.
- Focused Eden/Noah staging and index tests passed 13/13. `paper-actor.test.ts`
  passed 12/12 after the latest hammer-contour change. The Eden test measures
  source alpha bounds and constrains the painted actor height to catch oversized
  stage widths.
- The production room suite passed 9/9 and the failure-recovery suite passed
  5/5. Both reported zero page errors, failed responses, or unexpected requests.
  Fresh machine results are retained in [`room-results.json`](room-results.json)
  and [`failure-results.json`](failure-results.json).
- A before/after byte comparison found all nine locale JSON files, the shared
  audio manifest, and all 315 narration WAVs unchanged.

## Prior completion-run evidence

The earlier Jonah completion run reviewed its 13 pages, and earlier shared
reader checks covered Eden/Noah pages and the Japanese p6 text view. The generic
audio-continuity browser check passed with one loop source spanning three pages.
These results predate the current Eden wardrobe and Noah hammer refinements.

Regular book validation passes with warnings. Strict human-review validation
remains blocked by 117 `MISSING_REVIEW` records; no creator, native-language, or
listening attestations were added. The portal publication check passed against
an isolated temporary Git index, without staging the real index. The Little
Light entry now lists 387 reviewed source/runtime files; its 571-file static
build digest is `44c6e624845036fe42bf216fa67a873c31fd21758b16b38f4c4a7ca52874be71`.
No publication or deployment has been performed.
