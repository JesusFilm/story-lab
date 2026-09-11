// Compact landmark drawings share one visual vocabulary across mouse, touch and keys.
const art={
 flame:'M16 3C18 10 25 13 24 21A8 8 0 0 1 8 21C8 16 13 12 12 9C15 11 15 13 16 14Z',
 home:'M4 15L16 5L28 15M7 14V28H25V14M13 28V19H19V28',
 well:'M5 11L16 4L27 11M8 11V23M24 11V23M5 23H27V29H5ZM12 15H20L19 21H13Z',
 tree:'M16 29V18M16 23L9 17M16 21L23 15M7 18C-1 9 11 2 16 7C24-1 34 14 25 19',
 hill:'M2 27L13 7L21 20L25 14L31 27ZM10 12L14 16L17 12',
 gate:'M6 29V7H26V29M9 12H23V26H9ZM10 14L22 24M16 12V27',
 tracks:'M9 7L7 12M14 8L13 13M20 19L18 24M25 20L24 25',
 cloth:'M5 6H26L23 26L6 28ZM10 7L12 22M19 7L17 22',
 jar:'M12 4H21M13 5V10C3 17 7 28 17 28C28 28 29 16 21 10V5M11 19H24',
 star:'M16 2L19 12L29 16L19 19L16 30L13 19L3 16L13 12Z'
};
const stops={field:['hill','Fields'],gate:['gate','Village'],hearth:['flame','Hearth'],wick:['cloth','Linen'],oil:['jar','Oil jars'],olive:['tree','Olive court'],well:['well','Old well'],market:['home','Market'],square:['tracks','Courtyard'],ridge:['hill','Ridge'],lookout:['hill','Overlook'],arch:['gate','Rear passage'],pen:['tracks','Animal fold'],goal:['star','Shelter']};
export function renderRoutes(container,journey,walk,focus){
 const key=journey.at+'|'+journey.options.map(e=>e.to).join()+'|'+journey.lantern+'|'+journey.gateOpen;
 if(container.dataset.key!==key){
  container.dataset.key=key;container.replaceChildren();
  journey.options.forEach((edge,index)=>{
   const [icon,name]=stops[edge.to],blocked=(journey.at==='gate'&&!journey.lantern&&!['field','hearth'].includes(edge.to))||(['gate','welcome'].includes(edge.requires)&&!journey.gateOpen);
   const button=document.createElement('button');button.className='route-card';button.dataset.to=edge.to;
   button.innerHTML=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${art[icon]}"/></svg><span>${name}</span><span class="route-direction" aria-hidden="true">${blocked?'⌑':'↗'}</span>`;
   button.disabled=blocked;button.setAttribute('aria-label',blocked?`${name}: ${journey.lantern?'gate barred; find a way around':'make a lamp at the hearth first'}`:`Walk to ${name}`);
   if(blocked){const hint=document.createElement('small');hint.textContent=journey.lantern?'Barred':'Needs light';button.append(hint);}
   button.onclick=()=>walk(edge);button.onfocus=button.onpointerenter=()=>focus(index);container.append(button);
  });
 }
 [...container.children].forEach((button,index)=>button.classList.toggle('chosen',index===journey.selected&&!button.disabled));
}
