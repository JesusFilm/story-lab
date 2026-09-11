# Arrow-only decisions and faster traversal

- Status: done — implemented and verified; awaiting playtest
- Owner: Codex
- Last updated: 2026-09-08
- Objective: present contextual arrow buttons, queue early turns and make traversal faster.
- Accepted by: Jaco, current task, 2026-09-08: remove junction explanation UI, offer arrows only when choosing, automatically execute early choices, show a down arrow at dead ends, increase walk/run speeds.
- Scope: local prototype controls, presentation, pacing, regression checks and documentation.
- Dependencies: [walk/run pacing](2026-09-08-walk-run-pacing.md), canonical graph and existing Blender exports.

## Implementation choices

Walking increases from 3.2 to 3.8 m/s; running from 6.4 to 8 m/s. The character still walks for the two-second approach window. Early selections turn at the node using the automatic corner rotation, with no extra input or decision wait. Gold marks a queued arrow; green marks route guidance. Text descriptions remain available to screen readers.

Dead ends show only down; after turning around, up resumes, preserving the accepted turn-and-wait behavior. Touch players use contextual arrows and the existing Pause & help menu to turn around elsewhere. The permanently visible touch direction pad is replaced by these contextual controls.

The map, assistance rules, Blender assets and animation pivots stay as established. This work does not change the future map-generation quality backlog or Forge integration direction.

## Completion checks and results

- Passed all 139 directed junction approaches at normal and full incoming speed: approximately two seconds at walking speed, no-input waiting and every available early selection automatically departing without entering the waiting state.
- All three saved routes complete (832/1040/960 m). All 296 corridor edges and 168 loaded Blender wall bounds remain valid against the canonical map.
- Headless Chrome verifies arrow-only prompts, hidden controls during traversal/menu, queued-arrow highlighting, actual early keyboard input, late choices, and existing assistance/difficulty flows with no browser errors.
- Emulated touch verifies contextual junction taps, the single down arrow at a dead end, the following up arrow, and access to turnaround through Pause & help. Desktop and 390 × 844 mobile captures are retained in the prototype.
- First-choice arrival at 112 m takes 19.59 simulated seconds, down from the prior 22.99; walking is 3.8 m/s and running is 8 m/s. Footprint capacity scales to 816 instances and passes the full-speed lifetime check.

Records and reproduction commands: [prototype README](../../prototypes/shepherd-maze/README.md), [controller checks](../../prototypes/shepherd-maze/checks/controller-verification.json), [browser checks](../../prototypes/shepherd-maze/checks/browser-verification.json), [pacing measurement](../../prototypes/shepherd-maze/checks/arrow-pacing-comparison.json). Previous source is preserved in `checks/baselines/walk-run-v3.zip` within the prototype.

## Next actions and limits

- Jaco: playtest the new arrow presentation and speed tuning.
- Unassigned: physical phone/TV controls and Forge integration. Emulated touch does not verify real devices or remote transport.
- Unassigned: apply the existing quality backlog when revisiting map generation.

The existing articulated Blender prototype animation and camera limits remain; production animation clips and reward content are outside this change.
