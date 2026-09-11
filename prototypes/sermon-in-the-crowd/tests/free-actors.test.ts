import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {FREE_MODELS,makeFreeActor,animateFreeTeacher,animateFreeListener,distanceAt} from '../lib/sermon/actors-v2.ts';
import {EDIT,editedTimeAt} from '../lib/sermon/performance.ts';
import {clips,model} from '../scripts/v2-check-model.ts';
test('every V2 character has real skinning, complete leg chains and neutral facial morphs',async()=>{
 for(const name of FREE_MODELS){const root=await model(name);let count=0;root.traverse(o=>{if(o instanceof THREE.SkinnedMesh){count++;const weights=o.geometry.getAttribute('skinWeight');for(let i=0;i<weights.count;i++){const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);assert.ok(Math.abs(sum-1)<.002,`${name}: normalized weights`);}if(o.morphTargetInfluences)assert.ok(o.morphTargetInfluences.every(v=>v===0),`${name}: neutral face`);}});assert.ok(count>=5);for(const n of ['pelvis','thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','Head'])assert.ok(root.getObjectByName(n),`${name}: ${n}`);}
});
test('cloned V2 actors animate independently and preserve limb lengths',async()=>{
 const proto=await model('teacher'),a=makeFreeActor(proto,clips),b=makeFreeActor(proto,clips,2.5);assert.notEqual(a.bones.Head,b.bones.Head);
 const baseline=Object.fromEntries(Object.entries(a.bones).map(([n,b])=>[n,b.position.length()]));
 for(let t=0;t<EDIT.duration;t+=1.5){animateFreeTeacher(a,t,t,.5,()=>0);for(const[n,bone]of Object.entries(a.bones)){assert.ok(bone.matrixWorld.elements.every(Number.isFinite));if(n!=='pelvis')assert.ok(Math.abs(bone.position.length()-baseline[n])<.0001,`preserve ${n}`);}const feet=['ball_l','ball_r'].map(n=>a.bones[n].getWorldPosition(new THREE.Vector3()).y);assert.ok(Math.abs(Math.min(...feet)-.014)<.001);}
 animateFreeTeacher(a,editedTimeAt(64),1,.8,()=>0);const jaw=a.faces.find(m=>m.morphTargetDictionary?.jawOpen!==undefined)!;assert.ok(jaw.morphTargetInfluences![jaw.morphTargetDictionary!.jawOpen]>.5);
 animateFreeTeacher(a,editedTimeAt(64),1,0,()=>0);assert.equal(jaw.morphTargetInfluences![jaw.morphTargetDictionary!.jawOpen],0);
 b.seated=true;b.baseYaw=1;animateFreeListener(b,2,new THREE.Vector3(),()=>0);assert.notDeepEqual(a.bones.thigh_l.quaternion.toArray(),b.bones.thigh_l.quaternion.toArray());
});
test('walking phase is driven by travel distance and is deterministic across seeks',()=>{
 assert.equal(distanceAt(0),0);let last=0;for(let t=0;t<EDIT.duration;t+=.1){const d=distanceAt(t);assert.ok(d>=last);last=d;}assert.ok(last>2&&last<20);assert.equal(distanceAt(25),distanceAt(25));
});

test('holding a sermon pose does not accumulate procedural rotations',async()=>{
 const actor=makeFreeActor(await model('teacher'),clips);
 animateFreeTeacher(actor,20,20,.5,()=>0);
 const pose=Object.fromEntries(Object.entries(actor.bones).map(([name,bone])=>[name,bone.quaternion.clone()]));
 for(let frame=0;frame<600;frame++)animateFreeTeacher(actor,20,20,.5,()=>0);
 for(const[name,bone]of Object.entries(actor.bones))assert.ok(bone.quaternion.clone().normalize().angleTo(pose[name].normalize())<.00001,`${name} drifted while holding the same pose`);
});

test('blinking deforms only the eye region, without changing the nose or chin',async()=>{
 for(const name of FREE_MODELS){const root=await model(name);
  const eyes=root.getObjectByName('Eyes') as THREE.Mesh,eyePositions=eyes.geometry.attributes.position;
  let eyeLow=Infinity,eyeHigh=-Infinity;for(let i=0;i<eyePositions.count;i++){eyeLow=Math.min(eyeLow,eyePositions.getY(i));eyeHigh=Math.max(eyeHigh,eyePositions.getY(i));}
  root.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  for(const side of ['Left','Right']){
   const index=o.morphTargetDictionary?.[`eyeBlink${side}`];if(index===undefined)return;
   assert.equal(o.geometry.morphTargetsRelative,true);
   const delta=o.geometry.morphAttributes.position[index],base=o.geometry.attributes.position;
   for(let i=0;i<delta.count;i++){
    const movement=Math.hypot(delta.getX(i),delta.getY(i),delta.getZ(i));
    assert.ok(movement<.025,`${name}/${o.name}: blink displacement ${movement}`);
    if(base.getY(i)<eyeLow-.01||base.getY(i)>eyeHigh+.01)assert.ok(movement<.000001,`${name}/${o.name}: blink moves a vertex outside the eye region at ${base.getY(i)}`);
   }
  }
 });}
});

test('sustained 60 Hz playback, pauses and seeks produce the same pose as a fresh actor',async()=>{
 const proto=await model('teacher'),actor=makeFreeActor(proto,clips);
 function compare(time:number,wall:number){
  const fresh=makeFreeActor(proto,clips);animateFreeTeacher(fresh,time,wall,.6,()=>0);
  for(const[name,bone]of Object.entries(actor.bones)){
   assert.ok(bone.quaternion.clone().normalize().angleTo(fresh.bones[name].quaternion.clone().normalize())<.00001,`${name} drift at ${time}`);
   assert.ok(bone.position.distanceTo(fresh.bones[name].position)<.000001,`${name} translated at ${time}`);
  }
  assert.ok(actor.root.position.distanceTo(fresh.root.position)<.000001);
  fresh.mixer.stopAllAction();fresh.mixer.uncacheRoot(fresh.root);
 }
 for(let frame=0;frame<=Math.ceil(EDIT.duration*60);frame++){
  const t=frame/60;animateFreeTeacher(actor,t,t,.6,()=>0);if(frame%60===0)compare(t,t);
 }
 for(const t of [20,80,3,EDIT.duration,0,45]){
  for(let frame=0;frame<180;frame++)animateFreeTeacher(actor,t,200+frame/60,.6,()=>0);
  compare(t,200+179/60);
 }
});

test('crowd head turns remain stable after repeated idle and seated updates',async()=>{
 const proto=await model('listener-woman'),target=new THREE.Vector3(2,0,1);
 for(const seated of [false,true]){
  const actor=makeFreeActor(proto,clips,2.5);actor.seated=seated;actor.baseYaw=.3;
  for(let i=0;i<600;i++)animateFreeListener(actor,12,target,()=>0);
  const fresh=makeFreeActor(proto,clips,2.5);fresh.seated=seated;fresh.baseYaw=.3;animateFreeListener(fresh,12,target,()=>0);
  for(const name of ['Head','spine_03'])assert.ok(actor.bones[name].quaternion.clone().normalize().angleTo(fresh.bones[name].quaternion.clone().normalize())<.00001,`${name} crowd drift`);
 }
});
