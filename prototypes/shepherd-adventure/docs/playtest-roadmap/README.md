# Shepherd Adventure — playtest roadmap

Created 17 September 2026 · **Working roadmap; feedback direction clarified and bounded slices recorded.**

This is the living roadmap for turning playtest feedback into bounded improvements.
Start here for the next iteration. Preserve earlier scene briefs as historical
decisions, and link any superseding decision from this roadmap. Code landing is
technical progress; user playtest is required before a feedback item is accepted.

[Annotated evidence](evidence/2026-09-17/annotations.html) ·
[House 2 map annotation](evidence/2026-09-17/companion-search.html) ·
[Baseline and capture limits](evidence/2026-09-17/README.md) ·
[Repeatable feedback workflow](WORKFLOW.md) ·
[Original scene plan](../story-rebuild/README.md) ·
[Standing visual guide](../../../../styles/follow-the-light/README.md)

This README is the canonical roadmap and handoff. The dated evidence folders hold
the source captures and detailed before/after records; `WORKFLOW.md` explains how
an agent resumes a feedback session. The former visual companion was retired in
D028 because it duplicated this record and was not used by the prototype.

## Current direction at a glance

- Keep opening/ending scripture unchanged and text-focused; show exact verse
  addresses and allow previous/next review.
- House 8 is the confirmed awkward example; review every house interaction for
  coherent storytelling. Keep illustrations, match their scale/perspective to the
  3D doorway and compare a retained shepherd overlay with a deliberate first-person
  handoff. Make thoughts/dialogue brief and forward-only.
- Stage companions searching House 2 in the background, with later glimpses and
  a credible route to the existing reunion. No extra required clicks.
- Give gameplay its own audible world: a quiet night bed, movement cues, tactile
  decision sounds and contextual sounds near animals and occupied houses. Use
  distance to let nearby sources grow naturally louder. The intro-diorama → 3D
  handoff and audio behavior during loading are deferred until the loading and
  resource-lifetime design is rethought.
- Rework the plain 2D loader's art and abrupt entry/exit. Investigate whether one
  initial load plus quiet preparation can avoid repeated loading interruptions;
  retain graceful, story-matched waits when genuinely necessary.
- Investigate freezes as an independent engine/camera issue: reported on both M1
  and M4 Macs. Start with traces and code, not browser-version explanations.
- Optimize first for lower-powered devices and broad audiences, including people
  with limited resources. Stronger devices should run comfortably; maximum visual
  quality is not the product goal.
- After this feedback programme, deliver **M5: multilingual text and voices**, with
  a language picker on the starting screen and generated voice assets for readable
  content. Keep future content ready for localization.

**Accepted for this PR:** the house handoff and gameplay ambience/effects slices,
including the final quiet female house voice, are approved by user playtest (D040).
I01's separate House 1 refusal-voice reliability check remains open. I04 engine/camera
investigation and I03's remaining all-house audit remain open. I08's initial resource-lifecycle investigation is now recorded in D041 and the
[memory report](evidence/2026-09-18-memory/README.md). Asset optimization and a
measured loading-strategy comparison remain next; transition implementation is open. I09 defines the following multilingual
milestone.
These are ready planning/diagnostic directions, not a record of implemented fixes.

**Latest house review — 17 September:** [Normal-player walkthrough and proposed second pass](evidence/2026-09-17-house-handoffs/README.md).
All five house encounters were reviewed from arrival through departure. F06's
scale/viewpoint break is visually verified in Houses 3, 8 and 9. House 8's old
close-before-thanks order no longer reproduces after D026/D027, but the immediate
return to a closed 3D door remains abrupt. The proposal starts with House 8's
framing and farewell; alternatives are not yet built or accepted. Live sound and
continuous-motion quality were not assessed by the available tools.

## Intended outcome

Keep the player immersed in a coherent night journey: reading should support the
scene, conversations should feel connected to the village, the village should
sound alive, and movement should remain responsive. This organizing principle summarizes the feedback; specific design choices are
recorded below.

The roadmap covers investigation, clarification, evidence, planning and bounded
implementation slices. All task priorities, size estimates and acceptance criteria
below are proposals until the relevant direction is settled. They are not promises
of completion dates.

## Baseline and authority

- Feedback supplied on 17 September 2026 from one participant's playtest, as typed
  notes. No audio/video recording was attached or reviewed. Do not infer timing
  measurements or exact quotations beyond those notes.
- Inspected local source: `c42b500be64f66fd6ca99bae4e7bbeedb7f162a7`, branch `main`,
  clean working tree before these documentation additions. The
  public site was played on an **M1 MacBook Air using Chrome and built-in speakers**. Browser version,
  deployed revision, viewport and cache state remain unknown. Local captures have
  not yet been matched to that deployed revision. The user also reports random
  freezes on an M4 development Mac. Browser version is useful capture metadata,
  not a prerequisite or the leading explanation for this investigation.
- Current source and historical README prose disagree in places. Use the current
  runtime and dated evidence for this baseline. For example, the current normal
  entry automatically opens the ending after its arrival sequence; older text
  describes an explicit ending button. Neither is a new decision in this roadmap.
- The rebuild order records a 16 September merge authorization. Older feature
  branch restrictions describe that rebuild. This documentation pass changes no
  scenes. Before implementation, resolve current branch guidance against the
  completed merge; do not blindly revive a stale feature branch or deploy main.
- Follow the Light AA v003 remains the selected style. “AI quality” feedback does
  not by itself request a new style or authorize replacing all assets.
- The user's new loader direction authorizes reworking Shepherd Adventure's
  loading presentation to match the narrative. This supersedes treating the
  existing option-2 artwork as fixed. Preserve the useful root loader guarantees:
  immediate initial HTML, independence from heavy game imports, truthful status,
  retry, reduced motion, pause and stopping hidden animation. Record the scoped
  prototype exception when implementing; do not alter every prototype's loader.
- Participant identity and relationship are intentionally omitted from reusable
  repository records. Source and evidence must remain suitable for public sharing.

## Feedback register

Reported = participant experience, not independently reproduced. Confirmed =
current source or browser evidence establishes the described behavior. Hypothesis
= possible explanation requiring a test. This register preserves the original
concerns; accepted bounded fixes and broader open work are tracked separately
below. D023–D027 close only their recorded copy/UI/reference scope.

| ID | Feedback, preserved in substance | Current evidence and uncertainty | Work item |
| --- | --- | --- | --- |
| F01 | Music stops abruptly when leaving the diorama | Peaceful music reportedly stops instantly around a louder cue; the running intro then has no sound. The user clarified that this is the intro-diorama → 3D handoff and should wait for a loading/resource-lifecycle rethink. Do not assume an audio-only fix. | I08 (deferred by D032) |
| F02 | Gameplay lacks ambient sound | User wants an audible world throughout the playthrough: soft night ambience, footsteps while walking/running, gentle decision cues, and contextual animal/occupied-house sounds. Nearby sources should become louder smoothly. The accepted slice supplies crossfaded recorded crickets, occasional breeze, sandy steps, tactile cues, ignition effects, five sheep bleats, one jackal and one wolf event, plus quiet distance-sensitive house voices. User approved the final mix in D040. [Evidence](evidence/2026-09-18-gameplay-audio/README.md). | I01 |
| F03 | Too much text; use blurbs | Clarified: player thoughts and dialogue only. Comic-book-like blurbs are a proposed presentation. Opening/ending scripture was described as perfect and must be preserved. | T01 / I02 |
| F04 | Bottom text placement draws focus from the experience | Clarified: scripture should focus on text; thoughts/dialogue should be brief and situated. E03 is the primary redesign evidence; preserve scripture treatment. | I02 |
| F05 | House slides feel mistimed; abrupt door close then “thank you” | House 8 is the reported example. The baseline review did not reproduce close-before-thanks after D026/D027, but the return still cut directly to the closed 3D doorway. The first implementation now fades the card and starts the stall reveal from Thank you; the user playtested and accepted this bounded handoff. [Evidence and implementation note](evidence/2026-09-17-house-handoffs/README.md). | T03 / I03 |
| F06 | Player disappears and the house shrinks during the conversation handoff | Baseline was visually verified in Houses 3, 8 and 9. The user accepted the first implementation's enlarged doorway crop for this slice; the card still covers the avatar, so composited shepherd-back versus deliberate first person remains an optional deeper follow-up. [Baseline and implementation note](evidence/2026-09-17-house-handoffs/README.md). | I03 |
| F07 | House 1 sound did not play | Reported. The scene now retries voice unlock after an initially muted start, but the refusal asset and its level still need a listened check. Clarified: Chrome; knock was clear, only the refusal voice was missing. | I01 |
| F08 | Camera freezes at random points, then recovers | Reported on M1 Air and M4 Mac. Investigate engine/resource management and camera logic with traces before attributing it to browsers. Repeatability still unmeasured. | I04 |
| F09 | Loaders break the narrative visually and halt the experience with abrupt swaps | Plain/simple 2D loader art feels like another children's game; instant entry and exit amplify the break. Loading strategy and resource unloading need their own investigation before visual or audio continuity work resumes. | I08 (deferred by D032) / I04 |
| F10 | Diorama slide/text timing makes it hard to attend to both | Clarified: scripture remains text-focused and player-paced; houses need image/text meaning aligned before the player finishes reading. Do not generalize the house complaint into scripture redesign. | I02 |
| F11 | Want to go back to previous slides/text and forward | Confirmed direction: add previous/next to scripture; no backward navigation in houses, whose exchanges should be simple enough not to need it. | I02 |
| F12 | Match in-game effect volumes | Button, gait, knock/gate and ambient levels were revised through user listening and accepted in D040. Separate House 1 refusal reliability (F07) and broader device coverage remain open. | T04 / I01 |
| F13 | Arrow buttons could replace “next” in house scenes | Forward arrows remain a candidate for neutral house continuation. No house back control. Preserve semantic actions and solve beat timing first. | T02 / I02 |
| F14 | One shepherd is far ahead of the group; make grouping work better | Clarified: narrative continuity, not spacing. All three begin near each other, yet companions disappear through lantern preparation and the village search, then arrive only at House 9. Proposed visible search starts at House 2. | T05 / I05 |
| F15 | Overall style feels somewhat like “AI quality” | Clarified: diorama art is pretty but typically AI-looking; 3D models look low quality; occasional clunky movement. Movement examples now tracked separately in F17/F18. | I06 |
| F17 | Clunky movement and camera: looking around the well, tight camera turns | User examples; not recorded/reproduced yet. Separate authored motion from actual rendering freezes. | I07 |
| F18 | Opening the gate sends the player flying backward instead of a small step | User example; opening-gate scene likely point 08, exact beat still to confirm. Source has authored positional offsets; root cause unproven. | I07 |
| F16 | Show exact verse addresses in the opening/ending | Added in clarification; preserve scripture wording and show cue-specific references. | T06 |
| F19 | Android Chrome shows HTML controls over a white game area after the diorama | Reported 23 September 2026 with one screenshot. Phone/GPU, OS/browser versions and CSS viewport are unknown. The small broken-content icon does not establish a renderer crash. Original image is excluded from public source. [Investigation](../../../../docs/reports/shepherd-adventure-mobile-rendering.md). | I04 / R01 / D044 |

The following are **product requirements added during planning**, rather than
observations from the initial playtest. They use separate IDs to preserve that distinction.

| ID | Added requirement | Consequence | Work item |
| --- | --- | --- | --- |
| R01 | Prioritize lower-powered devices for broad audiences, including lower-income communities | Set a modest device/network/memory baseline and optimize there first. M1/M4 are diagnostic devices, not the performance floor. | I04; applies to all initiatives |
| R02 | Next milestone: multilingual content and voices, selectable on the starting screen | Externalized text, language/voice assets, locale-aware layout and narration; use existing AI voice mechanisms after content/quality review. | I09 / M5 |

## Clarification queue

Ask in short rounds using actual scenes. Record answers in the decision log; do not
silently turn unanswered questions or offered options into preferences.

### Round 1 — partly answered

- **Q01 — Reproduction:** Which URL/build, device, browser and speakers/headphones?
  Did freezing affect the whole scene/UI or only the camera? During travel or
  entering scenes? Was the tab continuously focused? Was a second run better?
  **Answered in part:** public site, M1 MacBook Air, built-in speakers; freezes
  around camera movement/house approach turns, recovering before the turn. Chrome
  confirmed. **Updated:** also observed on an M4 Mac; investigate implementation
  and performance first. Browser versions are not a blocking question. Capture
  revision and reproducible routes during investigation.
- **Q02 — Text boundaries:** Does “blurbs” apply to house/gameplay text, scripture,
  or both? **Answered:** opening/ending scripture was perfect; exact verse addresses
  were requested. Excess text means player thoughts/dialogue. Comic-book-like
  blurbs are a candidate, not yet an accepted layout. Preserve scripture wording.
- **Q03 — Quality:** Which one or two moments most felt artificial: images versus
  3D, faces, motion, writing, sound, transitions? What would “good” look/feel like
  in those moments? **Answered:** pretty but typically AI-looking diorama art,
  low-quality-looking 3D models, occasional clunky character motion. Examples:
  looking around the well, tight camera turns, and flying backward when opening
  the gate instead of a small step. Desired art quality/reference remains open.

### Round 2 — partly answered

- **Q04 — House continuity:** Keep illustrations with a deliberate camera handoff,
  keep the shepherd visible within illustrations, or explore live 3D dialogue?
  **Answered:** keep illustrations; their house appears too small and changes
  perspective, while the shepherd disappears. Compare a tighter matching crop
  with a retained shepherd-back overlay against a first-person transition.
  These alternatives need an in-context experiment, not another abstract choice.
- **Q05 — Shepherd grouping:** Opening run, House 9 arrival, run to the Nativity,
  or final standing formation? Should they travel as one group, or can companions
  lead and wait? **Answered:** the companions inexplicably fail to catch up while
  the player prepares the lamp and searches the village. Proposed alternative:
  companions visibly enter and search an unused entrance-right house. Current
  layout confirms **House 2** at X=11, Z=19; see E05. Background searching with later
  glimpses is selected in D012; this is a narrative continuity initiative.
- **Q06 — Reading control:** Player-paced beats with previous/next, automatic
  pacing with pause/replay, or different rules for scripture and houses? Should
  back/forward work only while a scene remains open, or also after leaving?
  **Answered:** scripture is text-focused with previous/next; houses are simple
  and forward-only. Their key problem is an immediate image change whose meaning
  only becomes clear after reading the new text. This supersedes the proposal to
  add back/forward to house dialogue.

### Follow-up round — partly asked; remaining details queued

- **Q07 — Door timing:** Identify the house and click sequence. Did the thank-you
  appear as a button, spoken/text response, or after returning to 3D? Should the
  sequence be advice → thanks while door open → farewell/close → return?
  **Resolved:** House 8 is the example. Audit all house interactions, not only this
  scene. Diagnose reading/image sequencing even where button order is correct.
- **Q08 — Audio:** Did House 1 lose knocks, voice, or both? Was opening music audible
  and sound enabled? Was any volume changed mid-play? Which effect was too loud
  or quiet? **Partly answered:** Chrome; clear knocks, missing resident voice.
  **Updated by D032:** gameplay ambience/effects are the next audio design pass.
  The intro-diorama → 3D handoff and loading-interval continuity are deferred
  until the resource-lifecycle design is rethought.
- **Q09 — Loading:** Was there an actual loader, blank illustration, model pop-in,
  or simply a different-looking picture? Would more preparation during the intro
  be acceptable if it reduced later interruptions? Which transition is worst?
  **Resolved:** the plain 2D loader's style and immediate swap in/out are the
  reported issue. Investigate initial-only loading versus staged preparation;
  do not assume all assets should become resident at startup.
- **Q11 — Companion search staging (asked):** House 2 confirmed. Background
  search with later glimpses, one split-up moment, or an explicit group decision?
  Should it add any player clicks? **Answered:** background search with later
  glimpses. No extra required player clicks.
- **Q12 — Different paging rules (asked):** Proposed scripture previous/next plus
  exact references; houses use brief bubbles, page arrows and named story actions.
  **Resolved:** scripture previous/next; houses forward-only, brief, and semantically
  synchronized with images. The proposed house back/forward controls were rejected.
- **Q13 — Which open-door house (asked):** House 3, resident giving gate directions,
  or House 8, old man suggesting the empty stall? **Resolved: House 8.**
- **Q14 — Gameplay sound (asked):** quiet night/village ambience and effects, or
  ambience plus gentle exploration music? **Direction resolved by D032:** create an
  audible gameplay world with a restrained night bed, movement and decision cues,
  contextual animal/occupied-house sounds and smooth distance attenuation. A
  continuous exploration score is optional; the diorama handoff is deferred.
- **Q10 — Product priorities:** Intended audience, primary device and typical
  session length? Which two problems most deserve the next focused pass? What
  currently works well enough to preserve? Any named reference and the specific
  quality to borrow? **Audience/device priority resolved:** wide audiences and
  lower-powered devices first. Duration and specific art references can be refined
  within their own work items; they do not block starting the feedback programme.

### Decisions to make during the work — no immediate questionnaire

- I03: compare two real House 8 handoffs (shepherd overlay versus first person),
  then select one using matched scale/framing and a normal-speed review.
- I04/I08: measure cold startup, memory and interruption costs before choosing
  initial-only versus selective staged loading; pick a representative lower-end
  physical test device as part of the investigation.
- I01: audition the gameplay night-sound palette and mix; loading-interval continuity is deferred with I08.
- M5: choose the first languages, translation/scripture sources, voice tools and
  per-character/narrator voices before generating the first localized content.

## Simple tweaks

A tweak is a localized adjustment to an existing, understood behavior, with no new
system, asset pipeline or unsettled experience contract. These are **candidates**;
promote one into its parent initiative if discovery reveals broader work. Size S
means one focused change/review cycle, not an elapsed-time estimate.

| ID | Proposed change and boundary | Dependencies | Acceptance and verification | State |
| --- | --- | --- | --- | --- |
| T01 | Trim player thoughts/dialogue and repeated non-scriptural instructions; one idea per blurb. Inventory before/after copy and preserve next-action meaning. No wholesale story rewrite. | Q02 scope settled; I02's chosen presentation | Review copy in its actual scene, at desktop and narrow sizes. Player can state the lead/action without rereading; no character gains unsupported knowledge. | Accepted copy/UI scope (D023–D027); broader presentation and handoff work remains open · S |
| T02 | Use accessible arrow controls for existing page advancement where approved. Keep meaningful labels for actions such as Thank you/Leave. House back controls are explicitly excluded; scripture backward state belongs to I02. | D011; chosen forward cue | Keyboard and touch navigation, visible focus, accessible names, disabled/end states; minimum proposed 44 px touch target; no accidental exit. | Awaiting direction · S |
| T03 | Correct a localized House 8 beat after reviewing its image/text timing. All-house coherence and handoff changes remain I03. | D014; I03 | Player understands the visible action without retrospective explanation; rapid input, pause and return work. Verify the actual mismatch rather than assuming a button reorder fixes it. | Two-page advice and automatic stall reveal implemented and accepted in the user's playtest. Continuous-motion review still needed · S |
| T04 | Adjust an isolated effect's gain after comparing it with reference voice/music. Avoid an unmeasured global volume change. | Q08; I01 mix baseline | Same device/output/settings before/after; voice intelligible, no startling peak, muted play still works. Record the chosen gains and listening verdict. | Needs audio evidence · S |
| T05 | Initial spacing-tweak hypothesis withdrawn: clarification identifies missing companion search continuity. | D009; I05 | Do not implement a gap adjustment as the answer to F14. Retain this ID to explain the reclassification. | Superseded by I05 |
| T06 | Restore exact verse address on each opening/ending cue. Source manifests already carry references; inspect presentation code that blanks/hides them. Preserve text, sequence and art. | D006; retain authored verse ranges | Every cue displays its exact manifest reference, including verse ranges; wording unchanged; desktop/narrow text stays legible. | Accepted (D023) · S |

## Standalone initiatives

Each initiative owns its parent outcomes. A completed tweak only closes its own
acceptance criteria; it does not automatically close the parent initiative.

### I01 — Gameplay ambience, effects and mix

**Priority:** high. **Size:** M. **Status:** gameplay ambience/effects slice implemented and accepted by user listening on 18 September 2026 (D040); initiative remains partial for F07 and broader device evidence.
**Covers:** F02, F07 and F12. F01 and loading-related F09 remain deferred under I08.

Accepted behavior:

- Shared gameplay audio owner and sound preference, with pause/mute/restart behavior.
- Soft continuous recorded crickets with two-second loop crossfades, reduced near stationary lights; occasional breeze, no continuous wind bed.
- Sandy walking/running steps, with three staggered lanes when all shepherds run; restrained tactile buttons and workshop/gate ignition cues.
- Five distant sheep bleats, one short jackal event and one quieter wolf event per full route; occasional frogs near the well.
- Quiet male / single female / male murmurs at Houses 3 / 8 / 9, smooth distance falloff, silenced while the doorway is open and restored afterward. Rejected crowd recordings removed.
- Knock and gate gains tuned through listening. Sources and adaptations are listed in the runtime audio credits, including the generated wolf effect.

Evidence and iteration history: [gameplay audio review](evidence/2026-09-18-gameplay-audio/README.md), D032–D040 below. Browser decoding/interaction, scheduling, waveform seam and publication checks passed. User acceptance is a listening verdict; output hardware/volume settings and a captured mix were not supplied, so this is not a cross-device certification.

Remaining follow-ups: separately establish House 1 refusal-voice reliability (F07), and gather ordinary laptop/phone listening coverage where needed. No further audio work is required for this accepted branch slice. Intro-diorama continuity, loader strategy and resource unloading remain explicitly deferred pending I08. No general dialogue ducking or multilingual voice implementation is claimed.

### I02 — Scripture navigation and brief gameplay dialogue

**Proposed priority:** high. **Size:** M. **Status:** core contract settled (D006/D011); exemplar layout/timing to review.
**Covers:** F03, F04, F10, F11, F13; T01/T02 may deliver small parts. F16 is T06.
**Settled boundary:** opening/ending scripture content is good; preserve its wording
and add exact verse addresses. Rework player thoughts/dialogue presentation.

1. Treat scripture and interactive scenes as different reading experiences. Keep
   the opening/ending text prominent and unchanged; show exact verse addresses
   (T06), and add previous/next controls without losing the associated illustration.
   Scope is traversal within the active scripture sequence; a cross-scene history
   feature has not been requested.
2. Inventory player thoughts and house/companion dialogue. Shorten unnecessary
   explanation; one idea per beat. Mock up comic-style thought/speech blurbs in
   the action area using House 8, preserving speaker identity and legibility.
   Compare against a compact nearby caption; do not move scripture into bubbles.
3. Keep houses forward-only. Do not add a back button as compensation for confusing
   text or imagery. Distinguish a neutral forward arrow from explicit actions such
   as asking, thanking or leaving; arrow-only house controls remain a proposal.
4. Author each house beat as image state + speaker + short line + next action.
   A visible action should not look inexplicable until the player finishes reading
   its explanation. Coordinate transition and reading behavior with I03's exemplar
   below, instead of applying a global fade or shorter copy alone.
5. Implement reversible scripture presentation without repeating world actions,
   unexpectedly restarting music or ending the story from a previous control.
   Going back from the last verse must keep the story active; exit stays explicit.
   House forward progression must remain exactly-once under rapid input.
6. Review one scripture sequence and one house, then apply their distinct accepted
   patterns across the other scenes. Validate keyboard, touch, pause and narrow
   layouts; preserve complete text and meaningful speaker cues.

**Implementation surfaces:** `src/journey-story.mjs`, scripture manifests,
`src/house-sighting-scene.mjs`, house state modules and `src/rehearsal-route.mjs`,
`story.css`, `house-sighting.css`, `player.css`, HTML controls and vendor player
seek behavior. Do not add unnecessary house history/state reversal.

**Done when:** scripture is unchanged, correctly referenced and reviewable backward
and forward with matching imagery; house thoughts/dialogue are brief, forward-only,
and understandable with the currently visible image; no line overflows/occludes
its subject at target sizes; controls work by keyboard and touch; world side
effects occur once. Human review checks comprehension and image/text timing, not
merely whether text fits. The bottom position of scripture is not itself a defect.

### I03 — House conversations as part of the same journey

**Proposed priority:** high. **Size:** M; keep existing illustrated approach.
**Status:** all five houses reviewed in the current normal player; the first doorway crop/scale and farewell experiment for Houses 3, 8 and 9 was accepted in the user's playtest. The composited shepherd and deliberate first-person alternatives directed in D014 have not been built or selected. Live sound and continuous-motion quality remain unassessed.
**Covers:** F05, F06, visual portions of F09.

1. Inventory **Houses 1, 3, 5, 8 and 9** from approach through departure. For each,
   record what the player expects, sees, reads, hears and does. House 8 is the first
   exemplar, not the only scene in scope. Preserve the distinct refusal, helpful
   sighting, unanswered door, advice and shelter-direction story functions.
2. Keep illustrations (D008). Compare two bounded House 8 prototypes using the
   same original camera and beat sequence:
   - **A — Third-person continuity:** crop/zoom to match the 3D doorway's screen
     size and vanishing lines; composite a captured shepherd-back/lantern layer
     at matching scale, lighting and occlusion. Check alpha edges, duplicated
     shadows/lighting, alignment through transitions and mobile composition.
   - **B — First-person continuity:** visibly move from behind the shepherd to
     his viewpoint before handing off to tightly matched art; return coherently
     afterward. Removing the avatar must read as viewpoint change, not disappearance.
   Both should avoid showing a miniature duplicate house floating over a larger
   3D house. Review panel size, crop and background treatment together. Do not
   generate replacement art until framing tests show the existing image cannot work.
3. Preserve doorway geometry, direction, scale, light, resident identity, carried
   lantern and player location through the chosen handoff. Author a return shot
   that explains where the player stands and what happens next.
4. Separate visual transition time from reading time. Prepare imagery before the
   conversation needs it in coordination with I04. Keep the world or last valid
   frame visible during an actual wait; use the required loader/status if blocked.
5. Agree farewell sequencing, then apply T03 where sufficient. Review quiet beats
   and rapid input; disable or serialize transitions without dropping content.
   Use the timing storyboard below before changing transition durations.
6. Apply the accepted illustrated handoff to Houses 3 and 9, and complete a flow
   audit/fix pass for House 1's refusal and House 5's unanswered visit. Those do
   not need an illustrated resident, but their pacing, thoughts, gesture, sound
   and departure must tell a coherent story too. Record a per-house verdict.

**Implementation surfaces:** `src/house-sighting-scene.mjs`, house state machines,
`src/village-game.mjs`, camera/presenter CSS, `assets/house-3/`, `house-8/`,
`house-9/`, relevant scene briefs. Use the create-asset workflow only if new 3D
assets are chosen; do not generate replacements before resolving staging.

**Done when:** a player can identify the same house, shepherd position and onward
lead across the handoff; thanks/farewell order matches the chosen emotional beat;
illustrated house scale and perspective feel continuous; no unexplained avatar
disappearance; pause, retry and return retain state. All five houses have a recorded
flow review. Attach matched stills for framing and a normal-speed recording/playtest
for timing. Existing scene acceptance reopens only where this change affects it.

#### Proposed house beat contract — House 8 first, then all interactions

The user’s concern is semantic timing: the new picture arrives instantly, but its
meaning becomes clear only after reading. A dissolve alone will not solve that.
This is a proposed exemplar for review, not an approved script or timing value.

| Beat | Image held while reading | Short text/action relationship | Progression |
| --- | --- | --- | --- |
| Someone approaches | Closed doorway in matching camera | Brief anticipation such as footsteps; no claim that an unseen person already greeted the player | Only introduce the open-door image once its reveal is understandable |
| Question and response | Open doorway, resident present | Short dialogue tied to the visible speaker; do not change action/state mid-line | Player moves forward when ready; reuse image when no action changes |
| Thanks | Resident still present with door open | Thank-you is the player's action/line before the farewell consequence | On that action, stage farewell, then close; do not show the consequence before the user knows why |
| Return | Settled closed door or matching 3D return | If a caption is needed, describe the current settled state; avoid retrospective text that explains a surprising cut | Explicit onward action; no required rereading/backtracking |

During a transition, define when old text leaves and new text appears so neither
is paired with a contradictory image. Try a short anticipation beat versus simply
rewriting a line to match the image's current state. Test at natural reading speed
and with immediate clicks. Do not add arbitrary forced waits to every line. Keep
House 1's refusal and House 5's silence separate from this illustrated-house rule.

### I04 — Engine/camera investigation and lower-end performance

**Proposed priority:** high diagnostic work; fixes follow measured cause.
**Size:** unknown until trace. **Status:** independent investigation authorized by direction;
initial memory baseline captured (D041) and optimization proof of concept implemented
(D042, accepted in D043). D044 adds a bounded Android-launch rendering budget and mobile PR coverage; technical validation passed (9 mobile CI cases) and physical-device acceptance remains open. No in-route freeze root cause is established.
[Full-route evidence](evidence/2026-09-18-memory/README.md).
**Covers:** F08, F19, R01 and resource costs underlying F09.
**Reproduction leads:** both M1 Air and M4 Mac show freezes. Start with engine/render
resource handling and camera state/turn logic. Browser versions are incidental
metadata unless a trace later implicates them. **Optimization target:** lower-powered
devices first; choose a representative modest phone/tablet or other relevant device
for physical validation. Stronger machines should run the same coherent experience
comfortably; do not spend the gains on an unnecessary ultra-quality tier.

1. Reproduce on available M1/M4 hardware without waiting for exact browser versions.
   Record cold and warm full-entry runs and
   specific walking legs; label focus changes. Measure raw frame intervals, long
   tasks, resource requests/decode, first-use GPU work and memory where available.
   Determine whether the world/UI freezes too or only the camera stops following.
   Pair world/actor/camera transforms and phase changes with frame timing: a stalled
   camera target with responsive rendering calls for a different fix from a blocked
   main thread or GPU. Capture a short trace around a visible freeze before optimizing.
2. Use existing per-leg samples in `src/village-game.mjs` for leads, not proof.
   They exclude pauses/hidden time and cover walking only. Add targeted timing for
   opening, stationary scenes, conversation preparation and ending; retain raw
   intervals even though simulation `dt` is capped at 0.1 s.
3. Correlate each visible interruption with a trace. Inspect draw calls, geometry,
   texture residency, camera computation and decode/upload only where implicated.
   Recent detailed nativity assets are a budget concern, not an established cause.
4. Define a modest device budget for peak memory, texture resolution/residency,
   visible geometry/draw calls, startup time, data transfer and frame pacing. Check
   fixed-light/shadow costs and native pixel ratio where traces justify it. Network
   constraints should be measured alongside compute/memory for the intended audience.
   Supply the measurements needed for I08's loading strategy; initial-only versus
   selective preparation must be evaluated against the same device budget.
5. Apply measured fixes, such as image preparation/compression, shader warmup,
   model/texture budgets, selective LOD or camera-cost reduction. Preserve source
   assets, appearance, independent copies and accurate provenance.
6. Verify cold/warm behavior, throttled/failed resources, retry, background/resume,
   physical lower-end hardware and hosted `/story-lab/` paths. Compare M1/M4 traces
   as regression checks, not evidence that the lower-end target is satisfied.

**Done when:** the reported freeze has a reproduction and fix, or is explicitly
left unreproduced with bounded evidence; comparable traces show improvement at
the same settings; normal route has no unexplained multi-frame stalls or blank
scene changes; unavoidable waits have truthful status and retry without losing
progress. Proposed measurement goals for discussion: a stable 30 fps experience on
the selected lower-end baseline and no unexplained stalls over 100 ms in a repeated
route. Confirm budgets after baseline; do not report device-wide success from a
desktop screenshot or relaxed thresholds chosen after implementation.

**Implementation surfaces:** `src/boot.mjs`, `src/village-game.mjs`,
`src/house-sighting-scene.mjs`, `src/story-media.mjs`, renderer/world/camera modules,
runtime models/images and staged-loading checks. I08 owns the player-facing wait
and transition design; I04 owns the diagnosis and measured resource/frame budgets.

### I05 — Companion search continuity from entry to reunion

**Proposed priority:** high for narrative coherence. **Size:** M.
**Status:** problem and candidate house confirmed; background search with later glimpses agreed (D012).
**Covers:** F14. **Supersedes:** T05's spacing-only hypothesis (D009).

The complaint is not the initial gap. All three shepherds are close enough at the
opening that the others should catch up while the player assembles the lantern,
visits houses and searches the whole village. Their much later arrival currently
makes them seem lost. The proposed direction is visible parallel searching.

**Location confirmed:** House 2, world X=11/Z=19, is the first house to the right
when entering toward −Z. It is not one of the active player conversation stops.
See [entrance map E05](evidence/2026-09-17/05-entrance-map.jpg) and the canonical
[rehearsal layout](../../map/rehearsal-layout.json). House **2** is distinct from
route point **02**, which is House 1. Its existing inward-facing door must be
approached on the actual doorway side, not at its centre or through its annex.

1. Storyboard the opening→lamp handoff: main shepherd heads to the workbench;
   companions continue into the village and visibly branch right to House 2.
   Decide whether a glance/gesture is enough or a short split-up line is needed.
   Keep dialogue within established character knowledge; a new searching exchange
   is invented connective storytelling, not scriptural detail.
2. Stage a convincing knock/search at House 2 using existing companions. It is
   background activity with no extra required clicks (D012). The player should
   notice it from the lamp approach without mandatory waiting. Confirm visibility
   on narrow screens.
3. Include a small number of later glimpses of searching (D012). Choose visible
   route intersections and inspect actual camera sightlines before authoring paths.
   Avoid companions visibly looping at one doorway for the entire playthrough or
   teleporting between houses when the player looks back. Later search locations
   remain to be designed; House 2 alone is not the complete initiative.
4. Define durable companion phases (proposed): enter → branch → knock/search →
   onward search → approach opened gate → reunion → follow to shelter. Use gameplay
   milestones plus local animation time so fast/slow readers, long lamp assembly,
   pause, restart and repeated navigation all remain plausible. Actor ownership
   must transfer from the opening to search to reunion without vanishing/resetting.
5. Reconcile their House 9 approach with the route they actually searched. Current
   reunion paths enter from the House 1/3 lane; a House 2 start cannot silently
   imply that same history. Plan a traversable connection, preserve the gate's
   locked/open state, and review whether “We saw your light!” still fits.
6. Verify short and long player dwell at lamp and houses; ensure no duplicate
   companions, obstructed paths or missing knock gesture. Preserve separate
   companion identities and existing assets unless a specific animation is needed.
   Update route/map evidence if paths or placements change.

**Implementation surfaces:** `src/journey-model.mjs` opening actors,
`src/village-game.mjs` opening→play transition, `src/companion-reunion-scene.mjs`
actor visibility/ownership, `src/companion-reunion.mjs` paths/dialogue,
route state/pause/restart, existing House 2 transform and collision footprint.
Current `poseOpening()` shows actors during the intro, while reunion actors begin
hidden in a pending phase; this handoff is a source-inspection lead.

**Done when:** a first-time player understands that the companions are also
searching; their absence during conversations and later return have a credible
spatial/time explanation; House 2 activity is visible without derailing lamp
preparation; both fast and slow play retain continuity; existing reunion and final
arrival work. Attach entry/search/reunion motion evidence and obtain a human
continuity verdict. Mere offset changes cannot close this item.

### I06 — Visual and editorial consistency

**Proposed priority:** medium; concrete defects may move earlier.
**Size:** M audit, later replacements individually sized. **Status:** symptoms
identified (D007); exact visual references and desired quality still needed.
**Covers:** F15 and remaining art mismatch from F09.

1. Use the clarified split: generated-looking diorama art and low-quality-looking
   3D models. Movement complaints are owned by I07. Ask which model/image most
   needs attention and what quality should replace it. Build a small comparison
   board spanning opening illustration, gameplay, one house and ending. Label
   which judgments are user feedback and which are the reviewer's hypotheses.
2. Audit against Follow the Light AA v003: natural proportions, tactile materials,
   readable silhouettes, cool night/warm local light. Also examine identity,
   architecture, painted versus 3D detail, animation, UI materials and wording.
3. Select the two most disruptive mismatches, with explicit keep/change references.
   First assess lighting, framing and material adjustments using existing assets.
   Separate generated-image artifacts from low-resolution meshes, awkward motion
   or uneven staging; each needs a different intervention.
4. If replacement assets are necessary, create individual briefs through the
   project asset workflow and I04's budgets. Keep useful source/provenance and copy
   assets into the prototype; avoid a wholesale art regeneration initiative.
5. Review a matched in-game result before repeating the approach elsewhere. Record
   unresolved tradeoffs rather than treating “less AI” as a measurable technical score.

**Done when:** the named mismatches are visibly resolved in matched context and the
user accepts the selected examples as coherent. Automated geometry checks cannot
approve style, historical plausibility or emotional quality.

### I07 — Natural local movement and camera choreography

**Proposed priority:** high for the reported gate/well examples. **Size:** M until
reproduction; isolated parameter fixes may be S. **Status:** discovery (D007).
**Covers:** F17/F18. Coordinate with I04, but do not conflate ugly motion with
rendering stalls; I05 owns group relationships, I07 owns local bodily/camera motion.

1. Reproduce the well look-around, tight house-approach turn, and gate-opening step.
   Capture real-time motion, then inspect keyframes with avatar feet, world position,
   animation, camera eye and camera target at matching timestamps.
2. Determine whether apparent flying comes from root translation, a discontinuous
   phase/pose handoff, missing/incorrect gait, a camera jump, or several together.
   `src/empty-stall.mjs` authors an opening offset that returns to the route anchor;
   that is a lead to inspect, not a proven explanation of the reported effect.
3. Agree short, grounded action beats: step to operate the gate, clear its swing
   with a small believable step, settle, then look onward. Keep foot travel and
   translation consistent; avoid sliding or instantly resetting position. If a
   backward-step animation is missing, size authored animation work explicitly.
4. Tune look-around and tight turns using a stable focal target, sufficient turning
   radius and controlled angular acceleration. Preserve route clearance and reveal
   intent. Evaluate camera motion separately from character turning before changing
   both; do not use heavy smoothing to hide a frame stall.
5. Review these three scenes at normal speed, reduced motion, pause/resume and
   neighboring route transitions, then identify any shared fix worth applying.

**Implementation surfaces:** `src/empty-stall.mjs`, `src/empty-stall-scene.mjs`,
`src/gate-scene.mjs`, `src/village-game.mjs`, `src/journey-camera.mjs`,
route/character animation modules. Identify the exact well scene before editing.

**Done when:** the gate clearance reads as a small grounded step rather than flight;
feet and translation agree; looking around the well and house turns feel deliberate
and comfortable; no new clipping or camera snap; a human reviews full-speed motion.
Attach keyframes for diagnosis and a motion recording for acceptance. A screenshot
alone cannot close this initiative.

### I08 — Story-matched loading and continuous transitions

**Proposed priority:** high. **Size:** M, with strategy dependent on I04 measurements.
**Status:** initial full-route memory baseline complete (D041); loading architecture
comparison and transition implementation remain open. See the
[memory report and recommended sequence](evidence/2026-09-18-memory/README.md).
**Covers:** F09 and the visual/audio boundary in F01. No loader removal is assumed.

The existing plain 2D graphics feel detached from Bethlehem, and immediate swaps
in and out stop the narrative. Loading strategy and its visible treatment are
separate decisions: even a necessary wait should retain the game's atmosphere.

D032 adds an explicit revisit trigger: return here after the loading/resource
ownership investigation has mapped what is fetched, retained and unloaded at the
intro-diorama → 3D boundary. Do not use I01 gameplay ambience work to mask or
explain the current abrupt stop.

1. Map each current foreground wait: initial story, story→3D, house art and ending.
   Record what is loading, whether it blocks input, time to readiness, retained
   memory, and what the player sees/hears before, during and after it. Identify
   redundant waits separately from unavoidable cold/failed requests.
2. Compare the following approaches using I04's lower-end device budgets. Prefer
   fewer interruptions when feasible, but never claim that more eager loading
   improves performance without checking startup, transfer, decode and peak memory.

   | Option | Player experience | Evidence required |
   | --- | --- | --- |
   | One initial foreground load | Play runs without repeated full-screen loading | Acceptable cold-start/data cost and memory throughout the route; what happens if a resource still fails |
   | Initial load + selective preparation | Upcoming scene media prepare during reading/travel, with bounded residency | Preparation does not stall frames; typical entry is instant; slow/failure cases remain coherent |
   | Selective preparation + contextual wait | Retain current scene or a lightweight matching still if a dependency is late | No heavy background rendering merely to decorate a loader; status/retry visible; audio/visual continuity preserved |

3. Create a lightweight loading presentation using matching night lighting,
   tactile materials and Bethlehem/lantern imagery. Start with existing approved
   imagery where possible. Use motion restrained enough to fit the narrative;
   do not make a high-cost 3D loading scene that waits on the assets it must mask.
   User direction permits changing the option-2 artwork for this prototype.
4. Define one transition lifecycle with I01: retain last meaningful frame → enter
   preparation treatment if needed → ready → blend into next scene. Audio continues
   under a separate owner. Keep the previous frame while incoming media becomes
   usable; avoid shrinking a house behind a new panel or flashing a blank screen.
5. Handle immediate readiness without a loader flash. Handle a long wait with
   truthful status and useful retry. Never invent a percentage or hold the loader
   for a minimum duration. Decorative motion/fades honor reduced motion; audio
   continuity still applies. Pause/background/restart cancel obsolete transitions
   and requests without leaking resources or repeating a scene outcome.
6. Test story→3D with warm/cold/slow/failed preparation and the house/ending boundaries
   at normal speed. Check the initial loader is visible before heavy module downloads
   and that copied runtime files remain independently runnable and publishable.

**Implementation surfaces:** `src/boot.mjs`, `src/story-media.mjs`,
`src/journey-story.mjs`, `src/house-sighting-scene.mjs`, initial HTML,
`loading-theatre.css/js`, scene overlays and audio ownership. Preserve the existing
loader's immediate startup, truthful status/retry and accessibility contracts;
implement this as a scoped Shepherd Adventure revision.

**Done when:** chosen loading strategy meets the lower-end budget; loader art feels
part of the same night journey; expected play avoids unnecessary foreground waits;
necessary waits have coherent entry/exit and continuous audio; cold/error/retry paths
remain usable. Attach measured strategy comparison and normal-speed recordings.

### I09 — Multilingual text and generated voices

**Milestone:** M5, **after the initial feedback programme (M0–M4)**.
**Size:** L, delivered as a small language pilot before expansion.
**Status:** milestone requested; languages and voice/content choices to be specified
when this milestone begins. **Covers:** R02. No translation or voice generation is
included in the current planning pass.

1. **Language entry and scope.** Add a language choice on the starting screen before
   the opening story, with recognizable language names and an explicit start action.
   Establish the first language set, default/fallback and whether selection persists.
   Do not assume English-only UI can explain the picker. Plan a safe way to change
   language; if supported mid-session, preserve progress and stop the previous voice.
2. **Content foundation.** Inventory scripture, character dialogue/thoughts, narrative,
   instructions, loading/error/status text, controls, captions and accessibility
   labels. Use stable scene/line IDs and locale catalogs with separate text, speaker,
   reference and audio asset metadata. Future story additions use the same structure.
   Keep scripture references exact and select appropriate reviewed translations;
   do not automatically paraphrase scripture through general machine translation.
3. **Translations and layout.** Start with a complete second-language vertical slice
   spanning entry→opening→one house→ending, then cover the entire route. Review
   meaning, biblical/character knowledge and cultural clarity with competent language
   reviewers. Support text expansion, required fonts/glyphs and directionality for
   the selected languages. Review brief blurbs in each language rather than enforcing
   English character counts. Record translation/attribution requirements per source.
4. **Voice pipeline.** Inspect the existing AI voice mechanisms available to the
   project, choose suitable language/voice coverage and define character/narrator
   identities. Produce reviewed audio assets ahead of delivery, retaining text/locale/
   voice/version mapping and pronunciation notes. Keep provider credentials and paid
   job recovery outside public runtime files. Generate a small pilot before batches;
   a voice existing for a language does not establish natural delivery or accuracy.
5. **Narration behavior.** Add voices to agreed readable story, thought and dialogue
   beats while preserving visible text and sound-off access. Use I01's shared mix,
   duck ambience if helpful and avoid overlapping speakers. Respect differing line
   lengths: player advance/replay/pause must stop or replace the correct voice, not
   skip content because a fixed English duration elapsed. Scripture back/forward
   selects the corresponding narration; house flow remains simple and forward-only.
6. **Resource delivery.** Load the selected language's text/voice assets, not all
   languages upfront. Reuse I08's preparation strategy, bounded cache and recovery
   behavior; account for added data/memory on the lower-end target. Missing voice
   falls back to readable text in the chosen language with an understandable status;
   avoid surprising mixed-language audio. Version text and audio together.
7. **Acceptance and expansion.** Verify complete locale coverage, selection/restart,
   playback/paging, failure/offline-resource behavior and readable layouts. Have a
   competent speaker review each language's text, pronunciation, identity and pacing.
   Accept the first complete language pilot, then add locales incrementally with
   the same checklist and a distinct completion log entry per locale.

**Decisions at M5 kickoff:** first languages; scripture/translation sources and
reviewers; narrator/character voice choices and provider; which reading beats get
voice first; locale persistence/change behavior and acceptable delivery sizes.
These are future milestone inputs, not unresolved questions blocking M0–M4.

**Implementation surfaces:** starting screen/boot, scripture manifests, scene copy
and controls, a locale/content catalog, audio asset manifests, existing voice tools,
I01's shared audio layer and I08's media loading. During feedback work, avoid baking
new copy into artwork or tying animation completion to text length; full localization
architecture belongs to M5.

**Done when:** language can be selected before play; every in-scope player-facing
string and chosen narrated beat uses the selected locale; scripture addresses and
meaning remain correct; reviewed voices play with matching text and coherent timing;
silent/missing-audio paths work; target-device memory/data/frame budgets still hold.

## Milestones and execution order

**Programme 1 — Initial playtest feedback:** M0–M4 are delivery stages within this
programme. **Programme 2 — Multilingual experience:** M5 follows it. Stable milestone
IDs are retained; no earlier milestone is renamed or silently considered complete.

| Milestone | Deliverable | Dependencies / exit |
| --- | --- | --- |
| M0 — Evidence and direction | Feedback register and baseline; House 8, loader/audio direction and audience priority resolved | Core direction recorded. Gather missing motion/audio/trace evidence during the relevant initiative; browser-version collection is not a gate. |
| M1 — Reliability diagnosis and focused repairs | Partial: D043 memory initiative accepted; D044 Android-launch slice technically verified; awaiting physical-device playtest. Independent freeze investigation, physical lower-end evidence, House 1 voice reproduction and I08 loading-strategy comparison remain open. | I01/I04 diagnosis can begin now. Measure before choosing resource fixes or eliminating staged loading. Each repair needs evidence. |
| M2 — House 8 exemplar and scripture controls | T01 copy/UI and T06 references accepted (D023–D027). The first House 8 framing/farewell slice is accepted after playtest (D031); scripture back navigation and deeper viewpoint alternatives remain open. | I02/I03 direction settled for the current slice. A later human review may still choose composited shepherd versus first person if F06 is reopened. |
| M3 — Integrated journey | Audit all five houses; roll accepted handoff to illustrated houses; audio through loading, matching loader art, companion search and grounded motion | I01–I05/I07/I08 integrated. Include fast/slow preparation and normal-speed start→ending playtests. |
| M4 — Quality and feedback-programme acceptance | Selected I06 corrections, physical lower-end playtest, higher-end regression, outstanding issues triaged, public build checks | Human acceptance distinct from technical checks. Initial feedback programme accepted or explicitly deferred items recorded. Deployment still requires separate authorization. |
| **M5 — Multilingual text and voices** | **Starting-screen language picker, localized content, generated narration/dialogue, reviewed language pilot then full-route coverage** | **After M0–M4 feedback programme. I09 depends on stable content, I01 audio and I08 loading. Choose languages/voices at kickoff; verify readable, audible and lower-end-device experience per locale.** |

Within a milestone, select one bounded item for each implementation session. Prefer
early diagnostics for freezes/audio and one representative conversation before
editing every house or commissioning new art. Do not batch every “simple tweak”
while its decisions are unsettled. Work can stop at any accepted checkpoint.

## Validation map

Existing checks are starting points to inspect and update, not a claim that they
pass now. Some older browser checks expect historical placeholder states.

| Area | Relevant existing checks | Required human evidence |
| --- | --- | --- |
| Audio and opening/ending lifecycle | `checks/verify-story-loading.mjs`, `verify-story-sequence.mjs`, `verify-house-scene.mjs`, `verify-house-rejection.mjs` | Audible normal/skip transitions, House 1 on target output, mix comparison |
| House state, navigation and timing | `verify-house-sighting.mjs`, `verify-house-sighting-scene.mjs`, `verify-house-advice.mjs`, `verify-house-owner.mjs`, `verify-house-owner-browser.mjs`, `verify-rehearsal.mjs` | Door sequence, reading flow, no loss of place, desktop/touch |
| Frames/loading | Existing frame samples, `verify-story-loading.mjs`; new trace for actual failure | Same-device cold/warm full route and slow/failure recovery |
| Loader experience | Initial-HTML/status/retry checks plus I08 cold/warm/slow/failed resource scenarios | Matching atmosphere and coherent entry/exit; audio heard throughout legitimate waits |
| Lower-end baseline | I04 frame/resource measurements on selected physical device; M1/M4 regression | Usable full route under modest compute/memory/network limits; higher-end quality not the baseline |
| Group/camera | `verify-companion-reunion.mjs`, `verify-companion-scenes.mjs`, `verify-companion-models.mjs`, `verify-journey-camera.mjs`, `verify-nativity-arrival.mjs` | Identified group beat at normal speed and final composition |
| Local movement/camera | `verify-empty-stall.mjs`, `verify-journey-camera.mjs`, `verify-animation-transitions.mjs`; add a focused regression only after reproduction | Well look-around, tight turns, gate small step at normal speed |
| Release | Portal publication review, build/path/dependency checks | Live portal tile→play→ending after authorized deployment |
| Multilingual M5 | New locale coverage, selected-language loading, picker/restart, narration/paging/fallback checks | Competent-speaker review, text expansion/directionality, pronunciation and full-route timing on target devices |

## Decisions and deviations

Append dated entries. A proposal is not accepted direction; a later decision must
name the prior decision/item it supersedes and explain the impact.

| Date | ID | Record | Authority / impact |
| --- | --- | --- | --- |
| 2026-09-17 | D001 | Capture feedback as a living prototype roadmap; separate tweaks and standalone initiatives; log completion and deviations; document the repeatable exercise. | Explicit user request. |
| 2026-09-17 | D002 | Planning and evidence only in this pass. | Scope interpretation of the request for a detailed implementation plan. No gameplay changes made. |
| 2026-09-17 | D003 | Keep standing Follow the Light AA v003 and existing scripture pending specific changes. | Existing project direction; no new preference inferred from broad feedback. |
| 2026-09-17 | D004 | Q01–Q06 asked; initially unanswered. Q01/Q02 subsequently clarified below. | Keep remaining questions open. Proposed options are not selections. |
| 2026-09-17 | D005 | Public site tested on M1 MacBook Air with built-in speakers; freezes around house-approach turns, location repeatability unknown. | User clarification; prioritize this setup in I04. Chrome subsequently confirmed in D013; version/build still needed. |
| 2026-09-17 | D006 | Opening/ending scripture was perfect; add exact verse addresses. Excess text concerns player thoughts/dialogue; comic-style blurbs suggested. | User direction; supersedes broad text-shortening scope. T06 added; no scripture rewrite. |
| 2026-09-17 | D007 | Quality feedback separates attractive but AI-looking diorama art, poor-looking 3D models and clunky motion. Specific well/tight-turn/gate examples recorded as F17/F18. | User clarification; added I07, kept art and performance causes distinct. |
| 2026-09-17 | D008 | Keep illustrated house conversations; improve the handoff. | User decision; excludes live 3D conversation conversion from I03. |
| 2026-09-17 | D009 | Companions need a credible search during the player’s village journey. Candidate: visibly go to an unused entrance-right house. Layout/browser map confirm House 2 (X=11, Z=19). | User problem/proposal; location verified locally. Replaced spacing-only T05 with I05 continuity work. Background/glimpses subsequently selected in D012; exact routes still to design. |
| 2026-09-17 | D010 | Stories and houses should have different navigation/pacing behavior. | User direction; exact split subsequently resolved in D011, which rejects house back/forward. |
| 2026-09-17 | D011 | Scripture should focus on text with previous/next. Houses should be simple and forward-only; image/text must make sense together without needing to reread. | User direction; supersedes Q12 proposal for house back/forward. I02/I03 updated with semantic timing contract. |
| 2026-09-17 | D012 | Companions search in the background, with later glimpses during the journey. | User selection; no new required player clicks. I05 updated. |
| 2026-09-17 | D013 | Browser was Chrome. House 1 knock was clear; only resident voice missing. Awkward exchange was the second house where someone opens. | User clarification; audio reproduction narrowed. House identity subsequently resolved as House 8 in D014. |
| 2026-09-17 | V001 | Current House 8 shows Thank you before closing, unlike the reported example. | Preserve F05; identify the actual house/build instead of declaring it fixed. |
| 2026-09-17 | D014 | House 8 confirmed as example; review all house interactions. Image shrinks versus the 3D house and shepherd disappears. Compare matching crop/scale plus shepherd-back overlay against first person. | User clarification; resolves Q07/Q13 and refines D008. Button order in V001 does not dismiss the timing complaint. |
| 2026-09-17 | D015 | Plain/simple 2D loader breaks the Bethlehem atmosphere; instant swaps require coherent transitions. Investigate whether one initial loader can replace repeated staged interruptions. | User direction; resolves Q09, adds I08. Authorizes a scoped loader-art revision; does not decide eager loading before measuring lower-end memory/startup costs. |
| 2026-09-17 | D016 | Fade peaceful story music into an audible running/world experience, through loading if present. Add footsteps and night ambience; wind/insects/possible animal sounds are examples. | User direction; resolves Q14 experience requirement. Continuous gameplay score remains optional; audio palette to audition. |
| 2026-09-17 | D017 | Freezes also occur on M4 Mac. Investigate engine/resource and camera behavior as a standalone effort before browser-specific theories. | User direction; supersedes browser-version emphasis in D005/D013. No root cause assumed. |
| 2026-09-17 | D018 | Broad audience with lower-powered devices, including lower-income communities, is the first optimization target. Higher-powered devices need a comfortable experience, not maximal graphics. | User product priority; R01 governs I04 and every new media/visual feature. |
| 2026-09-17 | D019 | Add multilingual support after initial feedback: language picker at start, localized reading content and AI-generated voices using available voice tools. | Explicit user request; R02/I09/M5 added. Languages, reviewed sources and voice choices are kickoff inputs, not assumed selections. |

| 2026-09-17 | D020 | Apply initial T01 review feedback: centered action-only basic prompts, compact forward-only lamp cards, title before first scripture, no book heading, exact verse addresses. Extend only to entry/gate/empty-stall instruction repetition. House interactions and companion dialogue await later feedback. | Explicit user request; new `codex/t01-player-instructions` branch. T01 partial, T06 implemented, both awaiting playtest. I02 presentation partly delivered; scripture back navigation and I03 house work remain open. [Scope and evidence](evidence/2026-09-17-t01/README.md). |

| 2026-09-17 | D021 | Replace head-overlapping bare actions with a padded upper-middle exploration panel. Move all house approach prompts to a shared upper zone; central semantic variants own placement, shared buttons own border/focus treatment. | User playtest correction supersedes D020 placement. [UI contract](GAME-UI.md). House content/sequence remain deferred; new layout awaits playtest. |

| 2026-09-17 | D022 | Remove gameplay header branding, replace Pause text with an accessible hamburger retaining the pause menu, lower shared exploration/house/spoken panels by half their height. | User screenshot feedback; refines D021. Preparation remains centered. Awaiting playtest. |

| 2026-09-17 | D023 | User accepted the addressed instruction/UI changes, including panel/text positioning. Accepted scope: concise basic prompts; forward-only lamp cards and preserved reward; shared panel/button design; quieter hamburger menu; title-first scripture and exact addresses. | Explicit playtest acceptance. T01 remains partial: house dialogue/sequence and companion work not accepted. T06 accepted. M2 remains partial: scripture back navigation and house handoffs remain open. Next review is the complete House 1 encounter, split into intro, response and outro. |

| 2026-09-17 | D024 | House 1: arrival has Knock on door only; remove narration of knocking, waiting and light changes. Keep the resident refusal subtitle visible through the outro, with Let’s try the next house when the timed response completes. | Explicit user direction for H01. Implemented and accepted; existing sound asset/timing retained. Voice reliability repair remains I01, not claimed fixed. Other houses unchanged. |

| 2026-09-17 | D025 | Implement approved House 3 three-page sighting: action-only arrival, silent visual knock/wait, short question/sighting/directions, Thank you then Go to the gate without recap. Add resident-right-pointing frame on directions. | Explicit user approval and image generation request. Implemented and accepted. Houses 8/9 retain four pages; no new voice track. |

| 2026-09-17 | D026 | User accepted House 3 and requested its commit; authorized a full concise-copy pass through gate, House 5/well/pen, House 8, empty stall/lantern/gate, House 9 and reunion. | House 3 committed as `a1dbe4c`. Remaining pass implemented and subsequently accepted in D027; supersedes per-house deferral for copy only. [Full text/action inventory](evidence/2026-09-17-t01/remaining-interactions.md). Other initiatives remain open. |
| 2026-09-17 | D027 | User accepted the remaining interaction copy pass and requested a commit. | T01 copy/UI scope accepted. State checks and staged House 8 browser check passed; no full-route test result is inferred from approval. Audio, handoff, camera and performance initiatives remain open. |
| 2026-09-17 | D028 | Retire the throwaway visual roadmap. | The canonical README, dated evidence and WORKFLOW provide the complete handoff; the HTML and preview image duplicated planning content and were not runtime dependencies. |
| 2026-09-17 | D029 | Review the house encounters from arrival through departure and write proposed improvements on `codex/shepherd-feedback-house-handoffs`. | Explicit user request for a playthrough, assessment and write-up. [Review](evidence/2026-09-17-house-handoffs/README.md). No gameplay edits or acceptance of proposed behavior in this checkpoint. |
| 2026-09-17 | V002 | Current normal-player walkthrough verifies the small illustrated house and unexplained avatar occlusion in Houses 3, 8 and 9. House 8 portrait exposes the shepherd's lower legs beneath the card. | [Baseline captures and layout measurement](evidence/2026-09-17-house-handoffs/README.md). Agent visual observation; supports F06. |
| 2026-09-17 | V003 | House 8's old close-before-thanks ordering does not reproduce after D026/D027. Thank you follows three open-door pages, then immediately reveals the closed 3D door. | Refines current F05 evidence while preserving the original report. The proposed farewell and simpler departure have not been implemented. Live audio and continuous-motion quality remain unassessed. |
| 2026-09-18 | D030 | Implement the first bounded house handoff experiment: doorway-forward crop/scale in the shared illustrated presenter; a brief close transition; House 8's combined reply/advice page; and an automatic stall reveal followed by one explicit departure action. Keep existing assets, route conditions and House 3/9 page counts. | User authorized implementation after the D029 proposal. The crop/scale experiment is chosen for this pass; composited shepherd-back and first-person alternatives remain open. |
| 2026-09-18 | V004 | Browser spot-check confirms the enlarged doorway treatment on Houses 3, 8 and 9, House 8's 2-page exchange, fade to the closed 3D house, automatic “Looking toward the stall…” reveal, and explicit “Go to the stall” departure. | CUA desktop rehearsal on the local server; browser warning/error log empty. State checks and full route/camera checks passed. Reduced-motion portrait composition, live audio and continuous-motion comfort remain unassessed. |
| 2026-09-18 | D031 | User playtested the D030 house handoff slice and approved it as good work. Keep the accepted crop/scale, fade, combined House 8 advice and single stall departure; retain deeper avatar/viewpoint work as optional follow-up rather than reopening this accepted slice. | Explicit user playtest feedback in this task. F06 remains a documented open question for a future composited shepherd or first-person experiment. |
| 2026-09-18 | D032 | Reframe the next audio work around gameplay ambience and effects: a restrained night bed, movement cues, gentle decision sounds, contextual animal/occupied-house sources and smooth distance attenuation. Defer intro-diorama → 3D audio continuity and loading/resource unloading until the loading strategy is rethought; do not infer that the abrupt stop is purely an audio bug. | Explicit user clarification in this task. F02/I01 become the next design and implementation scope; F01 and the loading-related part of F09 remain deferred under I08 with a resource-lifecycle revisit trigger. Exact palette, assets, source radii and mix still need audition and playtest. |
| 2026-09-18 | D033 | Revise the gameplay audio slice after listening: replace the robotic cricket chime with still night silence and filtered chirps, lower the breeze rustle, and replace the digital button tone with low-volume wood/stone-like taps, including a softer repeated lantern-assembly tap. Keep footsteps and contextual sheep/house sources audible but restrained. Rehearsal is not a separate audio implementation; its first gesture must unlock the same owner. Keep intro-diorama continuity and loading/resource unloading deferred. | Explicit user playtest feedback in this task. D033 supersedes D032's open palette/mix details while preserving its scope boundary; F02/F12 are reopened for a listened mix check. |

| 2026-09-18 | D034 | Preserve the accepted tactile button character, raise it modestly, replace sharp repetitive steps with varied sandy scuffs, and lower knocks more than gate tugs. Remove the synthetic three-tone house murmur, the likely source of the reported negative-sounding effect; real indistinct indoor ambience remains open. | User listening feedback; supersedes D033 house-voice placeholder and effect mix. Cause is inferred from source, not confirmed by an audio recording. |

| 2026-09-18 | D035 | Give each moving shepherd independent staggered footsteps in the intro, reunion arrival/departure and onward run; raise accepted tactile button taps by 12 dB after continued inaudibility. | User playtest direction; preserves D034 textures. Two moving companions produce two rhythms; the moving player adds the third. |

| 2026-09-18 | D036 | Increase button taps another 4 dB and reduce walking step amplitude about 19%; retain running levels. | User listening feedback: taps now audible but still too soft, walking slightly too loud. |


## Implementation and acceptance log

Do not mark a feedback item complete just because code landed. Use
**open → needs evidence/direction → ready → in progress → verified → awaiting
playtest → accepted**, with **deferred**, **reopened** and **superseded** as explicit
alternatives. Link deferred items to their revisit trigger. “Verified” is technical;
“accepted” requires a recorded human review of the player-facing outcome.

| Date | Item | Change/result | Validation/evidence | Human verdict | Revision / next step |
| --- | --- | --- | --- | --- | --- |
| 2026-09-17 | Planning baseline | Created roadmap/workflow; inspected active source; captured opening and House 8 before any product change. | E01–E05, browser-reviewed annotation boards, source references. Documentation links and whitespace checked. No audio/motion/performance verdict. | No gameplay item accepted. | Baseline `c42b500`; initial Q09/Q13/Q14 follow-ups subsequently resolved in D014–D019. |
| 2026-09-17 | Roadmap clarification and next milestone | Resolved house/loading/audio questions; expanded all-house and lower-end investigation scope; added I08 loader transitions and I09/M5 multilingual voices. Updated the visual companion (retired in D028). | D014–D019; 34 relative links checked, inline script syntax valid, browser filters/images and desktop fit verified. Existing game captures remain baseline evidence; multilingual preview was a roadmap screenshot only. | Direction recorded from user; no gameplay acceptance implied. | Q09/Q13/Q14 resolved. Select a feedback-programme slice; choose language/voice details at M5 kickoff. |

| 2026-09-17 | T01 partial / T06 / I02 slice | Implemented initial 10 feedback comments and analogous non-house instruction simplifications. | [Before/after, checks and deferred work](evidence/2026-09-17-t01/README.md). | Awaiting user playtest; no item accepted. | `codex/t01-player-instructions`, baseline `c42b500`; house review deferred until user feedback. |

| 2026-09-17 | T01 / I02 placement revision | D021 shared panel variants, padded action surface and continuous button borders; house approach layout moved as requested. | Normal-route browser review at desktop/portrait; lamp, House 1 and rehearsal route checks passed. [Evidence](evidence/2026-09-17-t01/README.md). | Awaiting playtest. | Same feature branch; house dialogue/sequence remains deferred. |

| 2026-09-17 | D022 / I02 UI refinement | Quiet hamburger menu, removed gameplay branding, lowered shared prompts. | Syntax/whitespace passed; menu open/resume and exploration placement verified in browser. | Awaiting playtest. | Same feature branch; house content remains deferred. |

| 2026-09-17 | T01 partial / T06 / I02 UI slice | D020–D022 delivered and user accepted addressed parts and instruction positioning. | Prior checks and user playtest; [accepted scope and next review](evidence/2026-09-17-t01/README.md). | Accepted within this bounded scope (D023). | Commit on `codex/t01-player-instructions`; next: House 1 complete interaction. No deployment authorized. |

| 2026-09-17 | D024 / House 1 | Concise closed-door encounter accepted; commit requested. | House state checks and syntax/whitespace checks passed. | User accepted. Voice reliability not declared fixed. | Next review: House 3 sighting; no changes to that house yet. |

| 2026-09-17 | T01 remaining copy / I02 slice | Full concise-copy pass implemented; three-page House 8, four-page House 9, silent visual beats and explicit next actions. | [Inventory and checks](evidence/2026-09-17-t01/remaining-interactions.md); all relevant state checks passed. | User accepted the pass and requested commit (D027). | Committed on `codex/t01-player-instructions`; no push/deployment requested. |
| 2026-09-17 | F05/F06 / I03 / T03 review | Played all five house encounters in the normal player through departure; documented observations and proposed House 8 framing/farewell changes. Gameplay unchanged. | [40 baseline screenshots, portrait spot-check, pause/resume, source audio audit and limits](evidence/2026-09-17-house-handoffs/README.md). Retrieved warning/error log empty. Live sound, motion recording and physical-device tests unavailable/not performed. | Agent review only; proposals awaiting user direction. | Baseline `385e199`; `codex/shepherd-feedback-house-handoffs`. Next: review the proposal, then compare the two House 8 handoffs. |
| 2026-09-18 | D030 / F05/F06 / I03 / T03 implementation slice | Shared presenter now uses a doorway-forward cover crop and scale-up; final scene clicks use a short fade; House 8 combines response/advice and starts its existing stall reveal directly. Houses 3 and 9 receive the same visual treatment without route-state changes. | [Implementation follow-up and limits](evidence/2026-09-17-house-handoffs/README.md). `node --check` changed modules; House 8/3/9 state checks; full `verify-rehearsal`; browser spot-check with empty warning/error log; `git diff --check`. | User playtested and approved this bounded slice. F06 is not declared fully solved because the avatar remains behind the opaque card. | Keep this slice. Consider composited shepherd-back or first-person work only if a later playtest reopens the viewpoint concern; sound remains I01. |
| 2026-09-18 | D032 / I01-I08 scope clarification | Split the next audio pass into gameplay ambience/effects and a later loading/transition investigation. Gameplay scope includes the night bed, movement and decision cues, contextual sources and distance attenuation; the intro-diorama handoff and resource unloading are deferred. | User direction recorded in D032; source audit found a synthesized gameplay bed, separate scene contexts and reunion-only footsteps. | Direction accepted; exact sound palette and mix await an implementation prototype and listening review. | Implement the first I01 slice, then revisit I08 after resource-lifecycle mapping. |
| 2026-09-18 | D032 / I01 gameplay audio slice | Added a shared gameplay audio owner, synthesized night bed, movement-distance footsteps, quiet decision cue, sound control and shared mute behavior for existing scene effects. | [First-slice evidence and limits](evidence/2026-09-18-gameplay-audio/README.md). `node --check` changed modules; `verify-journey-audio`, House 8/9 state checks, full rehearsal/camera checks, CUA normal/rehearsal checks and `git diff --check` passed. | Awaiting user playtest; technical checks do not establish sound quality. | Listen to the full route. Keep or revise the bed/steps/cue, then consider one sheep source and one muffled lit-house source. Intro handoff/loading remain deferred. |
| 2026-09-18 | D033 / I01 gameplay audio revision | Removed the continuous wind buffer; replaced the robotic oscillator cricket chime with filtered noise chirps; lowered the occasional breeze rustle; replaced the digital button tone with low-volume wood/stone-like taps and a softer assembly variant; retained distance-attenuated sheep near the animal pen and muffled low voices near lit houses. Rehearsal starts the same owner on its first pointer/keyboard gesture. | [Revised audio evidence and limits](evidence/2026-09-18-gameplay-audio/README.md). `node --check`, `verify-journey-audio` including filtered-cricket/proximity assertions, scene checks, full rehearsal/camera checks, CUA reload/toggle/House 8 flow and `git diff --check` passed. | Awaiting user playtest; source scheduling is verified but the mix still needs listening. | Listen for calmness, audibility and distance falloff. Adjust levels/radii if needed; add more regional animal/fire detail only after this pass. Intro handoff/loading remain deferred. |
| 2026-09-23 | F19 / I04 / R01 | Mobile texture/framebuffer/light budget, first-frame loading gate, renderer/context error recovery and production-build mobile PR matrix. | [Report and validation](../../../../docs/reports/shepherd-adventure-mobile-rendering.md); D044. All 9 mobile CI cases passed; local WebKit 3/3; captures visually inspected. | No physical-device or player-facing acceptance inferred. | [Draft PR #13](https://github.com/JesusFilm/story-lab/pull/13); I04/M1 remain partial. |

For every future completed part, add its item IDs, actual scope, before/after
evidence, checks/results, limitations, user verdict, commit/PR if any and remaining
work. Record new decisions/deviations in the table above in the same change as the
implementation, then update feedback and milestone status. See the workflow for
templates and the next-session entry checklist.

## Next bounded review — H01: House 1, the closed-door refusal

Review one entire encounter at a time, divided into three subsections. These IDs
are review IDs, not new roadmap initiatives. Do not change house behavior until
this review provides direction. Existing voice reliability concern F07/I01 remains
open; subtitle visibility does not prove the voice played.

| ID | Subsection | Current experience |
| --- | --- | --- |
| H01-A | Intro / approach | Walk from the lamp workbench; face the dark house. “The house is dark. Perhaps someone inside can help.” → **Knock on door**. |
| H01-B1 | Knock | Click once. “You knock on the wooden door.” Three knocks at 0.85, 1.2 and 1.55 seconds. No additional action button. |
| H01-B2 | Wait | At 1.9 seconds: “You wait at the closed door.” |
| H01-B3 | Wake | At 2.5 seconds: light on; “A light comes on inside the house.” |
| H01-B4 | Refusal | At 3.3 seconds: intended voice plus subtitle `From inside: “Go away! It is late!”`. Door stays shut. |
| H01-C1 | Close | At 5.9 seconds: light off; “The light goes out. The door stays closed.” |
| H01-C2 | Next lead | At 6.7 seconds: “Let’s try next door. There’s a light in the neighbour’s house.” → **Try next door**. Waits for a click, then walks to House 3. |

Times are active seconds after Knock; pausing stops the sequence. No back button
or automatic departure. Review prompts: which narration can the visible action
replace, whether the refusal is clearly heard/read, whether the brief transitions
feel rushed, and whether the onward lead/action is clear. Keep the accepted shared
UI as the baseline. Current copy above is not a proposed rewrite.

H01 update (D024): the table above preserves the reviewed before-state. Current
flow is Knock on door → visible knock/light action without a caption →
“Go away! It is late!” → same subtitle plus **Let’s try the next house**.
The action unlocks at the existing 6.7s; the subtitle persists until departure.
House 1 copy/flow accepted by the user on 17 September 2026; branch commit requested. Voice reliability remains open.

### D034 / I01 listening revision — 18 September 2026

Button tap amplitude increased about 3 dB; footsteps now select among six longer noise textures with a softer onset and broader sandy rustle. Knock amplitude reduced 30% and gate timber amplitude 15%. Removed the recurring three-tone simulated indoor voices. There is no dedicated house-completion cue in the current flow; source inspection identifies the proximity murmur as the likely reported sound. Indoor voices require a suitable recorded replacement before reinstatement.

Syntax, audio scheduling/regression and whitespace checks passed. Audio character and perceived balance remain awaiting listening; no audible recording was captured. Existing ambient claims above describe earlier checkpoints and are superseded by D034 for house voices.

### D035 / I01 — group footsteps and audible buttons

Implemented three independent movement-driven footstep lanes with different starting phases and small stride differences, sharing the sandy textures and mute/pause owner. Removed the old reunion-only audio loop. Intro supplies all three runners; reunion supplies only visible moving companions, including the onward journey. Button amplitudes raised fourfold (about 12 dB). Syntax, audio regression and stagger/group-mute checks pass. Listening and perceived group clarity remain awaiting user playtest; no audible recording captured.

### D036 / I01 — small listening adjustment

Raised assembly/other tap gains from 0.20/0.256 to 0.32/0.41 (about +4 dB). Walking footstep gain reduced from 0.042 to 0.034 (about -1.8 dB); running remains 0.055. Syntax, existing audio regression and whitespace checks passed. Awaiting listening acceptance.


### D037 / I01 — recorded night ambience and ignition

18 September 2026. User reports absent animals/house murmurs and requests reliable contextual night sound, half-volume knocks and lantern ignition cues. Supersedes D033's synthesized wildlife and D034's temporary removal of house murmurs. I01 remains partial, awaiting listening review.

Implemented five distant sheep bleats and two jackal calls at route milestones, quiet continuous recorded crickets attenuated near stationary lights, recorded frogs near the well (first call after 8–20 seconds there, then every 30–60 seconds), and looping recorded house murmurs at lit Houses 3/8/9 with distance falloff. Murmurs fade out while the doorway presenter is open and resume when closed. Recorded sounds respect gameplay pause/mute and reset on restart. Individual failed recordings do not block subsequent route calls. Knock amplitude halved; workshop and gate ignition use an unpitched tinder/flame cue synchronized to lighting. Existing buttons and stride mix retained.

Verification: `verify-journey-audio.mjs` and `verify-night-ambience.mjs` cover playback scheduling, five/two call budgets, proximity/light/door attenuation, frog cadence, pause/reset, ignition and staggered runners. Licensed source/adaptation details are in [audio credits](../../assets/audio/credits.html). The palette is an atmospheric interpretation; species/locality and ancient speech authenticity are not established. Technical verification does not establish audibility or naturalness: full-route listening remains unassessed and requires the next user playtest. Intro/loading continuity remains deferred under D032.

Browser verification: five MP3 assets fetched and decoded without failures; workshop and gate each produced one ignition event; House 3 proximity murmur was present before knocking, faded below 0.001 during the open-door conversation, and resumed after closure. No page errors. The saved `checks/verify-night-audio-browser.mjs` reproduces this targeted check. Full rehearsal route/camera and empty-stall state checks passed, as did syntax, whitespace and publication hash/module checks. An initial browser harness attempted one extra click during the closing fade; correcting the harness to await closure passed. No audible capture was made.


### D038 / I01 — soften repeat seams and vary households

18 September 2026. Listening feedback approves the cricket character and muffled indoor voices, but identifies a break at cricket repeats, identical male voices at three houses, and a repetitive jackal chorus with a cutoff. User requests one jackal event and one wolf event per run, with different household voices. I01 remains partial pending listening acceptance.

Source review: jackal playback was not a native loop; the same 13.8-second file was triggered at two route points, and that source itself contains repeated material/overlapping calls. Replaced it with a 4.3-second excerpt from a different CC0 source, centered on two successive dominant calls with a soft tail. The spectrum supports a dominant harmonic contour in this excerpt; listening is still needed to judge whether it conveys one animal convincingly. One jackal event now occurs at the barred gate approach and one quieter wolf event at the House 9 approach. Returning to points does not retrigger either; restarting the run resets both.

Crickets retain the approved recording and level. The decoded waveform now overlaps its last and first two seconds with equal-power fades, wrapping between adjacent original samples rather than abruptly restarting an MP3. The same treatment applies to all indoor beds. House 3 retains the approved male murmur; House 8 uses a separate women’s conversation; House 9 uses adults and children. New tracks are strongly low-pass filtered, normalized to the existing bed level, and keep the existing distance and door-open attenuation.

Wolves are a plausible atmospheric choice, supported by period shepherd imagery in [John 10:12](https://www.biblegateway.com/passage/?search=John%2010%3A12&version=NIV) and the [Israel Nature and Parks Authority’s account of local wolves/jackals and dusk/night activity](https://www.parks.org.il/article/כלביים-זאב-תן-ומיני-השועלים/). This supports plausibility, not an assertion that a wolf was present at the Nativity. The licensed lone-wolf effect is AI-generated according to its author; it is not represented as a regional wildlife recording. No new dialogue or biblical facts were added. See [audio credits](../../assets/audio/credits.html).

Verification: audio owner and ambience checks pass for one jackal/one wolf per run, five sheep bleats, no repeats on revisits, reset, mute/pause, distance/door falloff, distinct house-track assignment and a two-second stereo waveform overlap without a discontinuous wrap. Technical checks cannot establish perceived naturalness, voice intelligibility, single-animal character or seamlessness by ear. Those remain for the next listening playtest; intro/loading continuity remains deferred.

Browser results: all eight sound assets decoded with no failures or page errors; workshop/gate ignition and live House 3 door attenuation passed. `verify-ambience-seams-browser.mjs` measured the actual decoded beds: cricket RMS immediately before/after wrap was 0.0498/0.0332 against 0.0408 overall, with no silent boundary. All four beds had finite, unclipped samples and boundary steps below the waveform test threshold. An initial silence assertion on speech detected a natural pause in the approved male recording; silence detection is now scoped to the continuous cricket bed, while speech still receives boundary and clipping checks. No audible playback assessment was performed. Next listening pass: wait through a cricket repeat away from lights, compare Houses 3/8/9, and hear each distant canid once across a full run.


### D039 / I01 — quiet household replacement and listening acceptance

18 September 2026. User accepts the other D038 audio additions, including the revised wildlife and softened cricket repeats. Both new household crowd tracks are rejected: too many simultaneous speakers overwhelm the tranquil night. The original male murmur remains accepted. Preserve the other audio work; this revision is limited to household sources.

Replaced House 8's crowd with UnrealQW's CC0 “Muffled talking (female),” described by its creator as single female speech behind a wall. Filtered to 480 Hz and normalized to -25 LUFS / -6 dBTP (3 dB below the original house bed's target). House 9 returns to the original accepted male murmur, as explicitly permitted by the user. Both rejected crowd assets and their publication entries are removed. The three houses now use male / female / male; no children/crowd layer is retained. Crossfades, distance falloff and door suppression remain unchanged. Source attribution updated in audio credits.

Status: other D038 additions accepted by user listening; the House 8 alternative awaits listening review. Asset description and technical checks do not establish calmness or unintelligibility by ear. If this candidate also feels intrusive, reuse the accepted original at all three houses. The prior audio work is already committed in d51188d; this candidate and documentation are prepared for review before the next commit. I01 remains partial; intro/loading continuity stays deferred.

Checks: audio scheduling and actual decoded-waveform tests passed; browser loaded all seven assets with no audio failures/page errors and preserved gate/workshop ignition plus door suppression/resumption. No audible assessment of the new female candidate was performed. Publication preparation exposed deletion handling in `check-publication.py`: deleted files were required to remain listed, and HEAD fallback could conceal a stale deleted entry. The checker now validates index contents, ignores deletions when requiring newly changed files, and still rejects deleted assets left in the manifest; focused regression checks cover those cases.


### D040 — final listening acceptance and PR handoff

18 September 2026. User confirms they are happy with the current result, including D039's single female House 8 voice and restored original House 9 murmur, and requests updated documentation, a commit and a pull request. The bounded house-handoff/gameplay-audio work is accepted and ready for review; prior “awaiting listening” entries above are historical checkpoints superseded by this verdict. This does not close F07, broader device evidence, remaining house-viewpoint alternatives, or the deferred loading/intro-continuity investigation. It authorizes the commit and PR, not merge or deployment.

Final household candidate passed scheduling, PCM seam/clipping, browser asset decoding, ignition and door attenuation checks. Publication deletion handling has focused regression coverage. Runtime credits and allowlists reflect the final seven sound assets. The unrelated local publication-inventory edit is excluded from this handoff.


### D041 / I04 / I08 — full-route memory baseline and loading direction

18 September 2026. User requests measurement before choosing staged versus all-upfront
loading: create a local branch, instrument startup/audio/all scenes through replay,
play the complete normal experience using computer controls, and report memory,
cleanup and asset-quality priorities. Created `codex/shepherd-memory-profile` from
`a9518851ecabd6d41f9030923f46a27266956608`. This supersedes D032's investigation deferral;
it does not select an unmeasured loading architecture or approve a visual redesign.

Implemented opt-in lifecycle/heap/resource/graphics/audio profiling and local JSON
export. Completed the full normal route with all opening/ending verses and sound
enabled, plus replay-entry and fresh-origin startup checks.
[Report, raw evidence, limitations and recommended sequence](evidence/2026-09-18-memory/README.md).
The world remains allocated through both dioramas and replay; about 1,996 MiB of
logical RGBA/mipmap textures, 128 MiB geometry backing stores and 14 MiB retained
audio PCM are separate counters, not a summed RAM measurement. Repeated sheep
loads and 4K Nativity textures are priority experiments. Initial world preparation
blocks the main thread for multiple seconds even under the opening. No in-route
freeze cause, total GPU residency or low-end-device safety is established.

Recommendation (not an accepted implementation): optimize retained assets, establish
resource ownership/idle rendering, then compare bounded background preparation with
all-upfront loading on a physical modest device. Keep transition music independent
of diorama destruction. I04/I08 and M1 remain partial; the diagnostic checkpoint is
complete, while loading/visual changes and human acceptance remain open.

Checks: profiler accounting/opt-in tests, gameplay audio/ambience, route/camera,
syntax/whitespace, local export validation and full CUA playthrough passed.
Human verdict: not yet reviewed. Local edits only; no publication manifest changes,
commit, PR or deployment. Existing unrelated portal inventory edits were preserved.


### D042 / I04 / I08 — isolated memory optimization experiment

18 September 2026. User requests implementing the proposed improvements in a
separate worktree, then a before/after comparison emphasizing the JavaScript heap,
allocation churn and reduced average memory. Current scope is primarily desktop;
retain mobile compatibility and consider weaker devices without claiming that
mobile is the intended primary experience. This refines D016/R01's mobile emphasis
for this experiment; it does not establish a safe device memory budget.

Created `codex/shepherd-memory-optimization` from the same a951885 baseline and
copied the local D041 instrumentation/evidence, excluding unrelated portal changes.
Implemented shared sheep geometry/textures with independent skeletons, smaller
family/scenery textures, conservatively simplified static scenery, reusable camera
and audio working state, and suspension of covered/paused/inactive world work.
Original models remain available. No dialogue, route or loading architecture change.

[Experiment report and paired traces](evidence/2026-09-18-memory-optimization/README.md).
I04/I08 remain partial. Human visual acceptance, physical modest-device evidence,
music continuity and an explicit loading-policy comparison remain open. This is a
local proof of concept, without publication, merge or release authorization.

D042 verification completed: final normal CUA route and replay, plus paired focused
idle probes, camera parity, geometry/animation, route and audio checks. Gameplay
heap mean fell 178.9 → 152.8 MiB (descriptive routes; added probe excluded), fixed-idle
mean 216.5 → 142.2 MiB, and the fixed-window middle-90% span 65.4 → 6.0 MiB.
Sampled upward heap movement fell about 72%; frame timing was essentially unchanged.
Geometry backing stores fell 127.8 → 100.3 MiB and texture estimates 1,996.2 →
1,100.2 MiB. These counters are not additive total RAM. A first pass that did not
reduce churn was retained in the evidence; direct-coordinate camera intersections
provided the subsequent improvement. Later-route sawteeth remain. Human acceptance
and physical-device budgets remain unestablished; no release action was taken.


### D043 / I04 / I08 — memory initiative accepted and release authorized

18 September 2026. The user accepted the reported memory proof of concept and
requested documentation, before/after memory captures, completed feedback tasks,
a commit and PR, review/CI, merge if clear, and cleanup to local main only. This
supersedes D042's earlier local-only release status.

Completed bounded work under I04 / R01 and the diagnostic portion of I08:

- [x] Capture startup, audio loading, every scene and replay invitation with an opt-in profiler.
- [x] Preserve baseline and final full-route exports and before/after heap charts.
- [x] Reduce avoidable camera/frame allocations with reusable state and equivalent camera results.
- [x] Reduce selected texture/geometry footprints and share sheep model resources.
- [x] Suspend inactive world rendering and scene audio work.
- [x] Verify the normal route, replay and focused regressions; present measured results for user acceptance.

[Initiative, captures, measurements and limitations](evidence/2026-09-18-memory-optimization/README.md).
Full-route gameplay mean fell 178.9 → 152.8 MiB; fixed-idle middle-90% heap span
fell 65.4 → 6.0 MiB. These are desktop measurements, not a mobile memory budget.
I04/M1 remain partial: F08's reported freeze has not been reproduced/root-caused,
physical modest-device validation and later-route allocation work remain open.
I08/F01/F09 remain open for loading architecture and music/visual continuity.
User acceptance covers this measured initiative; no additional human sensory
playtest is inferred. Release follows a clean PR review and passing CI.


### D044 / F19 / I04 / R01 — Android launch repair and mobile PR verification

23 September 2026. The user requests a focused repair for Android Chrome showing
HTML controls over a white game area after the opening diorama, plus mobile
production-build PR checks and a draft PR. This authorizes the bounded implementation
and PR, not merge, deployment, new art or an unmeasured loading-architecture rewrite.
It does not close F08's separate intermittent camera-freeze investigation.

[Investigation, changes, checks and reproduction limits](../../../../docs/reports/shepherd-adventure-mobile-rendering.md).
The screenshot alone does not classify the failure. Current source retains a large
texture footprint and lacks post-load context-loss recovery. The implementation
caps mobile model textures at 512 px, framebuffer DPR at 1, nearby point lights at
four, and disables mobile multisample antialiasing and real-time shadows. It keeps
original geometry, animation, story and route. CPU texture resizing precedes GPU
upload. The first opening frame precedes loader dismissal; renderer/resource
failures show actionable reload and stop play. Reload restarts through the story.
This is a resource-budget choice for the reported mobile launch, not a claimed
physical-device memory/performance guarantee or general visual acceptance.

Tests use actual WebGL pixels, touch-driven lamp assembly, portrait/landscape/high
DPR, rotation, model failure/reload, real context loss/reload and controlled missing
draw calls. Desktop Chromium/SwiftShader and Linux WebKit emulation are explicitly
separate from physical Android/iOS. A first assertion incorrectly required the
wide night-sky opening to have the same illuminated area as the closer village;
the corrected suite retains a stronger village criterion after the intro and
checks that a clear-only renderer cannot pass either criterion.

Status: technically verified in draft PR #13 (runtime `31d36ae`, CI run
35828071550); all nine mobile cases passed. Human/physical-device playtest remains
open. Final 512 px scene texture estimate is 104.2 MiB versus the recorded
1,100.2 MiB baseline; geometry is unchanged. See the report for artifacts and limits. No release or unrelated roadmap completion is implied.

### D045 / F19 / I04 / I08 / R01 — constrained A50 startup and small asset tiers

23 September 2026. The updated report names Samsung Galaxy A50 and a reported
4 Mbps Wi-Fi internet line, with a freeze before visible diorama and a loader
beyond 100 seconds. Preserve D044's earlier white-world screenshot as a separate
observation; the phone's tested revision and failure mechanism remain unknown.
The user authorizes a constrained-device investigation, runtime/asset changes,
benchmarks and a draft PR, without merge, deployment or paid device services.

[Implementation, reproducible evidence and limits](../../../../docs/reports/shepherd-adventure-constrained-startup.md).
The bounded slice chooses minimal/low/original assets before download and decode,
uses reproducible texture/geometry derivatives, removes world preparation behind
the scripture, streams music independently, bounds asset work and defers the final
area. It retains story/route interactions and adds a persistent user override,
opt-in diagnostics, first-frame GPU completion and constrained PR regression.

The 4 Mbps/4× CPU VM test has passed through a visible responsive diorama, actual
rendered world, touch lamp assembly and the first-house response. Broader tier,
recovery and matched-matrix checks are in progress. This is technical progress;
A50 hardware, art/sound acceptance and the separate F08 camera issue remain open.
Desktop throttling/SwiftShader cannot establish a physical-device performance floor.
