import * as THREE from 'three';

export const CHARACTER_VARIANTS={
 v1:{label:'V1 · Legacy',description:'Blender placeholder with procedural motion'},
 v2:{label:'V2 · Tripo',description:'Generated shepherd with five authored clips'}
};

const V1_URL='/assets/shepherd-prototype.glb';
const V2_URL='/assets/shepherd-tripo-v2.glb';
const CLIPS={
 idle:'preset:biped:idle',walk:'preset:biped:walk',run:'preset:biped:run',
 turn:'preset:biped:turn',lookAround:'preset:biped:look_around'
};

function shadows(root){
 root.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;}});
}

function posedBounds(root){
 root.updateMatrixWorld(true);const bounds=new THREE.Box3(),point=new THREE.Vector3();
 const rootInverse=root.matrixWorld.clone().invert();
 root.traverse(object=>{
  if(!object.isSkinnedMesh)return;
  object.skeleton.update();const positions=object.geometry.getAttribute('position');
  for(let index=0;index<positions.count;index++){
   object.getVertexPosition(index,point);point.applyMatrix4(object.matrixWorld).applyMatrix4(rootInverse);bounds.expandByPoint(point);
  }
 });
 return bounds;
}

export class CharacterVariants{
 constructor(parent){this.parent=parent;this.version='v2';this.legacy=null;this.tripo=null;}

 async load(loader){
  const [legacyGltf,tripoGltf]=await Promise.all([loader.loadAsync(V1_URL),loader.loadAsync(V2_URL)]);
  this.configureLegacy(legacyGltf.scene);
  this.configureTripo(tripoGltf.scene,tripoGltf.animations);
  this.setVersion(this.version);
 }

 configureLegacy(root){
  const limbs={};root.rotation.order='YXZ';shadows(root);
  root.traverse(object=>{if(['ArmL','ArmR','LegL','LegR'].includes(object.name))limbs[object.name]=object;});
  this.legacy={root,limbs,walkPhase:0,current:'idle'};this.parent.add(root);
 }

 configureTripo(model,clips){
  const root=new THREE.Group();root.name='ShepherdV2';root.add(model);shadows(model);
  const mixer=new THREE.AnimationMixer(model),actions={};
  for(const [key,name] of Object.entries(CLIPS)){
   const clip=THREE.AnimationClip.findByName(clips,name);
   if(!clip)throw new Error(`Tripo shepherd is missing ${name}`);
   actions[key]=mixer.clipAction(clip);
  }
  this.tripo={root,model,mixer,actions,current:null,idleSeconds:0,lookAroundPlayed:false,lastPhase:null};
  this.playTripo('idle');actions.idle.stopFading().setEffectiveWeight(1);mixer.update(0);
  const bounds=posedBounds(model),height=bounds.max.y-bounds.min.y;
  const scale=height>0?1.72/height:1;
  model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.rotation.y=-Math.PI/2;model.updateMatrixWorld(true);
  this.tripo.calibration={boundsMin:bounds.min.toArray(),boundsMax:bounds.max.toArray(),height,scale,groundOffset:model.position.y};
  this.parent.add(root);
 }

 setVersion(version){
  if(!CHARACTER_VARIANTS[version])throw new Error(`Unknown character version: ${version}`);
  this.version=version;
  if(this.legacy)this.legacy.root.visible=version==='v1';
  if(this.tripo){this.tripo.root.visible=version==='v2';this.tripo.lastPhase=null;}
 }

 playTripo(name,{once=false,duration=null,restart=false}={}){
  const tripo=this.tripo,next=tripo.actions[name];
  if(!next||(tripo.current===name&&!restart))return;
  const previous=tripo.current&&tripo.actions[tripo.current];
  if(previous&&previous!==next)previous.fadeOut(.16);
  next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
  next.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;
  if(duration)next.setDuration(duration);
  next.fadeIn(.16).play();tripo.current=name;
 }

 updateLegacy(dt,movement,gaitBlend){
  const legacy=this.legacy;if(!legacy||this.version!=='v1')return;
  legacy.walkPhase+=movement*dt*THREE.MathUtils.lerp(3.5,2.2,gaitBlend);
  const stride=Math.min(1,movement/3.8);
  for(const [name,part] of Object.entries(legacy.limbs)){
   const arm=name.startsWith('Arm'),swing=arm?THREE.MathUtils.lerp(.25,.55,gaitBlend):THREE.MathUtils.lerp(.38,.68,gaitBlend);
   const sign=name.endsWith('L')?1:-1,target=Math.sin(legacy.walkPhase)*stride*swing*sign*(arm?-1:1);
   part.rotation.x+=(target-part.rotation.x)*(1-Math.exp(-14*dt));
  }
  legacy.root.position.y=Math.abs(Math.sin(legacy.walkPhase))*stride*THREE.MathUtils.lerp(.055,.12,gaitBlend);
  legacy.root.rotation.x=gaitBlend*.10;
  legacy.current=movement<=.01?'idle':gaitBlend>.55?'run':'walk';
 }

 updateTripo(dt,controller,movement,paused){
  const tripo=this.tripo;if(!tripo||this.version!=='v2')return;
  const turning=controller.phase==='turning'&&!paused;
  if(turning){
   if(tripo.lastPhase!=='turning')this.playTripo('turn',{once:true,duration:controller.turn?.duration||.6,restart:true});
   tripo.idleSeconds=0;tripo.lookAroundPlayed=false;
  }else if(!paused&&movement>.01){
   this.playTripo(controller.gait==='run'?'run':'walk');
   tripo.idleSeconds=0;tripo.lookAroundPlayed=false;
  }else{
   tripo.idleSeconds+=dt;
   const looking=tripo.current==='lookAround'&&tripo.actions.lookAround.isRunning();
   if(tripo.idleSeconds>=4&&!tripo.lookAroundPlayed){
    tripo.lookAroundPlayed=true;this.playTripo('lookAround',{once:true,restart:true});
   }else if(!looking)this.playTripo('idle');
  }
  tripo.lastPhase=turning?'turning':controller.phase;tripo.mixer.update(dt);
 }

 update(dt,{controller,movement,gaitBlend,paused}){
  this.updateLegacy(dt,movement,gaitBlend);
  this.updateTripo(dt,controller,movement,paused);
 }

 get pivots(){return this.legacy?Object.keys(this.legacy.limbs):[];}
 get animation(){return this.version==='v1'?this.legacy?.current:(this.tripo?.current?CLIPS[this.tripo.current]:null);}
 get availableAnimations(){return this.tripo?Object.values(CLIPS):[];}
 get calibration(){return this.tripo?.calibration||null;}
}
