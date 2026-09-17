# 09 — Shelter owner and companion reunion

Status: **09a owner accepted for checkpoint · 09b reunion accepted for checkpoint · 15 September 2026**.
[Rebuild plan and scene index](../README.md) · [User-drawn route](../reference-route.png)

## Place and approach

House 9, beside the start of the final animal-area approach. The companions arrive from the newly opened timber gate.

## Intended beat

The householder owns the distant animal shelter and allowed Mary and Joseph to stay there. He gives directions. The other shepherds then arrive, stop and ask where to go; the main shepherd directs them, they run ahead, and the player chooses to follow.

## Current rehearsal

The owner conversation hands off to the companion arrival after **Thank you**.
The companions use the entrance-side lane through the opened, lit timber gate,
stop at House 9, exchange directions, and run ahead. **Follow the others** starts
the existing final route. Point 10's detailed scene and ending remain placeholders.
Staged House 9 entry reconstructs an open, lit gate and equipped lantern, with a
fresh owner conversation.

[Reunion only](../../../rehearsal.html?point=9&reunion) ·
[Review evidence](../../../review/2026-09-15-companion-reunion/README.md) ·
[Biblical and historical continuity](../biblical-and-historical-continuity.md).

## Draft acceptance criteria

Directions and the visible onward route agree. Companions visibly use the opened gate, wait for the exchange, then head along the correct path. Player-controlled follow remains explicit; a reader does not lose them offscreen.

[Stage this point](../../../rehearsal.html?point=9) · [Replay its incoming walk](../../../rehearsal.html?point=9&replay)

## User walkthrough

Test owner and reunion separately, then together from point 08. Wait before pressing Follow the others, pause during the exchange and confirm the companions and next action remain understandable.

## Review record

- Agreed direction: matter-of-fact richer animal owner; he mentions the woman was about to give birth. The user completed the play-test and accepted the implementation below.
- Before/after evidence and entry link: [House 9 review](../../../review/2026-09-14-house-9/README.md).
- Functional checks: state, shared scenes, route geometry and browser review recorded there. No new performance benchmark.
- User keep/revise decision: keep; play-testing good, audit update, commit and feature-branch push authorized.
- Accepted checkpoint: **Implement House 9 shelter-owner conversation** on `codex/shepherd-story-rebuild`.

## Owner conversation draft — 14 September 2026

The shepherd stops at the existing House 9 anchor. **Knock on the door** reuses
the three wooden knocks and free-left-hand gesture, fitted to this east-facing
facade. Its fixed light remains on. After the knock, the illustrated door is open
and the player advances four instant-text cues:

1. Shepherd: “Have you seen a couple travelling with a donkey?”
2. Pen owner: “Yes. They came to me earlier. The woman was about to give birth.”
3. Pen owner: “I own the large animal pen. There was no room in my house, so I let
   them use the stall at its far end.”
4. Pen owner: “It’s that way. Follow the pen to the far end. You’ll find them in
   the stall.”

**Continue** advances the first three cues. **Thank you** dismisses the diorama;
the shepherd stays at House 9. The accepted owner checkpoint originally offered
**Go to the Nativity Scene**; the reunion draft below now replaces that temporary
action. The player still chooses when to depart.

The owner is a middle-aged, shorter, fuller man with a large dark beard, colorful
burgundy/teal/ochre robes and a coordinated headwrap. Three matching illustrations
show him opening the door, explaining with a raised open hand, and pointing to
his left. The same explaining pose accompanies two adjacent lines. Gestures
change through illustrated cuts, as at the other houses; they are not continuous
character animation. The 3D door remains static and no voice recording is added.

The actual House 9 screenshot anchors the plaster patches, corner blocks, flat
parapet, timber lintels, undivided front-left window, visible side window and
right-positioned doorway. The ring stays on the free left edge of the door;
the door opens inward around the viewer-right jamb. Character style uses the
original shepherd reference. [Images and prompts](../../../assets/house-9/README.md).

**Direction orientation:** the outgoing route heads toward decreasing world Z,
which is the owner's left when he faces the shepherd. This appears on the right
of a frontal doorway image. The gesture uses that actual onward direction; the
facade is not mirrored and the walking route is unchanged. Review this reading
in motion as part of the creative play-test.

Image failure or an eight-second preparation timeout retains the entire dialogue
and offers retry without changing reading position. Pause, reduced motion, replay,
staged jumps and reset use the existing shared behavior. The user subsequently completed play-testing and accepted this checkpoint,
authorizing the audit update, commit and feature-branch push. This acceptance
covers the owner conversation only; the reunion and ending remain unfinished.


## Companion reunion draft — 15 September 2026

**User play-test complete; accepted for checkpoint.**
The user chose a brief relieved gathering followed by renewed urgency, with an
explicit follow choice. Their green map annotation establishes the entrance-side
House 1 / House 3 approach; do not reuse the former west-side arrival.

### Performance and actions

1. After **Thank you**, the camera cuts back toward the timber gate. Two distinct
   existing companions run up the House 3 lane, staggered, crossing the centre of
   the actual opening beside the lamp. Soft synthetic footsteps accompany motion
   if browser audio is available; text remains sufficient with sound unavailable.
2. After both have passed the gate, the camera eases toward the House 9 group over
   three seconds. They slow, stop in a loose triangle and pause briefly. Reduced
   motion cuts between the two fixed views while preserving their actual journey.
3. Companion: **“We saw your light! Have you found the way?”**
   Player action: **Tell them what you learned**.
4. Shepherd: **“Yes. This man gave the couple shelter. They’re in the stall at the
   far end of the animal pen.”** He turns toward the onward route and gestures
   with his free hand. Player action: **Continue**.
5. Other companion: **“Then come—let’s see the child the angel told us about!”**
   Player action: **Let’s go**.
6. They run a short way ahead; the camera widens to retain the main shepherd and
   onward route. **Follow the others** appears once both companions are ahead at their waiting
   positions. Waiting leaves them visible near the animal-area entrance. Rapid
   input during their short departure cannot send the player through them.
7. Companions continue along the existing approach when the player follows.
   They maintain a gap as they slow, and stop clear of the player’s walking path.
   Detailed final grouping remains part of point 10’s future review. No ending starts;
   point 10 remains a separately directed scene placeholder.

### Textual continuity

Luke 2:10–12 says the birth has already happened and supplies the sign of the
wrapped baby in a manger. The angel's recorded message gives no parental names.
This exchange therefore uses **the couple** and **the child**. The owner’s earlier
“about to give birth” describes the past arrival, not a still-future birth.
The encounter and dialogue are invented connective storytelling, not scripture.
See the continuity guide for evidence and earlier-scene follow-ups, including
unestablished donkey knowledge. Existing costumes are reused, not newly certified
as historically accurate.

### Implementation boundary and review

The reunion owns its state, actor paths, presentation and camera in separate
modules; shared path sampling was extracted without changing the player's routes.
No settlement structure, light placement or other scene interaction was moved.
Companion load failures retain the existing loader and reload retry. Replay/jump
and reset reconstruct fresh scene state; a direct point 10 jump retains its old
placeholder without staging the companions. Direct reunion review still runs the
owner's completion transitions before beginning the cinematic.

The user should judge gate geography, relief/urgency, reading rhythm, pointing,
run-to-idle blending and the follow handoff. Passing technical checks is not
creative acceptance. No commit, merge or deployment marks this draft accepted.


### Reunion accepted checkpoint — 15 September 2026

The user completed play-testing and authorized the feature audit update, focused
commit and remote branch push. Point 09b is accepted at this checkpoint.
[Audit entry](../../navigation-direction-retrospective-2026-09-13.md#15-september-update--companion-reunion-and-biblical-continuity).
Point 10 remains unfinished. No merge to main or deployment is authorized.

17 September 2026: D026 updates the text/actions in this scene. [Current inventory](../../playtest-roadmap/evidence/2026-09-17-t01/remaining-interactions.md). Copy pass accepted by the user (D027); broader interaction issues remain open.
