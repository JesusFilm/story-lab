// House 5: two attempts, then an explicit search and an explicit departure.
export const SEARCH_POINTS=[{x:18,z:7.5},{x:16.8,z:7},{x:16.3,z:5},{x:16.5,z:2},{x:19,z:3}];
export class HouseTracks {
 constructor(){this.started=false;this.elapsed=0;this.searchDistance=0;this.searchStarted=false;this.spotted=false;}
 knock(){if(this.started)return false;this.started=true;return true;}
 tick(dt){if(this.started&&Number.isFinite(dt)&&dt>0)this.elapsed=Math.min(7.2,this.elapsed+dt);}
 lookAround(){if(this.phase!=='unanswered')return false;this.searchStarted=true;return true;}
 get knockElapsed(){return this.elapsed<4?this.elapsed:this.elapsed-4;}
 get knockRound(){return this.elapsed<4?0:1;}
 get phase(){return !this.started?'ready':this.elapsed<1.9?'knocking':this.elapsed<4?'waiting':this.elapsed<5.9?'knocking-again':this.elapsed<7.2?'waiting-again':this.spotted?'spotted':this.searchStarted?'searching':'unanswered';}
 get approach(){if(!this.started)return 0;const t=Math.min(1,this.elapsed/.55,Math.max(0,(7.2-this.elapsed)/.8));return t*t*(3-2*t);}
 get complete(){return this.spotted;}
 snapshot(){return {started:this.started,elapsed:this.elapsed,phase:this.phase,searchDistance:this.searchDistance,spotted:this.spotted,complete:this.complete};}
}
