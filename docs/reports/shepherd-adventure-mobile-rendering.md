# Shepherd Adventure mobile rendering investigation

23 September 2026. Task branch: `ops/j059`. Base: `d81da00`.

## Evidence and reproduction limits

The supplied Android Chrome screenshot shows a white game area with a small
broken-content icon and the working-looking HTML controls **Find a lamp**, sound,
menu and audio credits. It does not establish whether WebGL, a GPU process, a
compositor surface or another browser component failed. Device model, GPU,
Android/Chrome versions and CSS viewport are unknown; screenshot pixel dimensions
are not a CSS viewport. The original screenshot, including personal browser and
system chrome, was inspected locally and is not included in this PR.

The assigned checkout was older than production. This isolated task branch was
rebased onto current `origin/main` before implementation. The live Pages
`src/village-game.mjs` matched that base byte for byte. The deployed
`/story-lab/prototypes/shepherd-adventure/` entry was fetched and exercised through
the opening diorama in Chromium with touch, 393 × 851 CSS pixels and DPR 3.
It reached the game controls without reported JavaScript/network errors, but a
rendered screenshot timed out after 30 seconds. This is an observed software
rendering limitation, **not a reproduction on Android hardware** and not proof of
the original crash.

No Android device, adb or emulator was available. Browser tests use desktop
Chromium with SwiftShader and Linux WebKit with mobile viewport/touch settings.
The VM runs Ubuntu 26.04; the pinned WebKit package targets Ubuntu 24.04, so the
additional browser checks use the isolated official Playwright 1.55.0 Noble
container. No production deployment was changed.

## Supported causes and changes

The repository's existing measured scene inventory estimated **1,100.2 MiB** of
RGBA texture storage including mipmaps after prior optimizations, with about
100.3 MiB of geometry backing stores. These figures are logical inventories,
not measured GPU residency, and must not be added to JS heap or process RSS.
See [the earlier inventory](../../prototypes/shepherd-adventure/docs/playtest-roadmap/evidence/2026-09-18-memory-optimization/README.md).
Loading that complete scene, compiling its many-light materials and drawing the
global shadow pass posed substantial mobile resource demands.

The launch path also had a confirmed failure-handling gap: it hid the loader
before starting the opening camera, treated asset completion as game readiness,
and did not handle a lost WebGL context after loading. HTML could remain usable
above a missing world. Existing PR smoke coverage checked controls and module
loading, not rendered pixels or touch gameplay.

The mobile budget is selected once using the coarse-pointer media query, so
rotation does not switch resource policies. It caps model textures at 512 px
before upload, uses a DPR-1 framebuffer without multisample antialiasing, omits
real-time shadow maps, and limits point lights to the four nearest active lights.
Moonlight, starlight, nearby amber lamps, original geometry, animations, story and
route remain. Desktop retains its previous rendering settings. Texture resizing
retains material settings and shared sources, closes replaced image bitmaps and
uses a CPU-backed canvas to avoid uploading the original large image just to
resize it. Original asset files are preserved.

The game now renders its first opening frame before dismissing the loader.
WebGL loss, shader failure and render-loop exceptions show a persistent actionable
reload overlay and stop gameplay/audio. Reload recreates the world through the
opening story. Required resource failures, including loader-managed texture
errors, prevent readiness. A killed browser/OS process cannot be recovered by
JavaScript inside that process.

The same inventory method reports **412.2 MiB** for an intermediate 1024 px
mobile budget and **104.2 MiB** for the final 512 px budget, about **90.5% below**
the earlier 1,100.2 MiB estimate. Geometry remains 100.3 MiB. The prepared mobile
scene has 80 texture/image sources; no world frame was rendered behind the
opening. [Inventory and measurement limits](../../prototypes/shepherd-adventure/docs/playtest-roadmap/evidence/2026-09-23-mobile/render-budget.json).
This is a resource-quality comparison, not a matched hardware performance result.
Downloads and geometry are unchanged, and multi-second preparation work remains.

## Verification

The production portal builds successfully; publication verification passes for
771 reviewed runtime files at `/`, `/story-lab/` and `/story-lab-demos/`, including
sensitive-content and dependency checks. Portal unit tests pass: 15 Python tests and 3 Node tests.
Existing route/camera geometry verification reports zero failures and zero hidden
player samples in portrait and landscape; lamp-assembly and story-sequence checks
also pass. Generated historical review snapshots were restored after those tests.

The new [mobile suite](../../projects/portal/mobile-tests/README.md) runs against
the production build at the strict GitHub Pages path. It checks actual WebGL
pixels, touch movement and lamp assembly, high DPR, orientation changes,
required-model failure/reload, real context loss/reload, and a controlled renderer
that only clears its canvas. Browser logs, required-asset failures, game state,
texture-upload dimensions, screenshots and failure traces are retained in CI.
The existing pull-request workflow now installs pinned Chromium/WebKit and runs
this suite, uploading artifacts even on failure.

Final rendering revision **`31d36ae`** passed all **9 mobile CI cases** in
[run 35828071550](https://github.com/JesusFilm/story-lab/actions/runs/35828071550).
Each target passed touch lamp acquisition with rotation/context reload, required
model failure/reload, and the clear-only negative control:

| Target | CSS viewport / DPR | Result |
| --- | --- | --- |
| Chromium Android-like portrait | 393 × 851 / 3, then rotated | 3/3 pass |
| Chromium Android-like landscape | 851 × 393 / 4, then rotated | 3/3 pass |
| Linux WebKit iPhone emulation | 390 × 664 / 3, then rotated; reduced motion | 3/3 pass |

Playwright 1.55.0 pins Chromium 140.0.7339.16 and WebKit. The final WebKit suite
also passed locally in the Noble container (3/3, 5.1 minutes). All CI artifacts
were downloaded and checked: healthy browser logs are empty and every case's
maximum observed texture upload dimension is 512. These durations include browser
instrumentation and are not performance benchmarks. Mobile traversal ends at lamp
acquisition; the complete later route is not claimed as mobile-playtested.

[Persistent captures and evidence](../../prototypes/shepherd-adventure/docs/playtest-roadmap/evidence/2026-09-23-mobile/README.md)
include visually inspected portrait/landscape village views, lamp acquisition and
the context-loss overlay. [Machine-readable CI results](../../prototypes/shepherd-adventure/docs/playtest-roadmap/evidence/2026-09-23-mobile/verification.json)
record all nine outcomes and pixel/upload samples. The original phone screenshot
is excluded.

The CI run publishes `shepherd-adventure-android-portrait-dpr3`,
`shepherd-adventure-android-landscape-dpr4` and `shepherd-adventure-webkit-iphone`
(14-day retention). They contain the HTML report, screenshots, logs and state;
failed cases retain traces and failure screenshots. Local artifacts remain at
`projects/portal/playwright-report/index.html` (WebKit) and
`projects/portal/test-results/ci-{android-portrait,android-landscape,webkit}/`
(downloaded CI reports). Final documentation/capture commits do not change the
validated runtime or test suite.

Draft PR: [#13](https://github.com/JesusFilm/story-lab/pull/13), created using the
confirmed `jaco-brink` account. No merge or deployment was performed.

## Remaining physical-device uncertainty

The original phone-specific failure remains unclassified. These changes address
observed resource demands and a reproducible missing-error-state path; they do
not certify every Android GPU/driver. Follow up on an actual Android device with
its model, OS/Chrome versions and CSS viewport, checking cold launch, lamp
assembly, rotation, background/resume and later village scenes. No claim of
physical Android verification or production deployment is made.
