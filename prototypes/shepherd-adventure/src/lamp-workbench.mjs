export function createLampWorkbench(journey,onChange){
 const panel=document.createElement('section');panel.id='lamp-workbench';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','craft-title');
 panel.innerHTML=`<div class="craft-shade"></div><div class="craft-heading"><small>A LIGHT FOR THE ROAD</small><h2 id="craft-title">A small flame, made by you.</h2></div><button class="craft-leave" aria-label="Leave the workbench">×</button>
 <div class="craft-table"><svg class="craft-lamp" viewBox="0 0 420 440" role="img" aria-label="Lamp cutaway showing wick height and oil level">
 <defs><linearGradient id="bronze"><stop stop-color="#493223"/><stop offset=".28" stop-color="#b08b4e"/><stop offset=".5" stop-color="#e0bd7a"/><stop offset=".7" stop-color="#755332"/><stop offset="1" stop-color="#34291f"/></linearGradient><linearGradient id="glass" x2="1" y2=".3"><stop stop-color="#b5d6d91c"/><stop offset=".45" stop-color="#d3e9e830"/><stop offset="1" stop-color="#63819719"/></linearGradient><linearGradient id="oil" x2="0" y2="1"><stop stop-color="#ffc962"/><stop offset="1" stop-color="#80511e"/></linearGradient><radialGradient id="flame-glow"><stop stop-color="#ffd77788"/><stop offset="1" stop-color="#ffc34b00"/></radialGradient></defs>
 <ellipse cx="210" cy="407" rx="138" ry="19" fill="#100b08" opacity=".5"/>
 <path d="M156 109V66C156 10 264 10 264 66V109" fill="none" stroke="url(#bronze)" stroke-width="12"/>
 <path d="M140 113L127 349H293L280 113Z" fill="url(#glass)" stroke="#dfbd7777" stroke-width="2"/>
 <path d="M131 330L125 388Q210 414 295 388L289 330Z" fill="url(#bronze)" stroke="#422d1b" stroke-width="3"/>
 <path d="M151 344H269V383H151Z" fill="#201b14"/>
 <rect id="craft-oil" x="152" y="381" width="116" height="0" fill="url(#oil)"/>
 <path d="M146 363H160M262 363H276" stroke="#f8e0a8" stroke-width="3"/>
 <path id="craft-cap" d="M170 336L179 310H241L250 336Z" fill="url(#bronze)"/>
 <path id="craft-wick" d="M204 314V291H216V314" fill="#e9d5ad" stroke="#a79570" stroke-width="1"/>
 <path d="M223 285H235" stroke="#f7dda3" stroke-width="3"/>
 <g id="craft-fire"><ellipse cx="210" cy="251" rx="108" ry="115" fill="url(#flame-glow)"/><path d="M210 219C233 250 235 274 211 289C184 274 190 247 210 219" fill="#ffc050"/><path d="M210 252Q227 277 210 287Q199 277 210 252" fill="#fff3c4"/></g>
 <g id="craft-smoke" fill="none" stroke="#9caaa7" stroke-width="8" opacity=".7"><path d="M210 281C174 251 241 238 208 205S228 161 211 139"/></g>
 <path d="M140 114L128 348M280 114L292 348" stroke="url(#bronze)" stroke-width="13"/>
 <g><path d="M124 119L148 86H272L296 119Z" fill="url(#bronze)" stroke="#473020" stroke-width="3"/><path d="M157 101H165M182 101H190M207 101H215M232 101H240M257 101H265" stroke="#35291d" stroke-width="8"/></g>
 </svg><div class="craft-tools"><div class="craft-tool"><span class="tool-symbol">≋</span><b>Linen wick</b><div><button data-craft="insert">Fit wick</button><button data-craft="lower" aria-label="Lower wick">−</button><button data-craft="raise" aria-label="Raise wick">+</button></div></div><div class="craft-tool"><span class="tool-symbol">◒</span><b>Olive oil</b><div><button data-craft="pour">Pour a little</button><button data-craft="drain" aria-label="Pour some oil back">−</button></div></div><div class="craft-tool"><span class="tool-symbol">⌒</span><b>Burner collar</b><button data-craft="cap">Tighten</button></div></div></div>
 <div class="craft-bottom"><p id="craft-status" role="status" aria-live="polite"></p><p id="craft-measure"></p><div class="craft-finish"><button data-craft="spark" class="primary">✦ Strike a spark</button><button data-craft="retry">Try again</button><button id="craft-take" class="primary">Take your light ↗</button></div></div>`;
 document.body.append(panel);const resume=document.createElement('button');resume.id='craft-resume';resume.textContent='Return to the workbench';resume.hidden=true;document.querySelector('#decision')?.append(resume);resume.onclick=()=>{journey.inspect();onChange();};let previousFocus;
 const q=s=>panel.querySelector(s);
 panel.addEventListener('click',e=>{const action=e.target.closest('[data-craft]')?.dataset.craft;if(action){journey.craft.act(action);render();}});
 q('.craft-leave').onclick=()=>{journey.phase='choice';onChange();};
 q('#craft-take').onclick=()=>{if(journey.finishCraft())onChange();};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();q('.craft-leave').click();}if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden&&b.offsetParent);if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});
 function render(){
  const visible=journey.phase==='craft';resume.hidden=!(document.querySelector('#route-choices')&&journey.phase==='choice'&&journey.at==='hearth'&&!journey.lantern&&!journey.paused&&!journey.notebook);if(visible===panel.hidden){panel.hidden=!visible;document.body.classList.toggle('crafting',visible);if(visible){previousFocus=document.activeElement;q('[data-craft="insert"]').focus();}else (previousFocus?.isConnected&&previousFocus.offsetParent?previousFocus:document.querySelector('#route-choices button:not(:disabled)'))?.focus?.();}
  if(!visible)return;const c=journey.craft,working=c.result==='working';
  panel.dataset.result=c.result;q('#craft-status').textContent=c.message;
  q('#craft-measure').textContent=`Wick: ${!c.wick?'not fitted':c.wick<2?'below mark':c.wick===2?'at mark':'above mark'} · Oil: ${!c.oil?'empty':c.oil<2?'below mark':c.oil===2?'at mark':'above mark'}`;
  q('#craft-oil').setAttribute('y',383-c.oil*10);q('#craft-oil').setAttribute('height',c.oil*10);
  q('#craft-wick').style.display=c.wick?'':'none';q('#craft-wick').setAttribute('d',`M204 314V${309-c.wick*12}H216V314`);
  q('#craft-cap').style.transform=c.cap?'':'translate(12px, -14px) rotate(-6deg)';q('#craft-fire').style.display=c.result==='lit'?'':'none';q('#craft-smoke').style.display=c.result==='failed'?'':'none';
  for(const b of panel.querySelectorAll('[data-craft]')){const a=b.dataset.craft;b.hidden=a==='retry'?working||c.result==='lit':a==='spark'?!working:false;b.disabled=a==='retry'?false:!working||(a==='insert'&&!!c.wick)||(['lower','raise'].includes(a)&&!c.wick)||(['pour','drain'].includes(a)&&c.cap);}
  q('[data-craft="cap"]').textContent=c.cap?'Loosen':'Tighten';q('#craft-take').hidden=c.result!=='lit';
  // A failed or successful attempt should move keyboard focus to its next action.
  if(!working&&document.activeElement?.disabled)q(c.result==='lit'?'#craft-take':'[data-craft="retry"]').focus();
 }
 return {render};
}
