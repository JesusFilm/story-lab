import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {Journey} from '../src/journey-model.mjs';
import {JourneyCamera,routeLookahead,blocked} from '../src/journey-camera.mjs';
import {animalViewWeight} from '../src/journey-animal-route.mjs';
import {height} from '../src/journey-terrain.mjs';
const {world}=await loadSettlement();
const sheep=world.settlementFeatures.filter(f=>f.kind==='animal').slice(0,3);
const pen=world.settlementFeatures.find(f=>f.label==='Quiet animal pen').root;
const gate=world.settlementFeatures.find(f=>f.label==='Animal-area gate').root;
const report=[];
for(const aspect of [16/9,390/844]){
 const j=new Journey();j.start();j.at='arch';j.discoveries.add('gate');j.inventory.add('lantern');j.commit(j.options.find(e=>e.to==='goal'));
 const rig=new JourneyCamera(),camera=new THREE.PerspectiveCamera(54,aspect,.1,500);
 let visibleSeconds=0,longest=0,consecutive=0,walkSeconds=0,frame=null,maxMotion=0,previous;
 while(j.travel){
  const p=j.position,ahead=routeLookahead(j.travel),weight=animalViewWeight(p);
  const f=rig.update({player:{...p,y:height(p.x,p.z)},heading:Math.atan2(ahead.x-p.x,ahead.z-p.z),ahead,boxes:world.occluders,dt:1/30,portrait:aspect<1,interest:{x:-35,z:-53,y:height(-35,-53)+.7,weight}});
  camera.position.set(f.position.x,f.position.y,f.position.z);camera.lookAt(f.look.x,f.look.y,f.look.z);camera.updateMatrixWorld(true);
  const playerScreen=new THREE.Vector3(p.x,height(p.x,p.z)+1.1,p.z).project(camera);
  assert(Math.abs(playerScreen.x)<.95&&Math.abs(playerScreen.y)<.95,'Keep shepherd on screen '+JSON.stringify({aspect,p,weight,screen:playerScreen.toArray(),f}));
  assert(f.playerVisible,'Scenic camera keeps a clear line to the shepherd');
  const allVisible=sheep.every(({root})=>{
   const b=new THREE.Box3().setFromObject(root),target=b.getCenter(new THREE.Vector3());target.y=b.max.y-.1;
   const screen=target.clone().project(camera);
   const ray=new THREE.Raycaster(camera.position,target.clone().sub(camera.position).normalize(),.1,camera.position.distanceTo(target)-.1);
   return Math.abs(screen.x)<.88&&Math.abs(screen.y)<.88&&screen.z<1&&screen.z>-1&&!blocked(camera.position,target,world.occluders,.02)&&ray.intersectObjects([pen,gate],true).length===0;
  });
  if(weight>.5&&allVisible){visibleSeconds+=1/30;consecutive+=1/30;longest=Math.max(longest,consecutive);frame??={position:f.position,look:f.look,player:p};}else consecutive=0;
  if(weight>.5&&j.travel.speed<2.2)walkSeconds+=1/30;
  if(previous&&weight>.1)maxMotion=Math.max(maxMotion,camera.position.distanceTo(previous));previous=camera.position.clone();
  j.step(1/30);
 }
 assert.equal(j.phase,'arrival');assert(longest>=3,`Three sheep need at least 3 continuous visible seconds at aspect ${aspect}; got ${longest}`);
 assert(walkSeconds>3);assert(maxMotion<.7,'Camera has no abrupt position jump');
 report.push({aspect,visibleSeconds,longestContinuousSeconds:longest,walkSeconds,maxCameraStepMetres:maxMotion,frame});
}
writeFileSync(new URL('./animal-route-view-verification.json',import.meta.url),JSON.stringify({status:'passed',report,limits:'Actual sheep projection, wall/structure obstruction and pen/gate raycasts. Does not establish runtime lighting or physical-device performance.'},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
