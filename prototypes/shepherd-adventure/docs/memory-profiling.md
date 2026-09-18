# Memory profiling

This is a diagnostic mode for the normal experience, from initial HTML through the
opening, village, ending and replay. It does not change asset quality or loading
policy. The current investigation and results are linked from the playtest roadmap.

From this prototype directory:

```sh
python3 serve.py --port 8876 --profile-dir /tmp/shepherd-memory-evidence
```

Open `http://127.0.0.1:8876/?profile`. Start the story with sound on, advance every
verse, assemble the lamp, play all ten route stops and all house conversations,
finish every ending verse, and remain on **Experience the story again** for at least
30 seconds. Open **Memory profiler** and choose **Save local profile**. The local
server returns the filename. **Download JSON** also works without the save endpoint.
Then choose replay, re-enter gameplay and export another checkpoint. Do not use
scene jumps or skip controls when recording a full-route result.

Without `?profile`, there are no diagnostic timers, observers, model wrappers,
scene scans or panel. The small classic script is intentionally before the module
entry so it can record startup. Without `--profile-dir`, the local save endpoint
is disabled. No telemetry is sent to an external service. Treat diagnostic exports
as local evidence and review their contents before publishing.

## Reading the measurements

- Browser JS heap: optional, Chromium's legacy `performance.memory` counter. May
  include a shared heap or previous document awaiting collection. It is **not total
  app RAM**. Missing values are `null`, never zero.
- Scene inventory: deduplicated geometry ArrayBuffer bytes, texture objects,
  decoded image sources, materials and meshes, including hidden scene objects.
  Texture estimate uses width × height × 4 and 4/3 for mipmaps, appropriate to the
  current PNG/JPEG RGBA assets. It is a logical estimate, not measured GPU residency;
  compressed/float/cube textures require an expanded estimator before using it for
  those formats. Driver allocations, framebuffers and shadow targets are excluded.
- `renderer.info`: uploaded geometry/texture counts, shader programs and last
  rendered calls/triangles. These are counts, not GPU bytes. Shadow passes contribute
  to draw/triangle counts.
- Audio: retained gameplay recordings and procedural buffers use frames × channels
  × 4 bytes. House 1's decoded refusal is counted separately. HTML audio decoder
  memory and short-lived synthesized sound buffers are not included. Story audio
  reports playback state where available, not an invented byte total.
- Story leases: explicit Blob bytes and object URL counts, disappearing on release.
  Releasing a lease is not proof that the browser immediately drops its decoded cache.
- Resource timing: request ordering, duration, encoded response size and transfer
  bytes. Revalidated/cached responses are not cold downloads; `decodedBodySize` means
  HTTP decoding, not image/PCM/GPU expansion. Per-model inventory reveals repeated
  parses even when HTTP cache suppresses a repeat download.
- Two-second sampling may miss brief peaks. Lifecycle markers and long-task events
  supplement it. `samplingMs` measures scan overhead. Each collection is capped at
  3,600 records; `dropped` must be checked before interpreting long sessions.

Do not add these counters together: they overlap and have different scopes. No
forced GC is performed. A steady resource inventory does not establish absence of
all leaks. Use repeated complete cycles and allocation/retainer snapshots to prove
leak fixes. Physical low-end devices, browser process/GPU measurements and constrained
networks are separate validation; viewport emulation does not emulate their RAM.

```sh
python3 checks/summarize-memory-profile.py /path/to/profile.json > summary.json
python3 checks/inventory-profile-assets.py /path/to/profile.json > assets.json
node checks/verify-memory-profile.mjs
```

The asset inspector requires Pillow and reads only resources observed in the
profile. It checks embedded GLB texture dimensions as well as source file sizes;
it does not modify assets. Summary groups combine a phase across replays, so export
the first completion separately and use raw timestamps for cycle comparisons.

For controlled comparisons: use one fresh browser context; record cold and warm
cache conditions, browser/hardware, viewport/DPR, sound, focus and revision; keep the
route and reading pace consistent; avoid other profiling tools during timing runs.
Use the same device for before/after tests. Compare visible transition duration,
peak memory, decoded asset residency, resource failures and repeated-replay retention.

## Fixed idle comparison

For allocation-churn experiments, use **Measure 60s idle** at the **Find a lamp**
button, after the ten-second entry run. Keep sound on and the tab focused, with
normal motion, a 1280 × 720 viewport and DPR 1. Do not interact or run CPU-heavy
checks during the minute. Save after **Idle measurement complete**. The probe
uses bounded typed arrays for approximately 100 ms heap samples and frame intervals;
it neither forces collection nor smooths the plotted trace. Both builds must use
the same probe. It adds some overhead, including a status update on each frame.

Inspect all 60 seconds, with the last 45 seconds also summarized as a predefined
settled window. Record startup/cache differences, `focusLost` and probe start time.
Downward steps and summed positive changes are observed heap movement, not actual
GC event counts or a complete allocation-rate measurement. Frame intervals do not
identify the cause of a pause. A smoother line alone is not the success criterion:
retained bytes, peaks and frame behaviour must also improve or remain acceptable.

`checks/compare-memory-profiles.py` plots the paired idle traces and full-route
traces from an evidence directory containing `before-idle.json`, `after-idle.json`
and `after-full-route.json`, with the original full run in the adjacent
`2026-09-18-memory` directory. It requires NumPy and Matplotlib.
