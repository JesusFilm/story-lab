"""Compare saved CUA traces. Usage: python3 checks/compare-memory-profiles.py evidence-dir"""
import json, sys, statistics
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(sys.argv[1]); before=json.loads((root.parent/'2026-09-18-memory/full-route.json').read_text());after=json.loads((root/'after-full-route.json').read_text())
idle=[json.loads((root/(n+'-idle.json')).read_text()) for n in ['before','after']]
colors=['#ad6544','#2a7c79']; labels=['Before','After']; mib=1048576
plt.rcParams.update({'font.size':11,'axes.spines.top':False,'axes.spines.right':False})
fig,axes=plt.subplots(2,1,figsize=(12,7),layout='constrained');metrics={}
for data,label,color in zip(idle,labels,colors):
 s=data['steady'];h=np.array(s['heap']).reshape(-1,2);t=h[:,0]/1000;y=h[:,1]/mib;late=y[t>=15];d=np.diff(late);frames=np.array(s['frames']);
 metrics[label.lower()]={'probeStartSeconds':s['startMs']/1000,'durationSeconds':(s['endMs']-s['startMs'])/1000,'focusLost':s['focusLost'],'samples':len(y),'full60MeanMiB':float(np.mean(y)),'last45MeanMiB':float(np.mean(late)),'last45MinMiB':float(min(late)),'last45MaxMiB':float(max(late)),'last45P5MiB':float(np.percentile(late,5)),'last45P95MiB':float(np.percentile(late,95)),'last45DownStepsOver1MiB':int(np.sum(d<-1)),'last45ObservedPositiveMiBPerSecond':float(np.maximum(d,0).sum()/45),'frameP50Ms':float(np.percentile(frames,50)),'frameP95Ms':float(np.percentile(frames,95)),'frameMaxMs':float(max(frames))}
 axes[0].plot(t,y,label=f'{label}: mean {np.mean(late):.1f} MiB (15–60 s)',color=color,lw=1)
 axes[1].plot(t,y-y[0],label=label,color=color,lw=1)
for ax in axes:
 ax.axvspan(0,15,color='#999999',alpha=.10);ax.grid(alpha=.18);ax.legend(loc='lower left');ax.set_xlim(0,60);ax.set_xlabel('Seconds in the fixed idle measurement')
axes[0].set_ylabel('JS heap (MiB)');axes[0].set_ylim(bottom=0);axes[0].set_title('Same Find a lamp scene • sound on • no movement • 100 ms heap samples',loc='left')
axes[1].set_ylabel('Change from first sample (MiB)');axes[1].set_title('Heap movement, without smoothing',loc='left')
fig.suptitle('Shepherd Adventure — before / after memory experiment',fontsize=16)
fig.savefig(root/'heap-idle-comparison.png',dpi=160);plt.close(fig)
fig,axes=plt.subplots(2,1,figsize=(13,7),sharey=True,layout='constrained')
maxheap=max(s['heap']['used']/mib for data in [before,after] for s in data['samples'] if s['heap'])
for ax,data,label,color in zip(axes,[before,after],labels,colors):
 ss=[s for s in data['samples'] if s['heap']];ax.plot([s['ms']/1000 for s in ss],[s['heap']['used']/mib for s in ss],color=color,lw=1);ax.set_title(label,loc='left');ax.set_ylabel('JS heap (MiB)');ax.set_xlabel('Seconds since navigation');ax.set_ylim(0,maxheap*1.15);ax.grid(alpha=.18)
 for e in data['events']:
  if e['type']=='mark' and e['name'] in ['opening-closed','ending-requested','ending-closed']:
   sec=e['ms']/1000;ax.axvline(sec,color='#888888',ls='--',lw=.7);ax.text(sec,maxheap*1.08,e['name'].replace('-',' '),fontsize=8,rotation=90,va='top')
 probe=data.get('steady');routePlaying=[s['heap']['used']/mib for s in ss if s['phase']=='playing' and not(probe and probe['startMs']<=s['ms']<=probe['endMs'])];playing=[s['heap']['used']/mib for s in ss if s['phase']=='playing'];complete=[s['heap']['used']/mib for s in ss if s['phase']=='complete'];w=ss[-1]['owners']['world'];g=w['graphics'];
 if probe:ax.axvspan(probe['startMs']/1000,probe['endMs']/1000,color='#2a7c79',alpha=.10,label='60 s idle probe');ax.legend(loc='lower left')
 metrics[label.lower()]['fullRoute']={'durationSeconds':ss[-1]['ms']/1000,'heapPeakMiB':max(s['heap']['used']/mib for s in ss),'playingMeanMiB':statistics.mean(playing),'playingMeanExcludingProbeMiB':statistics.mean(routePlaying),'playingMinMiB':min(playing),'playingMaxMiB':max(playing),'completeMinMiB':min(complete),'completeMaxMiB':max(complete),'geometryMiB':g['geometryArrayBufferBytes']/mib,'textureEstimateMiB':g['textureRGBAEstimatedBytes']/mib,'modelLoads':len(data['models']),'errors':[e for e in data['events'] if e['type'] in ['error','rejection','model-error']]}
fig.suptitle('Full normal playthroughs — all scenes through the replay invitation\nReading and investigation times differ; use the fixed idle test for the closer comparison',fontsize=14)
fig.savefig(root/'heap-full-route-comparison.png',dpi=160);plt.close(fig)
(root/'comparison.json').write_text(json.dumps(metrics,indent=2)+'\n');print(json.dumps(metrics,indent=2))
