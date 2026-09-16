import * as THREE from 'three';
import {ANIMAL_AREA_TREES,NATIVITY} from './journey-nativity.mjs';
import {height} from './journey-terrain.mjs';
import {VILLAGE_BOUNDS} from './journey-boundaries.mjs';
export const NATURE_MODELS=['CommonTree_2','TwistedTree_1','TwistedTree_3','DeadTree_2','Rock_Medium_1','Rock_Medium_2','Rock_Medium_3','Pebble_Round_2'];
const TREE_MODELS=NATURE_MODELS.slice(0,4),ROCK_MODELS=NATURE_MODELS.slice(4,7);
function seeded(seed=4926){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function normalized(source){
 const root=new THREE.Group(),copy=source.clone(true);root.add(copy);root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 copy.position.set(-center.x,-box.min.y,-center.z);root.scale.setScalar(1/size.y);root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of Array.isArray(o.material)?o.material:[o.material]){m.roughness=1;if(m.name.includes('Leaves')){m.color.set('#7f8964');m.alphaTest=Math.max(.4,m.alphaTest);m.side=THREE.DoubleSide;}else m.color.set('#b8afa0');}o.castShadow=true;o.receiveShadow=true;}});return root;
}
export async function addVillageNature(loader,scene,fits,pathDistance,watchOcclusion){
 const loaded=await Promise.all(NATURE_MODELS.map(async name=>[name,normalized((await loader.loadAsync('/assets/nature/'+name+'.gltf')).scene)])),sources=Object.fromEntries(loaded),rng=seeded(),placements=[];
 const occupied=[];
 function buildingDistance(x,z){const shelterDistance=Math.hypot(Math.max(Math.abs(x-NATIVITY.x)-NATIVITY.depth/2,0),Math.max(Math.abs(z-NATIVITY.z)-NATIVITY.width/2,0));return Math.min(shelterDistance,...fits.map(({rect:[a,b,c,d]})=>Math.hypot(Math.max(a-x,0,x-c),Math.max(b-z,0,z-d))));}
 function put(name,x,z,h,kind,outside=false){
  if(z>45&&Math.abs(x)<(kind==='tree'?10:5))return;
  const root=new THREE.Group(),model=sources[name].clone(true);root.add(model);root.name=kind+'-'+name;root.userData.source='quaternius-cc0';root.position.set(x,height(x,z)-(kind==='boulder'?.1:.07),z);root.rotation.y=rng()*Math.PI*2;
  const width=.85+rng()*.3;root.scale.set(h*width,h,h*(.85+rng()*.3));scene.add(root);watchOcclusion(root,kind==='tree'?'tree':'boulder');occupied.push({x,z,r:kind==='tree'?2.5:1.5});placements.push({name,kind,x,z,height:h,outside});
 }
 for(const [i,[x,z]] of ANIMAL_AREA_TREES.entries())put(TREE_MODELS[i%3],x,z,5.2,'tree');
 // Retain familiar courtyard silhouettes, but use real branches and alpha-cut leaves.
 for(const [i,[x,z]] of [[-25,22],[-26,12],[-23,3],[-31,-14],[-29,-27],[29,20],[32,-20],[-10,36],[18,37],[-35,35],[35,-39]].entries()){
  if(pathDistance(x,z)>2.8&&buildingDistance(x,z)>1.8)put(TREE_MODELS[i%3],x,z,4.2+rng()*1.5,'tree');
 }
 for(const [i,[x,z,h]] of [[12,-36,1.3],[16,-37,1.1],[27,-37,1.6],[10,-46,1.2]].entries())put(ROCK_MODELS[i%3],x,z,h,'boulder');
 for(const [i,z] of [57,69,82,95].entries()){put(TREE_MODELS[i%3],i%2?-12:12,z,5,'tree',true);put(ROCK_MODELS[i%3],i%2?9:-9,z+3,1.5,'boulder',true);}
 const b=VILLAGE_BOUNDS;
 // Irregular woodland clusters beyond the wall, leaving the arrival lane clear.
 for(let i=0;i<52;i++){
  let x,z;const side=i%4,t=rng();
  if(side===0){x=b.minX-5-rng()*18;z=b.minZ-8+t*(b.maxZ-b.minZ+25);}
  else if(side===1){x=b.maxX+5+rng()*18;z=b.minZ-8+t*(b.maxZ-b.minZ+25);}
  else if(side===2){x=b.minX-15+t*(b.maxX-b.minX+30);z=b.minZ-6-rng()*17;}
  else{x=b.minX-15+t*(b.maxX-b.minX+30);z=b.maxZ+6+rng()*20;}
  if(pathDistance(x,z)<6||occupied.some(p=>Math.hypot(p.x-x,p.z-z)<4))continue;
  put(TREE_MODELS[i%4],x,z,4.5+rng()*3.3,'tree',true);
 }
 for(let i=0;i<70;i++){
  const angle=rng()*Math.PI*2,x=Math.cos(angle)*(46+rng()*16),z=-7+Math.sin(angle)*(55+rng()*17);
  if(x>b.minX-3&&x<b.maxX+3&&z>b.minZ-3&&z<b.maxZ+3||pathDistance(x,z)<4||occupied.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+1))continue;
  put(ROCK_MODELS[i%3],x,z,.7+rng()*2.3,'boulder',true);
 }
 // Replace the old primitive stones with instances of the downloaded pebble mesh.
 const pebble=sources.Pebble_Round_2;pebble.updateMatrixWorld(true);const parts=[];pebble.traverse(o=>{if(o.isMesh)parts.push(o);});const samples=[];
 for(let i=0;i<1800;i++){const x=(rng()-.5)*136,z=rng()*150-85;if(pathDistance(x,z)<1.45||buildingDistance(x,z)<.4)continue;samples.push({x,z,scale:.035+rng()*.13,yaw:rng()*Math.PI*2});}
 const dummy=new THREE.Object3D();for(const part of parts){const geometry=part.geometry.clone();geometry.applyMatrix4(part.matrixWorld);const stones=new THREE.InstancedMesh(geometry,part.material,samples.length);stones.name='quaternius-pebbles';stones.receiveShadow=true;for(const [i,p] of samples.entries()){dummy.position.set(p.x,height(p.x,p.z)-.025,p.z);dummy.rotation.y=p.yaw;dummy.scale.set(p.scale,p.scale,p.scale);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);}scene.add(stones);}
 return {placements,pebbleCount:samples.length,sourceModels:NATURE_MODELS};
}
