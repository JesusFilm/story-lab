# 03 — House 3

Status: **accepted for checkpoint · 13 September 2026 · revised diorama continuity reviewed**.
[Rebuild plan and scene index](../README.md) · [User-drawn route](../reference-route.png)

## Place and approach

Existing lit House 3, approached along the established lane from House 1. The knock uses a local step toward the door, then returns to the route anchor.

## Intended beat

The occupants report seeing Mary and Joseph with a donkey heading toward the gate. This is an authored sighting within the fictional village story.

## Playable handoff

After the exchange, **Go to the gate** walks to the front of the timber gate. It does not unlock or open that gate; point 04 retains its placeholder.

## Scene direction

The lit window invites another attempt after House 1. Keep the reply gentle and brief, and do not assume the household knows the travellers by name.

## Direction recorded — 13 September 2026

Coming from House 1's angry refusal, the next thought should explicitly suggest
trying the neighbour's lit house. At House 3 offer **Knock on door**, reusing the
[shared house-knocking interaction](../house-knocking.md): shepherd gesture,
door effect and synchronized wooden sounds. The resident is helpful and reports
seeing the travellers heading toward the gate. End with an explicit choice to
walk to the gate; preserve the gate and all later scene placeholders.

The user invited a playable visual treatment, including an illustrated diorama
whose images show the door opening and a resident speaking. Sound-off players
must be able to understand who is answering and the useful direction.

### First play-test — approved direction, implemented draft

The user confirmed that the gentle, brief exchange fits and directed implementation. Use the existing StoryDiorama component's manual, instantly readable text mode
for three consistent views of this house: lit closed door, door opening, helpful
resident in the doorway. The 3D house stays as it is; the illustrated scene shows
the exchange. No new 3D resident or hinged-door model is needed. Keep the resident
visible while their words are shown; avoid a pulsing house as the only speaker cue.
Use a clear **Resident** speaker label, no scripture reference, and player-paced
advancement rather than timed disappearing text. These are authored story words.

Implemented sequence:

1. House 1 departure thought: **“Let's try next door. There's a light in the
   neighbour's house.”** Action: **Try next door**.
2. House 3 arrival: **“A warm light shines inside. Perhaps someone here can help.”**
   Action: **Knock on door**.
3. At 3 seconds, after stepping back, the first illustration shows the lit door with **“You hear footsteps. Someone is coming to the door.”** Choose **Ask about the travellers** to reveal the opening-door image. Shepherd:
   **“We're looking for a couple travelling with a donkey. Have you seen them?”**
4. Resident: **“Yes, I saw them earlier. They were looking for somewhere to stay.”**
5. Resident: **“They went up the lane toward the gate. Try there—you may find
   someone who can help.”**
6. Choose **Thank you** to return to the village view with the clue retained. Action:
   **Go to the gate**. Only this action starts the existing route to point 04.

The resident describes the couple rather than knowing their names without an
introduction. “Up the lane” describes the route, avoiding a screen-relative
“above” that may become confusing as the following camera turns.

Meaningful alternative: remain in the 3D view with an anchored **Resident inside**
speech card and a brief silhouette passing the lit window. This keeps the journey
continuous, but gives less facial expression and illustration-led storytelling.

Review the chosen treatment first for warmth, text length and whether the switch
from 3D to illustration feels natural. Then verify sound off, mobile readability,
pause/replay, double-click protection, explicit gate departure and House 1's
unchanged knock/refusal. Capture matched arrival views plus the knock, resident
reply and gate-choice states. The three illustrations and runtime scene are now implemented. Image loading begins on the knock; failure or an eight-second timeout keeps the complete text playable and offers **Retry illustrations** without losing the reading position. House 3 uses no voice recording. Static images and instant, player-paced text also serve reduced-motion play.

## Draft acceptance criteria

The player understands a direction and a reason to follow it. The camera and onward action agree with the spoken clue; no distant destination is silently unlocked.

[Stage this point](../../../rehearsal.html?point=3) · [Replay its incoming walk](../../../rehearsal.html?point=3&replay)

## User walkthrough

Listen/read once, then point out the gate or direction you think was meant. Walk there and review how the approach reveals the obstacle.

## Review record

- Agreed text/actions/shot: user approved the proposed gentle, brief exchange and diorama direction; implemented result still needs play-test acceptance.
- Before/after evidence and entry link: [screenshots and walkthrough](../../../review/2026-09-13-house-3/README.md).
- Functional checks: state, route, House 1 regression and desktop/mobile browser checks recorded in the review. No new performance certification or physical-device claim.
- User keep/revise decision: **keep** after the continuity revision; audit update, commit and feature-branch push authorized.
- Accepted checkpoint: **Implement House 3 sighting and consistent diorama art** on `codex/shepherd-story-rebuild`. No merge or deployment.

## Diorama continuity revision — 13 September 2026

The user rejected the initial illustration's continuity: roof beams, divided window,
wall treatment and reversed door handle differed from the actual model; the
resident looked too cartoon-like and exuberant beside the shepherd.

The revised image sequence uses the actual knocking screenshot as its architectural
reference and the shepherd's original T-pose reference plus the Follow the Light
style guide for the resident. Keep the plastered facade, undivided window with
its own timber lintel, beam-free parapet and left-side door handle. The door opens
on the right jamb. The resident has natural proportions and a serious, attentive
expression. Future images must preserve these constraints across every frame.

Pots, plants and baskets are omitted until matching 3D decoration is deliberately
added and reviewed. This is a possible later dressing improvement, not part of
this scene pass. Dialogue, knocking, route and all other placeholders are unchanged.
[Revision screenshots and walkthrough](../../../review/2026-09-13-house-3/continuity/README.md).
The user judged the revised images much better and authorized the audit update, commit and branch push. This scene is accepted for checkpoint; integrated release review remains outstanding.

17 September 2026: D025 supersedes the four-page copy with the approved three-page
sighting and a new right-pointing direction frame. [Scope and checks](../../playtest-roadmap/evidence/2026-09-17-t01/README.md). Awaiting playtest.
