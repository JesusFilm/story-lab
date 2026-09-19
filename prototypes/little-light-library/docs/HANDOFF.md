# Little Light Library — local review handoff

**Quality rework is parked by the user after round 23.** Start with [AGENTS.md](../AGENTS.md) for the phase summary and task-specific context. The [first authoring foundation](authoring-handoff.md) is now implemented; use that handoff for current work, not automatic continuation of polish. The acceptance table below records the original functional delivery and is historical. Current visual evidence and retain/revert decisions live in the [quality log](../review/README.md). The renderer, staging, camera, paper actors and soundscape have since been substantially revised. Do not infer current performance or reference parity from the original table. Current machine-readable integration results supersede its metrics after each run.

Both complete books are implemented: Adam and Eve and the Fall and Noah's Ark and the Flood, each with eight original illustrated spreads, all nine requested locales, 315 static narration/name recordings, a dimensional bedroom and book, shelf figurines, phrase highlighting and persistent preferences. No push, merge, deployment or prototype portal listing was performed. Listening acceptance remains incomplete.

From `prototypes/little-light-library`, run `npm ci && npm run dev`, then open `http://127.0.0.1:8771/`. Run `npm run verify:all` for the repeatable automated gate. See the [architecture](adr/001-static-architecture.md), [publication boundary](adr/002-local-review-scope.md), [milestones](MILESTONES.md), [research](research.md), [editorial review](editorial-review.md), [audio](audio.md) and [visual provenance](visual.md).

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

See the [creature acting decision](adr/017-paper-creatures.md) and final candidate.

## Historical initial acceptance evidence

| Area                  | Evidence and outcome                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build and behavior    | Formatting, TypeScript, seven behavior tests, JSON Schema and asset checks, all 315 WAV cues, and relative-URL production build pass.                                                                                                                                                                                                                                                                                                         |
| Complete journey      | Both books/all 16 spreads and three figurines exercised at 360×800, 768×1024 and 1366×768. All nine locales and four rates exercised. [Browser results](browser-results.json).                                                                                                                                                                                                                                                                |
| Settings and recovery | Eight independent checks pass: keyboard/globe, mute, missing audio, missing page image, missing cover, actual hidden tab, reduced motion/44px controls, unavailable WebGL. [Failure results](failure-results.json).                                                                                                                                                                                                                           |
| Timing                | 360 distributed page-start onsets across nine locales and four rates, plus 36 second-phrase continuity cases after mute/volume/pause/resume. [Page-start results](timing-results.json), [continuity results](continuity-results.json). Worst conservative page-start error 32.04ms; phrase-boundary error 21.34ms, with zero paused drift. These measure waveform onset and browser scheduling/display, not acoustic output or pronunciation. |
| Performance           | Chrome 153.0.8010.48 on Apple M4 Pro, 48 GiB; 360×800, DPR1, 4× CPU, 10 Mbps down/1 Mbps up/100 ms latency. Cold shelf 2.926 s; 60-second reading 59.56 fps, p95 16.8 ms. Shelf transfer 2,063,615 bytes; measured journey 7,993,496 bytes; JS heap 10,374,241 bytes. Emulation, not physical-device proof.                                                                                                                                   |
| Runtime independence  | Nested `/review/little-light-library/` static server; copied art, model, narration and all three loader options. No live Kokoro/Python/credential dependency.                                                                                                                                                                                                                                                                                 |
| Editorial and art     | Independent agent review corrected narration, passage references and Hindi UI. Original paintings reviewed for serious peril, enormous ark and eight adult survivors; retained prompts/source artwork. This is not human/native-language approval.                                                                                                                                                                                            |
| Asset workflow        | Pixal3D lacked a configured connection; authorized Blender fallback produced editable source, reference, runtime model and review. Six meshes, 648 exported triangles. Explicit local gallery hashes and portal local build/verification pass.                                                                                                                                                                                                |

## Incomplete gate and exact resume action

**Comparative narrator audition and listening review remain incomplete.** The execution tools generated and measured audio but exposed no usable audio perception route. No locale or required recording is missing; waveform and text checks cannot establish pronunciation, pacing or voice suitability.

With listening capability available, compare short samples from at least two installed same-language voices per locale; check both stories' opening, middle and closing phrases and all three figurine names. Record actual findings in `audio.md`, correct text or voice IDs where warranted, run `scripts/audio_produce.py` using the existing Kokoro lab environment, and rerun `npm run verify:all`. Do not mark full acceptance complete before this review. It does not require recruiting external reviewers or family testing.

## Local commits and captures

- `d3509c6`: tested playback foundation and explicit local-only publication scope.
- `5858c31`: both reviewed stories in nine locales with generated narration.
- `6b4125a`: original illustrations, style guide and reviewed Blender book.
- Final integration commit: room/reader, recovery, measured acceptance evidence and this handoff (resolve with `git log -1`). Pre-commit publication and fast behavior checks run normally.

Representative settled views: [bedroom](captures/room-1366.png), [Eden](captures/eden-1366.png), [flood](captures/flood-1366.png), [aftermath](captures/aftermath-1366.png), [phone](captures/eden-360.png), [tablet](captures/flood-768.png), figurine interaction. `node scripts/captures.mjs` refreshes these against the local preview; `scripts/art-review.mjs` refreshes both complete illustration contact sheets. These are agent-reviewed captures, not substitutes for physical-device or listening tests.

Final visual correction: the aftermath spread suppresses a decorative Noah overlay because its painting already contains all eight survivors. After the complete automated acceptance run, the build/validation/unit and full browser journey/performance checks were rerun for this render-only correction; audio and timing implementation were unchanged.
