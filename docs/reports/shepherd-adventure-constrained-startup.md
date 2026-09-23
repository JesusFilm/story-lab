# Shepherd Adventure: constrained startup and quality tiers

23 September 2026 · J060 · draft PR [#14](https://github.com/JesusFilm/story-lab/pull/14).

## Scope and observed report

The Samsung Galaxy A50 report is that the game freezes before the opening diorama
is visible, with a loader running beyond 100 seconds and resource counts above
100. The roughly six-year-old phone reportedly runs native 3D apps. This
investigation therefore measures the web startup pipeline and its resource
budgets. The phone uses Wi-Fi on a **reported 4 Mbps internet line**, not measured
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
  dismissing the loader. Continue with at most one GPU frame in flight, polling
  without blocking the main thread; do not queue stale frames on a slow GPU.
  A timeout/context/shader failure remains actionable. Suspended-tab time is
  excluded from the visible GPU stall deadline.
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

This PR has not been deployed. Use its reviewed local build for a preview, or
wait for a separately authorized deployment before testing these parameters on
the public site; the old live build does not implement them. The content build
hash is injected by the portal build; a bare source preview retains an unbuilt
placeholder and is not revision evidence.

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
The local HTTP server and CDP do not reproduce real Wi-Fi jitter, DNS/TLS setup,
CDN caching or production HTTP/2 behavior. Upload is unknown; the harness uses symmetric configured rates as an explicit
assumption, with no substantive upload in this static game.

`startup-tests/server.py` adds unpublished calibration endpoints. A 256,000-byte
uncached probe checks effective network throttling; repeated fixed CPU work checks
slowdown separately. Individual launch deadlines preserve partial results.
Warm after a failed cold run means only the resources actually fetched are warm.
Browser instrumentation and screenshot work add overhead. Initial exploratory
runs overlapped other work and are not claimed as controlled phone estimates.
The final serial matched runs use unchanged content build `bc3f9af281baa357`.
An earlier pass used `8d559bb278606902`, before GPU frame pacing and the extra
native-audio diagnostics; its figures are not mixed into the final table.
The baseline is the separately built merged revision above. See the full matrix
and raw checkpoints linked below; a single observation per cell is not a percentile.

The VM runs Ubuntu 26.04.1, Linux 7.0.0-31, Node 22.22.1, eight reported CPU threads.
There is no attached Android device or adb available. JS heap, HTTP bytes,
decoded image/audio data, logical texture storage, geometry backing buffers and
process RSS are different quantities; none is measured GPU residency or additive
phone RAM. Resource Timing `decodedBodySize` means decoded HTTP content, not RGBA.

## Measured result and recommendation

**Start the A50 playtest with `?quality=minimal&diagnostics`.** Minimal is the
lowest tested playable 3D profile. The main improvement is avoiding large original
transfers/decodes and stopping concurrent world preparation behind the story.
Device hints are imperfect; the persistent explicit choice is the reliable way to
force this phone test. No automatic in-session upgrade or downgrade is attempted.

Primary **reported 4 Mbps**, assumed 150 ms latency, cold browser cache:

| Implementation | Diorama visible | GPU first frame complete | Touch command accepted | Observed HTTP bytes | HTTP requests |
|---|---:|---:|---:|---:|---:|
| Merged PR 13 baseline | 13.08 s | Not instrumented | Failed at 120 s | 51.39 MB by failure | 84 by failure |
| Minimal | 2.47 s | 23.40 s | 23.60 s | 7.95 MB | 107 |
| Low | 3.49 s | 47.82 s | 48.12 s | 18.83 MB | 111 |
| Baseline, plus 4x CPU | 13.41 s | Not instrumented | Failed at 120 s | 30.90 MB by failure | 79 by failure |
| Minimal, plus 4x CPU | 3.19 s | 27.06 s | 27.30 s | 7.97 MB | 107 |
| Low, plus 4x CPU | 3.66 s | 54.47 s | 55.18 s | 18.92 MB | 111 |

These launch timings include starting the story, a screenshot and a fixed two
second observation window, then skipping to the game. They are not the duration
of reading all scripture. HTTP MB are decimal and include canceled music body
bytes. Completed-request-only totals would undercount streaming music by about
0.96 MB in the 4 Mbps cold runs. Unfinished response headers and some aborted Fetch-body chunks are not reported
by CDP. Totals are therefore lower bounds, particularly on failed attempts; the
failed baseline 0.5 Mbps cells report only about 0.25 MB although canceled media
requests were in flight. These are browser observations, not a wire packet
capture. Request events include modules, CSS, audio, images and cache hits; they
are not a count of wire round trips. Asset ResourceTiming entries are another
distinct count.

On an unlimited local connection the baseline transferred **143.47 MB**, accepted
the touch travel command at 20.14 s and had a 9.03 s main-thread long task. Minimal transferred
8.81 MB and accepted touch at 7.39 s; low transferred 19.69 MB and accepted touch at
9.91 s. At 4 Mbps the baseline's full observed fast-run transfer alone implies
about **287 s** of idealized serial wire time, before protocol overhead. This
explains why lowering GPU texture size after full download cannot solve the
network budget; it is not an exact prediction of phone behavior.

The baseline started **19 model resources before story Skip** in the fast run.
With 4x CPU and fast network its Start action timed out while the renderer stopped
answering diagnostics; with 6x CPU a diorama screenshot itself timed out. The
DOM had become visible, which did not establish responsive compositing/input.
These are reproducible desktop contention failures consistent with the concern
about background preparation, not proof of the A50's specific failure mechanism.
The new tiers started **zero** model resources before Skip in the same harness.

For minimal at 4 Mbps + 4x CPU, the largest startup main-thread long task was
2.40 s, largest rAF gap 2.50 s and largest observed input queue + next-rAF interval
57 ms. Low was 4.49 s, 4.53 s and 89 ms. A CSS/compositor loader is independent
of progress counters, but no same-thread JavaScript animation or control can be
guaranteed smooth during those long tasks. They remain optimization headroom;
resource counts alone would have hidden it. These input samples do not measure
physical touch-to-photon latency.

## Quality and memory accounting

| Setting | Minimal | Low | Original |
|---|---|---|---|
| Model textures | Up to 256 px | Up to 512 px | Original download/decode; prior mobile 512 px runtime cap |
| Story illustrations | Up to 768 px WebP | Up to 1024 px WebP | Original imagery |
| GLB parser concurrency | 2 | 2 | 2 in new boot |
| Framebuffer / point lights | 1x / 2 | 1x / 4 | Prior device rendering policy |
| Final area | Deferred to House 9 | Deferred to House 9 | Eager after story |
| House decorations | Omitted (20 optional props) | Retained | Retained |

The complete derivative library contains 51 models and 37 images per tier. Its
models total 14.70 MB minimal / 49.60 MB low, and illustrations 1.34 / 2.61 MB.
Only the required initial subset is fetched at launch. Inventory triangle totals
fall from 4.15 million in the source model library to 0.58 / 1.42 million. These
library totals are not visible-frame counts and do not include procedural terrain.
The source inventory hashes the original top-level files; original separate glTF
buffers/textures must also be retained. No sources or attribution were removed.

Minimal's initial scene inventory has 624 mesh objects, 404 material objects,
309 geometries and 28 image sources; about 1.11 million scene triangles including
instances and hidden objects. The first submitted draw had 232 calls / 722,597
triangles. Logical RGBA plus mipmaps was 10.84 MB. Geometry backing ArrayBuffers
were 3.93 MB; summed attribute/index views 9.59 MB can overlap and are not additive.
Backing buffers can also retain other GLB content. These are logical JS-side
inventories, **not GPU residency or measured phone RAM**. Audio PCM spans and JS
heap/process RSS snapshots are in the raw evidence; shared RSS is not summed.

The [codec probe](shepherd-constrained-evidence/codecs.json) used 12 native
createImageBitmap decodes per candidate at 1x/4x/6x CPU. At 4x, a representative
256 px texture was PNG 25,152 bytes / 2.75 ms median, JPEG 9,797 / 2.65 ms, WebP
6,464 / 2.55 ms. At 512 px, PNG was 83,542 / 3.65 ms, JPEG 27,405 / 3.65 ms, WebP
15,914 / 4.70 ms. Results are one texture/browser, not a universal codec ranking.
Native JPEG/PNG in GLBs avoids an added runtime decoder and preserves alpha;
WebP is used for illustrations. WASM compressed-geometry/texture decoders were
not benchmarked or adopted. The build tools and their lockfile are committed.

## Visual and route review

Actual browser captures, with no personal phone/browser chrome:

- [Minimal diorama](shepherd-constrained-evidence/ci-diorama.png).
- [Minimal village entry](shepherd-constrained-evidence/ci-minimal-entry.png).
- [Minimal House 1 after lamp and refusal](shepherd-constrained-evidence/ci-minimal-first-house.png).
- [Minimal deferred shelter, staged route position](shepherd-constrained-evidence/ci-minimal-shelter-staged.png).
- [WebKit lamp carried](shepherd-constrained-evidence/captures/webkit-minimal-lamp-carried.png).

The night silhouette, paths, houses, player and lit carried lamp remain readable.
Minimal has visibly softer house textures and coarser, sometimes jagged static
wall/shelter geometry. This is a deliberate small-download tradeoff, not a claim
of final art acceptance. The staged shelter capture does not prove a complete
natural browser walkthrough or final close-up composition.

The [route evidence](shepherd-constrained-evidence/route/) covers all ten route
state transitions with actual original/minimal/low models, including deferred
models. All tiers preserve essential feature labels and authored X/Z placements;
minimal alone omits the 20 decorative props. Original exact bounds stay checked;
derivatives allow a 25 cm simplification envelope while retaining the same 45 cm
sampled path-clearance requirement against their own projected mesh hulls.
Each tier passed 2,002 camera samples per orientation with zero hidden-player
samples. These tests do not certify subjective camera comfort (the separate F08
issue remains open), animation aesthetics, audio quality or touch usability.

## Verification and reproduction

[Harness instructions and full configuration](../../projects/portal/startup-tests/README.md)
provide the PR suite, independent baseline setup, matrix servers, output summaries
and failure deadlines. Regenerate derivatives with `npm run generate`, then
`npm run verify` in `prototypes/shepherd-adventure/tools/quality`; review publication
hash changes separately. The verification checks source hashes, dimensions,
finite geometry/index data, skin counts and animation clip names.

CI evidence and the complete bounded matrix are recorded below. No merge, deployment or production mutation is authorized by this
report. Physical A50 confirmation remains the next product acceptance step.

The constrained CI limits deliberately allow runner variation: 15 s diorama
(runtime control readiness about 2.6–2.7 s; harness visibility up to 3.2 s), 75 s world-ready (27.1 s in the matrix; 29.1 s in CI with music playback checked), 1.2 s story input
queue + next-rAF (about 25 ms in the recorded CI run), 6 s startup long task
(2.40 s in the final matched run), 10 MB observed transfer (7.97 MB in the matrix; 8.24 MB in CI), 115 HTTP
requests (107), and 55 asset timing entries (41 at initial readiness). These are
regression ceilings, not a promised phone experience. The static request guard
rejects original models/images, even if rendering would otherwise succeed.

Regression sensitivity is supported by the measured pre-fix failure under the
same 4 Mbps/4x CPU configuration, a real cleared-WebGL-frame negative control,
model-load abort/retry, a missing small-asset routing table (must fail closed),
and a deferred-shelter request failure. Earlier CI failures remain documented:
the Node policy fixture lacked URLSearchParams (fixed in the fixture); four-bit
colour quantization collapsed a healthy dark WebKit image to 23 bins (five-bit
sampling retains real variation, with the solid-clear rejection unchanged); and
one 1024×768 desktop-low SwiftShader readback took 34.7 s despite returning 158
colours and 20% lit pixels. The final runtime bounds GPU work to one in-flight frame, and the desktop
fixture remains 1024×768 with the same render assertion and deadline. The primary
mobile fixture and budgets were not relaxed.
[That run](https://github.com/JesusFilm/story-lab/actions/runs/35836503633) passed
the constrained gameplay test and four of five startup cases, and remains a
failure, not rewritten as a green result. Its
[measurements](shepherd-constrained-evidence/ci-35836503633.json) include 7,668,276
observed startup bytes and a 27.69 s world-ready time.

## Generation and visual comparison evidence

A repeat of the pinned generator reproduced all **178** checked files byte for
byte: 176 variants, the provenance inventory and the runtime routing table.
[Hash comparison result](shepherd-constrained-evidence/regeneration.json).
All 102 GLBs and 74 images pass the source/hash, dimensions, skin/animation and
geometry checks. Build/publication verification passed for 950 public files
(722.2 MB, including preserved originals and the other portal prototypes), with
sensitive-content and deployment-prefix checks.

Matched 393×851, DPR 1 mobile-layout screenshots compare the actual tier output:

| Scene | Minimal | Low | Original |
|---|---|---|---|
| Village entry | [View](shepherd-constrained-evidence/tiers/minimal-entry.png) | [View](shepherd-constrained-evidence/tiers/low-entry.png) | [View](shepherd-constrained-evidence/tiers/existing-entry.png) |
| House 1, staged | [View](shepherd-constrained-evidence/tiers/minimal-house-staged.png) | [View](shepherd-constrained-evidence/tiers/low-house-staged.png) | [View](shepherd-constrained-evidence/tiers/existing-house-staged.png) |

The captures pause through the normal menu after an actual submitted frame. The
House 1 positions are staged using the existing review control. Minimal retains
the visible door, route, player and lamp, with softer/darker facades and fewer
props. Low retains more detail and decoration. Both compact tiers visibly coarsen
some static meshes such as the well; source-quality art remains available via
Original. This is a documented quality tradeoff for the physical phone playtest.

Reproduce the complete state/geometry checks without overwriting historical maps:

```sh
# Repository root; installed portal dependencies supply Three.js.
for tier in existing minimal low; do
  WATCH_GAME_RUNTIME="$PWD/projects/portal" WATCH_GAME_QUALITY="$tier" \
  REHEARSAL_REVIEW_OUTPUT="/tmp/shepherd-route-$tier/" \
  node prototypes/shepherd-adventure/checks/verify-rehearsal.mjs
done
```

## Final startup phase evidence

In the final minimal 4 Mbps + 4x CPU cold run (seconds since navigation):

| Observation | Time / span |
|---|---:|
| Earliest HTML mark | 0.186 s |
| Classic loader running | 0.580 s |
| Opening media preparation | 1.195–2.644 s |
| Six 768×432 story images decoded | 2.461–2.643 s; 321,210 encoded image bytes |
| Story controls enabled | 2.678 s |
| Harness observes visible diorama | 3.190 s |
| Start input handled | 3.689 s |
| Native audio load/wait begins | 3.723 s |
| Story closes; game import | 5.882–9.887 s |
| JS scene construction | 9.890–12.205 s |
| Initial model loading/parsing completed | 24.898 s |
| First render submitted | 26.011 s; 0.882 s synchronous render work |
| First GPU frame complete / loader dismissed | 27.060 / 27.061 s |
| Touch travel command accepted | 27.296 s |

Model spans include fetch and parser/decode work; ResourceTiming separately
records transfer starts/ends and bitmap hooks record native image-decode spans.
Overlapping spans must not be added. First-render work includes JS, shader setup
and uploads; the fence measures completion of submitted GPU work, without
claiming a separate driver shader-compilation duration. Native streaming-audio
PCM allocation/decode internals are opaque; readiness/play/stall events are
recorded instead. The matrix deliberately skips after a short reading window;
CI separately waits for the native music element to reach playing and verifies
that world/model preparation is still absent throughout that interval.

The same run's end snapshot was 46.32 MB used JS heap, renderer RSS 231,336 KiB
and software-GPU process RSS 238,468 KiB. These are snapshots, not peaks; they
share memory and are not summed or called measured A50 RAM/GPU residency. The
opening pictures' nominal RGBA footprint is about 7.96 MB in total. Their lease
and audio source release when the story closes, while the prepared world is
reused on replay.

## Final checks and their limits

[CI run 35841923302](https://github.com/JesusFilm/story-lab/actions/runs/35841923302)
passed at `f7897894eaadfc15fc011d643183e86731c83c51`, using final content build
`bc3f9af281baa357`. [Persistent results and diagnostics](shepherd-constrained-evidence/ci-final.json)
retain all **14 passing browser cases**, without private trace/source paths.
The matching [unit run](https://github.com/JesusFilm/story-lab/actions/runs/35841923336)
passed **15 Python and 10 Node tests**. Local build, publication, units, derivative
verification, whole-route checks and deterministic regeneration also passed.
The legacy Shepherd smoke command runs in the portrait CI job and passed.

Browser coverage is exactly:

- Three mobile cases in each of Chromium portrait 393×851/DPR 3, Chromium
  landscape 851×393/DPR 4, and WebKit iPhone emulation: cold story and actual
  WebGL pixels; touch lamp assembly; rotation; real context loss/reload; required
  model failure/reload; and a clear-only render negative control.
- Five Chromium startup cases: 4 Mbps/150 ms + 4x CPU cold launch through native
  story-music playing, rendered 3D, touch lamp assembly and completed House 1;
  policy/override/persistence/API-storage fallback checks; desktop Low at
  **1024×768** plus mobile Original rendering; staged deferred shelter load-once,
  render, failure and retry; and a missing routing table that must fail closed.

The final primary CI case observed 8,239,378 HTTP bytes at initial readiness,
2.578 s story interactivity, native music playing at 6.521 s, and world-ready at
29.071 s. Its House 1 pixel sample had 212 five-bit colour bins and 53.4% lit
samples. The scene remained genuinely rendered while real touch actions completed
the lamp and house sequence. The test uses deliberate single taps 550 ms apart
during lamp assembly to respect the existing double-tap guard; no runtime loading
delay was added. An intentional aborted music stream on story close is separated
from required-asset errors in the mobile logger and still included in transfer
accounting.

GPU pacing fixed the observed queued-render/readback problem without increasing
the rendering deadline or reducing the final desktop viewport. Four focused
fake-GL unit tests cover one in-flight frame, completion/release, a visible stall
error, background suspension and context loss. Native browser pixel/context
tests supply the actual WebGL coverage; the unit tests alone are not GPU proof.

CI does **not** cover the exhaustive network/CPU matrix on every PR, physical
Android, A50 memory/driver/thermal behavior, audible sound quality, or a complete
natural browser walkthrough of all ten scenes. The staged shelter is labelled
as such. The headless state/geometry tests cover the full route separately.
Per-cell benchmark success means the scripted startup/input sequence completed
within its deadline, not that every cell repeated CI's extended pixel/gameplay
checks. No traces or personal browser chrome from the user's phone are public.

## Complete constrained matrix

[All 54 planned cells](shepherd-constrained-evidence/matrix.md),
[structured summary](shepherd-constrained-evidence/matrix.json), and
[raw results, inventories and partial checkpoints](shepherd-constrained-evidence/raw-matrix.json.gz)
are retained. **53 attempts ran: 34 passed the bounded startup/input sequence and
19 failed.** The baseline 4x-CPU cold renderer stopped answering diagnostics, so
its warm attempt was unavailable and is explicitly marked not attempted. No
failed or missing attempt is counted as a pass. Warm after any failed cold run is
only partially primed; even fully primed browsers may evict/refetch large assets.

Calibration verified the actual browser controls: the 256,000-byte probe took
666–675 ms at 4 Mbps (662 ms ideal including assumed latency), 1,430–1,443 ms at
1.6 Mbps (1,430 ms ideal), and 4,496–4,512 ms at 0.5 Mbps (4,496 ms ideal). Across
case/tier cold calibrations, median fixed-work CPU cost was 3.99–4.36 times the
corresponding fast run under 4x throttling and 6.08–6.44 times under 6x. The 1x
controls ranged 0.97–1.06. These validate browser delivery/JS slowdown, not Wi-Fi
line throughput or an A50 CPU/GPU model.

Minimal passed **17 of 18** cold/warm cells; Low passed **14 of 18**. At 1.6 Mbps
and 4x CPU, minimal accepted touch at 46.12 s, versus Low at 106.64 s. At 0.5 Mbps
with no CPU slowdown, minimal only just passed cold at 118.67 s. With 6x CPU it
missed the 120 s cold deadline; its partially warm retry passed at 21.37 s. Low
failed both cold and warm 0.5 Mbps attempts with and without CPU slowdown. Low
also produced a 6.94 s main-thread task at 6x CPU on the fast network. These
results favor minimal for this phone and leave **0.5 Mbps cold play outside the
recommended profile**; a single near-deadline pass is not a reliable floor.

The recommended initial playtest remains minimal, 256 px model textures, two
asset jobs and one GPU frame in flight, on the reported 4 Mbps line. The 1.6 Mbps
+ 4x case supplies additional transfer/CPU stress evidence. Native music is
non-blocking, and the world has an explicit loading phase after scripture; this
trades overlap for predictable story responsiveness. Confirm actual A50 cold
load, frame rate, memory stability, touch, background/resume and full story play
before calling the phone repaired.
