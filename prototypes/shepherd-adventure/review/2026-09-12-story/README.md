# A story told in changing images

Baseline: clean main b54fdd5d19ef0018a55edea1d2b0a10f23c970d9. User direction:
more images for the scripture, including subtle continuity changes as the heavenly
host gathers and shepherds' fear becomes joy. Follow the Light AA is the style anchor.

Acceptance: the opening distinguishes quiet watch, announcement, reassurance,
gathering, host and departure; every ending passage has relevant art; original
scripture stays intact; local media, retry, cleanup and reduced-motion remain sound.
All pass. Eight original ImageGen illustrations join the existing two. Luke 2:13–14
is split into two passages. The reading text is not duplicated in a speech bubble.

Before/after: Chrome 1280×800 and 390×844; identical scripted Next presses, reduced
motion. The ending comparison is Luke 2:20: formerly Nativity, now returning in praise.
The opening comparison is Luke 2:8: formerly the announcement, now quiet watch.
Source-image continuity was visually reviewed across all eight generated results.
Normal motion uses the vendor's 1.8-second dissolve; still captures alone do not
establish the quality of its motion. Reduced motion cuts directly.

Checks: 12 valid passages / 10 local images and alt text; existing browser lifecycle
suite passes story-first playback, background game preparation, failed-image retry,
mobile/reduced-motion start, media URL cleanup, gate ending prefetch, muted and
blocked audio, and final passage waiting. Browser capture logs have no page errors.
Runtime JPEGs total about 6 MiB; the opening preloads its complete image set, so
cold-start bandwidth grows. Existing foreground loader and retry cover that wait.

Kept based on implementing-agent review. Public runtime files were inspected and
explicitly added to the export manifest; source PNGs and prompts are not exported.
No deployment was performed. The full portal build succeeds with the expanded
explicit image list; the earlier README warning about source-review mismatches
does not reproduce on the current base.

Next question: does the gathering → host transition give the announcement enough
emotional movement when played at its natural reading pace?
