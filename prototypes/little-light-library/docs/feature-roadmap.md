# Future Feature work — three showcase books

**Status: future Feature work, separate from editor retirement and architecture
cleanup.** This roadmap is a handoff for a later assignment to complete and
polish **Adam, Eve, and the Garden**, **Noah and the Great Flood**, and
**Jonah and the Whale**. It does not authorize new story pages, artwork,
recordings, translations or room redesign during cleanup.

Build a complete **English (US)** experience first. Preserve the existing
working language content throughout. Quiet Garden remains a technical
demonstration and regression fixture; it is not a fourth showcase deliverable.
The historical autonomous quality-scoring effort stays parked.

The inventory below comes from the committed definitions, locale manifests,
asset registry, stage directions and toy adapter. “Present” means material exists,
not that a creator has accepted its quality. Historical screenshots/reviews are
context, not current visual/listening evidence.

## Starting inventory

| Book         | Current reading content                                                       | Art and staging                                                                                                                             | Recorded audio and toys                                                                              |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Eden         | Eight spreads, two segments each; Genesis 2–3; nine locales                   | Eight page paintings; garden/exile theatre plates; Adam/Eve pose atlases and specialized rigs; tree, serpent, painted garden floor          | Sixteen narrated phrases per locale, procedural ambience/effects; Adam, Eve, tree compatibility toys |
| Noah         | Eight spreads, two segments each; Genesis 6–9; nine locales                   | Eight page paintings; shipyard/boarding/storm/receding-water/shore plates; Noah rig, family, animal pairs, ark, waves, dove and other props | Sixteen narrated phrases per locale, procedural ambience/effects; Noah, ark, dove compatibility toys |
| Jonah        | Three spreads with one sentence each; source notes cite Jonah 1–4; en-US only | Five PNGs: shore/cover, sandy ground, Jonah cutout, whale cutout, underwater backdrop; generic placement/motion/interactions                | No narration recordings, soundtrack or toy definitions                                               |
| Quiet Garden | Two spreads, four segments; Genesis 2:4–25; en-US only                        | Seven registered image entries reusing Eden art, separate floor/backdrop and atlas cutouts                                                  | Four reused Eden narration clips; no soundtrack or toys                                              |

Eden/Noah text lives in `public/content/<locale>.json`; their cues live in
`public/audio-manifest.json`. The retained pack has 315 phrase/name clips across
nine locales, including character-name audio. Their stage direction is in
`src/stage-direction.ts` and artwork-specific runtime modules.

Jonah and Quiet Garden are authoritative JSON documents in `public/books/`.
All four are registered in `public/books/catalog.json` and belong on the shelf.
The [architecture](architecture.md) explains the two runtime paths. Preserve the
legacy adapter unless a future, separately justified migration can retain its
visual behavior, source text and all locales.

## Shared quality bar and evidence

A showcase book is accepted as an entire reading experience, not as a passing
schema or a collection of attractive isolated images.

| Area               | Acceptance evidence                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Story              | Complete, age-appropriate narrative with sensible page breaks; each spread has an identified source; retelling and invented staging are explicit; creator checks the full sequence           |
| Art continuity     | Same recognizable characters, proportions, garments and palette across cover/spreads/toys; no accidental duplicate actors; creator inspects scene sequence                                   |
| Composition        | Readable text on phone and desktop; uncluttered stages; faces and key actions clear of UI, gutter and page edges; grounded cutouts                                                           |
| Image preparation  | Clean backgrounds and true-alpha edges, no halos/clipped limbs, intended crop/atlas frames; source art and reviewed runtime derivatives retained                                             |
| Motion/interaction | Purposeful, restrained cues with no floating/drifting; all meaning survives reduced motion/mute; labeled keyboard/touch actions; no gimmick required to understand the passage               |
| Narration          | Every intended en-US segment has exact current recorded text and measured duration; creator listens to every cue in context for names, clarity, emotion and pacing                           |
| Sound              | Narration remains intelligible; purposeful soundtrack/effects and smooth range/fade behavior; no clipping, stuck audio or inappropriate cheerful treatment of grave scenes                   |
| Shelf identity     | Legible cover/spine, suitable cover image, relevant book-specific toys with accessible labels and useful feedback                                                                            |
| Access and reading | Keyboard/touch navigation, mute/volume/speed, language behavior, reduced motion, usable desktop/phone layout and honest missing-resource feedback                                            |
| Static delivery    | All required files served from the nested production path without credentials, localhost or generation services; reviewed publication inputs/output; fresh profile sees the intended catalog |

Automated tests establish schema, references, measurements and exercised behavior.
Visual inspection establishes what the current scene actually shows. Listening
establishes what was heard. Creator approval establishes which editorial/art/audio
choices were accepted. Record these separately; never label a translation, voice,
pronunciation or theological interpretation approved because a test passed.

Use the [visual guide](../../../styles/little-light-library/README.md) and
[editorial record](editorial.md). The current audience baseline is shared reading
with a caregiver for ages 4–8. Confirm any change in audience or theological
treatment before rewriting. Do not picture God as a human figure or invent
Scripture dialogue as if quoted.

## Adam, Eve, and the Garden

### Existing material to preserve and reuse

The eight beats in `public/content/en-US.json` are garden/Adam, Eve/command,
temptation/eating, hiding/blame, consequences, clothing/expulsion, life outside
Eden and a forward-looking closing reflection. Each page has a source locator,
two stable phrase IDs and corresponding en-US narration.

Reusable art includes `public/assets/art/eden-01.webp` through `eden-08.webp`,
`eden-tree.webp`, `adam-figurine.webp`, `eve-figurine.webp`, and theatre
`garden.webp`, `exile.webp`, `garden-floor.webp`, `adam-poses.webp`,
`eve-poses.webp` and `serpent-branch.webp`. Inspect the source/editable
counterparts before replacing a runtime derivative. Existing rigs and serpent
acting supply behavior that generic whole-card motion does not reproduce.

### Known gaps and review needs

- **Story:** All main beats exist. The closing reflections and the offspring/
  promise wording need explicit creator editorial/theological review; current
  agent review is not that approval. Check that consequences, shame and exile
  remain clear without introducing a new doctrinal claim or adult detail.
- **Artwork:** The current paintings/rigs exist, but consistent appearance,
  background duplication, edge quality, phone framing and tonal progression
  have not been accepted as a complete showcase sequence. Fresh inspection is
  required; historical quality concerns are not automatically current defects.
- **Narration:** The sixteen en-US cues exist and have measurements. Pronunciation,
  names, pacing, warmth and emotional progression need complete listening review.
  Text revisions should regenerate only the corresponding cues.
- **Audio:** Existing procedural ambience/taps supply a starting point. Review
  whether sorrow/consequences/exile receive a suitably restrained mix. A new
  soundtrack is optional if the current sound meets the story's needs.
- **Animation/interactions:** Retained specialized gestures/creature responses
  are available. Check their purpose, grounding and continuity at every page
  transition and with motion disabled; do not turn the temptation into a reward.
- **Shelf:** Adam/Eve/tree toys already exist. Review their legibility, relevance,
  labels/audio and cover/spine presentation in the actual four-book collection.

### Available support, blockers and sequence

There is no known missing engine capability that blocks a complete Eden reading.
The blockers are creator decisions and evidence: accepted en-US words, art
continuity, listened narration, sensible staging and end-to-end review. A generic
migration, custom rig authoring or a new cover-layout system is optional.

1. Read and listen to all eight existing en-US spreads; record a page-by-page
   keep/change decision with source references and concrete issues.
2. Obtain creator agreement on any text/theological changes before media work.
   Preserve stable IDs and all existing locales; flag affected translations for
   later review rather than silently rewriting or deleting them.
3. Fix only selected art/layout issues while retaining suitable existing rigs.
   Replace affected narration after words settle; review gesture timing and mix.
4. Review cover/spine/toys, then the full sequence on phone and desktop.
5. Run relevant content/audio/static and room regression checks and present the
   full English reading for explicit creator approval.

### Book-specific acceptance

All eight beats are understandable in order; the command, disobedience,
consequences, care in clothing and loss of Eden remain legible. The ending's
interpretive choices are identified and accepted by the creator. No invented
visual detail is presented as Scripture. Adam/Eve remain recognizable and planted
through every transition, and the serpent/other interactions serve the scene.
All sixteen current English cues have been heard in context. Existing nine-locale
functionality is preserved, and any newly stale translated content is explicitly
tracked rather than described as freshly approved.

## Noah and the Great Flood

### Existing material to preserve and reuse

The eight beats are corruption/judgment, building, boarding, flood, falling
waters/birds, a changed world, altar/covenant and rainbow remembrance. Stable
`noah-01`…`noah-08` pages have two segments each and recorded narration in
every existing locale. `noah-06/s2` explicitly acknowledges drowning outside
the ark; this is an existing editorial boundary, not a new cleanup addition.

Reusable art includes `noah-01.webp`…`noah-08.webp`, `noah-wave.webp`,
`noah-figurine.webp`, and theatre `shipyard.webp`, `boarding.webp`,
`storm-open-water.webp`, `storm.webp`, `receding-water.webp`, `shore.webp`,
`noah-poses.webp`, `ark.webp`, `family-seven.webp`, `animal-pairs.webp`,
`dove-olive.webp` and `timber-bench.webp`. The legacy scene also supplies
waves, ark, family, dove, altar/rainbow staging and procedural sound.

### Known gaps and review needs

- **Story:** The complete sequence exists. Creator review must confirm seriousness,
  compassionate age suitability and the connection between judgment, rescue and
  covenant. Verify bird/water chronology and avoid making the rainbow a reward
  game or implying destruction is forgotten.
- **Artwork:** Inspect ark scale relative to people/animals, family continuity,
  clean silhouettes and readable storm/aftermath scenes. The ark should remain
  a massive shelter; existing art is reusable but not automatically showcase-ready.
- **Narration:** All sixteen English cues exist. Listen to the entire narrative,
  especially `noah-04`, `noah-06/s2` and covenant language. Ensure pacing and
  tone do not trivialize danger or loss.
- **Audio:** Storm/ambience must stay beneath narration and transition into a
  solemn aftermath and hopeful covenant. Confirm mute and reduced motion retain
  the story's meaning; do not add loud or startling effects by default.
- **Animation/interactions:** Existing ark/water, Noah gestures and dove behavior
  need in-context inspection for scale, grounding, peak poses, page clearance and
  relevance. Richer animal animation is optional.
- **Shelf:** Existing Noah/ark/dove toys are a useful set. Review clear silhouettes,
  names, click response/audio and cover/spine legibility at phone size.

### Available support, blockers and sequence

The retained renderer supports this book's specialized scenes; no new engine
feature is a prerequisite. The real blockers are accepted storytelling/tone,
asset quality where current review finds problems, listened English narration
and observed static/mobile performance. New physics, storm simulation, rig
authoring and full generic migration are optional and should not delay the book.

1. Review all eight beats and their Genesis 6–9 references, focusing on grave
   events and the caregiver reading experience; obtain creator text/tone decisions.
2. Audit existing art and staging as a sequence, including ark scale and the
   transition from storm to aftermath. Keep passing material.
3. Make bounded content/media changes; regenerate only changed English cues.
   Preserve all existing translations and record any resulting review debt.
4. Tune only identified animation/mix issues, then review shelf identity and
   all pages with normal/reduced motion and mute.
5. Complete full English listening/creator review, nested static checks and
   repeated swaps against the other catalog books.

### Book-specific acceptance

The scale and seriousness of the flood are clear, with non-graphic, restrained
treatment of loss. The family/animals, falling waters, birds, altar and covenant
form a coherent story. The creator explicitly accepts the sensitive wording and
visual treatment, including `noah-06/s2`. Motion and sound neither obscure
speech nor turn danger into a cheerful ride. All sixteen English cues are
current, measured and heard in context. All retained locales remain available,
with any post-edit translation gaps recorded honestly.

## Jonah and the Whale

### Existing material to preserve and reuse

[`jonah-and-the-whale.book.json`](../public/books/jonah-and-the-whale.book.json)
has three spreads: `jonah-called` (Jonah 1:1–3), `jonah-rescued`
(Jonah 1:17–2:10), and `jonah-mercy` (Jonah 3:1–4:11). Each has one segment.
The text describes fleeing the call, rescue/prayer and Nineveh receiving mercy.

Five images under `public/assets/art/jonah/` are registered:
`jonah-shore.png` (also the cover), `sandy-ground.png`,
`jonah-cutout.png`, `whale-cutout.png` and `underwater-backdrop.png`.
Useful sources also exist under `assets/art/jonah/`. There are opening rock
motions, one narration-triggered whale motion and labeled interactions. There
are **zero narration recordings, zero soundtrack layers and zero toys**.

### Known gaps and review needs

- **Story:** This is a brief draft, not a finished telling of Jonah 1–4. It omits
  the storm/sailors/casting into the sea as narrated beats, compresses the prayer
  and second call, and does not narrate Jonah's anger or the plant/God's final
  question. The retelling note describes Jonah “choosing mercy”; that resolution
  needs creator/source review rather than assumption. Decide the intended scope
  and ending before deciding page count.
- **Terminology:** The title says Whale, while source references/text use great
  fish. Keep the supplied title during cleanup; future creator review should
  settle how title, illustration and retelling acknowledge this distinction.
- **Artwork:** Existing shore, underwater, Jonah and fish images can anchor a
  consistent set. A Nineveh scene is not registered: the last staging note asks
  for a city horizon but reuses the shore backdrop. Storm/boat, prayer or final
  teaching scenes need suitable art if included in the accepted story sequence.
  Inspect alpha edges/crops and reuse only assets that pass.
- **Narration:** All three present cues are missing. Final accepted English text
  needs recordings and measurements; the narration-triggered rescue motion has
  no spoken timing to follow yet. Do not create dummy durations or relabel other
  books' audio to clear warnings.
- **Audio:** No soundtrack exists. A restrained sea/storm/prayer treatment may
  help, but narration can be completed first. Optional effects/music require
  suitable local media, rights and mix/listening review.
- **Animation/interactions:** The generic card motions/buttons already work.
  Reassess invented interaction responses against the source and tone; place
  essential meaning in the narrative. A swimming rig or animated atlas is not
  required to make the story readable.
- **Shelf:** The shore image supplies a provisional cover. Review a clearer
  final cover/spine and add a relevant small toy set, such as Jonah and the
  great fish, from accepted art with restrained feedback.

### Available support, blockers and sequence

The existing JSON contract can express a complete illustrated/narrated Jonah:
arbitrary spread count within bounds, cutouts, ground/backdrop, measured phrases,
motion triggers, soundtrack ranges and toys. No Jonah-specific renderer branch
is needed.

Genuine blockers are a creator-approved story scope/ending, missing scene art
where required by that outline, missing English narration, complete composition
and creator review. Optional improvements include anatomical fish/character
rigs, continuous scene travel, custom interaction audio beyond the built-in tap,
localized toy labels and a cover-composition system. If one becomes a firm
creative requirement, scope a reusable capability separately before adding it.

1. Review the present three spreads and agree the complete English outline,
   age/tone, title/great-fish convention and treatment of Jonah's unresolved
   response to mercy. Do not quietly convert a sketch into an invented ending.
2. Expand/revise the JSON only within that accepted scope. Keep useful IDs/assets;
   record source references and invented staging for each added spread.
3. Establish a consistent Jonah/fish/setting reference set, then create only
   missing art. Replace provisional shore-as-city staging if the story retains
   Nineveh. Review backdrop/ground/cutout edges and phone composition.
4. Produce and listen to one representative voice passage, then synthesize the
   accepted English segments with the local workflow. Measure and attach every
   cue, preserving truthful provenance; no new translation batch is needed.
5. Align restrained motion with actual cues; add purposeful soundtrack/effects
   if desired. Complete cover/spine/toys using accepted artwork.
6. Validate, inspect and listen through the complete reading, obtain explicit
   creator review, and test the nested static artifact with all four books.

### Book-specific acceptance

The accepted beginning, crisis, prayer/rescue, renewed call, Nineveh and ending
form a coherent reading; any narrower scope is explicitly approved and accurately
described. The title/great-fish distinction and Jonah's response to mercy are
resolved by creator editorial review. Art depicts the described setting instead
of leaving a shore where a city is required. Every final en-US segment has
current measured narration and has been heard in context. Narration gestures
actually follow the right phrases. Cover/spine and relevant toys are reviewed,
and no story-specific renderer code is needed for supported behavior.

## Quiet Garden's technical role

Keep its two spreads, four reused clips, separate ground/backdrop, atlas poses,
narration-triggered rock and tree interaction as a compact regression example.
Its reuse of Eden words/audio is explicitly described in its retelling note.
The serpent prop on the companion spread is invented demonstration staging,
not a canonical new story beat.

Use it or disposable fixtures to verify validation, placement edits, stale cue
diagnostics, selective replacement and catalog loading. Do not expand or polish
it into another showcase, add translations or remove it from the shelf merely
to make the collection appear more finished.

## Milestones and dependencies for the next agent

| Milestone               | Depends on                                                     | Done when                                                                                                     |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Baseline and brief      | Cleanup handoff, committed catalog, current assets and runtime | All four load; existing warnings/limits documented; creator chooses first book and intended scope             |
| Story acceptance        | Source-linked beat audit and creator decisions                 | Full en-US words/page breaks and interpretive choices accepted before final audio                             |
| Art and staging         | Accepted beats, current visual guide, reusable assets          | Consistent complete sequence, cover/spine/toys and phone/desktop compositions inspected                       |
| Narration and mix       | Stable text and local production tools/recordings              | Every final English cue measured/listened, timing/mix/gestures reviewed, no missing/stale English narration   |
| Complete reading review | Integrated story, media and reader                             | Creator reviews the entire book with normal/reduced motion and sound/mute; issues resolved                    |
| Inclusion readiness     | Focused checks, actual static artifact, publication scope      | Catalog/media/room regression passes, nested-path visual/audio evidence retained, publication inputs reviewed |

Take one book through the complete sequence before applying the process to the
others. Eden is a sensible default first review because its existing English
sequence is complete and Quiet Garden exercises related data/assets; creator
priority may differ. Noah then stresses grave-event tone and complex legacy
staging; Jonah proves the generic contract for a full new narrative. This is a
suggested order, not an estimate or a requirement to change every existing asset.

Use `npm run book:catalog`, targeted book validation and `npm run verify:all`
for current automated gates. Strict generic validation is useful for a finished
candidate, but do not fabricate review metadata or demand that preserved draft
Jonah passes strict catalog validation before its feature work. The current
room suite supersedes old footer-targeting acceptance scripts.

Inspect actual pages/transitions on desktop and phone; exercise cover preview,
Return, repeated swaps, table clearance, Library/Continue, toy lifetime, page
turns, language changes, muting, speed, keyboard/touch and reduced motion.
Serve the production build under a nested URL without generation services and
inspect assets/network failures. Hear representative playback during regression
and every final English cue for showcase approval. Record any unavailable
listening or human review explicitly.

Review useful sources/attribution, actual runtime files and the portal's explicit
publication manifest/output digest. Retain only the curated captures/current
small result bundle; follow [retention rules](repository-cleanup.md). Build,
commit and deployment remain subject to the new assignment's scope.

## Decisions still requiring creator input

Before content production, establish first-book priority and whether the current
4–8 shared-reading audience remains right. Resolve any requested changes to the
Eden ending or Noah's sensitive treatment; resolve Jonah's breadth, title/fish
language and ending. Select a voice through actual listening and decide whether
purposeful ambience/music improves each book. Determine whether any desired
acting exceeds the current card/legacy capabilities and merits separate work.

Existing translations are preserved. If future English edits change meaning,
plan native-speaker review and targeted translation/audio repair explicitly;
the English-first milestone must not imply those revisions are already approved.

## Optional reader and architectural improvements

Keep the established room behavior while delivering books. Freshly observed
usability issues should be recorded with a reproducible example, impact and
acceptance criterion, then prioritized separately unless they are regressions.

Possible later work includes lazy generic audio decoding for large books,
localized generic toy labels, improved long-title/phone framing where actual
content exposes a problem, and a carefully scoped reusable rig or interaction
sound extension. A legacy data migration would require matched rendering,
timing, interaction and nine-locale preservation checks. None is a prerequisite
for beginning the current three-book review.

No bedroom redesign, new room interactions, general authoring application,
accounts, cloud storage, collaboration or live hosted generation is implied by
this roadmap.
