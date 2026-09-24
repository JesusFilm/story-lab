import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=new URL('../../',import.meta.url),manifest=JSON.parse(await fs.readFile(new URL('assets/quality/sources.json',root)));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);let models=0,images=0;
for(const [tier,entries] of Object.entries(manifest.tiers))for(const [source,entry] of Object.entries(entries)){
 const original=await fs.readFile(new URL(source,root));assert.equal(createHash('sha256').update(original).digest('hex'),manifest.sources[source].sha256);
 const data=await fs.readFile(new URL(entry.url,root));assert.equal(data.length,entry.bytes);
 if(!entry.url.endsWith('.glb')){const image=await sharp(data).metadata();assert.equal(image.format,'webp');assert(Math.max(image.width,image.height)<=(tier==='minimal'?768:1024),source+' illustration cap');images++;continue;}
 const doc=await io.readBinary(data),before=await io.read(new URL(source,root).pathname);
 assert.deepEqual(doc.getRoot().listAnimations().map(a=>a.getName()),before.getRoot().listAnimations().map(a=>a.getName()),source+' animation names');
 assert.equal(doc.getRoot().listSkins().length,before.getRoot().listSkins().length,source+' skins');
 for(const t of doc.getRoot().listTextures())assert(Math.max(...t.getSize())<=(tier==='minimal'?256:512),source+' texture cap');
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const positions=p.getAttribute('POSITION');assert(positions&&positions.getCount()>0,source+' positions');for(const n of positions.getArray())assert(Number.isFinite(n),source+' finite');
  if(p.getIndices())for(const i of p.getIndices().getArray())assert(i<positions.getCount(),source+' index range');
 }
 models++;
}
console.log(`PASS: ${models} self-contained GLBs, ${images} illustration variants; source hashes, bytes, texture caps, animation names, skins and geometry ranges.`);
