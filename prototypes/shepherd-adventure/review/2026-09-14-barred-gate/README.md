# Barred gate — accepted checkpoint

14 September 2026. Implemented on `codex/shepherd-story-rebuild`; user play-test successful; accepted for this checkpoint. No merge or deployment.

## Scene

Arrival says **Timber gate**, offering **Open the gate**. The shepherd approaches with the lantern in the right hand and reaches with the left. Two small resisted gate movements at 1.10 and 1.85 seconds synchronize a warm contact cue and synthesized timber sounds. At 2.8 seconds the thought establishes that the way is barred; at 5.7 seconds the thought suggests houses near the well. **Try the houses near the well** explicitly starts the existing House 5 detour. The gate stays closed and unlit.

The gate-specific state and renderer preserve the house knock timing and later placeholders. Pause/backgrounding freezes active time and suspends sound. Jump/replay/reset replaces scene state and cancels old sounds. Reduced motion removes the camera push, gate shake and expanding ring, retaining the reach and readable text.

## Camera comparison and captures

- [Arrival](arrival.png): actual full incoming leg replay from House 3, with earlier outcomes staged.
- [Tug](tug.png): deterministic paused pose at 1.22 seconds, not a full walkthrough capture.
- [Next thought](after.png): selected following view after the attempt.
- [House 5 arrival](house-5-arrival.png): reached through the explicit detour action; placeholder preserved.
- [Narrow viewport](mobile.png): 390 × 844 browser layout, not a physical-device certification.
- [Rejected well-facing trial](well-camera-trial.png): looking toward the well from the gate camera instead frames an intervening lit house, losing the shepherd and obstacle. Retained the gentle push and following view; the authored detour supplies the turn after the player chooses to move. The experimental camera query was removed.

## Specific local walkthrough

Open `/rehearsal.html?point=4&replay` to walk the full incoming leg. At the gate:

1. Choose **Open the gate**. Review whether the two tugs, free hand, contact cue and wooden sound communicate resistance.
2. Read both thoughts. The next choice must wait until the attempt is over, and departure must require your action.
3. Choose **Try the houses near the well**; walk to House 5 and verify that its placeholder remains.
4. Repeat with sound off, pause during the attempt, and enable Reduced motion in Review tools. Jump back to point 04 or replay; the gate must be ready to try again.

For a matched paused tug capture, use `/rehearsal.html?point=4&gate-time=1.22`. This explicitly stages a review pose, not an ordinary arrival. Click Continue to resume.

## Verification

Passed `verify-barred-gate.mjs`: action gating, duplicate input, active-time pause, obstruction, explicit departure, return to standing anchor, House 5 detour, replay/jump/reset and later gate-open reconstruction.

Passed `verify-rehearsal.mjs`: full route progression, fixed settlement/lighting, corridor geometry and landscape/portrait camera samples (zero hidden-player samples). Updated the walkthrough harness to perform the new mandatory gate action.

Passed existing `verify-house-rejection.mjs` and `verify-house-sighting.mjs`; `git diff --check` clean. Browser review covered gate arrival, staged tug contact, complete thought, narrow viewport, reduced-motion completion, full incoming leg and outgoing House 5 detour, and the alternate camera composition. Audio is synthesized at the same active-time cues; the user subsequently reported a successful play-test and accepted the scene, authorizing the audit update, focused commit and feature-branch push.
