import assert from 'node:assert/strict';
import {loadSettlement,THREE} from './load-settlement.mjs';
const {NATIVITY,ANIMAL_AREA_WALLS,ANIMAL_AREA_TREES}=await import('../src/journey-nativity.mjs');
import {NODES,NODE,EDGES,lanePoints,followPlayerRoute,followerRoute} from '../src/journey-model.mjs';
const {world,scene}=await loadSettlement();
const shelter=world.settlementFeatures.find(f=>f.kind==='shelter').root;
assert.equal(shelter.position.x,NATIVITY.x);assert.equal(shelter.position.z,NATIVITY.z);
assert.equal(shelter.rotation.y,Math.PI/2);
const family=shelter.getObjectByName('nativity-family');assert(family,'Generated family present');
const familyBounds=new THREE.Box3().setFromObject(family);assert(familyBounds.max.y-familyBounds.min.y<1.5);
assert.deepEqual(family.children.map(o=>o.name),['Mary','Joseph','Jesus in the manger']);
assert(scene.getObjectByName('nativity-loose-straw'));
assert(scene.getObjectByName('generated-nativity-stall'));
const structureBounds=new THREE.Box3().setFromObject(scene.getObjectByName('generated-nativity-stall'));
assert(structureBounds.max.x-structureBounds.min.x<7.8&&structureBounds.max.z-structureBounds.min.z<7.8,'Roomy shelter stays within its site');
// Measure real inner surfaces, rather than mistaking a square AABB for square walls.
const structure=scene.getObjectByName('generated-nativity-stall');
function castLocal(origin,direction){const o=shelter.localToWorld(new THREE.Vector3(...origin)),d=new THREE.Vector3(...direction).transformDirection(shelter.matrixWorld);const h=new THREE.Raycaster(o,d,0,10).intersectObject(structure,true)[0];return h?shelter.worldToLocal(h.point):null;}
for(const [axis,sign] of [[0,-1],[0,1],[2,-1]]){
 const samples=[-1.5,0,1.5].map(t=>{const o=axis===0?[0,1.2,t]:[t,1.2,0],d=[0,0,0];d[axis]=sign;return castLocal(o,d);});
 assert(samples.every(Boolean),'Closed left, right and back walls');
 const values=samples.map(p=>p.getComponent(axis));assert(Math.max(...values)-Math.min(...values)<.2,'Wall stays parallel to its placement axis');
 assert(values.every(v=>Math.abs(v-sign*3)<.18),'Interior walls form a six-metre square');
}
for(const y of [.5,1,1.5,2])for(const z of [-2,-1,0,1,2])assert(castLocal([0,y,z],[1,0,0]),'Right wall is closed across its full height and depth');
const floorSamples=[[-1,0],[0,0],[1,0],[0,1],[0,-1]].map(([x,z])=>castLocal([x,.6,z],[0,-1,0]).y);
assert(Math.max(...floorSamples)-Math.min(...floorSamples)<.12,'Earth floor is level');
const troughs=['left','right','back','front'].map(w=>scene.getObjectByName('nativity-trough-'+w));assert(troughs.every(Boolean),'Four separate wall troughs');
const localBox=root=>{const b=new THREE.Box3();root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const g=o.geometry.boundingBox;for(const x of [g.min.x,g.max.x])for(const y of [g.min.y,g.max.y])for(const z of [g.min.z,g.max.z])b.expandByPoint(shelter.worldToLocal(o.localToWorld(new THREE.Vector3(x,y,z))));}});return b;};
for(const t of troughs){assert(Math.abs(Math.sin(t.rotation.y*2))<1e-8,'Trough is aligned with a wall');const b=localBox(t);assert(b.min.x>-3.1&&b.max.x<3.1&&b.min.z>-3.1&&b.max.z<3.1,'Trough fits inside the walls');for(const member of family.children)assert(!b.intersectsBox(localBox(member)),'Family clears feeding troughs');}
const fixture=scene.getObjectByName('nativity-mounted-lantern'),bracket=scene.getObjectByName('nativity-lantern-bracket');assert(fixture&&bracket,'Lantern has a physical wall bracket');
const anchor=new THREE.Vector3(...bracket.userData.anchor),wall=castLocal([0,anchor.y,anchor.z],[1,0,0]);assert(wall.distanceTo(anchor)<.015,'Bracket anchored to generated wall');
assert(fixture.position.clone().add(new THREE.Vector3(0,.2,0)).distanceTo(new THREE.Vector3(...bracket.userData.handle))<1e-6,'Lantern handle meets hanger');
assert(world.settlementFeatures.some(f=>f.label==='Quiet animal pen'));
assert.equal(world.settlementFeatures.filter(f=>f.kind==='animal').length,6);
assert(world.wallSegments.some(s=>s.kind==='animal-area-wall'));
assert.equal(world.settlementFeatures.filter(f=>f.label==='Animal-area gate').length,1);
assert.equal(scene.getObjectByName('open-animal-gate-leaf').rotation.y,Math.PI*.48);
assert(!ANIMAL_AREA_WALLS.some(w=>w.a.z===-63&&w.b.z===-63),'No dividing wall or northern exit');
for(const [x,z] of ANIMAL_AREA_TREES)assert(world.nature.placements.some(p=>p.kind==='tree'&&p.x===x&&p.z===z));
function distance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
const path=lanePoints(EDGES.find(e=>e.b==='goal'));
assert.deepEqual(path.at(-1),{x:NODE.goal.x,z:NODE.goal.z});
assert(path.some(p=>Math.hypot(p.x+21,p.z+39)<.01),'Route passes through the single gate');
assert(path.some(p=>Math.hypot(p.x+35,p.z+53)<8),'Route comes close to sheep');
for(const p of path){for(const wall of ANIMAL_AREA_WALLS)assert(distance(p,wall.a,wall.b)>1.05,'Final lane clears enclosure walls');assert(p.x>-29,'Lane stops outside open shelter');}
for(const route of [followPlayerRoute(),followerRoute()])assert.deepEqual(route.at(-1),path.at(-1));
assert(NODES.filter(n=>n.id!=='goal'&&n.z<-35).length===0);
const animals=world.settlementFeatures.filter(f=>f.kind==='animal').map(f=>f.root);
const before=animals.map(r=>r.matrixWorld.toArray());
const journey={position:NODE.goal,at:'goal',lantern:true,phase:'arrival',options:[],gateOpen:true};world.update(10,10,journey);
scene.updateMatrixWorld(true);assert.deepEqual(animals.map(r=>r.matrixWorld.toArray()),before,'Animals remain still');
const donkey=scene.getObjectByName('Resting donkey');
assert(donkey&&donkey.position.x>1&&donkey.position.z<.5,'Donkey at inner right wall');
const donkeyBox=localBox(donkey);assert(donkeyBox.max.x<2.6&&donkeyBox.min.z>-2.9,'Donkey clears walls');
for(const t of troughs)assert(!donkeyBox.intersectsBox(localBox(t)),'Donkey clears troughs');
for(const member of family.children)assert(!donkeyBox.intersectsBox(localBox(member)),'Donkey clears family');
for(const a of animals.slice(3,5)){const p=shelter.worldToLocal(a.getWorldPosition(new THREE.Vector3()));assert(p.x>1&&p.z>3,'Two sheep at front-right entrance');}
const heads=[donkey.getObjectByName('donkey-head'),...animals.filter(r=>r.name!=='Resting donkey').map(r=>r.getObjectByName('tripoHead_0')),...family.children.slice(0,2).map(r=>r.getObjectByName('head'))];
assert(heads.every(Boolean),'Sheep, donkey and both seated adults retain head bones');
const pose=()=>heads.map(h=>h.quaternion.toArray());
const initial=pose();for(let i=0;i<40;i++)world.update(1/30,i/30,journey);
pose().forEach((p,i)=>assert.notDeepEqual(p,initial[i],'Every animal and adult has independent idle motion'));
const held=pose();world.update(1/30,2,journey,Math.PI,true);
assert.deepEqual(pose(),held,'Reduced motion holds idle poses');
world.update(0,2,journey);assert.deepEqual(pose(),held,'Paused time holds idle poses');
console.log('Nativity area passed: generated family, shelter dimensions/orientation, five calm sheep, idle donkey, pen, gate, trees, wall clearance and continuous final routes.');
