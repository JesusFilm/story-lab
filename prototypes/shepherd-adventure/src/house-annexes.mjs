import * as THREE from 'three';
import {HOUSE_ANNEXES} from './village-layout.mjs';
export const ANNEX_URL='/assets/limestone-house-annex.glb';

export async function addHouseAnnexes(loader,scene,features,ground,recordFeature,watchOcclusion,occluders){
 const source=(await loader.loadAsync(ANNEX_URL)).scene;
 for(const spec of HOUSE_ANNEXES){
  const house=features.find(f=>f.label===`House ${spec.house}`)?.root;
  if(!house)throw Error(`Annex host House ${spec.house} is missing`);
  const oriented=new THREE.Group();oriented.add(source.clone(true));oriented.rotation.y=Math.PI/2;
  oriented.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(oriented),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  const fitted=new THREE.Group();fitted.add(oriented);fitted.scale.set(spec.width/size.x,2.65/size.y,spec.depth/size.z);
  oriented.position.set(-center.x,-b.min.y,-center.z);
  const root=new THREE.Group();root.add(fitted);root.rotation.y=house.rotation.y;
  const mount=house.localToWorld(new THREE.Vector3(spec.x,0,spec.z));
  root.position.set(mount.x,Math.min(house.position.y,ground(mount.x,mount.z))-.18,mount.z);
  root.userData.annex={...spec};
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(root);recordFeature(root,`House ${spec.house} annex`,'annex',ANNEX_URL);watchOcclusion(root,'structure');
  root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);occluders.push({min:{...bounds.min},max:{...bounds.max}});
 }
 return HOUSE_ANNEXES.length;
}
