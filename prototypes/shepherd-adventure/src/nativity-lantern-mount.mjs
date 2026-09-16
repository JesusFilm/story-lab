import * as THREE from 'three';

// Attach the existing lantern to the actual inside face of the generated wall.
export function mountNativityLantern(shelter,fixture,size){
 const structure=shelter.getObjectByName('generated-nativity-stall');
 shelter.updateMatrixWorld(true);
 const origin=shelter.localToWorld(new THREE.Vector3(0,2.45,1.35));
 const direction=new THREE.Vector3(1,0,0).transformDirection(shelter.matrixWorld);
 const hit=new THREE.Raycaster(origin,direction,0,5).intersectObject(structure,true)[0];
 if(!hit)throw new Error('Nativity lantern needs a closed right wall to mount onto');
 const anchor=shelter.worldToLocal(hit.point.clone()),armEnd=anchor.clone().add(new THREE.Vector3(-.38,0,0));
 const bracket=new THREE.Group();bracket.name='nativity-lantern-bracket';shelter.add(bracket);
 const metal=new THREE.MeshStandardMaterial({color:'#302923',metalness:.55,roughness:.7});
 const plate=new THREE.Mesh(new THREE.BoxGeometry(.045,.22,.12),metal);plate.position.copy(anchor);bracket.add(plate);
 function rod(a,b,r){const delta=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),metal);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;bracket.add(mesh);}
 rod(anchor,armEnd,.018);
 const handle=armEnd.clone().add(new THREE.Vector3(0,-.17,0));rod(armEnd,handle,.012);
 rod(anchor.clone().add(new THREE.Vector3(0,-.12,0)),armEnd,.012);
 fixture.root.name='nativity-mounted-lantern';shelter.add(fixture.root);fixture.root.position.copy(handle).add(new THREE.Vector3(0,-size/2,0));
 shelter.updateMatrixWorld(true);fixture.root.getWorldPosition(fixture.source.light.position);
 Object.assign(fixture.source,{x:fixture.source.light.position.x,y:fixture.source.light.position.y,z:fixture.source.light.position.z});
 bracket.userData.anchor=anchor.toArray();bracket.userData.handle=handle.toArray();
 return bracket;
}
