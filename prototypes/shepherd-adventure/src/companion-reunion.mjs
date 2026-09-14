import {sampleCorridor,lengthOf,positionOn} from './route-geometry.mjs';

const points=values=>values.map(([x,z])=>({x,z}));
export const REUNION_LINES={
 question:'“We saw your light! Have you found the way?”',
 directions:'“Yes. This man gave the couple shelter. They’re in the stall at the far end of the animal pen.”',
 invitation:'“Then come—let’s see the child the angel told us about!”'
};
export const GATHER=points([[-11.7,-27],[-10.8,-29.1]]);
export const WAIT=points([[-16,-36],[-14.4,-34.3]]);
// The entrance-side lane (House 1 / House 3), then the CENTRE of the opened
// timber gate. The former west-side cinematic path is deliberately not reused.
export const INCOMING=GATHER.map((end,i)=>sampleCorridor([
 ...(i?points([[-17.6,5.8]]):[]),
 ...points([[-17,2],[-17,-3],[-18,-6],[-17.5,-8.5],[-16.4,-10.5],
 [-14.799,-12.838],[-13.4,-15],[-13.5,-19],[-12.5,-23],[-12.1,-25]]),end
]));
export const DEPARTING=GATHER.map((start,i)=>sampleCorridor([
 start,...points(i===0?[[-12.7,-31.2],[-13.5,-33]]:[[-11.8,-31.4],[-13.5,-33]]),WAIT[i]
]));
const face=(p,target)=>Math.atan2(target.x-p.x,target.z-p.z);
const PLAYER={x:-13,z:-29};

export class CompanionReunion{
 constructor(finalRoute){
  this.phase='pending';this.elapsed=0;this.cameraElapsed=0;this.breath=0;
  this.actors=GATHER.map(()=>({x:0,z:0,heading:0,visible:false,moving:false,speed:0,distance:0}));
  this.onward=WAIT.map((start,i)=>[start,...finalRoute.filter(p=>p.z<start.z&&p.z>-67),
   ...sampleCorridor(points(i===0?[[-27,-67],[-28,-69],[-28,-74.2]]:[[-27,-67],[-26.1,-68.5],[-26.2,-69.8]]))]);
 }
 begin(){
  if(this.phase!=='pending')return false;this.phase='arriving';this.elapsed=0;
  // Both already exist in the lane when the shot cuts in. Physical spacing,
  // rather than a delayed visibility toggle, creates the staggered arrival.
  this.actors.forEach((actor,i)=>Object.assign(actor,positionOn(INCOMING[i],0),{visible:true}));
  return true;
 }
 get canFollow(){return this.phase==='waiting';}
 advance(){
  const next={question:'directions',directions:'invitation',invitation:'departing'}[this.phase];
  if(!next)return false;this.phase=next;this.elapsed=0;
  if(next==='departing')this.actors.forEach(a=>{a.distance=0;a.speed=0;});
  return true;
 }
 follow(){if(!this.canFollow)return false;this.followRequested=true;this.startOnward();return true;}
 startOnward(){this.phase='following';this.elapsed=0;this.actors.forEach(a=>{a.distance=0;a.speed=0;});}
 stageComplete(){this.phase='complete';}
 move(paths,dt,stagger,finishTarget){
  this.actors.forEach((actor,i)=>{
   if(this.elapsed<stagger*i)return;
   const path=paths[i],length=lengthOf(path),remaining=length-actor.distance;
   const pace=this.phase==='following'&&actor.z<-42?2:4.6;
   let wanted=remaining<1.8?Math.max(.65,remaining*2.6):pace;
   // Keep a visible gap when the leader slows inside the animal enclosure.
   if(this.phase==='following'&&i===1){
    const lead=this.actors[0],gap=Math.hypot(actor.x-lead.x,actor.z-lead.z);
    if(gap<3&&actor.z>lead.z)wanted=Math.min(wanted,Math.max(0,lead.speed+(gap-1.8)*2));
   }
   actor.speed+=(wanted-actor.speed)*(1-Math.exp(-6*dt));
   actor.distance=Math.min(length,actor.distance+actor.speed*dt);
   const p=positionOn(path,actor.distance),moving=actor.distance<length;
   Object.assign(actor,p,{visible:true,moving});
   if(!moving){actor.speed=0;actor.heading=finishTarget?face(actor,finishTarget):-Math.PI/2;}
  });
  return this.actors.every((a,i)=>a.visible&&a.distance>=lengthOf(paths[i]));
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0||this.phase==='pending'||this.phase==='complete')return;
  this.elapsed+=dt;
  if(this.phase==='arriving'){
   const done=this.move(INCOMING,dt,0,PLAYER);
   if(this.actors.every(a=>a.visible&&a.z<-15))this.cameraElapsed+=dt;
   if(done){this.breath+=dt;if(this.breath>=.9){this.phase='question';this.elapsed=0;}}
  }else if(this.phase==='departing'){
   if(this.move(DEPARTING,dt,.45,PLAYER)){
    this.phase='waiting';this.elapsed=0;
   }
  }else if(this.phase==='following'&&this.move(this.onward,dt,0,null))this.phase='complete';
 }
 snapshot(){return {phase:this.phase,elapsed:this.elapsed,cameraElapsed:this.cameraElapsed,canFollow:this.canFollow,followRequested:!!this.followRequested,actors:this.actors.map(a=>({...a}))};}
}
