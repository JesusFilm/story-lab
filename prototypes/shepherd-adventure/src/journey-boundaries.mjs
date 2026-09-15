import {DECORATIVE_WALL_PATHS,DECORATIVE_WALL_HOSTS} from './village-layout.mjs';
import * as THREE from 'three';
import {ANIMAL_AREA_WALLS} from './journey-nativity.mjs';
import {height} from './journey-terrain.mjs';

export const VILLAGE_BOUNDS={minX:-40,maxX:40,minZ:-80,maxZ:42,entryHalfWidth:6};
export function connectedWallPaths(features,surface=height){
 return DECORATIVE_WALL_PATHS.map((points,index)=>{
  const path=points.map(([x,z])=>({x,z}));
  for(const [end,host] of DECORATIVE_WALL_HOSTS[index].entries()){
   if(!host)continue;
   const i=end===0?0:path.length-1,p=path[i];
   if(host==='south-boundary'){p.z=VILLAGE_BOUNDS.maxZ;continue;}
   const root=features.find(f=>f.label===host)?.root;
   if(!root)throw Error(`Missing wall attachment host: ${host}`);
   root.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());
   const direction=new THREE.Vector3(center.x-p.x,0,center.z-p.z).normalize();
   const origin=new THREE.Vector3(p.x,surface(p.x,p.z)+.55,p.z).addScaledVector(direction,-20);
   // Raycast at masonry height, not the roof's larger bounding rectangle.
   const hit=new THREE.Raycaster(origin,direction,0,40).intersectObject(root,true)[0];
   if(!hit)throw Error(`Wall cannot reach ${host} at its marked side`);
   const join=hit.point.clone().addScaledVector(direction,.32);
   path[i]={x:join.x,z:join.z};
  }
  return {points:path,hosts:DECORATIVE_WALL_HOSTS[index]};
 });
}
export function boundaryRuns(gate,features=[],surface=height){
 const b=VILLAGE_BOUNDS,toWorld=([x,z])=>({x:gate.x+Math.cos(gate.yaw)*x+Math.sin(gate.yaw)*z,z:gate.z-Math.sin(gate.yaw)*x+Math.cos(gate.yaw)*z});
 return [
  {kind:'gate-wing',a:toWorld([1.48,0]),b:gate.stallJoin||toWorld([7.6,0]),height:1.35},
  {kind:'gate-wing',a:toWorld([-1.48,0]),b:toWorld([-5.3,0]),height:1.35},
  {kind:'gate-wing',a:toWorld([-5.3,0]),b:toWorld([-5.3,3.3]),height:1.35},
  ...ANIMAL_AREA_WALLS,
  ...connectedWallPaths(features,surface).flatMap(({points,hosts},pathIndex)=>points.slice(1).map((p,i)=>({kind:'decoration-wall',pathIndex,a:points[i],b:p,height:1.05,startHost:i===0?hosts[0]:null,endHost:i===points.length-2?hosts[1]:null}))),
  ...[
   [[b.minX,b.maxZ],[-b.entryHalfWidth,b.maxZ]],[[b.entryHalfWidth,b.maxZ],[b.maxX,b.maxZ]],
   [[b.minX,b.maxZ],[b.minX,b.minZ]],[[b.minX,b.minZ],[b.maxX,b.minZ]],[[b.maxX,b.minZ],[b.maxX,b.maxZ]]
  ].map(([a,c])=>({kind:'perimeter-wall',a:{x:a[0],z:a[1]},b:{x:c[0],z:c[1]},height:1.1}))
 ];
}
export function addVillageWalls(source,scene,gate,watchOcclusion,occluders,surface=height,features=[]){
 const oriented=new THREE.Group();oriented.add(source.clone(true));oriented.rotation.y=Math.PI/2;oriented.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(oriented),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const segments=[];
 for(const run of boundaryRuns(gate,features,surface)){
  const dx=run.b.x-run.a.x,dz=run.b.z-run.a.z,length=Math.hypot(dx,dz),count=Math.ceil(length/3.8);
  for(let i=0;i<count;i++){
   const a={x:run.a.x+dx*i/count,z:run.a.z+dz*i/count},b={x:run.a.x+dx*(i+1)/count,z:run.a.z+dz*(i+1)/count};
   const model=oriented.clone(true),fitted=new THREE.Group(),root=new THREE.Group();fitted.add(model);root.add(fitted);
   // Slight overlap seals irregular stone ends; bury the base below both endpoints.
   const span=length/count+.12;fitted.scale.set(span/size.x,run.height/size.y,.58/size.z);
   model.position.set(-center.x,-bounds.min.y,-center.z);
   root.position.set((a.x+b.x)/2,Math.min(...Array.from({length:9},(_,k)=>surface(a.x+(b.x-a.x)*k/8,a.z+(b.z-a.z)*k/8)))-.14,(a.z+b.z)/2);root.rotation.y=-Math.atan2(dz,dx);root.name=run.kind;
   root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(root);root.updateMatrixWorld(true);
   watchOcclusion(root,'wall');const box=new THREE.Box3().setFromObject(root);occluders.push({min:{...box.min},max:{...box.max}});
   segments.push({kind:run.kind,a,b,width:.58,height:run.height,...(run.kind==='decoration-wall'?{pathIndex:run.pathIndex,startHost:i===0?run.startHost:null,endHost:i===count-1?run.endHost:null}:{})});
  }
 }
 return segments;
}
