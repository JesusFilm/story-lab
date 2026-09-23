# Constrained Shepherd startup evidence

See the [findings report](../shepherd-adventure-constrained-startup.md) for scope,
interpretation, exact constraints, commands, limitations and PR/CI links.

- `matrix.md` / `matrix.json`: all 54 planned before/minimal/low × constraint ×
  cold/warm cells, including bounded failures and unavailable warm attempts.
- `raw-matrix.json.gz`: a JSON `files` dictionary containing per-run results,
  HTTP/resource inventories, diagnostics, partial checkpoints and runner outcomes.
  Workspace paths are normalized; numeric observations are retained. Inspect with
  Python's standard `gzip` and `json` modules. The committed harness reproduces
  normal result directories and its `summarize.py` reproduces the summary.
- `ci-final.json` and `final-ci-*.png`: passing CI case results, diagnostic JSON and
  actual captures. The report identifies the exact tested head/content build.
- `ci-35836503633.json` / `ci-*.png`: retained earlier CI evidence. Its primary
  constrained case passed, but its desktop pixel readback exceeded the deadline;
  this is explicitly an earlier failed run, not final green evidence.
- `tiers/`: matched 393×851 captures and diagnostics for minimal/low/original.
  House 1 uses the existing review jump; these are paused visual comparisons.
- `route/`: complete route state/geometry and camera samples for all three tiers.
- `regeneration.json`: byte-identical repeat generation of all 178 checked outputs.
- `codecs.json`: native image encoding/decode measurements, with units and samples.
- `webkit-local.json` / `captures/webkit-*.png`: the earlier local Noble-container WebKit
  checks and captures that diagnosed coarse colour-quantization loss.

Browser timing/resource evidence is from the VM, not a physical A50. JS heap,
process RSS, HTTP bytes and nominal decoded data are separate quantities; none
is measured GPU residency. No user screenshots, private browser chrome, secrets,
paid-device-service records or telemetry dumps are included.
