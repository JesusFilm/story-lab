import assert from 'node:assert/strict';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {CORRIDORS,HOUSE_APPROACHES} from '../src/rehearsal-route.mjs';
const {HOUSE_YAWS,HOUSE_ANNEXES}=await import('../src/village-layout.mjs');
const {world}=await loadSettlement({routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES});
const features=world.settlementFeatures;
for(const [number,yaw] of Object.entries(HOUSE_YAWS))assert.equal(features.find(f=>f.label===`House ${number}`).root.rotation.y,yaw);
assert.equal(features.filter(f=>f.kind==='annex').length,6);
for(let number=1;number<=11;number++){
 const decorations=features.filter(f=>f.root.userData.decoration?.house===number);
 assert(decorations.length>=1&&decorations.length<=2,`House ${number} needs one or two decorations`);
 for(const f of decorations){
  const house=features.find(h=>h.label===`House ${number}`).root;
  const mount=house.worldToLocal(f.root.position.clone());
  assert(Math.abs(mount.x-2.20)<1e-6,'Rear plane must mount on front facade');
  assert.equal(f.root.rotation.y,house.rotation.y,'Decoration faces away from house');
  assert(Math.abs(mount.z+.85)>1.1,'Keep door and handle clear');
 }
}
for(const spec of HOUSE_ANNEXES){
 const host=features.find(f=>f.label===`House ${spec.house}`).root;
 const annex=features.find(f=>f.label===`House ${spec.house} annex`).root;
 assert.equal(annex.rotation.y,host.rotation.y);
 const hb=new THREE.Box3().setFromObject(host),ab=new THREE.Box3().setFromObject(annex);
 assert(hb.intersectsBox(ab),`House ${spec.house}: attached join must meet host`);
 assert(ab.max.y<hb.max.y-.6,'Annex roof remains lower than main house');
}
assert(world.wallSegments.some(w=>w.kind==='gate-wing'),'Gate-side walls restored');
assert(world.wallSegments.some(w=>w.kind==='decoration-wall'));
console.log('PASS four inward rotations, six attached lower annexes, 1–2 front decorations on all 11 houses, and replacement walls.');
// A connected endpoint must meet actual masonry-height triangles, not just a
// roof bounding box. Check along the rendered segment's own direction.
let joins=0;
for(const wall of world.wallSegments.filter(w=>w.kind==='decoration-wall')){
 for(const [key,end,other] of [['startHost',wall.a,wall.b],['endHost',wall.b,wall.a]]){
  const host=wall[key];if(!host)continue;
  if(host==='south-boundary'){assert.equal(end.z,42);joins++;continue;}
  const root=features.find(f=>f.label===host).root;
  const y=root.position.y+.55;
  const origin=new THREE.Vector3(other.x,y,other.z),target=new THREE.Vector3(end.x,y,end.z),distance=origin.distanceTo(target);
  const hits=new THREE.Raycaster(origin,target.sub(origin).normalize(),0,distance+.1).intersectObject(root,true);
  assert(hits.length,`${host}: wall endpoint must meet actual low-level mesh`);joins++;
 }
}
assert.equal(joins,17,'Every planned attachment has a verified join');
console.log(`PASS ${joins} wall-to-structure or perimeter connections.`);
