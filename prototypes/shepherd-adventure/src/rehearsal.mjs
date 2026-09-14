import {createEmptyStallScene} from './empty-stall-scene.mjs';
import {createHouseTracksScene} from './house-tracks-scene.mjs';
import {createGateScene} from './gate-scene.mjs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createJourneyScene} from './journey-scene.mjs';
import {createJourneyWorld,height} from './journey-world.mjs';
import {CharacterVariants} from './character-variants.mjs';
import {routeLookahead} from './journey-camera.mjs';
import {animalViewWeight} from './journey-animal-route.mjs';
import {RouteRehearsal,STOPS,CORRIDORS,HOUSE_APPROACHES} from './rehearsal-route.mjs';
import {createHouseSightingScene} from './house-sighting-scene.mjs';
import {createHouseScene} from './house-scene.mjs';
import {createLampScene} from './lamp-scene.mjs';

const $=id=>document.getElementById(id),journey=new RouteRehearsal();
let ready=false,clock=0,last=performance.now(),heading=Math.PI,signature='',renderWidth=0,renderHeight=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motionOverride=false;
$('reduced-motion').checked=reduced;
$('reduced-motion').onchange=()=>{motionOverride=true;reduced=$('reduced-motion').checked;updateUI();};
const {renderer,scene,camera,cameraRig}=createJourneyScene($('world'));
const world=createJourneyWorld(scene,{routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES}),avatar=new THREE.Group();scene.add(avatar);
const character=new CharacterVariants(avatar),samples=[];
const stallScene=createEmptyStallScene(journey,scene,character);
const gateScene=createGateScene(journey,scene,character);
const tracksScene=createHouseTracksScene(journey,scene);
const houseScene=createHouseScene(journey,scene,character);
const sightingScene=createHouseSightingScene(journey,()=>{updateUI();resize();});
const lampScene=createLampScene(journey,()=>{updateUI();resize();});
const lampLook=new THREE.Vector3(),lampEye=new THREE.Vector3(),lampHand=new THREE.Vector3();let lampCamera=0;
const choice=$('jump-point');
for(const stop of STOPS){const option=document.createElement('option');option.value=stop.number-1;option.textContent=`${String(stop.number).padStart(2,'0')} — ${stop.title}`;choice.append(option);}

function updateUI(){
 $("advance").hidden=false;
 const destination=journey.travel?STOPS[journey.travel.index]:null,s=destination||journey.stop;
 $('point-label').textContent=s?`Point ${String(s.number).padStart(2,'0')} / 10`:'Entry walk';
 $('point-title').textContent=s?.title||'A winding walk through the village';
 $('beat').textContent=s?`Scene pending: ${s.beat}`:'Review the walking route and camera. Dialogue, clues and scene actions are placeholders.';
 $('review-state').textContent=journey.staged?'Staged review':'Scenes unfinished';
 $('travel-status').textContent=journey.paused?'Paused — continue when ready.':destination?`Moving to ${destination.title}…`:journey.index===9?'End of route rehearsal. Scene performance and ending remain pending.':journey.index>=0?'Arrived. Take time to review the view.':'Begin with the walk from the field.';
 const next=STOPS[journey.index+1];
 $('advance').textContent=destination?'Moving…':journey.index===9?'Route complete':`${journey.index<0?'Move to':'Move to next point —'} ${journey.index<0?'point 01 — ':''}${next.title}`;
 $('advance').disabled=!ready||journey.paused||!!journey.travel||journey.index===9;
 $('pause').textContent=journey.paused?'Continue':'Pause';$('pause').disabled=!ready;
 $('replay').disabled=!ready;$('jump').disabled=!ready;$('restart').disabled=!ready;$('capture').disabled=!ready;
 document.body.classList.toggle('walking',!!journey.travel);
 document.body.classList.toggle('reduced-motion',reduced);
 if(journey.index===0&&!journey.travel){
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent=journey.lantern?'A steady light. Time to find the others.':'Everything for a small light is laid out here.';
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':journey.lantern?'The first house is just ahead.':'Prepare a lamp before setting out.';
  $('advance').textContent=journey.lantern?'Set out — House 1':journey.lampAssembly.step?'Continue preparing':'Prepare your light';
 }
 lampScene.update();houseScene.update();sightingScene.update();gateScene.update();tracksScene.update();stallScene.update();
}
function resize(){
 const panel=$('review-panel'),width=innerWidth,height=innerWidth<=600?Math.max(140,innerHeight-panel.getBoundingClientRect().height-28):innerHeight;
 if(width===renderWidth&&height===renderHeight)return;
 renderWidth=width;renderHeight=height;renderer.setSize(width,height);$('world').style.height=height+'px';camera.aspect=width/height;camera.updateProjectionMatrix();
}
function pose(dt,instant=false){
 // Essential walking still follows smoothly; stationary arrival reframing cuts
 // directly in reduced motion rather than orbiting around the stopped shepherd.
 instant=instant||(reduced&&!journey.travel);
 const p=journey.position,stop=journey.stop;
 const inspectingTracks=journey.index===4&&!journey.travel&&journey.houseTracks.searchStarted;
 const face=stallScene.face()??(journey.index===8&&!journey.travel?{x:-15.7,z:-29.85}:journey.index===6&&!journey.travel?{x:3.7,z:-19.65}:inspectingTracks?null:journey.index===4&&!journey.travel?{x:22,z:8.5}:journey.index===1&&!journey.travel?{x:-11.3,z:19.35}:journey.index===2&&!journey.travel?{x:-12.3,z:.85}:stop?.target);
 const targetHeading=!journey.travel&&face?Math.atan2(face.x-p.x,face.z-p.z):p.heading;
 const difference=Math.atan2(Math.sin(targetHeading-heading),Math.cos(targetHeading-heading));heading+=instant?difference:difference*(1-Math.exp(-5*dt));
 avatar.position.set(p.x,height(p.x,p.z)+.015,p.z);avatar.rotation.y=heading;
 const ahead=journey.travel?routeLookahead(journey.travel):stop?.target;
 const interest=journey.travel?.index===9?{x:-35,z:-53,y:height(-35,-53)+.7,weight:animalViewWeight(p)}:null;
 const doorFive=journey.index===4&&!journey.travel&&!journey.houseTracks.searchStarted;
 const cameraPlayer=doorFive?STOPS[4].anchor:p;
 const frame=cameraRig.update({player:{...cameraPlayer,y:height(cameraPlayer.x,cameraPlayer.z)},heading:doorFive?Math.atan2(4,1):heading,ahead,boxes:world.occluders,dt,instant,portrait:camera.aspect<1,interest});
 camera.position.set(frame.position.x,frame.position.y,frame.position.z);camera.lookAt(frame.look.x,frame.look.y,frame.look.z);
 const inspecting=journey.index===0&&!journey.travel&&journey.lampAssembly.open;
 const weight=inspecting?1:0;lampCamera=instant?weight:THREE.MathUtils.lerp(lampCamera,weight,1-Math.exp(-4*dt));
 if(lampCamera>.001){
  const portrait=camera.aspect<1;
  lampEye.set(-6.9,height(-10.5,30)+2.35,32.3);
  lampLook.set(-10.5,height(-10.5,30)+1.12,portrait?30:29.2);
  camera.position.lerp(lampEye,lampCamera);const look=new THREE.Vector3(frame.look.x,frame.look.y,frame.look.z).lerp(lampLook,lampCamera);camera.lookAt(look);
 }
 houseScene.tick(reduced);stallScene.poseHands();
 const hand=character.tripo?.model.getObjectByName('R_Hand');
 const carryPosition=hand?hand.getWorldPosition(lampHand):null;
 world.update(instant?10:dt,clock,journey,heading,reduced,carryPosition);
 gateScene.tick(reduced,camera,dt);tracksScene.tick(reduced,camera,instant?10:dt);stallScene.tick(reduced,camera);world.updateOcclusion(camera,p,instant?10:dt);
}
function reposition(){cameraRig.reset();heading=journey.position.heading;clock=0;updateUI();resize();pose(0,true);renderer.render(scene,camera);last=performance.now();}
function next(){if(!ready||journey.paused)return;if(journey.index===7&&!journey.travel&&!journey.emptyStall.complete){stallScene.begin();updateUI();$("review-tools").open=false;return;}if(journey.index===4&&!journey.travel&&!journey.houseTracks.complete){if(journey.houseTracks.phase==='ready')houseScene.begin();else journey.lookAround();updateUI();$('review-tools').open=false;return;}if(journey.index===3&&!journey.travel&&!journey.barredGate.complete){gateScene.begin();return;}if([1,2,6,8].includes(journey.index)&&!journey.travel&&!(journey.index===8?journey.houseOwner:journey.index===6?journey.houseAdvice:journey.index===1?journey.houseRejection:journey.houseSighting).complete){houseScene.begin();$('review-tools').open=false;return;}if(journey.index===0&&!journey.travel&&!journey.lantern){lampScene.begin();$('review-tools').open=false;return;}if(journey.next()){updateUI();$('review-tools').open=false;}}
function pause(){if(!ready)return;journey.paused=!journey.paused;updateUI();}
function timingSummary(){
 return STOPS.flatMap(stop=>{
  const values=samples.filter(s=>s.leg===stop.number),times=values.map(s=>s.ms).sort((a,b)=>a-b);
  if(!times.length)return [];
  const percentile=p=>times[Math.min(times.length-1,Math.ceil(times.length*p)-1)];
  return [{point:stop.number,frames:times.length,median:percentile(.5),p95:percentile(.95),p99:percentile(.99),worst:times.at(-1),over50:times.filter(t=>t>50).length,over100:times.filter(t=>t>100).length,wallSeconds:+(times.reduce((a,b)=>a+b,0)/1000).toFixed(2),maxCalls:Math.max(...values.map(s=>s.calls)),maxTriangles:Math.max(...values.map(s=>s.triangles))}];
 });
}
$('timing-details').addEventListener('toggle',()=>{
 if(!$('timing-details').open)return;
 const report={viewport:[innerWidth,innerHeight],buffer:[renderer.domElement.width,renderer.domElement.height],dpr:devicePixelRatio,userAgent:navigator.userAgent,staged:journey.staged,segments:timingSummary(),limits:'Observed frame intervals during walking, including browser/capture overhead. Paused/hidden time excluded. Replays are combined per point until Restart; not a controlled benchmark.'};
 $('timing-summary').textContent=report.segments.length?report.segments.map(s=>`Point ${s.point}: ${s.frames} frames; median ${s.median} ms; p95 ${s.p95} ms; >50 ms: ${s.over50}`).join('\n'):'Walk a segment to collect a sample.';
 $('timing-summary').dataset.report=JSON.stringify(report);
});
$('advance').onclick=next;$('pause').onclick=pause;
$('jump').onclick=()=>{if(!ready)return;journey.jump(Number(choice.value));$('review-tools').open=false;reposition();};
$('replay').onclick=()=>{if(!ready)return;journey.replay();$('review-tools').open=false;reposition();};
$('restart').onclick=()=>{if(!ready)return;journey.reset();samples.length=0;$('review-tools').open=false;reposition();};
addEventListener('keydown',event=>{
 if(!ready||event.repeat)return;
 if(event.key==='Escape'){event.preventDefault();pause();return;}
 // Native controls retain their normal keyboard behavior, including Enter/Space.
 if(event.target.closest('button,select,summary,a,input'))return;
 if(event.key===' '){event.preventDefault();journey.travel||journey.paused?pause():next();}
});
function pauseOnLeave(){if(ready&&!journey.paused){journey.paused=true;updateUI();}}
addEventListener('blur',pauseOnLeave);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnLeave();});
addEventListener('resize',resize);new ResizeObserver(resize).observe($('review-panel'));
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(!motionOverride){reduced=event.matches;$('reduced-motion').checked=reduced;}});

$('capture').onclick=async()=>{
 $('capture').disabled=true;
 try{
  // Redraw immediately before reading the WebGL canvas; no preserved drawing buffer.
  renderer.render(scene,camera);
  const copy=document.createElement('canvas');copy.width=renderer.domElement.width;copy.height=renderer.domElement.height;
  const context=copy.getContext('2d');context.drawImage(renderer.domElement,0,0);
  const factor=copy.width/renderWidth;context.scale(factor,factor);context.fillStyle='#172025';context.fillRect(0,0,renderWidth,40);context.fillStyle='#f1e7d0';context.font='14px system-ui';
  context.fillText(`ROUTE REHEARSAL · ${journey.travel?'Approaching ':''}${STOPS[journey.travel?.index??journey.index]?.title||'Entry'} · ${journey.staged?'staged':'walkthrough'} · scenes pending`,12,25);
  const blob=await new Promise(resolve=>copy.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');
  const response=await fetch('./__debug/capture',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});
  if(!response.ok)throw Error('Use this prototype’s local serve.py to save captures.');
  const result=await response.json();$('capture-status').textContent=`Saved ${result.path}`;
 }catch(error){$('capture-status').textContent=error.message;}finally{$('capture').disabled=false;}
};

function animate(now){
 requestAnimationFrame(animate);const raw=(now-last)/1000;last=now;
 if(!ready)return;
 const active=!journey.paused&&!document.hidden,dt=active?Math.min(raw,.1):0,moving=!!journey.travel,leg=journey.travel?.index;
 if(active){
  const before=journey.distance;journey.step(dt);clock+=dt;lampScene.tick(dt);
  if(journey.index===7&&!journey.travel&&journey.phase!=='inspect'&&character.tripo){character.tripo.idleSeconds=0;if(journey.distance===before)character.playTripo('idle');}
  character.update(dt,{controller:{phase:journey.phase,gait:journey.gait},movement:dt?(journey.distance-before)/dt:0,gaitBlend:journey.gait==='run'?1:0,paused:false});pose(dt);
 }
 const key=[journey.index,journey.phase,journey.paused,journey.staged,journey.emptyStall.phase,journey.houseTracks.phase,journey.barredGate.phase,journey.houseRejection.phase,journey.houseSighting.phase,journey.houseSighting.page,journey.houseAdvice.phase,journey.houseAdvice.page,journey.houseOwner.phase,journey.houseOwner.page,houseScene.getState().audioFailed].join('|');if(key!==signature){signature=key;updateUI();}
 renderer.render(scene,camera);
 // Real frame intervals, kept per segment. Hidden/paused time is excluded.
 if(active&&moving&&raw>0&&samples.length<60000)samples.push({leg:leg+1,ms:+(raw*1000).toFixed(2),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
}
window.routeRehearsal={getState:()=>({...journey.snapshot(),ready,stall:stallScene.getState(),camera:cameraRig.lastDiagnostics,lamp:world.lampState(),house:houseScene.getState(),sighting:sightingScene.getState(),view:{position:camera.position.toArray(),look:cameraRig.look},buffer:[renderer.domElement.width,renderer.domElement.height],reduced}),getFrameSamples:()=>samples.slice(),getFeatures:()=>world.settlementFeatures.map(f=>({label:f.label,position:f.root.position.toArray(),yaw:f.root.rotation.y}))};
try{
 const manager=new THREE.LoadingManager();manager.onProgress=(_url,loaded,total)=>window.storyLoading.status(`Loading village resources: ${loaded} / ${total}`);
 const loader=new GLTFLoader(manager);window.storyLoading.status('Loading the shepherd and village…');
 await Promise.all([character.load(loader),world.dress(loader)]);
 ready=true;$('review-panel').inert=false;
 const query=new URLSearchParams(location.search),point=Number(query.get('point'));
 if(query.has('point')&&Number.isInteger(point)&&point>=1&&point<=10){journey.jump(point-1);choice.value=point-1;if(query.has('replay'))journey.replay();}
 // Deterministic paused gate pose for matched review captures; never an arrival outcome.
 const gateTime=Number(query.get('gate-time'));
 if(query.has('gate-time')&&journey.index===3&&!journey.travel&&Number.isFinite(gateTime)&&gateTime>=0){journey.tryGate();journey.step(Math.min(5.7,gateTime));journey.paused=true;}
 // Review-only poses run the same state transitions, then pause for capture.
 const stallPose=query.get('stall-pose');
 if(journey.index===7&&!journey.travel&&['search','contact','open','house'].includes(stallPose)){
  const advanceFor=seconds=>{for(let t=0;t<seconds;t+=.05)journey.step(Math.min(.05,seconds-t));};
  if(stallPose!=='search'){advanceFor(3.6);journey.actAtStall();advanceFor(stallPose==='contact'?2.8:4.6);}
  if(['open','house'].includes(stallPose)){journey.actAtStall();advanceFor(stallPose==='open'?4:10.6);}
  character.update(.01,{controller:{phase:'choice'},movement:0,gaitBlend:0,paused:false});journey.paused=true;
 }
 reposition();window.storyLoading.ready();$('advance').focus({preventScroll:true});requestAnimationFrame(animate);
}catch(error){console.error(error);window.storyLoading.fail('The route rehearsal could not load. Reload to try again.');}
