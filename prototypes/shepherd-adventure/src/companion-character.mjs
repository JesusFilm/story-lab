import * as THREE from 'three';

// Each companion owns a rig and mixer; only source geometry/textures are shared.
export class CompanionCharacter {
 constructor(parent,variant){this.parent=parent;this.variant=variant;}
 async load(loader){
  const {scene,animations}=await loader.loadAsync(new URL(`../assets/shepherd-companion-${this.variant}.glb`,import.meta.url).href);
  this.model=scene;this.parent.add(scene);this.mixer=new THREE.AnimationMixer(scene);
  this.actions={};
  for(const name of ['idle','run']){
   const clip=animations.find(clip=>clip.name===name||clip.name.endsWith(':'+name));
   if(!clip)throw new Error(`Shepherd companion ${this.variant} is missing ${name}`);
   this.actions[name]=this.mixer.clipAction(clip);
  }
  scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  this.current='idle';this.actions.idle.play();this.mixer.update(0);
 }
 update(dt,{movement,paused}){
  if(paused||dt<=0)return;
  const next=movement>.01?'run':'idle';
  if(next!==this.current){
   this.actions[next].reset().play().setEffectiveWeight(0);
   this.blend={elapsed:0,from:this.current,to:next};this.current=next;
  }
  if(this.blend){
   const b=this.blend,t=Math.min(1,(b.elapsed+=dt)/.18);
   this.actions[b.from].setEffectiveWeight(1-t);this.actions[b.to].setEffectiveWeight(t);
   if(t===1){this.actions[b.from].stop();this.blend=null;}
  }
  this.mixer.update(dt);
 }
}
