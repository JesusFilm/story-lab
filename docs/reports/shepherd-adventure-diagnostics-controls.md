# Shepherd Adventure diagnostic-control cleanup

Date: 24 September 2026

This report records the focused cleanup prepared for [PR #15](https://github.com/JesusFilm/story-lab/pull/15).

## Scope review

Before editing, the PR head was `84acd45` on `ops/j061-auto-quality`. The
Shepherd Adventure entry contained exactly two `data-diagnostics-export`
controls: one in the loading overlay and one in the pause dialog. The only
runtime wiring for those controls was the `DOMContentLoaded` loop in
`src/startup.js`, which serialized `report()` into a browser download.

The review also confirmed that the following diagnostic surface is independent
and remains intact:

- `?diagnostics` still enables startup instrumentation.
- Startup marks, failures, long-task/frame-gap/input/resource collection and
  the opt-in report remain in `src/startup.js`.
- `window.shepherdStartup.report()` remains the programmatic JSON-report API.
- Quality URL overrides still require `?diagnostics&quality=...`; automatic
  mobile/desktop selection is unchanged.

## Changes

- Removed both Save diagnostics buttons from `index.html`.
- Removed the now-unused `.loading-quality` wrapper and rules from the loader
  stylesheet.
- Removed only the DOM button click/download wiring from `src/startup.js`.
- Updated the Shepherd Adventure README to describe programmatic diagnostics
  rather than promising a user-facing download button.
- Regenerated the portal output inventory and updated the reviewed source hashes
  for the changed published HTML, CSS and JavaScript.

No assets, quality variants, telemetry/instrumentation, unrelated review
controls or startup/mobile test files were changed.

## Validation

- `npm run build` — passed; portal output contains 950 files.
- `npm test` — passed; publication artifact audit, path checks and sensitive
  content scan passed.
- `npm run test:unit` — passed; 15 Python tests and 11 Node tests.
- Focused built-page DOM assertion — passed for normal and `?diagnostics`
  visits: no diagnostic export button/text or `.loading-quality` element, no
  wrapper CSS, and `window.shepherdStartup.report()` is available.
- `BROWSER_PATH=/snap/bin/chromium npm run test:shepherd-adventure` — passed.
- `BROWSER_PATH=/snap/bin/chromium npm run test:mobile -- --project=android-portrait-dpr3 --project=android-landscape-dpr4` — passed, 6 tests.
- Existing startup-quality suite — passed, 6 tests, using system Chromium
  through a temporary local config that was deleted after the run.
- `git diff --check` and residual diagnostic-control search — passed.

The VM cannot provision Playwright’s bundled browsers because its Ubuntu 26.04
platform is not supported by the pinned installer. Chromium checks therefore
used the approved system Chromium; the WebKit-only project was not run locally.
