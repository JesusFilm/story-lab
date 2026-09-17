// Lightweight gameplay sound for the village route.
//
// This owner deliberately starts only after a user gesture. It owns the
// gameplay bed and effects without touching the story diorama or loader
// lifecycle; those transitions are a separate, deferred investigation.

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const proximitySources=[
 {kind:'sheep',x:25,z:-26,radius:16,cooldown:1.8,minInterval:7,maxInterval:13},
 {kind:'voices',x:-11.5,z:19.2,radius:8,cooldown:2.4,minInterval:8,maxInterval:15},
 {kind:'voices',x:-13.2,z:.6,radius:8,cooldown:4.2,minInterval:8,maxInterval:15},
 {kind:'voices',x:5.8,z:-20.1,radius:9,cooldown:2.8,minInterval:7,maxInterval:13},
 {kind:'voices',x:-17.7,z:-29.2,radius:9,cooldown:3.5,minInterval:8,maxInterval:15}
];

export function createGameplayAudio({onChange=()=>{}}={}){
 let context=null,master=null,ambience=null,effects=null;
 let breezeBuffer=null,footstepBuffer=null,cricketBuffer=null,tapBuffer=null;
 let started=false,muted=false,desiredActive=false,contextActive=false;
 let stepDistance=0,insectTime=1.6,breezeTime=7;
 const sources=proximitySources.map(source=>({...source}));
 const events={footsteps:0,decisions:0,crickets:0,breezes:0,sheep:0,voices:0};

 function noiseBuffer(seconds,shape='footstep'){
  const length=Math.max(1,Math.ceil((context?.sampleRate||44100)*seconds));
  const buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++){
   const t=i/length;
   const envelope=shape==='breeze'
    ?Math.pow(1-t,1.7)*(.55+.45*Math.sin(t*Math.PI*5))
    :shape==='cricket'
     ?Math.exp(-t*30)*(.7+.3*Math.sin(t*Math.PI*8))
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
  breezeBuffer=noiseBuffer(.9,'breeze');
  cricketBuffer=noiseBuffer(.075,'cricket');
  tapBuffer=noiseBuffer(.07,'tap');
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
  const speedGain=movement>3.6?.14:.11,variation=.84+Math.random()*.26;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(speedGain*variation,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+.095);
  source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.11);events.footsteps++;
 }

 function playCricket(){
  if(!context||context.state!=='running'||!cricketBuffer)return;
  const now=context.currentTime,root=context.createGain();root.gain.value=.65;root.connect(ambience);
  const length=.065+Math.random()*.045;
  for(const offset of [0,.048]){
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=cricketBuffer;filter.type='bandpass';filter.frequency.value=2300+Math.random()*1900;filter.Q.value=2.4;
   gain.gain.setValueAtTime(.001,now+offset);gain.gain.exponentialRampToValueAtTime(.052,now+offset+.006);gain.gain.exponentialRampToValueAtTime(.001,now+offset+length);
   source.connect(filter).connect(gain).connect(root);source.start(now+offset);source.stop(now+offset+length+.01);
  }
  setTimeout(()=>{try{root.disconnect();}catch{}},Math.ceil((length+.15)*1000));events.crickets++;
 }

 function playBreeze(){
  if(!context||context.state!=='running'||!breezeBuffer)return;
  const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=breezeBuffer;filter.type='bandpass';filter.frequency.value=950;filter.Q.value=.45;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.025,now+.22);gain.gain.exponentialRampToValueAtTime(.001,now+.88);
  source.connect(filter).connect(gain).connect(ambience);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.9);events.breezes++;
 }

 function playSheep(amount){
  if(!context||context.state!=='running')return;
  const now=context.currentTime,oscillator=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();
  oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(235,now);oscillator.frequency.exponentialRampToValueAtTime(155,now+.62);
  filter.type='bandpass';filter.frequency.value=520;filter.Q.value=.9;
  const level=.075*amount;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(level,now+.07);gain.gain.exponentialRampToValueAtTime(.001,now+.68);
  oscillator.connect(filter).connect(gain).connect(ambience);oscillator.start(now);oscillator.stop(now+.72);oscillator.onended=()=>{oscillator.disconnect();filter.disconnect();gain.disconnect();};events.sheep++;
 }

 function playMuffledVoices(amount){
  if(!context||context.state!=='running')return;
  const now=context.currentTime,output=context.createGain(),filter=context.createBiquadFilter();
  output.gain.value=amount;filter.type='lowpass';filter.frequency.value=620;filter.Q.value=.5;output.connect(filter).connect(ambience);
  for(const [frequency,offset] of [[170,0],[235,.12],[198,.29]]){
   const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';oscillator.frequency.value=frequency*(.97+Math.random()*.06);
   gain.gain.setValueAtTime(.001,now+offset);gain.gain.exponentialRampToValueAtTime(.035,now+offset+.08);gain.gain.exponentialRampToValueAtTime(.001,now+offset+.58);
   oscillator.connect(gain).connect(output);oscillator.start(now+offset);oscillator.stop(now+offset+.64);
  }
  setTimeout(()=>{try{output.disconnect();filter.disconnect();}catch{}},900);events.voices++;
 }

 function updateProximity(dt,position){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return;
  for(const source of sources){
   const distance=Math.hypot(position.x-source.x,position.z-source.z),amount=clamp(1-distance/source.radius,0,1);
   source.cooldown-=dt;
   if(amount<=0||source.cooldown>0)continue;
   if(source.kind==='sheep')playSheep(amount);else playMuffledVoices(amount);
   source.cooldown=source.minInterval+Math.random()*(source.maxInterval-source.minInterval);
  }
 }

 function cue(kind='decision'){
  if(muted)return false;
  if(!started)begin();
  const play=()=>{
   if(!context||context.state!=='running'||!tapBuffer)return;
   const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=tapBuffer;filter.type='bandpass';filter.frequency.value=(kind==='assembly'?190:280)+Math.random()*110;filter.Q.value=.85;
   const level=kind==='assembly'?.035:.045;
   gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(level,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+.075);
   source.connect(filter).connect(gain).connect(effects);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start(now);source.stop(now+.085);events.decisions++;
  };
  if(context?.state==='running')play();else resume().then(play);
  return true;
 }

 function update(dt,{movement=0,active=true,position=null}={}){
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
  if(insectTime<=0){playCricket();insectTime=3.2+Math.random()*6.8;}
  breezeTime-=dt;
  if(breezeTime<=0){playBreeze();breezeTime=9+Math.random()*12;}
  updateProximity(dt,position);
 }

 function stop(){
  desiredActive=false;started=false;stepDistance=0;insectTime=1.6;breezeTime=7;
  if(context)context.close().catch(()=>{});
  context=null;master=ambience=effects=breezeBuffer=cricketBuffer=tapBuffer=footstepBuffer=null;contextActive=false;notify();
 }

 return {begin,setActive,setMuted,toggle,cue,update,stop,getState:()=>({started,muted,running:context?.state==='running',contextState:context?.state||'closed',stepDistance,insectTime,breezeTime,events:{...events}})};
}
