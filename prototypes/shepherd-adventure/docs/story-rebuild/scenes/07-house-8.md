# 07 — House 8

Status: **accepted for checkpoint · 18 September 2026 handoff follow-up · user play-test complete**.
[Rebuild plan and scene index](../README.md) · [User-drawn route](../reference-route.png)

## Place and approach

House 8, reached by the curved route from the pen; onward route wraps around the northern side of House 7 toward Empty stall 1.

## Intended beat

The owner did not see the travellers but gives a credible suggestion to ask at the stall by the gate. The advice is helpful even though the stall later proves empty.

## Preserved outgoing route

Explore the empty stall walks to Empty stall 1 on the rear side of the gate. Preserve this approach instead of taking a straight line through House 7.

## Earlier direction questions (resolved by the implementation direction below)

Exact reason the owner suggests that stall; knock versus call; tone, lighting cue and direction gesture. Introducing the stallholder as someone with animal accommodation is a candidate, not approved wording.

## Draft acceptance criteria

The player has a reason to try the stall. The camera shows the next direction, and the walk reveals a different side of the houses and gate.

[Stage this point](../../../rehearsal.html?point=7) · [Replay its incoming walk](../../../rehearsal.html?point=7&replay)

## User walkthrough

After hearing the advice, describe whom you are seeking and why. Walk to the stall and judge whether the route maintains atmosphere.

## Review record

- Agreed direction: user requested implementation of the proposed sequence; see below.
- Screenshots and entry link: see the review evidence below.
- Functional checks: state and route checks pass; browser walkthrough recorded. No new performance benchmark.
- User keep/revise decision: keep; play-test complete, documentation update, commit and feature-branch push authorized.
- Accepted checkpoint: **Implement House 8 advice and consistent doorway art** on `codex/shepherd-story-rebuild`.


## Implemented direction — 14 September 2026

The user directed implementation of the proposed knock, friendly elderly resident,
brief illustrated advice, closed-door farewell and explicit stall exploration.
The three shared knocks use House 8's own facade translation and local approach.
The house stays lit. The existing curved route around House 7 is unchanged.

1. **Knock on door** triggers the free-left-hand gesture and three wooden sounds.
2. Closed-door frame: “You hear footsteps. Someone is coming to the door.”
3. **Ask about the travellers** opens the illustrated door. Shepherd:
   “Have you seen a couple travelling with a donkey?”
4. **Continue** shows the old man's advice: “I haven’t seen them, friend. But
   there’s an empty stall beside the gate. They might have stopped there to rest.”
5. **Thank you** shows the same closed facade: “He gives you a warm smile and
   closes the door.”
6. **Return to the village** dismisses the illustration. **Explore the empty
   stall** alone starts the walk to point 08; its gate/search placeholder remains.

All text is instant and player-paced. Door opening/closing is shown by illustrated
cuts, as in House 3; the 3D door remains static. No voice recording is added.
Image timeout/failure retains the shared complete-text fallback and retry control.
The old man has full-body and portrait references matched to the original shepherd.
The current screenshot anchors the facade, plaster patches, window and ring side.

[Artwork and prompts](../../../assets/house-8/README.md) ·
[Walkthrough and screenshots](../../../review/2026-09-14-house-8/README.md).
The user completed their play-test and accepted this checkpoint, authorizing the
feature documentation update, commit and feature-branch push. Integrated release
review remains outstanding. No merge to main or deployment is authorized.

## 15 September follow-up — show the destination

Explore the empty stall now pulls back for 2.4 seconds to show the shepherd,
House 8 and the empty stall together. The shepherd stays at the door while the
view holds. **Go to the stall** starts the existing curved route, with a two-second
blend back to the following camera. Pause freezes the shot; reduced motion uses
a direct wide view. Replaying or jumping clears the shot. This supersedes the
immediate departure described above. Camera feel awaits user review.

The user accepted the integration and follow-up fixes at the 15 September checkpoint,
authorizing a commit and push to the feature branch. Further model/decorative work
and release review remain separate.

17 September 2026: D026 updates the text/actions in this scene. [Current inventory](../../playtest-roadmap/evidence/2026-09-17-t01/remaining-interactions.md). Copy pass accepted by the user (D027); broader interaction issues remain open.

## 18 September follow-up — accepted handoff slice

The shared illustrated presenter now uses a doorway-forward crop and scale for Houses 3, 8 and 9. House 8 keeps the question on the first page and combines the old man's reply with the stall direction on the second page. Selecting **Thank you** disables the button, briefly fades the illustrated card and starts the existing stall orientation. After the view settles, **Go to the stall** is the only departure action. There is no separate **Find the empty stall** or **Explore the empty stall** confirmation.

The user playtested this branch and approved the bounded change. The existing curved route, house lighting and state gates are unchanged. The avatar remains behind the opaque illustrated card; a composited shepherd or first-person variant is optional follow-up work if a later playtest reopens that viewpoint concern. Audio continuity and performance remain separate initiatives.

[House handoff evidence and roadmap log](../../playtest-roadmap/evidence/2026-09-17-house-handoffs/README.md) · [Stage this point](../../../rehearsal.html?point=7)
