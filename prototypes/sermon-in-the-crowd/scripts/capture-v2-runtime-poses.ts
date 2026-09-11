// Bake the actual Three.js skinning and morph results for offline visual checks.
// Run: node --experimental-strip-types scripts/capture-v2-runtime-poses.ts
import fs from 'node:fs';
import * as THREE from 'three';
import {clips,model} from './v2-check-model.ts';
import {makeFreeActor,animateFreeTeacher,animateFreeListener} from '../lib/sermon/actors-v2.ts';
import {editedTimeAt} from '../lib/sermon/performance.ts';
const cases=[
 {name:'teacher-held-gesture',model:'teacher',source:64,wall:20,speech:.8},
 {name:'teacher-crouch',model:'teacher',source:79.3,wall:25,speech:.5},
 {name:'listener-blink',model:'listener-woman',source:0,wall:.07,speech:0},
];
const captures=[];
for(const sample of cases){
 const actor=makeFreeActor(await model(sample.model),clips);
 for(let frame=0;frame<600;frame++){
  if(sample.model==='teacher')animateFreeTeacher(actor,editedTimeAt(sample.source),sample.wall,sample.speech,()=>0);
  else animateFreeListener(actor,sample.wall,new THREE.Vector3(0,0,2),()=>0);
 }
 actor.root.updateMatrixWorld(true);
 const heading=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-actor.root.rotation.y);
 const meshes:unknown[]=[];
 actor.root.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  const positions:number[][]=[],v=new THREE.Vector3();
  for(let i=0;i<o.geometry.attributes.position.count;i++){
   o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);
   v.x-=actor.root.position.x;v.z-=actor.root.position.z;v.applyQuaternion(heading);
   positions.push([v.x,-v.z,v.y]);
  }
  const uv=o.geometry.attributes.uv,color=o.geometry.attributes.color;
  const indices=o.geometry.index?Array.from(o.geometry.index.array):positions.map((_,i)=>i);
  const materials=Array.isArray(o.material)?o.material:[o.material];
  meshes.push({name:o.name,positions,indices,uv:uv?Array.from({length:uv.count},(_,i)=>[uv.getX(i),uv.getY(i)]):null,color:color?Array.from({length:color.count},(_,i)=>[color.getX(i),color.getY(i),color.getZ(i),color.itemSize===4?color.getW(i):1]):null,materials:materials.map(m=>m.name),groups:o.geometry.groups});
 });
 captures.push({...sample,meshes});
}
fs.writeFileSync(new URL('../.cache/free-models/runtime-poses.json',import.meta.url),JSON.stringify(captures));
console.log('Captured actual runtime skinning/morphs after 600 repeated frames:',cases.map(c=>c.name).join(', '));
