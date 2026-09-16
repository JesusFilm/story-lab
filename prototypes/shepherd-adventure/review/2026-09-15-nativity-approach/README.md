# Nativity approach — accepted checkpoint

15 September 2026 · `codex/shepherd-story-rebuild` · user accepted the approach.

## Change

All three shepherds run along the long route past the sheep. The player switches
to walking for the final eight metres, near the shelter. Companions have only
idle/run clips, so they run to their existing stopping positions and wait.
This supersedes the earlier sustained walking direction inside the enclosure.
The route, camera, dialogue, other scenes and point 10 end placeholder are unchanged.
No merge, deployment or new asset generation.

## Walkthrough

[Start with companions waiting ahead](http://127.0.0.1:8766/rehearsal.html?point=9&reunion&reunion-pose=waiting).
The server runs with `python3 serve.py --port 8766` from this prototype.

1. Click **Continue** to unpause, then **Follow the others**.
2. Check that the player and both companions run past the sheep without the former slow travel.
3. Near the shelter, judge whether the player's roughly four-second walking finish feels quiet enough. Companions should settle ahead without intersecting the player.
4. Pause/resume during movement. Arrival must remain at point 10 without automatically launching an ending.
5. For the adjacent-scene check, start at `rehearsal.html?point=9`, complete the owner conversation and reunion, then follow.

The existing rebuild arrival is **Route complete**, disabled. It does not yet
contain the original experience's active ending interaction. Recognition, button
wording and ending integration remain follow-up work directed by the user.

## Screenshots

[Running past the sheep](01-running-past-sheep.png) ·
[Player walking near the shelter](02-quiet-approach.png).

Actual rendered canvas captures, paused during a browser walkthrough from staged
point 09 with the companions waiting. They exclude the HTML controls. These are
current after-change captures, not matched before/after shots or a full game playthrough.

## Verification

- `node checks/verify-companion-reunion.mjs` passes: running speeds past the sheep,
  final walking transition, spacing, pause, action gating, reset/replay and preserved
  ending placeholder. Transition sampled at z = -64.45 with 7.86 m left; the leg
  completes in 13.2 simulated seconds (50 ms steps), not a device performance claim.
- `REHEARSAL_REVIEW_OUTPUT=/tmp/nativity-review/ node checks/verify-rehearsal.mjs`
  passes all route/state/geometry checks and sampled landscape/portrait cameras.
- Browser walkthrough confirms run and walk poses, companions waiting ahead,
  pause/resume and the point 10 placeholder. Physical-device verification remains pending.
- `git diff --check` passes.

## Continuity

Movement pacing is authored staging. This change adds no speech, scriptural claims,
character knowledge, costumes or props. The standing Luke 2 continuity guide applies;
recognition of the announced sign remains reserved for the next piece of work.

The user accepted this approach and authorized the audit update, focused commit
and remote feature-branch push. Recognition and ending remain pending; no merge
or deployment is authorized.
