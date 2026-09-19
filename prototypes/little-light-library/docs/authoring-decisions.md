# Authoring foundation decisions

This milestone implements the direction in `book-authoring-direction.md`. The previous
quality-improvement effort remains parked. No existing book or bedroom aesthetic was revised.

## Relevant architecture audit

The localized manifests already provide book text, titles, source references and image paths.
`Narration` decodes static clips and `PlaybackClock` uses their measured lengths for both
playback and phrase highlighting. Page-turn identity already accepts arbitrary story strings.

Composition is different: `stage-direction.ts` and the legacy branch of `LibraryScene.spread`
encode page-specific actors, props, floor selection and poses. Anatomical rigs depend on
particular artwork. The shelf has two physical covers and three figures; legacy schemas,
audio tooling and navigation assumed two books and eight spreads.

The new `page.authored` adapter feeds a generic stage through the same loading, folding,
printing and reading lifecycle. Existing books keep their manifests, rigs and nine locales.
Reader navigation now takes the actual spread count. Drafts open through Author rather than
adding editable shelf furniture. This avoids a wholesale migration or story-ID renderer branches.

## Deliberate tradeoffs

- **One JSON format for both authors.** Closed objects reject typos and unknown behaviors.
  Validation has shared structural/reference rules, CLI file checks and browser decoding.
- **Small bounded motion vocabulary.** Horizontal atlas poses and anchored whole-card `rock`
  are configurable. Limb rigs, arbitrary scripting, camera composition and custom sound/music
  tracks remain unsupported. Existing anatomical rigs are preserved for legacy books only.
- **One locale per draft.** The imported text keeps its own locale while reader controls use
  the user's chosen UI locale. No implicit translation or content fallback. The authoring UI
  is English for this milestone.
- **Preview before installation.** Drafts live in session memory with up to ten validated
  snapshots and undo. They never replace the built-in library. Source files or exported JSON
  are the durable copy; there is no account, autosave database or publishing flow.
- **Embedded transport.** Portable JSON embeds runtime images/audio and attribution. It
  requires a compatible static reader, but no agent, synthesis service or credentials.
  Editable source normally uses public-root paths. This is simpler than a ZIP resolver;
  base64 adds size and is not suitable for very large books.
- **Exact recorded text.** Each cue stores the exact words attributed to its recording.
  A text edit derives a warning and disables narration for that spread until repaired.
  The WAV replacement command only updates one cue and adds its asset; it never deletes
  existing recordings. `voice` is descriptive provenance, not an automatic synthesis recipe.
  Validation cannot prove that a creator's recording actually speaks its declared words.
- **No paid generation.** Demo text/audio reuse four existing en-US Eden recordings with
  exact measured durations. Their earlier listening limitation still applies.

A full visual editor remains an open product decision. The next useful phase is a short
creator-led session using real requested edits, then choose a small placement/text/motion
interface over this same contract. Do not begin another autonomous aesthetic loop.
