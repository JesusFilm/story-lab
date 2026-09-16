import * as THREE from 'three';
import {addNativityStraw,addNativityMotes} from './nativity-straw.mjs';
import {height} from './journey-terrain.mjs';

export const NATIVITY={x:-33,z:-73,yaw:Math.PI/2,width:7.2,depth:7.2,height:3.1};
export const ANIMAL_AREA_TREES=[[-22,-77],[-36.5,-62.5],[-19.5,-45.5],[-29.5,-40]];
export {ANIMAL_AREA_WALLS} from './journey-animal-route.mjs';
import {ANIMAL_GATE} from './journey-animal-route.mjs';

// Square generated shelter, with its open front toward the eastern approach.
export function createNativityShelter(scene,recordFeature){
 const root=new THREE.Group();root.name='nativity-shelter';root.position.set(NATIVITY.x,height(NATIVITY.x,NATIVITY.z),NATIVITY.z);root.rotation.y=NATIVITY.yaw;scene.add(root);
 return root;
}

export async function dressNativity(loader,scene,shelter,recordFeature,watchOcclusion){
 const structure=(await loader.loadAsync('/assets/square-nativity-stall.glb')).scene;
 structure.name='generated-nativity-stall';shelter.add(structure);
 // The asset is grounded and aligned from measured wall planes; do not refit its AABB.
 structure.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
 recordFeature(shelter,'Nativity shelter','shelter','/assets/square-nativity-stall.glb');
 // Bed loose straw on the generated uneven earth floor, not beneath it.
 shelter.updateMatrixWorld(true);
 const floorRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 const floorSamples=new Map();
 const floorAt=(x,z)=>{x=Math.round(x/.3)*.3;z=Math.round(z/.3)*.3;const key=x+','+z;if(floorSamples.has(key))return floorSamples.get(key);const origin=shelter.localToWorld(new THREE.Vector3(x,.35,z));floorRay.set(origin,down);const hit=floorRay.intersectObject(structure,true)[0];const y=hit?Math.max(0,shelter.worldToLocal(hit.point).y):0;floorSamples.set(key,y);return y;};
 addNativityStraw(shelter,floorAt,{width:5.8,depth:6.2});
 const troughSource=(await loader.loadAsync('/assets/straight-feeding-trough.glb')).scene;
 const troughs=[];
 for(const [wall,x,z,yaw,length] of [['back',0,-2.65,0,1],['left',-2.65,-.7,Math.PI/2,1],['right',2.65,.9,Math.PI/2,1],['front',-2.2,2.6,0,.72]]){
  const trough=troughSource.clone(true);trough.name='nativity-trough-'+wall;trough.position.set(x,floorAt(x,z),z);trough.rotation.y=yaw;trough.scale.x=length;
  trough.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});shelter.add(trough);troughs.push(trough);
 }
 // Approximate warm light reflected from the bedding onto faces beneath the roof.
 const bounce=new THREE.PointLight('#ffe4be',4,5,2);bounce.position.set(0,1.25,1.4);shelter.add(bounce);
 const updateMotes=addNativityMotes(shelter);
 const mixers=[],family=new THREE.Group();family.name='nativity-family';family.position.y=.06;shelter.add(family);
 for(const [name,url,x,z,yaw,scale=1] of [
  ['Mary','/assets/mary-seated-idle.glb',-.5,-.45,.33],
  ['Joseph','/assets/joseph-seated-idle.glb',.5,-.55,-.3+Math.PI/12],
  ['Jesus in the manger','/assets/jesus-manger-tripo.glb',0,.55,-.7,.81225]
 ]){
  const gltf=await loader.loadAsync(url),model=gltf.scene;model.name=name;model.position.set(x,0,z);model.rotation.y=yaw;model.scale.setScalar(scale);family.add(model);
  const idle=gltf.animations.find(c=>/idle/i.test(c.name));if(idle){const mixer=new THREE.AnimationMixer(model);mixer.clipAction(idle).play();mixer.update(name==='Mary'?.1:2.7);mixers.push(mixer);}
 }
 family.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.metalness=0;material.roughness=.9;}}});
 watchOcclusion(shelter,'shelter');
 // One open leaf at the southeastern entrance, swung inward along the wall.
 const gate=new THREE.Group();gate.position.set(ANIMAL_GATE.x,height(ANIMAL_GATE.x,ANIMAL_GATE.z),ANIMAL_GATE.z);gate.rotation.y=ANIMAL_GATE.yaw;scene.add(gate);
 const timber=new THREE.MeshStandardMaterial({color:'#65503a',roughness:1});
 const beam=(parent,w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),timber);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 for(const x of [-ANIMAL_GATE.width/2,ANIMAL_GATE.width/2])beam(gate,.22,1.7,.22,x,.85,0);
 const leaf=new THREE.Group();leaf.name='open-animal-gate-leaf';leaf.position.x=-ANIMAL_GATE.width/2;leaf.rotation.y=Math.PI*.48;gate.add(leaf);
 for(const x of [.08,ANIMAL_GATE.width-.08]){const post=beam(leaf,.16,1.45,.18,x,.8,0);post.name='gate-leaf-end-post';}
 for(const y of [.35,.85,1.3])beam(leaf,ANIMAL_GATE.width,.14,.16,ANIMAL_GATE.width/2,y,0);
 beam(leaf,ANIMAL_GATE.width,.12,.14,ANIMAL_GATE.width/2,.82,.04).rotation.z=.2;
 recordFeature(gate,'Animal-area gate','gate');watchOcclusion(gate,'prop');
 // An inner round timber fold, leaving generous grazing space and a southeast opening.
 const pen=new THREE.Group();pen.position.set(-35,height(-35,-53),-53);scene.add(pen);
 const radiusX=3.1,radiusZ=4.2;
 // Posts belong to rail endpoints, including both sides of the open entrance.
 const postIndices=new Set();for(let i=0;i<18;i++)if(i!==2&&i!==3){postIndices.add(i);postIndices.add((i+1)%18);}
 for(const i of postIndices){const a=i*Math.PI*2/18,post=new THREE.Mesh(new THREE.BoxGeometry(.18,1.3,.18),timber);post.position.set(Math.cos(a)*radiusX,.65,Math.sin(a)*radiusZ);post.name='sheep-fence-post-'+i;pen.add(post);}

 for(let i=0;i<18;i++){
  const a=i*Math.PI*2/18,b=(i+1)*Math.PI*2/18;if(i===2||i===3)continue;
  const x=Math.cos(a)*radiusX,z=Math.sin(a)*radiusZ,nx=Math.cos(b)*radiusX,nz=Math.sin(b)*radiusZ;
  for(const y of [.4,.9]){const rail=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(nx-x,nz-z),.1,.1),timber);rail.name='sheep-fence-rail';rail.userData.endpoints=[[x,z],[nx,nz]];rail.position.set((x+nx)/2,y,(z+nz)/2);rail.rotation.y=-Math.atan2(nz-z,nx-x);pen.add(rail);}
 }
 pen.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});recordFeature(pen,'Quiet animal pen','pen');watchOcclusion(pen,'prop');
 // Independent skeletons and staggered head idles keep the flock calm and grounded.
 const sheep=[];
 for(const [x,z,yaw] of [[-36,-54,.7],[-34,-51,-.4],[-35.5,-51.8,1.8],[-29.6,-74.8,-1.05],[-29.1,-75.8,-1.2]]){
  const gltf=await loader.loadAsync('/assets/sheep-tripo-v2.glb'),model=gltf.scene;
  const idle=gltf.animations.find(c=>/idle/i.test(c.name));if(idle){const mixer=new THREE.AnimationMixer(model);mixer.clipAction(idle).play();mixer.update(.1+sheep.length*.73);mixer.timeScale=.7+sheep.length*.06;mixers.push(mixer);}
  model.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(model),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),s=.85/size.y;
  const root=new THREE.Group();root.add(model);model.scale.setScalar(s);model.position.set(-center.x*s,-b.min.y*s,-center.z*s);root.position.set(x,height(x,z)+.04,z);root.rotation.y=yaw;
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});scene.add(root);recordFeature(root,'Resting sheep '+(sheep.length+1),'animal','/assets/sheep-tripo-v2.glb');sheep.push(root);
 }
 // The reference places the donkey behind the front-right sheep, beside the wall trough.
 const donkeyGltf=await loader.loadAsync('/assets/nativity-donkey-idle.glb'),donkey=donkeyGltf.scene;
 donkey.name='Resting donkey';donkey.position.set(1.8,.04,-1.6);donkey.rotation.y=-.25;donkey.scale.setScalar(.82);shelter.add(donkey);
 donkey.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
 const donkeyIdle=donkeyGltf.animations.find(c=>/idle/i.test(c.name));
 if(donkeyIdle){const mixer=new THREE.AnimationMixer(donkey);mixer.clipAction(donkeyIdle).play();mixer.update(1.5);mixers.push(mixer);}
 recordFeature(donkey,'Resting donkey','animal','/assets/nativity-donkey-idle.glb');
 return {sheep,family,donkey,troughs,gate,pen,update(dt,reduced=false){
  if(reduced||!Number.isFinite(dt)||dt<=0)return;
  for(const mixer of mixers)mixer.update(Math.min(dt,.1));
  updateMotes(Math.min(dt,.1));
 }};
}
