import {StoryDiorama} from '../vendor/story-diorama/story-diorama.mjs';
const image=name=>new URL(`../assets/house-3/${name}.png`,import.meta.url).href;
const sightingCues=[
 {title:'At the door',text:'You hear footsteps. Someone is coming to the door.',image:image('lit-door-v2'),alt:'Warm light shines through the window beside the closed wooden door.'},
 {title:'Shepherd',text:'“We’re looking for a couple travelling with a donkey. Have you seen them?”',image:image('opening-door-v2'),alt:'The door opens inward and a resident looks out from the warm interior.'},
 {title:'Resident',text:'“Yes, I saw them earlier. They were looking for somewhere to stay.”',image:image('helpful-resident-v2'),alt:'A serious, attentive resident in a plain brown linen tunic stands beside the open door.'},
 {title:'Resident',text:'“They went up the lane toward the gate. Try there—you may find someone who can help.”',image:image('helpful-resident-v2'),alt:'The resident speaks gently from his warmly lit doorway.'}
];

const adviceImage=name=>new URL(`../assets/house-8/${name}.png`,import.meta.url).href;
const adviceCues=[
 {title:'At the door',text:'You hear footsteps. Someone is coming to the door.',image:adviceImage('closed-door'),alt:'House 8’s lit undivided window sits left of its closed plank door, with the ring on the left.'},
 {title:'Shepherd',text:'“Have you seen a couple travelling with a donkey?”',image:adviceImage('open-door'),alt:'The door opens inward on its right hinge. A friendly grey-haired man in layered robes greets you with a staff.'},
 {title:'Old man',text:'“I haven’t seen them, friend. But there’s an empty stall beside the gate. They might have stopped there to rest.”',image:adviceImage('open-door'),alt:'The old man offers a kind suggestion from the warmly lit doorway.'},
 {title:'At the door',text:'He gives you a warm smile and closes the door.',image:adviceImage('closed-door'),alt:'The same wooden door is closed again. Warm light remains in the window.'}
];

export function createHouseSightingScene(journey,onChange){
 const $=id=>document.getElementById(id),overlay=$('sighting-overlay'),stage=$('sighting-stage');
 let cues=sightingCues;
 let player=null,previous=null,page=-1,loading=false,failed=false,prepared=false,token=0,focus=null;
 function close(){token++;player?.destroy();player=null;stage.replaceChildren();overlay.hidden=true;document.body.classList.remove('sighting-open');$('review-panel').inert=false;page=-1;loading=false;prepared=false;failed=false;if(focus){focus.focus({preventScroll:true});focus=null;}}
 function prepare(){
  if(loading||prepared)return;loading=true;const generation=++token;
  Promise.all([...new Set(cues.map(c=>c.image))].map(src=>new Promise(resolve=>{
   const img=new Image();const timer=setTimeout(()=>resolve(false),8000);
   img.onload=()=>{clearTimeout(timer);resolve(true);};img.onerror=()=>{clearTimeout(timer);resolve(false);};img.src=src;
  }))).then(results=>{if(generation!==token)return;failed=results.some(v=>!v);prepared=true;loading=false;onChange();});
 }
 function update(){
  const advice=journey.index===6,h=advice?journey.houseAdvice:journey.houseSighting,active=[2,6].includes(journey.index)&&!journey.travel;
  if(previous!==h||!active){if(player||loading||prepared||!overlay.hidden)close();previous=h;}
  if(!active)return;
  cues=advice?adviceCues:sightingCues;
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent=h.phase==='ready'?'A warm light shines inside. Perhaps someone here can help.':h.phase==='knocking'?'You knock on the wooden door.':h.complete?(advice?'An empty stall beside the gate. Perhaps they stopped there to rest.':'They went up the lane toward the gate. Perhaps someone there can help.'):'You wait at the lit door.';
  $('travel-status').textContent=journey.paused?'Paused — continue when ready.':h.complete?(advice?'Follow the lane around the houses to the empty stall.':'Follow the lane to the gate.'):h.phase==='ready'?'Ask at the door.':h.phase==='knocking'?'Knock. Knock. Knock.':'Someone is coming to the door…';
  $('advance').textContent=h.phase==='ready'?'Knock on door':h.complete?(advice?'Explore the empty stall':'Go to the gate'):'Waiting for a response…';
  $('advance').disabled=journey.paused||(h.started&&!h.complete);
  if(h.started&&!h.complete&&!prepared&&!loading)prepare();
  if(h.phase!=='conversation'){if(!overlay.hidden)close();return;}
  if(overlay.hidden){focus=document.activeElement;overlay.hidden=false;document.body.classList.add('sighting-open');$('review-panel').inert=true;$('sighting-next').focus({preventScroll:true});}
  $('sighting-status').textContent=!prepared?'Preparing the illustrated scene…':failed?'Illustrations unavailable. The full conversation is shown below.':'';
  $('sighting-retry').hidden=!failed;
  if(prepared&&!player){
   player=new StoryDiorama(stage,{cues:cues.map(c=>({...c,...(failed?{image:undefined}:{} )}))},{mode:'manual',reveal:'instant',transition:'cut',transitionMs:0,appearance:{number:{visible:false},reference:{visible:false},version:{visible:false},title:{fontSize:'14px',letterSpacing:'.12em'},text:{fontSize:'clamp(20px, 2.4vw, 28px)',lineHeight:'1.4'},image:{fit:'contain',position:'center'},shade:false}});
   player.start();page=-1;
  }
  if(player&&page!==h.page){player.seek(h.page);page=h.page;}
  player?.pause(journey.paused);
  $('sighting-next').disabled=!prepared||journey.paused;
  $('sighting-next').textContent=advice?(h.page===3?'Return to the village':h.page===2?'Thank you':h.page===0?'Ask about the travellers':'Continue'):(h.page===3?'Thank you':h.page===0?'Ask about the travellers':'Continue');
  $('sighting-count').textContent=`${h.page+1} / ${cues.length}`;
 }
 $('sighting-next').onclick=()=>{if(!prepared||journey.paused)return;if(journey.index===6?journey.advanceAdvice():journey.advanceSighting())onChange();};
 $('sighting-retry').onclick=()=>{player?.destroy();player=null;prepared=false;failed=false;prepare();update();};
 overlay.addEventListener('keydown',e=>{
  if(e.key==='Tab'){
   const buttons=[$('pause'),...overlay.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);
   const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
  }
  if(e.key===' '&&e.target===overlay){e.preventDefault();$('sighting-next').click();}
 });
 return {update,getState:()=>({open:!overlay.hidden,loading,failed,page})};
}
