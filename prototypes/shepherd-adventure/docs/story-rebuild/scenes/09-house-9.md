# 09 — Shelter owner and companion reunion

Status: **09a owner accepted for checkpoint · 09b reunion remains a placeholder · 14 September 2026**.
[Rebuild plan and scene index](../README.md) · [User-drawn route](../reference-route.png)

## Place and approach

House 9, beside the start of the final animal-area approach. The companions arrive from the newly opened timber gate.

## Intended beat

The householder owns the distant animal shelter and allowed Mary and Joseph to stay there. He gives directions. The other shepherds then arrive, stop and ask where to go; the main shepherd directs them, they run ahead, and the player chooses to follow.

## Route-rehearsal placeholder

The owner conversation now gates the temporary **Go to the Nativity Scene** action.
That action walks the existing final route; it bypasses the unimplemented reunion.
Display the reunion as pending until it exists. Staged entry reconstructs an open,
lit gate and equipped lantern, with a fresh owner conversation.

## Direction to settle before scene implementation

09 owner direction is implemented below. 09 reunion remains separate work: timing,
where companions stop, the player action for giving directions and Follow the
others. Companions reunite here, not at point 08.

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
the shepherd waits for **Go to the Nativity Scene**. No automatic departure occurs.
The companion cutscene/reunion and point 10 ending remain placeholders.

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
