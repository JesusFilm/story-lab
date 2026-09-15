import assert from 'node:assert/strict';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {CORRIDORS,HOUSE_APPROACHES} from '../src/rehearsal-route.mjs';
const {HOUSE_DECORATIONS,DECORATION_ASSETS}=await import('../src/house-decorations.mjs');

const {world}=await loadSettlement({routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES});
const decorations=world.settlementFeatures.filter(f=>f.root.userData.decoration);
assert.equal(decorations.length,HOUSE_DECORATIONS.length);
assert.equal(new Set(decorations.map(f=>f.root.userData.decoration.asset)).size,DECORATION_ASSETS.length);
for(const f of decorations){
 const b=new THREE.Box3().setFromObject(f.root),size=b.getSize(new THREE.Vector3()),spec=f.root.userData.decoration;
 assert(size.y>.5&&size.y<=spec.height+.03,`${f.label}: plausible decoration height`);
 const house=world.settlementFeatures.find(h=>h.label===`House ${spec.house}`).root;
 assert.equal(f.root.rotation.y,house.rotation.y,'Mount follows rotated house');
 let clearance=Infinity;
 for(const corridor of CORRIDORS)for(const p of corridor.points){
  const dx=Math.max(b.min.x-p.x,0,p.x-b.max.x),dz=Math.max(b.min.z-p.z,0,p.z-b.max.z);
  clearance=Math.min(clearance,Math.hypot(dx,dz));
 }
 assert(clearance>.55,`${f.label}: walking route clearance ${clearance.toFixed(3)}m`);
 console.log(`${f.label}: route clearance ${clearance.toFixed(2)}m, height ${size.y.toFixed(2)}m`);
}
console.log('PASS four variants, house-relative mounting, plausible scale and all sampled walking corridors clear.');
