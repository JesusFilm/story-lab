import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Quaternion,AnimationClip,QuaternionKeyframeTrack,VectorKeyframeTrack} from 'three';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'.cache/free-models/universal-animation-library/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb');
const body=JSON.parse(fs.readFileSync(path.join(root,'.cache/free-models/universal-base-characters/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'),'utf8'));
const bytes=fs.readFileSync(src),len=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+len).toString());const bin=Buffer.from(bytes.subarray(28+len));
const sizes={SCALAR:1,VEC3:3,VEC4:4};
function read(index){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView],size=sizes[a.type];if(a.componentType!==5126)throw Error('Expected floats');return Array.from({length:a.count*size},(_,i)=>bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+Math.floor(i/size)*(v.byteStride??size*4)+(i%size)*4));}
function write(index,values){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView],size=sizes[a.type];values.forEach((n,i)=>bin.writeFloatLE(n,(v.byteOffset??0)+(a.byteOffset??0)+Math.floor(i/size)*(v.byteStride??size*4)+(i%size)*4));delete a.min;delete a.max;}
const chosen=new Set(['Idle_Loop','Idle_Talking_Loop','Walk_Loop','Walk_Formal_Loop','Crouch_Idle_Loop','Sitting_Idle_Loop','Sitting_Talking_Loop']);
const clips=[];
for(const anim of doc.animations){if(!chosen.has(anim.name))continue;const tracks=[];
 for(const channel of anim.channels){const node=doc.nodes[channel.target.node],target=body.nodes.find(n=>n.name===node.name);if(!target)continue;const sampler=anim.samplers[channel.sampler],times=read(sampler.input),values=read(sampler.output),prop=channel.target.path;
  if(prop==='rotation'){
   const correction=new Quaternion().fromArray(target.rotation??[0,0,0,1]).multiply(new Quaternion().fromArray(node.rotation??[0,0,0,1]).invert());
   for(let i=0;i<values.length;i+=4)new Quaternion().copy(correction).multiply(new Quaternion().fromArray(values,i)).normalize().toArray(values,i);
   tracks.push(new QuaternionKeyframeTrack(node.name+'.quaternion',times,values));
  }else if(prop==='translation'){
   for(let i=0;i<values.length;i++)values[i]=(target.translation??[0,0,0])[i%3]+(node.name==='pelvis'?values[i]-(node.translation??[0,0,0])[i%3]:0);
   if(node.name==='pelvis')tracks.push(new VectorKeyframeTrack(node.name+'.position',times,values));
  }
  write(sampler.output,values);
 }
 clips.push(AnimationClip.toJSON(new AnimationClip(anim.name,-1,tracks).optimize()));
}
doc.animations=doc.animations.filter(a=>chosen.has(a.name));
for(const node of doc.nodes){const target=body.nodes.find(n=>n.name===node.name);if(target&&node.name!=='Armature'){node.rotation=target.rotation;node.translation=target.translation;node.scale=target.scale;}}
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
fs.writeFileSync(path.join(root,'.cache/free-models/retargeted-motion.glb'),Buffer.concat([header,json,bh,bin]));
fs.mkdirSync(path.join(root,'public/models-v2'),{recursive:true});fs.writeFileSync(path.join(root,'public/models-v2/motions.json'),JSON.stringify(clips));
console.log('Retargeted',clips.map(c=>c.name).join(', '));
