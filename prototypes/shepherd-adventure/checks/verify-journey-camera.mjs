import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {JourneyCamera,routeLookahead,blocked,angleDelta,obstructionTarget} from '../src/journey-camera.mjs';
import {EDGES,NODES,lanePoints} from '../src/journey-model.mjs';
import {height} from '../src/journey-terrain.mjs';
const evidence=new URL('./journey-poi-scene-geometry.json',import.meta.url);
const {occluders:boxes,occlusionBounds}=JSON.parse(readFileSync(evidence));
let frames=0,hidden=0,aheadHidden=0,minimumArm=100,yawChanges=0;const failures=[];
let foliageFadeFrames=0;
for(const speed of [2.8,4.4])for(const portrait of [false,true])for(const reverseStart of [false,true])for(const e of EDGES)for(const reverse of [false,true]){
 const points=reverse?lanePoints(e).reverse():lanePoints(e),lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z));const length=lengths.reduce((a,b)=>a+b,0),rig=new JourneyCamera();let previousYaw;
 for(let d=0;d<length;d+=speed/30){
  const travel={points,lengths,length,progress:d},p=routeLookahead(travel,0),ahead=routeLookahead(travel,3.5),heading=Math.atan2(ahead.x-p.x,ahead.z-p.z);
  if(d===0&&reverseStart)rig.yaw=heading+Math.PI;
  const f=rig.update({player:{...p,y:height(p.x,p.z)},heading,ahead,boxes,dt:1/30,portrait,instant:d===0&&!reverseStart});frames++;
  if(!f.playerVisible){hidden++;if(failures.length<8)failures.push({edge:e.id,reverse,d,portrait});}
  if(!f.aheadVisible)aheadHidden++;minimumArm=Math.min(minimumArm,f.arm);if(previousYaw!==undefined)yawChanges=Math.max(yawChanges,Math.abs(angleDelta(previousYaw,f.yaw)));previousYaw=f.yaw;
  if(occlusionBounds.filter(b=>b.kind==='tree').some(b=>obstructionTarget(f.position,{...p,y:height(p.x,p.z)},b)<1))foliageFadeFrames++;
  assert(Number.isFinite(f.position.x)&&Number.isFinite(f.look.y));
 }
}
// User-reported regression: at a fixed stop a camera must converge rather than
// continually swap orbit candidates after retraction. Test all headings at every stop.
let stationaryCases=0,maxSettledMotion=0;
for(const p of NODES)for(let h=0;h<8;h++){
 const rig=new JourneyCamera(),heading=h*Math.PI/4;let prev;
 for(let f=0;f<450;f++){
  const out=rig.update({player:{...p,y:height(p.x,p.z)},heading,ahead:{x:p.x+Math.sin(heading)*3,z:p.z+Math.cos(heading)*3},boxes,dt:1/30});
  if(f>390)maxSettledMotion=Math.max(maxSettledMotion,Math.hypot(out.position.x-prev.x,out.position.y-prev.y,out.position.z-prev.z));prev=out.position;
 }stationaryCases++;
}
assert(maxSettledMotion<.005,`stationary jitter ${maxSettledMotion} metres/frame`);
assert(occlusionBounds.filter(b=>b.kind==='tree').length>30);assert(foliageFadeFrames>0,'tree fading must be exercised on real routes');
const report={foliageFadeFrames,treeBounds:occlusionBounds.filter(b=>b.kind==='tree').length,stationaryCases,maxSettledMotionMetres:maxSettledMotion,status:hidden?'failed':'passed',directedLaneConfigurations:EDGES.length*16,frames,hiddenPlayerChestFrames:hidden,aheadOcclusionFrames:aheadHidden,minimumArmMetres:minimumArm,maxYawStepRadians:yawChanges,failures,limits:'Sampled character-chest visibility against loaded structure bounds. Does not prove full-body visibility, tree/prop occlusion, inspection-camera composition, or subjective motion quality.'};
writeFileSync(new URL('./journey-camera-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));assert.equal(hidden,0);
