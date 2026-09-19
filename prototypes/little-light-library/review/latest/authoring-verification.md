# Book authoring foundation verification

Verified 20 September 2026 (Pacific/Auckland). This is the authoring milestone, not a
resumption of the parked visual-quality program. See [the durable handoff](../../docs/authoring-handoff.md).

## Automated evidence

[Browser results](authoring-results.json) record seven passing checks against a fresh
production build served under `/acceptance/little-light-library/`, Chrome 153 on macOS arm64.
There were no browser page errors.

- Both authored spreads rendered at 360×800, 768×1024 and 1366×768. Native interaction
  buttons met the 44-pixel target check and responded to pointer and keyboard activation.
- JSON edits changed actual stage x/elevation/rotation, ground position/size and gesture
  strength/timing. An edited 12° gesture measured 11.98° peak across 32 moving samples;
  first detected movement was at 0.224 s for a 0.2 s delay. This is frame sampling against
  decoded WebAudio time, not acoustic latency or a listening assessment.
- Text changes disabled mismatched narration. Invalid version, broken reference and missing
  asset imports left the valid preview intact. A post-validation texture-load failure
  restored the previous draft/state. Undo restored the prior authored definition.
- A 4,924,589-byte portable JSON export preserved every authored field except the intentional
  conversion of source paths to data URIs. All decoded embedded asset bytes exactly matched
  their source files. MIME normalization worked when files were served as octet-stream.
  A fresh context imported and played it with all `/assets/` requests blocked (zero attempted).
- Reduced motion held cards still; muted narration retained its advancing audio clock and
  phrase highlights. Keyboard interaction still worked.
- Both legacy books traversed all eight spreads, and Eden's first spread opened in each of
  the nine supported locales. Separate content/audio validation checked both books in every
  locale: 144 localized spreads, 288 phrase cues and 27 names (315 recordings).
- A **10-second performance smoke**, after loading at 360×800/DPR1 with 4× CPU slowdown,
  sampled 601 frames, approximately 60 fps and p95 16.8 ms. No network throttle was applied.
  This is a short emulated check, not the historical 60-second performance profile or a
  physical-device guarantee.

Formatting, TypeScript, the 69-test unit suite, original content/theatre/audio validation,
the new demo validator, and production build passed. Unit tests include closed-schema and
reference errors, exact narration staleness, actual selective PCM WAV replacement preserving
all other cues, undo, dynamic spread counts, visible-only opening motion, reduced motion,
separate cover loading, and decoded-duration motion offsets (avoiding cumulative rounding).
The build retains the established classic-loader and large-bundle warnings.

Commands used (run from the prototype directory):

```sh
npm run lint
npm run check:fast
npm run validate
npm run book:validate -- public/books/quiet-garden.book.json
npm run build
npm run test:authoring
```

The final browser run used a stable build. An intermediate responsive-preview timeout
occurred while build/test work overlapped; it did not recur on the stable build. The harness
now captures authoring report, notice and reader-state diagnostics if preview times out.
No runtime defect was established from that earlier timeout.

## Visual review and creator steering

The lead inspected all six settled demo captures (both spreads at each tested size) and
used the visible local reader. Text and controls were readable, distinct actors/props stood
on the separate horizontal ground, and the upright backdrop remained separate. The phone
header is compact and the title wraps; no extra aesthetic pass was performed.

The first usable preview was shown in the app. A manual-style textarea edit moved Adam's
x from −0.65 to −1.15. An agent-style structured edit to that same definition changed ground
opacity to 0.45, rock strength to 12° and duration to 2.2 s. Neither required renderer edits.
These were demonstration previews, not changes approved by a human. The shipped fixture
retains its original settings. Focused creator feedback about terms, control and preview
flow was invited; no creative approval is inferred from silence.

The six raw captures and temporary portable package were inspected then removed by the
project's normal generated-output cleanup. The existing six curated screenshots are retained.
This note and the JSON result are the durable authoring evidence.

## Review and remaining limits

Independent review found and led to fixes for ignored covers, invisible short opening
motions, mixed-language authored content, post-validation failure rollback, and transport
MIME handling. Targeted regression tests passed after those fixes.

No listening review, native-speaker review, theological approval, family testing, or
reference-quality parity is claimed. Narration is reused exact en-US draft text/audio;
only measured duration and playback behavior were verified. Full editor, arbitrary rigs,
scripts, accounts, collaboration, publishing, custom sound tracks and direct canvas
selection remain outside this milestone.

The implementation is saved in a local commit with normal hooks. Resolve it using
`git log --oneline --grep='book authoring' -5`; the exact reference is in the delivery response.
The normal publication hook initially rejected unlisted source changes. Explicit source
file reviews/hashes were added to the existing portal manifest; the published static-output
digest was deliberately not updated. Future publication remains separately gated.
Nothing was pushed, merged or deployed.
