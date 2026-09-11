import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
for (const file of fs.readdirSync(new URL('../public/models/',import.meta.url))) {
 test(`${file}: valid glTF geometry with correct metre scale`,async()=>{
  const buffer=fs.readFileSync(new URL('../public/models/'+file,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
  const box=new Box3().setFromObject(gltf.scene),size=box.getSize(new Vector3());
  assert.ok(Number.isFinite(size.length())&&size.length()>0);
  // The olive root intersects the ground by 10cm to avoid a visible floating base.
  assert.ok(Math.abs(box.min.y)<(file==='olive.glb'?.15:.06));
  if(file.startsWith('listener')||file==='jesus.glb')assert.ok(size.y>=1.65&&size.y<=1.9);
 });
}
