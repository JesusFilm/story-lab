# Independent failure and accessibility review

Scope: assembled local prototype, checked with Chrome 153.0.8010.48 through Playwright at 360 × 800 CSS pixels. The reproducible check is `node scripts/failure-check.mjs` from this prototype directory, pointed at a running local server with `LIBRARY_URL` if needed. Raw results are in `docs/failure-results.json`. This review is an agent review of runtime behavior, not family or human accessibility testing.

## Acceptance matrix

| Area                              | Evidence                                                                                                                                                                           | Status |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Startup language choice           | Modal opens at startup with `en-US` selected; keyboard Enter activates it.                                                                                                         | Pass   |
| Keyboard room and reader controls | Keyboard opened a book and settings, escaped settings, used globe, selected Japanese, and closed the language dialog.                                                              | Pass   |
| Language recovery                 | Globe remains available in reader; changing to Japanese updates `html[lang]`, preserves the current spread, and leaves playback paused.                                            | Pass   |
| Muted timeline                    | With audio off, clock advanced about 401 ms over a 400 ms observation and a phrase highlight remained visible.                                                                     | Pass   |
| Missing audio                     | Aborted all WAV requests; story text remained readable. After restoring requests, visible Retry restored the spread paused; Play resumed narration.                                | Pass   |
| Missing page image                | Aborted `eden-02.webp` after entering the room; story text remained readable, visible Retry appeared, and retry after restoring the image reached ready state.                     | Pass   |
| Missing shelf preview             | Aborted `eden-01.webp` on startup; the language chooser and shelf remained usable, including access to Noah. The shelf used its geometry fallback.                                 | Pass   |
| Hidden tab                        | Opening another tab paused playback; returning to the reader kept it paused until Play was clicked. Confirmed on stable production build.                                          | Pass   |
| Reduced motion                    | Browser `prefers-reduced-motion: reduce` was active, story text remained visible, and representative shelf, figurine, header and reader controls measured at least 44 × 44 CSS px. | Pass   |
| Renderer failure                  | Forced WebGL context creation to fail; startup showed a failure notice and visible Retry control.                                                                                  | Pass   |

## Phrase-boundary continuity

`node scripts/continuity-check.mjs` exercised Eden page 1 in all nine locales at all four reading speeds against a stable production build. Each case muted and changed volume midphrase, confirmed the clock continued, paused and confirmed the clock stopped, resumed, and observed when the second phrase became highlighted. The expected boundary was the first recording's duration from `public/audio-manifest.json`. All 36 cases passed the 200 ms onset gate; maximum observed scheduling/display error was **18.7 ms**. Raw samples and measured mute advance/pause drift are in `docs/continuity-results.json`. This is a browser clock and DOM observation, not a listening or pronunciation review.

The final failure suite passed all eight checks on the rebuilt production preview at `http://127.0.0.1:8788/`. The checks exercise real browser input and intercepted asset failures. They do not certify assistive technology announcements, speech pronunciation, image artistic quality, or a physical touch device. Full journey, locale coverage, additional timing and performance evidence belong to the integration review.

The root consolidated rerun also passed on the nested static deployment path. Its 36 continuity cases had a maximum scheduling/display error of21.34ms (the18.7ms above is the independent earlier run); raw JSON contains the latest measurements.
