# Mobile rendering evidence — 23 September 2026

[Investigation and final validation report](../../../../../../docs/reports/shepherd-adventure-mobile-rendering.md) ·
[Draft PR #13](https://github.com/JesusFilm/story-lab/pull/13) ·
[Resource inventory](render-budget.json)

These are actual production-build gameplay captures from the local Playwright
1.55.0 Noble container, Linux WebKit, iPhone 13 emulation, DPR 3 and reduced motion.
The viewport is 390 × 664 CSS pixels initially, then 664 × 390 after rotation.
They are saved at CSS resolution and contain no personal browser/device chrome.
They are not physical iOS or Android captures. No route jumps or debug staging
were used: the test started the diorama, skipped into the running introduction,
then used touch to walk to the workbench and assemble/take the lamp.

- [Portrait entry](webkit-portrait.png): the shepherd and village render behind Find a lamp.
- [Landscape entry](webkit-landscape.png): the same scene remains rendered after rotation.
- [Lamp acquired](webkit-lamp-acquired.png): touch-driven progress reaches Try the first house.
- [Context loss](context-loss.png): real `WEBGL_lose_context` injection produces a visible reload action. The automated reload returns through the story to a rendered game.

Visual inspection confirmed legible village silhouettes, the shepherd and warm
lamp light at the final 512 px texture budget. Mobile real-time shadows and MSAA
are disabled. Appearance at later scenes and physical-device performance remain
unassessed; no human player acceptance is inferred from these checks.

The full CI artifacts include Android-like Chromium portrait/landscape captures,
WebKit captures, browser/network logs, texture upload dimensions, pixel metrics
and failure traces. Follow the run links in the report. The supplied original
Android screenshot is intentionally excluded from this repository.

Android-like CI captures from run [35828071550](https://github.com/JesusFilm/story-lab/actions/runs/35828071550),
Chromium 140.0.7339.16 / SwiftShader on Ubuntu 24.04, DPR 3:
[393 × 851 portrait entry](android-emulation-portrait.png) and
[851 × 393 rotated lamp acquisition](android-emulation-lamp.png).
All three Android portrait tests passed. These were visually inspected and show
the same intact scene and touch outcome; they remain desktop emulation evidence.

[All nine final CI results](verification.json) were downloaded from the run and
checked: every case passed, healthy browser logs were empty, and texture uploads
never exceeded 512 px. The local final WebKit run also passed 3/3 cases.

To repeat the scene inventory, open the production entry with `?profile`, leave
the diorama displayed until `routeRehearsal.getState().ready`, then call
`shepherdMemory.mark('mobile-prepared-inventory')` and inspect
`shepherdMemory.report().samples.at(-1).owners.world.graphics`. This measures the
prepared scene's logical resources before the first world render, not GPU residency.
