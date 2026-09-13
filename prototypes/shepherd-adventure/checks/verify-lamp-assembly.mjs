import assert from 'node:assert/strict';
import {RouteRehearsal} from '../src/rehearsal-route.mjs';
import {LAMP_STEPS} from '../src/lamp-assembly.mjs';
const j=new RouteRehearsal();j.jump(0);
assert.equal(j.next(),false,'Cannot leave scene 01 with an unfinished lamp');
assert.equal(j.assembleLamp('body'),false,'Preparation must be opened deliberately');
j.lampAssembly.begin();
for(const step of LAMP_STEPS){
 assert.equal(j.assembleLamp('invalid'),false);assert.equal(j.takeLamp(),false);
 j.paused=true;const before=j.snapshot();assert.equal(j.assembleLamp(step.id),false);assert.deepEqual(j.snapshot(),before);j.paused=false;
 assert(j.assembleLamp(step.id));assert.equal(j.assembleLamp(step.id),false,'Duplicate action cannot skip the next item');
 j.lampAssembly.open=false;assert.equal(j.takeLamp(),false);j.lampAssembly.begin();
 assert.equal(j.lantern,false,'Lighting and collection are separate');
}
assert(j.lampAssembly.lit);assert(j.takeLamp());assert.equal(j.takeLamp(),false);assert(j.lantern);assert(j.next());
while(j.travel)j.step(1/60);assert.equal(j.index,1);assert(j.lantern);
j.jump(0);assert.equal(j.lampAssembly.step,0);assert.equal(j.lantern,false);
j.jump(8);assert(j.lampAssembly.taken);assert(j.lantern);assert(j.gateOpen);
j.replay();assert(j.lampAssembly.taken);j.reset();assert.deepEqual(j.snapshot(),new RouteRehearsal().snapshot());
console.log('PASS: ordered preparation, pause/back/resume, duplicate protection, departure gating, one award, deterministic review reconstruction.');
