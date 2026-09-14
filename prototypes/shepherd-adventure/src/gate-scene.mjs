import * as THREE from 'three';
import {TUG_TIMES} from './barred-gate.mjs';
export function createGateScene(journey,scene,character){
 const $=id=>document.getElementById(id);
 let previous,context,nodes=[],played=new Set();
 const cue=new THREE.Mesh(new THREE.RingGeometry(.12,.15,32),new THREE.MeshBasicMaterial({color:'#ffe0a0',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));scene.add(cue);
 const active=()=>journey.index===3&&!journey.travel;
 function stop(){for(const n of nodes){try{n.stop();n.disconnect();}catch{}}nodes=[];played.clear();}

 function update(){
  const h=journey.barredGate;
  if(previous!==h){stop();previous=h;}
  if(!active()){cue.visible=false;stop();return;}
  if(journey.paused)context?.suspend().catch(()=>{});else if(context?.state==='suspended')context.resume().catch(()=>{});
  $('point-title').textContent=['barred','complete'].includes(h.phase)?'Barred gate':'Timber gate';
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent=({ready:'The lane leads to a timber gate.',trying:'You pull on the gate. The timber strains, but holds firm.',barred:'“It’s barred from the other side. I can’t get through here.”',complete:'“I saw some houses near the well. Perhaps someone there can help.”'})[h.phase];
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':h.phase==='ready'?'Try the way ahead.':h.complete?'Ask at the houses near the well.':'The gate stays closed.';
  $('advance').textContent=h.phase==='ready'?'Open the gate':h.complete?'Try the houses near the well':h.phase==='barred'?'The way is barred':'Trying the gate…';
  $('advance').disabled=journey.paused||(h.started&&!h.complete);
 }
 function tick(reduced,camera){
  cue.visible=false;if(!active())return;
  const h=journey.barredGate,t=h.elapsed,gate=scene.getObjectByName('journey-gate-hinge');if(!gate)return;
  const age=Math.min(...TUG_TIMES.map(k=>t>=k?t-k:Infinity));
  const tug=age<.35?Math.sin(age/.35*Math.PI)*Math.exp(-age*4):0;
  gate.rotation.y=reduced?0:tug*.025;
  gate.updateWorldMatrix(true,true);
  const target=gate.localToWorld(new THREE.Vector3(1.75,1.15,.13));
  cue.position.copy(target);cue.quaternion.copy(gate.getWorldQuaternion(new THREE.Quaternion()));
  cue.visible=h.started&&age<.3;cue.scale.setScalar(reduced?1:1+age*1.4);cue.material.opacity=Math.max(0,.65-age*2);
  for(const k of TUG_TIMES)if(h.started&&t>=k&&!played.has(k)){played.add(k);playGateTimber(context,nodes);}
  const model=character.tripo?.model,hand=model?.getObjectByName('L_Hand');
  if(hand&&h.started&&t>.5&&t<2.65){
   const amount=Math.max(0,Math.min(1,(t-.5)/.25,(2.65-t)/.3));
   for(let i=0;i<3;i++)for(const name of ['L_Forearm','L_Upperarm']){
    const joint=model.getObjectByName(name);model.updateMatrixWorld(true);
    const from=joint.worldToLocal(hand.getWorldPosition(new THREE.Vector3())).normalize(),to=joint.worldToLocal(target.clone()).normalize();
    joint.quaternion.multiply(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(from,to),amount));
   }
  }
  // A modest push keeps the obstacle and shepherd together, without losing orientation.
  if(h.started&&!reduced){const w=Math.max(0,Math.min(1,t/.7,(3.5-t)/.7));const look=camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(camera.position.distanceTo(target)));camera.position.lerp(target,.12*w);camera.lookAt(look.lerp(target,w*.45));}
 }
 return {update,tick,begin(){if(!journey.tryGate())return false;stop();try{context??=new AudioContext();context.resume().catch(()=>{});}catch{}update();return true;}};
}

export function playGateTimber(context,nodes){
  if(context?.state!=='running')return;
  const now=context.currentTime;
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.2),context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.035))*.2;
  const noise=context.createBufferSource(),filter=context.createBiquadFilter();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=700;noise.connect(filter).connect(context.destination);noise.start();nodes.push(noise);
  // Strained timber creak followed by a short, low stop against the bar.
  for(const [frequency,duration,volume] of [[95,.32,.1],[190,.24,.055],[65,.12,.18]]){
   const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';
   oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*.65,now+duration);
   gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
   oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(now+duration);nodes.push(oscillator);
  }
 }
