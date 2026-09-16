// Point 02 only. All timing uses active simulation time, including pause/replay.
export const KNOCK_TIMES=[.85,1.2,1.55];
export const HOUSE_TIMING={light:2.5,voice:3.3,dark:5.9,complete:6.7};
export class HouseRejection{
 constructor(){this.reset();}
 reset(){this.started=false;this.elapsed=0;}
 knock(){if(this.started)return false;this.started=true;return true;}
 tick(dt){if(this.started&&Number.isFinite(dt)&&dt>0)this.elapsed=Math.min(HOUSE_TIMING.complete,this.elapsed+dt);}
 get phase(){return !this.started?'ready':this.elapsed<1.9?'knocking':this.elapsed<2.5?'waiting':this.elapsed<3.3?'waking':this.elapsed<5.9?'refusal':this.elapsed<6.7?'dark':'complete';}
 get approach(){if(!this.started)return 0;const t=Math.min(1,this.elapsed/.55,Math.max(0,(HOUSE_TIMING.complete-this.elapsed)/.8));return t*t*(3-2*t);}
 get lit(){return this.started&&this.elapsed>=HOUSE_TIMING.light&&this.elapsed<HOUSE_TIMING.dark;}
 get complete(){return this.phase==='complete';}
 snapshot(){return {started:this.started,elapsed:this.elapsed,phase:this.phase,lit:this.lit,complete:this.complete};}
}
