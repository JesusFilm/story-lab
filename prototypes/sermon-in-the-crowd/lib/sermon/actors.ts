import * as THREE from 'three';
import {teacherPose} from './performance.ts';
export type Actor={root:THREE.Object3D;joints:Record<string,THREE.Object3D>;phase:number;scale:number;baseYaw:number;seated:boolean;meshes:THREE.Mesh[]};
export function makeActor(prototype:THREE.Object3D,phase=0):Actor{
 const root=prototype.clone(true),joints:Record<string,THREE.Object3D>={},meshes:THREE.Mesh[]=[];
 root.traverse(o=>{if(o.userData.joint)joints[o.userData.joint]=o;if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;meshes.push(o);}});
 return {root,joints,phase,scale:1,baseYaw:0,seated:false,meshes};
}
function rot(actor:Actor,joint:string,x=0,y=0,z=0){actor.joints[joint]?.rotation.set(x,y,z);}
function blink(actor:Actor,time:number){const period=3.4+(actor.phase%2.9);const p=(time+actor.phase)%period;const close=p<.15?Math.sin(p/.15*Math.PI):0;const node=actor.joints.blink;if(node)node.scale.y=Math.max(.015,close);}
export function animateTeacher(actor:Actor,time:number,wall:number,speech:number,ground:(x:number,z:number)=>number){
 const p=teacherPose(time),past=teacherPose(Math.max(0,time-.06));const speed=Math.hypot(p.x-past.x,p.z-past.z)/.06;const stride=Math.min(1,speed*4);const gait=Math.sin(time*7.8)*stride;
 actor.root.position.set(p.x,ground(p.x,p.z)-p.crouch,p.z);actor.root.rotation.y=p.yaw;
 rot(actor,'torso',p.bend,0,.009*Math.sin(wall*1.4));actor.joints.torso.scale.y=1-p.crouch*.92;
 rot(actor,'head',p.nod+.008*Math.sin(wall*1.9),p.head,.012*Math.sin(wall*.7));
 rot(actor,'arm_left',p.armL+gait*.09,0,p.spreadL);rot(actor,'arm_right',p.armR-gait*.09,0,p.spreadR);
 rot(actor,'forearm_left',p.elbowL);rot(actor,'forearm_right',p.elbowR);
 rot(actor,'leg_left',gait*.20);rot(actor,'leg_right',-gait*.20);
 rot(actor,'foot_left',-gait*.1);rot(actor,'foot_right',gait*.1);
 rot(actor,'jaw',speech*.22);blink(actor,wall);actor.root.updateMatrixWorld(true);
}
export function animateListener(actor:Actor,time:number,teacher:THREE.Vector3){
 const a=time+actor.phase;const breath=Math.sin(a*(1.15+(actor.phase%4)*.07));
 rot(actor,'torso',actor.seated?.13:.015*Math.sin(a*.37),.012*Math.sin(a*.43),.013*Math.sin(a*.31));
 const torso=actor.joints.torso;if(torso){torso.scale.y=(actor.seated?.64:1)+breath*.004;}
 const angle=Math.atan2(teacher.x-actor.root.position.x,teacher.z-actor.root.position.z)-actor.baseYaw;
 const relative=Math.atan2(Math.sin(angle),Math.cos(angle));
 const glance=Math.sin(a*.23)**13*.22;
 rot(actor,'head',.028*Math.sin(a*.64)+(actor.seated?-.08:0),THREE.MathUtils.clamp(relative,-.55,.55)*.6+glance,.015*Math.sin(a*.51));
 const style=Math.floor(actor.phase)%4;
 rot(actor,'arm_left',style===0?-.25:-.015,0,-.015*Math.sin(a*.5));rot(actor,'forearm_left',style===0?-.85:-.15-.035*Math.sin(a*.47));
 rot(actor,'arm_right',style===1?-.23:.015,0,.018*Math.sin(a*.43));rot(actor,'forearm_right',style===1?-.7:-.12+.03*Math.sin(a*.39));
 rot(actor,'leg_left',actor.seated?-1.15:.013*Math.sin(a*.29));rot(actor,'leg_right',actor.seated?-1.08:-.012*Math.sin(a*.29));
 blink(actor,time);actor.root.updateMatrixWorld(true);
}
// Crowd meshes are instanced per articulated part. Each listener keeps independent
// transforms, but matching geometry/material is submitted in one draw call.
export function instanceCrowd(scene:THREE.Object3D,groups:Actor[][]){
 const batches:{mesh:THREE.InstancedMesh;actors:Actor[];part:number}[]=[];
 for(const actors of groups){if(!actors.length)continue;actors[0].meshes.forEach((template,part)=>{const mesh=new THREE.InstancedMesh(template.geometry,template.material,actors.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);batches.push({mesh,actors,part});});}
 return ()=>{for(const {mesh,actors,part}of batches){actors.forEach((a,i)=>mesh.setMatrixAt(i,a.meshes[part].matrixWorld));mesh.instanceMatrix.needsUpdate=true;}};
}
