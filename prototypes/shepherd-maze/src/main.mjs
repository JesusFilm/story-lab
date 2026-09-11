import * as THREE from 'three';
import {createNightVillage,createFootprintGlow} from './night-village.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Controller,nodeWorld,WALK_SPEED,RUN_SPEED,FOOTPRINT_CAPACITY} from './controller.mjs';
import {RunSession,DIFFICULTIES,LOCAL_RADIUS,visibleOnMap} from './session.mjs';
import {CharacterVariants,CHARACTER_VARIANTS} from './character-variants.mjs';
import {EnvironmentVariants,ENVIRONMENT_VARIANTS} from './environment-variants.mjs';

const $=s=>document.querySelector(s);
const requestedCharacter=new URLSearchParams(location.search).get('character');
const state={ready:false,started:false,menu:null,difficulty:'medium',characterVersion:requestedCharacter==='v2'?'v2':'v1'};
const held=new Set(),run=new RunSession();
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#081226');scene.fog=new THREE.Fog('#081226',28,115);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,450);
scene.add(new THREE.HemisphereLight('#7199dd','#121c36',.48));
const sun=new THREE.DirectionalLight('#9bbdff',.62);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
Object.assign(sun.shadow.camera,{near:.5,far:130,left:-27,right:27,top:27,bottom:-27});
Object.assign(sun.shadow,{bias:-.0004,normalBias:.025});scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight('#5c7ec7',.16);fill.position.set(-40,30,-30);scene.add(fill);
const worldGroup=new THREE.Group(),avatar=new THREE.Group();scene.add(worldGroup,avatar);
let map,controller,characters,environment,walls=[],solidGroups=[],nightVillage,goalRing,goalMarker,routeLine;
let previousTime=0,gaitBlend=0,lastUI=0,toastTime=0,lastRouteKey='',menuItems=[],menuIndex=0,lastPhase='';
const desiredCamera=new THREE.Vector3(),smoothLook=new THREE.Vector3(),targetLook=new THREE.Vector3(),ray=new THREE.Raycaster();
const ctx=$('#minimap').getContext('2d');
const footDummy=new THREE.Object3D();
const sole=new THREE.Shape();
sole.moveTo(-.035,.13);sole.quadraticCurveTo(-.073,.12,-.053,.02);
sole.quadraticCurveTo(-.09,-.065,-.066,-.13);sole.quadraticCurveTo(0,-.18,.065,-.13);
sole.quadraticCurveTo(.084,-.06,.046,.02);sole.quadraticCurveTo(.07,.14,-.035,.13);
const footGeometry=new THREE.ShapeGeometry(sole,6);footGeometry.rotateX(-Math.PI/2);
const footMaterial=new THREE.MeshBasicMaterial({color:'#95ffe0',toneMapped:false,transparent:true,depthWrite:false,
  polygonOffset:true,polygonOffsetFactor:-2});
const footMesh=new THREE.InstancedMesh(footGeometry,footMaterial,FOOTPRINT_CAPACITY);
// Individual alpha ages each footprint without allocating a mesh/material per step.
const footprintAlpha=new THREE.InstancedBufferAttribute(new Float32Array(FOOTPRINT_CAPACITY),1);
footGeometry.setAttribute('trailAlpha',footprintAlpha);
footMaterial.onBeforeCompile=shader=>{
 shader.vertexShader='attribute float trailAlpha; varying float vTrailAlpha;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTrailAlpha=trailAlpha;');
 shader.fragmentShader='varying float vTrailAlpha;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vTrailAlpha;');
};
const footGlow=createFootprintGlow(scene,FOOTPRINT_CAPACITY,footprintAlpha);
footMesh.count=0;footMesh.frustumCulled=false;scene.add(footMesh);
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');toastTime=performance.now()+2300;}
function setCharacterVersion(version,announce=true){
 if(!CHARACTER_VARIANTS[version]||!ENVIRONMENT_VARIANTS[version])return false;
 state.characterVersion=version;characters?.setVersion(version);environment?.setVersion(version);nightVillage?.setVersion(version);
 const config=CHARACTER_VARIANTS[version],button=$('#character-version');
 $('#character-version-code').textContent=version.toUpperCase();button.querySelector('.version-name').textContent=` · ${version==='v2'?'Tripo':'Legacy'}`;
 button.setAttribute('aria-checked',String(version==='v2'));button.setAttribute('aria-label',`Prototype ${config.label}. Activate to switch to ${version==='v2'?'V1 Legacy':'V2 Tripo'} character and environment.`);
 const url=new URL(location.href);url.searchParams.set('character',version);history.replaceState(null,'',url);
 if(announce)toast(`${config.label} character + village · progress kept`);
 return true;
}
function toggleCharacterVersion(){setCharacterVersion(state.characterVersion==='v2'?'v1':'v2');}
function chooseDifficulty(value){
 if(state.started)return;
 state.difficulty=value;run.reset(value);
 document.querySelectorAll('[data-difficulty]').forEach(b=>{b.classList.toggle('active',b.dataset.difficulty===value);b.setAttribute('aria-pressed',String(b.dataset.difficulty===value));});
 $('#difficulty-description').textContent=DIFFICULTIES[value].description;updateUI();
}
function start(){
 if(!state.ready)return;
 run.reset(state.difficulty);run.mapUsed=true;controller.reset();controller.begin();
 state.started=true;state.menu=null;lastRouteKey='';lastPhase='';held.clear();
 document.body.classList.add('playing');$('#intro').hidden=true;$('#menu').hidden=true;$('#modal-shade').hidden=true;
 $('#map-panel').hidden=false;$('#decisions').hidden=false;
 updateCamera(1,true);updateUI();
}
function newWalk(){
 controller.reset();state.started=false;state.menu=null;held.clear();lastRouteKey='';
 document.body.classList.remove('playing');$('#intro').hidden=false;$('#menu').hidden=true;$('#modal-shade').hidden=true;
 $('#map-panel').hidden=true;$('#decisions').hidden=true;run.reset(state.difficulty);
 $('#pause').disabled=true;updateCamera(1,true);updateUI();
}
function closeMenu(){controller.restartPace();state.menu=null;$('#menu').hidden=true;$('#modal-shade').hidden=true;held.clear();document.activeElement?.blur();updateUI();}
function showMenu(kind='pause'){
 if(!state.started)return;
 held.clear();state.menu=kind;$('#menu').hidden=false;$('#modal-shade').hidden=false;
 let title,copy,eyebrow;
 if(kind==='confirm'){
  eyebrow='HELP FINISHING';title='Reveal the route?';
  copy='Route guidance may make this run ineligible for some challenge completion events or achievements. Your earned discoveries and the ending are kept. Once revealed, this run is recorded as guided.';
  menuItems=[{label:'Keep exploring',action:()=>{run.cancelRoute();closeMenu();}},
   {label:'Reveal route & finish',action:()=>{run.confirmRoute();lastRouteKey='';closeMenu();toast('Guided run · Follow the line and highlighted choices');}}];
 }else if(kind==='restart'){
  eyebrow='START FRESH';title='Start a new walk?';copy='Your current walk and footprints will reset. You can choose a different difficulty.';
  menuItems=[{label:'Continue this walk',action:closeMenu},{label:'Choose difficulty',action:newWalk}];
 }else if(kind==='result'){
  const result=run.result();eyebrow='POINT 1 REACHED';title='You found the open stall.';
  copy=`${run.config.label} · ${result.completionType==='guided'?'Guided completion':'Map-assisted completion'}. ${Math.round(controller.distance)} metres walked. ${result.challengeCompletionEligible?'Completed without route guidance.':'Route assistance recorded for this run.'} Your journey is complete.`;
  menuItems=[{label:'Choose another walk',action:newWalk}];
 }else{
  eyebrow='TAKE A BREATH';title='Journey paused.';copy='Use ↑ ↓ to choose, then OK. Your place and footprints are safe.';
  menuItems=[{label:'Continue walking',action:closeMenu}];
  if(controller.phase!=='turning'&&(controller.previous||controller.edge?.progress>0))menuItems.push({label:'Turn around and wait',action:()=>{closeMenu();controller.command('back');}});
  if(!run.routeVisible)menuItems.push({label:'Help me finish…',action:requestRoute});
  menuItems.push({label:'Start a new walk…',action:()=>showMenu('restart')});
 }
 $('#menu-eyebrow').textContent=eyebrow;$('#menu-title').textContent=title;$('#menu-copy').textContent=copy;
 const actions=$('#menu-actions');actions.replaceChildren();
 menuItems.forEach((item,i)=>{const b=document.createElement('button');b.textContent=item.label;b.onclick=item.action;b.dataset.menuIndex=i;actions.append(b);});
 menuIndex=0;focusMenu();updateUI();
}
function focusMenu(){
 const buttons=[...$('#menu-actions').children];buttons.forEach((b,i)=>b.classList.toggle('selected',i===menuIndex));
 buttons[menuIndex]?.focus({preventScroll:true});
}
function requestRoute(){if(run.requestRoute())showMenu('confirm');}
function handleKey(key){
 if(!state.ready)return;
 if(['v','V'].includes(key)){toggleCharacterVersion();return;}
 if(state.menu){
  if(['ArrowUp','ArrowDown'].includes(key)){menuIndex=(menuIndex+(key==='ArrowUp'?-1:1)+menuItems.length)%menuItems.length;focusMenu();}
  else if(['Enter',' ','Select'].includes(key))menuItems[menuIndex].action();
  else if(key==='Escape'&&state.menu!=='result'){run.cancelRoute();closeMenu();}
  return;
 }
 if(!state.started){
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){
   const choices=Object.keys(DIFFICULTIES),i=choices.indexOf(state.difficulty);
   chooseDifficulty(choices[(i+(['ArrowLeft','ArrowUp'].includes(key)?-1:1)+3)%3]);
  }else if(['Enter',' ','Select'].includes(key))start();
  return;
 }
 if(['Enter',' ','Select','Escape','p','P'].includes(key)){showMenu();return;}
 if(['r','R'].includes(key)){showMenu('restart');return;}
 if(['m','M'].includes(key)){toast(run.config.map==='local'?'Maximum difficulty shows only the nearby map':'Your village map is on the right');return;}
 const action={ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'}[key];
 if(!action)return;
 controller.command(action);
 updateUI();
}
$('#start').onclick=start;$('#pause').onclick=()=>showMenu();$('#restart').onclick=()=>showMenu('restart');
$('#character-version').onclick=toggleCharacterVersion;
$('#route').onclick=requestRoute;
for(const b of document.querySelectorAll('[data-difficulty]'))b.onclick=()=>chooseDifficulty(b.dataset.difficulty);
addEventListener('keydown',e=>{
 if(e.key==='Tab'&&state.menu){e.preventDefault();menuIndex=(menuIndex+(e.shiftKey?-1:1)+menuItems.length)%menuItems.length;focusMenu();return;}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Select','Escape','p','P','r','R','m','M','v','V'].includes(e.key)){
  e.preventDefault();if(e.repeat||held.has(e.key))return;held.add(e.key);handleKey(e.key);
 }
});
addEventListener('keyup',e=>held.delete(e.key));
function onBlur(){held.clear();if(state.started&&!state.menu&&!controller?.arrived)showMenu();}
addEventListener('blur',onBlur);document.addEventListener('visibilitychange',()=>{if(document.hidden)onBlur();});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
function label(text) {
  const c=document.createElement('canvas');c.width=c.height=256;
  const x=c.getContext('2d');x.fillStyle='#f0cd80';x.beginPath();x.arc(128,128,94,0,Math.PI*2);x.fill();
  x.lineWidth=3;x.strokeStyle='#fff2c0';x.stroke();x.fillStyle='#2c3f3e';
  x.font='110px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,132);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));
  sprite.scale.set(2.1,2.1,2.1);return sprite;
}
function addWorldAccents() {
  const box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
  const stones=new THREE.InstancedMesh(box,new THREE.MeshStandardMaterial({color:'#b6a082',roughness:1}),map.nodes.length*6);
  let index=0;
  for(const node of map.nodes)for(let i=0;i<6;i++) {
    const p=nodeWorld(node.xy,map),seed=Math.sin(p.x*78.233+p.z*31.18+i*47.1)*43758.5453,r=seed-Math.floor(seed);
    dummy.position.set(p.x-1.5+r*3,.018,p.z-1.5+((r*7)%1)*3);
    dummy.rotation.set(0,r*Math.PI,0);dummy.scale.set(.16+r*.16,.035,.13+r*.18);
    dummy.updateMatrix();stones.setMatrixAt(index++,dummy.matrix);
  }
  stones.receiveShadow=true;worldGroup.add(stones);
  const goal=nodeWorld(map.end,map);
  goalRing=new THREE.Mesh(new THREE.TorusGeometry(1.2,.055,8,64),new THREE.MeshStandardMaterial({color:'#f2c774',emissive:'#ebc77b',emissiveIntensity:.65}));
  goalRing.rotation.x=Math.PI/2;goalRing.position.set(goal.x,.10,goal.z);scene.add(goalRing);
  goalMarker=label('1');goalMarker.position.set(goal.x,5.7,goal.z);scene.add(goalMarker);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.5,17,24,1,true),new THREE.MeshBasicMaterial({color:'#f4cf83',transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}));
  beam.position.set(goal.x,8.5,goal.z);scene.add(beam);
  // Ground halo and a direction cue keep the character readable at intersections.
  const halo=new THREE.Mesh(new THREE.RingGeometry(.63,.7,48),new THREE.MeshBasicMaterial({color:'#8edfc8',transparent:true,opacity:.7,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.03;avatar.add(halo);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.14,.35,3),new THREE.MeshBasicMaterial({color:'#a4e8d5'}));
  arrow.rotation.x=Math.PI/2;arrow.position.set(0,.04,.95);avatar.add(arrow);
}

function updateCamera(dt,instant=false){
 const heading=state.started?controller.heading:0,front=!state.started,sign=front?1:-1;
 desiredCamera.set(controller.x+Math.sin(heading)*8*sign,front?3.4:7.1,controller.z+Math.cos(heading)*8*sign);
 targetLook.set(controller.x,1.15,controller.z);const damping=instant?1:1-Math.exp(-7*dt);
 camera.position.lerp(desiredCamera,damping);smoothLook.lerp(targetLook,damping);camera.lookAt(smoothLook);
 const origin=new THREE.Vector3(controller.x,1.1,controller.z),dir=camera.position.clone().sub(origin);
 ray.set(origin,dir.clone().normalize());ray.far=dir.length();
 const activeWalls=walls.filter(wall=>wall.visible);
 const occluded=new Set(ray.intersectObjects(activeWalls,false).map(hit=>hit.object.userData.villageRoot));
 for(const wall of activeWalls){const target=occluded.has(wall.userData.villageRoot)?.2:1;for(const m of (Array.isArray(wall.material)?wall.material:[wall.material])){m.opacity+=(target-m.opacity)*(1-Math.exp(-10*dt));
  m.transparent=m.opacity<.99;m.depthWrite=m.opacity>.65;}}
 nightVillage?.update(controller,dt);
 sun.position.set(controller.x-18,38,controller.z+22);sun.target.position.set(controller.x,0,controller.z);
}
function updateRoute(){
 if(!state.started||!run.routeVisible){if(routeLine)routeLine.visible=false;return;}
 const r=controller.route();
 const key=[...r.ids,Math.round(controller.x*2),Math.round(controller.z*2)].join('|');
 if(key===lastRouteKey){if(routeLine)routeLine.visible=true;return;}lastRouteKey=key;
 if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
 if(r.points.length<2)return;
 const path=new THREE.CurvePath(),pts=r.points.map(p=>new THREE.Vector3(p.x,.085,p.z));
 for(let i=1;i<pts.length;i++)path.add(new THREE.LineCurve3(pts[i-1],pts[i]));
 routeLine=new THREE.Mesh(new THREE.TubeGeometry(path,pts.length*5,.055,4,false),new THREE.MeshBasicMaterial({color:'#68ccb5'}));scene.add(routeLine);
}
function updateFootprints(){
 const prints=controller.trail.items.slice(-FOOTPRINT_CAPACITY);footMesh.count=prints.length;footGlow.count=prints.length;
 prints.forEach((p,i)=>{footDummy.position.set(p.x,.046,p.z);footDummy.rotation.set(0,p.heading,0);footDummy.updateMatrix();
  footMesh.setMatrixAt(i,footDummy.matrix);footDummy.position.y=.041;footDummy.updateMatrix();footGlow.setMatrixAt(i,footDummy.matrix);footprintAlpha.setX(i,controller.trail.opacity(p)*.8);});
 footMesh.instanceMatrix.needsUpdate=true;footGlow.instanceMatrix.needsUpdate=true;footprintAlpha.needsUpdate=true;
}
function drawMap(){
 const local=run.config.map==='local',size=350,scale=local?size/(LOCAL_RADIUS*2):size/Math.max(map.width_m,map.height_m);
 const center=local?{x:controller.x,z:controller.z}:{x:map.width_m/2,z:map.height_m/2};
 const point=p=>({x:(p.x-center.x)*scale+size/2,z:(p.z-center.z)*scale+size/2});
 ctx.clearRect(0,0,size,size);ctx.save();
 if(local){ctx.beginPath();ctx.arc(175,175,173,0,Math.PI*2);ctx.clip();}
 ctx.fillStyle='#203b41';ctx.fillRect(0,0,size,size);
 for(const solid of map.solids){
  const [x,z,x2,z2]=solid.rect,p=point({x,z});
  ctx.fillStyle=['home','market','animal-stall'].includes(solid.kind)?'#c5ac87':'#7b8d80';
  ctx.fillRect(p.x,p.z,(x2-x)*scale+.1,(z2-z)*scale+.1);
 }
 if(run.routeVisible){ctx.strokeStyle='#77d4b6';ctx.lineWidth=local?3:2;ctx.beginPath();
  controller.route().points.forEach((p,i)=>{p=point(p);ctx[i?'lineTo':'moveTo'](p.x,p.z);});ctx.stroke();}
 for(const footprint of controller.trail.items){
  if(!visibleOnMap(run,controller,footprint))continue;const p=point(footprint);
  ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-footprint.heading);ctx.globalAlpha=controller.trail.opacity(footprint);
  ctx.shadowColor='#72ffd0';ctx.shadowBlur=5;ctx.fillStyle='#a3ffe2';ctx.fillRect(-Math.max(.6,scale*.08),-Math.max(1,scale*.15),Math.max(1.2,scale*.16),Math.max(2,scale*.30));ctx.restore();
 }
 const goal=nodeWorld(map.end,map);
 if(visibleOnMap(run,controller,goal)){
  const p=point(goal);ctx.fillStyle='#f2cd7d';ctx.beginPath();ctx.arc(p.x,p.z,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#243536';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1',p.x,p.z+.5);
 }
 const p=point(controller);ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-controller.heading);
 ctx.fillStyle='#8aecd3';ctx.strokeStyle='#153435';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,9);ctx.lineTo(-6,-6);ctx.lineTo(0,-3);ctx.lineTo(6,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.restore();
 if(local){ctx.strokeStyle='#a5c8b575';ctx.lineWidth=2;ctx.beginPath();ctx.arc(175,175,173,0,Math.PI*2);ctx.stroke();}
}
const arrowLabels={left:'Turn left',forward:'Go straight',right:'Turn right',back:'Turn around'};
const arrowRotation={left:-90,forward:0,right:90,back:180};
function updateDecision(){
 const d=controller.decision,phase=controller.phase;
 let options=[];
 if(!state.menu&&phase!=='turning'){
  if(d){
   options=d.options;
   if(run.routeVisible&&controller.suggestedAction==='back')options=[...options,{action:'back'}];
  }else if(phase==='deadend')options=[{action:'back'}];
  else if(phase==='stopped')options=[{action:'forward'}];
 }
 $('#decisions').hidden=!options.length;
 const choices=$('#choices');
 const signature=`${d?.id}:${d?.selected}:${phase}:${run.routeVisible}:${state.menu}`;
 // Preserve button nodes/focus while the character approaches the junction.
 if(choices.dataset.signature!==signature){
  choices.dataset.signature=signature;choices.replaceChildren();
  for(const option of options){
   const action=option.action,b=document.createElement('button');
   const queued=!!d&&option.next!==undefined&&option.next===d.selected;
   const suggested=run.routeVisible&&(action===controller.suggestedAction||phase==='deadend');
   b.dataset.action=action;b.classList.toggle('queued',queued);b.classList.toggle('suggested',suggested);
   const label=phase==='stopped'?'Resume walking':arrowLabels[action];
   b.setAttribute('aria-label',`${label}${suggested?' · Route recommendation':''}${queued?' · Queued':''}`);
   if(d)b.setAttribute('aria-pressed',String(queued));
   b.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="transform:rotate(${arrowRotation[action]}deg)"><path d="M16 26V6M7 15l9-9 9 9"/></svg>`;
   b.onclick=()=>{if(state.started&&!state.menu)controller.command(action,d?.id);updateUI();};
   choices.append(b);
  }
 }
 const announcementKey=`${d?.id}:${d?.selected}:${phase}:${state.menu}`;
 if(lastPhase!==announcementKey){
  lastPhase=announcementKey;
  $('#decision-announcement').textContent=state.menu?'':phase==='deadend'?'Dead end. Down to turn around.':
   phase==='stopped'?'Up to resume walking.':d?(d.selected?'Turn queued.':`${phase==='waiting'?'Choose your path.':'Junction approaching.'} ${d.options.map(o=>arrowLabels[o.action]).join(', ')}.`):'';
 }
}
function updateUI(){
 if(!state.ready)return;
 $('#difficulty-badge').textContent=run.config.label;
 $('#run-status').textContent=run.routeVisible?'GUIDED WALK':'FIND YOUR OWN WAY';
 $('#map-title').textContent=run.config.map==='local'?'NEARBY CORRIDORS':'VILLAGE MAP';
 $('#map-panel').classList.toggle('local',run.config.map==='local');
 $('#map-note').textContent=run.config.map==='local'?'12 m radius · footprints fade':'Full map · footprints fade';
 $('#route').hidden=!state.started||run.routeVisible;
 $('#route-status').hidden=!run.routeVisible;$('#route-status').textContent=run.routeSource==='difficulty'?'Route included on Easy':'Guided run';
 $('#pause').disabled=!state.started||controller.arrived;
 $('#travelled').textContent=`${Math.round(controller.distance)} m explored`;
 if(state.started){drawMap();updateDecision();}updateRoute();
}
function animate(time){
 requestAnimationFrame(animate);const dt=Math.min((time-previousTime)/1000||.016,.05);previousTime=time;if(!state.ready)return;
 const oldDistance=controller.distance;
 if(state.started&&!state.menu&&!controller.arrived)controller.step(dt);
 if(controller.arrived&&state.menu!=='result')showMenu('result');
 const movement=(controller.distance-oldDistance)/dt;
 const targetGait=THREE.MathUtils.clamp((movement-WALK_SPEED)/(RUN_SPEED-WALK_SPEED),0,1);
 gaitBlend+=(targetGait-gaitBlend)*(1-Math.exp(-7*dt));
 characters.update(dt,{controller,movement,gaitBlend,paused:!state.started||!!state.menu});environment.update(dt);
 avatar.rotation.y=state.started?controller.heading:0;avatar.position.set(controller.x,0,controller.z);updateCamera(dt);updateFootprints();
 const goal=nodeWorld(map.end,map),distance=Math.hypot(goal.x-controller.x,goal.z-controller.z);
 goalMarker.position.y=3+Math.min(1,distance/30)*2.7+Math.sin(time*.0015)*.12;
 if(time-lastUI>90){updateUI();lastUI=time;}
 if(time>toastTime)$('#toast').classList.remove('visible');renderer.render(scene,camera);
}
async function init(){
 try{
  const response=await fetch('/maps/village/maze-layout.json');if(!response.ok)throw new Error('Maze map could not be loaded');
  map=await response.json();controller=new Controller(map);
  const loader=new GLTFLoader();characters=new CharacterVariants(avatar);characters.version=state.characterVersion;
  const [world]=await Promise.all([loader.loadAsync('/assets/village-world.glb'),characters.load(loader)]);
  worldGroup.add(world.scene);
  world.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  world.scene.traverse(group=>{if(group.userData.foundry_id||group.name==='Arrival_shelter'){
   if(group.userData.foundry_id)solidGroups.push(group);
   group.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.userData.villageRoot=group.uuid;walls.push(o);}});
  }});
  environment=new EnvironmentVariants(worldGroup,map,world.scene);environment.version=state.characterVersion;
  await environment.load(loader);walls.push(...environment.occluders);
  nightVillage=createNightVillage(scene,map);addWorldAccents();state.ready=true;chooseDifficulty('medium');setCharacterVersion(state.characterVersion,false);$('#character-version').disabled=false;updateCamera(1,true);$('#loading').hidden=true;
  window.watchGame={getState:()=>({...controller.snapshot(),ready:state.ready,started:state.started,menu:state.menu,
   ...run.result(),mapMode:run.config.map,routeVisible:run.routeVisible,drawCalls:renderer.info.render.calls,
   night:true,lanternCount:nightVillage.count,wallLanternCount:nightVillage.wallCount,activeLampLimit:nightVillage.activeLightLimit,wallCount:solidGroups.length,characterPivots:characters.pivots,
   characterVersion:state.characterVersion,environmentVersion:environment.version,environment:environment.getState(),characterAnimation:characters.animation,characterAnimations:characters.availableAnimations,
   characterCalibration:characters.calibration,mapSeed:map.seed,gaitBlend,footprintCapacity:FOOTPRINT_CAPACITY}),
   // Adapter for future remote transport. Decision IDs prevent stale choices on later approaches.
   command:(action,decisionId)=>{if(state.started&&!state.menu)return controller.command(action,decisionId);return false;}};
  if(new URLSearchParams(location.search).has('qa'))window.watchGame.qa={controller,run,map,handleKey,start,chooseDifficulty,setCharacterVersion,environment,
   geometry:()=>solidGroups.map(o=>{const b=new THREE.Box3().setFromObject(o);return {name:o.name,rect:o.userData.solid_rectangle_tiles,kind:o.userData.village_kind,min:b.min.toArray(),max:b.max.toArray()};}),
   environmentFits:()=>environment.fits,
   mapPixel:(x,y)=>[...ctx.getImageData(x,y,1,1).data]};
  requestAnimationFrame(animate);
 }catch(error){console.error(error);$('#loading-text').textContent=`Could not load the prototype: ${error.message}. Check the local server and assets.`;}
}
init();

// Show actual resource counts without treating the animation as progress.
THREE.DefaultLoadingManager.onProgress=(_url,loaded,total)=>window.storyLoading?.status(`Preparing models: ${loaded} of ${total} resources ready…`);
THREE.DefaultLoadingManager.onError=()=>window.storyLoading?.fail('A model could not download. Check your connection and retry.');
