import * as THREE from 'three';

// Wall lanterns project 0.2 m from facades, well clear of the graph-centre walking lanes.
export function createLampPlacements(map){
 const lamps=[];
 for(const solid of map.solids){
  const [x,z,x2,z2]=solid.rect,cx=(x+x2)/2,cz=(z+z2)/2,horizontal=x2-x>=z2-z;
  if(['home','market','animal-stall'].includes(solid.kind)){
   const height=solid.kind==='home'?2.35:2.1;
   for(const sign of [-1,1])lamps.push({x:horizontal?cx:(sign<0?x-.20:x2+.20),z:horizontal?(sign<0?z-.20:z2+.20):cz,y:height,
    dx:horizontal?0:sign,dz:horizontal?sign:0,mount:'wall',kind:solid.kind,foundryId:solid.id});
  }else if(solid.kind==='low-courtyard'){
   const [,col,row]=solid.id.split('-').map(Number);
   if((col+row)%2===0)lamps.push({x:cx,z:cz,y:1.25,dx:0,dz:0,mount:'courtyard',kind:solid.kind,foundryId:solid.id});
  }
 }
 return lamps;
}

function createProceduralFixtures(scene,lamps,globeMat,frameMat){
 const group=new THREE.Group();
 const glass=new THREE.InstancedMesh(new THREE.SphereGeometry(.105,8,6),globeMat,lamps.length);
 const roofs=new THREE.InstancedMesh(new THREE.ConeGeometry(.20,.16,4),frameMat,lamps.length);
 const bases=new THREE.InstancedMesh(new THREE.BoxGeometry(.25,.055,.25),frameMat,lamps.length);
 const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.027,.027,.43,6),frameMat,lamps.length*4);
 const dummy=new THREE.Object3D();
 const set=(mesh,i,x,y,z)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
 lamps.forEach((lamp,i)=>{
  set(glass,i,lamp.x,lamp.y,lamp.z);set(roofs,i,lamp.x,lamp.y+.28,lamp.z);set(bases,i,lamp.x,lamp.y-.23,lamp.z);
  for(let k=0;k<4;k++)set(stems,i*4+k,lamp.x+(k%2?1:-1)*.11,lamp.y,lamp.z+(k<2?1:-1)*.11);
 });
 for(const mesh of [glass,roofs,bases,stems])group.add(mesh);scene.add(group);return group;
}

// All light pools remain visible. V2 swaps wall-mounted fixture geometry and hides
// the freestanding courtyard fixtures now covered by the V2 courtyard-home models.
export function createNightVillage(scene,map){
 const lamps=createLampPlacements(map),poolSize=6;
 const globeMat=new THREE.MeshBasicMaterial({color:'#ffe1a0',toneMapped:false});
 const frameMat=new THREE.MeshStandardMaterial({color:'#49321c',roughness:.7});
 const wallFixtures=createProceduralFixtures(scene,lamps.filter(lamp=>lamp.mount==='wall'),globeMat,frameMat);
 const courtyardFixtures=createProceduralFixtures(scene,lamps.filter(lamp=>lamp.mount==='courtyard'),globeMat,frameMat);
 // Feathered halos and pools are cheap fixed geometry, not per-lamp shadow maps.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
 const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,208,115,1)');gradient.addColorStop(.18,'rgba(255,177,65,.55)');gradient.addColorStop(1,'rgba(255,149,42,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(glowCanvas);texture.colorSpace=THREE.SRGBColorSpace;
 const haloMaterial=new THREE.SpriteMaterial({map:texture,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const groundGeometry=new THREE.PlaneGeometry(9,9);groundGeometry.rotateX(-Math.PI/2);
 const ground=new THREE.InstancedMesh(groundGeometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),lamps.length);
 const dummy=new THREE.Object3D();
 const set=(mesh,i,x,y,z)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
 lamps.forEach((lamp,i)=>{
  const halo=new THREE.Sprite(haloMaterial);halo.position.set(lamp.x,lamp.y,lamp.z);halo.scale.set(1.35,1.35,1.35);scene.add(halo);
  set(ground,i,lamp.x+lamp.dx*1.8,.027,lamp.z+lamp.dz*1.8);
 });
 scene.add(ground);
 const lights=Array.from({length:poolSize},()=>{const light=new THREE.PointLight('#ffc471',0,11,2);scene.add(light);return {light,lamp:null};});
 function update(player,dt){
  const nearest=lamps.map((lamp,i)=>({i,d:(lamp.x-player.x)**2+(lamp.z-player.z)**2})).sort((a,b)=>a.d-b.d).slice(0,poolSize).map(v=>v.i);
  const assigned=new Set(lights.map(slot=>slot.lamp));
  for(const slot of lights){
   const retained=nearest.includes(slot.lamp),target=retained?48:0;
   slot.light.intensity=THREE.MathUtils.damp(slot.light.intensity,target,6,dt);
   if(!retained&&slot.light.intensity<.1){
    assigned.delete(slot.lamp);slot.lamp=nearest.find(i=>!assigned.has(i));
    if(slot.lamp!==undefined){assigned.add(slot.lamp);const p=lamps[slot.lamp];slot.light.position.set(p.x+p.dx*.35,p.y,p.z+p.dz*.35);}
   }
  }
 }
 // Warm character fill suggests nearby lantern bounce without lighting the whole world.
 const bounce=new THREE.PointLight('#f6bb7b',4,5,2);scene.add(bounce);
 return {count:lamps.length,wallCount:lamps.filter(lamp=>lamp.mount==='wall').length,activeLightLimit:poolSize,
  setVersion(version){wallFixtures.visible=version==='v1';courtyardFixtures.visible=version==='v1';},
  update(player,dt){update(player,dt);bounce.position.set(player.x,2.8,player.z+1.5);}};
}

export function createFootprintGlow(scene,capacity,alpha){
 const geometry=new THREE.PlaneGeometry(.65,.95);geometry.rotateX(-Math.PI/2);geometry.setAttribute('trailAlpha',alpha);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute float trailAlpha; varying vec2 glowUv; varying float glowAlpha;
   void main(){glowUv=uv;glowAlpha=trailAlpha;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec2 glowUv; varying float glowAlpha;
   void main(){vec2 p=(glowUv-.5)*2.;float glow=exp(-dot(p,p)*5.)*(1.-smoothstep(.35,1.,length(p)));
   gl_FragColor=vec4(.21,.95,.76,glow*glowAlpha*.32);}`});
 const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.count=0;mesh.frustumCulled=false;scene.add(mesh);return mesh;
}
