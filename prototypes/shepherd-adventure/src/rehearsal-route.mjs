import {CompanionReunion} from './companion-reunion.mjs';
import {sampleCorridor,lengthOf,positionOn} from './route-geometry.mjs';
export {sampleCorridor,lengthOf,positionOn} from './route-geometry.mjs';
import {EmptyStall} from './empty-stall.mjs';
import {HouseTracks,SEARCH_POINTS} from './house-tracks.mjs';
// The ten-point user-drawn village walk. Structures retain the accepted layout.
// Each entry owns its incoming corridor; scene performance is deliberately pending.
import {BarredGate} from './barred-gate.mjs';
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

export const STOPS=definitions.map(([id,title,beat,feature,target,controls],index)=>({id:`s${String(index+1).padStart(2,'0')}-${id}`,number:index+1,title,beat,feature,target:point(target),anchor:point(controls.at(-1)),controls:controls.map(point)}));
export const CORRIDORS=STOPS.map((stop,index)=>({edge:{id:`rehearsal-${index+1}`,a:index?STOPS[index-1].id:'entry',b:stop.id},points:sampleCorridor([index?STOPS[index-1].anchor:ENTRY,...stop.controls])}));
export class RouteRehearsal{
 constructor(){this.reset();}
 reset(){this.reunion=new CompanionReunion(CORRIDORS[9].points);this.houseOwner=new HouseSighting();this.emptyStall=new EmptyStall();this.gateLit=false;this.houseAdvice=new HouseSighting();this.houseTracks=new HouseTracks();this.barredGate=new BarredGate();this.houseSighting=new HouseSighting(3);this.houseRejection=new HouseRejection();this.lampAssembly=new LampAssembly();this.index=-1;this.paused=false;this.travel=null;this.position={...ENTRY,heading:Math.PI};this.phase='choice';this.gait='walk';this.distance=0;this.lantern=false;this.gateOpen=false;this.staged=false;this.completed=new Set();}
 get stop(){return STOPS[this.index]||null;}
 get at(){return this.stop?.id||'entry';}
 get options(){return [];}
 setPriorOutcomes(index){this.reunion=new CompanionReunion(CORRIDORS[9].points);if(index>8)this.reunion.stageComplete();this.houseOwner=new HouseSighting();if(index>8){this.houseOwner.knock();this.houseOwner.tick(3);while(!this.houseOwner.complete)this.houseOwner.advance();}this.emptyStall=new EmptyStall();this.gateLit=index>=8;if(index>=8){this.emptyStall.phase="house";this.emptyStall.lit=true;this.emptyStall.open=true;}this.houseAdvice=new HouseSighting();this.houseTracks=new HouseTracks();if(index>6){this.houseAdvice.knock();this.houseAdvice.tick(3);while(!this.houseAdvice.complete)this.houseAdvice.advance();}if(index>4){this.houseTracks.knock();this.houseTracks.tick(7.2);this.houseTracks.lookAround();this.houseTracks.spotted=true;}this.barredGate=new BarredGate();if(index>3){this.barredGate.begin();this.barredGate.tick(6);}this.houseSighting=new HouseSighting(3);this.houseRejection=new HouseRejection();if(index>2){this.houseSighting.knock();this.houseSighting.tick(3);while(!this.houseSighting.complete)this.houseSighting.advance();}if(index>1){this.houseRejection.knock();this.houseRejection.tick(7);}this.lampAssembly.reset();if(index>=1)this.lampAssembly.stageComplete();this.lantern=index>=1;this.gateOpen=index>=8;this.completed=new Set(STOPS.slice(0,index).map(s=>s.id));}
 actAtStall(){if(this.index!==7||this.travel||this.paused)return false;return this.emptyStall.act();}
 tryGate(){if(this.index!==3||this.travel||this.paused)return false;return this.barredGate.begin();}
 knockOnHouse(){if(![1,2,4,6,8].includes(this.index)||this.travel||this.paused)return false;return (this.index===8?this.houseOwner:this.index===6?this.houseAdvice:this.index===4?this.houseTracks:this.index===1?this.houseRejection:this.houseSighting).knock();}
 lookAround(){if(this.index!==4||this.travel||this.paused)return false;return this.houseTracks.lookAround();}
 advanceOwner(){if(this.index!==8||this.travel||this.paused)return false;const changed=this.houseOwner.advance();if(changed&&this.houseOwner.complete)this.reunion.begin();return changed;}
 advanceReunion(){if(this.index!==8||this.travel||this.paused)return false;return this.reunion.advance();}
 advanceAdvice(){if(this.index!==6||this.travel||this.paused)return false;return this.houseAdvice.advance();}
 advanceSighting(){if(this.index!==2||this.travel||this.paused)return false;return this.houseSighting.advance();}
 assembleLamp(action){if(this.index!==0||this.travel||this.paused)return false;return this.lampAssembly.act(action);}
 takeLamp(){if(this.index!==0||this.travel||this.paused||!this.lampAssembly.take())return false;this.lantern=true;this.completed.add(this.at);return true;}
 beginLeg(index,progress=0){
  const points=index===5&&this.houseTracks.spotted?sampleCorridor([this.position,...STOPS[5].controls.slice(1)]):CORRIDORS[index].points,length=lengthOf(points);
  this.travel={points,lengths:points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),length,progress,to:STOPS[index].id,index,speed:0};
  this.phase='walking';this.position=positionOn(points,progress);
 }
 next(){
  if(this.paused||this.travel||this.index===STOPS.length-1)return false;
  if(this.index===0&&!this.lampAssembly.taken)return false;
  if(this.index===1&&!this.houseRejection.complete)return false;
  if(this.index===2&&!this.houseSighting.complete)return false;
  if(this.index===6&&!this.houseAdvice.complete)return false;
  if(this.index===8&&(!this.houseOwner.complete||!this.reunion.canFollow))return false;
  if(this.index===3&&!this.barredGate.complete)return false;
  if(this.index===4&&!this.houseTracks.complete)return false;
  if(this.index===7&&!this.emptyStall.complete)return false;
  if(this.index>=0)this.completed.add(this.at);
  if(this.index===8)this.reunion.follow();
  const fromStallReveal=this.index===7;this.beginLeg(this.index+1);this.travel.fromStallReveal=fromStallReveal;return true;
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
  if(!this.paused&&Number.isFinite(dt)&&dt>0)this.reunion.tick(dt);
  if(!this.paused&&!this.travel&&this.index===7&&Number.isFinite(dt)&&dt>0){
   this.emptyStall.tick(dt);this.gateLit=this.emptyStall.lit;this.gateOpen=this.emptyStall.open;
   const o=this.emptyStall.offset,a=STOPS[7].anchor,x=a.x+o.x,z=a.z+o.z;
   this.distance+=Math.hypot(x-this.position.x,z-this.position.z);this.position={...this.position,x,z};
   this.phase=["search","look"].includes(this.emptyStall.phase)?"inspect":"choice";
  }
  if(!this.paused&&!this.travel&&this.index===4&&Number.isFinite(dt)&&dt>0){
   const h=this.houseTracks;h.tick(dt);const old=this.position;
   if(h.searchStarted){
    const path=sampleCorridor(SEARCH_POINTS),length=lengthOf(path);
    h.searchDistance=Math.min(length,h.searchDistance+dt*1.35);this.position=positionOn(path,h.searchDistance);
    h.spotted=h.searchDistance>=length;this.phase=h.spotted?'choice':'walking';this.gait='walk';
   }else{const a=h.approach;this.position={...old,x:18+.9*a,z:7.5+1.05*a};}
   this.distance+=Math.hypot(this.position.x-old.x,this.position.z-old.z);
  }
  if(!this.paused&&!this.travel&&this.index===3){
   this.barredGate.tick(dt);const a=this.barredGate.approach,anchor=STOPS[3].anchor;
   const x=anchor.x+.8*a,z=anchor.z-1.35*a;
   this.distance+=Math.hypot(x-this.position.x,z-this.position.z);this.position={...this.position,x,z};
  }
  if(!this.paused&&!this.travel&&[1,2,6,8].includes(this.index)){
   const h=this.index===8?this.houseOwner:this.index===6?this.houseAdvice:this.index===1?this.houseRejection:this.houseSighting;h.tick(dt);const a=h.approach,anchor=STOPS[this.index].anchor;
   const x=anchor.x+(this.index===8?-1.35:this.index===1?.85:1.35)*a,z=anchor.z+(this.index===8?-.85:.85)*a;
   this.distance+=Math.hypot(x-this.position.x,z-this.position.z);this.position={...this.position,x,z};
  }
  if(this.paused||!this.travel||!Number.isFinite(dt)||dt<=0)return;
  const t=this.travel,remaining=t.length-t.progress;
  // Run between discoveries; settle into a walk for the last three metres.
  // Pass the sheep at a run; only the short shelter approach is quiet.
  const quiet=t.index===9&&remaining<8;
  this.gait=quiet||remaining<3?'walk':'run';
  const desired=this.gait==='run'?4.6:Math.min(2,Math.max(.45,remaining*2.5));
  const speed=t.speed+(desired-t.speed)*(1-Math.exp(-6*dt));
  t.speed=speed;const amount=Math.min(dt*speed,t.length-t.progress);t.progress+=amount;this.distance+=amount;this.position=positionOn(t.points,t.progress);
  if(t.progress>=t.length-1e-8){this.index=t.index;this.position={...this.position,...STOPS[t.index].anchor};this.travel=null;this.phase='choice';}
 }
 snapshot(){return {reunion:this.reunion.snapshot(),index:this.index,at:this.at,phase:this.phase,paused:this.paused,staged:this.staged,lantern:this.lantern,lampAssembly:this.lampAssembly.snapshot(),houseRejection:this.houseRejection.snapshot(),houseSighting:this.houseSighting.snapshot(),houseAdvice:this.houseAdvice.snapshot(),houseOwner:this.houseOwner.snapshot(),barredGate:this.barredGate.snapshot(),houseTracks:this.houseTracks.snapshot(),gateLit:this.gateLit,emptyStall:this.emptyStall.snapshot(),gateOpen:this.gateOpen,distance:this.distance,position:{...this.position},destination:this.travel?.index??null,completed:[...this.completed]};}
}

// Actual knocking approaches, keyed by settlement house number.
export const HOUSE_APPROACHES=Object.fromEntries([[1,1],[3,2],[5,4],[8,6],[9,8]].map(([house,stop])=>[house,STOPS[stop].anchor]));
