import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';

// Reuse the server's pinned local dependency; do not install into the shared workspace.
const runtime=process.env.WATCH_GAME_RUNTIME||'/tmp/watch-game-blender-runtime';
register('data:text/javascript,'+encodeURIComponent(`import {pathToFileURL} from 'node:url';export async function resolve(s,c,next){if(s==='three')return next(pathToFileURL(${JSON.stringify(runtime)}+'/node_modules/three/build/three.module.js').href,c);return next(s,c);}`));
const THREE=await import('three');
const {GLTFLoader}=await import(pathToFileURL(runtime+'/node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const {createJourneyWorld}=await import('../src/journey-world.mjs');
const {JOURNEY_POI_MODELS,fitJourneyPOI}=await import('../src/journey-poi-models.mjs');
const {Journey}=await import('../src/journey-model.mjs');
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},beginPath(){},ellipse(){},fill(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8766';
globalThis.ProgressEvent??=class ProgressEvent{constructor(type,init={}){this.type=type;Object.assign(this,init);}};
const loader=new GLTFLoader();
// Real GLTF geometry/material definitions; image decoding/rendering is outside this headless check.
loader.register(()=>({name:'HEADLESS_TEXTURE_PLACEHOLDER',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
const fetched=[];
async function loadAsync(url){const res=await fetch(origin+url);assert(res.ok,`${url}: HTTP ${res.status}`);const data=await res.arrayBuffer();fetched.push({url,bytes:data.byteLength});return loader.parseAsync(data,new URL('.',origin+url).href);}
const sources={};for(const [id,spec] of Object.entries(JOURNEY_POI_MODELS)){sources[id]=(await loadAsync(spec.url)).scene;const original=new THREE.Box3().setFromObject(sources[id]);const fitted=fitJourneyPOI(sources[id],spec),bounds=new THREE.Box3().setFromObject(fitted),size=bounds.getSize(new THREE.Vector3());spec.size.forEach((n,i)=>assert(Math.abs(size.toArray()[i]-n)<1e-5));assert(Math.abs(bounds.min.y)<1e-6);assert.deepEqual(new THREE.Box3().setFromObject(sources[id]),original,'Source transform must remain unchanged');}
const scene=new THREE.Scene(),world=createJourneyWorld(scene);await world.dress({loadAsync});
assert.equal(world.modelCount,28,'19 scenery models, two POIs, oil jar, family and five sheep');
assert(world.wallSegments.length>80,'Settlement perimeter and gate wings must exist');
assert(world.nature.placements.filter(p=>p.kind==='tree').length>30);
assert(world.nature.placements.filter(p=>p.kind==='boulder'&&p.outside).length>20);
assert.equal(new Set(world.nature.placements.filter(p=>p.kind==='tree').map(p=>p.name)).size,4);
assert.equal(new Set(world.nature.placements.filter(p=>p.kind==='boulder').map(p=>p.name)).size,3);
// Walls must leave the walking lanes clear, including the alternate route past market.
for(const wall of world.wallSegments){const dx=wall.b.x-wall.a.x,dz=wall.b.z-wall.a.z;for(const {points} of world.paths)for(const p of points){const t=Math.max(0,Math.min(1,((p.x-wall.a.x)*dx+(p.z-wall.a.z)*dz)/(dx*dx+dz*dz)));assert(Math.hypot(p.x-wall.a.x-t*dx,p.z-wall.a.z-t*dz)>wall.width/2+.6,'Wall obstructs a walking lane');}}
// Keep the outer boundary well away from the current buildings.
for(const {rect:[x,z,x2,z2]} of world.fits){assert(x-(-40)>6&&40-x2>6&&z-(-80)>6&&42-z2>6,'Perimeter crowds a settlement structure');}

const lanternBodies=[];scene.traverse(o=>{if(o.name==='portable-lantern-tripo')lanternBodies.push(o);});
assert.equal(world.lanternCount,20,'Single workbench removes the two separate supply-station lights');
assert.equal(lanternBodies.length,world.lanternCount,'No old procedural lantern body remains');
const sharedGeometries=new Set();for(const body of lanternBodies){const size=new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());assert(Math.abs(size.y-body.userData.heightMetres)<1e-5,'Lantern is fitted to its intended physical height');body.traverse(o=>{if(o.isMesh)sharedGeometries.add(o.geometry);});}
assert(sharedGeometries.size<lanternBodies.length,'Instances reuse model geometry');
assert.equal(scene.getObjectByName('hearth-lantern').getObjectByName('lantern-flame').visible,false);
const lightState=new Journey();world.update(0,0,lightState);assert.equal(scene.getObjectByName('carried-lantern').visible,false);assert.equal(scene.getObjectByName('gate-lantern').getObjectByName('lantern-flame').visible,false);
lightState.inventory.add('lantern');lightState.discoveries.add('gate');world.update(0,0,lightState);assert.equal(scene.getObjectByName('carried-lantern').visible,true);assert.equal(scene.getObjectByName('gate-lantern').getObjectByName('lantern-flame').visible,true);
lightState.reset();world.update(0,0,lightState);assert.equal(scene.getObjectByName('carried-lantern').visible,false);assert.equal(scene.getObjectByName('gate-lantern').getObjectByName('lantern-flame').visible,false);

const fixedLights=scene.children.filter(o=>o.isPointLight&&o.distance===18);assert(fixedLights.length>7);const beforeLights=fixedLights.map(l=>[...l.position.toArray(),l.intensity]);lightState.at='goal';world.update(.05,100,lightState);assert.deepEqual(fixedLights.map(l=>[...l.position.toArray(),l.intensity]),beforeLights,'Settlement lights must not move or switch with proximity or time');
const well=scene.getObjectByName('journey-well'),gate=scene.getObjectByName('journey-gate'),hinge=scene.getObjectByName('journey-gate-hinge');
assert(well&&gate&&hinge);assert.equal(well.children.length,3,'Only generated well, water and lamp post; no old stone block ring');assert.equal(hinge.children.length,1,'Exactly one generated leaf; no old timber-bar mesh duplicate');
assert(well.getObjectByName('stone-well-tripo'));assert(hinge.getObjectByName('timber-gate-tripo'));
scene.updateMatrixWorld(true);let wellRadius=0;well.getObjectByName('stone-well-tripo').traverse(m=>{if(m.isMesh){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);wellRadius=Math.max(wellRadius,Math.hypot(v.x-well.position.x,v.z-well.position.z));}}});
const laneSamples=world.paths.flatMap(({points})=>points.slice(1).flatMap((b,i)=>Array.from({length:20},(_,k)=>({x:points[i].x+(b.x-points[i].x)*k/20,z:points[i].z+(b.z-points[i].z)*k/20}))));
const wellPathClearance=Math.min(...laneSamples.map(p=>Math.hypot(p.x-well.position.x,p.z-well.position.z)))-wellRadius;assert(wellPathClearance>.65,'Masonry must clear every nearby walking lane');
scene.updateMatrixWorld(true);const posts=gate.children.filter(x=>x.isMesh),postMatrices=posts.map(p=>p.matrixWorld.toArray());assert.equal(posts.length,2);
function inGateBounds(object){scene.updateMatrixWorld(true);const inverse=gate.matrixWorld.clone().invert(),box=new THREE.Box3();object.traverse(m=>{if(m.isMesh){const transform=inverse.clone().multiply(m.matrixWorld),p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)box.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(transform));}});return box;}
const closed=inGateBounds(hinge);assert(Math.abs(closed.min.x+1.5)<1e-5&&Math.abs(closed.max.x-1.5)<1e-5);
const journey=new Journey();journey.start();journey.discoveries.add('gate');for(let i=0;i<240;i++)world.update(1/60,i/60,journey);
const opened=inGateBounds(hinge);assert(opened.max.x<-.95,'Opened leaf clears the central walking lane');assert(Math.abs(hinge.rotation.y+Math.PI*.48)<.001);assert.deepEqual(posts.map(p=>p.matrixWorld.toArray()),postMatrices,'Support posts must stay fixed');
const camera=new THREE.PerspectiveCamera();camera.position.copy(gate.position).add(new THREE.Vector3(0,1,0));world.updateOcclusion(camera,journey.position,1/60);const movingBounds=world.occlusionBounds.find(b=>b.kind==='gate-leaf'),actual=new THREE.Box3().setFromObject(hinge);assert(movingBounds);for(const side of ['min','max'])for(const axis of ['x','y','z'])assert(Math.abs(movingBounds[side][axis]-actual[side][axis])<1e-6,'Moving leaf fading bounds stay current');
journey.discoveries.delete('gate');for(let i=0;i<240;i++)world.update(1/60,i/60,journey);assert(Math.abs(hinge.rotation.y)<.001,'Reset closes the leaf');
world.updateOcclusion(camera,journey.position,1/60);
writeFileSync(new URL('./journey-poi-scene-geometry.json',import.meta.url),JSON.stringify({models:world.modelCount,fits:world.fits,occluders:world.occluders,occlusionBounds:world.occlusionBounds},null,2)+'\n');
const report={status:'passed',modelCount:world.modelCount,wallSegments:world.wallSegments.length,nature:world.nature,lanternCount:world.lanternCount,lanternScaleAndStateVerified:true,fetched,wellReplacesBlockRing:true,wellPosition:well.position.toArray(),wellPathClearance,gateReplacesBarMeshes:true,closedGateBounds:{min:closed.min.toArray(),max:closed.max.toArray()},openedGateBounds:{min:opened.min.toArray(),max:opened.max.toArray()},gatePostsStayFixed:true,movingOcclusionBoundsVerified:true,canonicalSourcesUnchanged:true,minimumStructurePathClearance:Math.min(...world.fits.map(f=>f.clearance)),limits:'Headless geometry/material loading and HTTP check; image decoding, visual composition, hinge hardware appearance and device performance not reviewed.'};
writeFileSync(new URL('./journey-poi-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
