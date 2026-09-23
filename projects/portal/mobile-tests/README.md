# Shepherd Adventure mobile checks

Run from `projects/portal` after installing the portal and static prototype dependencies:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium webkit
npm run build
npm run test:mobile
```

The suite serves the **reviewed production build**, with requests outside
`/story-lab/` rejected. Every test uses a new browser context. Pixel 7-like
Chromium runs at 393 × 851 / DPR 3 and 851 × 393 / DPR 4; WebKit uses an iPhone 13
portrait viewport and reduced motion. Each gameplay case rotates its viewport.
`BROWSER_PATH` optionally selects a local Chromium executable; CI uses the pinned
Playwright browsers. One worker prevents overlapping large scene allocations.

The opening is displayed and started using touch, then its supported Skip story
control enters the actual running 3D introduction. Tests read WebGL pixels before
skipping that introduction, rotate, walk to the workbench, and assemble/take a lamp
using touch alone. No route jumps, synthetic completion flags, accelerated game
clocks or debug entry are used. Pixel checks require varied illuminated pixels;
HTML overlays cannot satisfy them. A controlled broken-renderer case disables all
WebGL drawing commands while leaving clear operations and HTML intact, verifies
that the pixel criterion fails, and restores drawing to prove recovery.

Model-request failure and real `WEBGL_lose_context` loss must show actionable
reload controls. Reload must return through the story to a rendered game. Healthy
play rejects uncaught exceptions, console errors/warnings, HTTP failures, failed
requests, page crashes and unexpected WebGL context events. Attachments include
render captures, pixel measurements, browser/network logs, context events, texture
upload sizes, viewport/DPR and game state. Playwright retains traces and failure
screenshots; the PR workflow uploads the report and attachments even on failure.

These are desktop browser engines with mobile viewport, touch and DPR emulation.
Chromium uses SwiftShader software rendering. WebKit on Linux is not iOS Safari,
and neither target certifies an Android GPU, driver, memory limit or browser
process surviving an OS-level termination. Physical Android follow-up remains
necessary for the original device-specific symptom.
