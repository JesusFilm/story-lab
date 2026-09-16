import * as THREE from 'three';
export const WORKBENCH_URL='/assets/lamp-workbench-pixal3d.glb';
// Measured rear uprights run 20.17 degrees off X in the prepared GLB.
export const WORKBENCH_FRONT_CORRECTION=20.17*Math.PI/180;
export const WORKBENCH_BEARING=Math.atan2(2.5,-.5);
export function addWorkbenchParts(bench,model){
 model.name='generated-lamp-workbench';model.rotation.y=WORKBENCH_FRONT_CORRECTION;
 // Correct the baked tabletop slope after aligning the open front: measured
 // rise is -0.078 m/X and -0.24 m/Z across the central wooden surface.
 model.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(.078,1,.24).normalize(),new THREE.Vector3(0,1,0)));
 model.updateWorldMatrix(true,true);
 // The generated feet have uneven lengths. Bury the lowest foot so all
 // four supports intersect the soil while the tabletop stays level.
 model.position.y-=new THREE.Box3().setFromObject(model).min.y+.47;
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});bench.add(model);
 bench.updateWorldMatrix(true,true);
 const topAt=(x,z)=>{
  const world=bench.localToWorld(new THREE.Vector3(x,1.4,z));
  const hits=new THREE.Raycaster(world,new THREE.Vector3(0,-1,0)).intersectObject(model,true);
  if(!hits.length)throw new Error('Lamp workbench has no tabletop beneath a part');
  return bench.worldToLocal(hits[0].point.clone()).y+.008;
 };
 const wick=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.12,0,0),new THREE.Vector3(0,.006,.035),new THREE.Vector3(.13,0,0)]),12,.016,5,false),new THREE.MeshStandardMaterial({color:'#cab992',roughness:1}));
 wick.name='workbench-wick';wick.position.set(-.48,topAt(-.48,.12)+.018,.12);bench.add(wick);
 const flint=new THREE.Group();flint.name='workbench-flint';flint.position.set(.43,topAt(.43,.17),.17);
 for(const [x,size,color] of [[0,.063,'#555452'],[.12,.045,'#8c7046']]){const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),new THREE.MeshStandardMaterial({color,roughness:.9}));stone.position.set(x,size*.6,0);stone.scale.y=.65;flint.add(stone);}bench.add(flint);
 return {topAt,wick,flint};
}
