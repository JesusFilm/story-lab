export const DIFFICULTIES={
  easy:{label:'Easy',map:'full',route:true,description:'Full map + the route from the start.'},
  medium:{label:'Medium',map:'full',route:false,description:'Full map. Reveal a route if you need help finishing.'},
  maximum:{label:'Maximum',map:'local',route:false,description:'Only nearby corridors. Trust your memory and footprints.'}
};
export const LOCAL_RADIUS=12;
export class RunSession {
  constructor(difficulty='medium'){this.reset(difficulty);}
  reset(difficulty){
    if(!DIFFICULTIES[difficulty])throw new Error('Unknown difficulty');
    this.difficulty=difficulty;this.routeVisible=DIFFICULTIES[difficulty].route;
    this.routeSource=this.routeVisible?'difficulty':null;this.revealPending=false;
    this.mapUsed=false;this.earnedDiscoveries=[];
  }
  get config(){return DIFFICULTIES[this.difficulty];}
  requestRoute(){if(this.routeVisible)return false;this.revealPending=true;return true;}
  cancelRoute(){this.revealPending=false;}
  confirmRoute(){
    if(!this.revealPending)return false;
    this.routeVisible=true;this.routeSource='requested';this.revealPending=false;return true;
  }
  result(){return {difficulty:this.difficulty,completionType:this.routeVisible?'guided':this.mapUsed?'map-assisted':'unassisted',
    routeSource:this.routeSource,mapUsed:this.mapUsed,challengeCompletionEligible:!this.routeVisible,
    earnedDiscoveries:[...this.earnedDiscoveries]};}
}
// The same visibility rule clips terrain, trail, route, and markers in the local map.
export function visibleOnMap(session,player,point){return session.config.map==='full'||Math.hypot(player.x-point.x,player.z-point.z)<=LOCAL_RADIUS;}
