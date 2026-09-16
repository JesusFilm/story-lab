# 04 — Barred timber gate

Status: **accepted checkpoint · successful user play-test on 14 September 2026**.
[Rebuild plan and scene index](../README.md) · [User-drawn route](../reference-route.png)

## Place and approach

Front/market side of the existing timber gate; this is distinct from the old node named gate at the entrance.

## Intended beat

The gate is barred from the other side. The shepherd decides to ask the household near the well, sending the route across the village.

## Route handoff

Keep the gate closed and unlit. The explicit **Try the houses near the well** action follows the winding detour to House 5 without crossing the gate.

## Recorded direction

Test the gate using **Open the gate** before revealing the obstruction. Two resisted tugs, synchronized timber sound and contact cues lead into the shepherd’s thought and an explicit choice to seek help near the well. See the implementation record below.

## Draft acceptance criteria

The obstruction is physically visible. The next walk changes direction smoothly and exposes the central village and well without an unexplained unlock.

[Stage this point](../../../rehearsal.html?point=4) · [Replay its incoming walk](../../../rehearsal.html?point=4&replay)

## User walkthrough

Try the front of the gate, then walk the entire detour to House 5 at normal speed. Review the turn, scenery exposure and whether its length feels purposeful.

## Review record

- Agreed text/actions: user approved the proposed two-tug scene and thoughts; camera choice delegated.
- Captures and entry: linked below.
- Functional checks: passed; see review record. No new performance certification.
- User keep/revise decision: successful play-test; accepted for this checkpoint.
- Accepted commit: focused gate checkpoint on `codex/shepherd-story-rebuild`.

## 14 September implementation

The user approved the two-tug gate check and proposed thoughts, authorizing the camera comparison. **Open the gate** now triggers a free-hand reach, two resisted movements and synchronized timber sound/contact cues. Only after trying does the scene reveal the bar. The shepherd then thinks, “I saw some houses near the well. Perhaps someone there can help.” **Try the houses near the well** starts the existing detour.

Selected the modest camera push and return to following view. The well-facing trial framed an intervening house and lost the shepherd, weakening orientation. The gate remains closed and unlit; later placeholders are preserved.

[Captures, verification and walkthrough](../../../review/2026-09-14-barred-gate/README.md). The user completed a successful play-test and authorized the audit update, commit and feature-branch push. [Audit entry](../../navigation-direction-retrospective-2026-09-13.md#14-september-update--barred-gate-discovery-and-well-detour). No merge or deployment is authorized.
