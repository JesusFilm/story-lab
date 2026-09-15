import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {RouteRehearsal,STOPS,CORRIDORS,HOUSE_APPROACHES,lengthOf,sampleCorridor} from '../src/rehearsal-route.mjs';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {SEARCH_POINTS} from '../src/house-tracks.mjs';
import {JourneyCamera,routeLookahead,blocked} from '../src/journey-camera.mjs';
import {height} from '../src/journey-terrain.mjs';
function stall(j){j.step(3.6);assert(j.actAtStall());j.step(4.6);assert(j.actAtStall());j.step(4.9);j.step(3.1);j.step(2.6);}
function sighting(j){j.knockOnHouse();j.step(3);for(let i=0;i<4;i++)assert(j.advanceSighting());}
function owner(j){j.knockOnHouse();j.step(3);for(let i=0;i<4;i++)assert(j.advanceOwner());while(j.reunion.phase==='arriving')j.step(.05);for(let i=0;i<3;i++)assert(j.advanceReunion());while(!j.reunion.canFollow)j.step(.05);}
function advice(j){j.knockOnHouse();j.step(3);for(let i=0;i<4;i++)assert(j.advanceAdvice());}
function tracks(j){j.knockOnHouse();j.step(7.2);j.lookAround();while(!j.houseTracks.spotted)j.step(.1);}
function prepareLamp(j){j.lampAssembly.begin();for(const id of ['body','wick','oil','flint','light'])assert(j.assembleLamp(id));assert(j.takeLamp());}

const j=new RouteRehearsal();assert.equal(STOPS.length,10);assert.equal(new Set(STOPS.map(s=>s.id)).size,10);
assert.equal(j.next(),true);assert.equal(j.next(),false,'Repeated next cannot skip a scene');
j.paused=true;const held=j.snapshot();j.step(2);assert.deepEqual(j.snapshot(),held);assert.equal(j.next(),false);j.paused=false;
for(let index=0;index<10;index++){
 while(j.travel)j.step(1/60);
 assert.equal(j.index,index);assert.deepEqual({x:j.position.x,z:j.position.z},STOPS[index].anchor);
 assert.equal(j.lantern,index>=1);assert.equal(j.gateOpen,index>=8);
 if(index===0)prepareLamp(j);
 if(index===1){j.knockOnHouse();j.step(7);}
 if(index===2)sighting(j);
 if(index===6)advice(j);
 if(index===7)stall(j);
 if(index===8)owner(j);
 if(index===3){j.tryGate();j.step(6);}
 if(index===4)tracks(j);
 if(index<9)assert(j.next());else assert.equal(j.next(),false);
}
const fullDistance=j.distance;
const urgency=new RouteRehearsal();urgency.next();
for(let leg=0;leg<10;leg++){
 const gaits=[];let peak=0;
 while(urgency.travel){urgency.step(1/60);if(gaits.at(-1)!==urgency.gait)gaits.push(urgency.gait);peak=Math.max(peak,urgency.travel?.speed||0);}
 assert.deepEqual(gaits,['run','walk'],`Leg ${leg+1} should run, then walk without toggling back`);
 assert(peak>4,'Running should change traversal speed, not only the clip');
 if(leg===0)prepareLamp(urgency);
 if(leg===1){urgency.knockOnHouse();urgency.step(7);}
 if(leg===2)sighting(urgency);
 if(leg===6)advice(urgency);
 if(leg===7)stall(urgency);
 if(leg===8)owner(urgency);
 if(leg===3){urgency.tryGate();urgency.step(6);}
 if(leg===4)tracks(urgency);
 if(leg<9)urgency.next();
}

for(let index=0;index<10;index++){
 assert(j.jump(index));assert(j.staged);assert.equal(j.lantern,index>=1);assert.equal(j.gateOpen,index>=8);
 assert(j.replay());assert.equal(j.travel.index,index);assert.equal(j.travel.progress,0);
 while(j.travel)j.step(.016);assert.equal(j.index,index);assert.equal(j.gateOpen,index>=8);
}
assert.equal(j.jump(-1),false);assert.equal(j.jump(10),false);j.reset();assert.deepEqual(j.snapshot(),new RouteRehearsal().snapshot());

const canonical=JSON.parse(readFileSync(new URL('../map/settlement-layout.json',import.meta.url)));
const map=JSON.parse(readFileSync(new URL('../map/rehearsal-layout.json',import.meta.url)));
const {world,scene}=await loadSettlement({routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES});
assert.equal(world.settlementFeatures.length,map.features.length);
const fixedLights=scene.children.filter(o=>o.isPointLight);
assert.equal(fixedLights.length,5,'Only three helpful houses, workbench and nativity have fixed lights');
for(const house of [3,8,9]){
 const root=world.settlementFeatures.find(f=>f.label===`House ${house}`).root;
 assert(fixedLights.some(light=>Math.hypot(light.position.x-root.position.x-.8,light.position.z-root.position.z-2)<.001));
}

for(const feature of world.settlementFeatures){
 const saved=map.features.find(f=>f.label===feature.label);assert(saved,feature.label);
 const original=canonical.features.find(f=>f.label===feature.label);
 // Decorations follow the host facade, which deliberately turns in rehearsal.
 if(!(feature.root.userData.decoration||feature.root.userData.annex))feature.root.position.toArray().forEach((v,i)=>assert(Math.abs(v-original.position[i])<.001,`${feature.label}: centre moved`));
 const approach=HOUSE_APPROACHES[Number(feature.label.replace('House ',''))];
 if(feature.kind==='house'&&approach){
  const direction=new THREE.Vector3(1,0,0).applyQuaternion(feature.root.quaternion);
  const toStop=new THREE.Vector3(approach.x-feature.root.position.x,0,approach.z-feature.root.position.z).normalize();
  assert(direction.dot(toStop)>.9999,`${feature.label}: door facade must face knocking point`);
 }else if(!(feature.root.userData.decoration||feature.root.userData.annex))assert.equal(feature.root.rotation.y,original.yaw,`${feature.label}: unexpected rotation`);
 const box=new THREE.Box3().setFromObject(feature.root);
 for(const side of ['min','max'])box[side].toArray().forEach((value,i)=>assert(Math.abs(value-saved.bounds[side][i])<.001,`${feature.label}: changed ${side} dimension ${i}`));
 assert(Math.abs(feature.root.rotation.y-saved.yaw)<1e-8,`${feature.label}: changed rotation`);
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/den)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function polygonDistance(p,poly){
 let inside=false,min=Infinity;
 for(let i=0,k=poly.length-1;i<poly.length;k=i++){
  const [ax,az]=poly[k],[bx,bz]=poly[i];
  if((az>p.z)!==(bz>p.z)&&p.x<(bx-ax)*(p.z-az)/(bz-az)+ax)inside=!inside;
  min=Math.min(min,segmentDistance(p,{x:ax,z:az},{x:bx,z:bz}));
 }
 return inside?-min:min;
}
const failures=[],legs=[];
const emptyStall=world.settlementFeatures.find(f=>f.label==='Empty stall 1').root;
for(const wall of world.wallSegments.filter(w=>w.kind==='gate-wing')){
 for(let i=0;i<=30;i++){
  const p=emptyStall.worldToLocal(new THREE.Vector3(wall.a.x+(wall.b.x-wall.a.x)*i/30,0,wall.a.z+(wall.b.z-wall.a.z)*i/30));
  assert(!(Math.abs(p.x)<1.4&&Math.abs(p.z)<1.8),'Gate wall crosses the stall interior');
 }
}

// A single convex hull fills the open gate's doorway. Test its real component
// footprints instead so the empty opening stays traversable while posts/leaf don't.
function hull(points){
 const sorted=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 function half(items){const result=[];for(const p of items){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;}
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
const gateParts=[];
world.settlementFeatures.find(f=>f.label==='Animal-area gate').root.traverse(object=>{
 if(!object.isMesh)return;const vertices=[],p=new THREE.Vector3(),positions=object.geometry.attributes.position;
 for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);vertices.push([p.x,p.z]);}
 gateParts.push(hull(vertices));
});
for(const [index,corridor] of [...CORRIDORS,{points:sampleCorridor(SEARCH_POINTS)},{points:sampleCorridor([SEARCH_POINTS.at(-1),...STOPS[5].controls.slice(1)])}].entries()){
 let closest={metres:Infinity,label:''};
 for(const p of corridor.points){
  for(const feature of map.features){
   const d=feature.label==='Animal-area gate'?Math.min(...gateParts.map(poly=>polygonDistance(p,poly))):polygonDistance(p,feature.footprint);
   if(d<closest.metres)closest={metres:d,label:feature.label,point:p};
   if(d<.45)failures.push({leg:index+1,feature:feature.label,clearance:d,point:p});
  }
  for(const wall of map.walls){
   const d=segmentDistance(p,wall.a,wall.b)-wall.width/2;
   if(d<closest.metres)closest={metres:d,label:wall.kind,point:p};
   if(d<.45)failures.push({leg:index+1,feature:wall.kind,clearance:d,point:p});
  }
 }
 legs.push({number:index+1,title:STOPS[index]?.title||'House 5 inspection / departure',metres:lengthOf(corridor.points),closest});
}
const folder=new URL(process.env.REHEARSAL_REVIEW_OUTPUT||'../review/2026-09-14-empty-stall/',import.meta.url);mkdirSync(folder,{recursive:true});
writeFileSync(new URL('geometry-and-state.json',folder),JSON.stringify({status:failures.length?'failed':'passed',fullDistance,unchangedCentres:world.settlementFeatures.length,orientedHouses:Object.keys(HOUSE_APPROACHES),legs,failures,limits:'Sampled path clearance against projected model hulls and wall centerlines, plus state transitions. Not a live camera or enjoyment test.'},null,2)+'\n');
console.log(JSON.stringify({fullDistance,legs,failures:failures.slice(0,12),failureCount:failures.length},null,2));
assert.equal(failures.length,0,'Rehearsal corridor needs at least 45 cm clearance from current structures and walls');
const cameras=[];
for(const portrait of [false,true]){
 const model=new RouteRehearsal(),rig=new JourneyCamera();let frames=0,hidden=0,minArm=Infinity,heading=Math.PI;
 model.next();
 while(true){
  const dt=1/30;model.step(dt);const p=model.position,stop=model.stop;
  const desired=!model.travel&&stop?Math.atan2(stop.target.x-p.x,stop.target.z-p.z):p.heading;
  heading+=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading))*(1-Math.exp(-5*dt));
  const frame=rig.update({player:{...p,y:height(p.x,p.z)},heading,ahead:routeLookahead(model.travel)||stop?.target,boxes:world.occluders,dt,portrait});
  if(blocked({x:p.x,y:height(p.x,p.z)+1.15,z:p.z},frame.position,world.occluders,.1))hidden++;
  minArm=Math.min(minArm,frame.arm);frames++;
  if(!model.travel){if(model.index===9)break;if(model.index===0)prepareLamp(model);if(model.index===1){model.knockOnHouse();model.step(7);}if(model.index===2)sighting(model);if(model.index===6)advice(model);if(model.index===7)stall(model);if(model.index===8)owner(model);if(model.index===3){model.tryGate();model.step(6);}if(model.index===4)tracks(model);assert(model.next(),'Camera walkthrough must progress');}
 }
 cameras.push({portrait,frames,hiddenPlayerSamples:hidden,minimumArm:minArm});
 assert.equal(hidden,0,'New corridor must preserve sampled player visibility');
}
writeFileSync(new URL('camera-samples.json',folder),JSON.stringify({cameras,limits:'30 Hz geometry samples in landscape/portrait. Does not assess the UI, subject readability, animal-interest shot, or subjective camera comfort.'},null,2)+'\n');
console.log('Camera samples:',JSON.stringify(cameras));
