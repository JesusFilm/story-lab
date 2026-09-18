// Lightweight gameplay sound for the village route.
//
// This owner deliberately starts only after a user gesture. It owns the
// gameplay bed and effects without touching the story diorama or loader
// lifecycle; those transitions are a separate, deferred investigation.

import {createNightAmbience} from './night-ambience.mjs';

export function createGameplayAudio({onChange=()=>{},loadRecording}={}){
 let night=null;
 let context=null,master=null,ambience=null,effects=null;
 let breezeBuffer=null,footstepBuffers=null,tapBuffer=null;
 let started=false,muted=false,desiredActive=false,contextActive=false;
 const walkers=Array.from({length:3},(_,i)=>({distance:0,moving:false,phase:i/3,steps:0}));
 let stepDistance=0,breezeTime=7;
 const events={footsteps:0,decisions:0,breezes:0};

 function noiseBuffer(seconds,shape='footstep'){
  const length=Math.max(1,Math.ceil((context?.sampleRate||44100)*seconds));
  const buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++){
   const t=i/length;
   const envelope=shape==='breeze'
    ?Math.pow(1-t,1.7)*(.55+.45*Math.sin(t*Math.PI*5))
    :shape==='sand'
     ?Math.sin(Math.PI*t)**1.3*(.65+.2*Math.sin(t*31)+.15*Math.sin(t*73))
     :Math.exp(-t*18)*(1-.15*Math.sin(t*Math.PI));
   data[i]=(Math.random()*2-1)*envelope;
  }
  return buffer;
 }

 function makeGraph(){
  if(context)return;
  const AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!AudioCtor)return;
  try{context=new AudioCtor();}
  catch{context=null;return;}
  master=context.createGain();master.gain.value=.5;master.connect(context.destination);
  ambience=context.createGain();ambience.gain.value=.55;ambience.connect(master);
  effects=context.createGain();effects.gain.value=.9;effects.connect(master);
  night=createNightAmbience(context,ambience,{load:loadRecording});
  breezeBuffer=noiseBuffer(.9,'breeze');
  tapBuffer=noiseBuffer(.07,'tap');
  footstepBuffers=Array.from({length:6},()=>noiseBuffer(.22+Math.random()*.07,'sand'));
 }

 function notify(){onChange({muted,started,running:context?.state==='running'});}

 function resume(){
  makeGraph();
  if(!context)return Promise.resolve(false);
  return context.resume().then(()=>{contextActive=true;notify();return true;}).catch(()=>false);
 }

 function suspend(){
  if(!context)return Promise.resolve(false);
  contextActive=false;
  return context.suspend().then(()=>{notify();return true;}).catch(()=>false);
 }

 function reconcile(){
  const shouldRun=started&&!muted&&desiredActive;
  if(shouldRun===contextActive)return;
  if(shouldRun)resume();else suspend();
 }

 function begin(){
  started=true;desiredActive=true;reconcile();
  return true;
 }

 function setActive(active){
  desiredActive=!!active;
  if(started)reconcile();
 }

 function setMuted(value){
  muted=!!value;
  if(muted){stepDistance=0;walkers.forEach(w=>{w.distance=0;w.moving=false;});}
  if(started)reconcile();
  notify();
 }

 function toggle(){
  if(muted)setMuted(false);else setMuted(true);
  if(!started&&!muted)begin();
 }

 function playFootstep(movement,walker=0){
  if(!context||context.state!=='running'||!footstepBuffers)return;
  const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=footstepBuffers[Math.floor(Math.random()*footstepBuffers.length)];filter.type='lowpass';filter.frequency.value=1600+Math.random()*700;filter.Q.value=.35;
  const speedGain=movement>3.6?.055:.034,variation=.84+Math.random()*.26;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(speedGain*variation*(walker? .8:1),now+.045);gain.gain.exponentialRampToValueAtTime(.001,now+.24);
  source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.29);events.footsteps++;
 }

 function playBreeze(){
  if(!context||context.state!=='running'||!breezeBuffer)return;
  const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=breezeBuffer;filter.type='bandpass';filter.frequency.value=950;filter.Q.value=.45;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.025,now+.22);gain.gain.exponentialRampToValueAtTime(.001,now+.88);
  source.connect(filter).connect(gain).connect(ambience);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.9);events.breezes++;
 }

 function ignite(){
  if(muted)return false;
  if(!started)begin();
  const play=()=>{
   if(muted||context?.state!=='running')return;
   // A dry tinder strike followed by a small breath of flame; no pitched reward.
   const now=context.currentTime;
   for(const [buffer,offset,duration,frequency,level] of [[tapBuffer,0,.08,2200,.3],[breezeBuffer,.07,.65,1400,.16]]){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;
    gain.gain.setValueAtTime(.001,now+offset);gain.gain.linearRampToValueAtTime(level,now+offset+.025);gain.gain.exponentialRampToValueAtTime(.001,now+offset+duration);
    source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now+offset);source.stop(now+offset+duration);
   }
   events.ignitions=(events.ignitions||0)+1;
  };
  if(context?.state==='running')play();else resume().then(play);
  return true;
 }

 function cue(kind='decision'){
  if(muted)return false;
  if(!started)begin();
  const play=()=>{
   if(!context||context.state!=='running'||!tapBuffer)return;
   const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=tapBuffer;filter.type='bandpass';filter.frequency.value=(kind==='assembly'?190:280)+Math.random()*110;filter.Q.value=.85;
   const level=kind==='assembly'?.32:.41;
   gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(level,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+.075);
   source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.085);events.decisions++;
  };
  if(context?.state==='running')play();else resume().then(play);
  return true;
 }

 function update(dt,{movement=0,active=true,position=null,companions=[],environment={}}={}){
  if(!Number.isFinite(dt)||dt<=0)return;
  setActive(active);
  if(!started||muted||!contextActive)return;
  [movement,...[0,1].map(i=>companions[i]||0)].forEach((speed,i)=>{
   const walker=walkers[i],moving=Number.isFinite(speed)&&speed>.35;
   if(!moving){walker.distance=0;walker.moving=false;return;}
   const stride=(speed>3.6?1.45:1.1)*(1+i*.025);
   if(!walker.moving){walker.distance=walker.phase*stride;walker.moving=true;}
   walker.distance+=speed*dt;
   while(walker.distance>=stride){walker.distance-=stride;playFootstep(speed,i);walker.steps++;}
  });
  stepDistance=walkers[0].distance;
  breezeTime-=dt;
  if(breezeTime<=0){playBreeze();breezeTime=9+Math.random()*12;}
  night?.update(dt,{...environment,position});
 }

 function stop(){
  desiredActive=false;started=false;walkers.forEach(w=>{w.distance=0;w.moving=false;});stepDistance=0;breezeTime=7;
  night?.stop();night=null;
  if(context)context.close().catch(()=>{});
  context=null;master=ambience=effects=breezeBuffer=tapBuffer=footstepBuffers=null;contextActive=false;notify();
 }

 return {resetAmbience:()=>night?.reset(),ignite,begin,setActive,setMuted,toggle,cue,update,stop,getState:()=>({started,muted,running:context?.state==='running',contextState:context?.state||'closed',stepDistance,breezeTime,night:night?.getState(),walkers:walkers.map(w=>({steps:w.steps,moving:w.moving})),events:{...events}})};
}
