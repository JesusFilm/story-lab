import * as THREE from 'three';
import {height} from './journey-world.mjs';
import {smooth} from './empty-stall.mjs';
import {playGateTimber} from './gate-scene.mjs';

export function createEmptyStallScene(journey,scene,character,{isMuted=()=>false}={}){
 const $=id=>document.getElementById(id);
 let context,previous,nodes=[],played=false;
 const active=()=>journey.index===7&&!journey.travel;
 const gateTarget=new THREE.Vector3(-15.75,height(-15.75,-13.55)+1.2,-13.55);
 function stop(){for(const n of nodes){try{n.stop();n.disconnect();}catch{}}nodes=[];played=false;}
 function update(){
  const h=journey.emptyStall;
  if(previous!==h){stop();previous=h;}
  if(!active()){stop();return;}
  if(journey.paused||isMuted())context?.suspend().catch(()=>{});else if(context?.state==='suspended')context.resume().catch(()=>{});
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('point-title').textContent=['reveal','house'].includes(h.phase)?'A light in the village':'The empty stall';
  $('beat').textContent=({search:'“No one here.”',light:'“A light for the others.”'})[h.phase]||'';
  $('travel-status').textContent='';
  $('advance').textContent=({light:'Light lantern',gate:'Open gate',house:'Try the lit house'})[h.phase]||'';
  $('advance').hidden=!['light','gate','house'].includes(h.phase);
  $('advance').disabled=journey.paused||!['light','gate','house'].includes(h.phase);
 }
 function reach(side,target,amount){
  const model=character.tripo?.model,hand=model?.getObjectByName(`${side}_Hand`);if(!hand||amount<=0)return;
  for(let i=0;i<3;i++)for(const name of [`${side}_Forearm`,`${side}_Upperarm`]){
   const joint=model.getObjectByName(name);if(!joint)continue;model.updateMatrixWorld(true);
   const from=joint.worldToLocal(hand.getWorldPosition(new THREE.Vector3())).normalize(),to=joint.worldToLocal(target.clone()).normalize();
   joint.quaternion.multiply(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(from,to),amount));
  }
  model.updateMatrixWorld(true);
 }
 // Applied before the carried lamp samples its animated hand attachment.
 function poseHands(){
  if(!active())return;const h=journey.emptyStall,t=h.elapsed;
  if(h.phase==='lighting'){
   const lamp=scene.getObjectByName('gate-lantern');if(lamp){const target=lamp.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-.08,.14,-.15));reach('R',target,smooth((t-1.1)/1.1)*(1-smooth((t-3.1)/1)));}
  }
  if(h.phase==='opening')reach('L',gateTarget,smooth(t/.7)*(1-smooth((t-1.6)/.55)));
 }
 function tick(reduced,camera){
  if(!active()){
   if(journey.travel?.fromStallReveal&&!reduced){
    const w=1-smooth(journey.travel.progress/2.5),portrait=camera.aspect<1;
    const oldLook=camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));
    camera.position.lerp(new THREE.Vector3(portrait?-8:-9,height(-12,-24)+(portrait?5:3.5),-23),w);
    camera.lookAt(oldLook.lerp(new THREE.Vector3(-18,height(-18,-29)+1.4,-29),w));
   }
   return;
  }
  const h=journey.emptyStall,t=h.elapsed;
  if(h.phase==='opening'&&t>=1.2&&!played){played=true;playGateTimber(context,nodes,isMuted);}
  const floor=height(-16,-16),portrait=camera.aspect<1;
  const eye=new THREE.Vector3(portrait?-7.2:-10.2,floor+(portrait?7.2:4.1),portrait?-24.4:-21.4),look=new THREE.Vector3(-16.3,floor+1.05,-14.7);
  if(h.phase==='search'){
   eye.set(-11.4,floor+3.4,-17.5);look.set(-20,floor+.8,-16);
  }
  // Show gate and shepherd together; the following house shot moves along the lane.
  let reveal=['reveal','house'].includes(h.phase)?h.phase==='house'?1:reduced?1:smooth(t/2.5):0;
  if(h.phase==='look'&&!reduced){look.x-=Math.sin(t/3*Math.PI)*1.4;look.z-=Math.sin(t/3*Math.PI)*2;}
  const houseEye=new THREE.Vector3(portrait?-8:-9,height(-12,-24)+(portrait?5:3.5),-23);
  const houseLook=new THREE.Vector3(-18,height(-18,-29)+1.4,-29);
  eye.lerp(houseEye,reveal);look.lerp(houseLook,reveal);
  // Ease from stall search into gate framing without a sudden turn.
  if(h.phase==='light'&&!reduced){const w=smooth(t/1.5);eye.lerp(new THREE.Vector3(-11.4,floor+3.4,-17.5),1-w);look.lerp(new THREE.Vector3(-20,floor+.8,-16),1-w);}
  camera.position.copy(eye);camera.lookAt(look);
 }
 return {setActive(value){if(!context)return;value=value&&active()&&!isMuted();if(!value&&context.state==='running')context.suspend().catch(()=>{});else if(value&&context.state==='suspended'&&active()&&!isMuted())context.resume().catch(()=>{});},getState(){const hand=character.tripo?.model.getObjectByName('R_Hand'),lamp=scene.getObjectByName('gate-lantern');return {hand:hand?.getWorldPosition(new THREE.Vector3()).toArray(),lamp:lamp?.getWorldPosition(new THREE.Vector3()).toArray()};},update,poseHands,tick,face(){if(!active()||journey.emptyStall.phase==='search')return null;return ['look','reveal','house'].includes(journey.emptyStall.phase)?{x:-18,z:-29}:{x:-15.8,z:-13.6};},begin(){if(!journey.actAtStall())return false;try{context??=new AudioContext();context.resume().catch(()=>{});}catch{}update();return true;}};
}
