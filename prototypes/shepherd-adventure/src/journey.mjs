import {renderRoutes} from './journey-routes.mjs';
import {blendFrame} from './journey-presentation.mjs';
import {JourneyCamera,routeLookahead} from './journey-camera.mjs';
import * as THREE from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CharacterVariants} from './character-variants.mjs';
import {Journey,NODE,NODES,EDGES,OBSERVATIONS} from './journey-model.mjs';
import {createJourneyWorld,height} from './journey-world.mjs';

export async function createGame(story){
const $=s=>document.querySelector(s),journey=new Journey();
let activated=false;
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#020409');scene.fog=new THREE.Fog('#071020',28,100);
const cameraRig=new JourneyCamera();
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,500);
scene.add(new THREE.HemisphereLight('#91b6dd','#263047',.65));
const moon=new THREE.DirectionalLight('#93b7e9',1.05);moon.position.set(-35,50,25);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-55,right:55,top:65,bottom:-65,near:1,far:160});moon.shadow.normalBias=.06;moon.shadow.bias=-.0003;scene.add(moon,moon.target);
// Broad, soft starlight falls across the settlement while the horizon stays dark.
const starlight=new THREE.SpotLight('#8bb9ff',1800,160,.67,.85,2);
starlight.position.set(-18,62,-28);starlight.target.position.set(0,0,-8);scene.add(starlight,starlight.target);
const star=new THREE.Mesh(new THREE.SphereGeometry(.24,12,8),new THREE.MeshBasicMaterial({color:'#d8e8ff',toneMapped:false,fog:false}));star.position.copy(starlight.position);scene.add(star);
// Soft transparent shaft makes the star's illumination legible from the fields.
const beamGeometry=new THREE.ConeGeometry(24,62,48,1,true);beamGeometry.translate(0,-31,0);
const beam=new THREE.Mesh(beamGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
 vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 view=modelViewMatrix*vec4(position,1.);vView=-view.xyz;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float fade=sin(vUv.y*3.14159)*smoothstep(0.,.4,abs(dot(normalize(vNormal),normalize(vView))));gl_FragColor=vec4(.35,.55,1.,fade*.035);}`}));
beam.position.copy(starlight.position);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),starlight.target.position.clone().sub(starlight.position).normalize());scene.add(beam);
const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=128;const starContext=starCanvas.getContext('2d'),starGradient=starContext.createRadialGradient(64,64,0,64,64,64);starGradient.addColorStop(0,'#ffffff');starGradient.addColorStop(.08,'#e2efffff');starGradient.addColorStop(.25,'#a7caff88');starGradient.addColorStop(1,'#8bb9ff00');starContext.fillStyle=starGradient;starContext.fillRect(0,0,128,128);
const starHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(starCanvas),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,toneMapped:false}));starHalo.position.copy(star.position);starHalo.scale.set(7,7,7);scene.add(starHalo);
const world=createJourneyWorld(scene),avatar=new THREE.Group();scene.add(avatar);const characters=new CharacterVariants(avatar);
const companions=[0,1].map(()=>{const root=new THREE.Group();root.visible=false;scene.add(root);return {root,character:new CharacterVariants(root)};});
let gateShot=null;
let ready=false,last=0,clock=0,signature='',oldPhase='intro',menuIndex=0,heading=Math.PI,desiredHeading=Math.PI,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const held=new Set(),camTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3(),look=new THREE.Vector3();
let lastAnimation=null,introElapsed=0,inspectionShot=null,returnShot=null;
const openingFrame={position:{x:-9,y:8,z:85},look:{x:-4,y:23,z:-8}};
const physicalClues=new Set(['hearth','wick','oil','well','market','square','pen','arch','lookout']);
function currentFrame(){return {position:{...camera.position},look:{...look}};}
function applyFrame(frame){camera.position.set(frame.position.x,frame.position.y,frame.position.z);look.set(frame.look.x,frame.look.y,frame.look.z);camera.lookAt(look);}
function followingFrame(dt,instant=false){const p=journey.position,preview=journey.phase==='intro'?NODE[journey.choice?.to]:null,ahead=routeLookahead(journey.travel)||preview;return cameraRig.update({player:{...p,y:height(p.x,p.z)},heading:ahead?Math.atan2(ahead.x-p.x,ahead.z-p.z):heading,ahead,boxes:world.occluders,dt,instant,portrait:camera.aspect<1});}

let audioContext,audioGain,sound=false,spoken='';
function speak(text){if(!sound||!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.87;u.volume=.85;speechSynthesis.speak(u);}
async function toggleSound(){
 sound=!sound;$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(sound));
 if(sound){try{if(!audioContext){audioContext=new AudioContext();audioGain=audioContext.createGain();audioGain.gain.value=.026;audioGain.connect(audioContext.destination);
  for(const f of [146.83,220,293.66]){const o=audioContext.createOscillator();o.type='sine';o.frequency.value=f;const g=audioContext.createGain();g.gain.value=.14;o.connect(g);g.connect(audioGain);o.start();}
  const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=340;noise.connect(filter);filter.connect(audioGain);noise.start();
 }await audioContext.resume();speak(journey.phase==='intro'?$('#intro>p').textContent:journey.phase==='arrival'?$('#ending>p').textContent:NODE[journey.at].note);}catch{sound=false;$('#sound').textContent='Sound unavailable';}}
 else{audioContext?.suspend();if('speechSynthesis' in window)speechSynthesis.cancel();}
}
function ding(){
 if(!sound||!audioContext)return;
 // A quiet ascending phrase, never a fanfare; opt-in shares the ambience switch.
 for(const [i,f] of [392,493.88,587.33].entries()){
  const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.18;
  o.frequency.value=f;o.type='sine';o.connect(g);g.connect(audioContext.destination);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.025,t+.04);g.gain.exponentialRampToValueAtTime(.001,t+1.3);o.start(t);o.stop(t+1.35);
 }
}
function startOpeningCamera(){activated=true;introElapsed=0;cameraRig.reset();applyFrame(openingFrame);updateUI();}
function reset(){story.close();story.release('ending');gateShot=null;companions.forEach(c=>c.root.visible=false);introElapsed=0;inspectionShot=returnShot=null;cameraRig.reset();journey.reset();signature='';oldPhase='intro';heading=desiredHeading=Math.PI;spoken='';if('speechSynthesis' in window)speechSynthesis.cancel();updateUI();updateCamera(1,true);story.open('opening');}
function begin(){if(!ready)return;introElapsed=10;journey.start();applyFrame(followingFrame(0,true));updateUI();}
const menuButtons=[$('#resume'),$('#back'),$('#remember'),$('#recover'),$('#restart'),$('#look-again')];
function showPause(value){if(!ready||!['choice','walking','inspect','gate-sequence'].includes(journey.phase))return;journey.paused=value;menuIndex=0;$('#back').disabled=journey.phase!=='choice'||!journey.previous;focusMenu();if('speechSynthesis' in window){if(value)speechSynthesis.pause();else speechSynthesis.resume();}updateUI();}
function focusMenu(){menuButtons.forEach((b,i)=>b.classList.toggle('selected',i===menuIndex));if(journey.paused)menuButtons[menuIndex].focus({preventScroll:true});else document.activeElement?.blur();}
function recover(){journey.recover();document.activeElement?.blur();updateUI();updateCamera(1,true);}
function input(key){
 if(!ready)return;
 if(story.active||!activated)return;
 if(journey.phase==='intro'){if(['Enter',' ','Select'].includes(key))begin();else if(key==='ArrowUp')toggleSound();return;}
 if(journey.phase==='arrival'){if(['Enter',' ','Select'].includes(key))reset();return;}
 if(journey.notebook){if(['Enter',' ','Select','Escape'].includes(key)){journey.notebook=false;updateUI();}else if(key==='ArrowUp'||key==='ArrowDown')$('#notes').scrollBy({top:key==='ArrowDown'?120:-120,behavior:reduced?'auto':'smooth'});return;}
 if(journey.paused){if(key==='ArrowDown'||key==='ArrowUp'){do{menuIndex=(menuIndex+(key==='ArrowUp'?-1:1)+menuButtons.length)%menuButtons.length;}while(menuButtons[menuIndex].disabled);focusMenu();}else if(['Enter',' ','Select'].includes(key))menuButtons[menuIndex].click();else if(key==='Escape')showPause(false);return;}
 if(key==='ArrowDown'||key==='Escape'||key==='p'||key==='P'){showPause(true);return;}
 if(journey.phase==='gate-sequence')return;
 if(journey.phase==='inspect'){
  if(['Enter',' ','Select','ArrowUp'].includes(key))journey.closeInspection();updateUI();return;
 }
 if(journey.phase==='walking'){if(['Enter',' ','Select'].includes(key))showPause(true);return;}
 if(key==='ArrowUp'){journey.inspect();updateUI();return;}
 if(key==='ArrowLeft')journey.select(-1);else if(key==='ArrowRight')journey.select(1);else if(['Enter',' ','Select'].includes(key))journey.commit();updateUI();
}
function remember(){journey.paused=false;journey.notebook=true;document.activeElement?.blur();updateUI();}
$('#look-again').onclick=()=>{showPause(false);journey.inspect();updateUI();};
$('#interact').onclick=()=>input('ArrowUp');$('#begin').onclick=begin;$('#prev').onclick=()=>input('ArrowLeft');$('#next').onclick=()=>input('ArrowRight');$('#commit').onclick=()=>input('Enter');$('#survey').onclick=()=>input('ArrowUp');$('#pause').onclick=()=>showPause(true);$('#resume').onclick=()=>showPause(false);$('#back').onclick=()=>{showPause(false);journey.back();updateUI();};$('#remember').onclick=remember;$('#recover').onclick=recover;$('#restart').onclick=reset;$('#again').onclick=reset;$('#sound').onclick=toggleSound;$('#inspect-close').onclick=()=>input('Enter');$('#notes-close').onclick=()=>input('Enter');
addEventListener('keydown',e=>{if(!activated||story.active||!$('#loading').hidden)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Select','Escape','p','P'].includes(e.key)){e.preventDefault();if(e.repeat||held.has(e.key))return;held.add(e.key);input(e.key);}});addEventListener('keyup',e=>held.delete(e.key));
function blur(){held.clear();if(['choice','walking','gate-sequence'].includes(journey.phase)&&!journey.paused&&!journey.notebook)showPause(true);}addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();updateCamera(1,true);});
function drawNotebook(){
 const xy=n=>({x:28+(n.x+32)/60*264,y:20+(n.z-NODE.goal.z)/(NODE.field.z-NODE.goal.z)*228});
 const knownEdges=EDGES.filter(e=>journey.traversed.has(e.id)||(e.requires&&journey.discoveries.has(e.requires)));
 const known=new Set(journey.visited);for(const e of knownEdges){known.add(e.a);known.add(e.b);}
 let svg='';for(const e of knownEdges){const a=xy(NODE[e.a]),b=xy(NODE[e.b]);svg+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#81775f" stroke-width="1.5" ${journey.traversed.has(e.id)?'':'stroke-dasharray="3 3"'}/>`;}
 for(const id of known){const n=NODE[id],p=xy(n);svg+=`<circle cx="${p.x}" cy="${p.y}" r="${id===journey.at?5:3}" fill="${id===journey.at?'#ade1d0':'#c7ac72'}"/><text x="${p.x}" y="${p.y-8}" text-anchor="middle">${n.name.replace('The ','').replace('the ','')}</text>`;}
 $('#memory-map').innerHTML=svg;
 $('#observations').replaceChildren();for(const id of journey.inspected){const el=document.createElement('p'),title=document.createElement('b');title.textContent=OBSERVATIONS[id].title;el.append(title,document.createElement('br'),OBSERVATIONS[id].body);$('#observations').append(el);}
 if(!journey.inspected.size)$('#observations').textContent='No observations yet. Raise your lantern with ↑ when you stop somewhere.';
}
function updateUI(){
 renderRoutes($('#route-choices'),journey,edge=>{journey.commit(edge);updateUI();},index=>{journey.selected=index;});
 if(journey.at==='arch')story.prepare('ending').catch(()=>{});
 const {phase}=journey,n=NODE[journey.at],choice=journey.choice,dest=choice&&NODE[choice.to];
 const actions={field:'Remember the sign',gate:journey.lantern?'Read the village':'Find a light for the road',hearth:journey.lantern?'Rest by the hearth':journey.inventory.has('wick')&&journey.inventory.has('oil')?'Light your lantern':'Examine the empty lamp',wick:'Examine the linen',oil:'Examine the oil jars',well:'Examine the tracks',square:'Read the signs',market:journey.gateOpen?'Look through the gate':'Examine the gate',lookout:'Look beyond the roofs',pen:'Look behind the trough',arch:journey.gateOpen?'Look toward the shelter':'Lift the bar · Light the way',goal:'Look inside the shelter'};
 $('#interact').textContent='↑ '+(actions[journey.at]||'Look closer');$('#interact').classList.toggle('unseen',!journey.inspected.has(journey.at));
 const help=document.createElement('small');help.textContent=journey.inspected.has(journey.at)?'You can look again. Only some places reveal new paths.':'Stop and investigate — walking alone does not reveal clues.';$('#interact').append(help);
 const inventory=journey.inventory;$('#equipment').classList.toggle('equipped',journey.lantern);$('#equipment').innerHTML='<svg viewBox="0 0 26 36" aria-hidden="true"><path d="M9 7V5a4 4 0 0 1 8 0v2M6 9h14l2 20H4L6 9Zm-2 23h18M8 12l2 14h6l2-14M13 17v6"/></svg><div><b>'+ (journey.lantern?'Lantern equipped':'Make a light')+'</b>'+(journey.lantern?'A steady flame for the road':(inventory.has('wick')?'✓ Wick':'○ Wick')+' · '+(inventory.has('oil')?'✓ Oil':'○ Oil')+' · Light at hearth')+'</div>';
 $('#discovery').hidden=!journey.reward;if(journey.reward){$('#reward-title').textContent=journey.reward.title;$('#reward-detail').textContent=journey.reward.detail;}

 document.body.classList.toggle('intro',phase==='intro');document.body.classList.remove('survey');document.body.classList.toggle('ended',phase==='arrival');document.body.classList.toggle('inspecting',phase==='inspect');
 $('#intro').hidden=phase!=='intro';$('#ending').hidden=phase!=='arrival';$('#menu').hidden=!journey.paused;
 $('#decision').hidden=phase!=='choice'||journey.paused||journey.notebook;$('#travel').hidden=!['walking','gate-sequence'].includes(phase)||journey.paused||journey.notebook;$('#fuel').hidden=['intro','arrival','inspect'].includes(phase);$('#notes').hidden=!journey.notebook;
 $('#inspection').hidden=phase!=='inspect'||journey.paused||journey.notebook;
 if(journey.inspection){$('#inspect-title').textContent=journey.inspection.title;$('#inspect-copy').textContent=journey.inspection.body;$('#inspect-tag').textContent=journey.inspection.unlock?'A USEFUL DISCOVERY':'LOOK CLOSELY';}
 $('#survey').textContent=phase==='inspect'?'↑ Return':'↑ Investigate';$('#survey').disabled=phase==='walking';$('#survey').setAttribute('aria-pressed',String(phase==='inspect'));
 $('#pause').textContent=journey.paused?'Paused':'☰';$('#pause').setAttribute('aria-label','Pause and options');$('#place').textContent=n.chapter;$('#chapter-number').textContent=journey.at==='field'?'01 / THE FIELDS':journey.at==='goal'?'03 / THE SHELTER':!journey.lantern?'01 / A LIGHT FOR THE ROAD':'02 / THE SEARCH';
 $('#place-note').textContent=journey.at==='gate'&&!journey.lantern?'A sheltered flame nearby. Make a lantern before following the darker lanes.':n.note;
 if(choice){const known=journey.visited.has(choice.to);$('#lane-name').textContent=`${journey.selected+1} / ${journey.options.length} PATHS`;$('#destination').textContent=known?dest.name:choice.name;$('#cost').textContent=(['gate','welcome'].includes(choice.requires)&&!journey.gateOpen)?'Lift the bar from behind · ↑ Interact':journey.at==='gate'&&!journey.lantern&&!['field','hearth'].includes(choice.to)?'Too dark ahead · Prepare a lantern at the hearth':known?'A place you remember · OK Walk':'Beyond the next bend · OK Explore';$('#commit').classList.remove('blocked');$('#commit').setAttribute('aria-label',`${$('#destination').textContent}. ${$('#cost').textContent}.`);}
 if($('#message').textContent!==journey.message){$('#message').textContent=journey.message;$('#message').classList.remove('noticed');void $('#message').offsetWidth;$('#message').classList.add('noticed');}$('#travel-name').textContent=journey.gateSequence?({approach:'Walking to the gate lamp…',light:'Sharing the flame and lifting the bar…',return:'Returning to the passage…',watch:'A way for the shepherds following you…'}[journey.gateSequence.stage]):journey.travel?(journey.visited.has(journey.travel.to)?`Back to ${NODE[journey.travel.to].name}`:'Into the next lane…'):'';
 $('#choice-help').textContent='← → Choose · OK Walk · ↑ Investigate · ↓ Options';
 $('#ending-detail').textContent=`${Math.round(journey.distance)} metres through the night. ${journey.inspected.size} places investigated. ${journey.gateOpen?'The gate is lit and open for those following.':'Take a moment here.'}`;
 $('#footer-note').textContent=phase==='arrival'?'Route, clues and village details are creative adaptations.':'A story of arrival · Inspired by Luke 2:8–20';
 if(phase!==oldPhase){if(phase==='inspect'){speak(journey.inspection.body);if(journey.reward)ding();}if(phase==='arrival'){if('speechSynthesis' in window)speechSynthesis.cancel();audioContext?.suspend();story.open('ending');};oldPhase=phase;}
 if(journey.notebook)drawNotebook();
}
function updateCamera(dt,instant=false){
 if(story.active||journey.notebook||journey.paused)return;
 if(journey.phase==='intro'){
  if(!instant&&!document.hidden)introElapsed+=dt;
  const end=followingFrame(0,true);
  // Establish the distant village, then ease into the exact gameplay camera.
  applyFrame(reduced?openingFrame:blendFrame(openingFrame,end,(introElapsed-1.5)/7));
  if(introElapsed>=(reduced?2.5:8.5)){journey.start();applyFrame(end);updateUI();}
  return;
 }
 if(journey.phase==='gate-sequence'){
  inspectionShot=returnShot=null;
  if(journey.gateSequence.stage==='watch'){
   if(!gateShot)gateShot={from:currentFrame(),elapsed:0};gateShot.elapsed+=dt;
   const lead=journey.followers[0],gate=world.clueTargets.arch;
   const target=lead?.visible&&lead.z<NODE.arch.z?{x:lead.x,y:height(lead.x,lead.z)+1,z:lead.z}:gate;
   gateShot.aim??={...gate};for(const axis of ['x','y','z'])gateShot.aim[axis]+=(target[axis]-gateShot.aim[axis])*(1-Math.exp(-1.3*dt));
   const destination={position:{x:NODE.arch.x-6,y:height(NODE.arch.x,NODE.arch.z)+5,z:NODE.arch.z-7},look:gateShot.aim};
   applyFrame(blendFrame(gateShot.from,destination,gateShot.elapsed/3));
  }else applyFrame(followingFrame(dt,instant));
  return;
 }
 if(gateShot){cameraRig.position={...camera.position};cameraRig.look={...look};gateShot=null;}
 if(journey.phase==='inspect'){
  if(!inspectionShot){
   const from=currentFrame(),home=returnShot?.home||from,target=world.clueTargets[journey.at];let destination=home;
   if(physicalClues.has(journey.at)&&target){
    // Keep the camera arm still for close clues; only the overlook needs elevation.
    destination={position:{...home.position},look:{...target}};
    if(journey.at==='lookout'){destination.position.y+=4;destination.look={x:-2.5,y:0,z:-19};}
   }
   inspectionShot={from,home,destination,elapsed:0};returnShot=null;
  }
  inspectionShot.elapsed+=dt;
  applyFrame(reduced?inspectionShot.home:blendFrame(inspectionShot.from,inspectionShot.destination,inspectionShot.elapsed/3));return;
 }
 if(inspectionShot){const from=currentFrame(),home=inspectionShot.home;const changed=['position','look'].some(part=>['x','y','z'].some(axis=>Math.abs(from[part][axis]-home[part][axis])>.001));returnShot=changed?{from,home,elapsed:0}:null;inspectionShot=null;}
 if(returnShot){returnShot.elapsed+=dt;applyFrame(reduced?returnShot.home:blendFrame(returnShot.from,returnShot.home,returnShot.elapsed/2.6));if(returnShot.elapsed>=2.6||reduced){cameraRig.position={...returnShot.home.position};cameraRig.look={...returnShot.home.look};returnShot=null;}return;}
 if(journey.phase==='arrival'){camTarget.set(-4,4,NODE.goal.z+9);lookTarget.set(3,1.4,NODE.goal.z-3);const alpha=instant||reduced?1:1-Math.exp(-1.1*dt);camera.position.lerp(camTarget,alpha);look.lerp(lookTarget,alpha);camera.lookAt(look);return;}
 applyFrame(followingFrame(dt,instant||reduced));
}

function animate(time){
 requestAnimationFrame(animate);const dt=Math.min((time-last)/1000||.016,.05);last=time;if(!ready||!activated||story.active)return;
 const active=!story.active&&!journey.paused&&!journey.notebook,oldDistance=journey.distance;if(active){clock+=dt;if(!returnShot)journey.step(dt);}
 const p=journey.position,movement=(journey.distance-oldDistance)/dt;
 if(p.heading!==undefined)desiredHeading=p.heading;
 heading+=Math.atan2(Math.sin(desiredHeading-heading),Math.cos(desiredHeading-heading))*(1-Math.exp(-8*dt));avatar.position.set(p.x,height(p.x,p.z)+.015,p.z);avatar.rotation.y=heading;
 const running=(journey.travel?.speed||0)>3.6;characters.update(active?dt:0,{controller:{phase:journey.phase,gait:running?'run':'walk'},movement,gaitBlend:running?1:0,paused:!active});
 if(characters.animation!==lastAnimation){lastAnimation=characters.animation;console.info('Journey motion: '+lastAnimation);}
 companions.forEach((c,i)=>{const f=journey.followers[i];c.root.visible=!!f?.visible;if(!f)return;c.root.position.set(f.x,height(f.x,f.z)+.015,f.z);c.root.rotation.y=f.heading;c.character.update(active?dt:0,{controller:{phase:f.moving?'walking':'choice',gait:'run'},movement:f.moving?4.6:0,gaitBlend:1,paused:!active});});
 world.update(active?dt:0,clock,journey,heading,reduced);updateCamera(dt);const fadedObjects=world.updateOcclusion(camera,p,dt,journey.phase==='inspect');
 const next=[journey.phase,journey.gateSequence?.stage,journey.at,journey.selected,journey.paused,journey.notebook,journey.inspected.size,journey.message].join('|');if(next!==signature){signature=next;updateUI();}
 renderer.render(scene,camera);
}
try{
 const loader=new GLTFLoader(),cache=new Map();const characterLoader={loadAsync(url){if(!cache.has(url))cache.set(url,loader.loadAsync(url));return cache.get(url).then(g=>({scene:cloneSkeleton(g.scene),animations:g.animations}));}};await Promise.all([characters.load(characterLoader),...companions.map(c=>c.character.load(characterLoader)),world.dress(loader)]);ready=true;console.info('Journey geometry: '+JSON.stringify({models:world.modelCount,minimumPathClearance:Math.min(...world.fits.map(f=>f.clearance)),fits:world.fits,occluders:world.occluders,occlusionBounds:world.occlusionBounds}));
 const reviewStop={market:'market',gate:'arch',trees:'olive',pen:'pen'}[new URLSearchParams(location.search).get('camera-review')];
 if(reviewStop){journey.start();journey.at=reviewStop;journey.inventory=new Set(['wick','oil','lantern']);journey.discoveries=new Set(['overlook','rear']);journey.visited.add(reviewStop);const banner=document.createElement('div');banner.textContent='CAMERA REVIEW SCENARIO · '+reviewStop+' · staged, not a normal playthrough';banner.style.cssText='position:fixed;top:0;left:0;right:0;text-align:center;font:11px monospace;color:#f5d596;background:#171d25;padding:5px;z-index:20';document.body.append(banner);}
 updateUI();updateCamera(1,true);window.lanternJourney={getState:()=>({...journey.snapshot(),models:world.modelCount,drawCalls:renderer.info.render.calls,camera:cameraRig.lastDiagnostics}),command:input};
 requestAnimationFrame(animate);
 return {startOpeningCamera};
}catch(e){throw e;}
}
