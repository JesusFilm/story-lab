import * as THREE from 'three';
import {height} from './journey-world.mjs';
import {sampleCorridor,lengthOf,positionOn,STOPS} from './rehearsal-route.mjs';

export function createHouseTracksScene(journey,scene){
 const $=id=>document.getElementById(id),group=new THREE.Group();group.name='Human footprints and donkey hoofprints';scene.add(group);
 const earth=new THREE.MeshStandardMaterial({color:'#66503a',roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
 const gold=new THREE.LineBasicMaterial({color:'#ffd17b',transparent:true,opacity:.95,depthWrite:false,toneMapped:false});
 const outlines=[];
 // Rounded sandal sole with a narrower heel; a donkey's single, rounded hoof.
 const sole=new THREE.Shape();sole.moveTo(-.08,-.21);sole.bezierCurveTo(-.14,-.14,-.13,.12,-.11,.2);sole.bezierCurveTo(-.08,.3,.1,.3,.13,.17);sole.lineTo(.08,-.2);sole.quadraticCurveTo(0,-.26,-.08,-.21);
 const hoof=new THREE.Shape();hoof.moveTo(-.1,-.1);hoof.bezierCurveTo(-.2,.14,-.1,.23,0,.23);hoof.bezierCurveTo(.15,.23,.2,.1,.1,-.1);hoof.quadraticCurveTo(0,-.15,-.1,-.1);
 function print(shape,x,z,heading,opacity=1){
  const item=new THREE.Group(),mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),opacity===1?earth:earth.clone());if(opacity<1){mesh.material.transparent=true;mesh.material.opacity=opacity;mesh.material.depthWrite=false;}item.add(mesh);
  const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getPoints(18).map(p=>new THREE.Vector3(p.x,p.y,.006))),opacity===1?gold:gold.clone());line.material.opacity=.95*opacity;item.add(line);outlines.push(line);
  item.scale.setScalar(shape===hoof?.7:.85);item.rotation.set(-Math.PI/2,0,0);item.rotation.z=Math.PI-heading;item.position.set(x,height(x,z)+.035,z);group.add(item);
 }
 const trail=sampleCorridor([{x:16.8,z:2.2},{x:19,z:3},...STOPS[5].controls.slice(1)]),length=lengthOf(trail);
 for(let d=0;d<length;d+=.76){
  const p=positionOn(trail,d),side=Math.round(d/.76)%2?1:-1;
  const offset=.35+side*.13;print(sole,p.x+Math.cos(p.heading)*offset,p.z-Math.sin(p.heading)*offset,p.heading);
  for(const delta of [0,.28]){const q=positionOn(trail,Math.min(length,d+delta)),o=-.45+side*.16;print(hoof,q.x+Math.cos(q.heading)*o,q.z-Math.sin(q.heading)*o,q.heading);}
 }
 // The trail skirts the closed entrance, then fades spatially on firmer ground.
 // Keep the established walking corridor and stop short of the residential doors.
 const continuation=sampleCorridor([STOPS[5].anchor,...STOPS[6].controls.slice(0,3)]),continuationLength=lengthOf(continuation);
 for(let d=.76;d<continuationLength;d+=.76){
  const t=THREE.MathUtils.clamp((d-3)/(continuationLength-3),0,1),opacity=1-t*t*(3-2*t);
  if(opacity<.015)continue;
  const p=positionOn(continuation,d),side=Math.round(d/.76)%2?1:-1,o=.35+side*.13;
  print(sole,p.x+Math.cos(p.heading)*o,p.z-Math.sin(p.heading)*o,p.heading,opacity);
  for(const delta of [0,.28]){const q=positionOn(continuation,Math.min(continuationLength,d+delta)),offset=-.45+side*.16;print(hoof,q.x+Math.cos(q.heading)*offset,q.z-Math.sin(q.heading)*offset,q.heading,opacity);}
 }
 let weight=0,penWeight=0;
 function update(){
  if(journey.index===5&&!journey.travel){
   $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
   $('beat').textContent='“No one seems awake here. The tracks pass the pen and lead back toward the houses.”';
   $('travel-status').textContent=journey.paused?'Paused — continue when ready.':'The entrance is closed. The trail continues outside it.';
   $('advance').textContent='Follow the tracks';
   $('advance').disabled=journey.paused;
   return;
  }
  if(journey.index!==4||journey.travel)return;
  const h=journey.houseTracks;
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent=({ready:'The house is dark. Perhaps someone is inside.',knocking:'You knock on the wooden door.',waiting:'You wait. There is no answer.','knocking-again':'You knock once more.','waiting-again':'The house stays silent.',unanswered:'“No one is answering.”',searching:'You look around the well.',spotted:'“Footprints… and hoofprints. They lead past the market stalls toward the animal pen.”'})[h.phase];
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':h.spotted?'The tracks catch your eye.':h.phase==='unanswered'?'Perhaps there is a sign nearby.':h.phase==='searching'?'Looking at the ground nearby…':h.started?'Listen at the closed door…':'Ask at the door.';
  $('advance').textContent=h.phase==='ready'?'Knock on door':h.phase==='unanswered'?'Look around':h.spotted?'Follow the tracks':h.phase==='searching'?'Looking around…':h.phase.includes('knocking')?'Knocking…':'Waiting for a response…';
  $('advance').disabled=journey.paused||!['ready','unanswered','spotted'].includes(h.phase);
 }
 function tick(reduced,camera,dt){
  group.visible=journey.index>=4&&journey.index<=6;
  for(const outline of outlines)outline.visible=journey.houseTracks.spotted;
  const target=journey.index===4&&!journey.travel&&journey.houseTracks.spotted?1:0;
  weight=reduced?target:THREE.MathUtils.lerp(weight,target,1-Math.exp(-2.2*dt));
  const penTarget=journey.index===5&&!journey.travel?1:0;
  penWeight=reduced?penTarget:THREE.MathUtils.lerp(penWeight,penTarget,1-Math.exp(-2.2*dt));
  if(penWeight>.001){
   const oldLook=camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));
   camera.position.lerp(new THREE.Vector3(camera.aspect<1?34:29,height(24,-21)+(camera.aspect<1?12:7),camera.aspect<1?-9:-14),penWeight);
   camera.lookAt(oldLook.lerp(new THREE.Vector3(camera.aspect<1?22.5:21,height(21,-21)+.6,-21),penWeight));
  }
  if(weight>.001){
   const p=journey.position,eye=new THREE.Vector3(p.x-3,height(p.x,p.z)+7,p.z+7);
   const oldLook=camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10));
   camera.position.lerp(eye,weight);camera.lookAt(oldLook.lerp(new THREE.Vector3(21,height(21,0),-1),weight));
  }
 }
 return {update,tick};
}
