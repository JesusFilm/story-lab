import * as THREE from 'three';
import {height} from './journey-terrain.mjs';

export const NATIVITY={x:-33,z:-73,yaw:Math.PI/2,width:9,depth:7,height:3.8};
export const ANIMAL_AREA_TREES=[[-22,-77],[-36.5,-62.5],[-19.5,-45.5],[-29.5,-40]];
export {ANIMAL_AREA_WALLS} from './journey-animal-route.mjs';
import {ANIMAL_GATE} from './journey-animal-route.mjs';

// A wide, open-front shelter; local +Z faces the new eastern approach.
export function createNativityShelter(scene,recordFeature){
 const root=new THREE.Group();root.position.set(NATIVITY.x,height(NATIVITY.x,NATIVITY.z),NATIVITY.z);root.rotation.y=NATIVITY.yaw;scene.add(root);
 const wood=new THREE.MeshStandardMaterial({color:'#65503a',roughness:1}),straw=new THREE.MeshStandardMaterial({color:'#8c7854',roughness:1}),stone=new THREE.MeshStandardMaterial({color:'#847760',roughness:1});
 function box(w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
 for(const x of [-4.2,4.2])for(const z of [-3,3])box(.3,3.8,.3,x,1.9,z,wood);
 box(9,.24,7,0,3.85,0,straw);
 for(let i=0;i<23;i++)box(.14,.16,7.2,-4.4+i*.4,4.02,0,wood);
 box(8.7,2.8,.5,0,1.4,-3.15,stone);
 for(const x of [-4.3,4.3])box(.45,1.2,6,x,.6,0,stone);
 box(8.6,.55,6.3,0,-.235,0,stone);
 box(8.6,.08,6.3,0,.02,0,straw);
 recordFeature(root,'Nativity shelter','shelter');return root;
}

export async function dressNativity(loader,scene,shelter,recordFeature,watchOcclusion){
 const family=(await loader.loadAsync('/assets/nativity-family-pixal3d.glb')).scene;
 family.position.set(0,.06,-.9);shelter.add(family);
 family.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});
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
 // Each animal loads its own skeleton from the cached GLB. Hold a real idle pose;
 // no mixer advances, roaming or agitation around the Nativity.
 const sheep=[];
 for(const [x,z,yaw] of [[-36,-54,.7],[-34,-51,-.4],[-35.5,-51.8,1.8],[-35.7,-70.8,.6],[-35.3,-75.3,1.2]]){
  const gltf=await loader.loadAsync('/assets/sheep-tripo-v2.glb'),model=gltf.scene;
  const idle=gltf.animations.find(c=>/idle/i.test(c.name));if(idle){const mixer=new THREE.AnimationMixer(model);mixer.clipAction(idle).play();mixer.update(.1);}
  model.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(model),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),s=.85/size.y;
  const root=new THREE.Group();root.add(model);model.scale.setScalar(s);model.position.set(-center.x*s,-b.min.y*s,-center.z*s);root.position.set(x,z<-68?height(NATIVITY.x,NATIVITY.z)+.06:height(x,z)+.04,z);root.rotation.y=yaw;
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});scene.add(root);recordFeature(root,'Resting sheep '+(sheep.length+1),'animal','/assets/sheep-tripo-v2.glb');sheep.push(root);
 }
 return {sheep,family,gate,pen};
}
