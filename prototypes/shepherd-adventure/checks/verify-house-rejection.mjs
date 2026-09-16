import assert from 'node:assert/strict';
import {RouteRehearsal} from '../src/rehearsal-route.mjs';
const j=new RouteRehearsal();assert.equal(j.knockOnHouse(),false);j.jump(1);
assert.equal(j.next(),false);assert(j.knockOnHouse());assert.equal(j.knockOnHouse(),false);
j.step(2.6);assert(j.houseRejection.lit);j.paused=true;const held=j.snapshot();j.step(10);assert.deepEqual(j.snapshot(),held);assert.equal(j.next(),false);
j.paused=false;j.step(3.4);assert.equal(j.houseRejection.lit,false);assert.equal(j.next(),false);j.step(.8);assert(j.houseRejection.complete);assert(j.next());assert.equal(j.next(),false);
while(j.travel)j.step(.1);assert.equal(j.index,2);assert.equal(j.houseSighting.phase,'ready');assert.equal(j.next(),false,'House 3 requires its own exchange');
j.jump(1);assert.equal(j.houseRejection.phase,'ready');j.knockOnHouse();j.step(3);j.replay();assert.equal(j.houseRejection.phase,'ready');while(j.travel)j.step(.1);assert.equal(j.index,1);assert.equal(j.houseRejection.phase,'ready');j.reset();assert.equal(j.houseRejection.phase,'ready');
console.log('PASS: action gating, one knock, active-time timing, pause, dark-before-departure, House 3 handoff, jump/replay/reset.');
