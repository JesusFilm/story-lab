# Little Light Library — agent entry point

Read this file to orient yourself; do not reconstruct the project by reading every review.
The repository's parent instructions still apply.

## Current direction and context routing

The user considers this a successful starting prototype and has **parked the autonomous
quality-improvement effort**. Individual polish concerns are deliberately deferred.
Do not resume that loop, revisit the reference, chase scores, or propose more bedroom
interactions unless the current request calls for them. Historical “next cycle” instructions
are records of earlier work, not an active assignment.

- **New work:** follow the current request and inspect only the relevant implementation.
  Use [README.md](README.md) for setup. Do not import the quality backlog into the task.
- **Book creation/editor work:** start with [the authoring direction](docs/book-authoring-direction.md).
  It records intent, shared terminology, current limitations, open decisions and a proposed
  first milestone. It is a discovery brief, not an implemented editor or approved schema.
- **Explicit questions about the past quality goal:** use [the cycle index](review/README.md)
  to locate relevant rounds, then read only their written reviews and applicable
  [ADRs](docs/adr/). Round 23 is the last retained quality round; its
  [review](docs/quality-review-23.md) summarizes that endpoint.
- **Historical delivery or validation questions:** use [the handoff](docs/HANDOFF.md) and
  [milestones](docs/MILESTONES.md). Their outstanding checks are not automatic new tasks.
- **Current verification:** use [the retained results](review/latest/). These establish
  the checks actually run; historical scores and deleted captures are not current evidence.

## Development phases at a glance

1. **Concept and reference exploration.** A shared family-reading experience in a child's
   room, informed by StoryComet. The [early concept](../../game-concepts/little-light-library/concept.md)
   predates implementation and contains superseded scope; it is not the current specification.
2. **Functional prototype.** Built a standalone TypeScript/Three.js reader with two complete
   eight-spread Bible retellings, nine locales, static phrase narration, synchronized highlighting,
   preferences, startup language selection, shelf figurines and automated acceptance checks.
3. **Quality iteration, rounds 01–23.** Reworked the room, grounding and camera; physical
   opening/turning/folding pages; layered paper scenery and locally acting characters;
   story-specific props, painted ground, touch/keyboard responses and procedural sound.
   Compared reference play and matched evidence, recorded scores and rejected weaker candidates.
   Raw iteration media was deleted and the branch history squashed during cleanup. Written
   findings remain; historical commit IDs and capture paths are not recovery instructions.
4. **Authoring direction, now captured for future work.** Move toward creator-defined books
   and human-guided editing. No editor or general book-import contract has been built yet.

## What the next direction means

Enable a person to create a whole interactive book manually, with agent assistance, or by
mixing the two. The creator controls narrative, text, images, audio, staging, motion and
interaction, using clear names for things and a short edit–preview–steer loop. Likely creators
include the user and other biblical storytellers. The story and its meaning lead the tooling.

The reader needs a documented, validated book contract shared by manual and agent-assisted
authoring. This must cover upright backdrops, optional printed floors, multiple objects and
characters, placement, poses, motion and audio cues. Editor location (inside this prototype or
separate) and UI scope remain open. A full panel of sliders is not a prerequisite; precise
terminology and editable structured data are useful first steps. Do not implement an editor
merely because this direction is recorded here.

## Implementation and evidence boundaries

- Today, [contracts](src/contracts.ts), [localized manifests](public/content/), and the
  [schema](scripts/story.schema.json) cover fixed-book content; [stage directions](src/stage-direction.ts),
  [scene construction](src/scene.ts), actor rigs and sound selection still encode bespoke behavior.
  Adding a JSON story alone does not add a fully supported book.
- Preserve the existing books as regression examples. Keep runtime assets local and independently
  runnable; the reader must not need generation services or credentials.
- Use the [current visual guide](../../styles/little-light-library/README.md) when relevant.
  For biblical content, preserve source/adaptation distinctions from [editorial notes](docs/editorial.md).
- Prior automated checks do not prove subjective quality. Narrator audition/listening and perceived
  continuous-motion assessment remain incomplete; do not claim reference parity or human review.
- Run checks appropriate to the actual change; do not rerun the entire historical review program
  for documentation or unrelated work. Publication remains outside this local prototype task unless requested.

## Generated output retention

Keep only six selected screenshots and the small `review/latest/` verification bundle.
Raw captures, recordings and superseded result files are disposable and ignored. After
verification, preserve the current result summary, then run `npm run clean:generated`.
Do not retain local archives or backup branches of discarded iteration output. See
[the cleanup record](docs/repository-cleanup.md).
If a new visual review is explicitly requested, capture a fresh baseline of the current
prototype. Do not attempt to recover deleted historical media or recreate every old round.
