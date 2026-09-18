import * as THREE from 'three';

export const DECORATION_ASSETS=['olive-wall-cluster-a','olive-wall-cluster-b','olive-basket-cluster-a','olive-basket-cluster-b'];
export const decorationURL=id=>`/assets/optimized/${id}.glb`;
// House-local +X is the facade; +Z is the window side. The door stays clear.
// Seeded variation is stable across reloads and map generation.
let seed=915;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export const HOUSE_DECORATIONS=Array.from({length:11},(_,i)=>{
 const count=random()<.35?1:2;
 const first=Math.floor(random()*DECORATION_ASSETS.length);
 return Array.from({length:count},(_,j)=>({house:i+1,asset:DECORATION_ASSETS[(first+j)%4],along:j===0?1.35:-2.65,width:j===0?1.85:1.2,height:1.3,depth:.62}));
}).flat();

export async function addHouseDecorations(loader,scene,features,ground,recordFeature,watchOcclusion){
 const sources=new Map();
 for(const id of DECORATION_ASSETS)sources.set(id,(await loader.loadAsync(decorationURL(id))).scene);
 for(const [index,spec] of HOUSE_DECORATIONS.entries()){
  const house=features.find(f=>f.label===`House ${spec.house}`)?.root;
  if(!house)throw Error(`Decoration host House ${spec.house} is missing`);
  const model=sources.get(spec.asset).clone(true),b=new THREE.Box3().setFromObject(model),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
  const scale=Math.min(spec.width/size.x,spec.height/size.y),depthScale=Math.min(scale,spec.depth/size.z);
  model.scale.set(scale,scale,depthScale);
  // +Z is the asset front. Put its rear on the mounting plane and base at zero.
  model.position.set(-center.x*scale,-b.min.y*scale,-b.min.z*depthScale);
  const facing=new THREE.Group();facing.add(model);facing.rotation.y=spec.side?0:Math.PI/2;
  const root=new THREE.Group();root.add(facing);root.rotation.y=house.rotation.y;
  const mount=house.localToWorld(new THREE.Vector3(spec.side?spec.along:2.20,0,spec.side?2.88:spec.along));
  root.position.set(mount.x,ground(mount.x,mount.z)-.025,mount.z);
  root.userData.decoration={...spec};
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(root);recordFeature(root,`House ${spec.house} decoration ${index+1}`,'prop',decorationURL(spec.asset));watchOcclusion(root,'prop');
 }
 return HOUSE_DECORATIONS.length;
}
