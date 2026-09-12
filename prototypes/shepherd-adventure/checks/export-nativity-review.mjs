// Actual world-space geometry for an offline Blender composition check.
import {writeFileSync} from 'node:fs';
import {loadSettlement,THREE} from './load-settlement.mjs';
const {scene,world}=await loadSettlement();
const meshes=[];
const shelter=world.settlementFeatures.find(f=>f.kind==='shelter').root;
const family=shelter.children.find(o=>o.type==='Group');
family.visible=false;
scene.traverse(o=>{
 if(!o.isMesh||o.isInstancedMesh||o===family||o.parent===family)return;
 const b=new THREE.Box3().setFromObject(o);if(b.max.x< -41||b.min.x> -1||b.max.z< -81||b.min.z> -35||b.max.x-b.min.x>100)return;
 const p=o.geometry.attributes.position,v=new THREE.Vector3(),vertices=[];
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);vertices.push([v.x,-v.z,v.y]);}
 const material=Array.isArray(o.material)?o.material[0]:o.material;
 meshes.push({name:o.name||o.parent.name,vertices,indices:o.geometry.index?Array.from(o.geometry.index.array):Array.from({length:p.count},(_,i)=>i),color:material.color?.toArray()||[.4,.35,.28]});
});
writeFileSync(process.argv[2]||'/tmp/nativity-review-geometry.json',JSON.stringify({meshes}));
console.log(`Exported ${meshes.length} meshes for offline composition review.`);
