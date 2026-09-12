// Dependency-free camera planning, shared by runtime and all-route visibility checks.
export const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function angleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
export function segmentBox(a,b,box,pad=0){
 let lo=0,hi=1;for(const axis of ['x','y','z']){const d=b[axis]-a[axis],min=box.min[axis]-pad,max=box.max[axis]+pad;
  if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
  const v1=(min-a[axis])/d,v2=(max-a[axis])/d;lo=Math.max(lo,Math.min(v1,v2));hi=Math.min(hi,Math.max(v1,v2));if(lo>hi)return null;
 }return lo;
}
export function blocked(a,b,boxes,pad=.12){return boxes.some(box=>segmentBox(a,b,box,pad)!==null);}
// Near-camera geometry must also fade, even when the character ray misses a branch.
export function obstructionTarget(eye,player,bounds,inspecting=false){
 const inside=segmentBox(eye,eye,bounds,.65)!==null;
 const covered=!inspecting&&[.5,1.2,1.8].some(y=>{const t=segmentBox(eye,{x:player.x,y:player.y+y,z:player.z},bounds,.12);return t!==null&&t<.96;});
 return (inside||covered)?.06:1;
}
export function routeLookahead(travel,metres=3.5){
 if(!travel)return null;let d=Math.min(travel.length,travel.progress+metres);
 for(let i=0;i<travel.lengths.length;i++){if(d<=travel.lengths[i]){const a=travel.points[i],b=travel.points[i+1],t=d/travel.lengths[i];return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}d-=travel.lengths[i];}return travel.points.at(-1);
}
export class JourneyCamera{
 constructor(){this.yaw=Math.PI;this.position=null;this.look=null;this.lastDiagnostics=null;this.selectedArm=null;this.armAge=0;}
 reset(){this.position=null;this.look=null;this.yaw=Math.PI;this.selectedArm=null;this.armAge=0;}
 update({player,heading,ahead,boxes=[],dt=.016,instant=false,portrait=false,interest=null}){
  const ground=player.y||0,chest={x:player.x,y:ground+1.15,z:player.z};
  const delta=angleDelta(this.yaw,heading);this.yaw+=instant?delta:clamp(delta,-1.6*dt,1.6*dt);
  // Read what is immediately ahead, not the far endpoint beyond intervening houses.
  const forward={x:Math.sin(this.yaw),z:Math.cos(this.yaw)};
  const gaze=ahead||{x:player.x+forward.x*3,z:player.z+forward.z*3};
  const toward=Math.hypot(gaze.x-player.x,gaze.z-player.z)||1;
  const look={x:player.x+(gaze.x-player.x)*Math.min(1.6,toward)/toward,y:ground+1.25,z:player.z+(gaze.z-player.z)*Math.min(1.6,toward)/toward};
  const interestWeight=interest?.weight||0;
  if(interestWeight){look.x+=(interest.x-look.x)*interestWeight*.55;look.z+=(interest.z-look.z)*interestWeight*.55;look.y+=(interest.y-look.y)*interestWeight*.55;}
  let best=null,bestScore=Infinity;const candidates=[];this.armAge+=dt;
  for(const offset of [0,.32,-.32,.65,-.65,1,-1,1.45,-1.45,Math.PI])for(const elevation of [3.6,5.4,7.5]){
   const yaw=this.yaw+offset,back=(portrait?7.5:6.3)+interestWeight*(portrait?12:2.8);
   const pos={x:player.x-Math.sin(yaw)*back+Math.cos(yaw)*.85,y:ground+elevation+interestWeight*2.4,z:player.z-Math.cos(yaw)*back-Math.sin(yaw)*.85};
   const hidden=blocked(chest,pos,boxes,.2),gazeHidden=blocked(look,pos,boxes,.15);
   const score=(hidden?10000:0)+(gazeHidden?200:0)+Math.abs(offset)*8+(elevation-3.6)*3;
   const candidate={pos,score,offset,elevation,clear:!hidden&&!gazeHidden};candidates.push(candidate);if(score<bestScore){best=candidate;bestScore=score;}
  }
  // Hold a safe arm through small score changes. Corrected camera positions must
  // never feed back into candidate scoring: that creates the orbit/retract loop.
  const retained=this.selectedArm&&candidates.find(c=>c.offset===this.selectedArm.offset&&c.elevation===this.selectedArm.elevation);
  if(retained?.clear&&(this.armAge<.85||retained.score<=bestScore+5))best=retained;
  if(!retained||best.offset!==retained.offset||best.elevation!==retained.elevation)this.armAge=0;
  this.selectedArm=best;
  let pos=this.position&&!instant?mix(this.position,best.pos,1-Math.exp(-5*dt)):best.pos;
  // During the orbit, shorten the camera arm before it can pass through a wall.
  let closest=1;for(const box of boxes){const t=segmentBox(chest,pos,box,.22);if(t!==null)closest=Math.min(closest,t);}
  if(closest<1){const arm=distance(chest,pos);pos=mix(chest,pos,Math.max(0,closest-.3/arm));}
  if(distance(pos,chest)<1.7){
   const raised={x:player.x,y:ground+7.8,z:player.z+.1};if(!blocked(chest,raised,boxes,.15))pos=raised;
  }
  this.position=pos;this.look=this.look&&!instant?mix(this.look,look,1-Math.exp(-6*dt)):look;
  this.lastDiagnostics={playerVisible:!blocked(chest,pos,boxes,.1),aheadVisible:!blocked(look,pos,boxes,.1),yaw:this.yaw,arm:distance(chest,pos)};
  return {position:this.position,look:this.look,...this.lastDiagnostics};
 }
}
