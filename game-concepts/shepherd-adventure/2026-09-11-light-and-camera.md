# Light for those behind us

- Status: gameplay and generated well/gate integration implemented and programmatically verified; visual playtest pending
- Owner: Codex (gameplay); separate asset task for well and gate
- Last updated: 2026-09-11
- Objective: preserve the accepted following camera, eliminate obstacle jitter/blind views, teach inspection through a memorable discovery, and add a short light-preparation loop.
- Authorization: Jaco’s detailed 11 September playtest feedback. Camera direction accepted; obstacle behavior and hidden inspection requirement rejected.
- Scope: existing journey prototype only. Three nearby preparation stops, lantern equipment icon and illumination, occasional running/look clips, rear gate opens a way for following shepherds. No resource arithmetic or life penalties.
- Dependencies: existing model clips and village; well/gate ImageGen→Tripo task. Models remain candidates until reviewed.
- Decisions: prefer stable camera choices plus temporary fading of obstructing foliage over repeated orbit searches. Gate uses a timber bar, avoiding a speculative key requirement. Lantern assembly is creative adaptation, not a historical claim.
- Completion checks: full keyboard playthrough; investigate hints and first reward; no completion softlocks; running and pause; repeated stationary-camera and all-route checks; tree/structure obstruction handling; asset provenance and final local play link.
- Next actions: Jaco reviews the complete candidate. Both generated models are now integrated; the earlier gameplay playthrough and new model/hinge/path checks are recorded separately.

## Frozen review criteria

1. Camera keeps its accepted turning behavior but settles at stops; includes tree/prop obstructions and avoids opaque close-up interiors.
2. First meaningful interaction is impossible to mistake for navigation; contextual ↑ action appears beside route choices and success teaches its purpose.
3. Only specific discoveries reveal routes. Light preparation requires revisiting useful places; no timer or arithmetic. Missing materials always explain the next action.
4. Lantern acquired/equipped is visible in UI; no floating orb. Darkness before acquisition still permits reaching the first lamps.
5. Quiet visual/audio reward and brief running/inspection clips preserve the mood. Audio remains opt-in.
6. Well/gate references and models retain library provenance, no invented approvals, no unnecessary credits.

## Verification

Normal keyboard play visited all 14 areas and completed at 312 m with eight investigations.
The state suite passes 11 checks across 113 reachable states. Camera checks cover
54,696 walking/running frames and 112 stationary cases; stationary cameras converge
without continuing movement. Tree fading is included as a deliberate visibility
compromise. See the [review](../../prototypes/shepherd-adventure/review/2026-09-11-light-and-camera/README.md) for evidence and limits.

## Generated well and gate integration

Jaco explicitly requested replacement of the two placeholders after generation completed. The [integration record](../../prototypes/shepherd-adventure/review/2026-09-11-well-and-gate/README.md) documents the canonical models, 3 m gate fit and rigid opening, well relocation out of the ridge lane, headless verification and remaining visual limits. No new model-generation credits were spent.

## Animation follow-up — 11 September

Jaco rejected the authored turn clip. Route changes now rotate the avatar during
normal walking/running, without the 0.65-second turning pause. Inspection retains
its look animation, but an active look is no longer restarted. Interrupted blends
explicitly keep total animation weight at one, preventing the bind pose from
briefly appearing. Inspection camera collision remains anchored to the shepherd,
and its aim eases toward the clue instead of snapping.

Verification: new animation regression check exercises idle-look → inspect and
rapid walk/run/look interruptions against an intentionally elevated bind pose;
no height leakage. Existing journey and camera suites pass. Browser inspection
renders a grounded shepherd. This is a targeted check, not another full playthrough.
See [animation follow-up](../../prototypes/shepherd-adventure/review/2026-09-11-animation-fix/README.md).
