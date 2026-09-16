# T01 first feedback slice — awaiting playtest

17 September 2026 · Branch `codex/t01-player-instructions` · baseline `c42b500`.
Source: 10 user comments from `T01-copy-review-v1-c42b500`, followed by explicit
permission to apply the same pattern to other basic player instructions.
No blank review field is treated as approval. No merge, push or deployment performed.

Existing checkout changes before this work: prototype AGENTS.md and README.md
modified; playtest-roadmap directory untracked. Those changes were preserved.
The user requested a new feature branch; this supersedes historical instructions
to reuse the previously merged rebuild branch for this slice.

## Applied feedback and before/after copy

| Review ID / area | Before | After |
| --- | --- | --- |
| T01-00, opening/ending | First scripture preview before Start; LUKE above; no address | Opening title “Shepherd Adventure”; ending title “Good news. Great joy.”; Start reveals first scripture; no book heading; exact manifest address below every verse, including ranges. Scripture, cue order and artwork unchanged. |
| T01-01-01, lamp arrival | Bottom/side caption plus Prepare your light | Centered “Get a lamp!” button only. |
| T01-01-02, lamp body | Lamp body; progress; description; success feedback; Use this lamp; Back to workbench | Centered image, “Lamp”, “Take Lamp”. |
| T01-01-03, wick | Progress, description, prior success, Fit wick, Back | Centered image, “Linen wick”, “Add wick”. |
| T01-01-04, oil | Progress, description, prior success, Add oil, Back | Centered image, “Oil”, “Add oil”. |
| T01-01-05, flint | Progress, description, prior success, Take flint, Back | Centered image, “Flint & tinder”, “Take flint”. |
| T01-01-06, lighting | Progress, description, prior success, Light lamp, Back | Centered image, “A light for the road”, “Light lamp”. |
| T01-01-07, lit | Ready for the road; Your lamp is alight; description and success; Take lamp; Back | Centered image, “Lamp is lit”, “Take lamp”. |
| T01-01-08, partial resume | Back to workbench / Continue preparing | Removed from player flow. Pause/Continue still preserves current step; restart remains an explicit global option. |
| T01-01-09, departure | A steady light. Time to find the others. + action | Centered “Try the first house” only; existing top-right +1 Lamp / A light for the road reward retained. |
| T01-00-10, analogous entry prompt | A lamp will light the way. / Go to the lamp workbench | Centered “Find a lamp” only. |
| T01-04, analogous gate prompt | The lane leads to a timber gate. / Open the gate | Centered “Open the gate” only on arrival. Timed tug/failure and well clue retained; onward button shortened from Try the houses near the well to “Go to the well”. |
| T01-08, analogous empty-stall prompt | The others may come this way. I’ll light the lantern and open the gate. | Centered “A light for the others.” plus “Light the lantern”: retain motive, omit repeated instructions. |
| T01-08-04, gate ready | That will light their way. Now for the gate. / Open the gate | Centered “Open the gate” only. Other empty-stall discovery/reveal beats retained. |

Preparation is forward-only, with no change to required item order, collection
or the lantern reward. Errors remain visible and actionable. Only entry, lamp,
gate and empty-stall panels adopt the centered player layout. Rehearsal remains
available; its lamp preparation also uses the compact centered card.

## Explicitly not fixed / deferred

- All five house interactions: approach/knock/wait text, illustrated copy,
  buttons, timing, image changes, framing and layout. Review trigger: the user's
  forthcoming house feedback (T01 remainder, T02/T03, I02/I03).
- House 8 → stall orientation text/actions and animal-pen clue are unchanged.
- Companion reunion dialogue/presentation and missing search continuity (I05).
- Scripture previous/back navigation (I02/T02): references and title-first start
  are implemented, but the existing forward flow is retained.
- Loader art/transitions, music/voice/mix, camera stalls, model quality and M5.
- No assertion that all T01 or I02 work is complete. T06 implementation is ready
  for human review; technical verification is not player acceptance.

## Verification and limits

- Existing Node checks: lamp assembly, scripture sequence (12 passages and unchanged
  manual advancement), barred gate, empty stall all passed; whitespace check passed.
- Updated old lamp browser check to remove the obsolete Back/resume expectation;
  browser checks in this session were performed interactively through the current
  player entry rather than running that historical screenshot suite.
- In-app browser: opening title contains no visible/accessibility scripture before
  Start; first verse shows Luke 2:8 beneath text and no LUKE heading.
- Normal player route: skip introduction → Find a lamp → walk → Get a lamp! → all
  six lamp cards → collection. Exact action labels checked. Pause/Continue at wick
  kept the same step. +1 reward and centered departure button observed.
- Desktop 1280×720 and narrow 390×844 lamp layout visually reviewed. Narrow card
  bounds x=20..370, y=288..556; document width 390 with no horizontal overflow.
- Ending preview: title-first start and Luke 2:17–18 range verified; full longer verse and reference fit at 390×844 with no horizontal overflow.
- No matched pre-change recording captured this session. Existing E01 opening
  image and the versioned review transcript are the before baseline; source diff
  is the exact copy comparison. Audio quality, full journey pacing and physical
  device performance were not assessed.

## Playtest

Open the local player at `http://127.0.0.1:8766/` and reload an existing tab.
Check title → Start → verse/address, then Skip story / Skip intro to reach the lamp.
Complete preparation, pause once, collect the lamp and continue. Check the centered
first gate and empty-stall prompts later in the route. Houses intentionally retain
their previous behavior. Review ending scripture via the complete route or the
clearly isolated `story-preview.html?story=ending` preview.

Human verdict: pending. Record keep/revise after the user's playtest; revisit
house content only when that feedback arrives.

## Follow-up D021 — shared panel placement

User playtest rejected the centered bare button covering the shepherd's head and
reported clipped rounded borders. Requested an upper-middle exploration panel,
upper house prompts, and a shared game UI approach. This supersedes D020's bare
button/center-screen placement, not its concise copy or lamp sequence.

Implemented [shared component rules](../../GAME-UI.md): exploration, house,
preparation and conversation variants selected centrally; shared rounded buttons
inside padded surfaces; all five house approach panels now use the same upper
zone. Illustrated-house copy/paging/timing remains deferred. Thus the earlier
statement that house *layout* was untouched is superseded; their text/actions
and sequence remain unchanged. Narrow player rendering now fills the viewport
instead of reserving a bottom strip for panels that no longer live there.

Browser inspection: exploration panel above the shepherd and continuous button
corners verified at 1280×720. No scene state-machine changes. Human acceptance
of the revised positions remains pending.

Follow-up validation: normal-route lamp sequence and House 1 approach reviewed
in browser; shared house panel verified at 1280×720 and 390×844, above the door
and shepherd with Pause accessible. Lamp, House 1 state and full rehearsal route/
camera checks passed (no route failures). Illustrated house handoff, full-route
UI overlap and subjective comfort still require playtest.

## Follow-up D022 — quieter header and lower prompts

Removed gameplay branding and replaced Pause text with a 44px hamburger button
with Open menu/Close menu accessible names and expanded state. Existing Continue,
Start again and Reduced motion options retained. Exploration and house/spoken
panels move down half their rendered height; preparation stays centered. Opening
scripture title and deferred house copy/sequence unchanged. Awaiting playtest.

D022 verification: syntax/whitespace checks passed. Browser confirmed hidden
branding, hamburger accessible name, Continue/Start again menu and successful
resume; lowered exploration prompt inspected at 1280×720. House offset uses the
same component-relative CSS rule; full-route position acceptance remains pending.

## D023 — user acceptance and next review

The user accepted the addressed parts and player instruction panel/text positioning.
D020–D022's implemented basic instructions, lamp flow, menu and scripture presentation
are accepted within their documented scope; earlier “awaiting playtest” entries are
historical. T01 remains partial and M2 incomplete. No house dialogue/sequence,
House 1 voice repair, scripture back navigation or companion continuity is accepted.
Next: review H01-A through H01-C2, the complete House 1 encounter, in the roadmap.
User authorized a branch commit; no push/merge/deployment requested.
