# J037 — repeatable VM Firefox playability check

Date: 23 September 2026 (NZST). Base: `codex/shepherd-story-rebuild` at
`f6c2c6b504fe4d7a6e01b14748ad726857a8083a`.

## Result

Added `checks/verify-firefox-playability.mjs` and concise run instructions in
the prototype README. The script uses only Node 22's built-in WebDriver HTTP
and WebSocket APIs, the installed Firefox/geckodriver, and the existing Python
server. It starts both processes on free localhost ports unless
`WATCH_GAME_TEST_ORIGIN` points to an existing server. Captures stay under
the prototype's ignored `captures/` tree.

The check waits for `document.visibilityState=visible`, the loading overlay to
hide, the game's asset-loaded `ready` state, a nonzero WebGL 2 canvas and an
active play phase. It drives the opening cues, enters the actual rendered
village, starts the first leg, pauses, resumes and restarts. The ending is
exercised through the documented direct story preview and returns to the
opening. Firefox BiDi collects JavaScript errors and response/fetch failures;
the incidental `/favicon.ico` 404 on the preview page is excluded from
asset/module failures. A nonzero exit reports browser or flow failures.

## Exact verification

From `prototypes/shepherd-adventure`:

```sh
node checks/verify-firefox-playability.mjs
node --check checks/verify-firefox-playability.mjs
```

The first command passed using headed Firefox 155.0.1, geckodriver 0.37.1,
Node 22.22.1 and the existing X display `:0`. The script started its own
`serve.py` process and stopped it on completion. WebGL loading took about a
minute on this VM. The trace recorded 168 browser responses, zero JavaScript
errors and zero failed asset/module requests. The first route leg had
`destination=0`, `phase=walking`; pause set `paused=true`, resume cleared it,
and restart reopened the first story. The ending preview reached `Finish
story`, followed by the opening `Start` control.

Evidence: `captures/firefox-playability/2026-09-23T00-03-53-087Z/trace.json`
and eight PNGs beside it. I visually inspected `03-route-entry.png`,
`04-route-moving.png`, `05-paused.png`, `08-ending.png` and
`09-replay-opening.png`. The route captures contain the lit village,
shepherd and ground, rather than the loading overlay or a blank canvas.
`git check-ignore` confirms the trace is ignored by
`captures/.gitignore`; the PNGs are ignored by the same rule.

## Limits

The natural ten-stop route, lamp assembly, arrival transition, phone layout,
and physical-device performance are outside this smoke check. The ending
preview verifies the diorama and its replay behavior independently of that
route. The scripted state assertions establish operability and save images,
while a human still reviews composition and visual defects in the PNGs.
Headless mode is available with `FIREFOX_HEADLESS=1` but was not used for this
passing run.
