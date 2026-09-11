import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {teacherPose, EDIT} from './performance.ts';
export const FREE_MODELS=['teacher','listener-earth','listener-olive','listener-elder','listener-woman','listener-blue'];
export type FreeActor={root:THREE.Object3D;bones:Record<string,THREE.Bone>;clipRotations:Map<THREE.Bone,THREE.Quaternion>;mixer:THREE.AnimationMixer;actions:Record<string,THREE.AnimationAction>;faces:THREE.Mesh[];phase:number;seated:boolean;baseYaw:number};
export function makeFreeActor(prototype:THREE.Object3D,clips:THREE.AnimationClip[],phase=0):FreeActor{
 const root=clone(prototype),bones:Record<string,THREE.Bone>={},faces:THREE.Mesh[]=[];
 root.traverse(o=>{if(o instanceof THREE.Bone)bones[o.name]=o;if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;if(o instanceof THREE.SkinnedMesh)o.frustumCulled=false;if(o.morphTargetDictionary)faces.push(o);}});
 const mixer=new THREE.AnimationMixer(root),actions:Record<string,THREE.AnimationAction>={};
 for(const clip of clips){const action=mixer.clipAction(clip);action.play();action.setEffectiveWeight(0);actions[clip.name]=action;}
 const clipRotations=new Map(Object.values(bones).map(bone=>[bone,bone.quaternion.clone()]));
 return{root,bones,clipRotations,mixer,actions,faces,phase,seated:false,baseYaw:0};
}
function blend(actor:FreeActor,weights:Record<string,number>,time:number,walkTime?:number){
 // The mixer skips writes for unchanged tracks. Restore its previous result
 // before sampling so our gestures cannot become the next frame's base pose.
 for(const[bone,rotation]of actor.clipRotations)bone.quaternion.copy(rotation);
 for(const[name,action]of Object.entries(actor.actions)){
  action.setEffectiveWeight(weights[name]??0);action.time=((name==='Walk_Loop'&&walkTime!==undefined?walkTime:time)%action.getClip().duration+action.getClip().duration)%action.getClip().duration;
 }
 actor.mixer.update(0);
 for(const[bone,rotation]of actor.clipRotations)rotation.copy(bone.quaternion);
}
function morph(actor:FreeActor,name:string,value:number){for(const m of actor.faces){const i=m.morphTargetDictionary?.[name];if(i!==undefined&&m.morphTargetInfluences)m.morphTargetInfluences[i]=value;}}
function face(actor:FreeActor,wall:number,speech:number){
 const period=3.6+(actor.phase%2.1),t=(wall+actor.phase)%period,blink=t<.14?Math.sin(t/.14*Math.PI):0;
 morph(actor,'jawOpen',speech*.8);morph(actor,'mouthWide',speech*.3);morph(actor,'eyeBlinkLeft',blink);morph(actor,'eyeBlinkRight',blink);morph(actor,'browRaise',speech*.2);
}
function offset(actor:FreeActor,name:string,x:number,y=0,z=0){const b=actor.bones[name];if(b)b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));}
const sampleStep=.05,distances=[0];
for(let t=sampleStep;t<EDIT.duration+sampleStep;t+=sampleStep){const a=teacherPose(t-sampleStep),b=teacherPose(t);distances.push(distances.at(-1)!+Math.hypot(b.x-a.x,b.z-a.z));}
export function distanceAt(time:number){const f=THREE.MathUtils.clamp(time/sampleStep,0,distances.length-1),i=Math.floor(f);return THREE.MathUtils.lerp(distances[i],distances[Math.min(i+1,distances.length-1)],f-i);}
const footPosition=new THREE.Vector3();
function groundFeet(actor:FreeActor,height:number){
 actor.root.updateMatrixWorld(true);let low=Infinity;
 for(const n of ['ball_l','ball_r'])if(actor.bones[n])low=Math.min(low,actor.bones[n].getWorldPosition(footPosition).y);
 if(Number.isFinite(low)){actor.root.position.y+=height+.014-low;actor.root.updateMatrixWorld(true);}
}
export function animateFreeTeacher(actor:FreeActor,time:number,wall:number,speech:number,ground:(x:number,z:number)=>number){
 const p=teacherPose(time),a=teacherPose(Math.max(0,time-.1)),b=teacherPose(Math.min(EDIT.duration,time+.1));
 const speed=Math.hypot(b.x-a.x,b.z-a.z)/.2,crouch=THREE.MathUtils.clamp(p.crouch/.23,0,1),walk=THREE.MathUtils.clamp(speed*5,0,1)*(1-crouch),talk=(1-walk)*(1-crouch)*.18;
 const duration=actor.actions.Walk_Loop.getClip().duration;
 blend(actor,{Idle_Loop:Math.max(0,1-crouch-walk-talk),Walk_Loop:walk,Idle_Talking_Loop:talk,Crouch_Idle_Loop:crouch},time*.7,distanceAt(time)/.82*duration);
 actor.root.position.set(p.x,ground(p.x,p.z),p.z);actor.root.rotation.y=p.yaw;
 offset(actor,'Head',p.nod*.6,p.head*.8);offset(actor,'spine_03',p.bend*.3,0,.007*Math.sin(wall));
 // Small film-timed gestures layered over the authored clip, in local bone axes.
 offset(actor,'upperarm_r',0,-p.armR*.48,p.spreadR*.45);offset(actor,'lowerarm_r',0,0,p.elbowR*.58);
 offset(actor,'upperarm_l',0,p.armL*.35,-p.spreadL*.4);offset(actor,'lowerarm_l',0,0,-p.elbowL*.45);
 face(actor,wall,speech);groundFeet(actor,ground(p.x,p.z));
}
export function animateFreeListener(actor:FreeActor,wall:number,teacher:THREE.Vector3,ground:(x:number,z:number)=>number){
 const t=wall*(.68+(actor.phase%1)*.12)+actor.phase;
 blend(actor,actor.seated?{Sitting_Idle_Loop:1}:{Idle_Loop:1},t);
 actor.root.rotation.y=actor.baseYaw;actor.root.position.y=ground(actor.root.position.x,actor.root.position.z);
 const angle=Math.atan2(teacher.x-actor.root.position.x,teacher.z-actor.root.position.z)-actor.baseYaw;
 const relative=Math.atan2(Math.sin(angle),Math.cos(angle));
 offset(actor,'Head',.022*Math.sin(t*.61),THREE.MathUtils.clamp(relative,-.6,.6)*.65+.08*Math.sin(t*.31));
 offset(actor,'spine_03',0,.017*Math.sin(t*.4),.012*Math.sin(t*.7));
 face(actor,wall,0);groundFeet(actor,ground(actor.root.position.x,actor.root.position.z));
}
export async function loadFreeActors(loader:GLTFLoader,placements:{x:number;z:number;scale:number;yaw:number;seated:boolean}[],ground:(x:number,z:number)=>number){
 const [prototypes,raw]=await Promise.all([Promise.all(FREE_MODELS.map(async name=>(await loader.loadAsync(`./models-v2/${name}.glb?v=free-3`)).scene)),fetch('./models-v2/motions.json').then(r=>{if(!r.ok)throw Error('V2 motion library unavailable');return r.json();})]);
 const clips=(raw as Parameters<typeof THREE.AnimationClip.parse>[0][]).map(c=>THREE.AnimationClip.parse(c));
 const group=new THREE.Group();group.name='V2 · sourced skinned characters';
 const teacher=makeFreeActor(prototypes[0],clips);teacher.root.name='Jesus · V2';group.add(teacher.root);
 const crowd=placements.map((p,i)=>{const a=makeFreeActor(prototypes[1+i%5],clips,i*1.731);a.root.name=`Listener ${i+1} · V2`;a.root.position.set(p.x,ground(p.x,p.z),p.z);a.root.scale.setScalar(p.scale);a.baseYaw=p.yaw;a.seated=p.seated;group.add(a.root);return a;});
 // A simple local field stone supports the seated listener's hips.
 const seated=crowd.find(a=>a.seated);if(seated){const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#8e8672',roughness:1}));stone.position.set(seated.root.position.x,ground(seated.root.position.x,seated.root.position.z)+.23,seated.root.position.z);stone.scale.set(.37,.25,.35);stone.receiveShadow=true;stone.castShadow=true;group.add(stone);}
 return {group,teacher,crowd,update(time:number,wall:number,speech:number){animateFreeTeacher(teacher,time,wall,speech,ground);for(const a of crowd)animateFreeListener(a,wall,teacher.root.position,ground);},dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();for(const a of [teacher,...crowd]){a.mixer.stopAllAction();a.mixer.uncacheRoot(a.root);}group.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);}}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}};
}
