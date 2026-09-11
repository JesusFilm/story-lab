# Automatic walking, memory and requested help

- Status: done — accepted implementation completed; awaiting playtest
- Owner: Codex (implementation); Forge integration owner unassigned
- Last updated: 2026-09-08
- Objective: keep route finding challenging while making the prototype usable with discrete remote-control inputs.
- Scope: controller, junction warnings, U-turns, footprints, local map help, final route assistance and completion metadata.
- Related: [concept](concept.md), [first experiment](2026-09-08-blender-maze-prototype.md), [prototype](../../prototypes/shepherd-maze/README.md).
- Source: Jaco's feedback in the current Codex task, 8 September 2026. Assistant-authored summary, not a transcript; accepted decisions are attributed separately below.

## Accepted decisions — Jaco, 2026-09-08

Jaco approved the recommended control/turnaround/completion policies and replaced
the map-unlock ambiguity with difficulty settings:

| Difficulty | Map from start | Route |
|---|---|---|
| Easy | Full map with player | Visible from start |
| Medium | Full map with player | Reveal only after an explicit escape-hatch warning and confirmation |
| Maximum | Circular local map with player; rest concealed | Same warned/confirmed escape hatch |

Maps remain available for the run. Maximum's map stays local even after route
guidance is enabled; the full route is drawn in the world and recommended choices
are marked, while the map still clips to its radius. Difficulty is selected before
starting and changing it starts a fresh run, preventing mid-run reclassification.
Default selection is Medium (implementation choice, not a new accepted requirement).

Controls: arrows plus OK/Select (Enter/Space on keyboard); automatic walking and
compulsory bends, stop at every multi-path junction if no choice is queued, ↓ turns
180° and waits, ↑ resumes, dead ends wait. OK opens the pause/help menu. Existing
map/route keyboard shortcuts must respect difficulty and confirmation. The front-on
preview remains; active play uses the trailing camera for consistent relative turns.

Keep already-earned discoveries and the common ending. Record difficulty and
assistance use. Easy is guided by design; Medium/Maximum become guided on confirmed
reveal. Warn that route assistance may exclude challenge completion events, but do
not fabricate implemented achievements, scenes or scores. Store challenge-eligibility
metadata for later integration; no earned event is revoked.

The earlier proposed unlock thresholds and timed map options below are superseded
by this difficulty matrix. The remaining control/footprint recommendations are accepted.
Prior prototype source is preserved in `checks/baselines/manual-controller-v1.zip`.

## Requested direction

Jaco requested automatic movement and discrete choices instead of holding arrows
to steer. A junction should provide roughly two seconds of warning; if the player
does not choose, the character should stop. Help should be requested in response to
difficulty rather than routinely exposing the full maze and solution. Map help
should show a small circular neighbourhood around the player. Footprints should
fade gradually but remain visible when returning after about 20 seconds. Route
guidance is a final "I want to finish" option. Assistance might affect achievements,
completion events, scenes or score; the exact policy remains open.

These directions can be implemented together. Automatic corridor traversal need
not choose the route. The current continuous controller and always-available full
map would be replaced, while the existing Blender assets and maze remain usable.

## Evidence and tensions

- The current controller requires held input and rotates freely. The map already
  provides a graph suitable for automatic corridor following and decision points.
- The source graph has 45 degree-three nodes, one degree-four node, 210 degree-two
  nodes and 33 degree-one nodes (including the start; the end is handled separately).
  Not every graph node is a decision: ordinary bends with only one onward path can
  be followed automatically. Crossroads also need a straight-ahead choice.
- There are 15 adjacent pairs of decision junctions, eight metres apart. At the
  current 4.8 m/s, travel between them takes only 1.67 seconds. A two-second warning
  therefore needs slower approaches, not an impossible fixed-distance promise.
- A two-second approach warning is compatible with waiting indefinitely on arrival.
  It need not be a deadline that forfeits a choice or causes a penalty.
- "Initially you only get the map" could mean map available at game start or the
  first assistance tier. The surrounding request suggests the latter, but needs an answer.
- Treating help as a timed collectible differs from unlocking a persistent tool.
  Duration and availability affect both difficulty and completion classification.
- Turning back is compatible with automatic walking, but needs an explicit
  stop/turn/resume rule and a way to request help using the same limited buttons.
- Front-facing gameplay reverses apparent screen-left/right relative to the
  character. Recommend a trailing camera for decisions, retaining the front-on
  character preview before play. Camera should settle after a U-turn before
  presenting a new direction choice.
- Current full-maze overview, minimap, saved solution line, compass and distance
  indicator all convey different levels of help. The new assistance policy must
  cover every player-facing entry to map/route information, including shortcuts.
  Recommend retaining the destination name/marker but removing the numerical
  bearing/distance aid in normal play; that recommendation is not yet approved.

## Original proposed behaviour (historical; difficulty policy above takes precedence)

1. Follow corridor centres automatically. Round compulsory bends smoothly. At a
   junction with multiple onward paths, show only the available relative choices:
   left, straight and/or right. Exclude the incoming path from onward options.
2. Announce the next decision approximately two seconds before arrival. Slow enough
   after closely spaced decisions to preserve the warning. Queue a valid tap for
   that approach; let a subsequent valid tap revise it until the junction is reached.
   Without a selection, stop and keep accepting a choice without a timeout penalty.
3. Use a unique decision instance for each approach, including revisits. Repeated
   keydown events and stale remote commands must not trigger a later decision.
   Do not queue arbitrary turns far ahead of a decision. Reject unavailable exits
   with readable feedback. The prototype can implement local discrete commands;
   real phone/TV transport remains separate integration work.
4. With arrows plus OK: ↑ starts/resumes or selects straight; ←/→ select available
   exits; ↓ stops and smoothly turns 180° in place; ↑ then resumes along the return
   path. Stop at dead ends and prompt for a return. OK opens a pause/help menu that
   can itself be operated with arrows and OK. With four arrows only, ↓ instead
   opens that menu and Turn around becomes a menu action.
5. Mid-corridor reversal preserves the exact position on the current edge, cancels
   any queued junction choice, and returns toward the previous node without
   teleporting. Pause/blur clears held input. Menu and stopped states must not
   silently resume movement.
6. Lay alternating footprints according to actual distance walked. Initial tuning:
   roughly 0.6 m spacing, linear opacity fade over 60 seconds of active gameplay.
   At 20 seconds they remain about two-thirds opaque. Pausing freezes their age;
   standing at a decision during active play does not. Bound the stored/rendered
   trail by lifetime. Reset clears it. This is a tunable prototype choice.
7. First help tier: on request, show a circular local map, initially about 12 m
   radius, with player heading and locally clipped recent footprints. It reveals
   nearby corridor geometry only; no full-map view, persistent explored-area reveal,
   distant destination or hidden route leaks. The radius and fade need playtesting.
8. Offer help gently after repeated loops/dead ends, without activating it. Prefer
   allowing the player to request help whenever needed instead of forcing them to
   satisfy a hidden frustration threshold. Exact trigger tuning can follow trials.
9. Final help tier: show a route from the player's actual position to the goal,
   including mid-edge starts and return paths. Recompute after deviations; the
   current fixed example route A is insufficient. Highlight the recommended choice
   at decisions while retaining the same tap/wait controls. The user's request is
   route guidance, not an explicitly authorized automatic finish/teleport.
10. Record actual map use and route use for the run. Offering help does not count.
    Closing assistance does not erase its usage. Prefer unassisted / map-assisted /
    guided completion categories, retaining discoveries already earned and the
    common ending. Full achievement content, scores and alternative scenes do not
    exist yet and should not be invented as approved requirements.

## Questions sent to Jaco

1. Available buttons: arrows plus OK/Select, or four arrows only?
2. No choice: stop at every multi-path junction, or continue straight when possible?
3. U-turn: turn and wait for resume, turn and immediately return, or automatic return at dead ends?
4. Map availability: requested anytime with contextual offers, locked until struggle, or visible from the start?
5. Map duration: rest of run after first request, 30 seconds per request, or a single 30-second use?
6. Assistance result: separate completion categories, score reduction, or exclusive unassisted bonus achievements/scenes?

Jaco accepted the recommended controls and completion policy on 2026-09-08. Map
availability/duration were replaced by the accepted difficulty matrix above. Radius
and visual timing remain tunable implementation defaults.

## Implementation sequence and completion checks

Implemented as one coordinated iteration, verified in this order:

1. Graph-based movement, turns, warnings and waiting. Test T-junctions, side branches,
   the crossroad, ordinary bends, dead ends and closely spaced decisions. No input
   should lead into an unchosen branch; late choices must still work while stopped.
2. U-turns and pause/help navigation using only the agreed buttons. Test mid-edge
   reversal, repeated inputs, revisits, focus loss, cancellation and camera orientation.
3. Distance-based footprints and fading. Verify visible traces after 20 seconds,
   expiration after the chosen lifetime, and correct pause/restart behaviour.
4. Assistance states and circular map. Verify the full map/solution cannot be
   reached through old buttons/shortcuts and all trails are clipped to the local view.
5. Guidance from arbitrary valid positions, route deviation, completion classification
   and preservation of discoveries. Retest canonical geometry and all source routes.
6. Desktop and emulated limited-input checks, frame-time sample and visual review.
   Physical phone/TV behaviour remains unverified until tested on those devices.

Dependencies: existing canonical map and Blender GLBs; accepted decisions above. No asset rebuild or maze redesign appears necessary. Forge integration,
physical remote transport and authored reward scenes are outside this local iteration.

## Verified implementation result — 2026-09-08

- `controller.mjs` now follows graph edges automatically at 3.2 m/s, with smooth
  in-place turns, a two-second warning, choice queue, indefinite junction wait,
  explicit U-turn/resume and per-approach decision IDs. Reducing walk speed ensures
  adjacent decision junctions receive sufficient warning without changing the maze.
- Footprints use distance-based placement, individual fading opacity and a bounded
  instanced render buffer. Local maps clip their trail to the same reveal circle.
- `session.mjs` defines the three difficulties, confirmation state and completion
  metadata. The revised interface is operated with arrows/OK or discrete touch taps.
- Full-world overview and free front-view gameplay controls were removed. The
  initial front-on preview remains. Old M cannot reveal more map information.
- Guidance follows shortest paths from the actual current node/edge position,
  recalculates after movement/deviation and marks the suggested junction command.
- All 168 loaded wall bounds match the map. 23,976 clearance samples cover all 296
  edges; the controller completes all three source routes at their original lengths.
- All 139 directed junction approaches warn, wait and accept discrete choices.
  U-turn, stale-command, footprint expiry and 592 arbitrary-position guidance checks pass.
- Browser checks pass for all difficulty policies, route warning/cancel/confirm,
  keyboard/OK and emulated touch, waiting/resume, pause/blur, local-map clipping,
  completion and reset. Short desktop frame spacing was about 16.7 ms median.

See the [README and verification records](../../prototypes/shepherd-maze/README.md#verification-and-outcome).
Current captures use `renders/v2-*.png`; original renders and the v1 source archive
are retained. No Blender assets or canonical map were changed in this iteration.

## Next actions and limitations

- Jaco: playtest the difficulty balance, map radius, warning timing and U-turn feel.
- Unassigned: Forge integration and physical phone/TV remote transport/testing.
- Unassigned: define real achievement events, collectibles, scoring and bonus scenes.
  This prototype records assistance/eligibility but does not implement that content.
- Corner turns happen at node centres, and attached staff/limbs can intersect walls.
  Session progress is in-memory only; reload/new run resets it. Performance evidence
  is a short headless desktop sample, not a physical-device certification.
