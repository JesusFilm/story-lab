"""Summarize an exported ?profile run. Values remain separate, never a fake total."""
import json, sys
from collections import Counter, defaultdict
from pathlib import Path
x=json.loads(Path(sys.argv[1]).read_text()); groups=defaultdict(list)
for s in x['samples']:
    world=s['owners'].get('world',{});story=s['owners'].get('story',{})
    group=story.get('kind') or (f"point-{world['point']}" if s['phase']=='playing' and world.get('point') else s['phase'])
    groups[group].append(s)
def mib(n): return round(n/1048576,2)
rows=[]
for group,ss in groups.items():
    heaps=[s['heap']['used'] for s in ss if s['heap']]
    last=ss[-1];w=last['owners'].get('world',{});a=w.get('audio',{});g=w.get('graphics',{})
    rows.append({'phase':group,'firstSeconds':round(ss[0]['ms']/1000,2),'lastSeconds':round(last['ms']/1000,2),'samples':len(ss),'heapMinMiB':mib(min(heaps)) if heaps else None,'heapMaxMiB':mib(max(heaps)) if heaps else None,'heapLastMiB':mib(heaps[-1]) if heaps else None,'geometryMiB':mib(g.get('geometryArrayBufferBytes',0)),'textureEstimateMiB':mib(g.get('textureRGBAEstimatedBytes',0)),'audioPCMMiB':mib(a.get('proceduralBytes',0)+sum(b['bytes'] for b in a.get('recordings',[]))+w.get('houseAudio',{}).get('voiceBytes',0)),'renderer':w.get('renderer'),'leases':last['owners'].get('story',{}).get('leases')})
summary={'metadata':x['metadata'],'durationSeconds':round(x['samples'][-1]['ms']/1000,2),'groups':rows,'marks':[e for e in x['events'] if e['type']=='mark'],'modelLoads':len(x['models']),'repeatedModels':{k:v for k,v in Counter(m['path'] for m in x['models']).items() if v>1},'largestModelsByTexture':sorted(x['models'],key=lambda m:m['textureRGBAEstimatedBytes'],reverse=True)[:5],'sampleCostMaxMs':max(s['samplingMs'] for s in x['samples']),'sampleCostMeanMs':round(sum(s['samplingMs'] for s in x['samples'])/len(x['samples']),2),'errors':[e for e in x['events'] if e['type'] in ('error','rejection','model-error')],'dropped':x['dropped']}
print(json.dumps(summary,indent=2))
