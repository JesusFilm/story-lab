# 02 — House 1

Status: **accepted · successful user play-test on 13 September 2026**.
[Rebuild plan and scene index](../README.md) · [Rehearsal map](../../../map/rehearsal-map.svg)

## Direction recorded — 13 September 2026

The user requested one simple **Knock on door** action, visible and audible
knocking, an irritated resident disturbed at night, a temporary waking light,
a spoken refusal, the light going out, and an explicit action to continue.
Keep this work on `codex/shepherd-story-rebuild`; do not merge or deploy.

The next mapped destination is **point 03, House 3**. Its existing light supplies
a reason to try another home. Preserve the winding western-lane route and the
House 3 placeholder; do not implement its helpful exchange in this scene.

## Playable draft

The house starts dark. Selecting **Knock on door** makes the shepherd take a
short step toward the actual door and raise his free left hand; the right hand
keeps the lantern. Three small door rings coincide with synthesized wooden
knocks. The resident stays behind the closed door, with warm light at the window.
No new villager model is needed for this staging.

| Active time after action | Beat |
|---|---|
| 0–0.55 s | Step toward the door |
| 0.85, 1.20, 1.55 s | Three knocks, free-hand gesture and door cues |
| 2.50 s | Warm window light turns on |
| 3.30 s | Voice and subtitle: **“Go away! It is late!”** |
| 5.90 s | Window light goes out; shepherd steps back |
| 6.70 s | **“There’s a light farther along. Perhaps someone there can help.”** |
| Player choice | **Try the lit house — House 3** walks the existing next corridor |

Timing uses active simulation time. Pause/backgrounding freezes both the scene
and audio. Departure is unavailable until the light goes out and the shepherd
steps back. No automatic departure or repeated knock. Review jumps/replays reset
the scene and cancel its sounds; later staged points reconstruct prior completion.

The window light is a **temporary House 1 response**, an exception to the otherwise
unlit house. Helpful-house lights, House 5's darkness, gate lighting and all other
placeholders remain as before. The local approach moves the shepherd 0.85 m toward
the facade and 0.85 m along it, then returns to the established route anchor.
House transforms and corridor/map geometry are unchanged.

## Sound and future refinements

The user accepted this wording and 6.7-second rhythm in the successful scene
play-test. They remain adjustable during later integrated review. The voice is a filtered local system-voice recording, not an acted angry
performance. Review its irritation, intelligibility and volume in the game.
The arm pose is a procedural free-hand reach with three short strikes, not a new
authored animation. Reduced motion keeps the essential gesture/step and replaces
expanding knock rings with fixed-size cues. Subtitles support play without audio.

## User walkthrough

[Stage House 1](../../../rehearsal.html?point=2) ·
[Walk its full incoming leg](../../../rehearsal.html?point=2&replay) ·
[Captures and checks](../../../review/2026-09-13-house-1/README.md)

1. Arrive without opening the map. Is **Knock on door** the obvious action?
2. Knock once. Check the step, hand/door contact, three taps and window light.
3. Listen to the refusal. Is it irritated enough, too harsh, or too slow?
4. Wait for darkness. Does the shepherd's response make sense before continuing?
5. Select **Try the lit house**. Follow the western lane to House 3 and check that
   this feels like a plausible next attempt. House 3 remains a labelled placeholder.
6. Replay the approach, pause during the refusal, and try a narrow touch viewport.

## Review record

- User direction and scene acceptance: successful play-test; user reported the scene worked really well on 13 September 2026.
- Before/after evidence: [review captures](../../../review/2026-09-13-house-1/README.md).
- Functional verification: model and live-browser checks recorded with the captures.
- User keep/revise decision: **keep**; accepted for a focused commit and feature-branch push.
- Accepted checkpoint: **Implement House 1 knock and rejection scene** on `codex/shepherd-story-rebuild`; commit and push authorized. No merge or deployment.
- [Dated audit entry](../../navigation-direction-retrospective-2026-09-13.md#13-september-update--house-1-rejection-response-and-timing).
