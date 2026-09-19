# Repository cleanup and retained evidence

Status: cleaned files passed full scene acceptance; the compact tree is the intended PR and local working copy.

The original prototype PR contained 3,982 changed files totaling 2,233,728,348 bytes
(2.08 GiB of file content, not compressed Git storage). Of these, 3,334 files and
1.83 GiB were iteration evidence: mostly repeated screenshots, videos and result dumps.
The user requested removal from both the PR history and local storage, without an archive.

## Retained

- All runtime source, tests, scripts, locale content and assets used by the current reader.
- All 315 narration/name clips referenced by the current audio manifest. Eleven superseded,
  unreferenced recordings were removed.
- Original artwork, editable model sources, generation prompts, attribution and style guides.
  Source assets and optimized runtime copies serve different purposes and remain independent.
- Written quality reviews, the cycle log, ADRs and the agent/authoring handoff.
- Six selected screenshots in `docs/captures/`: room, Eden, flood and aftermath at desktop
  size, Eden on phone and flood on tablet.
- One compact verification bundle in [review/latest](../review/latest/).

## Removed

Raw before/after images, recordings, repeated result dumps, excess presentation captures,
obsolete audio, generated build/test output and temporary iteration files were discarded.
No local archive or backup branch of that data is retained. Historical report text describes
the reviews performed at the time; it is not evidence that removed captures remain available.
Historical commit IDs and raw capture paths in the cycle log are no longer recovery links.

The feature branch is squashed onto the current remote base to exclude discarded artifacts
from the history proposed for merge. The old local `main` pointer contained the same prototype
commits and is returned to `origin/main`; unrelated branches are preserved. Unreachable local
Git objects are pruned after updating the PR. This does not control GitHub's retention of
previously uploaded objects or old PR views.

## Keeping future runs small

Generated review folders are ignored. Preserve only a current result summary in `review/latest/`
and the six selected screenshots. The complete acceptance scripts can still generate temporary
captures for a specific investigation, but they are not permanent source deliverables.

After copying the current acceptance results into `review/latest/`, run:

```sh
npm run clean:generated
```

This removes other review folders, non-selected presentation captures, `.test-output/` and
`dist/`. It preserves installed dependencies, runtime assets, authored sources, written history
and curated evidence. Build again with `npm run build` when a deployment artifact is needed.

The cleanup changes no renderer, story text, playback code or active audio. Verification of
the cleaned tree must include `npm run verify:scene`, manifest/reference checks and the existing
publication checks. Listening and perceived continuous-motion limitations remain unchanged.

Verification completed: all 56 tests and the complete scene acceptance suite pass. The
publication manifest check and four local-only publication tests also pass. Exactly 315
WAV files match the audio manifest. All local links in the agent entry point and prototype
Markdown documentation resolve after removing references to discarded evidence.
