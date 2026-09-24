import * as THREE from 'three';
import {KNOCK_TIMES,HOUSE_TIMING} from './house-rejection.mjs';
import {height} from './journey-world.mjs';
import {loadAudioRecording} from './night-ambience.mjs';

export function createHouseScene(journey,scene,character,{isMuted=()=>false}={}){
 const $=id=>document.getElementById(id);
 const effects=new THREE.Group();effects.name='Shared house knock and House 1 response';scene.add(effects);
 const light=new THREE.PointLight('#ffb34e',0,8,2);light.position.set(-11.5,height(-9,18.5)+1.95,17.15);effects.add(light);
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(.58,.72),new THREE.MeshBasicMaterial({color:'#ffb45c',transparent:true,opacity:0,side:THREE.DoubleSide,toneMapped:false}));
 pane.rotation.y=-Math.PI/2;pane.position.set(-11.22,height(-9,18.5)+1.95,17.15);effects.add(pane);
 const rings=KNOCK_TIMES.map(()=>{
  const ring=new THREE.Mesh(new THREE.RingGeometry(.11,.135,40),new THREE.MeshBasicMaterial({color:'#ffe0a0',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.y=-Math.PI/2;ring.position.set(-11.37,height(-9,18.5)+1.35,19.35);effects.add(ring);return ring;
 });
 let context,voiceBuffer,voicePromise,previous=null,played=new Set(),nodes=[],audioFailed=false,unlockPending=false;
 const voiceURL=new URL('../assets/house-1/resident-refusal.wav',import.meta.url);
 function preloadVoice(){
  try{
   context??=new AudioContext();
   voicePromise=loadAudioRecording(context,voiceURL).then(buffer=>{voiceBuffer=buffer;return buffer;}).catch(()=>{audioFailed=true;return null;});
  }catch{audioFailed=true;voicePromise=Promise.resolve(null);}
 }

 function stopAudio(){for(const node of nodes){try{node.stop();node.disconnect();}catch{}}nodes=[];played.clear();}
 async function unlock(){
 if(isMuted())return;
 if(!voicePromise)preloadVoice();
  try{context??=new AudioContext();await context.resume();await voicePromise;}
  catch{audioFailed=true;}
 }
 function knockSound(){
  if(isMuted()||!context||context.state!=='running')return;
  // A short noise transient and two damped wood resonances; no external sound asset.
  const buffer=context.createBuffer(1,context.sampleRate*.1,context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.009))*.112;
  const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();nodes.push(source);
  for(const frequency of [155,310]){const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;oscillator.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(.077,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(now+.17);nodes.push(oscillator);}
 }
 function active(){return [1,2,4,6,8].includes(journey.index)&&!journey.travel;}
 function current(){return journey.index===8?journey.houseOwner:journey.index===6?journey.houseAdvice:journey.index===4?journey.houseTracks:journey.index===2?journey.houseSighting:journey.houseRejection;}
 function update(){
  if(previous!==current()){stopAudio();previous=current();}
  if(!active()){effects.visible=false;light.intensity=0;pane.material.opacity=0;stopAudio();return;}
  effects.visible=true;
  effects.rotation.y=journey.index===8?Math.PI:0;
  effects.position.set(journey.index===2?-1:0,journey.index===2?height(-10,0)-height(-9,18.5):0,journey.index===2?-18.5:0);
  if(journey.index===8)effects.position.set(-27,height(-18,-29)-height(-9,18.5),-10.5);
  if(journey.index===6)effects.position.set(15,height(6,-20.5)-height(-9,18.5),-39);
  if(journey.index===4)effects.position.set(30.865,height(22,8.5)-height(-9,18.5),-10.6);
 if(context){if(journey.paused||isMuted())context.suspend().catch(()=>{});else if(context.state==='suspended')context.resume().catch(()=>{});}
  if(journey.index===1&&journey.houseRejection.started&&!isMuted()&&context?.state!=='running'&&!unlockPending){unlockPending=true;unlock().finally(()=>{unlockPending=false;});}
  if(journey.index!==1)return;
  const h=journey.houseRejection,phase=h.phase;
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  const responseVisible=['refusal','dark','complete'].includes(phase);
  $('beat').textContent=responseVisible?'“Go away! It is late!”':'';
  $('travel-status').textContent=audioFailed&&responseVisible?'Sound unavailable — the response is shown above.':'';
  $('advance').textContent=phase==='ready'?'Knock on door':h.complete?'Let’s try the next house':'';
  $('advance').disabled=journey.paused||(!h.complete&&h.started);
 }
 function tick(reduced){
  if(!active())return;
  const h=current(),t=journey.index===4?h.knockElapsed:h.elapsed,round=journey.index===4?h.knockRound:0;
  light.intensity=h.lit?6:0;pane.material.opacity=h.lit?.85:0;
  rings.forEach((ring,i)=>{const age=t-KNOCK_TIMES[i];ring.visible=h.started&&age>=0&&age<.3;ring.scale.setScalar(reduced?1:1+Math.max(0,age)*2.8);ring.material.opacity=reduced?.8:Math.max(0,.85-age*2.8);
   if(h.started&&t>=KNOCK_TIMES[i]&&!played.has(round*3+i)){played.add(round*3+i);knockSound();}
  });
  if(journey.index===1&&h.started&&t>=HOUSE_TIMING.voice&&!played.has('voice')){
   if(!isMuted()&&context?.state==='running'&&voiceBuffer){
    played.add('voice');const voice=context.createBufferSource();voice.buffer=voiceBuffer;voice.connect(context.destination);voice.start();nodes.push(voice);
   }else if(!isMuted()&&audioFailed)played.add('voice');
  }
  // Briefly raise the free hand. The carrying hand and authored walk stay untouched.
  const model=character.tripo?.model,hand=model?.getObjectByName('L_Hand');
  if(hand&&h.started&&t>=.55&&t<2){
   const amount=Math.min(1,(t-.55)/.2,Math.max(0,(2-t)/.3));
   const strike=KNOCK_TIMES.some(k=>t>=k-.09&&t<k+.06);
   const target=effects.localToWorld(new THREE.Vector3(-11.5+(strike?.13:0),height(-13,18.5)+1.35,19.35));
   for(let iteration=0;iteration<3;iteration++)for(const name of ['L_Forearm','L_Upperarm']){
    const joint=model.getObjectByName(name);model.updateMatrixWorld(true);
    const current=joint.worldToLocal(hand.getWorldPosition(new THREE.Vector3())).normalize();
    const desired=joint.worldToLocal(target.clone()).normalize();
    const rotation=new THREE.Quaternion().setFromUnitVectors(current,desired);
    joint.quaternion.multiply(new THREE.Quaternion().slerp(rotation,amount));
   }
  }
 }
 return {setActive(value){if(!context)return;value=value&&active()&&!isMuted();if(!value&&context.state==='running')context.suspend().catch(()=>{});else if(value&&context.state==='suspended'&&active()&&!isMuted())context.resume().catch(()=>{});},get audioFailed(){return audioFailed;},getMemory:()=>({context:context?.state||'closed',voiceBytes:voiceBuffer?voiceBuffer.length*voiceBuffer.numberOfChannels*4:0,nodes:nodes.length}),update,tick,begin(){if(!journey.knockOnHouse())return false;stopAudio();unlock();update();return true;},getState:()=>({light:light.intensity,voiceReady:!!voiceBuffer,audioFailed,played:[...played]})};
}
