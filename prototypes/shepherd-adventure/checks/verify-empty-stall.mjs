import assert from 'node:assert/strict';
import {RouteRehearsal,STOPS} from '../src/rehearsal-route.mjs';
const j=new RouteRehearsal();j.jump(7);
assert(!j.next());assert(!j.actAtStall());assert(!j.gateLit);assert(!j.gateOpen);
j.step(3.5);assert(j.actAtStall());assert(!j.actAtStall());j.step(2.6);assert(!j.gateLit);j.step(.2);assert(j.gateLit);assert(!j.gateOpen);
j.paused=true;const held=j.snapshot();j.step(10);assert.deepEqual(j.snapshot(),held);assert(!j.actAtStall());j.paused=false;
j.step(2);assert.equal(j.emptyStall.phase,'gate');assert(!j.next());assert(j.actAtStall());assert(!j.actAtStall());j.step(2.3);assert(!j.gateOpen);j.step(.2);assert(j.gateOpen);j.step(3);assert.equal(j.emptyStall.phase,'look');assert(!j.next());j.step(3);assert(!j.next());j.step(2.5);assert.equal(j.emptyStall.phase,'house');assert.equal(j.position.x,STOPS[7].anchor.x);assert.equal(j.position.z,STOPS[7].anchor.z);assert(j.next());while(j.travel)j.step(.1);assert.equal(j.index,8);assert(j.gateLit&&j.gateOpen);
j.jump(7);assert(!j.gateLit&&!j.gateOpen);j.step(3.5);j.actAtStall();j.step(3);j.replay();while(j.travel)j.step(.1);assert.equal(j.emptyStall.phase,'search');assert(!j.gateLit&&!j.gateOpen);
j.jump(8);assert(j.gateLit&&j.gateOpen);j.jump(3);assert(!j.gateLit&&!j.gateOpen);j.reset();assert(!j.gateLit&&!j.gateOpen);
console.log('Empty stall: ordered actions, duplicate input, delayed outcomes, pause, route lock, House 9 arrival, replay, staged outcomes and reset passed.');

// Include the new close approach, which is outside the unchanged route corridor.
const {readFileSync}=await import('node:fs');
const map=JSON.parse(readFileSync(new URL('../map/rehearsal-layout.json',import.meta.url)));
const approach=new RouteRehearsal();approach.jump(7);let minimum=Infinity;
for(let i=0;i<400;i++){
 if(['light','gate'].includes(approach.emptyStall.phase))approach.actAtStall();approach.step(.05);
 for(const w of map.walls){const p=approach.position,dx=w.b.x-w.a.x,dz=w.b.z-w.a.z,t=Math.max(0,Math.min(1,((p.x-w.a.x)*dx+(p.z-w.a.z)*dz)/(dx*dx+dz*dz)));minimum=Math.min(minimum,Math.hypot(p.x-w.a.x-t*dx,p.z-w.a.z-t*dz)-w.width/2);}
}
assert(minimum>=.45,`Gate action needs wall clearance: ${minimum}`);
console.log(`Gate interaction minimum wall clearance: ${minimum.toFixed(3)} m.`);
