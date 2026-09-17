import assert from 'node:assert/strict';
import {RouteRehearsal,STOPS} from '../src/rehearsal-route.mjs';
const j=new RouteRehearsal();j.jump(2);assert.equal(j.next(),false);assert(j.knockOnHouse());assert.equal(j.knockOnHouse(),false);
j.step(.9);assert.equal(j.houseSighting.phase,'knocking');j.paused=true;const held=j.snapshot();j.step(4);assert.deepEqual(j.snapshot(),held);assert.equal(j.advanceSighting(),false);
j.paused=false;j.step(2.1);assert.equal(j.houseSighting.phase,'conversation');assert.deepEqual({x:j.position.x,z:j.position.z},STOPS[2].anchor);
j.step(100);assert.equal(j.houseSighting.page,0,'Reading is player-paced');assert.equal(j.next(),false);
for(let i=0;i<2;i++){assert(j.advanceSighting());assert.equal(j.next(),false);}
assert(j.advanceSighting());assert(j.houseSighting.complete);assert.equal(j.advanceSighting(),false);assert.equal(j.travel,null);assert(j.next());assert.equal(j.next(),false);while(j.travel)j.step(.1);assert.equal(j.index,3);assert.equal(j.gateOpen,false);
j.jump(2);assert.equal(j.houseSighting.phase,'ready');j.knockOnHouse();j.step(3);j.advanceSighting();j.replay();assert.equal(j.houseSighting.phase,'ready');while(j.travel)j.step(.1);assert.equal(j.index,2);assert.equal(j.houseSighting.page,0);
j.jump(3);assert(j.houseSighting.complete);assert.equal(j.gateOpen,false);j.reset();assert.equal(j.houseSighting.phase,'ready');
console.log('PASS House 3: one knock, pause, held reading, explicit departure, closed gate, replay/jump/reset.');
