import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {THREE} from './load-settlement.mjs';
const runtime=process.env.WATCH_GAME_RUNTIME||'/tmp/watch-game-blender-runtime';
const {GLTFLoader}=await import(pathToFileURL(runtime+'/node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const {CompanionCharacter}=await import('../src/companion-character.mjs');
const loader=new GLTFLoader();loader.register(()=>({name:'HEADLESS_TEXTURE',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
for(const variant of ['tall','stocky']){
 const file=new URL(`../assets/shepherd-companion-${variant}.glb`,import.meta.url),data=readFileSync(file);
 assert(data.equals(readFileSync(new URL(`../../../assets/characters/shepherd-companion-${variant}/runtime.glb`,import.meta.url))), 'Independent copy matches library derivative');
 const gltf=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
 assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['preset:idle','preset:run']);
 const parent=new THREE.Group(),character=new CompanionCharacter(parent,variant);await character.load({loadAsync:async()=>gltf});
 let samples=0;
 for(const clip of gltf.animations){
  character.mixer.stopAllAction();character.mixer.clipAction(clip).play();let minFloor=Infinity,maxFloor=-Infinity;
  for(let f=0;f<24;f++){
   character.mixer.setTime(clip.duration*f/24);parent.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();let vertices=0;
   parent.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v);box.expandByPoint(v.applyMatrix4(o.matrixWorld));vertices++;}}});
   assert(vertices>1000);const size=box.getSize(new THREE.Vector3());assert(size.toArray().every(Number.isFinite));assert(size.y>1.2&&size.y<2.2);assert(size.x<2&&size.z<2);
   minFloor=Math.min(minFloor,box.min.y);maxFloor=Math.max(maxFloor,box.min.y);samples++;
  }
  assert(minFloor>-.01&&minFloor<.01,`${variant} ${clip.name}: foot contact ${minFloor}`);assert(maxFloor<.15,'No persistent floating');
 }
 const before=character.mixer.time;character.update(1,{movement:4.6,paused:true});assert.equal(character.mixer.time,before);
 character.update(.2,{movement:4.6,paused:false});assert.equal(character.current,'run');character.update(.2,{movement:0,paused:false});assert.equal(character.current,'idle');
 console.log(`${variant}: skinning and bounds checked across ${samples} motion samples; idle/run and pause passed.`);
}
