# A lantern in the dark — review round

**Historical, superseded:** Jaco subsequently accepted the atmosphere and rejected
the arithmetic challenge and fixed camera. See the [next review](../2026-09-10-search-and-camera/README.md).
The results below describe the first-round source snapshot, not the current player.

Status: done — bounded implementation and verification complete; awaiting Jaco’s playtest. Owner: Codex. Date: 10 September 2026.
Verdict belongs to the implementing agent; Jaco has not approved these new mechanics.

[Play the new study](http://127.0.0.1:8765/journey.html) · [Original maze](http://127.0.0.1:8765/index.html) · [Plan and frozen criteria](../../../../game-concepts/shepherd-adventure/2026-09-10-lantern-journey.md)

## Direction supplied by Jaco

Basic remote arrows are a fixed constraint. The central challenge, camera and
atmosphere may change substantially. The prototype should simulate enough scenery
to test the middle experience. The gallery's shepherd scenes are the visual target.
New references/models were permitted with credit awareness; this round required none.
These answers were already supplied, so no extra approval question was needed.

## Baseline observations → changes

| Evidence | Consequence | Change | Check |
|---|---|---|---|
| Medium V2, 48 m played with Enter, Left, Up and Down. Heading drives the camera and the minimap carries most route information. | Turns interrupt spatial orientation; alternatives are difficult to judge from the scene. | Fixed northward camera bearing; framing around both ends of a selected path; optional survey. | Actual arrow/OK play and survey screenshots. |
| At stopped junctions, the reference's distant skyline is missing. The ground is flat and uniformly bright. 152 repeated homes fill the original scene. | Little visual sense of moving from a field into a small settlement. | Open field and horizon, 14 reused structures, curved dirt paths, relief, rocks/grass, sparse warm lights. | Paired 1440 × 810 decision captures and exterior view. |
| Original branches mostly ask for memory or minimap navigation. | No clear local tradeoff to think through. | Lantern costs make exposure, shelter and refill points matter. Waiting is free; recovery preserves discoveries. | Three viable routes, unaffordable shortcut rejection, pause and recovery tests. Human interest remains unassessed. |

## What to try

At the threshold, compare the exposed ridge with the olive courtyard. Survey the
village and plan more than one leg: a path you can afford now may leave too little
light for the next. Explore the hillside overlook if you want a deliberate dead-end
example; return to your last flame through the down-arrow options menu. Complete a
route via the last hearth to reach the open stall.

The lantern is an invented gameplay device. It is not presented as part of Luke's
account, a moral score, or a measure of faith. Story copy paraphrases Luke 2:8–20;
the navigation star is the reference pack's documented creative adaptation.

## Evidence

- [Before: stopped maze junction](before-junction.jpg).
- [After: field and settlement](after-field.jpg).
- [After: stopped route decision](after-junction.jpg).
- [After: introduction](after-intro.jpg).
- [After: unaffordable shortcut](after-blocked-shortcut.jpg).
- [After: complete survey](after-survey.jpg).
- [After: paused travel](after-paused.jpg), [arrival](after-arrival.jpg), [narrow intro](after-mobile-intro.jpg) and [narrow play](after-mobile-play.jpg).
- Baseline [source snapshot](before-source.zip) and [hashes/scenario](baseline.json).
- [Resource/route verification](../../checks/journey-verification.json).

Captures use Chrome at 1440 × 810. The comparison pairs the same activity (a stopped
route decision), not the same map: the new world is deliberately authored differently.
The screenshots are exploratory evidence, not a pixel regression benchmark. The
baseline's decorative clocks were not frozen, and no pixel-based quality score is
claimed. Still images do not establish camera smoothness; camera movement was also
observed during actual play. Sound was not listened to and remains unassessed.

## Verification and verdict

- 14 logic checks passed: three complete routes; 20 reachable resource states; every
  checkpoint can reach the ending; waiting/preview spend nothing; pause freezes travel;
  invalid/unaffordable commits do not move; recovery/reset work.
- Real Computer Use play completed field → gate → olive → market → arch → goal:
  93 metres, six discovered places, five light remaining according to the tested
  route model. The actual ending displayed 93 metres and six places.
- Keyboard-only checks covered preview, survey, blocked shortcut, down-arrow options,
  return-to-flame, OK pause during travel, resume and replay. The paused UI remained
  unchanged across observations. Real remote hardware and transport were not tested.
- All 14 placed structure bounds clear the sampled walking paths by at least 0.9218 m.
  The [browser console record](browser-console.json) reports the exact fits. There
  were no captured console errors or warnings on the final load.
- Original controller and village verification suites passed; their map, assets and
  game logic remain unchanged. Only a link to this study was added to the old player.
- Desktop captures are 1440 × 810; narrow intro/play controls were inspected at
  390 × 844. Narrow-screen survey readability has not been comprehensively reviewed.
- No Tripo jobs, model edits or generated asset approvals occurred.

Implementing agent’s judgment: keep this as a reviewable alternative. The new world
has a visible exterior-to-interior progression and the challenge now exposes a
planning tradeoff. It remains noticeably simpler than the gallery’s art, and human
interest in the lantern rule is unassessed. No combined quality score is used.

## Limits and next question

This is a short route-planning experiment, with approximately 30–37 seconds of actual
walking on verified 93–113 m routes, plus unlimited planning, exploration and story
time. It has no free movement, lives, achievements, save system, Forge integration
or TV input transport. The final shelter is a simple empty manger blockout with a
textual story conclusion. Existing generated models remain pending their separate
art/motion approvals. Terrain is still a procedural study, not gallery-quality art.

Does looking ahead for the next sheltered flame make you curious to choose and
travel, or does managing light distract from the story? That answer should determine
whether to retain the resource rule or keep the new camera/world treatment with a
different challenge. Further feature work should wait for that playtest.
