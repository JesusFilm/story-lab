# Repeatable playtest → roadmap → implementation workflow

[Living roadmap](README.md) is the source of current work and decisions. Session
evidence lives under `evidence/YYYY-MM-DD/`; use a suffix for multiple sessions on
one date. Keep IDs stable when reprioritizing or superseding work.

## 1. Collect a real playtest

Capture build/revision or URL, device, browser, viewport/orientation, input method,
audio output/volume, network/cache state, date and whether the participant has
played before. Ask the participant to play a normal task without coaching; note
where they hesitate, reread, miss an action, lose place or recover.

Record an observation, its moment/action and the player's consequence separately
from their suggested solution. “Door closed before I could respond” is different
from “use arrows.” Keep verbatim snippets only when supplied, and label paraphrases.
Do not put personal names, relationships, private recordings or incidental desktop
content into this public repository. Review any shared evidence for privacy first.

## 2. Process and clarify

1. Add each distinct concern to the feedback register. Link duplicate reports to
   one outcome while retaining the source context. Include positive feedback and
   qualities to preserve, not just defects.
2. Mark reported, reproduced/observed, source-confirmed, preference or hypothesis.
   Record confidence and what would disprove a proposed explanation.
3. Ask no more than three focused questions at once. Reuse prior decisions; show
   the exact screenshot/beat when language is ambiguous. Do not ask the user to
   choose among technical implementation details they cannot judge.
4. Classify as a localized tweak or an initiative with its own design, dependencies,
   evidence and acceptance. Promote “simple” work when investigation exposes a
   state, media, camera or asset-system change.
5. Record answers as dated decisions, link affected IDs and revise the plan. Keep
   unanswered questions visible. Preserve the original report when a reproduction
   differs; investigate the build/scene mismatch.

## 3. Capture useful baseline evidence

Start a session record with revision, branch and dirty files; document the actual
browser, viewport/DPR, reduced motion, scenario, loading state and simulation/visual
time. Read local instructions, current roadmap decisions and relevant scene briefs.

- Screenshots: capture arrival, affected beat and return at the actual playing size.
  Keep raw originals. Add numbered annotations as a separate HTML/SVG overlay or
  clearly labeled derivative, with captions describing observations rather than
  unverified causes. Label staged/rehearsal captures and any extra tooling UI.
- Motion: use normal-speed recordings and timestamps for cuts, camera freezes,
  gestures, grouping and pacing. Stills locate a problem; they cannot prove rhythm.
- Sound: capture an audible isolated event and gameplay mix with device/output and
  volume settings. If listening/recording is unavailable, mark audio unassessed.
- Performance: record same-device cold/warm runs, frame/long-task/resource traces
  and focus state. Separate instrumentation overhead from the player's experience.
- Matched comparison: same route progress, camera, viewport, lights, simulation
  and visual clocks, and quality settings. Pause alone may not stop all visual
  clocks. If exact matching is unavailable, state it instead of implying a match.

Use the existing rehearsal, debug inspector and capture guidance where useful.
Do not display a staged jump as a complete normal playthrough. Keep evidence in
prototype docs; copied runtime assets stay independently owned by the prototype.

## 4. Plan a bounded implementation slice

Select one coherent item or small related group. Specify the player's problem,
chosen behavior, affected scenes/files, dependencies, content boundaries, checks,
acceptance criteria and exclusions. Resolve decisions that affect implementation
before changing behavior. Agree the criteria before judging the result.

Use this item template when expanding an initiative:

```markdown
### ID — concrete outcome
Status / priority / size / milestone:
Feedback and decision IDs:
Observed behavior and player consequence:
Chosen behavior and scope:
Open questions / dependencies:
Implementation steps and source surfaces:
Baseline evidence and capture recipe:
Acceptance criteria and relevant checks:
Human review required:
Risks, limits and deferred work:
```

Confirm current branch and applicable instructions. The prior rebuild was merged;
do not treat old checkpoint text as current release authorization. Planning is
not an instruction to deploy. Any new/revised biblical dialogue must preserve
character knowledge and distinguish scripture from invented connective story.

## 5. Implement, verify and review

Implement only the selected slice. Run checks appropriate to the change; inspect
existing tests for stale assumptions before reusing them. Update a test when the
accepted behavior changes, not to hide a regression. Reproduce the original issue,
then check neighboring scenes, pause/restart, narrow view and failure cases where
the change can affect them.

Recapture matched evidence. Present what changed, what technical checks establish,
what remains unassessed and a short playtest route. Ask for keep/revise against the
agreed criteria. Automated correctness is not evidence of comfort, enjoyment,
natural dialogue, sound quality or a coherent art style.

## 6. Update the roadmap in the same checkpoint

- Update item and milestone status; partial delivery stays partial.
- Append an implementation log row with actual scope, check outputs/evidence,
  human verdict, limitations and commit/PR if one exists.
- Append new decisions/deviations with rationale, superseded IDs, affected scenes
  and follow-ups. Do not rewrite history to imply the final direction was original.
- Link materially changed scene briefs to the superseding decision; reopen their
  affected acceptance criteria. Keep unrelated accepted parts intact.
- Split discoveries into new stable IDs with dependencies. Deferred items need a
  revisit trigger, not an unqualified “later.”
- Commit/push when authorized, following project instructions. A source checkpoint
  is distinct from release. For a chosen release, review runtime allowlists/hashes,
  hosted paths, licenses and public content; after authorized deployment verify
  the actual portal tile-to-play journey.

Completion entry template:

```markdown
Date / item IDs / revision:
Implemented:
Before and after evidence:
Checks and observed results:
Human review (who/role, date, keep/revise; avoid personal identifiers):
Unassessed or remaining issues:
Decisions/deviations and superseded IDs:
Status and next step:
```

## 7. Resume incrementally

At the next session, read the roadmap status, newest decisions and completion log,
then the selected item's evidence and scene brief. Verify the actual checkout;
never infer completion from chat, passing tests or a historical accepted label.
Select the next ready item, reuse settled answers, and gather only missing evidence.
A later playtest repeats this loop by adding feedback and reopening affected items,
not by replacing the roadmap with another disconnected plan.

## Keep the visual companion current

When roadmap direction or milestones change, update the
[throwaway visual roadmap](throwaway/roadmap-visual.html) in the same session.
Distinguish resolved user questions from experiments that require evidence and
from choices intentionally deferred to a later milestone. Count active tweaks
separately from superseded ones; never imply that planned work is complete.
Preserve the main sequence: initial feedback programme M0–M4, then multilingual
text and voices in M5. Refresh affected annotation captions without altering raw
captures, and label old exported screenshots as historical if not regenerated.
