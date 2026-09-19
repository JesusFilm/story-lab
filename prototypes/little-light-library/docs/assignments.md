# Work packages and handoff record

Shared interface: [contracts.ts](../src/contracts.ts). Public data keys are locale/story/page/segment; a single production/validation pipeline serves both books. Root retained shared contracts, integration and commit ownership. Delegates edited separate files; reviews returned actionable findings.

| Package | Owned files | Result and evidence |
|---|---|---|
| Story/localization | public/content, editorial.md | Nine complete locale packs; 144 localized spreads; structural validation |
| Audio production | scripts/audio*, public/assets/audio, audio-manifest.json, audio.md | 315 measured phrase/name cues; reproducible hash cache; waveform checks; listening limit disclosed |
| Room/book/artwork | scene.ts, art/models, new library assets, style guide, visual.md | Original ImageGen art/cutouts; Blender model; desktop/mobile captures and revision record |
| Integration | contracts/state/preferences/playback/main, UI, core tests | Test-first behavior implementation, nested static build, browser journey and performance |
| Independent editorial review | editorial-review.md; narrowly assigned corrections | Eleven narration corrections, 27 references, two Hindi UI phrases; revised clips regenerated |
| Independent verification | failure/continuity scripts and review | Keyboard/recovery/mute/visibility/reduced-motion/renderer tests, actionable defect report |

Requested routing used Luna Max for bounded multilingual content, Sol Medium for audio/scene/verification, and Astra Medium for independent editorial judgment. Only exposed Codex agent profiles were used; Claude/Qwen routes were not available. Requested profiles are recorded here as routing intent, not independently metered provider costs. Usage/account details are kept outside the public repository. There was no paid-provider switch or purchase.

Handoff template: package · owner · inputs/shared interface · owned files · deliverables · checks actually run · status · blockers · exact next executable action. Current integrated status is maintained in [MILESTONES.md](MILESTONES.md).
