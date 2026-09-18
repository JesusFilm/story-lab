// Reproducible runtime derivatives. Originals remain alongside them and in the asset library.
// npm install --prefix /tmp/shepherd-opt-tools --ignore-scripts @gltf-transform/core@4.2.1 @gltf-transform/functions@4.2.1 meshoptimizer@0.22.0 sharp@0.33.5
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(pathToFileURL((process.env.SHEPHERD_ASSET_TOOLS||'/tmp/shepherd-opt-tools')+'/package.json'));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {weld,simplify,dedup,prune,textureCompress}=require('@gltf-transform/functions');
const {MeshoptSimplifier}=require('meshoptimizer'),sharp=require('sharp');
const root=fileURLToPath(new URL('../',import.meta.url));
const specs=[
 ...['mary-seated-idle','joseph-seated-idle','jesus-manger-tripo'].map(n=>({path:`assets/${n}.glb`,size:2048})),
 ...['olive-wall-cluster-a','olive-wall-cluster-b','olive-basket-cluster-a','olive-basket-cluster-b'].map(n=>({path:`assets/house-decorations/${n}.glb`,size:1024,ratio:.3})),
 ...['vegetable-market-stall-pixal3d','pottery-market-stall-pixal3d','tanner-market-stall-pixal3d','limestone-house-annex','straight-feeding-trough'].map(n=>({path:`assets/${n}.glb`,size:1024,ratio:.3})),
 {path:'assets/square-nativity-stall.glb',size:2048,ratio:.4}
];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;await mkdir(root+'assets/optimized',{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
function inventory(doc){return {triangles:doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0),accessorBytes:doc.getRoot().listAccessors().reduce((n,a)=>n+(a.getArray()?.byteLength||0),0),textures:doc.getRoot().listTextures().map(t=>({size:t.getSize(),mime:t.getMimeType()})),animations:doc.getRoot().listAnimations().length};}
const records=[];
for(const spec of specs){
 const src=root+spec.path,output='assets/optimized/'+spec.path.split('/').at(-1),doc=await io.read(src),before=inventory(doc),original=await readFile(src);
 if(spec.ratio)await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:spec.ratio,error:.005,lockBorder:false}),dedup(),prune());
 await doc.transform(textureCompress({encoder:sharp,resize:[spec.size,spec.size]}));
 await io.write(root+output,doc);const optimized=await readFile(root+output);
 records.push({source:spec.path,output,sourceSHA256:sha(original),outputSHA256:sha(optimized),sourceBytes:original.length,outputBytes:optimized.length,settings:{maxTextureSize:spec.size,...(spec.ratio?{simplifyRatio:spec.ratio,error:.005,lockBorder:false}:{geometryUnchanged:true})},before,after:inventory(doc)});
 console.log(spec.path,original.length,'->',optimized.length, 'triangles',before.triangles,'->',records.at(-1).after.triangles);
}
await writeFile(root+'assets/optimized/provenance.json',JSON.stringify({tools:{gltfTransform:'4.2.1',meshoptimizer:'0.22.0',sharp:'0.33.5'},description:'Independent runtime derivatives of prototype-owned assets. Original files and attribution remain unchanged; all animations retained.',assets:records},null,2)+'\n');
