export const TUG_TIMES=[1.1,1.85];
export class BarredGate{
 constructor(){this.started=false;this.elapsed=0;}
 begin(){if(this.started)return false;this.started=true;return true;}
 tick(dt){if(this.started&&Number.isFinite(dt)&&dt>0)this.elapsed=Math.min(5.7,this.elapsed+dt);}
 get phase(){return !this.started?'ready':this.elapsed<2.8?'trying':this.elapsed<5.7?'barred':'complete';}
 get complete(){return this.phase==='complete';}
 get approach(){if(!this.started)return 0;const t=Math.max(0,Math.min(1,this.elapsed/.65,(3.3-this.elapsed)/.65));return t*t*(3-2*t);}
 snapshot(){return {started:this.started,elapsed:this.elapsed,phase:this.phase,complete:this.complete};}
}
