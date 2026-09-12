import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadSettlement,THREE} from './load-settlement.mjs';
const {world}=await loadSettlement();
const stalls=world.settlementFeatures.filter(f=>['vegetable-stall','pottery-stall','tanner-stall'].includes(f.kind));
assert.equal(stalls.length,5);
const markedSpots=[[-29,1.5,'vegetable-stall'],[-21.5,7.5,'pottery-stall'],[28,-16,'tanner-stall'],[31,-9,'vegetable-stall'],[31,-3,'pottery-stall']];
for(const [x,z,kind] of markedSpots)assert(stalls.some(s=>s.kind===kind&&Math.hypot(s.root.position.x-x,s.root.position.z-z)<2),'Stall must occupy each marked spot');
for(const a of stalls)for(const b of stalls)if(a!==b&&Math.hypot(a.root.position.x-b.root.position.x,a.root.position.z-b.root.position.z)<10)assert.notEqual(a.kind,b.kind,'Adjacent stalls must differ');
const frontOffsets={'vegetable-stall':-25,'pottery-stall':-28,'tanner-stall':-33};
const requestedBearings={'Vegetables 1':106,'Vegetables 2':-86,'Pottery 1':126,'Pottery 2':-101,'Tanner':-75};
const report=[];
for(const stall of stalls){
 const box=new THREE.Box3().setFromObject(stall.root);
 assert(box.min.x>-34&&box.max.x<34&&box.min.z>-74&&box.max.z<36,'Stall must remain inside the settlement with wall clearance');
 const distance=p=>Math.hypot(Math.max(box.min.x-p.x,0,p.x-box.max.x),Math.max(box.min.z-p.z,0,p.z-box.max.z));
 const clearance=Math.min(...world.paths.flatMap(p=>p.points).map(distance));
 assert(clearance>=.85&&clearance<5,'Stall must be clear of, but visible beside, a route');
 for(const other of world.settlementFeatures){if(other===stall)continue;assert(!box.intersectsBox(new THREE.Box3().setFromObject(other.root)),`${stall.label} intersects ${other.label}`);}
 const pos=stall.root.position,front=new THREE.Vector3(Math.sin(frontOffsets[stall.kind]*Math.PI/180),0,Math.cos(frontOffsets[stall.kind]*Math.PI/180)).applyQuaternion(stall.root.quaternion);
 const bearing=requestedBearings[stall.label]*Math.PI/180;
 assert(front.dot(new THREE.Vector3(Math.sin(bearing),0,Math.cos(bearing)))>Math.cos(Math.PI/180),`${stall.label} actual open front must match its annotated arrow`);
 report.push({label:stall.label,position:pos.toArray(),height:box.max.y-box.min.y,openFrontDegrees:Math.atan2(front.x,front.z)*180/Math.PI,routeClearance:clearance});
}
const map=JSON.parse(readFileSync(new URL('../map/settlement-layout.json',import.meta.url)));
assert.equal(map.features.length,world.settlementFeatures.length,'Regenerate the settlement map after changing its models');
for(const f of world.settlementFeatures){const item=map.features.find(m=>m.label===f.label);assert(item,`Missing map label: ${f.label}`);const box=new THREE.Box3().setFromObject(f.root);for(const side of ['min','max'])box[side].toArray().forEach((n,i)=>assert(Math.abs(n-item.bounds[side][i])<.001,'Map dimensions/placement are stale'));assert(Math.abs(item.yaw-f.root.rotation.y)<1e-8);if(f.asset)assert.equal(item.assetSha256,createHash('sha256').update(readFileSync(new URL('..'+f.asset,import.meta.url))).digest('hex'),'Map model has changed; regenerate it');}
writeFileSync(new URL('./settlement-stalls-verification.json',import.meta.url),JSON.stringify({status:'passed',stalls:report,labeledFeatures:map.features.length,limits:'Actual geometry, route clearance, front direction and map consistency; no browser playtest.'},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
