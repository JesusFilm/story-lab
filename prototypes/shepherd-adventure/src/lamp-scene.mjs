import {LAMP_STEPS} from './lamp-assembly.mjs';

export function createLampScene(journey,onChange){
 const $=id=>document.getElementById(id),region=$('lamp-assembly');
 region.innerHTML=`<p id="lamp-progress"></p><div class="lamp-item"><img id="lamp-image" width="512" height="512" alt=""><span class="lamp-item-glow" aria-hidden="true"></span></div><h2 id="lamp-title"></h2><p id="lamp-description"></p><p id="lamp-feedback" role="status" aria-live="polite"></p><button id="lamp-action" class="primary" type="button"></button><button id="lamp-back" class="lamp-secondary" type="button">Back to workbench</button>`;
 let signature='',imageName='',toastRemaining=0;
 $('lamp-image').onerror=()=>{$('lamp-image').hidden=true;$('lamp-feedback').textContent='The item picture could not load. You can still prepare your lamp.';};
 $('lamp-action').onclick=event=>{
  if(event.detail>1||journey.paused)return;
  const a=journey.lampAssembly;
  if(a.lit){if(journey.takeLamp()){toastRemaining=4;$('lamp-reward').hidden=false;}}
  else journey.assembleLamp($('lamp-action').dataset.action);
  update();onChange();(a.open?$('lamp-action'):$('advance')).focus({preventScroll:true});
 };
 $('lamp-back').onclick=()=>{journey.lampAssembly.open=false;update();onChange();$('advance').focus({preventScroll:true});};
 function update(){
  const a=journey.lampAssembly,at=journey.index===0&&!journey.travel,active=at&&a.open;
  document.body.classList.toggle('lamp-scene',at);document.body.classList.toggle('lamp-open',active);
  region.hidden=!active;$('advance').hidden=active;$('beat').hidden=active;$('travel-status').hidden=active;
  if(!a.taken){toastRemaining=0;$('lamp-reward').hidden=true;}
  const key=[active,a.step,journey.paused].join('|');if(signature===key)return;signature=key;
  if(!active)return;
  const item=a.current;
  $('lamp-progress').textContent=item?`${a.step+1} of ${LAMP_STEPS.length} · Prepare your light`:'Ready for the road';
  $('lamp-title').textContent=item?.title||'Your lamp is alight';
  $('lamp-description').textContent=item?.description||'Its warm glow will light the way ahead.';
  $('lamp-feedback').textContent=a.feedback;
  const filename=item?.image||'lamp.png';if(filename!==imageName){imageName=filename;$('lamp-image').hidden=false;$('lamp-image').src=`./assets/lamp-assembly/${filename}`;}
  $('lamp-image').alt=item?.alt||'Your bronze lantern, ready to carry';
  region.classList.toggle('is-lit',a.lit);
  $('lamp-action').textContent=item?.action||'Take lamp';$('lamp-action').dataset.action=item?.id||'take';
  $('lamp-action').disabled=journey.paused;$('lamp-back').disabled=journey.paused;
 }
 function tick(dt){if(toastRemaining>0){toastRemaining=Math.max(0,toastRemaining-dt);if(!toastRemaining)$('lamp-reward').hidden=true;}}
 return {update,tick,begin(){if(journey.lampAssembly.begin()){update();onChange();$('lamp-action').focus({preventScroll:true});}}};
}
