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
const {HOUSE_ANNEXES}=await import('../src/village-layout.mjs');
const {HOUSE_DECORATIONS}=await import('../src/house-decorations.mjs');
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
const features=world.settlementFeatures;
const countByKind=kind=>features.filter(feature=>feature.kind===kind).length;
const sceneryKinds=new Set(['house','empty-stall','pen','vegetable-stall','pottery-stall','tanner-stall']);
const sceneryFeatures=features.filter(feature=>sceneryKinds.has(feature.kind)&&feature.label!=='Quiet animal pen');
const sceneryCounts=Object.fromEntries(Object.entries({
 house:11,
 'empty-stall':2,
 pen:1,
 'vegetable-stall':2,
 'pottery-stall':2,
 'tanner-stall':1
 }).map(([kind])=>[kind,sceneryFeatures.filter(feature=>feature.kind===kind).length]));
assert.deepEqual(sceneryCounts,{house:11,'empty-stall':2,pen:1,'vegetable-stall':2,'pottery-stall':2,'tanner-stall':1},'Authored scenery inventory changed');
const sceneryModels=Object.values(sceneryCounts).reduce((sum,count)=>sum+count,0);
const annexModels=features.filter(feature=>feature.root.userData.annex).length;
const decorationModels=features.filter(feature=>feature.root.userData.decoration).length;
assert.equal(annexModels,HOUSE_ANNEXES.length,'Every planned house annex must be accounted for');
assert.equal(decorationModels,HOUSE_DECORATIONS.length,'Every planned house decoration must be accounted for');
const nativityFamily=scene.getObjectByName('nativity-family');
const nativityShelter=features.find(feature=>feature.label==='Nativity shelter')?.root;
const nativityCounts={
 shelter:scene.getObjectByName('generated-nativity-stall')?1:0,
 troughs:nativityShelter?.children.filter(object=>object.name.startsWith('nativity-trough-')).length??0,
 family:nativityFamily?.children.length??0,
 sheep:features.filter(feature=>/^Resting sheep /.test(feature.label)).length,
 donkey:features.filter(feature=>feature.label==='Resting donkey').length
};
assert.deepEqual(nativityCounts,{shelter:1,troughs:4,family:3,sheep:5,donkey:1},'Nativity model categories changed');
const nativityModels=Object.values(nativityCounts).reduce((sum,count)=>sum+count,0);
const oilJars=[];scene.traverse(object=>{if(object.name==='workbench-oil-jar')oilJars.push(object);});
const workbenchModels=countByKind('workbench')+oilJars.length;
assert.equal(countByKind('workbench'),1,'Single workbench must remain the authored preparation point');
assert.equal(oilJars.length,countByKind('workbench'),'Each workbench must retain its oil jar');
const well=scene.getObjectByName('journey-well'),gate=scene.getObjectByName('journey-gate'),hinge=scene.getObjectByName('journey-gate-hinge');
assert(well&&gate&&hinge);
const wellModel=well.getObjectByName('stone-well-tripo'),gateModel=hinge.getObjectByName('timber-gate-tripo');
assert(wellModel&&gateModel,'Loaded POI models must be attached to their authored well and gate roots');
const countNamed=name=>{let count=0;scene.traverse(object=>{if(object.name===name)count++;});return count;};
const poiModels=countNamed('stone-well-tripo')+countNamed('timber-gate-tripo');
assert.equal(countNamed('stone-well-tripo'),1,'Exactly one fitted well POI must be present');
assert.equal(countNamed('timber-gate-tripo'),1,'Exactly one fitted gate POI must be present');
assert.equal(poiModels,Object.keys(JOURNEY_POI_MODELS).length,'Each canonical POI model must be present exactly once');
function boundsInParent(object,parent){
 scene.updateMatrixWorld(true);
 const inverse=parent.matrixWorld.clone().invert(),bounds=new THREE.Box3();
 object.traverse(mesh=>{if(!mesh.isMesh)return;const transform=inverse.clone().multiply(mesh.matrixWorld),positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++)bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(transform));});
 return bounds;
}
const placedPOIGeometry={};
for(const [id,spec] of Object.entries(JOURNEY_POI_MODELS)){
 const object=id==='well'?wellModel:gateModel,parent=id==='well'?well:gate,bounds=boundsInParent(object,parent),size=bounds.getSize(new THREE.Vector3());
 spec.size.forEach((expected,index)=>assert(Math.abs(size.toArray()[index]-expected)<1e-5,`${id} POI geometry changed`));
 assert(Math.abs(bounds.min.y)<1e-6,`${id} POI must remain grounded`);
 assert(Math.abs((bounds.min.x+bounds.max.x)/2)<1e-6&&Math.abs((bounds.min.z+bounds.max.z)/2)<1e-6,`${id} POI must remain centered on its authored anchor`);
 placedPOIGeometry[id]={min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()};
}
const modelCategories={nativity:nativityModels,workbench:workbenchModels,pois:poiModels,scenery:sceneryModels,annexes:annexModels,decorations:decorationModels};
assert.deepEqual(modelCategories,{nativity:14,workbench:2,pois:2,scenery:19,annexes:HOUSE_ANNEXES.length,decorations:HOUSE_DECORATIONS.length},'Model categories changed');
const accountedModels=Object.values(modelCategories).reduce((sum,count)=>sum+count,0);
// The aggregate is intentionally derived from independently checked inventory
// categories. A new accepted asset must identify its category instead of
// silently changing a magic total.
assert.equal(world.modelCount,accountedModels,`Model accounting changed: ${JSON.stringify(modelCategories)}`);
assert(world.wallSegments.length>80,'Settlement perimeter and gate wings must exist');
assert(world.nature.placements.filter(p=>p.kind==='tree').length>30);
assert(world.nature.placements.filter(p=>p.kind==='boulder'&&p.outside).length>20);
assert.equal(new Set(world.nature.placements.filter(p=>p.kind==='tree').map(p=>p.name)).size,4);
assert.equal(new Set(world.nature.placements.filter(p=>p.kind==='boulder').map(p=>p.name)).size,3);
// Walls must leave the walking lanes clear, including the alternate route past market.
for(const wall of world.wallSegments){const dx=wall.b.x-wall.a.x,dz=wall.b.z-wall.a.z;for(const {points} of world.paths)for(const p of points){const t=Math.max(0,Math.min(1,((p.x-wall.a.x)*dx+(p.z-wall.a.z)*dz)/(dx*dx+dz*dz)));assert(Math.hypot(p.x-wall.a.x-t*dx,p.z-wall.a.z-t*dz)>wall.width/2+.6,'Wall obstructs a walking lane');}}
// Regression coverage for the 29 samples that previously fell inside the
// decorative walls. These named lane/run pairs use continuous segment distance
// and keep a 0.25 m margin beyond the existing point-sample wall invariant.
function pointSegmentDistance(point,a,b){const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/l2));return Math.hypot(point.x-(a.x+t*dx),point.z-(a.z+t*dz));}
function segmentDistance(a,b,c,d){
 const orient=(p,q,r)=>(q.x-p.x)*(r.z-p.z)-(q.z-p.z)*(r.x-p.x);
 const onSegment=(p,q,r)=>Math.min(p.x,r.x)-1e-9<=q.x&&q.x<=Math.max(p.x,r.x)+1e-9&&Math.min(p.z,r.z)-1e-9<=q.z&&q.z<=Math.max(p.z,r.z)+1e-9;
 const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
 if(((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0)))return 0;
 if(Math.abs(o1)<1e-9&&onSegment(a,c,b)||Math.abs(o2)<1e-9&&onSegment(a,d,b)||Math.abs(o3)<1e-9&&onSegment(c,a,d)||Math.abs(o4)<1e-9&&onSegment(c,b,d))return 0;
 return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
}
const repairedRouteWallPairs=[
 {wallPaths:[2],route:'lane-0'},
 {wallPaths:[5],route:'lane-14'},
 {wallPaths:[6,11],route:'lane-13'},
 {wallPaths:[6,11],route:'lane-14'},
 {wallPaths:[6,11],route:'lane-9'},
 {wallPaths:[6,11],route:'lane-11'},
 {wallPaths:[6,11],route:'lane-15'}
];
const routeWallRegressions=repairedRouteWallPairs.map(({wallPaths,route})=>{
 const path=world.paths.find(candidate=>candidate.edge.id===route),walls=world.wallSegments.filter(wall=>wall.kind==='decoration-wall'&&wallPaths.includes(wall.pathIndex));
 assert(path&&walls.length,`Regression geometry missing for ${route} / wall paths ${wallPaths.join(',')}`);
 const minClearance=Math.min(...walls.flatMap(wall=>path.points.slice(1).map((b,index)=>segmentDistance(wall.a,wall.b,path.points[index],b)-wall.width/2-.6)));
 assert(minClearance>.25,`${route} / wall paths ${wallPaths.join(',')} clearance regressed: ${minClearance}`);
 return {route,wallPaths,minClearance};
});
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
const report={status:'passed',modelCount:world.modelCount,modelCategories,sceneryCounts,nativityCounts,placedPOIGeometry,wallSegments:world.wallSegments.length,routeWallRegressions,nature:world.nature,lanternCount:world.lanternCount,lanternScaleAndStateVerified:true,fetched,wellReplacesBlockRing:true,wellPosition:well.position.toArray(),wellPathClearance,gateReplacesBarMeshes:true,closedGateBounds:{min:closed.min.toArray(),max:closed.max.toArray()},openedGateBounds:{min:opened.min.toArray(),max:opened.max.toArray()},gatePostsStayFixed:true,movingOcclusionBoundsVerified:true,canonicalSourcesUnchanged:true,minimumStructurePathClearance:Math.min(...world.fits.map(f=>f.clearance)),limits:'Headless geometry/material loading and HTTP check; image decoding, visual composition, hinge hardware appearance and device performance not reviewed.'};
writeFileSync(new URL('./journey-poi-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
