[Order: purpose, decisions, branch agreement and remaining work](ORDER.md)

# Shepherd Adventure: village journey rebuild

## Current accepted checkpoint — 15 September 2026

The user has completed and reviewed the individual village scenes through the
nativity approach. The normal [play entry](../../index.html) now reconnects the
opening diorama, running introduction and ending diorama around those scenes,
using compact player actions. The [rehearsal](../../rehearsal.html) remains available
for focused scene review. The user accepted this integration and scenery checkpoint
and authorized a commit and push to the feature branch.
Next: user-directed model and decorative work on this same feature branch.
Performance work is deferred to its own session; release review remains outstanding. The notes below preserve earlier
milestones and should not be read as the current implementation status.

13 September 2026 · **Initial scaffold milestone reviewed and accepted for checkpoint.** Point 01 has a playable draft awaiting review; point 02 passed the user play-test and is accepted; point 03 is accepted for checkpoint after its diorama continuity revision; point 04 is accepted after a successful user play-test; point 05 is ready for review; points 06 and 07 are accepted after user play-tests; point 08 is accepted after user play-testing; point 09a's owner conversation is accepted after user play-testing; 09b is accepted after user play-testing; point 10 remains a placeholder.

[Open the local rehearsal](../../rehearsal.html) · [Actual rehearsal map](../../map/rehearsal-map.svg) · [Implementation and checks](../../review/2026-09-13-route-rehearsal/README.md)

Run `python3 serve.py --port 8766` from this prototype and open `http://127.0.0.1:8766/rehearsal.html`. The first pass starts before point 01. Use Move to next point for the complete walk; Review tools contains replay, jump, capture and reduced-motion controls. Direct staging: `rehearsal.html?point=5`; full incoming replay: `rehearsal.html?point=5&replay`. These are development entries, not the public demo.

Working branch: **`codex/shepherd-story-rebuild`** (dedicated long-running feature branch; initial checkpoint authorized for push).
Starting revision: `188f0609f0f56672d89d35458c1c11a6e04b7d63`.

## Current direction

**14 September update:** point 08 now includes the user-directed gate-lighting
action. This supersedes earlier dark-gate notes below; see the point 08 scene brief.

The player follows a winding search through the village, encountering dismissal, partial help, signs of earlier travellers and eventual hospitality. The purpose of the longer walk is to experience different village spaces through the shepherd's following camera. Do not shorten it into a direct conversation-to-destination chain merely to reduce stops. Treat the suggested earlier journey of Mary and Joseph, the donkey sighting and villagers' dialogue as authored connective fiction, distinct from scripture presentation.

The [user-drawn route](reference-route.png) supplies the intended shape and sequence. It is a planning annotation, not collision-checked coordinates. Preserve its winding approaches while fitting actual doors, structures and camera clearance; bring material deviations back for review.

This direction supersedes the seven-beat central route in the earlier seven-beat proposal, including its market-side gate opening, two-conversation recommendation and early companion reunion. The full-experience critique remains inspiration and diagnostic evidence, not a mandatory task list.

The empty stall is a useful outcome even though nobody is there: the shepherd reaches the rear of the gate and can open it. Do not invent a conversation or reward to compensate for the empty stall.

After that action, the shepherd looks around and notices House 9's lit lamp. A short thought points out that someone may still be awake; the camera settles on that house and the next action becomes clear. The proposed wording and shot are **direction, not approved final copy or timing**. Lamps should make helpful/awake households worth approaching without promising that every lit house has the answer. House 9 remains lit because it recently offered shelter. Preserve existing night atmosphere; do not turn off every village light indiscriminately.

Each scene's feel, words, available actions (knock, call out, examine, open, follow), camera and sound will be directed and reviewed separately with the user. Stable numbers make requests such as “Implement point 5” unambiguous.

## Scene index

| Point | Place | Intended contribution | Work item |
|---|---|---|---|
| 01 | Lamp workbench | Prepare a light and set out | [01 — Light](scenes/01-lamp.md) |
| 02 | House 1 | Dismissed because it is late | [02 — House 1](scenes/02-house-1.md) |
| 03 | House 3 | A resident saw Mary and Joseph with a donkey heading toward the gate | [03 — House 3](scenes/03-house-3.md) |
| 04 | Timber gate, front side | Barred; seek help near the well | [04 — Barred gate](scenes/04-barred-gate.md) |
| 05 | House 5 | No answer; human and animal tracks lead away | [05 — House 5](scenes/05-house-5.md) |
| 06 | Original village animal pen | Closed pen; tracks continue past it | [06 — Animal pen](scenes/06-animal-pen.md) |
| 07 | House 8 | Resident offers a credible suggestion to try the stall by the gate | [07 — House 8](scenes/07-house-8.md) |
| 08 | Empty stall 1 / rear of timber gate | Nobody at stall; open the gate; notice lit House 9 | [08 — Open the way](scenes/08-empty-stall-and-gate.md) |
| 09 | House 9 | Shelter owner gives directions; arriving shepherds ask, receive directions and run ahead | [09 — Shelter owner and reunion](scenes/09-house-9.md) |
| 10 | Nativity shelter, via sheep enclosure | Follow companions, approach quietly and recognise the sign | [10 — Nativity](scenes/10-nativity.md) |

The entry walk is a lead-in, not a new numbered scene. The gate/House 9 camera transition belongs to point 08; the companion conversation and follow handoff belong to point 09. They can be requested separately as **08 reveal**, **09 owner** and **09 reunion** without renumbering the ten points. The final sheep enclosure is not the village pen at point 06.

Point 01 has a **first playable draft, user acceptance pending**, using the selected guided preparation sequence. [Review it](../../review/2026-09-13-lamp-workbench/README.md).
Point 02 has an **accepted rejection scene following a successful user play-test**. [Review it](../../review/2026-09-13-house-1/README.md).
Point 03 has an **accepted helpful exchange and revised diorama continuity**. [Review it](../../review/2026-09-13-house-3/README.md).
Point 04 has a **barred-gate scene accepted after a successful user play-test**. [Review it](../../review/2026-09-14-barred-gate/README.md).
Point 05 has a **no-answer and tracks scene ready for user review**. [Review it](../../review/2026-09-14-house-5/README.md).
Points 06 and 07 are **accepted for checkpoint after user play-tests**: [animal pen](scenes/06-animal-pen.md) and [House 8](scenes/07-house-8.md).
Point 08 is **accepted at checkpoint after user play-testing**: [empty stall and gate](scenes/08-empty-stall-and-gate.md). Point 09a has an **owner conversation accepted at checkpoint after user play-testing**: [House 9 review](../../review/2026-09-14-house-9/README.md). Point 09b's reunion is **accepted after user play-testing** ([scene](scenes/09-house-9.md), [evidence](../../review/2026-09-15-companion-reunion/README.md)); point 10 retains **route placeholder ready, detailed scene implementation pending, user acceptance pending**. A placeholder working correctly must never mark a scene complete.

## First implementation: a walking rehearsal

Build only the route and a small review controller. The first deliverable is a real walk through the user's ten points, with the existing main shepherd, terrain, buildings, lighting, animation and follow camera. It is not a teleport slideshow and does not require final conversations, villager models, tracking mechanics or performance of the gate gesture.

At each point show a clearly marked review panel, for example:

> ROUTE REHEARSAL · Point 05 — House 5 · Scene not implemented
>
> Intended beat: no answer; human and animal tracks continue away.
>
> **Move to next point — Village animal pen**

The button walks the next authored segment at normal speed, disables while moving, and returns on arrival. It bypasses unfinished interaction logic intentionally. At point 10, show the end of the route and review/restart controls rather than an invalid next destination.

Include secondary review tools: **Replay approach**, **Jump to point** and **Restart route**. Review jumps must be labelled as staged; they are conveniences, not evidence that a full walk passed. A replay starts far enough back to assess the actual approach camera, not just the final frame. Keep pause/resume, keyboard, touch and reduced motion functional. Provide a direct local review entry so repeated tests do not require watching the opening every time; retain the normal loading overlay and retry behavior.

Use minimal stand-in outcomes so later points can be reviewed:

- Initial scaffold behavior: leaving 01 equipped a lit lantern. The current scene draft replaces this bypass with the guided preparation and explicit Take lamp action; later staged jumps still reconstruct that outcome.
- At 04 the gate stays closed and dark. The next leg detours toward the well; it must not cross the gate.
- Leaving 08 applies gate-open state without claiming the physical interaction has been implemented. It must not trigger the old companion fly-by.
- At 09, the reunion draft now replaces the original next-point placeholder. Companions arrive after the owner exchange; the player shares directions and explicitly chooses **Follow the others**.
- Scene jumps reconstruct only earlier outcomes. Jumping to 04 gives a lantern and closed gate; jumping to 09 gives a lantern and open gate. Reset restores initial state. Outcomes apply once and reset deterministically.

Detailed lighting cues, House 9's searching camera, dialogue and varied actions remain separate scene work. Basic arrival framing in the rehearsal should make the intended structure identifiable, but its polish is not final acceptance.

### Small code boundary

Separate authored **scene/route data**, **walking/progression state** and **scene presentation**. Use stable IDs such as `s01-lamp` and distinct front/rear gate anchors. Each scene entry identifies its structure, approach/standing position, outgoing control points, intended view and minimal completion outcome. The review UI reads the same sequence that finished scenes will use. A real scene replaces its placeholder and reports completion through the same narrow interface; it does not require rebuilding the route controller.

Avoid a general quest engine or copying the whole game into a second prototype. Keep the renderer, character assets, camera rig, loaders and reusable final approach. Isolate or replace the old investigation graph at its integration boundary rather than accumulating ten exceptions in `noticeArrival()`. The working feature branch can become the new flow incrementally; the old accepted experience remains on `main`.

Implementation anchors found in current source:

- `src/journey-model.mjs`: old `NODES`, `EDGES`, procedural `lanePoints`, automatic `noticeArrival`, lamp recipe, discoveries and gate/follower state are coupled. The new hand-drawn turns need explicit intermediate waypoints, not straight node-to-node links with the old small sinusoidal bend.
- `src/journey-world.mjs`: the route graph affects terrain/path dressing, grass exclusion, safe building placement, gate placement, walls and nature clearance. **Changing routes can silently move the town.** Preserve current measured model transforms and the physical gate/wall anchors before installing the new traversal geometry. Separate fixed settlement layout from the active story route. Update only the narrow path dressing needed for traversal; record scenery changes explicitly.
- `src/journey.mjs` and `src/journey-routes.mjs`: route UI, input, camera, old scene triggers and ending prefetch depend on old node IDs. Introduce the rehearsal adapter/controller coherently, including ending preparation at a suitable new beat. Do not let hidden keyboard inputs revive retired scenes.
- `src/journey-debug.mjs`: free-flight inspection freezes game simulation. Keep it useful for diagnosis, but create rehearsal playback that actually walks and animates normally.
- `src/journey-animal-route.mjs` and `src/journey-arrival.mjs`: reuse the final approach/reveal where compatible, adapting its start at House 9 and confirming new heading continuity. Do not declare these accepted merely because existing tests pass.

### First milestone acceptance

1. Walk 01–10 in the user's order, including the two different sides of the same timber gate. No unintended old recipe, inspection, route lock, companion event or ending launch interrupts the rehearsal.
2. Confirm structure centres remain fixed; visited houses rotate to face their knocking stops, as requested during route review. Check the new walking corridor against walls/footprints and review it with the actual camera. No cutting through a house, closed gate or pen; smoothing must not cut corners through geometry.
3. Capture an updated map with the real sampled new paths, plus approach/arrival views at the ten points. Preserve the user drawing alongside it and call out material adjustments.
4. **User route review:** walk at ordinary speed and judge whether the village feels sufficiently explored; pause at approaches that feel rushed, empty or badly framed. Review the 03→04, 04→05 and 06→07→08 turns particularly closely. The user approves the route and basic pacing before detailed scene work.
5. Verify next/replay/jump/reset, no duplicate advancement, correct staged state, pause, narrow controls and reduced motion. Record frame pacing on a consistent sample of the new walk; do not call it device-wide performance certification.

## One scene at a time after the route review

For each numbered work item:

1. Read the current scene brief and recorded preferences. Present its real approach screenshot and ask only for missing direction: feeling, wording, action and camera intent. Do not repeat settled route/style questions.
2. Agree concrete acceptance criteria. Show alternatives when they change the experience, such as knocking versus calling out; do not invent a menu of every possible action.
3. Implement that scene using existing assets where possible. Keep subsequent placeholders traversable. Commission new assets only when the chosen staging establishes a need and the applicable asset workflow permits it.
4. Provide matched captures and a specific local playtest entry. The user reviews text, rhythm, action and feeling in motion. Automated checks establish state correctness, not tone or enjoyment.
5. Revise or keep based on that review. Record the user's acceptance separately from implementing-agent checks, then make a focused commit. Run an integrated rehearsal through adjacent scenes before moving on.

Use **direction recorded → placeholder → in progress → ready for user review → accepted**. A later change that materially affects an accepted scene reopens the relevant review. Long-running work should continue from these files, not infer decisions from scattered chat history.

## Branch, public prototype and release plan

The rebuild lives on `codex/shepherd-story-rebuild` until all detailed scenes and the integrated experience are accepted. The branch was created locally from the current checkout; existing untracked review records were preserved. Planning and rehearsal implementation stayed local. The user has now authorized the first milestone commit and feature-branch push; merging and deployment remain unauthorized.

The checked-in `.github/workflows/portal-pages.yml` deploys on pushes to `main` and also exposes `workflow_dispatch`. Therefore normal feature-branch pushes do not trigger this push deployment, but a manual run is a separate route to publication. Before pushing rebuild work, add an explicit `refs/heads/main` condition to the deployment job (and, if appropriate, its build job). Keep non-deploying branch validation possible. The deployment job now has the explicit main-ref guard in this branch; it has not been pushed or deployed. Do not manually deploy this branch to the production Pages site.

Work can be committed and pushed to the feature branch for durable checkpoints. Feature-branch source in this public repository is still public; only the live demo remains on the published version. Apply normal public-source hygiene to all pushed plans, images and runtime files.

Use the local rehearsal for reviews. Any later hosted feature preview must have a separate destination from production and be explicitly arranged; the current workflow does not establish one. A draft PR may track the work when useful, but must remain unmerged and must not enable auto-merge.

Other work may continue on `main`; bring accepted main updates into the feature branch at deliberate checkpoints and rerun relevant checks. Do not merge unfinished scenes back to main incrementally. Preserve focused commits and the scene checklist so the branch remains reviewable.

Before release:

- All ten scenes and 08/09 transition sub-beats are accepted by the user; integrated walking, conversations, gate state, companion reunion and final reveal have had a full normal-speed playthrough.
- Remove temporary next-point buttons from the normal player experience. Keep any useful review tools behind an explicit development entry and outside publication unless deliberately reviewed for inclusion.
- Review cold loading, failures/retry, pause/restart, reduced motion, landscape/portrait, performance and an agreed physical-device playtest. Fix the known completion readability issue if still present in the final experience.
- Update the canonical settlement map to the implemented route, preserving exact model footprints/rotations. Refresh relevant path, camera, state and map tests; retire old investigation assertions only where their behavior was deliberately replaced.
- Update `projects/portal/publication.json` and reviewed hashes only after inspecting the final public runtime files. Include all required local dependencies, media and attribution; exclude temporary planning/review tooling. Build and verify the portal under `/story-lab/` paths.
- Present the finished PR and evidence for an explicit release decision. Merging to main is consequential because it triggers deployment. Do not merge or release automatically when the checklist fills up.
- After the agreed merge/deployment, check the live tile-to-play journey and ending. Keep the prior accepted revision identifiable for rollback.

## Next work item

Review the implemented route-only rehearsal before selecting the first detailed scene. Route approval is its own milestone; it does not approve final dialogue, interaction design, shots, generated models or the complete game. The ten scene files are ready to guide subsequent requests.

### First route feedback: door orientation

Houses 1, 3, 5, 8 and 9 now face their actual stops. Centres and the walking route are preserved. [Correction captures](../../review/2026-09-13-route-rehearsal/door-facing/README.md) record all five views. This supersedes the initial rotation-preservation constraint for those houses. User review of this correction remains pending.

### Second route feedback: wall and urgency

The empty-stall gate wing now joins its gate-side corner, clearing the interior. This supersedes preserving that wall run. Movement trials use running between stops, a walking arrival over the last three metres, and sustained walking inside the final sheep enclosure. [Implementation and review notes](../../review/2026-09-13-route-rehearsal/wall-and-urgency/README.md). User acceptance remains pending.

### Lighting direction

Only helpful houses 3, 8 and 9 have fixed household lights. Houses 1 and 5 and all other homes are unlit. The courtyard, well, rear-passage and gate lights are removed or unlit. The workbench and nativity lights remain. The carried lantern and general moon/sky illumination remain for navigation. This supersedes the earlier gate-lighting beat: opening the gate still supplies progress. User review pending.

### Point 06 accepted checkpoint — 14 September 2026

The animal pen now presents the approved quiet observation and **Follow the tracks** action. Marks continue outside the closed entrance and gradually fade toward the houses. The user completed their play-test and authorized the audit update, commit and feature-branch push. Point 06 is accepted at this checkpoint; points 07–10 retain their placeholders. [Scene and acceptance](scenes/06-animal-pen.md) · [Review evidence](../../review/2026-09-14-animal-pen/README.md). No merge or deployment.


### Point 07 accepted checkpoint — 14 September 2026

House 8 now offers **Knock on door**, a player-paced illustrated exchange with a
friendly grey-haired old man, a closed-door farewell, and **Explore the empty
stall**. The illustrations use the actual House 8 facade and original shepherd
style reference. [Scene brief](scenes/07-house-8.md) ·
[Review evidence](../../review/2026-09-14-house-8/README.md).
The user completed their play-test and authorized the feature documentation update,
focused commit and remote feature-branch push. Point 07 is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--house-8-helpful-advice-and-doorway-continuity).
Points 08–10 retain their placeholders. No merge or deployment is authorized.


### Point 08 review draft — 14 September 2026

Implemented the user-approved empty-stall search, **Light the lantern**, **Open the
gate**, searching thought and lit House 9 reveal, followed by **Go to the house**.
The user's new direction supersedes the earlier dark-gate rule: the gate lamp stays
dark until the explicit lighting action, then remains lit. Point 04 stays dark.
[Scene direction](scenes/08-empty-stall-and-gate.md) ·
[Captures and verification](../../review/2026-09-14-empty-stall/README.md).
Point 08 is ready for user review; points 09–10 retain placeholders. House 9's owner
conversation is the next separately directed area after this review. No acceptance,
merge or deployment is implied.


### Point 08 accepted checkpoint — 14 September 2026

The user completed their play-test and authorized the audit update, focused commit
and remote feature-branch push. Point 08 is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#14-september-update--empty-stall-open-gate-and-house-9-reveal) ·
[Scene and review](scenes/08-empty-stall-and-gate.md).
Points 09–10 remain placeholders. No merge to main or deployment is authorized.


### Point 09b review draft — 15 September 2026

Companions visibly approach through the opened timber gate from the House 3 lane,
gather at House 9, receive directions, run ahead and wait for **Follow the others**.
The dialogue uses **the couple** and **the child**, reflecting the shepherds'
established knowledge rather than the narrator's knowledge of Mary and Joseph.
[Scene and wording](scenes/09-house-9.md) ·
[Review and checks](../../review/2026-09-15-companion-reunion/README.md).
The standing [biblical and historical continuity guide](biblical-and-historical-continuity.md)
also records earlier-scene follow-ups. This is an implemented draft awaiting the
user's play-test, not acceptance; point 10 remains unfinished. No merge or deployment.


### Point 09b accepted checkpoint — 15 September 2026

The user completed play-testing and authorized the feature audit update, focused
commit and remote feature-branch push. Point 09b is accepted at this checkpoint.
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#15-september-update--companion-reunion-and-biblical-continuity) ·
[Scene and review](scenes/09-house-9.md).
Point 10 remains unfinished. No merge to main or deployment is authorized.


### Point 10 approach accepted checkpoint — 15 September 2026

The user accepted running past the sheep with a short final walk near the shelter.
Companions have idle/run clips only, so they run ahead and wait while the player
walks the final eight metres. This supersedes the sustained enclosure walk.
[Scene](scenes/10-nativity.md) · [Review](../../review/2026-09-15-nativity-approach/README.md) ·
[Audit entry](../navigation-direction-retrospective-2026-09-13.md#15-september-update--nativity-approach-pacing).
The user authorized the audit update, focused commit and remote feature-branch push.
Recognition, active final interaction and ending remain pending. No merge or deployment.
