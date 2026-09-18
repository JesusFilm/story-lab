import {StoryDiorama} from '../vendor/story-diorama/story-diorama.mjs';
const image=name=>new URL(`../assets/house-3/${name}.png`,import.meta.url).href;
const sightingCues=[
 {title:'Shepherd',text:'“Have you seen a couple with a donkey?”',image:image('opening-door-v3'),alt:'The door opens inward and a resident looks out from the warm interior.'},
 {title:'Resident',text:'“Yes. They were looking for somewhere to stay.”',image:image('helpful-resident-v3'),alt:'The resident speaks from his warmly lit doorway.'},
 {title:'Resident',text:'“They went toward the gate. Try there.”',image:image('pointing-right-v1'),alt:'The resident points to his own right, toward the left side of the image, giving directions to the gate.'}
];

const adviceImage=name=>new URL(`../assets/house-8/${name}.png`,import.meta.url).href;
const adviceCues=[
 {title:'Shepherd',text:'“Have you seen a couple with a donkey?”',image:adviceImage('open-door-v2'),alt:'The old man stands in his warmly lit doorway with his staff.'},
 {title:'Old man',text:'“I haven’t seen them. Try the empty stall by the gate. They may be resting there.”',image:adviceImage('open-door-v2'),alt:'The old man gives directions from the open doorway.'}
];

const ownerImage=name=>new URL(`../assets/house-9/${name}.png`,import.meta.url).href;
const ownerCues=[
 {title:'Shepherd',text:'“Have you seen a couple with a donkey?”',image:ownerImage('opening-door-v2'),alt:'The door opens inward on its right hinge. A shorter, full-bodied middle-aged man with a large beard, colorful robes and a wrapped headcloth stands in House 9’s doorway.'},
 {title:'Pen owner',text:'“Yes. The woman was about to give birth.”',image:ownerImage('talking-owner-v2'),alt:'The owner explains matter-of-factly, raising an open hand as he speaks.'},
 {title:'Pen owner',text:'“My house was full, so I offered them a stall in my animal pen.”',image:ownerImage('talking-owner-v2'),alt:'The owner gestures with his hands from the same warmly lit doorway.'},
 {title:'Pen owner',text:'“Follow the pen to the far end. They’re in the stall.”',image:ownerImage('pointing-left-v2'),alt:'The owner points to his left, toward the onward route beside the pen, with the house and open door unchanged.'}
];

export function createHouseSightingScene(journey,onChange,onComplete=()=>{}){
 const $=id=>document.getElementById(id),overlay=$('sighting-overlay'),stage=$('sighting-stage');
 let cues=sightingCues;
 let player=null,previous=null,page=-1,loading=false,failed=false,prepared=false,token=0,focus=null,transitionTimer=null,transitioning=false;
 function close(){if(transitionTimer){clearTimeout(transitionTimer);transitionTimer=null;}transitioning=false;token++;player?.destroy();player=null;stage.replaceChildren();overlay.hidden=true;overlay.classList.remove('sighting-closing');document.body.classList.remove('sighting-open');$('review-panel').inert=false;page=-1;loading=false;prepared=false;failed=false;if(focus){focus.focus({preventScroll:true});focus=null;}}
 function closeWithTransition(){if(overlay.hidden||transitioning)return;transitioning=true;overlay.classList.add('sighting-closing');$('sighting-next').disabled=true;transitionTimer=setTimeout(()=>{transitionTimer=null;close();},220);}
 function prepare(){
  if(loading||prepared)return;loading=true;const generation=++token;
  Promise.all([...new Set(cues.map(c=>c.image))].map(src=>new Promise(resolve=>{
   const img=new Image();const timer=setTimeout(()=>resolve(false),8000);
   img.onload=()=>{clearTimeout(timer);resolve(true);};img.onerror=()=>{clearTimeout(timer);resolve(false);};img.src=src;
  }))).then(results=>{if(generation!==token)return;failed=results.some(v=>!v);prepared=true;loading=false;onChange();});
 }
 function update(){
  const owner=journey.index===8,advice=journey.index===6,h=owner?journey.houseOwner:advice?journey.houseAdvice:journey.houseSighting,active=[2,6,8].includes(journey.index)&&!journey.travel;
  if(previous!==h||!active){if(player||loading||prepared||!overlay.hidden)close();previous=h;}
  if(!active)return;
  cues=owner?ownerCues:advice?adviceCues:sightingCues;
  $('review-state').textContent=journey.staged?'Staged · scene draft':'Scene draft';
  $('beat').textContent='';
  $('travel-status').textContent='';
  $('advance').textContent=h.phase==='ready'?'Knock on door':h.complete?(advice?'':owner?'Follow the others':'Go to the gate'):'';
  $('advance').disabled=journey.paused||(h.started&&!h.complete);
  if(h.started&&!h.complete&&!prepared&&!loading)prepare();
  if(h.phase!=='conversation'){if(!overlay.hidden&&!transitioning)close();return;}
  if(overlay.hidden){focus=document.activeElement;overlay.hidden=false;document.body.classList.add('sighting-open');$('review-panel').inert=true;$('sighting-next').focus({preventScroll:true});}
  $('sighting-status').textContent=!prepared?'Preparing the illustrated scene…':failed?'Illustrations unavailable. The full conversation is shown below.':'';
  $('sighting-retry').hidden=!failed;
  if(prepared&&!player){
   player=new StoryDiorama(stage,{cues:cues.map(c=>({...c,...(failed?{image:undefined}:{} )}))},{mode:'manual',reveal:'instant',transition:'cut',transitionMs:0,appearance:{number:{visible:false},reference:{visible:false},version:{visible:false},title:{fontSize:'14px',letterSpacing:'.12em'},text:{fontSize:'clamp(20px, 2.4vw, 28px)',lineHeight:'1.4'},image:{fit:'contain',position:'center'},shade:false}});
   player.start();page=-1;
  }
  if(player&&page!==h.page){player.seek(h.page);page=h.page;}
  player?.pause(journey.paused);
  $('sighting-next').disabled=!prepared||journey.paused||transitioning;
  $('sighting-next').textContent=h.page===cues.length-1?'Thank you':'Continue';
  $('sighting-count').textContent=`${h.page+1} / ${cues.length}`;
 }
 $('sighting-next').onclick=()=>{if(!prepared||journey.paused||transitioning)return;const changed=journey.index===8?journey.advanceOwner():journey.index===6?journey.advanceAdvice():journey.advanceSighting();if(!changed)return;if((journey.index===8?journey.houseOwner:journey.index===6?journey.houseAdvice:journey.houseSighting).complete){closeWithTransition();onComplete();}onChange();};
 $('sighting-retry').onclick=()=>{player?.destroy();player=null;prepared=false;failed=false;prepare();update();};
 overlay.addEventListener('keydown',e=>{
  if(e.key==='Tab'){
   const buttons=[$('pause'),...overlay.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);
   const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
  }
  if(e.key===' '&&e.target===overlay){e.preventDefault();$('sighting-next').click();}
 });
 return {get active(){return !overlay.hidden;},update,getState:()=>({open:!overlay.hidden,loading,failed,page})};
}
