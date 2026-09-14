// Point 08 owns its two deliberate actions; timing never advances the route.
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export class EmptyStall{
 constructor(){this.phase='search';this.elapsed=0;this.lit=false;this.open=false;}
 act(){const next={light:'lighting',gate:'opening'}[this.phase];if(!next)return false;this.phase=next;this.elapsed=0;return true;}
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  this.elapsed+=dt;
  if(this.phase==='search'&&this.elapsed>=3.5){this.phase='light';this.elapsed=0;}
  if(this.phase==='lighting'){
   if(this.elapsed>=2.7)this.lit=true;
   if(this.elapsed>=4.5){this.phase='gate';this.elapsed=0;}
  }
  if(this.phase==='opening'){
   if(this.elapsed>=2.4)this.open=true;
   if(this.elapsed>=4.8){this.phase='look';this.elapsed=0;}
  }
  if(this.phase==='look'&&this.elapsed>=3){this.phase='reveal';this.elapsed=0;}
  if(this.phase==='reveal'&&this.elapsed>=2.5){this.phase='house';this.elapsed=0;}
 }
 get complete(){return this.phase==='house';}
 get offset(){
  if(this.phase==='lighting'){const a=smooth(this.elapsed/1.2);return {x:.85*a,z:2.08*a};}
  if(this.phase==='gate')return {x:.85,z:2.08};
  if(this.phase==='opening'){const a=smooth(this.elapsed/.8),back=smooth((this.elapsed-1.8)/1.1);return {x:(.85-.15*a)*(1-back),z:(2.08-.23*a)*(1-back)};}
  return {x:0,z:0};
 }
 snapshot(){return {phase:this.phase,elapsed:this.elapsed,lit:this.lit,open:this.open,complete:this.complete};}
}
