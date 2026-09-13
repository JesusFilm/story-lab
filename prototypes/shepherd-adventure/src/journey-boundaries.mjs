import * as THREE from 'three';
import {ANIMAL_AREA_WALLS} from './journey-nativity.mjs';
import {height} from './journey-terrain.mjs';

export const VILLAGE_BOUNDS={minX:-40,maxX:40,minZ:-80,maxZ:42,entryHalfWidth:6};
export function boundaryRuns(gate){
 const b=VILLAGE_BOUNDS,toWorld=([x,z])=>({x:gate.x+Math.cos(gate.yaw)*x+Math.sin(gate.yaw)*z,z:gate.z-Math.sin(gate.yaw)*x+Math.cos(gate.yaw)*z});
 return [
  ...ANIMAL_AREA_WALLS,
  {kind:'shelter-screen',a:{x:9,z:-39},b:{x:29,z:-39},height:3.4},
  {kind:'shelter-screen',a:{x:9,z:-39},b:{x:9,z:-46},height:3.4},
  {kind:'gate-wing',a:toWorld([1.48,0]),b:gate.stallJoin||toWorld([7.6,0]),height:1.35},
  {kind:'gate-wing',a:toWorld([-1.48,0]),b:toWorld([-5.3,0]),height:1.35},
  {kind:'gate-wing',a:toWorld([-5.3,0]),b:toWorld([-5.3,3.3]),height:1.35},
  ...[
   [[b.minX,b.maxZ],[-b.entryHalfWidth,b.maxZ]],[[b.entryHalfWidth,b.maxZ],[b.maxX,b.maxZ]],
   [[b.minX,b.maxZ],[b.minX,b.minZ]],[[b.minX,b.minZ],[b.maxX,b.minZ]],[[b.maxX,b.minZ],[b.maxX,b.maxZ]]
  ].map(([a,c])=>({kind:'perimeter-wall',a:{x:a[0],z:a[1]},b:{x:c[0],z:c[1]},height:1.1}))
 ];
}
export function addVillageWalls(source,scene,gate,watchOcclusion,occluders,surface=height){
 const oriented=new THREE.Group();oriented.add(source.clone(true));oriented.rotation.y=Math.PI/2;oriented.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(oriented),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const segments=[];
 for(const run of boundaryRuns(gate)){
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
   segments.push({kind:run.kind,a,b,width:.58,height:run.height});
  }
 }
 return segments;
}
