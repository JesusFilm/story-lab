# Book authoring — next-phase direction

Status: user intent captured after the quality-iteration phase. Discovery and implementation
have not begun. This is not a finalized format, editor design or instruction to start building.

## Product intent

Turn the knowledge used to handcraft these two books into a repeatable way for people to
create their own interactive illustrated stories. A creator should be able to author an
entire book manually, ask an agent to help, and move freely between those modes. Both should
work on the same editable book definition, with the same preview and validation rules.

The central activity is storytelling through text, images, narration, other audio cues,
dimensional staging and meaningful motion. The likely first users are the current creator
and other biblical storytellers in Christian ministry. Preserve the distinction between
Scripture references, authored retelling and invented visual staging. Do not assume every
future book must inherit the present two books' length, characters or nine-language scope.

Human steering is a product requirement: “move this character back,” “keep the floor painted,”
“make that gesture quieter,” or “this moment should feel serious” should become understandable,
targeted edits. Preview a small change, let the creator judge it, and preserve or revise it.
The aim is to shorten the gap between intention and result. Autonomous scoring is historical
evidence, not a substitute for the creator's taste or an authoring workflow to impose by default.

## Shared vocabulary to establish

These are proposed creator-facing terms, not new API fields. Define their exact units and
behavior when designing the contract; existing code sometimes uses different names.

| Term | Meaning for a creator |
| --- | --- |
| Book | An ordered story with a cover, metadata, language versions and spreads. |
| Spread | One open-book scene and its reading content. Existing code calls this a `Page`. |
| Backdrop | The upright scenic image that rises when a spread opens. |
| Ground print | Optional artwork printed on the horizontal page surface, with placement/cropping rules. Distinct from the backdrop. |
| Cutout / prop | A separate illustrated object placed in depth on the spread; may be static or animated. |
| Character / actor | A named scene subject with artwork, poses and optional acting/interaction. Creatures can be actors too. |
| Placement and anchor | Where an element sits, its size/orientation and the point that stays attached to the page or support. |
| Pose and rig | A pose is an illustrated stance; a rig defines which parts can move and their pivots. A new image does not automatically have a working rig. |
| Motion cue | A named action with a trigger, duration, strength and repetition/hold behavior; distinguish idle acting from narration-linked and touch-triggered actions. |
| Interaction | What selecting an element does, including visible/audio feedback and a keyboard equivalent. |
| Audio track / cue | Narration, ambience/music or an effect, with its own trigger and mix behavior. Narration also supplies the measured follow-along timeline. |
| Stage direction | The composition and behavior of a spread: elements, depth, framing, moods and cues. |

For example: “On spread 2, use this dusk backdrop and a grass ground print; place Miriam left
of the tree, keep her feet anchored, and raise her hand once during the second narration
phrase. Tapping the tree plays a rustle.” This is an illustration of the desired communication,
not a claim that the present renderer can import that instruction.

## What exists, and what must become editable

The [TypeScript contracts](../src/contracts.ts) and [JSON schema](../scripts/story.schema.json)
describe localized text and image references. They constrain the existing story IDs and
characters; the schema requires two books, eight spreads each and two segments per spread.
[Locale files](../public/content/) and the [audio manifest](../public/audio-manifest.json)
hold durable content and measured clip durations.

Much of the visual book is still authored in code: [stage-direction.ts](../src/stage-direction.ts)
selects poses, layout and special props; [scene.ts](../src/scene.ts) constructs those scenes;
[garden-floor.ts](../src/garden-floor.ts) handles the selected painted-floor treatment;
[paper-actor.ts](../src/paper-actor.ts) and [paper-creature.ts](../src/paper-creature.ts) contain
artwork-specific motion. [main.ts](../src/main.ts) selects sound moods by story/page and
[soundscape.ts](../src/soundscape.ts) produces the procedural mix. A general importer is absent.
Shelf construction also assumes the current books/figurines, and [state.ts](../src/state.ts)
and the application navigation assume eight spreads. Existing behavior is valuable reference
material, but these special cases must be audited
before promising that an arbitrary book is data-driven.

## Proposed contract responsibilities

Define a versioned book package that the reader can validate and consume independently of
the editor's location. Resolve at least the following in the first design pass:

- Stable book/spread/element IDs, ordering, cover and metadata, source references, supported
  locales, and explicit missing-content behavior.
- Asset references and packaging: images with alpha/crop information, ground prints, audio,
  reusable actors/props and required attribution; distinguish editable sources from runtime derivatives.
- Composition: coordinates/units, dimensions, depth, anchors, layering, framing and folded-page
  bounds, including readable phone layouts.
- Behavior: supported poses/rigs, motion presets and tunable parameters, triggers, interactions,
  sound cues, and reduced-motion/static alternatives. Prefer a bounded supported vocabulary
  initially; arbitrary scripts and a general rig editor are not prerequisites.
- Narration and text: segments, measured cue durations, voice/language metadata and the shared
  playback clock. Text edits must identify stale recordings and highlights rather than silently
  reuse mismatched audio. Preserve reusable synthesis described in [audio.md](audio.md).
- Validation/import: useful errors for missing assets, unsupported behavior and invalid references;
  version compatibility; a preview before installing/replacing a book; reversible edits and
  repeatable export/import without losing authored settings.

These are design questions and responsibilities, not a requirement to ship every capability
in the first milestone. Keep authoring/generation tools separate from playback requirements:
reading an exported book must remain possible without a running agent or synthesis service.

## A practical starting milestone

1. Inventory what is currently data versus renderer code. Draft a small authoring contract,
   glossary and capability list, with a migration plan for the existing books. Keep the visual
   editor's location open until the authoring workflow is clearer.
2. Prove the contract with a small new two-spread book. Include a backdrop, optional ground
   print, several separately placed elements, one tunable action, one interaction, text and
   measured narration. Import it into the reader without adding a story-ID branch to the
   scene code. Reuse supported assets/rigs where appropriate to keep this test focused.
3. Demonstrate the human edit loop: change placement, ground artwork, gesture timing and text;
   preview the result; identify/regenerate affected audio; undo an unwanted edit; validate and
   re-import. Show that a manual edit and an agent-authored edit use the same format. Keep the
   existing books working.
4. Use that experience to choose the smallest useful editing interface. It could begin as
   structured files plus an agent instruction set and reader preview, then grow into an embedded
   authoring mode or a separate application. Do not let a full visual editor delay the contract proof.

Success for this milestone is an end-to-end authoring path and precise creator control, not
another autonomous polish pass on Eden, Noah or the bedroom. Accounts, collaboration services,
marketplaces and publishing workflows have not been requested for this phase.
