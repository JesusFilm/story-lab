// Shared offline loader for actual runtime geometry; omit image decoding in Node.
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export const clips=JSON.parse(fs.readFileSync(new URL('../public/models-v2/motions.json',import.meta.url),'utf8')).map((c:Parameters<typeof THREE.AnimationClip.parse>[0])=>THREE.AnimationClip.parse(c));
export async function model(name:string){
 const b=fs.readFileSync(new URL(`../public/models-v2/${name}.glb`,import.meta.url)),len=new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(12,true),doc=JSON.parse(b.subarray(20,20+len).toString());
 // Load the real mesh, skeleton and morph data without browser-only image decoding.
 doc.materials=doc.materials.map((m:{name:string})=>({name:m.name,pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:1}}));delete doc.textures;delete doc.images;
 let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=b.subarray(20+len),header=Buffer.from(b.subarray(0,20));header.writeUInt32LE(20+json.length+bin.length,8);header.writeUInt32LE(json.length,12);const data=Buffer.concat([header,json,bin]);
 return(await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'')).scene;
}
