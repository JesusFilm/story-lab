# Route rehearsal — initial implementation

13 September 2026. Implemented on `codex/shepherd-story-rebuild`; initial scaffold accepted for checkpoint. The user authorized committing and pushing the feature branch; no merge or deployment is authorized. See the [order](../../docs/story-rebuild/ORDER.md).

## Review entry

Run `python3 serve.py --port 8766` from the prototype, then open http://127.0.0.1:8766/rehearsal.html. Walk all ten points with **Move to next point**. Review tools provide full incoming-leg replay, staged jumps, restart, capture, reduced motion and observed frame timing.

[Scene briefs and release plan](../../docs/story-rebuild/README.md) · [Implemented route map](../../map/rehearsal-map.svg) · [Original drawing](../../docs/story-rebuild/reference-route.png)

The rehearsal uses the actual shepherd, walking animation, follow camera and village. Existing structure centres are preserved; the five visited houses now face their knocking stops. The lamp and gate have temporary state transitions; conversations, tracks, gate gestures, House 9 reveal, companions and final scene performance remain pending. New routes are smoothed around existing geometry, with nature dressing kept clear of the walking corridor. The original experience retains its existing route entry.

## Verification

- Completed a normal desktop walkthrough from entry through all ten stops, capturing each arrival. See [capture manifest](captures.json) and `01-arrival.png` through `10-arrival.png` in this folder.
- State tests cover every next/jump/replay/reset, duplicate advancement, pause, terminal state and reconstruction of lamp/gate outcomes.
- All 31 feature centres match the canonical settlement within 0.001. The five visited house rotations deliberately change to face their stops; current bounds and rotations match the regenerated rehearsal map. Sampled paths clear model footprints and wall lines; the open animal gate is checked using its component meshes, preserving the real doorway. See [geometry and state results](geometry-and-state.json).
- Landscape and portrait camera samples report no hidden-player frames. These geometric checks do not judge comfort, UI overlap or scene performance. See [camera samples](camera-samples.json).
- Existing settlement-stall, journey and presentation checks pass.
- Browser review at 390 × 844 confirmed visible character above the controls, reduced-motion selection, replay, pause/resume and a staged jump to House 9. This is browser viewport emulation, not a physical-device test.
- [Desktop frame sample](desktop-frame-sample.json): one House 5 approach replay, median 16.7 ms and p95 18.2 ms, with one 482.8 ms interval whose cause has not been traced. It is not a performance certification or a comparison against the original game.

The production publication manifest has not been refreshed. Portal release validation belongs to the final release milestone. The deployment job now has a main-branch guard, including manual workflow runs.

## Your first walkthrough

Walk the complete route once at normal speed. Focus on how much village you see and whether the winding search feels natural. Then replay 03→04, 04→05 and 06→07→08 to inspect turns and passing scenery. Report a point number and whether its approach feels rushed, empty, confusing or poorly framed. Exact doorway staging and authored shots will be developed with each scene.

Approve or revise the route and basic pacing before choosing the first detailed scene. Implementation checks do not count as your creative acceptance.

[Door orientation correction and five new arrival captures](door-facing/README.md). The original ten captures predate this correction.
