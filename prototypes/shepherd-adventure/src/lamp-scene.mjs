
export function createLampScene(journey,onChange,onIgnite=()=>{}){
 const $=id=>document.getElementById(id),region=$('lamp-assembly');
 region.innerHTML=`<div class="lamp-item"><img id="lamp-image" width="512" height="512" alt=""><span class="lamp-item-glow" aria-hidden="true"></span></div><h2 id="lamp-title"></h2><p id="lamp-feedback" role="status" aria-live="polite"></p><button id="lamp-action" class="primary" type="button"></button>`;
 let signature='',imageName='',imageFailed=false,toastRemaining=0;
 $('lamp-image').onerror=()=>{imageFailed=true;$('lamp-image').hidden=true;$('lamp-feedback').textContent='The item picture could not load. You can still prepare your lamp.';};
 $('lamp-action').onclick=event=>{
  if(event.detail>1||journey.paused)return;
  const a=journey.lampAssembly;
  if(a.lit){if(journey.takeLamp()){toastRemaining=4;$('lamp-reward').hidden=false;}}
  else {const action=$('lamp-action').dataset.action;if(journey.assembleLamp(action)&&action==='light')onIgnite();}
  update();onChange();(a.open?$('lamp-action'):$('advance')).focus({preventScroll:true});
 };
 function update(){
  const a=journey.lampAssembly,at=journey.index===0&&!journey.travel,active=at&&a.open;
  document.body.classList.toggle('lamp-scene',at);document.body.classList.toggle('lamp-open',active);
  region.hidden=!active;$('advance').hidden=active;$('beat').hidden=active;$('travel-status').hidden=active;
  if(!a.taken){toastRemaining=0;$('lamp-reward').hidden=true;}
  const key=[active,a.step,journey.paused].join('|');if(signature===key)return;signature=key;
  if(!active)return;
  const item=a.current;
  $('lamp-title').textContent=item?.title||'Lamp is lit';
  // Reserve visible feedback for image failure, not a second instruction.
  const filename=item?.image||'lamp.png';if(filename!==imageName){imageFailed=false;imageName=filename;$('lamp-image').hidden=false;$('lamp-image').src=`./assets/lamp-assembly/${filename}`;}
  $('lamp-feedback').textContent=imageFailed?'The item picture could not load. You can still prepare your lamp.':'';
  $('lamp-image').alt=item?.alt||'Your bronze lantern, ready to carry';
  region.classList.toggle('is-lit',a.lit);
  $('lamp-action').textContent=item?.action||'Take lamp';$('lamp-action').dataset.action=item?.id||'take';
  $('lamp-action').disabled=journey.paused;
 }
 function tick(dt){if(toastRemaining>0){toastRemaining=Math.max(0,toastRemaining-dt);if(!toastRemaining)$('lamp-reward').hidden=true;}}
 return {update,tick,begin(){if(journey.lampAssembly.begin()){update();onChange();$('lamp-action').focus({preventScroll:true});}}};
}
