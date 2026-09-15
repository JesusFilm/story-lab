'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Headphones, Compass, SkipBack, SkipForward, Captions, ArrowUpRight, X, Volume2, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SermonFilm } from '@/components/sermon-film';
import { Switch } from '@/components/ui/switch';
import { SERMON, formatTime } from '@/lib/sermon/media';
import { EDIT, segmentAt } from '@/lib/sermon/performance';
import type { Experience } from '@/lib/sermon/experience';
export default function Home() {
 const host=useRef<HTMLDivElement>(null), vr=useRef<HTMLDivElement>(null), engine=useRef<Experience|null>(null);
 const [film,setFilm]=useState(true);
 const [version,setVersion]=useState<'v1'|'v2'>('v1'),[v2Ready,setV2Ready]=useState(false),[v2Failed,setV2Failed]=useState(false);
 const [ready,setReady]=useState(false), [playing,setPlaying]=useState(false), [time,setTime]=useState(0), [cue,setCue]=useState(''), [status,setStatus]=useState('Preparing the hillside…'), [captions,setCaptions]=useState(true), [info,setInfo]=useState(false), [entered,setEntered]=useState(false), [volume,setVolume]=useState(.85), [walk,setWalk]=useState(false);
 useEffect(()=>{let cancelled=false; let dispose:(()=>void)|undefined;
  import('@/lib/sermon/experience').then(async ({createExperience})=>{
   if(cancelled||!host.current||!vr.current)return;
   const e=await createExperience(host.current,vr.current,{ready:()=>setReady(true),state:setPlaying,time:setTime,cue:setCue,status:setStatus,walking:setWalk,versionReady:v=>{setV2Ready(v);setV2Failed(!v);}});
   if(cancelled)e.dispose(); else {engine.current=e; dispose=e.dispose;}
  }).catch(()=>setStatus('The 3D scene could not start. Use a browser with WebGL 2 enabled and reload.'));
  return()=>{cancelled=true;dispose?.();};
 },[]);
 useEffect(()=>{const overlay=document.getElementById('loading');if(overlay)overlay.hidden=ready;const text=document.getElementById('loading-text');if(text&&!ready)text.textContent=status;},[ready,status]);
 const currentSegment=segmentAt(time);const segmentIndex=currentSegment?EDIT.segments.indexOf(currentSegment):Math.max(0,EDIT.segments.findIndex(s=>s.editStart>time)-1);
 function skip(direction:number){const target=EDIT.segments[Math.max(0,Math.min(EDIT.segments.length-1,segmentIndex+direction))];engine.current?.seek(target.editStart);}
 async function begin(){setEntered(true);await engine.current?.play();}
 return <main className="experience">
  <div ref={host} className="world" aria-label="Interactive 3D Galilean hillside" />
  <div className="shade" aria-hidden="true"/>
  <header className="topbar">
   <a className="identity" href="#" onClick={e=>{e.preventDefault();setInfo(v=>!v);}}><span className="brandmark">✦</span><span>AMONG THE CROWD<small>A BIBLE STUDY EXPERIENCE</small></span></a>
   <div className="top-actions"><span className="location"><span/> GALILEE · c. AD 30</span><Button variant="ghost" onClick={()=>setInfo(v=>!v)} aria-expanded={info}>About this scene <ArrowUpRight size={14}/></Button></div>
  </header>
  <div className="version-picker" role="group" aria-label="Compare character models">
   <span>CHARACTERS</span>{([['v1','V1 · Blender'],['v2','V2 · Free models']] as const).map(([id,label])=><Button key={id} variant="ghost" aria-pressed={version===id} disabled={!ready||(id==='v2'&&!v2Ready)} onClick={()=>{engine.current?.version(id);setVersion(id);}}>{id==='v2'&&!v2Ready?(v2Failed?'V2 · Unavailable':'V2 · Loading…'):label}</Button>)}
   <Button variant="ghost" disabled={!ready} onClick={()=>engine.current?.closeView()}>Closer view</Button>
  </div>
  {<div className="film-comparison">
   {film ? <SermonFilm time={time} playing={playing} onClose={()=>setFilm(false)}/> : <button className="show-film" onClick={()=>setFilm(true)}>Show original film</button>}
  </div>}
  <section className={`invitation ${entered?'compact':''}`}>
   <p className="eyebrow">THE WORD, WITHIN REACH</p>
   <h1>Sit among<br/>the listeners.</h1>
   {!entered&&<><p className="intro">A hillside in Galilee. A gathering of ordinary people.<br/>Step into the crowd and listen to Jesus teach.</p><Button className="enter" onClick={begin} disabled={!ready}><Play size={16} fill="currentColor"/>{ready?'Enter the sermon':'Preparing your place…'}<span>{formatTime(EDIT.duration)}</span></Button><p className="headphone-note"><Headphones size={13}/> Best experienced with headphones</p></>}
   {entered&&<p className="intro">Sermon on the Mount <span>·</span> Luke 6</p>}
  </section>
  <aside className="scene-tag"><span className="tag-line"/><p>01 / THE HILLSIDE<small>JESUS · Teaching excerpts</small></p></aside>
  <div className="look-hint"><Compass size={17}/><span>Drag to look around</span><i>·</i><span>W A S D to walk</span></div>
  <div className="subtitle" aria-live="off" hidden={!captions||!cue}><span>{cue}</span></div>
  <footer className="bottom-panel">
   <div className="transport"><Button className="play-button" size="icon" aria-label={playing?'Pause sermon':'Play sermon'} disabled={!ready} onClick={()=>{setEntered(true);engine.current?.toggle();}}>{playing?<Pause size={19}/>:<Play size={19} fill="currentColor"/>}</Button><div className="track-meta"><strong>Sermon on the Mount</strong><small>{playing?`${segmentIndex+1} / 11 · ${currentSegment?.label??"A moment to reflect"}`:status}</small></div><Button variant="ghost" size="icon" aria-label="Restart sermon" onClick={()=>engine.current?.seek(0)}><RotateCcw size={16}/></Button><span className="elapsed">{formatTime(time)}</span><Slider aria-label="Sermon position" min={0} max={EDIT.duration} step={.1} value={[time]} onValueChange={v=>engine.current?.seek(Array.isArray(v)?v[0]:v)}/><span className="duration">{formatTime(EDIT.duration)}</span><div className="volume"><Volume2 size={15}/><Slider aria-label="Volume" min={0} max={1} step={.01} value={[volume]} onValueChange={v=>{const n=Array.isArray(v)?v[0]:v;setVolume(n);engine.current?.volume(n);}}/></div></div>
   <div className="toolbar"><div className="controls-left"><Button variant="ghost" size="icon" aria-label="Previous teaching excerpt" onClick={()=>skip(-1)}><SkipBack size={15}/></Button><Button variant="ghost" size="icon" aria-label="Next teaching excerpt" onClick={()=>skip(1)}><SkipForward size={15}/></Button><Button variant="ghost" onClick={()=>engine.current?.reset()}><Compass size={15}/> Your place</Button><Button variant="ghost" onClick={()=>engine.current?.walk()} aria-pressed={walk}><Footprints size={15}/>{walk?'Esc to release':'Walk freely'}</Button><div className="cc-control"><Captions size={18}/><Switch aria-label="Subtitles" checked={captions} onCheckedChange={v=>{setCaptions(v);engine.current?.captions(v);}}/></div></div><div className="vr-container" ref={vr}/></div>
  </footer>
  <div className="touch-movement" aria-label="Touch movement controls">{[['forward','↑'],['left','←'],['back','↓'],['right','→']].map(([dir,label])=><button key={dir} aria-label={`Move ${dir}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);engine.current?.move(dir,true);}} onPointerUp={()=>engine.current?.move(dir,false)} onPointerCancel={()=>engine.current?.move(dir,false)}>{label}</button>)}</div>
  {info&&<aside className="about-panel"><Button className="close-about" variant="ghost" size="icon" aria-label="Close scene notes" onClick={()=>setInfo(false)}><X size={18}/></Button><p className="eyebrow">BEHIND THE EXPERIENCE</p><h2>A place to listen.</h2><p>This reconstruction takes its palette, crowd, woven shelters, and rocky landscape from the JESUS film’s sermon scene. It is an artistic interpretation, not a surveyed historical site.</p><p>The film calls this chapter “Sermon on the Mount”; its teaching is drawn from Luke 6. English sound and timed captions come from Jesus Film Project.</p><p>Drag to look. Use WASD or arrow keys to move. Shift walks faster. In VR, use the left stick to move, the right stick to snap-turn, and a trigger to pause or play.</p><p className="small-note">Eleven edited excerpts retain Jesus’ teaching and remove the separate crowd exchanges. Original background sound remains beneath his voice. Gestures follow reviewed film moments; mouth movement follows speech energy. Headset support requires WebXR and HTTPS; desktop exploration works here.</p><p className="small-note">V1 preserves the original procedural Blender characters. V2 combines Quaternius’ CC0 humans, hair and motion clips with an adapted CC0 robe by CDmir / TinyWorlds. Switching preserves your position and playback. V2 adds subtle jaw, mouth-width, blink and brow controls; these are an approximation, not phoneme-accurate lip sync. The borrowed robe is adapted medieval clothing, not a verified historical reconstruction.</p><a href="./models-v2/CREDITS.md" target="_blank" rel="noreferrer">V2 model sources & licenses <ArrowUpRight size={14}/></a><div className="excerpt-list"><h3>Teaching excerpts</h3>{EDIT.segments.map((part,i)=><div key={part.id}><Button variant="ghost" onClick={()=>{engine.current?.seek(part.editStart);setEntered(true);void engine.current?.play();}}>{String(i+1).padStart(2,"0")} · {part.label}</Button><a href={part.audio.replace(/^\//, './')} download aria-label={`Download ${part.label}`}>WAV ↓</a></div>)}</div><a href={SERMON.source} target="_blank" rel="noreferrer">Watch the official film chapter <ArrowUpRight size={14}/></a><a href="https://www.jesusfilm.org/about/faq/" target="_blank" rel="noreferrer">Film credits & usage terms <ArrowUpRight size={14}/></a><p className="small-note">Audio and captions from JESUS, produced by Jesus Film Project. Used for this ministry prototype. Film media and trademarks remain with their respective rights holders.</p></aside>}
 </main>;
}
