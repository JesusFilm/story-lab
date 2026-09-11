import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeActor, animateTeacher, animateListener, instanceCrowd } from '../lib/sermon/actors.ts';
import { editedTimeAt } from '../lib/sermon/performance.ts';
async function model(name:string){const b=fs.readFileSync(new URL(`../public/models/${name}.glb`,import.meta.url));return(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
test('teacher gestures articulate limbs; speech jaw closes on pause',async()=>{
 const actor=makeActor(await model('jesus'));
 for(const name of ['torso','head','jaw','blink','arm_right','forearm_right','leg_left','foot_right'])assert.ok(actor.joints[name],name);
 animateTeacher(actor,editedTimeAt(64),10,.8,()=>0);assert.ok(actor.joints.arm_right.rotation.x<-.5);assert.ok(actor.joints.jaw.rotation.x>.1);
 animateTeacher(actor,editedTimeAt(64),10,0,()=>0);assert.equal(actor.joints.jaw.rotation.x,0);
});
test('crowd instances keep independent idles and update render matrices',async()=>{
 const proto=await model('listener-sage'),a=makeActor(proto,1.2),b=makeActor(proto,4.7);b.root.position.x=2;
 const scene=new THREE.Scene();const update=instanceCrowd(scene,[[a,b]]);
 animateListener(a,2,new THREE.Vector3(0,0,0));animateListener(b,2,new THREE.Vector3(0,0,0));update();
 assert.notEqual(a.joints.head,b.joints.head);assert.notEqual(a.joints.head.rotation.y,b.joints.head.rotation.y);
 assert.equal(scene.children.length,a.meshes.length);
 const m=scene.children[0] as THREE.InstancedMesh;assert.equal(m.count,2);const matrix=new THREE.Matrix4();m.getMatrixAt(1,matrix);assert.ok(matrix.elements.every(Number.isFinite));
 const old=a.joints.head.rotation.y;animateListener(a,4,new THREE.Vector3(0,0,0));assert.notEqual(old,a.joints.head.rotation.y);
});
