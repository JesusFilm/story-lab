"""Plot separate memory counters; never stack overlapping estimates.
Requires matplotlib. Usage: python3 checks/plot-memory-profile.py input.json out.png
"""
import json, sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
x=json.loads(Path(sys.argv[1]).read_text());samples=x['samples']; t=[s['ms']/1000 for s in samples]
def world(s):return s['owners'].get('world',{})
mib=lambda n:n/1048576
series=[('Browser JS heap (MiB)',[mib(s['heap']['used']) if s['heap'] else float('nan') for s in samples]),('Scene geometry backing stores (MiB)',[mib(world(s).get('graphics',{}).get('geometryArrayBufferBytes',0)) for s in samples]),('Texture RGBA + mipmaps estimate (MiB)',[mib(world(s).get('graphics',{}).get('textureRGBAEstimatedBytes',0)) for s in samples]),('Retained gameplay + House 1 audio PCM (MiB)',[mib(sum(b['bytes'] for b in world(s).get('audio',{}).get('recordings',[]))+world(s).get('audio',{}).get('proceduralBytes',0)+world(s).get('houseAudio',{}).get('voiceBytes',0)) for s in samples])]
fig,axes=plt.subplots(4,1,figsize=(12,10),sharex=True,layout='constrained')
for ax,(label,y),color in zip(axes,series,['#3076b0','#36785d','#b37924','#805fa7']):
 ax.plot(t,y,color=color,linewidth=1.3);ax.set_ylabel('MiB');ax.set_title(label,loc='left',fontsize=11);ax.grid(alpha=.18);ax.set_ylim(bottom=0)
 for e in x['events']:
  if e['type']=='mark' and e['name'] in ['opening-closed','ending-requested','ending-closed']:ax.axvline(e['ms']/1000,color='#9a9a9a',linestyle='--',linewidth=.8)
for e in x['events']:
 if e['type']=='mark' and e['name'] in ['opening-closed','ending-requested','ending-closed']:axes[0].annotate(e['name'].replace('-',' '),(e['ms']/1000,axes[0].get_ylim()[1]*.95),rotation=90,va='top',ha='right',fontsize=8)
axes[-1].set_xlabel('Seconds since navigation (includes reading and investigation pauses)')
fig.suptitle('Shepherd Adventure — full normal route, warm-cache desktop diagnostic\nSeparate counters: do not add them; texture bytes are estimated, not GPU residency',fontsize=13)
fig.savefig(sys.argv[2],dpi=150)
