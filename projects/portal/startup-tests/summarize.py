"""Summarize bounded matrix evidence without losing failed or unattempted runs."""
import argparse, json, statistics
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument('directory', type=Path)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
cases = ['fast', 'cpu4', 'cpu6', 'reported4', 'net16', 'net05', 'combined4', 'combined16', 'combined05']
rows = []
for case in cases:
    for tier in ['before', 'minimal', 'low']:
        for cache in ['cold', 'warm']:
            file = a.directory / tier / f'{case}-{"existing" if tier == "before" else tier}-{cache}.json'
            partial = file.with_name(file.stem + '-partial.json')
            row = dict(case=case, tier=tier, cache=cache, status='not-attempted')
            if not file.exists() and not partial.exists():
                rows.append(row)
                continue
            r = json.loads((file if file.exists() else partial).read_text())
            probe = (r.get('probe') or {}).get('probe') or {}
            diag = (r.get('probe') or {}).get('diagnostics') or {}
            marks = {m['phase']: m['ms'] for m in probe.get('marks', [])}
            runtime = {m['phase']: m['ms'] for m in diag.get('marks', [])}
            end = runtime.get('world-ready', marks.get('touch-movement', float('inf')))
            finished = {(x.get('path'), x.get('start')) for x in r['network']}
            completed = sum(x['bytes'] for x in r['network'])
            partial_bytes = sum(x.get('receivedBodyBytes', 0) for x in r.get('requests', []) if (x['path'], x['start']) not in finished)
            inputs = probe.get('inputs', [])
            tasks = [t for t in probe.get('tasks', []) if t['start'] < end]
            gaps = [g for g in probe.get('gaps', []) if g['start'] < end]
            model_resources = [x for x in probe.get('resources', []) if x['url'].endswith(('.glb', '.gltf', '.bin'))]
            skip = next((x['at'] for x in inputs if x['target'] == 'story-skip'), None)
            row.update(status=r['status'] if file.exists() else 'outer-timeout-partial',
                error=r.get('error'), date=r.get('date'), build=diag.get('build'),
                dioramaSeconds=marks.get('diorama-visible-harness', 0)/1000 or None,
                introControlSeconds=marks.get('world-first-frame-harness', marks.get('intro-control-present-harness', 0))/1000 or None,
                gpuCompleteSeconds=runtime.get('first-frame-gpu-complete', 0)/1000 or None,
                touchMovementSeconds=marks.get('touch-movement', 0)/1000 or None,
                completedTransferBytes=completed, unfinishedBodyBytes=partial_bytes,
                observedTransferBytes=completed+partial_bytes, requests=len(r.get('requests', [])),
                resourceEntries=len(probe.get('resources', [])),
                modelResourcesStartedBeforeStorySkip=sum(x['start'] < skip for x in model_resources) if skip else None,
                maxStartupLongTaskMs=max((t['duration'] for t in tasks), default=None),
                maxStartupFrameGapMs=max((g['duration'] for g in gaps), default=None),
                maxObservedInputQueueAndPaintMs=max((x['queue']+x['paint'] for x in inputs), default=None),
                calibration=r['calibration'], config=r['config'], browser=r['version'],
                platform=r['platform'], cpus=r['cpus'], heap=diag.get('heap') or probe.get('heap'),
                processSnapshot=r.get('processes'), events=r['events'],
                phaseMarks=diag.get('marks', []), modelSpans=diag.get('models', []),
                externalPhases=r['phases'])
            rows.append(row)
# Compare the median fixed-work calibration against the corresponding fast run.
for row in rows:
    if 'calibration' not in row:
        continue
    reference = next((r for r in rows if r['case']=='fast' and r['tier']==row['tier'] and r['cache']=='cold' and 'calibration' in r), None)
    median = lambda r: statistics.median(s['ms'] for s in r['calibration']['cpu'])
    row['effectiveCpuWorkRatio'] = median(row)/median(reference) if reference else None
    b = row['config'].get('bytes')
    row['networkProbeExpectedMs'] = (256000/b*1000+row['config']['latency']) if b else None
result = dict(schema=1, limits=[
    'Single serial observation per cell, not a distribution or A50 hardware emulation.',
    'Warm follows cold in the same browser; failed cold only partially primes cache. An unresponsive renderer can prevent warm execution.',
    'Observed transfer includes completed HTTP encoded bytes and unfinished/canceled body bytes; missing unfinished headers make it a lower bound. HTTP cache bytes are not decoded image RAM.',
    'introControlSeconds is UI presence, NOT a completed GPU frame. Baseline has no GPU fence. Use touchMovementSeconds for matched usable input and gpuCompleteSeconds for instrumented new runtime.',
    'After GPU fence budgets exclude later test work; before tasks extend through first touch. Screenshot and browser instrumentation add overhead.',
    'Process RSS snapshots share memory and are not summed or called phone/GPU residency; process CPU seconds are cumulative.',
], rows=rows)
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(result, indent=2)+'\n')
lines = ['# Serial benchmark matrix', '', 'Seconds since navigation; MB are decimal observed network bytes including partial canceled bodies. See the report for assumptions and limits.', '', '| Constraint | Tier | Cache | Result | Diorama s | GPU complete s | Touch movement s | MB | Requests |', '|---|---|---|---|---:|---:|---:|---:|---:|']
for r in rows:
    num = lambda key: '—' if r.get(key) is None else f'{r[key]:.2f}'
    mb = '—' if 'observedTransferBytes' not in r else f'{r["observedTransferBytes"]/1e6:.2f}'
    lines.append(f'| {r["case"]} | {r["tier"]} | {r["cache"]} | {r["status"]} | {num("dioramaSeconds")} | {num("gpuCompleteSeconds")} | {num("touchMovementSeconds")} | {mb} | {r.get("requests", "—")} |')
a.output.with_suffix('.md').write_text('\n'.join(lines)+'\n')
print(f'{len(rows)} planned cells:', {s:sum(r['status']==s for r in rows) for s in sorted({r['status'] for r in rows})})
