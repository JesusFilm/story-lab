# 05 — House 5 and tracks

Status: **ready for user review · creative acceptance pending**.
[Rebuild plan and scene index](../README.md) · [Review captures and checks](../../../review/2026-09-14-house-5/README.md)

## Agreed direction — 14 September 2026

The user approved this bounded implementation plan: **Knock on door**, silence,
a second automatic knock after a short wait, **“No one is answering.”**, then
**Look around**. Walk near the stone well, discover human footprints and hoofprints
heading past the market stalls toward the animal pen, outline them in steady gold,
and offer **Follow the tracks**. A gentle downward camera move reveals the trail.
House 5 remains unlit. No resident, waking light or reply is introduced.

## Implementation for review

- Reuses the existing three-strike hand gesture and wooden sound twice. Strikes
  occur at 0.85, 1.20, 1.55 and 4.85, 5.20, 5.55 active seconds. The thought and
  Look around action appear at 7.2 seconds. Pause freezes the sequence.
- Holds the arrival camera during the door approach to avoid collision reframing.
  The shepherd returns to the standing point before inspection.
- Look around walks a short arc along the east side of the well at walking speed.
  Its endpoint reconnects continuously to the existing market-side route.
- Ground marks use rounded human sandal soles and single rounded donkey hoof
  shapes. They exist before discovery; steady gold outlines appear when spotted
  and remain during the onward walk. No additional fixed light is introduced.
- Discovery thought: **“Footprints… and hoofprints. They lead past the market
  stalls toward the animal pen.”** It does not identify who made them.
- Reduced motion cuts to the discovery framing and uses fixed knock cues.
  Explicit departure preserves point 06's unfinished placeholder.

## User walkthrough

[Stage House 5](../../../rehearsal.html?point=5) ·
[Replay full incoming leg](../../../rehearsal.html?point=5&replay)

1. Knock once. Judge both attempts, the silent wait, and the unanswered thought.
2. Choose Look around. Judge the walk near the well and the camera move.
3. Distinguish the two track types and read their direction without coaching.
4. Follow the tracks past the stalls; point 06 should remain a placeholder.
5. Try Pause during a knock/search, then Replay approach to confirm a fresh scene.

## Review record

Plan approved; implementation awaits the user's play-test and keep/revise decision.
Automated state and browser checks are technical evidence, not creative acceptance.
The user authorized an audit update, focused commit and feature-branch push.
This is an implementation checkpoint; creative acceptance remains pending.
No merge or deployment is authorized.

17 September 2026: D026 updates the text/actions in this scene. [Current inventory](../../playtest-roadmap/evidence/2026-09-17-t01/remaining-interactions.md). Copy pass accepted by the user (D027); broader interaction issues remain open.
