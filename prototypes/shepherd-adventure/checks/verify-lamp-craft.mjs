import assert from 'node:assert/strict';
import {LampCraft} from '../src/lamp-craft.mjs';
import {Journey} from '../src/journey-model.mjs';
for(let wick=0;wick<=4;wick++)for(let oil=0;oil<=4;oil++)for(const cap of [false,true]){
 const c=new LampCraft();if(wick){c.act('insert');for(let i=1;i<wick;i++)c.act('raise');}for(let i=0;i<oil;i++)c.act('pour');if(cap)c.act('cap');c.act('spark');assert.equal(c.result,wick===2&&oil===2&&cap?'lit':'failed');assert(!c.act('pour'));c.act('retry');assert.deepEqual(c,new LampCraft());
}
const j=new Journey();j.start();j.at='hearth';j.inspect();assert.equal(j.phase,'craft');assert(!j.finishCraft());for(const action of ['insert','raise','pour','pour','cap','spark'])j.craft.act(action);assert(j.finishCraft());assert(j.lantern);assert(!j.options.some(e=>['wick','oil'].includes(e.to)));j.reset();assert(!j.lantern);assert.equal(j.craft.result,'working');console.log('PASS: all 50 wick/oil/cap combinations, retry, inventory award, reset, single-stall routes.');
