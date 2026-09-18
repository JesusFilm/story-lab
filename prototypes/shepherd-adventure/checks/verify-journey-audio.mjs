import assert from 'node:assert/strict';

class Param{
 constructor(value=0){this.value=value;}
 setTargetAtTime(value){this.value=value;}
 setValueAtTime(value){this.value=value;}
 linearRampToValueAtTime(value){this.value=value;}
 exponentialRampToValueAtTime(value){this.value=value;}
}
class Node{
 connect(){return this;}
 disconnect(){}
 start(){}
 stop(){}
}
class GainNode extends Node{constructor(){super();this.gain=new Param();}}
class FilterNode extends Node{constructor(){super();this.frequency=new Param();this.Q=new Param();}}
class OscillatorNode extends Node{constructor(){super();this.frequency=new Param();}}
class BufferSourceNode extends Node{constructor(){super();this.onended=null;}}
class FakeAudioContext{
 static instances=[];
 constructor(){this.sampleRate=1000;this.currentTime=0;this.state='suspended';this.destination=new Node();this.sources=0;this.oscillators=0;FakeAudioContext.instances.push(this);}
 createGain(){return new GainNode();}
 createBiquadFilter(){return new FilterNode();}
 createOscillator(){this.sources++;this.oscillators++;return new OscillatorNode();}
 createBufferSource(){this.sources++;return new BufferSourceNode();}
 createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
 resume(){this.state='running';return Promise.resolve();}
 suspend(){this.state='suspended';return Promise.resolve();}
 close(){this.state='closed';return Promise.resolve();}
}

globalThis.AudioContext=FakeAudioContext;
const {createGameplayAudio}=await import('../src/journey-audio.mjs');
const changes=[];
const audio=createGameplayAudio({loadRecording:async()=>({duration:2}),onChange:state=>changes.push(state)});
assert.equal(audio.getState().started,false);
assert.equal(audio.getState().muted,false);

audio.begin();
await Promise.resolve();
await Promise.resolve();
assert.equal(audio.getState().started,true);
assert.equal(audio.getState().running,true);

const context=FakeAudioContext.instances[0];
const beforeSteps=context.sources;
audio.update(2,{movement:4.6,active:true,position:{x:0,z:50}});
assert(context.sources>beforeSteps,'Running movement should schedule footsteps');
assert(audio.getState().night.levels.crickets>0,'A quiet night bed should schedule crickets');
assert.equal(context.oscillators,0,'Crickets should use filtered noise rather than a clean electronic oscillator');
const beforeCue=context.sources;
audio.cue();
assert(context.sources>beforeCue,'A decision should schedule one cue');
audio.update(5,{movement:0,active:true,position:{x:25,z:-26},environment:{point:5}});
audio.update(2,{environment:{point:5}});
assert(audio.getState().night.counts.sheep>=1,'A nearby animal source should schedule a sheep sound');
audio.update(5,{movement:0,active:true,position:{x:5.8,z:-20.1}});
assert.equal(context.oscillators,0,'Recorded ambience must not play the rejected oscillator voices');

audio.ignite();assert.equal(audio.getState().events.ignitions,1);
audio.setMuted(true);
await Promise.resolve();
assert.equal(audio.getState().muted,true);
assert.equal(audio.getState().contextState,'suspended');
const mutedSources=context.sources;
audio.update(2,{movement:4.6,active:true,position:{x:25,z:-26}});
assert.equal(context.sources,mutedSources,'Muted gameplay should schedule no new sound');

audio.setMuted(false);
await Promise.resolve();
assert.equal(audio.getState().muted,false);
assert.equal(audio.getState().contextState,'running');
audio.setActive(false);
await Promise.resolve();
assert.equal(audio.getState().contextState,'suspended');
audio.stop();
assert.equal(audio.getState().contextState,'closed');
assert(changes.length>=4,'Audio state changes should be observable by the UI control');
console.log('PASS gameplay audio owner: start, footsteps, decision cue, mute, pause and stop.');

const group=createGameplayAudio({loadRecording:async()=>({duration:2})});group.begin();await Promise.resolve();await Promise.resolve();
const strikes=[[],[],[]];let prior=[0,0,0];
for(let frame=0;frame<120;frame++){
 group.update(1/60,{movement:3.8,companions:[3.8,3.8]});
 const counts=group.getState().walkers.map(w=>w.steps);
 counts.forEach((count,i)=>{if(count>prior[i])strikes[i].push(frame);});prior=counts;
}
assert(strikes.every(frames=>frames.length>=4),'All three runners need independent footsteps');
assert.equal(new Set(strikes.map(frames=>frames[0])).size,3,'Initial footfalls must be staggered');
const stopped=group.getState().walkers.map(w=>w.steps);
group.update(.1,{movement:0,companions:[4.6,4.6]});
assert.equal(group.getState().walkers[0].steps,stopped[0],'Stationary player must not sound while companions run');
group.setMuted(true);group.update(1,{movement:4.6,companions:[4.6,4.6]});
const muted=group.getState().walkers.map(w=>w.steps);
group.update(1,{movement:4.6,companions:[4.6,4.6]});
assert.deepEqual(group.getState().walkers.map(w=>w.steps),muted);
group.stop();
console.log('PASS three independent staggered runners, stationary player and group mute.');
