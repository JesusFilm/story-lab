import assert from 'node:assert/strict';
import {Journey,NODE,INTRO_DURATION,openingActors,gateApproach,followPlayerRoute} from '../src/journey-model.mjs';
const j=new Journey();
for(let t=0;t<=INTRO_DURATION;t+=.1){const a=openingActors(t);assert(a.followers.every(f=>f.z>a.player.z));assert(a.followers[0].x!==a.followers[1].x);}
j.step(4);assert(j.position.z<90);j.start();assert.equal(j.position.z,NODE.field.z);assert.equal(j.introTime,INTRO_DURATION);
j.at='arch';j.inventory.add('lantern');j.inspect();let watched=false,hold;
for(let i=0;i<4000&&j.phase==='gate-sequence';i++){
 j.step(.05);assert.notEqual(j.gateSequence?.stage,'return');
 if(j.gateSequence?.stage==='watch'){watched=true;hold??=j.position;assert.deepEqual(j.position,hold);assert(j.gateOpen);}
}
assert(watched);assert.deepEqual(j.position,hold);assert(j.awaitingFollow);assert.equal(j.options.length,1);assert.equal(j.choice.name,'follow the others');assert.equal(j.inspect(),false);
assert(Math.hypot(hold.x-gateApproach().at(-1).x,hold.z-gateApproach().at(-1).z)<.001);
assert.equal(j.commit(),true);assert.deepEqual(j.travel.points,followPlayerRoute());assert(Math.hypot(j.position.x-hold.x,j.position.z-hold.z)<.001);
j.paused=true;const before=j.snapshot();j.step(3);assert.deepEqual(j.snapshot(),before);j.paused=false;
let walkingSeconds=0;
for(let i=0;i<2000&&j.travel;i++){j.step(.05);if(j.travel){assert(j.travel.speed>=1.99&&j.travel.speed<=4.41);if(j.position.z<-46){assert(j.travel.speed<2.2);walkingSeconds+=.05;}}}
assert(walkingSeconds>10,'Unhurried animal-area approach');
assert.equal(j.at,'goal');assert.equal(j.phase,'arrival');j.reset();assert.equal(j.awaitingFollow,false);assert.equal(j.gateHold,null);assert.equal(j.introTime,0);
console.log('Companion scenes passed: opening order, skip endpoint, stationary gate watch, single follow choice, continuous route, gentle arrival pace, pause and reset.');
