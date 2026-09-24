# Shepherd Adventure automatic quality (J061)

Based on merged PR14, `6cff3720ed473255f9fee249af1e9e191bebbf83`.
No assets regenerated, removed or added; generation and all three tiers remain.

| Initial browser evidence | Automatic tier |
| --- | --- |
| UA Client Hints mobile, Android/iOS platform, phone/tablet UA | Minimal |
| Mac-style UA/platform plus multiple touch points (iPad fallback) | Minimal |
| Linux/unknown platform, multiple touch points, coarse primary pointer and no fine pointer | Minimal |
| Otherwise, including absent memory/network APIs, Windows/ChromeOS touch laptops and small desktop windows | Original (`existing`) |

This synchronous decision precedes media/model requests. The render budget uses
the same tier, stays fixed on resize/rotation, and retains GPU pacing. No stronger
phone promotion: RAM, network and core hints remain diagnostic context, not GPU
performance evidence. The normal loader/menu has no quality chooser. Existing
small-asset routing, deferred preparation, progress and failure/retry remain.

Only `?diagnostics&quality=minimal|low|existing` overrides automatic selection.
Both parameters are required. Overrides survive reload/retry through that URL,
never persist to storage, and stop applying on a normal visit. All legacy stored
choices and bare quality links are ignored. Remove diagnostic parameters before
sharing a normal link. Local diagnostics expose tier, selection and reason; there
is no telemetry upload.

Classification is a heuristic, not reliable hardware identification. [Chromium's
client-hint documentation](https://developer.chrome.com/docs/privacy-security/user-agent-client-hints)
describes low-entropy mobile/platform hints and browser control over availability.
[WebKit documents iPad's desktop identity](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/).
[Chrome desktop-mode tablets can report Linux](https://developer.chrome.com/blog/desktop-mode),
which motivates the combined touch-only fallback. A disguised tablet with an
attached mouse can be indistinguishable from Linux desktop; a touch-only Linux
computer may conservatively select Minimal. Fully masked/spoofed signals cannot
be perfectly classified. Neither width nor coarse pointer alone selects Minimal.
[Device Memory is deliberately approximate](https://www.w3.org/TR/device-memory/);
there is no model-age/GPU lookup, high-entropy query or Original download benchmark.

The user confirmed a full playthrough of **PR14 Minimal / Smallest download** on
Samsung A50 over 4 Mbps Wi-Fi. That is functional evidence only: they judge those
visuals below sharing quality. No physical-device test of J061 has occurred;
this change does not establish visual acceptance or universal phone compatibility.
[Prior evidence](shepherd-adventure-constrained-startup.md) is retained in place.

Verification (local reviewed build at `/story-lab/`):

- `npm run test:unit`: 15 Python and 11 Node tests pass, including A50-like,
  high-hint mobile, tablets/iPad, absent APIs, desktop/touch-laptop, denied storage,
  old saved values, override precedence and pre-load URL selection.
- `npm run build`, `npm test`, `npm run check:publication`: pass (950 exported
  files, 622 reviewed hashes). Only three changed runtime hashes were refreshed.
- Startup cases pass for automatic 4 Mbps/4x-CPU Minimal, story input/music,
  lamp/House 1, no Original visual requests, deferred shelter failure/retry,
  legacy storage and diagnostic Low, missing-table failure, and small desktop/iPad
  image routing. Desktop Original/Low checks additionally pass nonblank pixels,
  asset requests, tier-consistent rendering and desktop resize.
  The desktop fixture initially inherited Playwright's mobile context setting;
  correcting it to explicit desktop identity and `isMobile:false` resolved the
  test failure. Desktop cases were rerun with
  `npm run test:startup -- --grep 'automatic desktop|small desktop'` (2 passed).
  The other four cases passed in `npm run test:startup`.

- `npm run test:mobile`: Android portrait DPR3 and landscape DPR4 pass all six
  cases. Host WebKit could not launch on Ubuntu 26.04 (missing libraries).
  `docker run --rm --user 1000:1000 --shm-size=1g -v "$PWD":/work -w /work/projects/portal mcr.microsoft.com/playwright:v1.55.0-noble npm run test:mobile -- --project=webkit-iphone`
  passes all three WebKit cases using the already-installed pinned image.
  All nine retain nonblank/clear-only pixel, touch, rotation and recovery checks.
- `BROWSER_PATH=<pinned Chromium 1187 executable> npm run test:shepherd-adventure`:
  pass on the public artifact. `git diff --check`: pass.

Browser screenshots/traces remain ignored test artifacts, not new repository
captures. Desktop Safari/Firefox and iPad classification cases use signal fixtures
in Chromium; they do not claim physical-device coverage.
