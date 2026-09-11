import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const threeURL=pathToFileURL((process.env.WATCH_GAME_RUNTIME||'/tmp/watch-game-blender-runtime')+'/node_modules/three/build/three.module.js').href;
const THREE=await import(threeURL);
const source=(await readFile(new URL('../src/character-variants.mjs',import.meta.url),'utf8')).replace("from 'three'",`from ${JSON.stringify(threeURL)}`);
const {CharacterVariants}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const character=new CharacterVariants(new THREE.Group()),model=new THREE.Group();model.position.y=10;
const mixer=new THREE.AnimationMixer(model),actions={};
for(const name of ['idle','walk','run','turn','lookAround'])actions[name]=mixer.clipAction(new THREE.AnimationClip(name,2,[new THREE.NumberKeyframeTrack('.position[y]',[0,2],[0,0])]));
character.tripo={model,mixer,actions,current:null,idleSeconds:0,lookAroundPlayed:false,lastPhase:null};
character.playTripo('idle');actions.idle.setEffectiveWeight(1);mixer.update(0);
function frame(phase,movement=0,gait='walk'){
 character.updateTripo(1/60,{phase,gait},movement,false);
 assert.ok(Math.abs(model.position.y)<1e-8,`Bind pose leaked: y=${model.position.y}`);
}
for(let i=0;i<260;i++)frame('choice');
assert.equal(character.tripo.current,'lookAround');
const time=actions.lookAround.time;
frame('inspect');assert.ok(actions.lookAround.time>time,'Inspection restarted the active look');
for(let i=0;i<20;i++){frame('travel',3);frame('inspect');frame('travel',4,'run');frame('choice');}
for(let i=0;i<180;i++)frame('inspect');
console.log('Animation transitions: idle look → inspect, rapid interrupted walk/run/look blends, and completed look remain grounded.');
