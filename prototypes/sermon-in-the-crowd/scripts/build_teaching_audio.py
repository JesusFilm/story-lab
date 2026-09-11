"""Reproducible local teaching edit. No voice cloning or source separation.
Run: python3 scripts/build_teaching_audio.py [path-to-original-chapter.mp4]
Requires FFmpeg. Fetches the official VTT for caption alignment.
"""
from pathlib import Path
import json, re, sys, subprocess, urllib.request, wave, array, math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/audio';OUT.mkdir(exist_ok=True)
source=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'.cache/film-review/sermon-review.mp4'
edits=json.loads((ROOT/'scripts/teaching-edit.json').read_text())
vtt=subprocess.check_output(['curl','-fLs','https://api-media-core.jesusfilm.org/1_jf6112-0-0/editions/ot/subtitles/1_jf6112-0-0_ot_529.vtt']).decode()
def sec(s):
 n=0
 for part in s.split(':'):n=n*60+float(part)
 return n
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d}.{ms%1000:03d}'
cues=[]
for block in re.split(r'\n\s*\n',vtt.replace('\r','')):
 lines=block.splitlines()
 for i,line in enumerate(lines):
  if '-->' in line:
   a,b=line.split('-->');cues.append((sec(a.strip()),sec(b.strip().split()[0]),re.sub('<[^>]+>','',' '.join(lines[i+1:]))))
rate=24000;gap=.32;all_samples=array.array('h');mapped=[];manifest=[]
for i,edit in enumerate(edits):
 duration=edit['end']-edit['start'];path=OUT/(edit['id']+'.wav')
 # Tiny edge fades prevent clicks without crossfading words or truncating consonants.
 subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(edit['start']),'-i',str(source),'-t',str(duration),'-vn','-af',f'afade=t=in:d=0.008,afade=t=out:st={duration-.012}:d=0.012','-ac','1','-ar',str(rate),'-c:a','pcm_s16le',str(path)],check=True)
 with wave.open(str(path),'rb') as w: samples=array.array('h',w.readframes(w.getnframes()))
 start=len(all_samples)/rate;all_samples.extend(samples);end=len(all_samples)/rate
 manifest.append({**edit,'editStart':start,'editEnd':end,'audio':f'/audio/{path.name}'})
 local=[]
 for a,b,text in cues:
  if a<edit['end'] and b>edit['start']:
   aa=max(a,edit['start'])-edit['start'];bb=min(b,edit['end'])-edit['start'];mapped.append((start+aa,start+bb,text));local.append((aa,bb,text))
 (OUT/(edit['id']+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)}\n{t}' for a,b,t in local)+'\n')
 if i<len(edits)-1:all_samples.extend([0]*round(gap*rate))
with wave.open(str(OUT/'sermon-teaching.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(all_samples.tobytes())
(OUT/'sermon-teaching.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)}\n{t}' for a,b,t in mapped)+'\n')
# Speech energy is computed from the exact edited PCM; drives approximate jaw opening.
step=480;energy=[]
for i in range(0,len(all_samples),step):
 p=all_samples[i:i+step];rms=math.sqrt(sum(x*x for x in p)/max(1,len(p)))/32768;energy.append(round(min(1,max(0,(rms-.012)*12)),3))
(OUT/'speech-envelope.json').write_text(json.dumps({'step':step/rate,'values':energy},separators=(',',':')))
(OUT/'edit-manifest.json').write_text(json.dumps({'duration':len(all_samples)/rate,'gap':gap,'sampleRate':rate,'segments':manifest},indent=2)+'\n')
(ROOT/'lib/sermon/edit-manifest.json').write_text((OUT/'edit-manifest.json').read_text())
print(f'{len(manifest)} clips; {len(all_samples)/rate:.3f}s; {len(mapped)} captions; speech envelope {len(energy)} samples')
