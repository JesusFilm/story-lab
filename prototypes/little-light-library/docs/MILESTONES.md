# Little Light Library — execution state

## Current direction

This is a historical execution record. The quality-improvement effort remains parked after round 23; do not resume historical next-cycle instructions unless requested. Start with [AGENTS.md](../AGENTS.md), [the current creator guide](creator-guide.md), [architecture](architecture.md) and [future Feature work](feature-roadmap.md). The visual editor and its superseded direction/guides are archived in git history. Historical commands and measurements below describe their recorded revision, not the current recommended checks.

## Repository cleanup checkpoint

Raw iteration media and superseded output were deleted rather than archived. Six selected
screenshots and one [current verification bundle](../review/latest/) remain. The written
history and authoring direction are preserved; historical capture paths and commit IDs are
not recovery links after the squash. See [the cleanup record](repository-cleanup.md).

The cleaned prototype passed `npm run verify:scene`: all 56 tests, formatting/types,
content/audio/build validation, complete journeys, mobile/desktop layouts, recovery,
interaction, reduced motion and loading/cancellation checks. Exactly 315 audio files remain,
all referenced by the manifest. No renderer, story text or playback code changed.
Noah: shelf 3.426 s, 58.29 fps, p95 16.8 ms. Eden: shelf 3.555 s, 57.83 fps, p95 16.7 ms.
These use the same Chrome 153/M4 Pro mobile emulation described below. Narration timing and
listening were not reassessed. Publication checks and all four local-only publication tests pass.

## Parked quality checkpoint

Round 23 is retained: the serpent leans its head and neck toward Eve, and the dove beats its wings while its body and olive sprig stay fixed. Both respond to touch and keyboard activation with names localized in all nine languages. Candidate 01 was rejected because its dove gesture was too subtle on a phone; candidate 02 strengthens the wingbeat while preserving anatomy and frame clearance. The [independent review](quality-review-23.md) scores popup/acting 4.4→4.5 and tactile interaction 4.2→4.3. Room 4.1, book 4.4 and reading composition 4.3 are unchanged. Sound and perceived continuous-motion quality remain unassessed; reference parity is not established.

All 36 matched before/final states and four maximum-wing poses were independently reviewed. Final scene acceptance passes 56 tests, formatting/types, nine locales/315 audio cues, asset validation/build, complete journey, both performance profiles, recovery, human/creature touch and keyboard response, camera return, room/shelf interaction, loading and cancellation races. Creature checks cover eight normal/reduced/English/Japanese cases, fixed supports, folded rest and page/room cleanup. All 15 settled presentation captures were refreshed after both performance runs. [Final runtime evidence](../review/latest).

Chrome 153 on Apple M4 Pro/48 GiB, mobile emulation at 360×800, DPR 1, 4× CPU slowdown, 10/1 Mbps and 100 ms latency: Noah shelf 3.465 s, 58.24 fps, p95 16.7 ms; 2,149,929 shelf bytes, 10,759,682 total bytes and 27,467,832 heap bytes. Eden shelf 3.674 s, 57.63 fps, p95 16.8 ms; 2,150,072 shelf bytes, 8,328,272 total bytes and 34,135,258 heap bytes. [Eden measurement](../review/latest/garden-performance.json). These are emulation results, not physical-device measurements.

If quality iteration is explicitly resumed, the historical cycle starts with fresh live reading/figurine play, critique and reference review. The prior review noted that the dove remains small within its frame. That concern is deferred, not the next assignment. Round 12 remains the latest narration timing/continuity evidence (360 onsets, maximum 32.03 ms; 36 continuity cases, maximum 21.33 ms). This scene gate did not rerun those checks. Listening remains incomplete. No push or deployment.

Chosen path: prototypes/little-light-library. Stable prototype number5, loader option2.

## Contracts and ownership

- Root: contracts, application integration, playback/preferences, validation, commits.
- Content agent: public/content/\*.json and docs/editorial.md; two books × eight spreads × nine locales.
- Audio agent: scripts/audio\*, public/assets/audio, public/audio-manifest.json, docs/audio.md.
- Art/scene agent: src/scene.ts, public/assets/art and models, style guide, asset catalogue and scene evidence.

## Handoff template

Package / owner / inputs / owned files / deliverables / checks actually run / status / blockers / next executable action.

## Remaining acceptance work

When audio acceptance is in scope, the listening and narrator comparison procedure is in [audio.md](audio.md). All nine locales and 315 active audio cues are present; synthesis and waveform checks do not establish pronunciation quality.

## Historical increments

The entries below record checks and open issues at each earlier milestone; the current status above takes precedence.

## Increment 1 — application foundation

- Contracts, nine-locale startup chooser, settings, reader navigation and WebAudio scheduling implemented.
- Meaningful tests were run before clock/state/preferences implementation and failed on absent modules; after implementation all four tests pass.
- TypeScript passes. Patched toolchain audit reports zero vulnerabilities.
- Six audio locales currently generated; content/art production continues.
- Chromium integrated smoke currently times out before startup chooser; diagnostic underway. Do not count the visual/audio integrated gate as passed yet.

## Increment 2 — complete content and first integrated review

- Two eight-spread stories and all nine locales delivered; all 315 narration clips generated.
- Independent agent editorial review corrected 11 narration segments, 27 passage references and two Hindi UI phrases. Corrected recordings regenerated; static audio verification passes.
- First integrated reader rendered and narrated without browser errors. Visual review replaced an empty leaf/duplicated background with full-spread painting and separate transparent layers. Additional room and figurine refinement ongoing.
- Full static build, formatting, typecheck, unit and asset coverage gates passed before further refinements.
- Browser journey passed every spread and figurine at 360×800, 768×1024 and 1366×768; all nine locales and four rates were exercised. Subsequent rerun identified subpixel 44px target edge; minimum button size increased to46px. Full rerun pending.
- Failure review found a mobile error toast covering Play; moved notice above reader controls and added explicit Retry. Stable production rerun pending.
- Commit d3509c6: foundation; configured pre-commit hook ran publication checks plus types/tests successfully (four tests).
- Remaining: visual factual corrections (Noah family adults), final room quality, complete performance measurement, final failure checks, catalog/model evidence, measured browser highlights, final commits.

## Increment 3 — measured assembled behavior

- Commit 5858c31: complete story/localization/audio package; pre-commit publication check and four behavior tests ran successfully.
- Six tests now cover clock/state/preferences and actual WebAudio scheduling calls, including cancellation of late audio-unlock after stop.
- Nested static browser journey PASS: both books, all spreads and figurines at all three sizes; nine locales/four rates; persisted settings and muted clock.
- Low-end emulation PASS on Apple M4 Pro / 48 GiB / Chrome153.0.8010.48:360×800,DPR1,4×CPU,10/1Mbps,100ms latency. Shelf2.867s;60s reading59.44fps, p95 16.8ms;2.06MB transferred to shelf,8.18MB through run;JS heap10.57MB. Emulation, not physical-device proof.
- 360 page-start phrase highlight measurements (10×9×4) passed <200ms against decoded audio scheduling and separately measured onset padding. See timing-results.json. This does not establish pronunciation quality or acoustic output latency. Actual phrase-boundary continuity tests underway.
- Stable failure checks pass keyboard, mute, page image retry, audio retry, hidden tab resume, reduced motion and renderer startup recovery. Missing-cover recovery remains under repair.
- Narrator comparison and listening review remain unavailable: no audio perception route was exposed. Exact resume task is in audio.md. Do not claim pronunciation reviewed.

## Increment 4 — final asset and recovery review

- Commit6b4125a retains original ImageGen paintings/cutouts, exact prompts, the visual guide and a prepared Blender book with source/reference/render. The local gallery record has explicit reviewed model/prompt/reference hashes; no prototype tile was added.
- The final Noah illustrations correct child figures to adults and close the ark door during the flood; root reviewed the corrected eight-adult aftermath painting.
- Independent stable-build recovery suite now passes8/8. Phrase-2 continuity passed36/36 locale/rate cases after mute,volume,pause/resume;max scheduling error18.7ms. Final consolidated rerun underway.
- Prepared runtime geometry is648 triangles; six source meshes/72 pre-bevel triangles. Pixal3D was unavailable without an existing configured SSH host; authorized Blender fallback completed.
- Final room/reader includes localized painted covers, colored cutout figurines, bed/window/lamp,shelf props,3D page fold,adaptive quality and disposal of removed page/cover resources.

## Final automated acceptance — 19 September 2026

- `npm run verify:all` PASS: formatting, types, seven meaningful tests, schema/content/assets/WAV validation, static production build, full journey, recovery and timing.
- All 16 spreads and three figurines at 360×800, 768×1024, 1366×768; all 9 locales and 4 rates; 8/8 failure checks.
- 360 distributed page-start observations: maximum conservative scheduling plus measured recording-onset allowance 32.04ms. All 36 phrase-boundary cases pass, maximum 21.34ms; no measured paused drift.
- Final specified mobile emulation: shelf 2.926s, 60s reading 59.56fps, p95 16.8ms,2,063,615 bytes to shelf; see browser-results.json for exact host/settings/resource evidence.
- Portal local build and 358-file publication verification pass; new book asset appears only in the explicitly reviewed asset gallery. No prototype listing or deployment.
- Final settled captures and [handoff](HANDOFF.md) retained. Pre-commit publication/type/behavior hooks run on every local increment, including final integration.
- Remaining incomplete acceptance: comparative voice audition and listening review for pronunciation, names and pacing. No required locale, spread, art asset or recording is missing. Exact resume actions are in audio.md and HANDOFF.md; do not claim overall acceptance until listening completes.

Final capture review removed a duplicated decorative Noah overlay from the eight-survivor aftermath painting. Build/validation/unit tests and full nested browser journey/performance were rerun successfully after that render-only change; final performance figures above reflect the rerun. Audio/timing code remained unchanged.
