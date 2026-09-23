# Shepherd Adventure: constrained startup and quality tiers

23 September 2026 · J060 · draft PR [#14](https://github.com/JesusFilm/story-lab/pull/14).

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
The serial matched runs use unchanged content build `8d559bb278606902`.
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

| Implementation | Diorama visible | GPU first frame complete | Touch movement begins | Observed HTTP bytes | HTTP requests |
|---|---:|---:|---:|---:|---:|
| Merged PR 13 baseline | 13.08 s | Not instrumented | Failed at 120 s | 51.39 MB by failure | 84 by failure |
| Minimal | 2.47 s | 23.17 s | 23.46 s | 7.95 MB | 107 |
| Low | 3.47 s | 47.85 s | 48.58 s | 18.82 MB | 111 |
| Baseline, plus 4x CPU | 13.41 s | Not instrumented | Failed at 120 s | 30.90 MB by failure | 79 by failure |
| Minimal, plus 4x CPU | 2.67 s | 27.10 s | 27.90 s | 8.00 MB | 107 |
| Low, plus 4x CPU | 3.71 s | 54.83 s | 56.20 s | 18.90 MB | 111 |

These launch timings include starting the story, a screenshot and a fixed two
second observation window, then skipping to the game. They are not the duration
of reading all scripture. HTTP MB are decimal and include canceled music body
bytes. Completed-request-only totals would undercount streaming music by about
0.96 MB in the 4 Mbps cold runs. Unfinished response headers are not available,
so observed totals are lower bounds. Requests include modules, CSS, audio and
images; asset ResourceTiming entries are a different count.

On an unlimited local connection the baseline transferred **143.47 MB**, reached
touch movement at 20.14 s and had a 9.03 s main-thread long task. Minimal transferred
8.81 MB and reached touch at 8.04 s; low transferred 19.69 MB and reached touch at
10.99 s. At 4 Mbps the baseline's full observed fast-run transfer alone implies
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
2.48 s, largest rAF gap 2.50 s and largest observed input queue + next-rAF interval
149 ms. Low was 4.98 s, 5.05 s and 269 ms. A CSS/compositor loader is independent
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
- [WebKit lamp carried](shepherd-constrained-evidence/webkit-lamp-carried.png).

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

CI evidence and the completed slower matrix are recorded in the final evidence
section below. No merge, deployment or production mutation is authorized by this
report. Physical A50 confirmation remains the next product acceptance step.

The constrained CI limits deliberately allow runner variation: 15 s diorama
(observed about 2.5–2.7 s), 75 s world-ready (about 27 s), 1.2 s story input
queue + next-rAF (about 25 ms in the recorded CI run), 6 s startup long task
(2.48 s in the matched run), 10 MB observed transfer (7.67–8.00 MB), 115 HTTP
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
colours and 20% lit pixels. The desktop CI fixture is now 800×600, retaining the
same render assertion; the primary mobile fixture and budgets were not relaxed.
[That run](https://github.com/JesusFilm/story-lab/actions/runs/35836503633) passed
the constrained gameplay test and four of five startup cases, and remains a
failure, not rewritten as a green result. Its
[measurements](shepherd-constrained-evidence/ci-35836503633.json) include 7,668,276
observed startup bytes and a 27.69 s world-ready time.
