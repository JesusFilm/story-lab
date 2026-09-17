// Lightweight gameplay sound for the village route.
//
// This owner deliberately starts only after a user gesture. It owns the
// gameplay bed and effects without touching the story diorama or loader
// lifecycle; those transitions are a separate, deferred investigation.

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createGameplayAudio({onChange=()=>{}}={}){
 let context=null,master=null,ambience=null,effects=null,windSource=null;
 let windBuffer=null,footstepBuffer=null;
 let started=false,muted=false,desiredActive=false,contextActive=false;
 let stepDistance=0,insectTime=5;

 function noiseBuffer(seconds,shape='footstep'){
  const length=Math.max(1,Math.ceil((context?.sampleRate||44100)*seconds));
  const buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++){
   const t=i/length;
   const envelope=shape==='wind'
    ? .42+.18*Math.sin(t*Math.PI*2*1.7)+.1*Math.sin(t*Math.PI*2*5.2)
    : Math.exp(-t*18)*(1-.15*Math.sin(t*Math.PI));
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
  master=context.createGain();master.gain.value=.22;master.connect(context.destination);
  ambience=context.createGain();ambience.gain.value=.25;ambience.connect(master);
  effects=context.createGain();effects.gain.value=.52;effects.connect(master);

  windBuffer=noiseBuffer(7,'wind');
  windSource=context.createBufferSource();windSource.buffer=windBuffer;windSource.loop=true;
  const windFilter=context.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=430;windFilter.Q.value=.35;
  windSource.connect(windFilter).connect(ambience);windSource.start();
  footstepBuffer=noiseBuffer(.105,'footstep');
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
  if(muted)stepDistance=0;
  if(started)reconcile();
  notify();
 }

 function toggle(){
  if(muted)setMuted(false);else setMuted(true);
  if(!started&&!muted)begin();
 }

 function playFootstep(movement){
  if(!context||context.state!=='running'||!footstepBuffer)return;
  const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=footstepBuffer;filter.type='bandpass';filter.frequency.value=150+Math.random()*100;filter.Q.value=.55;
  const speedGain=movement>3.6?.052:.042,variation=.84+Math.random()*.26;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(speedGain*variation,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+.095);
  source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.11);
 }

 function playInsect(){
  if(!context||context.state!=='running')return;
  const now=context.currentTime,root=context.createGain();root.gain.value=.001;root.connect(ambience);
  const length=.09+Math.random()*.08;
  for(const [frequency,offset] of [[3100,0],[4200,.045]]){
   const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';oscillator.frequency.value=frequency*(.96+Math.random()*.08);
   gain.gain.setValueAtTime(.001,now+offset);gain.gain.exponentialRampToValueAtTime(.022,now+offset+.008);gain.gain.exponentialRampToValueAtTime(.001,now+offset+length);
   oscillator.connect(gain).connect(root);oscillator.start(now+offset);oscillator.stop(now+offset+length+.01);
  }
  setTimeout(()=>{try{root.disconnect();}catch{}},Math.ceil((length+.15)*1000));
 }

 function cue(kind='decision'){
  if(muted)return false;
  if(!started)begin();
  const play=()=>{
   if(!context||context.state!=='running')return;
   const now=context.currentTime,oscillator=context.createOscillator(),gain=context.createGain();
   const frequency=kind==='confirm'?440:356;
   oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*1.18,now+.12);
   gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.032,now+.018);gain.gain.exponentialRampToValueAtTime(.001,now+.2);
   oscillator.connect(gain).connect(effects);oscillator.start(now);oscillator.stop(now+.22);
  };
  if(context?.state==='running')play();else resume().then(play);
  return true;
 }

 function update(dt,{movement=0,active=true}={}){
  if(!Number.isFinite(dt)||dt<=0)return;
  setActive(active);
  if(!started||muted||!contextActive)return;
  const moving=Number.isFinite(movement)&&movement>.35;
  if(moving){
   stepDistance+=movement*dt;
   const stride=movement>3.6?1.45:1.1;
   while(stepDistance>=stride){stepDistance-=stride;playFootstep(movement);}
  }else stepDistance=0;
  insectTime-=dt;
  if(insectTime<=0){playInsect();insectTime=5+Math.random()*9;}
 }

 function stop(){
  desiredActive=false;started=false;stepDistance=0;insectTime=5;
  if(context)context.close().catch(()=>{});
  context=null;master=ambience=effects=windSource=windBuffer=footstepBuffer=null;contextActive=false;notify();
 }

 return {begin,setActive,setMuted,toggle,cue,update,stop,getState:()=>({started,muted,running:context?.state==='running',contextState:context?.state||'closed',stepDistance,insectTime})};
}
