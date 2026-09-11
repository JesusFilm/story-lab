import * as THREE from 'three';

// Canonical library exports are mapped by serve.py. Runtime fitting leaves originals intact.
export const JOURNEY_POI_MODELS={
 well:{asset:'stone-well',url:'/assets/stone-well-tripo.glb',size:[2.2,.85,2.2],rotationY:0},
 gate:{asset:'timber-gate',url:'/assets/timber-gate-tripo.glb',size:[3,1.9,.15],rotationY:Math.PI/2}
};

export function fitJourneyPOI(source,spec){
 const model=source.clone(true),oriented=new THREE.Group();oriented.add(model);model.rotation.y+=spec.rotationY;
 oriented.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(oriented),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 if(bounds.isEmpty()||[size.x,size.y,size.z].some(v=>!Number.isFinite(v)||v<=0))throw new Error('Invalid '+spec.asset+' model bounds');
 const fitted=new THREE.Group();fitted.name=spec.asset+'-tripo';fitted.userData.assetId=spec.asset;
 oriented.position.set(-center.x,-bounds.min.y,-center.z);fitted.add(oriented);fitted.scale.set(spec.size[0]/size.x,spec.size[1]/size.y,spec.size[2]/size.z);
 fitted.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return fitted;
}

export async function loadJourneyPOIModels(loader){
 const results=await Promise.all(Object.entries(JOURNEY_POI_MODELS).map(async([key,spec])=>[key,fitJourneyPOI((await loader.loadAsync(spec.url)).scene,spec)]));
 return Object.fromEntries(results);
}
