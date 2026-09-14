import * as THREE from 'three';
import {CompanionCharacter} from './companion-character.mjs';
import {height} from './journey-world.mjs';
import {REUNION_LINES} from './companion-reunion.mjs';
import {smooth} from './empty-stall.mjs';

export function createCompanionReunionScene(journey,scene,character){
 const $=id=>document.getElementById(id);
 const companions=['tall','stocky'].map(variant=>{
  const root=new THREE.Group();root.name=`reunion-${variant}`;root.visible=false;scene.add(root);
  return {root,character:new CompanionCharacter(root,variant)};
 });
 let previous,context,lastShot,stepBeat=-1;
 const active=()=>journey.index===8&&!journey.travel&&journey.houseOwner.complete;
 function unlock(){try{context??=new AudioContext();context.resume().catch(()=>{});}catch{}}
 $('sighting-next').addEventListener('click',()=>{if(journey.index===8)unlock();});
 function update(){
  if(previous!==journey.reunion){previous=journey.reunion;stepBeat=-1;lastShot=null;}
  if(journey.paused)context?.suspend().catch(()=>{});
  else if(context?.state==='suspended')context.resume().catch(()=>{});
  document.body.classList.toggle('reunion',active());
  if(!active())return;
  const r=journey.reunion,p=r.phase;
  $('point-title').textContent=p==='arriving'?'The way is open':'Together again';
  $('review-state').textContent=journey.staged?'Staged · reunion draft':'Reunion draft';
  $('beat').textContent=REUNION_LINES[p]||({arriving:'Footsteps from the gate. The others are catching up.',departing:'The others hurry toward the animal pen.',waiting:'They wait just ahead, beside the way into the animal pen.'})[p]||'';
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':({arriving:'They come through the gate you opened.',question:'Companion',directions:'Shepherd',invitation:'Other companion',departing:'They hurry toward the entrance.',waiting:'Follow when you are ready.'})[p]||'';
  $('advance').textContent=({question:'Tell them what you learned',directions:'Continue',invitation:'Let’s go',departing:'Follow the others',waiting:'Follow the others'})[p]||'The others are coming…';
  $('advance').hidden=['arriving','departing'].includes(p);$('advance').disabled=journey.paused||p==='arriving'||(p==='departing'&&!r.canFollow);
 }
 function footstep(){
  if(context?.state!=='running')return;
  const duration=.08,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.015));
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=buffer;filter.type='lowpass';filter.frequency.value=320;gain.gain.value=.045;
  source.connect(filter).connect(gain).connect(context.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
 }
 function poseActors(dt,instant){
  const r=journey.reunion;
  companions.forEach((c,i)=>{
   const a=r.actors[i];c.root.visible=a.visible;if(!a.visible)return;
   c.root.position.set(a.x,height(a.x,a.z)+.015,a.z);
   const delta=Math.atan2(Math.sin(a.heading-c.root.rotation.y),Math.cos(a.heading-c.root.rotation.y));
   c.root.rotation.y+=instant?delta:delta*(1-Math.exp(-9*dt));
   c.character.update(dt,{movement:a.moving?a.speed:0,paused:journey.paused});
  });
  const beat=Math.floor(r.elapsed*5);
  if(active()&&['arriving','departing'].includes(r.phase)&&r.actors.some(a=>a.moving)&&beat!==stepBeat){stepBeat=beat;footstep();}
 }
 function face(){
  if(!active())return null;
  const r=journey.reunion;
  if(['directions','invitation','departing','waiting'].includes(r.phase))return {x:-16,z:-36};
  if(r.phase==='arriving')return r.actors.find(a=>a.visible)||{x:-14.8,z:-12.8};
  return {x:-11.2,z:-28};
 }
 function poseHands(){
  if(!active()||journey.reunion.phase!=='directions')return;
  const model=character.tripo?.model,hand=model?.getObjectByName('L_Hand');if(!hand)return;
  const target=new THREE.Vector3(-13.8,height(-13,-29)+1.35,-30.2),amount=smooth(journey.reunion.elapsed/.6);
  for(let i=0;i<3;i++)for(const name of ['L_Forearm','L_Upperarm']){
   const joint=model.getObjectByName(name);if(!joint)continue;model.updateMatrixWorld(true);
   const from=joint.worldToLocal(hand.getWorldPosition(new THREE.Vector3())).normalize(),to=joint.worldToLocal(target.clone()).normalize();
   joint.quaternion.multiply(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(from,to),amount*.75));
  }
 }
 function tick(camera,reduced){
  const r=journey.reunion,onward=journey.travel?.index===9&&r.followRequested;
  if(!active()&&!onward)return;
  const portrait=camera.aspect<1;
  const gateEye=new THREE.Vector3(-9,height(-14,-17)+(portrait?7.4:4.1),portrait?-26:-22);
  const gateLook=new THREE.Vector3(-15.5,height(-15,-12)+1,-11.8);
  const groupEye=new THREE.Vector3(portrait?-4.8:-6.3,height(-13,-29)+(portrait?5.2:3.4),portrait?-22.5:-24.5);
  const groupLook=new THREE.Vector3(-12.6,height(-13,-29)+1.05,-28.4);
  const departEye=new THREE.Vector3(portrait?-3.5:-5.5,height(-13,-29)+(portrait?7:4.8),portrait?-19.5:-22);
  const departLook=new THREE.Vector3(-15,height(-15,-32)+1,-32.5);
  if(onward){
   const weight=reduced?0:1-smooth(journey.travel.progress/3);
   const look=camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(12));
   camera.position.lerp(lastShot?.eye||departEye,weight);camera.lookAt(look.lerp(lastShot?.look||departLook,weight));return;
  }
  const gather=r.phase==='arriving'?(reduced?Number(r.cameraElapsed>0):smooth(r.cameraElapsed/3)):1;
  const departure=['departing','waiting'].includes(r.phase)?(reduced||r.phase==='waiting'?1:smooth(r.elapsed/1.8)):0;
  camera.position.copy(gateEye.lerp(groupEye,gather).lerp(departEye,departure));
  const look=gateLook.lerp(groupLook,gather).lerp(departLook,departure);camera.lookAt(look);
  lastShot={eye:camera.position.clone(),look:look.clone()};
 }
 return {load:loader=>Promise.all(companions.map(c=>c.character.load(loader))),update,poseActors,poseHands,face,tick};
}
