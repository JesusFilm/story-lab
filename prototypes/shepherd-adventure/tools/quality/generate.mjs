// Reproducible derivatives of reviewed local assets. No runtime geometry decoder.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,prune,resample,dedup} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),repo=path.resolve(root,'../..');
const publication=JSON.parse(await fs.readFile(path.join(repo,'projects/portal/publication.json')));
const published=publication.prototypes.find(p=>p.slug==='shepherd-adventure').files;
const files=published.filter(f=>/\.(glb|gltf)$/.test(f)&&!f.includes('/quality/'));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);await MeshoptSimplifier.ready;
const tiers={minimal:{size:256,ratio:.08,error:.01},low:{size:512,ratio:.25,error:.004}};
const manifest={version:1,tiers:{},sources:{}};
function inventory(doc){let vertices=0,triangles=0,textureRGBA=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){vertices+=p.getAttribute('POSITION')?.getCount()||0;triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION')?.getCount()||0)/3;}for(const t of doc.getRoot().listTextures()){const s=t.getSize();if(s)textureRGBA+=s[0]*s[1]*4*4/3;}return {vertices,triangles,textureRGBA};}
for(const [tier,settings] of Object.entries(tiers)){
 const entries={};manifest.tiers[tier]=entries;
 for(const file of files){
  const rel=file.split('shepherd-adventure/')[1],source=path.join(repo,file),outRel=`assets/quality/${tier}/${rel.slice(7).replace(/\.gltf$/,'.glb')}`,out=path.join(root,outRel);
  const doc=await io.read(source),before=inventory(doc);
  // Dense generated static props have disconnected UV islands. Fall back to
  // spatial clustering only for unskinned meshes; preserve authored skinning.
  const simplifier=doc.getRoot().listSkins().length?MeshoptSimplifier:{...MeshoptSimplifier,simplify(indices,positions,stride,target,error,flags){
   const result=MeshoptSimplifier.simplify(indices,positions,stride,target,error,flags);
   return result[0].length>target*2?MeshoptSimplifier.simplifySloppy(indices,positions,stride,null,target,tier==='minimal'?.025:.012):result;
  }};
  // Preserve rigs, clip names, node names and material identity used by scenes.
  await doc.transform(weld(),simplify({simplifier,ratio:rel.endsWith("low-wall-perimeter.glb")?(tier==="minimal"?.015:.04):settings.ratio,error:rel.endsWith("low-wall-perimeter.glb")?.03:settings.error}),resample());
  if(tier==='minimal')for(const m of doc.getRoot().listMaterials()){m.setNormalTexture(null);m.setOcclusionTexture(null);m.setMetallicRoughnessTexture(null);}
  await doc.transform(prune({keepAttributes:true,keepLeaves:true}),dedup());
  for(const texture of doc.getRoot().listTextures()){
   const input=texture.getImage();if(!input)continue;
   const alpha=(await sharp(input).metadata()).hasAlpha;
   const encoder=sharp(input).resize({width:settings.size,height:settings.size,fit:'inside',withoutEnlargement:true});
   const data=await (alpha?encoder.png({compressionLevel:9}):encoder.jpeg({quality:tier==='minimal'?68:78})).toBuffer();
   texture.setImage(data).setMimeType(alpha?'image/png':'image/jpeg').setURI('');
  }
  await fs.mkdir(path.dirname(out),{recursive:true});await io.write(out,doc);
  entries[rel]={url:outRel,bytes:(await fs.stat(out)).size,...inventory(doc)};
  manifest.sources[rel]={sha256:createHash('sha256').update(await fs.readFile(source)).digest('hex'),bytes:(await fs.stat(source)).size,...before};
  console.log(tier,rel,entries[rel].bytes,before.triangles,'->',entries[rel].triangles);
 }
 for(const file of published.filter(f=>/\/assets\/.*\.(png|jpe?g)$/.test(f)&&!f.includes('/quality/'))){
  const rel=file.split('shepherd-adventure/')[1],outRel=`assets/quality/${tier}/${rel.slice(7).replace(/\.(png|jpe?g)$/,'.webp')}`,out=path.join(root,outRel),source=path.join(repo,file);
  await fs.mkdir(path.dirname(out),{recursive:true});await sharp(source).resize({width:tier==='minimal'?768:1024,height:tier==='minimal'?768:1024,fit:'inside',withoutEnlargement:true}).webp({quality:tier==='minimal'?65:78}).toFile(out);
  entries[rel]={url:outRel,bytes:(await fs.stat(out)).size};
  manifest.sources[rel]={bytes:(await fs.stat(source)).size,sha256:createHash('sha256').update(await fs.readFile(source)).digest('hex')};
 }
}
await fs.writeFile(path.join(root,'assets/quality/sources.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(root,'src/quality-assets.js'),'window.shepherdAssetVariants='+JSON.stringify(Object.fromEntries(Object.entries(manifest.tiers).map(([t,e])=>[t,Object.fromEntries(Object.entries(e).map(([s,v])=>[s,v.url]))])))+';\n');
