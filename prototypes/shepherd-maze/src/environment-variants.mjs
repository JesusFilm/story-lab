import * as THREE from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {createLampPlacements} from './night-village.mjs';

export const ENVIRONMENT_VARIANTS={
 v1:{label:'V1 · Legacy',description:'Procedural Blender village'},
 v2:{label:'V2 · Tripo',description:'Generated shepherd, structures, lamps and sheep'}
};

const STRUCTURE_MODEL_URLS={
 'low-wall':'/assets/low-wall-kit-tripo-v2.glb',
 home:'/assets/house-01-tripo-v2.glb',
 market:'/assets/market-stall-tripo-v2.glb',
 'animal-stall':'/assets/animal-pen-tripo-v2.glb'
};
const STRUCTURE_MODEL_KINDS={
 'low-wall':'low-wall',home:'home','low-courtyard':'home',market:'market','animal-stall':'animal-stall'
};
const AUX_MODEL_URLS={
 'structure-lamp':'/assets/structure-lamp-tripo-v2.glb',
 sheep:'/assets/sheep-tripo-v2.glb'
};
const FIT={
 'low-wall':{inset:.02,height:.90,sourceLongAxis:'z'},home:{inset:.18,height:'short',sourceLongAxis:'z'},
 'low-courtyard':{inset:.18,height:'short',sourceLongAxis:'z'},
 market:{inset:.18,height:2.80,sourceLongAxis:'x',facade:true},'animal-stall':{inset:.18,height:2.80,sourceLongAxis:'x',facade:true}
};
const REPLACED_KINDS=new Set(Object.keys(STRUCTURE_MODEL_KINDS));
const SHEEP_CLIPS={walk:'preset:quadruped:walk',idle:'idle'};

function setTreeVisibility(root,visible){
 root.visible=visible;root.traverse(object=>{object.visible=visible;});
}

function configureMeshes(root,{uniqueMaterials=false}={}){
 root.traverse(object=>{
  if(!object.isMesh)return;
  object.castShadow=true;object.receiveShadow=true;
  if(uniqueMaterials)object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone();
 });
}

function boundsRecord(root){
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();
 bounds.getSize(size);bounds.getCenter(center);
 return {min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray(),center:center.toArray()};
}

function nearestFacadeDirection(map,solid,targetLongAxis){
 const [x,z,x2,z2]=solid.rect,cx=(x+x2)/2,cz=(z+z2)/2,offset=.35;
 const candidates=targetLongAxis==='x'?[{x:cx,z:z-offset},{x:cx,z:z2+offset}]:[{x:x-offset,z:cz},{x:x2+offset,z:cz}];
 const nodes=map.nodes.map(node=>({x:map.node_origin_m[0]+node.xy[0]*map.node_pitch_m,z:map.node_origin_m[1]+node.xy[1]*map.node_pitch_m}));
 const distance=point=>Math.min(...nodes.map(node=>(node.x-point.x)**2+(node.z-point.z)**2));
 const selected=distance(candidates[0])<=distance(candidates[1])?candidates[0]:candidates[1];
 return {x:Math.sign(selected.x-cx),z:Math.sign(selected.z-cz)};
}

function fitClone(source,sourceSize,solid,index,map,assetKind){
 const [x,z,x2,z2]=solid.rect,targetX=x2-x,targetZ=z2-z,config=FIT[solid.kind];
 const fitX=Math.max(.05,targetX-config.inset*2),fitZ=Math.max(.05,targetZ-config.inset*2);
 const sourceLongAxis=config.sourceLongAxis,targetLongAxis=fitX>=fitZ?'x':'z';
 const rotate=sourceLongAxis!==targetLongAxis,model=source.clone(true),root=new THREE.Group();
 root.name=`EnvironmentV2_${solid.kind}_${String(index).padStart(3,'0')}`;root.add(model);
 const scaleX=(rotate?fitZ:fitX)/sourceSize.x,scaleZ=(rotate?fitX:fitZ)/sourceSize.z;
 const shortScale=sourceLongAxis==='x'?scaleZ:scaleX;
 const scaleY=config.height==='short'?shortScale:config.height/sourceSize.y;
 model.scale.set(scaleX,scaleY,scaleZ);
 if(config.facade){const outward=nearestFacadeDirection(map,solid,targetLongAxis);model.rotation.y=Math.atan2(outward.x,outward.z);}
 else model.rotation.y=rotate?Math.PI/2:0;
 configureMeshes(model,{uniqueMaterials:solid.kind!=='low-wall'});
 root.updateMatrixWorld(true);
 const initial=new THREE.Box3().setFromObject(root),center=new THREE.Vector3();initial.getCenter(center);
 root.position.set((x+x2)/2-center.x,-initial.min.y,(z+z2)/2-center.z);
 root.userData={environmentVersion:'v2',asset:assetKind,village_kind:solid.kind,foundry_id:solid.id,authoritative_rect_m:solid.rect};
 root.updateMatrixWorld(true);const fit=boundsRecord(root);
 root.traverse(object=>{if(object.isMesh)object.userData.villageRoot=root.uuid;});
 return {root,fit:{name:root.name,kind:solid.kind,assetKind,foundryId:solid.id,rect:[...solid.rect],...fit}};
}

function createLampInstances(source,sourceSize,placements){
 const root=new THREE.Group();root.name='EnvironmentV2_structure-lamps';
 const targetScale=new THREE.Vector3(.38/sourceSize.x,.75/sourceSize.y,.26/sourceSize.z);
 const up=new THREE.Vector3(0,1,0),position=new THREE.Vector3(),quaternion=new THREE.Quaternion();
 const placementMatrix=new THREE.Matrix4(),combined=new THREE.Matrix4();source.updateMatrixWorld(true);
 source.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const instances=new THREE.InstancedMesh(mesh.geometry,mesh.material,placements.length);
  instances.name=`${mesh.name||'Lamp'}_V2_instances`;instances.castShadow=true;instances.receiveShadow=true;instances.frustumCulled=false;
  placements.forEach((lamp,index)=>{
   quaternion.setFromAxisAngle(up,Math.atan2(lamp.dx,lamp.dz));position.set(lamp.x,lamp.y,lamp.z);
   placementMatrix.compose(position,quaternion,targetScale);combined.multiplyMatrices(placementMatrix,mesh.matrixWorld);instances.setMatrixAt(index,combined);
  });
  instances.instanceMatrix.needsUpdate=true;root.add(instances);
 });
 root.userData={environmentVersion:'v2',asset:'structure-lamp',instanceCount:placements.length};return root;
}

function createSheep(source,clips,solid,index){
 const model=cloneSkeleton(source),root=new THREE.Group();root.name=`EnvironmentV2_sheep_${String(index).padStart(2,'0')}`;root.add(model);
 configureMeshes(model);model.scale.setScalar(1.25);root.updateMatrixWorld(true);
 const initial=new THREE.Box3().setFromObject(root);model.position.y=-initial.min.y;root.updateMatrixWorld(true);
 const mixer=new THREE.AnimationMixer(model),actions={};
 for(const [key,name] of Object.entries(SHEEP_CLIPS)){
  const clip=THREE.AnimationClip.findByName(clips,name);if(!clip)throw new Error(`V2 sheep is missing ${name}`);
  actions[key]=mixer.clipAction(clip);actions[key].setLoop(THREE.LoopRepeat,Infinity);
 }
 const [x,z,x2,z2]=solid.rect,horizontal=x2-x>=z2-z,center={x:(x+x2)/2,z:(z+z2)/2};
 const axis=horizontal?{x:1,z:0}:{x:0,z:1},forwardYaw=horizontal?0:-Math.PI/2;
 root.userData={environmentVersion:'v2',asset:'sheep',foundry_id:solid.id,pen_rect_m:solid.rect};
 return {root,model,mixer,actions,current:null,center,axis,forwardYaw,range:1.35,offset:(index*3.17)%14,solid,groundY:model.position.y};
}

function playSheep(actor,name){
 if(actor.current===name)return;
 const next=actor.actions[name],previous=actor.current&&actor.actions[actor.current];
 if(previous)previous.fadeOut(.24);next.reset().setEffectiveWeight(1).fadeIn(.24).play();actor.current=name;
}

export class EnvironmentVariants{
 constructor(parent,map,legacyWorld){
  this.parent=parent;this.map=map;this.legacyWorld=legacyWorld;this.version='v2';this.elapsed=0;
  this.legacyRoots=[];this.v2Root=new THREE.Group();this.v2Root.name='EnvironmentV2';
  this.replacements=[];this.fits=[];this.occluders=[];this.models={};this.sheep=[];this.lampRoot=null;this.lampPlacements=[];
 }

 async load(loader){
  const urls={...STRUCTURE_MODEL_URLS,...AUX_MODEL_URLS};
  const entries=await Promise.all(Object.entries(urls).map(async([kind,url])=>[kind,url,await loader.loadAsync(url)]));
  for(const [kind,url,gltf] of entries){
   const bounds=new THREE.Box3().setFromObject(gltf.scene),size=new THREE.Vector3();bounds.getSize(size);
   if(size.x<=0||size.y<=0||size.z<=0)throw new Error(`${kind} V2 model has invalid bounds`);
   this.models[kind]={url,source:gltf.scene,size:size.clone(),animations:gltf.animations,
    sourceBounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},clips:gltf.animations.map(clip=>clip.name)};
  }
  this.legacyWorld.traverse(object=>{if(object.userData.foundry_id&&REPLACED_KINDS.has(object.userData.village_kind))this.legacyRoots.push(object);});
  const solids=this.map.solids.filter(solid=>REPLACED_KINDS.has(solid.kind));
  for(const [index,solid] of solids.entries()){
   const assetKind=STRUCTURE_MODEL_KINDS[solid.kind],model=this.models[assetKind];
   const replacement=fitClone(model.source,model.size,solid,index,this.map,assetKind);
   this.v2Root.add(replacement.root);this.replacements.push(replacement.root);this.fits.push(replacement.fit);
   if(solid.kind!=='low-wall')replacement.root.traverse(object=>{if(object.isMesh)this.occluders.push(object);});
  }
  this.lampPlacements=createLampPlacements(this.map).filter(lamp=>lamp.mount==='wall');
  const lamp=this.models['structure-lamp'];this.lampRoot=createLampInstances(lamp.source,lamp.size,this.lampPlacements);this.v2Root.add(this.lampRoot);
  const sheepModel=this.models.sheep,penSolids=this.map.solids.filter(solid=>solid.kind==='animal-stall');
  for(const [index,solid] of penSolids.entries()){
   const actor=createSheep(sheepModel.source,sheepModel.animations,solid,index);this.sheep.push(actor);this.v2Root.add(actor.root);
  }
  this.parent.add(this.v2Root);this.updateSheep(0);this.setVersion(this.version);
 }

 setVersion(version){
  if(!ENVIRONMENT_VARIANTS[version])throw new Error(`Unknown environment version: ${version}`);
  this.version=version;
  for(const root of this.legacyRoots)setTreeVisibility(root,version==='v1');setTreeVisibility(this.v2Root,version==='v2');
 }

 updateSheep(dt){
  for(const actor of this.sheep){
   const phase=(this.elapsed+actor.offset)%14;let amount,walking=false,reverse=false;
   if(phase<5)amount=0;else if(phase<7){amount=(phase-5)/2;walking=true;}
   else if(phase<12)amount=1;else{amount=1-(phase-12)/2;walking=true;reverse=true;}
   const along=(amount*2-1)*actor.range;
   actor.root.position.set(actor.center.x+actor.axis.x*along,0,actor.center.z+actor.axis.z*along);
   actor.root.rotation.y=actor.forwardYaw+(reverse||(!walking&&amount===0)?Math.PI:0);
   playSheep(actor,walking?'walk':'idle');actor.mixer.update(dt);
  }
 }

 update(dt){this.elapsed+=dt;if(this.version==='v2')this.updateSheep(dt);}

 getState(){
  const counts={};for(const replacement of this.replacements)counts[replacement.userData.village_kind]=(counts[replacement.userData.village_kind]||0)+1;
  return {version:this.version,replacementCount:this.replacements.length,counts,
   visibleV2:this.replacements.filter(root=>root.visible).length,visibleLegacy:this.legacyRoots.filter(root=>root.visible).length,
   generatedLampCount:this.lampPlacements.length,visibleGeneratedLamps:this.version==='v2'?this.lampPlacements.length:0,
   sheepCount:this.sheep.length,visibleSheep:this.version==='v2'?this.sheep.length:0,sheepClips:this.models.sheep?.clips||[],
   sheepActors:this.sheep.map(actor=>({foundryId:actor.solid.id,rect:actor.solid.rect,position:actor.root.position.toArray(),animation:actor.current})),
   models:Object.fromEntries(Object.entries(this.models).map(([kind,model])=>[kind,{url:model.url,sourceBounds:model.sourceBounds,clips:model.clips}]))};
 }
}
