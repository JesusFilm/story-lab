# Verification · 2026-09-11

## Library reuse pass · 0.2

- Nine deterministic tests cover the timeline, appearance merging/reset, cue/mobile precedence and validation.
- Browser integration checks cover independent field visibility, hidden-text announcements, per-field font/position, restoring the caption stack, multiple isolated players, cue overrides resetting, responsive container width, custom SVG controls, omitted stock controls and idempotent cleanup.
- The minimal integration runs with game-owned artwork/buttons and no Noah dependencies. Desktop and 390px screenshots were reviewed.
- The Noah playground now exposes live appearance and host-control settings. Existing playback and real audio regression checks pass. A grid minimum-width issue exposed by long scrolling text was corrected; mobile overflow is now an assertion in the browser check.
- A real npm archive was extracted into a separate consumer directory. JavaScript entry points and CSS exports resolve there; a strict TypeScript consumer compiles against the packaged declarations, including expected errors for unsupported options.
- The 17-file archive contains only runtime, declarations, integration docs, agent instructions and the minimal example (about 23 KB compressed). Noah media, source-checkout screenshots and development scripts are excluded.

Remaining platform limits below still apply.

## Original Noah example pass

## Passed

- Six deterministic Node tests: reveal/hold/fade/completion, indefinite manual wait and two-step Next, pause during reveal and exit, loop/replay, per-cue mode overrides, Unicode code-point timing and invalid empty/textless stories.
- Chrome browser walkthrough: both entry modes, full automatic completion, continuous replay, manual Next, pause/resume, chapter jumps and all local image loads. No uncaught JavaScript errors.
- Vertical scrolling with genuinely overflowing text; instant and typewriter presentations. Reduced-motion preference shows full text immediately. A complete static transcript remains available.
- Desktop (1440px) and mobile (390px) visual checks; no horizontal page overflow. Settings remain usable below the player on mobile.
- Aborted image request: loader stays visible, displays the resource failure and offers Reload. All three loading animations are copied; prototype 4 selects Sheep theatre.
- Audio lifecycle with a controlled media double: delayed start, delay frozen during pause, track retained across cues, overlapping crossfade, outgoing track stopped, loop/once flags, excerpt completion, pause/resume, inherited track on seek, silence, replay and teardown.
- Real MP3 playback and volume in Chrome. Pause stops the playback clock. All three files decode: Reverie 223.67s, Hiraeth 346.20s, Childhood 137.15s.
- Immediate pause while a play promise is pending: browser AbortError is treated as cancellation, not a false playback failure. Other audio errors retain retry/muted-reading support.
- Entire prototype copied outside the repository and served under `/nested/demo/`. Both story and playground pages, links, scripts, paintings, loaders and music work without any root checkout resources. No missing-resource responses.

## Repeat

Run `npm test` from the project. For browser checks, serve the repository root on port 8768, install Playwright in a development environment, and run `npm run test:browser` and `npm run test:audio` from this project. Alternatively, point `PLAYWRIGHT_MODULE` to an existing Playwright module and `BROWSER_PATH` to a browser executable. Runtime users do not need Playwright. The scripts leave screenshots in the OS temporary directory.

The executed checks used Playwright 1.62.1 and installed desktop Chrome. Local screenshots are in `checks/`.

## Scope and remaining limits

This is an embeddable browser utility, with a working example and independently runnable copied prototype. It has not been published. Firefox, Safari, physical phones, gamepad input and assistive-technology testing have not been performed. Mobile checks used a resized Chrome viewport, not a physical handset. HTML media looping retains silence encoded in a file and is not sample-accurate looping. It is not a branching dialogue editor, voiceover generator, or native Unity/Unreal package.

Media provenance and attribution are in `examples/noah/assets/CREDITS.md`; image prompts are in `image-prompts.md`. All downloaded media is local. A later public listing still needs the portal's explicit reviewed-file publication process.

### GitHub Pages publication — 11 September 2026

Live cold loading exposed a 20-second image timeout on the paintings. Increased
the preload timeout to 120 seconds and synchronized the standalone prototype.
All nine unit tests passed. The deployed portal-to-Noah playback, appearance
controls, 390px layout and return navigation passed in Chrome with no HTTP errors
or JavaScript exceptions. Public release: `29e20d7cb5229fba5db1b2025c466c6ba3bd6332`.
