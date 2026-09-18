import assert from 'node:assert/strict';
import {createNightAmbience,crossfadeLoop} from '../src/night-ambience.mjs';
const buffer=(channels=1,length=2000,sampleRate=1000)=>{
 const data=Array.from({length:channels},()=>Float32Array.from({length},(_,i)=>Math.sin(i*.12)));
 return {numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,getChannelData:c=>data[c]};
};
const node=()=>({gain:{value:0,setTargetAtTime(){}},connect(){return this;},disconnect(){},start(){},stop(){}});
const context={state:'running',currentTime:0,createGain:node,createBufferSource:node,createBuffer:buffer};
const audio=createNightAmbience(context,node(),{load:async()=>buffer(),random:()=>.5});
await audio.ready;
const run=(seconds,environment)=>{for(let i=0;i<seconds*10;i++)audio.update(.1,environment);};
for(let point=0;point<10;point++)run(20,{point,position:{x:0,z:0}});
assert.deepEqual(audio.getState().counts,{sheep:5,jackal:1,wolf:1,frog:0});
for(let point=0;point<10;point++)run(10,{point});
assert.deepEqual(audio.getState().counts,{sheep:5,jackal:1,wolf:1,frog:0},'Revisiting a point must not replay wildlife events');
run(120,{point:9});assert.equal(audio.getState().counts.sheep,5);
run(3,{position:{x:0,z:0},lights:[]});const dark=audio.getState().levels.crickets;
run(3,{position:{x:0,z:0},lights:[{x:0,z:0}]});assert(audio.getState().levels.crickets<dark*.01);
const house={id:3,x:0,z:0,open:false};
run(3,{position:{x:1,z:0},houses:[house]});const close=audio.getState().levels['house-3'];
run(3,{position:{x:8,z:0},houses:[house]});assert(audio.getState().levels['house-3']<close);
house.open=true;run(3,{position:{x:1,z:0},houses:[house]});assert(audio.getState().levels['house-3']<.001);
house.open=false;run(3,{position:{x:1,z:0},houses:[house]});assert(audio.getState().levels['house-3']>.1);
run(120,{position:{x:0,z:0},well:{x:0,z:0}});assert.equal(audio.getState().counts.frog,3);
context.state='suspended';const before=audio.getState();run(100,{point:0});assert.deepEqual(audio.getState(),before);
context.state='running';audio.reset();assert.equal(audio.getState().counts.sheep,0);run(3,{point:0});assert.equal(audio.getState().counts.sheep,1);run(3,{position:{x:0,z:0},houses:[3,8,9].map(id=>({id,x:0,z:0,open:false}))});
assert.deepEqual(audio.getState().houseTracks,{'house-3':'voices','house-8':'women','house-9':'family'});
audio.stop();
console.log('PASS recorded ambience: five bleats, one jackal and one wolf, light falloff, house door/proximity, frog cadence, pause and reset.');
const warn=console.warn;console.warn=()=>{};
const partial=createNightAmbience(context,node(),{load:async(_context,key)=>{if(key==='sheep')throw Error('test missing asset');return buffer();},random:()=>.5});
await partial.ready;console.warn=warn;
partial.update(2,{point:0});partial.update(2,{point:3});partial.update(2,{point:3});
assert.equal(partial.getState().counts.jackal,1,'Unavailable sheep must not block jackal playback');
assert.deepEqual(partial.getState().failures,['sheep']);partial.stop();
console.log('PASS missing recording does not block other route calls.');

const input=buffer(2,10000,1000),looped=crossfadeLoop(context,input,2);
assert.equal(looped.length,8000);
for(let c=0;c<2;c++){
 const a=input.getChannelData(c),b=looped.getChannelData(c);
 assert.equal(b[0],a[2000]);assert.equal(b.at(-1),a[1999]);
 assert.equal(b[6000],a[8000]);
 assert(b.every(Number.isFinite));
}
console.log('PASS loop join restores adjacent original samples, with a two-second overlap on every channel.');
