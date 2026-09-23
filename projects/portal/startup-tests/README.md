# Constrained Shepherd Adventure startup

Build the reviewed portal first. Dependencies and browser versions are pinned in
`../package-lock.json`. `npm run test:startup` runs the practical PR regression:
4× Chromium CPU slowdown, 4 Mbps download (500,000 bytes/s), assumed 150 ms latency,
empty HTTP cache, mobile viewport/touch and real WebGL pixel readback. It proceeds
through lamp assembly and the first house, not merely the Find a lamp control.
It checks effective network throttling, a visible decoded diorama, responsive
Start, absence of world preloading while reading, small-asset-only requests,
resource/transfer/long-task limits, GPU completion, quality overrides/fallbacks,
a desktop launch and staged deferred-area failure/recovery. The staged last-area
case is explicitly not a full-route physical playtest.

Current CI budgets: diorama within 15 s; world ready within 75 s of navigation;
at most 55 asset HTTP entries, 115 total HTTP requests and 10,000,000 observed
transfer bytes (including canceled music response bodies) through initial
play; no startup long task over 6 s under 4× CPU emulation; story input queue plus
next animation-frame delay below 1.2 s. Startup long tasks stop at world-ready;
expensive test-only GPU readback is excluded from that responsiveness budget.
Pixel readback and the existing clear-only negative control remain required.
These are regression tolerances, not promised A50 timings.

Run a benchmark server in one terminal, from `projects/portal`:

```sh
python3 startup-tests/server.py --port 8962
```

For matched before/after, save a reviewed pre-change portal build separately and
serve it with the same server, e.g. `--port 8963 --dist /path/to/before/dist`.
The server's 256,000-byte and HTML calibration endpoints are never published.
Run the matrix in a quiet VM (do not run other browser/asset-generation tests at
the same time):

```sh
npm run bench:startup
# Or a bounded primary comparison:
BENCH_CASES=fast,reported4,combined4 BENCH_TIERS=before,minimal,low npm run bench:startup
# Single revision, all configured constraints, cold and warm:
BENCH_TIERS=minimal,low node startup-tests/benchmark.mjs
```

`BEFORE_URL`/`AFTER_URL` select matrix endpoints; `BENCH_URL` selects the single
benchmark endpoint. `BENCH_CASES`, `BENCH_TIERS`, `BENCH_CACHE`, `BENCH_TIMEOUT`
(milliseconds, default 120000) and `BENCH_OUT` configure runs. The matrix runner
uses a separate browser per case/tier with a 280 s outer process deadline.
Failed launches retain partial results, HTTP request inventories and external
phase timestamps even when the renderer cannot answer JS. Warm means reuse of
the prior attempt's cache, which may be partially primed after a failure.

Cases: fast; CPU-only 4× and 6×; network-only 4 Mbps/150 ms, 1.6 Mbps/150 ms,
0.5 Mbps/400 ms; combined 4×+4 Mbps, 4×+1.6 Mbps and 6×+0.5 Mbps. Upload speed on
the phone is unknown; emulation uses the matching download rate for uploads.
A static scene makes no substantive upload. Rates use decimal bits/s. No claim
is made that a reported 4 Mbps subscription achieves that throughput over Wi-Fi.

CPU calibration records three repetitions of fixed work, with network calibration
recorded independently; compare ratios with the fast case on the same VM.
SystemInfo process RSS/CPU counters describe this browser process tree only.
They are not private working set, GPU residency, or phone RAM. The startup probe
records HTTP transfer/encoded/decoded bytes, long tasks, frame gaps and input
latency. The runtime diagnostics additionally record phase boundaries, native
image/audio decode, model load/parse and logical scene resources.

Only explicit `?diagnostics` enables the full runtime recording/export interface.
No diagnostics are sent to a server. The forced tier persists via localStorage;
Automatic clears it. Test the A50 with `?quality=minimal&diagnostics` and record
its exported build ID. SwiftShader/desktop CPU throttling cannot emulate the
phone's GPU, OS scheduling, drivers, memory pressure or thermal behavior.

Codec comparison, after installing quality build dependencies:
`node ../../prototypes/shepherd-adventure/tools/quality/measure-codecs.mjs /path/to/codecs.json`.
It compares native PNG/JPEG/WebP at matching dimensions and CPU rates; it does
not imply a measured result for untested WASM decoders.
