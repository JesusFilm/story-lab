// The ten-point user-drawn village walk. Structures retain the accepted layout.
// Each entry owns its incoming corridor; scene performance is deliberately pending.
import {HouseSighting} from './house-sighting.mjs';
import {HouseRejection} from './house-rejection.mjs';
import {LampAssembly} from './lamp-assembly.mjs';
export const ENTRY={x:0,z:50};
const point=([x,z])=>({x,z});
const definitions=[
 ['lamp','Lamp workbench','Prepare a light and set out.','Lamp workbench',[-10.5,30],[[-1,43],[-6,36],[-8,32],[-8,29.5]]],
 ['house-1','House 1','The occupant sends you away because it is late.','House 1',[-9,18.5],[[-11,26],[-13,22],[-13,18.5]]],
 ['house-3','House 3','A resident saw the travellers with a donkey heading toward the gate.','House 3',[-10,0],[[-16,12],[-18,6],[-17,2],[-14.5,0]]],
 ['barred-gate','Barred gate','The gate is barred from this side. Ask near the well.','Timber gate',[-14.8,-12.8],[[-17,-3],[-18,-6],[-17.5,-8.5],[-16.4,-10.5]]],
 ['house-5','House 5','Nobody answers. Human and animal tracks lead away.','House 5',[22,8.5],[[-14,-7.5],[-9,-6],[-5,-3],[-3,4],[0,8],[7,10],[14,9],[18,7.5]]],
 ['animal-pen','Village animal pen','The pen is closed. Tracks continue past it.','Animal pen',[25,-26],[[19,3],[23,-2],[25,-8],[24,-15],[24,-21]]],
 ['house-8','House 8','The resident suggests trying the stall by the gate.','House 8',[6,-20.5],[[20,-17.5],[15,-14],[8,-14],[2,-16],[1,-18],[1.5,-20.5]]],
 ['empty-stall','Empty stall and rear gate','Nobody is here. Open the gate; then notice House 9.','Empty stall 1',[-21,-16],[[-2,-22.5],[-7,-22.5],[-12,-21],[-14.5,-18],[-16.5,-16.5]]],
 ['house-9','House 9','The shelter owner gives directions. Companions arrive, ask and run ahead.','House 9',[-18,-29],[[-14.2,-20],[-12.5,-24],[-13,-29]]],
 ['nativity','Nativity shelter','Follow past the sheep and arrive quietly. The detailed ending is pending.','Nativity shelter',[-33,-73],[[-13.5,-33],[-16,-36],[-21,-39],[-25,-42],[-27.5,-48],[-28,-55],[-27.5,-62],[-27,-67],[-28,-72]]]
];

// Hermite interpolation with restrained tangents; tested against loaded geometry.
export function sampleCorridor(controls){
 const result=[];
 for(let j=0;j<controls.length-1;j++){
  const a=controls[Math.max(0,j-1)],b=controls[j],c=controls[j+1],d=controls[Math.min(controls.length-1,j+2)];
  const steps=Math.max(8,Math.ceil(Math.hypot(c.x-b.x,c.z-b.z)/.25));
  for(let i=0;i<steps;i++){
   const t=i/steps,t2=t*t,t3=t2*t;
   const v=k=>(2*t3-3*t2+1)*b[k]+(t3-2*t2+t)*.35*(c[k]-a[k])+(-2*t3+3*t2)*c[k]+(t3-t2)*.35*(d[k]-b[k]);
   result.push({x:v('x'),z:v('z')});
  }
 }
 return [...result,{...controls.at(-1)}];
}
export const STOPS=definitions.map(([id,title,beat,feature,target,controls],index)=>({id:`s${String(index+1).padStart(2,'0')}-${id}`,number:index+1,title,beat,feature,target:point(target),anchor:point(controls.at(-1)),controls:controls.map(point)}));
export const CORRIDORS=STOPS.map((stop,index)=>({edge:{id:`rehearsal-${index+1}`,a:index?STOPS[index-1].id:'entry',b:stop.id},points:sampleCorridor([index?STOPS[index-1].anchor:ENTRY,...stop.controls])}));
export function lengthOf(points){return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.z-points[i].z),0);}
export function positionOn(points,distance){
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);
  if(distance<=length||i===points.length-1){const t=length?Math.min(1,Math.max(0,distance/length)):0;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,b.z-a.z)};}
  distance-=length;
 }
 return {...points[0],heading:Math.PI};
}

export class RouteRehearsal{
 constructor(){this.reset();}
 reset(){this.houseSighting=new HouseSighting();this.houseRejection=new HouseRejection();this.lampAssembly=new LampAssembly();this.index=-1;this.paused=false;this.travel=null;this.position={...ENTRY,heading:Math.PI};this.phase='choice';this.gait='walk';this.distance=0;this.lantern=false;this.gateOpen=false;this.staged=false;this.completed=new Set();}
 get stop(){return STOPS[this.index]||null;}
 get at(){return this.stop?.id||'entry';}
 get options(){return [];}
 setPriorOutcomes(index){this.houseSighting=new HouseSighting();this.houseRejection=new HouseRejection();if(index>2){this.houseSighting.knock();this.houseSighting.tick(3);while(!this.houseSighting.complete)this.houseSighting.advance();}if(index>1){this.houseRejection.knock();this.houseRejection.tick(7);}this.lampAssembly.reset();if(index>=1)this.lampAssembly.stageComplete();this.lantern=index>=1;this.gateOpen=index>=8;this.completed=new Set(STOPS.slice(0,index).map(s=>s.id));}
 knockOnHouse(){if(![1,2].includes(this.index)||this.travel||this.paused)return false;return (this.index===1?this.houseRejection:this.houseSighting).knock();}
 advanceSighting(){if(this.index!==2||this.travel||this.paused)return false;return this.houseSighting.advance();}
 assembleLamp(action){if(this.index!==0||this.travel||this.paused)return false;return this.lampAssembly.act(action);}
 takeLamp(){if(this.index!==0||this.travel||this.paused||!this.lampAssembly.take())return false;this.lantern=true;this.completed.add(this.at);return true;}
 beginLeg(index,progress=0){
  const points=CORRIDORS[index].points,length=lengthOf(points);
  this.travel={points,lengths:points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),length,progress,to:STOPS[index].id,index,speed:0};
  this.phase='walking';this.position=positionOn(points,progress);
 }
 next(){
  if(this.paused||this.travel||this.index===STOPS.length-1)return false;
  if(this.index===0&&!this.lampAssembly.taken)return false;
  if(this.index===1&&!this.houseRejection.complete)return false;
  if(this.index===2&&!this.houseSighting.complete)return false;
  if(this.index>=0)this.completed.add(this.at);
  if(this.index===7)this.gateOpen=true;
  this.beginLeg(this.index+1);return true;
 }
 jump(index){
  if(!Number.isInteger(index)||index<0||index>=STOPS.length)return false;
  this.index=index;this.travel=null;this.phase='choice';this.paused=false;this.staged=true;this.distance=0;this.setPriorOutcomes(index);
  const s=STOPS[index];this.position={...s.anchor,heading:Math.atan2(s.target.x-s.anchor.x,s.target.z-s.anchor.z)};return true;
 }
 replay(){
  const index=this.travel?.index??Math.max(0,this.index);
  this.setPriorOutcomes(index);this.index=index-1;this.paused=false;this.staged=true;this.distance=0;
  // Replay the entire incoming segment, including turns, not just the last frame.
  this.beginLeg(index);return true;
 }
 step(dt){
  if(!this.paused&&!this.travel&&[1,2].includes(this.index)){
   const h=this.index===1?this.houseRejection:this.houseSighting;h.tick(dt);const a=h.approach,anchor=STOPS[this.index].anchor;
   const x=anchor.x+(this.index===1?.85:1.35)*a,z=anchor.z+.85*a;
   this.distance+=Math.hypot(x-this.position.x,z-this.position.z);this.position={...this.position,x,z};
  }
  if(this.paused||!this.travel||!Number.isFinite(dt)||dt<=0)return;
  const t=this.travel,remaining=t.length-t.progress;
  // Run between discoveries; settle into a walk for the last three metres.
  // The sheep enclosure is a deliberate, sustained quiet approach.
  const quiet=t.index===9&&this.position.z<-42;
  this.gait=quiet||remaining<3?'walk':'run';
  const desired=this.gait==='run'?4.6:Math.min(2,Math.max(.45,remaining*2.5));
  const speed=t.speed+(desired-t.speed)*(1-Math.exp(-6*dt));
  t.speed=speed;const amount=Math.min(dt*speed,t.length-t.progress);t.progress+=amount;this.distance+=amount;this.position=positionOn(t.points,t.progress);
  if(t.progress>=t.length-1e-8){this.index=t.index;this.position={...this.position,...STOPS[t.index].anchor};this.travel=null;this.phase='choice';}
 }
 snapshot(){return {index:this.index,at:this.at,phase:this.phase,paused:this.paused,staged:this.staged,lantern:this.lantern,lampAssembly:this.lampAssembly.snapshot(),houseRejection:this.houseRejection.snapshot(),houseSighting:this.houseSighting.snapshot(),gateOpen:this.gateOpen,distance:this.distance,position:{...this.position},destination:this.travel?.index??null,completed:[...this.completed]};}
}

// Actual knocking approaches, keyed by settlement house number.
export const HOUSE_APPROACHES=Object.fromEntries([[1,1],[3,2],[5,4],[8,6],[9,8]].map(([house,stop])=>[house,STOPS[stop].anchor]));
