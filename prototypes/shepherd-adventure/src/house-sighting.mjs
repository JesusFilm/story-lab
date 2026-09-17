// House 3: one knock followed by a player-paced, authored village exchange.
export class HouseSighting {
 constructor(pageCount=4){this.pageCount=pageCount;this.started=false;this.elapsed=0;this.page=0;this.complete=false;}
 knock(){if(this.started)return false;this.started=true;return true;}
 tick(dt){if(this.started&&Number.isFinite(dt)&&dt>0)this.elapsed=Math.min(3,this.elapsed+dt);}
 get phase(){return !this.started?'ready':this.elapsed<1.9?'knocking':this.elapsed<3?'waiting':this.complete?'complete':'conversation';}
 get approach(){if(!this.started)return 0;const t=Math.min(1,this.elapsed/.55,Math.max(0,(3-this.elapsed)/.8));return t*t*(3-2*t);}
 advance(){if(this.phase!=='conversation')return false;if(this.page<this.pageCount-1)this.page++;else this.complete=true;return true;}
 snapshot(){return {started:this.started,elapsed:this.elapsed,page:this.page,phase:this.phase,complete:this.complete};}
}
