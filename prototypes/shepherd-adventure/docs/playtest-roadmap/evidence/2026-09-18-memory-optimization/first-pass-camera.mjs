// Dependency-free camera planning, shared by runtime and all-route visibility checks.
export const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const AXES=['x','y','z'],HEIGHTS=[.5,1.2,1.8],OFFSETS=[0,.32,-.32,.65,-.65,1,-1,1.45,-1.45,Math.PI],ELEVATIONS=[3.6,5.4,7.5];
const vec=()=>({x:0,y:0,z:0});
function mix(out,a,b,t){out.x=a.x+(b.x-a.x)*t;out.y=a.y+(b.y-a.y)*t;out.z=a.z+(b.z-a.z)*t;return out;}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function angleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
export function segmentBox(a,b,box,pad=0,endY=b.y){
 let lo=0,hi=1;for(const axis of AXES){const d=(axis==='y'?endY:b[axis])-a[axis],min=box.min[axis]-pad,max=box.max[axis]+pad;
  if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
  const v1=(min-a[axis])/d,v2=(max-a[axis])/d;lo=Math.max(lo,Math.min(v1,v2));hi=Math.min(hi,Math.max(v1,v2));if(lo>hi)return null;
 }return lo;
}
export function blocked(a,b,boxes,pad=.12){for(const box of boxes)if(segmentBox(a,b,box,pad)!==null)return true;return false;}
// Near-camera geometry must also fade, even when the character ray misses a branch.
export function obstructionTarget(eye,player,bounds,inspecting=false){
 const inside=segmentBox(eye,eye,bounds,.65)!==null;
 if(inside)return .06;
 if(!inspecting)for(const y of HEIGHTS){const t=segmentBox(eye,player,bounds,.12,player.y+y);if(t!==null&&t<.96)return .06;}
 return 1;
}
export function routeLookahead(travel,metres=3.5){
 if(!travel)return null;let d=Math.min(travel.length,travel.progress+metres);
 for(let i=0;i<travel.lengths.length;i++){if(d<=travel.lengths[i]){const a=travel.points[i],b=travel.points[i+1],t=d/travel.lengths[i];return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}d-=travel.lengths[i];}return travel.points.at(-1);
}
export class JourneyCamera{
 constructor(){this._position=vec();this._look=vec();this.chest=vec();this.target=vec();this.raised=vec();this.candidates=OFFSETS.flatMap(offset=>ELEVATIONS.map(elevation=>({pos:vec(),offset,elevation})));this.output={position:this._position,look:this._look};this.reset();}
 reset(){this.position=null;this.look=null;this.yaw=Math.PI;this.selectedArm=null;this.armAge=0;this.selectedIndex=-1;}
 update({player,heading,ahead,boxes=[],dt=.016,instant=false,portrait=false,interest=null,reuseOutput=false}){
  const ground=player.y||0,chest=this.chest;chest.x=player.x;chest.y=ground+1.15;chest.z=player.z;
  const delta=angleDelta(this.yaw,heading);this.yaw+=instant?delta:clamp(delta,-1.6*dt,1.6*dt);
  // Read what is immediately ahead, not the far endpoint beyond intervening houses.
  const gazeX=ahead?.x??player.x+Math.sin(this.yaw)*3,gazeZ=ahead?.z??player.z+Math.cos(this.yaw)*3;
  const toward=Math.hypot(gazeX-player.x,gazeZ-player.z)||1,look=this.target;
  look.x=player.x+(gazeX-player.x)*Math.min(1.6,toward)/toward;look.y=ground+1.25;look.z=player.z+(gazeZ-player.z)*Math.min(1.6,toward)/toward;
  const interestWeight=interest?.weight||0;
  if(interestWeight){look.x+=(interest.x-look.x)*interestWeight*.55;look.z+=(interest.z-look.z)*interestWeight*.55;look.y+=(interest.y-look.y)*interestWeight*.55;}
  let best=null,bestIndex=-1,bestScore=Infinity;const candidates=this.candidates;this.armAge+=dt;
  for(let index=0;index<candidates.length;index++){
   const candidate=candidates[index],{offset,elevation}=candidate;
   const yaw=this.yaw+offset,back=(portrait?7.5:6.3)+interestWeight*(portrait?12:2.8);
   const pos=candidate.pos;pos.x=player.x-Math.sin(yaw)*back+Math.cos(yaw)*.85;pos.y=ground+elevation+interestWeight*2.4;pos.z=player.z-Math.cos(yaw)*back-Math.sin(yaw)*.85;
   const hidden=blocked(chest,pos,boxes,.2),gazeHidden=blocked(look,pos,boxes,.15);
   const score=(hidden?10000:0)+(gazeHidden?200:0)+Math.abs(offset)*8+(elevation-3.6)*3;
   candidate.score=score;candidate.clear=!hidden&&!gazeHidden;if(score<bestScore){best=candidate;bestIndex=index;bestScore=score;}
  }
  // Hold a safe arm through small score changes. Corrected camera positions must
  // never feed back into candidate scoring: that creates the orbit/retract loop.
  const retained=candidates[this.selectedIndex];
  if(retained?.clear&&(this.armAge<.85||retained.score<=bestScore+5)){best=retained;bestIndex=this.selectedIndex;}
  if(!retained||best.offset!==retained.offset||best.elevation!==retained.elevation)this.armAge=0;
  this.selectedArm=best;this.selectedIndex=bestIndex;
  const pos=this._position;mix(pos,this.position||best.pos,best.pos,this.position&&!instant?1-Math.exp(-5*dt):1);
  // During the orbit, shorten the camera arm before it can pass through a wall.
  let closest=1;for(const box of boxes){const t=segmentBox(chest,pos,box,.22);if(t!==null)closest=Math.min(closest,t);}
  if(closest<1){const arm=distance(chest,pos);mix(pos,chest,pos,Math.max(0,closest-.3/arm));}
  if(distance(pos,chest)<1.7){
   const raised=this.raised;raised.x=player.x;raised.y=ground+7.8;raised.z=player.z+.1;if(!blocked(chest,raised,boxes,.15))mix(pos,raised,raised,1);
  }
  this.position=pos;mix(this._look,this.look||look,look,this.look&&!instant?1-Math.exp(-6*dt):1);this.look=this._look;
  const output=this.output;output.playerVisible=!blocked(chest,pos,boxes,.1);output.aheadVisible=!blocked(look,pos,boxes,.1);output.yaw=this.yaw;output.arm=distance(chest,pos);
  this.lastDiagnostics=output;
  // Runtime borrows this frame until the next update; default callers keep independent snapshots.
  return reuseOutput?output:{...output,position:{...pos},look:{...this.look}};
 }
}
