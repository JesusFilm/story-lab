# House 3 diorama continuity revision

13 September 2026 · `codex/shepherd-story-rebuild` · User review pending.

The first diorama redesigned the house and used a resident whose exaggerated face
and proportions did not match the shepherd. This revision uses the actual
[knocking capture](../03-knock.png) as the architectural edit target and the
[shepherd's model reference](../../../../../assets/characters/shepherd/reference.png)
as the character-style reference, guided by
[Follow the Light](../../../../../styles/follow-the-light/README.md).

## Continuity constraints

- Preserve the mostly plastered facade and sparse exposed stones at its edges and
  base, rather than turning the wall into fully exposed brickwork.
- Retain the simple, undivided lit window with its dark timber lintel directly above.
  No four-pane crossbars or added masonry frame.
- Retain the flat uneven parapet without projecting round roof beams.
- Keep the ring handle on the left of the closed door. The opening frames use a
  right-jamb hinge, keeping the handle near the free edge of the same door slab.
- Use a serious, attentive adult resident with natural facial/body proportions and
  tactile linen, matching the shepherd reference's semi-realistic AA game style.
- Keep the frontage bare. Pots, baskets and plants are a possible future 3D dressing
  task; they are not introduced in the illustration ahead of the world.

The illustrations remain generated interpretations, not exact renders of an
animated 3D door. Assess continuity in the actual transition. House geometry,
knocking, text, scene progression and other placeholders are unchanged.

## Review

[Play House 3](http://127.0.0.1:8766/rehearsal.html?point=3).

1. Look at the window, wall, roofline and left-side door handle before knocking.
2. Knock and compare those details with the closed-door illustration.
3. Advance to the resident: check natural proportions, restrained expression and
   which side of the doorway the door opens on.
4. Read both replies, then choose **Thank you** and **Go to the gate**.
5. Repeat at phone width to assess whether the resident remains readable.

Current revision captures will be saved in this folder. The parent folder retains
first-pass captures for comparison. Acceptance remains with the user; image loading
and interaction checks do not establish artistic acceptance.

## Current captures and checks

- [World view during the knock](03-knock.png).
- [Corrected closed-door illustration](04-footsteps.png).
- [Opening door and resident](05-question.png).
- [Resident speaking and gate clue](07-gate-clue.png).
- [Phone-sized view](11-mobile-clue.png).
- [Image-failure text fallback](12-image-fallback.png).

Passed the existing `checks/verify-house-sighting-scene.mjs` against the revised
images, saving captures here through `HOUSE_REVIEW_OUTPUT`. This includes the
House 1 → House 3 → gate walkthrough, three knocks, pause, manual reading,
explicit departure, replay/interruption, silent portrait/reduced-motion play,
image failure and retry, and no page errors. Desktop 1440 × 900 and emulated
portrait 390 × 844 screenshots were visually inspected. The house silhouette,
window lintel, undivided window, plaster treatment and door-handle side were
compared against the actual knocking reference. No physical-device or exact
pixel-match claim is made. `git diff --check` also passed.

The three selected images and built-in ImageGen prompt set are recorded in
[the asset README](../../../assets/house-3/README.md). All work remains local on
the required feature branch. No commit, push, merge or deployment in this revision.

## Accepted checkpoint

Following the continuity revision, the user judged the result much better and
authorized the feature audit update, focused commit and push on
`codex/shepherd-story-rebuild`. This supersedes the pending-review status above
for this checkpoint. No merge or deployment is authorized.
