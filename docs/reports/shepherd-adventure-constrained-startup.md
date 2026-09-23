# Shepherd Adventure: constrained startup and quality tiers

23 September 2026 · J060 · implementation and measurement in progress.

## Scope and observed report

The Samsung Galaxy A50 report is that the game freezes before the opening diorama
is visible, with a loader running beyond 100 seconds and resource counts above
100. The phone uses Wi-Fi on a **reported 4 Mbps internet line**, not measured
4 MB/s throughput. Exact RAM variant, Android/Chrome versions, latency, upload
speed, competing traffic and tested revision remain unknown. None blocks this
investigation. The earlier screenshot separately shows white game content with
HTML controls and a broken-content icon. These are not assumed to be the same
failure stage, nor proof of a particular GPU/process failure. The attachment was
inspected privately; no phone/browser chrome is published.

This isolated branch was fetched and rebased onto `origin/main` at `0d87b83`,
including PR #13. The live `src/village-game.mjs` matched that revision byte for
byte (SHA-256 `5479b351660aea39343f502b143154ee27a6a30edac4a050f030e6a5d1997e51`).
The latest successful Pages run at investigation time was
[35830652117](https://github.com/JesusFilm/story-lab/actions/runs/35830652117),
head `0d87b834f87e64cb5c696ce4d1217887c855c3e8`, completed 07:17 UTC.
This does not identify which version the phone tested. No deployment is performed.

## Confirmed architecture and response

The prior boot waited for all opening pictures **and the complete music download**,
then started loading/preparing the entire world two animation frames after
showing the diorama. Its 512 px texture cap ran **after original download/decode**.
The bounded baseline reproduces large startup transfers and CPU/software-renderer
stalls; it does not reproduce an A50 hardware crash. Main-thread timers/resource
counts do not establish that the compositor, input or GPU remains responsive.

This implementation makes the following bounded changes:

- Select a tier once in a classic script before story/model asset requests.
  `minimal` and `low` select self-contained, build-time smaller GLBs and pictures.
  No automatic upgrades or tier oscillation occur.
- Keep the existing immediate, independent HTML loader and pause/reduced-motion/
  retry behavior. The quality control is available even while loading.
- Load/decode at most two story images or GLTF jobs concurrently. Music streams
  after Start and no longer gates the diorama. Do not import/prepare the world
  until the user finishes/skips the scripture. Keep scripture and its navigation.
- Defer the nativity models, animals and bedding until House 9 for small tiers.
  Show a truthful wait and block advancing until that area is ready. Reuse the
  loaded world on replay. Story leases and their object URLs still release on close.
- Reduce texture dimensions, triangles, distant dressing, terrain tessellation,
  grass/pebble/straw counts and light cost. Essential route, actors, animation
  clips, lamp assembly, houses, gates and ending remain. Source assets are intact.
- Asynchronously wait for the first submitted GPU frame with a WebGL fence before
  dismissing the loader, without drawing further world frames during that wait.
  A timeout/context/shader failure remains actionable.
- Export diagnostics only on request. There is no telemetry endpoint.

The small variants use native JPEG/PNG model textures and WebP illustrations;
there is no added runtime Draco, Meshopt, Basis or other WASM decoder. Meshoptimizer
is a **build-only** dependency. Authored animation clips and skinning remain.
For disconnected static topology, the generator can use spatial simplification;
this makes silhouette and close-up review necessary. Derivatives retain their
source hashes and original attribution/licensing alongside the original files.

## Selection and phone test

Use `?quality=minimal` to force **Smallest download**, `?quality=low` for Low,
and `?quality=existing` for Original. A valid explicit choice persists in local
storage. The loader and pause menu offer the same choices and restart the story.
Choose Automatic to clear the override. Storage denial does not prevent a query
choice or startup. Automatic uses memory, core count, connection/save-data hints;
missing memory information conservatively selects minimal. Coarse pointer alone
never chooses asset quality. The selected tier never changes mid-load.

Add `&diagnostics` to enable detailed observations and the Save diagnostics button.
The JSON identifies the content build, selected tier, capability hints, phase and
model timings, image/audio decode spans, long tasks, frame gaps, input queue/paint
latency, failures, resource sizes and optional JS heap. Resource URLs omit query
strings; no personal browser chrome or external telemetry is collected.

A physical A50 test must still establish: cold launch over its actual line;
visible responsive story Start/Next; rendered introduction; lamp assembly;
House 1 response; later route and final-area wait; rotation; background/resume;
replay; and context/error recovery. Record the build ID and diagnostic JSON.
Passing VM approximations does not certify A50 GPU drivers, RAM pressure, thermals,
Android scheduling or sensory/art acceptance.

## Reproducible tools and measurement limits

Build: `cd projects/portal && npm ci && npm run build`.
Generate variants: `cd prototypes/shepherd-adventure/tools/quality && npm ci && npm run generate`.
Generation does not authorize publication-hash updates; review changes first.

`projects/portal/startup-tests/benchmark.mjs` runs pinned Playwright Chromium
140.0.7339.16, mobile viewport 393 × 851, DPR 3, touch, SwiftShader. Its matrix has
fast, 4x/6x CPU-only, network-only at 4/1.6/0.5 Mbps, and combined constraints;
cold and warm runs are distinct. 4 Mbps = **500,000 bytes/s**, 1.6 Mbps = 200,000,
0.5 Mbps = 62,500. Latency is assumed 150 ms (400 ms for the slowest stress case).
Upload is unknown; the harness uses symmetric configured rates as an explicit
assumption, with no substantive upload in this static game.

`startup-tests/server.py` adds unpublished calibration endpoints. A 256,000-byte
uncached probe checks effective network throttling; repeated fixed CPU work checks
slowdown separately. Individual launch deadlines preserve partial results.
Warm after a failed cold run means only the resources actually fetched are warm.
Browser instrumentation and screenshot work add overhead. Initial exploratory
runs overlapped other work and are not claimed as controlled phone estimates.
Final matched runs and CI evidence will be recorded below.

The VM runs Ubuntu 26.04.1, Linux 7.0.0-31, Node 22.22.1, eight reported CPU threads.
There is no attached Android device or adb available. JS heap, HTTP bytes,
decoded image/audio data, logical texture storage, geometry backing buffers and
process RSS are different quantities; none is measured GPU residency or additive
phone RAM. Resource Timing `decodedBodySize` means decoded HTTP content, not RGBA.

## Verification checkpoint

Implementation checks and final measurements are pending; this document is a
working evidence checkpoint, not a completion claim. The earlier nine unthrottled
emulation cases alone are insufficient proof of the requested constrained launch.
