# Walk/run pacing

- Status: done — implemented and verified; awaiting playtest
- Owner: Codex
- Last updated: 2026-09-08
- Objective: shorten uneventful traversal while retaining readable, single-tap decisions.
- Accepted by: Jaco, current task, 2026-09-08. Start/resume at a walk, then run; walk in anticipation of choices. Existing map and choice controls accepted for now.
- Scope: speed progression, anticipation, walk/run animation, pause/resume, verification and pacing notes. No maze or Blender asset changes.
- Dependencies: [automatic navigation](2026-09-08-assisted-navigation-proposal.md) and existing prototype/assets.

The initial tuning below is preserved as history. [Arrow-only decisions](2026-09-08-arrow-only-decisions.md) records the subsequent increase to 3.8 m/s walking and 8 m/s running.

## Implementation choices

Initial tuning: walk at 3.2 m/s; run at 6.4 m/s. Start/resume with a short walking
period and accelerate smoothly. Look ahead along the corridor graph so braking
can start before the edge containing a junction. Reach walking speed before the
existing two-second choice window; keep waiting when no choice is made. Restart
the walk-to-run progression after pause, U-turn resume or a stopped choice.
Keep progress through compulsory bends; running must not require another button.
Blend larger/faster limb motion, a subtle forward lean and stronger body bounce
with speed. Keep fading footprints visible for their complete 60-second lifetime
at the new maximum speed.

## Completion checks

- Walking after start/resume, running on clear stretches, walking at every choice warning.
- At least approximately two seconds from warning to junction arrival, including
  approaches entered at full speed and closely spaced choices.
- Original routes complete without geometry changes; pause/wait/turnaround remain safe.
- Distinct walk/run animation and responsive UI verified in the browser.
- Compare first-choice travel time against the previous constant-walk controller.

## Future map-generation checks (backlog, not implemented)

Jaco noted the long interval before the first choice. Keep this map for now. Future
generation should measure distance/time to first meaningful choice, longest and
typical distance/time between choices, choice frequency along successful routes,
forced-corridor lengths and warning clearance between adjacent choices. Evaluate
time using actual walking/running/turning rules rather than a single speed. Set
acceptable thresholds through playtesting rather than inventing accepted targets.

## Results

Implemented 3.2 m/s walking, 6.4 m/s running, 0.8 seconds of walking after resume,
smooth acceleration and graph look-ahead braking. Walking speed is restored before
the two-second choice window. Pause, U-turn resume and stopped choices restart the
walk-to-run progression. Animation blends stride, arm swing, bounce and lean.
The footprint buffer retains the full lifetime at running speed.

Controller checks pass all three source routes and all 139 directed junction
approaches, including full-speed approach safety. Browser checks pass running gait,
walking after pause, existing decision/difficulty flows, completion and emulated
touch controls. Footprint capacity and unchanged map geometry are verified.

Simulating the actual previous/current controllers at 10 ms steps, including turns,
the first choice remains 112 m away but takes **22.99 seconds instead of 38.60**:
15.61 seconds (40.4%) less. See [comparison](../../prototypes/shepherd-maze/checks/pacing-comparison.json)
and [verification](../../prototypes/shepherd-maze/README.md#verification-and-outcome).
This measures traversal time, not whether the maze is fun. Physical phone/TV testing
remains outstanding. The current model uses articulated object pivots rather than
production walk/run animation clips.

## Next actions

- Jaco: playtest running speed and transition feel.
- Unassigned: apply the generation-quality backlog when revisiting maze generation.
- Unassigned: physical-device and Forge integration testing.
