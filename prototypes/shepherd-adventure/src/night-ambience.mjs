// Recorded ambience. Playback follows gameplay time, not wall-clock timers.
const clamp=v=>Math.max(0,Math.min(1,v));
export const near=(p,q,r)=>p&&q?clamp(1-Math.hypot(p.x-q.x,p.z-q.z)/r):0;
const FILES={crickets:'crickets',sheep:'sheep',frog:'frog',jackal:'jackal',wolf:'wolf',voices:'house-murmur',women:'house-women',family:'house-family'};
const HOUSE_VOICES={3:'voices',8:'women',9:'family'};
const LOOP_KEYS=new Set(['crickets','voices','women','family']);
// Bake an equal-power overlap into decoded PCM, avoiding MP3 edge silence and
// timer-driven restarts. The wrap rejoins adjacent samples of the original head.
export function crossfadeLoop(context,buffer,seconds=2){
 const overlap=Math.min(Math.round(seconds*buffer.sampleRate),Math.floor(buffer.length/4));
 if(overlap<2)return buffer;
 const result=context.createBuffer(buffer.numberOfChannels,buffer.length-overlap,buffer.sampleRate);
 for(let channel=0;channel<buffer.numberOfChannels;channel++){
  const input=buffer.getChannelData(channel),output=result.getChannelData(channel),body=buffer.length-2*overlap;
  output.set(input.subarray(overlap,buffer.length-overlap));
  for(let i=0;i<overlap;i++){
   const angle=i/(overlap-1)*Math.PI/2;
   output[body+i]=input[buffer.length-overlap+i]*Math.cos(angle)+input[i]*Math.sin(angle);
  }
 }
 return result;
}
export async function loadNightRecording(context,name){
 const response=await fetch(new URL(`../assets/audio/${FILES[name]}.mp3`,import.meta.url));
 if(!response.ok)throw Error(`Cannot load ${name}: ${response.status}`);
 return context.decodeAudioData(await response.arrayBuffer());
}

export function createNightAmbience(context,bus,{load=loadNightRecording,random=Math.random}={}){
 const buffers={},loops=new Map(),shots=new Set(),seen=new Set(),pending=[];
 const counts={sheep:0,jackal:0,wolf:0,frog:0},failures=[];
 let disposed=false,clock=0,nextCall=0,frogWait=8+random()*12;
 const ready=Promise.all(Object.keys(FILES).map(async key=>{
  try{const buffer=await load(context,key);if(!disposed)buffers[key]=LOOP_KEYS.has(key)?crossfadeLoop(context,buffer):buffer;}
  catch(error){failures.push(key);console.warn(`Gameplay audio: ${key} unavailable`,error);}
 }));
 function loop(id,key,target,dt){
  let item=loops.get(id);
  if(!item&&target>0&&buffers[key]){
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[key];source.loop=true;
   gain.gain.value=0;source.connect(gain).connect(bus);source.start(0,key!=='crickets'?random()*source.buffer.duration:0);
   item={source,gain,key,level:0};loops.set(id,item);
  }
  if(!item)return;
  item.level+=(target-item.level)*(1-Math.exp(-dt*4));
  item.gain.gain.setTargetAtTime(item.level,context.currentTime,.08);
 }
 function shot(key,volume){
  if(!buffers[key])return false;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[key];source.loop=false;gain.gain.value=volume;
  source.connect(gain).connect(bus);shots.add(source);source.onended=()=>{shots.delete(source);source.disconnect();gain.disconnect();};source.start();counts[key]++;return true;
 }
 function reset(){
  seen.clear();pending.length=0;clock=0;nextCall=0;frogWait=8+random()*12;
  for(const key of Object.keys(counts))counts[key]=0;
  for(const source of shots){try{source.stop();}catch{}}shots.clear();
  for(const {source,gain} of loops.values()){source.stop();source.disconnect();gain.disconnect();}loops.clear();
 }
 function update(dt,{position,point=-1,lights=[],houses=[],well=null}={}){
  if(disposed||context.state!=='running'||!Number.isFinite(dt)||dt<=0)return;
  clock+=dt;
  const light=Math.max(0,...lights.map(l=>near(position,l,9)));
  loop('crickets','crickets',.12*(1-light)**2,dt);
  const activeHouses=new Set();
  for(const house of houses){
   const id=`house-${house.id}`;activeHouses.add(id);
   const distance=near(position,house,11);
   // The resident's open doorway suppresses that house's background conversation.
   loop(id,HOUSE_VOICES[house.id]||'voices',house.open?0:.38*distance**1.6,dt);
  }
  for(const id of loops.keys())if(id.startsWith('house-')&&!activeHouses.has(id))loop(id,'voices',0,dt);
  // Five spaced bleats across a full route, including the pen and shelter approach.
  for(const [key,points,volume] of [['sheep',[0,2,5,6,9],.36],['jackal',[3],.16],['wolf',[8],.13]]){
   const id=`${key}-${point}`;
   if(points.includes(point)&&!seen.has(id)){seen.add(id);pending.push({key,volume,at:clock+1.5});}
  }
  while(pending.length&&failures.includes(pending[0].key))pending.shift();
  const call=pending[0];
  if(call&&clock>=call.at&&clock>=nextCall&&buffers[call.key]){
   if(shot(call.key,call.volume)){pending.shift();nextCall=clock+Math.max(8,buffers[call.key].duration+2);}
  }
  const frogLevel=near(position,well,14);
  if(frogLevel>0){
   frogWait-=dt;
   if(frogWait<=0&&buffers.frog){shot('frog',.4*frogLevel);frogWait=30+random()*30;}
  }
 }
 return {ready,update,reset,stop(){disposed=true;reset();},getState:()=>({loaded:Object.keys(buffers),failures:[...failures],counts:{...counts},pending:pending.length,frogWait,houseTracks:Object.fromEntries([...loops].filter(([id])=>id.startsWith('house-')).map(([id,item])=>[id,item.key])),levels:Object.fromEntries([...loops].map(([id,item])=>[id,item.level]))})};
}
