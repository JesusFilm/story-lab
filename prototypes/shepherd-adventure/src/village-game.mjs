import {createCompanionReunionScene} from './companion-reunion-scene.mjs';
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

import {openingActors,INTRO_DURATION} from './journey-model.mjs';
import {blendFrame} from './journey-presentation.mjs';
import {arrivalFrame,ARRIVAL_DURATION} from './journey-arrival.mjs';

export async function createVillageGame(story=null,{review=false}={}){
const $=id=>document.getElementById(id),journey=new RouteRehearsal();
let mode=review?'playing':'waiting',introTime=0,arrivalTime=0,arrivalShot=null;
let ready=false,clock=0,last=performance.now(),heading=Math.PI,signature='',renderWidth=0,renderHeight=0;
let stallOrientation=null,debugController=null;
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
const reunionScene=createCompanionReunionScene(journey,scene,character);
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
 $('pause').textContent=review?(journey.paused?'Continue':'Pause'):'';$('pause').disabled=!ready;
 if(!review){$('pause').setAttribute('aria-label',journey.paused?'Close menu':'Open menu');$('pause').setAttribute('aria-expanded',String(journey.paused));$('pause').setAttribute('aria-controls','player-options');$('pause').setAttribute('aria-haspopup','dialog');}
 $('replay').disabled=!ready;$('jump').disabled=!ready;$('restart').disabled=!ready;$('capture').disabled=!ready;
 document.body.classList.toggle('walking',!!journey.travel);
 document.body.classList.toggle('reduced-motion',reduced);
 if(journey.index===0&&!journey.travel){
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent=journey.lantern?'A steady light. Time to find the others.':'Everything for a small light is laid out here.';
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':journey.lantern?'The first house is just ahead.':'Prepare a lamp before setting out.';
  $('advance').textContent=journey.lantern?'Set out — House 1':journey.lampAssembly.step?'Continue preparing':'Prepare your light';
 }
 lampScene.update();houseScene.update();sightingScene.update();gateScene.update();tracksScene.update();stallScene.update();reunionScene.update();
 if(stallOrientation&&stallOrientation.phase!=='departing'){
  $('beat').textContent='';
  $('advance').textContent=stallOrientation.phase==='revealing'?'Looking toward the stall…':'Go to the stall';
  $('advance').disabled=journey.paused||stallOrientation.phase==='revealing';
 }
 if(!review){
  $('review-panel').hidden=mode!=='playing'||!!journey.travel||journey.paused;
  $('review-header').hidden=mode==='waiting'||mode==='ending'||mode==='complete';
  $('skip-opening').hidden=mode!=='intro';
  $('player-options').hidden=!journey.paused;
  $('sighting-overlay').inert=journey.paused;
  document.body.dataset.storyPhase=mode;
  $('player-reduced').checked=reduced;
  $('player-finish').hidden=mode!=='complete';
  $('travel-status').hidden=!/unavailable|could not/i.test($('travel-status').textContent)&&!(journey.index===8&&['question','directions','invitation'].includes(journey.reunion.phase));
  if(journey.index<0){$('beat').textContent='A lamp will light the way.';$('advance').textContent='Go to the lamp workbench';}
  if(journey.index===0)$('advance').textContent=journey.lantern?'Try the first house':'Get a lamp!';
  // Apply the reviewed action-only pattern only outside deferred house scenes.
  const houseApproach=[1,2,4,6,8].includes(journey.index);
  // Scene state selects a component; shared CSS owns placement and appearance.
  document.body.dataset.uiPanel=journey.lampAssembly.open?'preparation':journey.index===8&&journey.houseOwner.complete?'conversation':houseApproach?'house':'exploration';
  const actionOnly=!$('beat').textContent.trim()||journey.index<0||journey.index===0;
  document.body.classList.toggle('action-only',actionOnly);
  // Let visible movement carry beats with neither dialogue nor an available action.
  if(!$('beat').textContent.trim()&&($('advance').hidden||$('advance').disabled)&&$('travel-status').hidden)$('review-panel').hidden=true;
  if(journey.index<0)$('advance').textContent='Find a lamp';

 }
}
function resize(){
 const panel=$('review-panel'),width=innerWidth,height=innerWidth<=600&&review?Math.max(140,innerHeight-panel.getBoundingClientRect().height-28):innerHeight;
 if(width===renderWidth&&height===renderHeight)return;
 renderWidth=width;renderHeight=height;renderer.setSize(width,height);$('world').style.height=height+'px';camera.aspect=width/height;camera.updateProjectionMatrix();
}
function pose(dt,instant=false){
 // Essential walking still follows smoothly; stationary arrival reframing cuts
 // directly in reduced motion rather than orbiting around the stopped shepherd.
 instant=instant||(reduced&&!journey.travel);
 const p=journey.position,stop=journey.stop;
 const inspectingTracks=journey.index===4&&!journey.travel&&journey.houseTracks.searchStarted;
 const face=reunionScene.face()??stallScene.face()??(journey.index===8&&!journey.travel?{x:-15.7,z:-29.85}:journey.index===6&&!journey.travel?{x:3.7,z:-19.65}:inspectingTracks?null:journey.index===4&&!journey.travel?{x:22,z:8.5}:journey.index===1&&!journey.travel?{x:-11.3,z:19.35}:journey.index===2&&!journey.travel?{x:-12.3,z:.85}:stop?.target);
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
 houseScene.tick(reduced);stallScene.poseHands();reunionScene.poseHands();reunionScene.poseActors(dt,instant);
 const hand=character.tripo?.model.getObjectByName('R_Hand');
 const carryPosition=hand?hand.getWorldPosition(lampHand):null;
 world.update(instant?10:dt,clock,journey,heading,reduced,carryPosition);
 gateScene.tick(reduced,camera,dt);tracksScene.tick(reduced,camera,instant?10:dt);stallScene.tick(reduced,camera);reunionScene.tick(camera,reduced);
 if(stallOrientation){
  const shot=stallOrientation;shot.time+=dt;
  const wide={position:{x:-7,y:height(-7,-18)+(camera.aspect<1?24:16),z:-3},look:{x:-10,y:height(-10,-16)+1,z:-16}};
  const current={position:{...camera.position},look:{...cameraRig.look}};
  const view=shot.phase==='departing'?blendFrame(wide,current,reduced?1:shot.time/2):blendFrame(shot.from,wide,reduced?1:shot.time/2.4);
  camera.position.set(view.position.x,view.position.y,view.position.z);camera.lookAt(view.look.x,view.look.y,view.look.z);
  if(shot.phase==='revealing'&&(reduced||shot.time>=2.4)){shot.phase='holding';updateUI();}
  if(shot.phase==='departing'&&(reduced||shot.time>=2))stallOrientation=null;
 }
 world.updateOcclusion(camera,p,instant?10:dt);
}
function reposition(){stallOrientation=null;cameraRig.reset();heading=journey.position.heading;clock=0;updateUI();resize();pose(0,true);renderer.render(scene,camera);last=performance.now();}
function next(){if(!ready||journey.paused||mode!=='playing'||story?.active)return;if(journey.index===6&&!journey.travel&&journey.houseAdvice.complete){
 if(!stallOrientation){stallOrientation={phase:'revealing',time:0,from:{position:{...camera.position},look:{...cameraRig.look}}};updateUI();return;}
 if(stallOrientation.phase!=='holding')return;
 if(journey.next()){stallOrientation.phase='departing';stallOrientation.time=0;updateUI();}return;
 }if(journey.index===8&&!journey.travel&&journey.houseOwner.complete&&!journey.reunion.canFollow){if(journey.advanceReunion()){updateUI();$("review-tools").open=false;}return;}if(journey.index===7&&!journey.travel&&!journey.emptyStall.complete){stallScene.begin();updateUI();$("review-tools").open=false;return;}if(journey.index===4&&!journey.travel&&!journey.houseTracks.complete){if(journey.houseTracks.phase==='ready')houseScene.begin();else journey.lookAround();updateUI();$('review-tools').open=false;return;}if(journey.index===3&&!journey.travel&&!journey.barredGate.complete){gateScene.begin();return;}if([1,2,6,8].includes(journey.index)&&!journey.travel&&!(journey.index===8?journey.houseOwner:journey.index===6?journey.houseAdvice:journey.index===1?journey.houseRejection:journey.houseSighting).complete){houseScene.begin();$('review-tools').open=false;return;}if(journey.index===0&&!journey.travel&&!journey.lantern){lampScene.begin();$('review-tools').open=false;return;}if(journey.next()){updateUI();$('review-tools').open=false;}}
function pause(){if(!ready||story?.active||!['playing','intro','arrival'].includes(mode))return;journey.paused=!journey.paused;updateUI();if(!review)(journey.paused?$('player-resume'):$('pause')).focus({preventScroll:true});}
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
function pauseOnLeave(){if(ready&&!journey.paused&&!story?.active&&['playing','intro','arrival'].includes(mode)){journey.paused=true;updateUI();}}
addEventListener('blur',pauseOnLeave);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnLeave();});
addEventListener('resize',resize);new ResizeObserver(resize).observe($('review-panel'));
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(!motionOverride){reduced=event.matches;$('reduced-motion').checked=reduced;}});

$('capture').onclick=async()=>{
 $('capture').disabled=true;
 try{
  // Capture the normal view, including its portrait framing, not the expanded tools layout.
  $('review-tools').open=false;resize();pose(0,true);
  // Redraw immediately before reading the WebGL canvas; no preserved drawing buffer.
  renderer.render(scene,camera);
  const copy=document.createElement('canvas');copy.width=renderer.domElement.width;copy.height=renderer.domElement.height;
  const context=copy.getContext('2d');context.drawImage(renderer.domElement,0,0);
  const factor=copy.width/renderWidth;context.scale(factor,factor);context.fillStyle='#172025';context.fillRect(0,0,renderWidth,40);context.fillStyle='#f1e7d0';context.font='14px system-ui';
  context.fillText(`ROUTE REHEARSAL · ${journey.travel?'Approaching ':''}${STOPS[journey.travel?.index??journey.index]?.title||'Entry'} · ${journey.staged?'staged':'walkthrough'} · scenes unfinished`,12,25);
  const blob=await new Promise(resolve=>copy.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');
  const response=await fetch('./__debug/capture',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});
  if(!response.ok)throw Error('Use this prototype’s local serve.py to save captures.');
  const result=await response.json();$('capture-status').textContent=`Saved ${result.path}`;
 }catch(error){$('capture-status').textContent=error.message;}finally{$('capture').disabled=false;}
};

function animate(now){
 requestAnimationFrame(animate);const raw=(now-last)/1000;last=now;
 if(!ready)return;
 if(debugController){const debugDt=document.hidden?0:Math.min(raw,.1);debugController.update(debugDt);if(debugController.animateAmbience)world.updateNativity(debugDt,reduced);renderer.render(scene,camera);return;}
 const active=!journey.paused&&!document.hidden&&!story?.active&&['playing','intro','arrival'].includes(mode),dt=active?Math.min(raw,.1):0,moving=!!journey.travel,leg=journey.travel?.index;
 if(active){
  const before=journey.distance;
  if(mode==='intro'){
   introTime=Math.min(INTRO_DURATION,introTime+dt);const actors=openingActors(introTime);
   journey.position={...actors.player,z:actors.player.z-2};journey.gait='run';
  }else if(mode==='playing')journey.step(dt);
  clock+=dt;lampScene.tick(dt);
  if(journey.index===7&&!journey.travel&&journey.phase!=='inspect'&&character.tripo){character.tripo.idleSeconds=0;if(journey.distance===before)character.playTripo('idle');}
  character.update(dt,{controller:{phase:journey.phase,gait:journey.gait},movement:mode==='intro'?3.8:dt?(journey.distance-before)/dt:0,gaitBlend:journey.gait==='run'?1:0,paused:false});pose(dt);
  if(mode==='intro'){
   reunionScene.poseOpening(openingActors(introTime).followers,dt);
   const end={position:{...camera.position},look:{...cameraRig.look}};
   const from={position:{x:-3,y:10,z:110},look:{x:0,y:1.5,z:78}},pass={position:{x:-3,y:3.8,z:76},look:{x:0,y:1.2,z:68}};
   const frame=reduced?end:introTime<6?blendFrame(from,pass,introTime/6):blendFrame(pass,end,(introTime-6)/4);
   camera.position.set(frame.position.x,frame.position.y,frame.position.z);camera.lookAt(frame.look.x,frame.look.y,frame.look.z);
   if(introTime>=INTRO_DURATION)finishOpening();
  }
  if(!review&&mode==='playing'&&journey.index===9&&!journey.travel){
   mode='arrival';arrivalTime=0;arrivalShot={position:{...camera.position},look:{...cameraRig.look}};updateUI();
  }
  if(mode==='arrival'){
   arrivalTime+=dt;const frame=arrivalFrame(arrivalShot,arrivalTime,reduced);
   camera.position.set(frame.position.x,frame.position.y,frame.position.z);camera.lookAt(frame.look.x,frame.look.y,frame.look.z);
   avatar.visible=camera.position.distanceTo(avatar.position)>1.8;
   if(arrivalTime>=ARRIVAL_DURATION){mode='ending';updateUI();story.open('ending');}
  }
 }
 const key=[journey.index,journey.phase,journey.paused,journey.staged,journey.emptyStall.phase,journey.houseTracks.phase,journey.barredGate.phase,journey.houseRejection.phase,journey.houseSighting.phase,journey.houseSighting.page,journey.houseAdvice.phase,journey.houseAdvice.page,journey.houseOwner.phase,journey.houseOwner.page,journey.reunion.phase,journey.reunion.canFollow,houseScene.getState().audioFailed].join('|');if(key!==signature){signature=key;updateUI();}
 renderer.render(scene,camera);
 // Real frame intervals, kept per segment. Hidden/paused time is excluded.
 if(active&&moving&&raw>0&&samples.length<60000)samples.push({leg:leg+1,ms:+(raw*1000).toFixed(2),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
}
window.routeRehearsal={getState:()=>({...journey.snapshot(),ready,stall:stallScene.getState(),camera:cameraRig.lastDiagnostics,lamp:world.lampState(),house:houseScene.getState(),sighting:sightingScene.getState(),view:{position:camera.position.toArray(),look:cameraRig.look},buffer:[renderer.domElement.width,renderer.domElement.height],reduced}),getFrameSamples:()=>samples.slice(),getFeatures:()=>world.settlementFeatures.map(f=>({label:f.label,position:f.root.position.toArray(),yaw:f.root.rotation.y}))};
try{
 const manager=new THREE.LoadingManager();manager.onProgress=(_url,loaded,total)=>window.storyLoading.status(`Loading village resources: ${loaded} / ${total}`);
 const loader=new GLTFLoader(manager);window.storyLoading.status('Loading the shepherd and village…');
 await Promise.all([character.load(loader),reunionScene.load(loader),world.dress(loader)]);
 ready=true;$('review-panel').inert=false;
 const query=new URLSearchParams(location.search),point=Number(query.get('point'));
 if(review&&query.has('point')&&Number.isInteger(point)&&point>=1&&point<=10){journey.jump(point-1);choice.value=point-1;if(query.has('replay'))journey.replay();}
 // Direct reunion review, without replaying the accepted owner dialogue.
 if(query.has('reunion')&&journey.index===8&&!journey.travel){journey.knockOnHouse();journey.step(3);for(let i=0;i<4;i++)journey.advanceOwner();}
 // Optional paused review positions run the actual reunion state machine.
 const reunionPose=query.get('reunion-pose');
 if(query.has('reunion')&&journey.index===8&&['gate','group','directions','waiting'].includes(reunionPose)){
  const stepReunion=()=>{journey.step(.05);reunionScene.poseActors(.05,false);};
  for(let i=0;i<600&&journey.reunion.phase==='arriving';i++){stepReunion();if(reunionPose==='gate'&&journey.reunion.actors[0].z<=-13)break;}
  if(reunionPose==='directions'){journey.advanceReunion();for(let i=0;i<16;i++)stepReunion();}
  if(reunionPose==='waiting'){for(let i=0;i<3;i++)journey.advanceReunion();for(let i=0;i<300&&journey.reunion.phase==='departing';i++)stepReunion();}
  journey.paused=true;
 }
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
 reposition();if(review){window.storyLoading.ready();$('advance').focus({preventScroll:true});}requestAnimationFrame(animate);
}catch(error){if(!review)throw error;console.error(error);window.storyLoading.fail('The route rehearsal could not load. Reload to try again.');}
function finishOpening(){mode='playing';journey.position={x:0,z:50,heading:Math.PI};cameraRig.reset();reposition();$('advance').focus({preventScroll:true});}
function startOpeningCamera(){journey.reset();avatar.visible=true;mode='intro';introTime=0;last=performance.now();updateUI();}
function finishStory(){mode='complete';updateUI();$('play-again').focus({preventScroll:true});}
if(!review){
 $('player-options').addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;const controls=[...$('player-options').querySelectorAll('button,input')];
  const index=controls.indexOf(document.activeElement);event.preventDefault();controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
 });
 $('skip-opening').onclick=finishOpening;
 $('player-resume').onclick=pause;
 $('player-restart').onclick=$('play-again').onclick=()=>{journey.reset();avatar.visible=true;mode='waiting';updateUI();story.open('opening');};
 $('player-reduced').checked=reduced;$('player-reduced').onchange=()=>{motionOverride=true;reduced=$('player-reduced').checked;$('reduced-motion').checked=reduced;updateUI();};
}
return {startOpeningCamera,finishStory,startDebug(controller){mode='debug';avatar.visible=false;updateUI();debugController=controller({camera,renderer,scene});}};
}
