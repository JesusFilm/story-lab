# Constrained Shepherd startup

These tests run against the reviewed portal artifact under `/story-lab/`, not a
prototype-only development server. No device farm or deployment is involved.

From the repository root, install/build the portal and its bundled dependencies:

```sh
npm ci --prefix projects/portal
npm ci --prefix prototypes/sermon-in-the-crowd
npm ci --prefix prototypes/little-light-library
npm --prefix projects/portal run build
cd projects/portal
npx playwright install --with-deps chromium webkit
npm run test:startup
npm run test:mobile
```

The PR suite runs the five startup cases once in Chromium, plus three existing
mobile cases in each of Chromium portrait, Chromium landscape, and WebKit. It
includes real pixel readback, touch lamp assembly and House 1, a staged final-area
load/failure/retry, selection/storage fallbacks, and a missing routing-table fault.
A staged ending is not a full browser walkthrough. Pixel sampling rejects a
controlled solid-clear scene in the mobile suite.

The primary cold-start case uses **500,000 bytes/s = 4 Mbps**, assumed 150 ms
latency, and Chromium's 4x CPU slowdown. The 4 Mbps value is the user's reported
line speed, not measured phone throughput. Upload is unknown; the harness sets
symmetric rates (the game performs no substantive upload). It checks a 256,000
byte uncached probe. Budgets are 15 s to visible decoded diorama, 1.2 s story input
queue + paint, 75 s world-ready, 6 s maximum pre-ready main-thread long task,
10,000,000 observed HTTP bytes including partial canceled music, 115 HTTP requests,
and 55 asset ResourceTiming entries. These generous CI ceilings are regression
alarms, not targets or phone guarantees. Full measurements justify them in the
[report](../../../docs/reports/shepherd-adventure-constrained-startup.md).

## Optional serial matrix

Keep two built artifacts: the comparison baseline and the working implementation.
For this investigation the baseline is commit `0d87b83` (merged PR 13). Extract
that revision with `git archive` into a disposable directory outside this worktree,
install the same pinned dependencies there, and build its portal. Do not reset or
pull a running checkout. `server.py --dist` serves an already-built artifact and
adds calibration endpoints only to this local benchmark server.

Start these in separate terminals from `projects/portal`:

```sh
python3 startup-tests/server.py --port 8963 --dist /absolute/baseline/projects/portal/dist
python3 startup-tests/server.py --port 8962
```

Then, from `projects/portal`:

```sh
BENCH_OUT=test-results/matched-matrix npm run bench:startup
python3 startup-tests/summarize.py test-results/matched-matrix --output test-results/matrix.json
```

Optional environment variables: `BENCH_CASES` (comma-separated case names),
`BENCH_TIERS=before,minimal,low`, `BENCH_CACHE=cold,warm`, `BEFORE_URL`, `AFTER_URL`.
`benchmark.mjs` can run one artifact using `BENCH_URL` and
`BENCH_TIERS=minimal,low,existing`. The matrix wrapper maps `before` to the
baseline server's original assets. No baseline quality query is added.

| Case | CPU rate | Download bytes/s | Assumed latency |
|---|---:|---:|---:|
| fast | 1 | Unlimited | 0 ms |
| cpu4 / cpu6 | 4 / 6 | Unlimited | 0 ms |
| reported4 | 1 | 500,000 | 150 ms |
| net16 | 1 | 200,000 | 150 ms |
| net05 | 1 | 62,500 | 400 ms |
| combined4 | 4 | 500,000 | 150 ms |
| combined16 | 4 | 200,000 | 150 ms |
| combined05 | 6 | 62,500 | 400 ms |

A case/tier runs in its own browser process, cold then warm. A 120 s launch
bound retains HTTP/error evidence and attempts a 5 s diagnostic read. An
unresponsive renderer may prevent warm execution. The parent kills only its own
child process group after 280 s. Partial JSON checkpoints every 10 s survive that
kill. A failed cold attempt gives only a partially warm cache; even a completed
warm attempt can refetch evicted files. Do not discard failures from summaries.
Run the matrix without overlapping local browser/geometry workloads.

Each case calibrates network using uncached bytes and records three fixed-work
CPU samples. The summary compares their median to the same tier's fast run.
The initial benchmark marker `world-first-frame-harness` means only **intro
control present**; it is retained in recorded raw evidence. Completed GPU work is
`first-frame-gpu-complete` in the new runtime. Matched input timing is
`touch-movement`: the touch command has been accepted and the route destination
has changed. It is not a touch-to-photon measurement. Resource counts and control presence do not certify rendering.
CI performs the actual pixel and extended-play assertions separately.

Reports contain request starts/finishes, incomplete body bytes, ResourceTiming,
phase and model spans, long tasks, frame gaps, input events, errors, optional JS
heap and process RSS snapshots. RSS is not additive phone RAM; texture estimates
are not GPU residency. No Android hardware, GPU, thermal or scheduling behavior
is emulated by SwiftShader/CDP throttling. Screenshots add overhead. One run per
cell is exploratory evidence, not a percentile/SLA measurement.

For matched 393×851 screenshots of all three tiers, run
`node startup-tests/capture-tiers.mjs` against the new artifact. Entry and staged
House 1 captures pause via the existing menu; they are visual comparison evidence,
not extra gameplay completion evidence. `CAPTURE_OUT` selects the output folder.
