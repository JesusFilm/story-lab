// Load the real world and local GLBs without a browser; textures are reviewed in Blender.
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';
const runtime=process.env.WATCH_GAME_RUNTIME||'/tmp/watch-game-blender-runtime';
register('data:text/javascript,'+encodeURIComponent(`import {pathToFileURL} from 'node:url';export async function resolve(s,c,next){if(s==='three')return next(pathToFileURL(${JSON.stringify(runtime)}+'/node_modules/three/build/three.module.js').href,c);return next(s,c);}`));
export const THREE=await import('three');
globalThis.ProgressEvent??=class ProgressEvent{constructor(type,init={}){this.type=type;Object.assign(this,init);}};
const {GLTFLoader}=await import(pathToFileURL(runtime+'/node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const {createJourneyWorld}=await import('../src/journey-world.mjs');
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},beginPath(){},ellipse(){},fill(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
export async function loadSettlement(options){
 const loader=new GLTFLoader();
 loader.register(()=>({name:'HEADLESS_TEXTURE_PLACEHOLDER',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
 const scene=new THREE.Scene(),world=createJourneyWorld(scene,options);
 await world.dress({async loadAsync(url){
  const file=new URL('..'+url,import.meta.url),data=await readFile(file);
  if(url.endsWith('.gltf')){
   const json=JSON.parse(data);
   for(const buffer of json.buffers||[])if(buffer.uri&&!buffer.uri.startsWith('data:'))buffer.uri='data:application/octet-stream;base64,'+(await readFile(new URL(buffer.uri,file))).toString('base64');
   return loader.parseAsync(JSON.stringify(json),'');
  }
  return loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
 }});
 scene.updateMatrixWorld(true);return {scene,world};
}
