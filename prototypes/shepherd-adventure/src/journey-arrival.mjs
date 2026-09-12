import {blendFrame} from './journey-presentation.mjs';
import {height} from './journey-terrain.mjs';
export const ARRIVAL_DURATION=6;
export const ARRIVAL_POSITIONS=[{x:-28,z:-72},{x:-28,z:-74.2},{x:-28,z:-69.8}];
export const ARRIVAL_HEADING=-Math.PI/2;
export function arrivalFrame(from,elapsed,reduced=false){
 const p=ARRIVAL_POSITIONS[0];
 const to={position:{x:p.x-.35,y:height(p.x,p.z)+1.62,z:p.z},look:{x:-33.9,y:height(-33,-73)+1,z:-73}};
 if(reduced)return to;
 // Settle behind his west-facing shoulder before moving to eye level,
 // avoiding the companion standing south of the player.
 const shoulder={position:{x:p.x+5,y:height(p.x,p.z)+2.7,z:p.z},look:to.look};
 const t=Math.max(0,Math.min(1,elapsed/ARRIVAL_DURATION));
 return t<.4?blendFrame(from,shoulder,t/.4):blendFrame(shoulder,to,(t-.4)/.6);
}
