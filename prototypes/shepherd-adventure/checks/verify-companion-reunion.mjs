import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RouteRehearsal,STOPS} from '../src/rehearsal-route.mjs';
import {INCOMING,DEPARTING,REUNION_LINES} from '../src/companion-reunion.mjs';
const j=new RouteRehearsal();
function until(phase){for(let i=0;i<2400&&j.reunion.phase!==phase;i++)j.step(1/60);assert.equal(j.reunion.phase,phase);}
function owner(){j.knockOnHouse();j.step(3);for(let i=0;i<4;i++)j.advanceOwner();}
j.jump(8);assert.equal(j.reunion.phase,'pending');assert(j.gateOpen&&j.gateLit);assert(!j.advanceReunion());owner();
assert.equal(j.reunion.phase,'arriving');assert(!j.next());assert(!j.advanceOwner());
j.step(.8);j.paused=true;const held=j.snapshot();j.step(3);assert.deepEqual(j.snapshot(),held);assert(!j.advanceReunion());j.paused=false;
until('question');assert.deepEqual({x:j.position.x,z:j.position.z},STOPS[8].anchor);
assert(j.reunion.actors.every(a=>a.visible&&!a.moving));assert(!j.next());
j.step(60);assert.equal(j.reunion.phase,'question','The question waits for input');
assert(j.advanceReunion());assert.equal(j.reunion.phase,'directions');j.step(60);assert.equal(j.reunion.phase,'directions');assert(!j.next());
assert(j.advanceReunion());assert.equal(j.reunion.phase,'invitation');assert(!j.next());
assert(j.advanceReunion());assert(!j.advanceReunion());until('waiting');
const actors=structuredClone(j.reunion.actors);j.step(60);assert.deepEqual(j.reunion.actors,actors,'No disappearance or departure while the player waits');
assert.equal(j.travel,null);assert(j.next());assert(!j.next());
let walkingStart=null,approachSeconds=0;
while(j.travel){
 const remaining=j.travel.length-j.travel.progress;
 j.step(.05);const [a,b]=j.reunion.actors;
 approachSeconds+=.05;
 if(j.gait==='walk'&&!walkingStart)walkingStart={remaining,z:j.position.z};
 if(j.position.z<-44&&j.position.z>-62){
  assert.equal(j.gait,'run','Player runs through the long sheep-pen stretch');
  assert(j.travel.speed>4,'Player travels at running speed past the sheep');
 }
 for(const actor of [a,b])if(actor.z<-44&&actor.z>-62)assert(actor.speed>4,'Companions must not run in slow motion past the sheep');
 assert(Math.hypot(a.x-b.x,a.z-b.z)>1.4,'Companions keep space when slowing');
 for(const a of j.reunion.actors)assert(Math.hypot(a.x-j.position.x,a.z-j.position.z)>1,'Player does not pass through a companion');
}
assert(walkingStart&&walkingStart.remaining>7.7&&walkingStart.remaining<=8);
assert(walkingStart.z<-63,'Quiet walk begins beyond the sheep near the shelter');
assert(approachSeconds<15,'The long approach should retain urgency');
console.log('Nativity approach:',{walkingStart,approachSeconds});
until('complete');assert.equal(j.index,9);
assert.equal(j.phase,'choice','Ending remains an explicit placeholder');
// Rapid follow input during departure cannot send the player through a waiting companion.
j.jump(8);owner();until('question');for(let i=0;i<3;i++)j.advanceReunion();assert(!j.next(),'Companions must get ahead before follow');while(!j.reunion.canFollow)j.step(.05);assert.equal(j.reunion.phase,'waiting');assert(j.next());while(j.travel)j.step(.05);until('complete');
j.jump(8);owner();j.step(2);j.replay();assert.equal(j.reunion.phase,'pending');assert(j.reunion.actors.every(a=>!a.visible));while(j.travel)j.step(.05);assert.equal(j.houseOwner.phase,'ready');
j.jump(7);assert.equal(j.reunion.phase,'pending');assert(!j.gateOpen);j.jump(9);assert.equal(j.reunion.phase,'complete');assert(j.reunion.actors.every(a=>!a.visible),'Direct point 10 remains its existing staged placeholder');j.reset();assert.deepEqual(j.snapshot(),new RouteRehearsal().snapshot());
assert(Object.values(REUNION_LINES).every(line=>!/(Mary|Joseph|newborn King|about to be born)/i.test(line)));

// Map-based checks include every incoming point, not merely its two endpoints.
const map=JSON.parse(readFileSync(new URL('../map/rehearsal-layout.json',import.meta.url)));
function segment(p,a,b){const x=b.x-a.x,z=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z)));return Math.hypot(p.x-a.x-t*x,p.z-a.z-t*z);}
function polygon(p,poly){let inside=false,min=Infinity;for(let i=0,k=poly.length-1;i<poly.length;k=i++){
 const [x,z]=poly[k],[xx,zz]=poly[i];if((z>p.z)!==(zz>p.z)&&p.x<(xx-x)*(p.z-z)/(zz-z)+x)inside=!inside;
 min=Math.min(min,segment(p,{x,z},{x:xx,z:zz}));}return inside?-min:min;}
const gate=map.features.find(f=>f.label==='Timber gate'),crossings=[];
for(const path of INCOMING){
 assert(path[0].z>0&&path[0].x>-19,'Approach from the House 3 lane, not the west side');
 const local=p=>({x:Math.cos(gate.yaw)*(p.x-gate.position[0])-Math.sin(gate.yaw)*(p.z-gate.position[2]),z:Math.sin(gate.yaw)*(p.x-gate.position[0])+Math.cos(gate.yaw)*(p.z-gate.position[2])});
 const p=path.reduce((a,b)=>Math.abs(local(a).z)<Math.abs(local(b).z)?a:b),v=local(p);
 assert(Math.abs(v.x)<.2&&Math.abs(v.z)<.2,'Cross the centre of the actual timber gate');crossings.push(v);
}
let minimum=Infinity;
for(const path of [...INCOMING,...DEPARTING])for(const p of path){
 for(const f of map.features.filter(f=>f.label!=='Timber gate')){const d=polygon(p,f.footprint);assert(d>=.45,`${f.label}: ${d} m at ${JSON.stringify(p)}`);minimum=Math.min(minimum,d);}
 for(const w of map.walls){const d=segment(p,w.a,w.b)-w.width/2;assert(d>=.45,`${w.kind}: ${d} m at ${JSON.stringify(p)}`);minimum=Math.min(minimum,d);}
}
console.log('PASS reunion: gated arrival/dialogue/follow, pause, patient wait, early follow, replay/reset, point 10 placeholder, unnamed couple; gate crossings',crossings,'minimum scenery clearance',minimum);

// Check the loaded open leaf and posts, rather than excluding the entire gate
// because the map's closed-door hull fills its traversable opening.
const {loadSettlement,THREE}=await import('./load-settlement.mjs');
const {CORRIDORS,HOUSE_APPROACHES}=await import('../src/rehearsal-route.mjs');
const {scene}=await loadSettlement({routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES});
scene.getObjectByName('journey-gate-hinge').rotation.y=-Math.PI*.48;scene.updateMatrixWorld(true);
function hull(points){
 const sorted=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=items=>{const result=[];for(const p of items){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
 return [...half(sorted).slice(0,-1),...half([...sorted].reverse()).slice(0,-1)];
}
const gateParts=[];scene.getObjectByName('journey-gate').traverse(o=>{
 if(!o.isMesh)return;const vertices=[],p=new THREE.Vector3(),positions=o.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);vertices.push([p.x,p.z]);}
 gateParts.push(hull(vertices));
});
let gateMinimum=Infinity;
for(const path of INCOMING)for(const p of path)for(const part of gateParts){
 const d=polygon(p,part);
 gateMinimum=Math.min(gateMinimum,d);assert(d>=.4,`Open gate component clearance ${d} at ${JSON.stringify(p)}`);
}
console.log('PASS loaded gate posts/open leaf: projected mesh-hull clearance',gateMinimum);
