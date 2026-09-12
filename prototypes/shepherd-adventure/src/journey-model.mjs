// An authored investigation: knowledge opens routes; light has no resource cost.
export const NODES=[
 {id:'hearth',name:'The sheltered hearth',x:-12,z:30,fire:true,chapter:'A light for the road',note:'An empty clay lamp rests beside the embers. It needs a wick and oil.'},
 {id:'wick',name:'The linen awning',x:-23,z:32,chapter:'Under the linen awning',note:'A loose strip of linen hangs beside the folded cloth.'},
 {id:'oil',name:'The oil store',x:-25,z:20,chapter:'Beside the oil jars',note:'A small pouring jar rests beside the larger sealed vessels.'},
 {id:'field',name:'The shepherd’s field',x:0,z:52,fire:false,chapter:'Outside Bethlehem',note:'A baby lying in a manger. Somewhere beyond these few lights.'},
 {id:'gate',name:'The village threshold',x:0,z:20,chapter:'At the threshold',note:'Several lanes disappear between the houses. What is worth following?'},
 {id:'olive',name:'Olive courtyard',x:-15,z:7,fire:true,chapter:'Among the first houses',note:'Baking embers, closed doors, and a path rising above the roofs.'},
 {id:'well',name:'The old well',x:13,z:7,chapter:'At the old well',note:'The ground is softer here. Your lantern catches marks in the mud.'},
 {id:'market',name:'Sleeping market',x:-18,z:-9,chapter:'The sleeping market',note:'A lane through the stalls. A gate across the way beyond.'},
 {id:'square',name:'Lantern courtyard',x:3,z:-11,fire:true,chapter:'The quiet courtyard',note:'Animal tracks leave the pool of light. Low roofs lie beyond the wall.'},
 {id:'ridge',name:'The exposed ridge',x:28,z:-5,chapter:'Above the rooftops',note:'A quicker-looking path skirts the houses. Its far end disappears into darkness.'},
 {id:'lookout',name:'The hillside overlook',x:-32,z:-4,chapter:'Above the sleeping village',note:'The climb offers a different view of the lanes below.'},
 {id:'arch',name:'The rear passage',x:-8,z:-26,fire:true,chapter:'Behind the last houses',note:'You have come around the wall. A quiet shelter lies beyond the passage.'},
 {id:'pen',name:'The animal fold',x:18,z:-25,chapter:'At the animal fold',note:'Animals, straw and a trough. This could be a place to look.'},
 {id:'goal',name:'The open shelter',x:3,z:-66,chapter:'At a quiet shelter',note:'Lamplight under a low roof. Look inside.'}
];
export const EDGES=[
 ['gate','hearth','A sheltered flame beside the lane'],['hearth','wick','Under the linen awning'],['hearth','oil','Toward the oil jars'],['field','gate','A lane toward the village'],['gate','olive','Lamplight among the trees'],['gate','well','A worn stone lane'],['gate','ridge','A footpath into the wind'],
 ['olive','market','Between shuttered houses'],['olive','lookout','A climb above the rooftops'],['well','square','Along the muddy lane'],
 ['well','ridge','Steps toward the hillside'],['market','square','Past the empty stalls'],['market','arch','The wooden gate','gate'],
 ['square','arch','The lane behind the low wall','overlook'],['square','pen','Animal tracks in the dust'],['square','ridge','Steps out of the courtyard'],
 ['ridge','pen','Down toward a low roof'],['arch','goal','A quiet light beyond the wall','welcome'],['pen','arch','The gap behind the feeding trough','rear']
].map(([a,b,name,requires],i)=>({id:`lane-${i}`,a,b,name,requires}));
export const NODE=Object.fromEntries(NODES.map(n=>[n.id,n]));
export function links(id){return EDGES.filter(e=>e.a===id||e.b===id).map(e=>({...e,to:e.a===id?e.b:e.a})).sort((a,b)=>NODE[a.to].x-NODE[b.to].x||NODE[a.to].z-NODE[b.to].z);}
export function lanePoints(edge){const a=NODE[edge.a],b=NODE[edge.b];const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);return Array.from({length:25},(_,i)=>{const t=i/24,bend=Math.sin(t*Math.PI)*1.15;return {x:a.x+dx*t-dz/len*bend,z:a.z+dz*t+dx/len*bend};});}
export const OBSERVATIONS={
 hearth:{title:'Make a light for the road',body:'The empty clay lamp needs a linen wick and a little oil. Look beneath the nearby awning and beside the storage jars, then return to these embers.',kind:'lamp'},
 wick:{title:'A wick from the linen',body:'You take a loose strip of linen for the lamp. A small beginning: with oil and a flame, it will light the lanes ahead.',kind:'linen'},
 oil:{title:'Oil for the lamp',body:'You fill the small lamp cup from the pouring jar. Bring it and a linen wick to the sheltered hearth.',kind:'oil'},
 field:{title:'Remember the sign',body:'The announcement spoke of a baby lying in a manger. Look for a place where animals are fed. A bright house alone is not enough.',kind:'lantern'},
 gate:{title:'The sleeping village',body:'Closed doorways to one side. A well-worn lane to the other. The path on the hill could be shorter, but you cannot see where it ends.',kind:'lantern'},
 olive:{title:'A household courtyard',body:'Bread ovens and shuttered rooms. No feeding trough here. The uphill path may let you see over the walls before committing to another lane.',kind:'tree'},
 well:{title:'Tracks by the water',body:'Small hoofprints leave the wet ground and continue into the courtyard. They are worth following, but animals alone will not tell you where the child is.',kind:'well'},
 market:{title:'A bar on the far side',body:'The gate cannot be opened from here. Beyond it, the lane continues behind the houses. You will need to find a way around; the courtyard is still reachable.',kind:'gate'},
 square:{title:'Two different signs',body:'Hoofprints leave toward the animal fold. Loose straw also catches beneath the low wall, but from here no opening is obvious. A higher viewpoint might help.',kind:'tracks'},
 ridge:{title:'A roof in the darkness',body:'The path descends toward an animal enclosure. It may be useful to investigate, but this view does not reveal whether anyone is sheltering there.',kind:'ridge'},
 lookout:{title:'A lane you could not see below',body:'From above, you can trace an overlooked lane behind the courtyard’s low wall. It reaches the far side of the market gate. You remember where to find its entrance.',kind:'vista',unlock:'overlook'},
 pen:{title:'Animals, but no family',body:'This is an ordinary fold. Behind the feeding trough, a gap in the wall leads into a rear passage. The detour has found you another way around the village.',kind:'trough',unlock:'rear'},
 arch:{title:'The gate opens from this side',body:'You lift the timber bar and light the gate lamp. The shepherds following you can now take the short way through. Beyond the passage, a quiet shelter waits.',kind:'gate',unlock:'gate'},
 goal:{title:'The sign you were looking for',body:'A baby, wrapped and lying in a manger. You have found the place.',kind:'manger'}
};
export class Journey{
 constructor(){this.reset();}
 reset(){this.gateSequence=null;this.followers=[];this.at='field';this.previous=null;this.travel=null;this.phase='intro';this.paused=false;this.selected=0;this.inspection=null;this.inspectionYaw=0;this.notebook=false;this.visited=new Set(['field']);this.inspected=new Set();this.inventory=new Set();this.reward=null;this.firstDiscovery=false;this.discoveries=new Set();this.traversed=new Set();this.distance=0;this.recoveries=0;this.message='';this.decisions=0;}
 get options(){return links(this.at).filter(e=>!['overlook','rear'].includes(e.requires)||this.discoveries.has(e.requires)||this.traversed.has(e.id));}
 get choice(){return this.options[this.selected%this.options.length];}
 get lantern(){return this.inventory.has('lantern');}
 get gateOpen(){return this.discoveries.has('gate');}
 start(){if(this.phase!=='intro')return false;this.phase='choice';return true;}
 select(delta){if(this.phase!=='choice'||this.paused)return false;this.selected=(this.selected+delta+this.options.length)%this.options.length;this.message='';return true;}
 inspect(){
  if(this.phase!=='choice'||this.paused)return false;
  const first=!this.inspected.has(this.at);this.reward=null;this.inspected.add(this.at);this.inspection={...OBSERVATIONS[this.at],node:this.at};this.inspectionYaw=0;
  const newRoute=this.inspection.unlock&&!this.discoveries.has(this.inspection.unlock);
  if(this.at==='wick'||this.at==='oil'){
   const item=this.at;this.inventory.add(item);
   if(first)this.reward={title:item==='wick'?'A wick for the flame':'Oil for the journey',detail:'↑ Investigate turns what you notice into something useful.',kind:'item'};
  }
  if(this.at==='hearth'){
   if(this.lantern)this.inspection={...this.inspection,title:'Your lantern is ready',body:'Its small flame is steady. Return to the village threshold and explore the darker lanes.'};
   else if(this.inventory.has('wick')&&this.inventory.has('oil')){
    this.inventory.add('lantern');this.selected=this.options.findIndex(e=>e.to==='gate');this.inspection={...this.inspection,title:'A light of your own',body:'The wick catches. A small pool of warm light opens around you. Carry it into the village—and leave a way for those who follow.'};
    this.reward={title:'Lantern equipped',detail:'You can now follow the darker lanes. Your light is shown beside the route controls.',kind:'lantern'};
   }else this.inspection.body='The lamp still needs '+(!this.inventory.has('wick')&&!this.inventory.has('oil')?'a linen wick from the awning and oil from the jars':!this.inventory.has('wick')?'a linen wick from the awning':'oil from the storage jars')+'. Bring them back to these embers to light it.';
  }
  if(this.at==='gate'&&!this.lantern)this.inspection={...this.inspection,title:'Before the darker lanes',body:'You have no light of your own. A sheltered hearth beside the threshold holds an empty lamp. Follow the nearby flame and press ↑ to examine it.'};
  if(this.at==='market'&&this.gateOpen)this.inspection={...this.inspection,title:'An open way for others',body:'The bar is lifted and the gate lamp is lit. The short way through is open.'};
  if(this.at==='arch'&&!this.gateOpen){this.gateSequence={stage:'approach',elapsed:0,progress:0};this.phase='gate-sequence';this.inspection=null;this.message='Walk to the gate lamp';return true;}
  if(this.inspection.unlock)this.discoveries.add(this.inspection.unlock);
  if(newRoute){this.reward={title:this.at==='arch'?'A way for those behind you':'A new way through',detail:this.firstDiscovery?'This connection is now remembered in your notebook.':'You found this by investigating. Other places may offer clues, supplies—or simply quiet.',kind:'route'};this.firstDiscovery=true;}
  this.phase=this.at==='goal'?'arrival':'inspect';this.message='';return true;
 }
 closeInspection(){if(this.phase!=='inspect')return false;this.phase='choice';this.inspection=null;this.reward=null;return true;}
 commit(edge=this.choice){
  if(this.phase!=='choice'||this.paused||!edge||!this.options.some(e=>e.id===edge.id&&e.to===edge.to))return false;
  if((this.at==='gate'&&!this.lantern&&!['field','hearth'].includes(edge.to))||(['gate','welcome'].includes(edge.requires)&&!this.gateOpen)){return this.inspect();}
  const raw=lanePoints(edge),points=edge.a===this.at?raw:raw.slice().reverse();
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z));
  this.travel={edge,from:this.at,to:edge.to,points,lengths,length:lengths.reduce((a,b)=>a+b,0),progress:0,speed:2.8,canRun:this.traversed.has(edge.id)||(this.lantern&&this.discoveries.size>0)};
  this.phase='walking';this.message='';this.decisions++;return true;
 }
 back(){return this.commit(this.options.find(e=>e.to===this.previous)||null);}
 recover(){if(!['choice','walking','inspect','gate-sequence'].includes(this.phase))return false;this.gateSequence=null;this.followers=[];if(!this.gateOpen)this.inspected.delete('arch');this.at='gate';this.travel=null;this.inspection=null;this.phase='choice';this.paused=false;this.previous=null;this.selected=0;if(!this.lantern)this.selected=this.options.findIndex(e=>e.to==='hearth');this.recoveries++;this.visited.add('gate');this.message='Back at the village threshold. You remember everything you found.';return true;}
 step(dt){
  if(this.paused||!Number.isFinite(dt)||dt<=0)return;
  if(this.phase==='gate-sequence'){this.stepGate(dt);return;}
  if(this.phase!=='walking')return;
  const t=this.travel;const run=t.canRun&&t.progress>2.5&&t.length-t.progress>4;const targetSpeed=run?4.4:2.8;t.speed+=(targetSpeed-t.speed)*(1-Math.exp(-4*dt));const amount=Math.min(dt*t.speed,t.length-t.progress);t.progress+=amount;this.distance+=amount;
  if(t.progress>=t.length-1e-8){this.previous=t.from;this.at=t.to;this.visited.add(this.at);this.traversed.add(t.edge.id);this.travel=null;this.phase='choice';this.selected=Math.max(0,this.options.findIndex(e=>this.at==='gate'&&!this.lantern?e.to==='hearth':e.to!==this.previous));this.noticeArrival();}
 }
 noticeArrival(){
  // Discovery belongs to arrival, never to a second, easily missed button press.
  if(this.inspected.has(this.at)&&!(this.at==='hearth'&&!this.lantern))return;
  this.inspect();
  if(this.phase==='inspect'){
   const lines={hearth:this.lantern?'Your light is ready.':'A wick and oil will give this lamp a flame.',wick:'Linen for a wick.',oil:'Oil for the lamp.',gate:this.lantern?'Follow the lanes toward a manger.':'Make a light at the nearby hearth.',olive:'Closed homes. A higher path overlooks the roofs.',well:'Hoofprints lead toward the courtyard.',market:'The gate is barred from the far side.',square:'Tracks lead to the fold. Straw lies by the wall.',ridge:'An animal fold lies below.',lookout:'A hidden lane behind the courtyard wall.',pen:'No family here. A gap leads behind the wall.'};
   const message=lines[this.at]||this.inspection.title;
   this.closeInspection();this.message=message;
  }
 }
 stepGate(dt){
  const s=this.gateSequence,route=gateApproach(),length=polylineLength(route);s.elapsed+=dt;
  if(s.stage==='approach'||s.stage==='return'){
   const amount=Math.min(dt*2.8,length-s.progress);s.progress+=amount;this.distance+=amount;
   if(s.progress>=length){s.stage=s.stage==='approach'?'light':'watch';s.elapsed=0;s.progress=0;}
  }else if(s.stage==='light'){
   if(s.elapsed>=1.2)this.discoveries.add('gate');
   if(s.elapsed>=3){s.stage='return';s.elapsed=0;}
  }else if(s.stage==='watch'){
   const path=followerRoute(),total=polylineLength(path);
   this.followers=[0,1].map(i=>{const d=Math.max(0,(s.elapsed-3-i*.9)*4.6);return {...pointOnPath(path,Math.min(total-i*1.4,d)),visible:s.elapsed>=3+i*.9,moving:d<total-i*1.4};});
   if(s.elapsed>3.9+total/4.6+2){this.phase='choice';this.gateSequence=null;this.selected=this.options.findIndex(e=>e.to==='goal');this.message='The others have gone ahead. Follow when you are ready.';}
  }
 }
 get position(){
  if(this.gateSequence){const s=this.gateSequence,path=gateApproach();if(s.stage==='watch')return {...NODE.arch};if(s.stage==='return')return pointOnPath(path.slice().reverse(),s.progress);const p=pointOnPath(path,s.stage==='light'?polylineLength(path):s.progress);if(s.stage==='light'){const lane=lanePoints(EDGES.find(e=>e.a==='market'&&e.b==='arch')),a=lane[6],b=lane[7],yaw=Math.atan2(b.x-a.x,b.z-a.z);p.heading=Math.atan2(a.x+Math.cos(yaw)*1.55-p.x,a.z-Math.sin(yaw)*1.55-p.z);}return p;}

  if(!this.travel)return {...NODE[this.at]};
  let d=this.travel.progress;const {points,lengths}=this.travel;
  for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const f=d/lengths[i];return {x:points[i].x+(points[i+1].x-points[i].x)*f,z:points[i].z+(points[i+1].z-points[i].z)*f,heading:Math.atan2(points[i+1].x-points[i].x,points[i+1].z-points[i].z)};}d-=lengths[i];}return {...NODE[this.travel.to]};
 }
 snapshot(){return {at:this.at,phase:this.phase,paused:this.paused,selected:this.choice?.to,visited:[...this.visited],inspected:[...this.inspected],discoveries:[...this.discoveries],traversed:[...this.traversed],gateOpen:this.gateOpen,inventory:[...this.inventory],lantern:this.lantern,distance:this.distance,recoveries:this.recoveries,decisions:this.decisions,position:this.position};}
}

export function polylineLength(points){return points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.z-points[i].z),0);}
export function pointOnPath(points,d){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=Math.hypot(b.x-a.x,b.z-a.z);if(d<=l||i===points.length-1){const t=Math.min(1,d/l);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,b.z-a.z)};}d-=l;}}
export function gateApproach(){const path=lanePoints(EDGES.find(e=>e.a==='market'&&e.b==='arch'));const a=path[6],b=path[7],yaw=Math.atan2(b.x-a.x,b.z-a.z);return [...path.slice(8).reverse(),{x:a.x+Math.cos(yaw)*1.1+Math.sin(yaw)*1.1,z:a.z-Math.sin(yaw)*1.1+Math.cos(yaw)*1.1}];}
export function followerRoute(){return [...lanePoints(EDGES.find(e=>e.a==='market'&&e.b==='arch')),...lanePoints(EDGES.find(e=>e.b==='goal')).slice(1)];}
