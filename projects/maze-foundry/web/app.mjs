import {DEFAULT_CONFIG,PRESETS,resolveConfig,dimensions,cellPixel,exportManifest,encodePNG} from '../src/index.mjs';
import {registerMazeTools} from './tools.mjs';
const $=id=>document.getElementById(id), form=$('config-form'),canvas=$('maze-canvas'),ctx=canvas.getContext('2d');
let result=null,worker=null,job=0,busy=false,dirty=false,overrides={},selected=null,replayTimer=null,replayIndex=-1,maskCanvas=null,pendingReject=null;
function populate(c){for(const [key,value]of Object.entries(c))if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;overrides={...c.wallOverrides};refreshInputs();}
function readConfig(){const c={};for(const key of Object.keys(DEFAULT_CONFIG)){const el=form.elements.namedItem(key);if(el)c[key]=el.type==='number'||el.type==='range'?Number(el.value):el.value;}c.wallOverrides=overrides;return resolveConfig(c);}
function refreshInputs(){for(const el of form.querySelectorAll('input[type=range]')){const out=document.querySelector(`[data-for="${el.name}"]`);if(out)out.textContent=`${Math.round(Number(el.value)*100)}%`;}
  const mixed=form.elements.wallMode.value==='mixed';$('mixed-fields').hidden=!mixed;$('uniform-field').hidden=mixed;
  try{const d=dimensions(readConfig());$('size-preview').textContent=`${d.widthMetres.toFixed(1)} × ${d.heightMetres.toFixed(1)} m · ${d.width} × ${d.height} px\n1 step = ${d.cellPitchMetres.toFixed(2)} m`;}catch{$('size-preview').textContent='Check dimensions and criteria.';}}
function tell(message){$('message').textContent=message;$('message').hidden=!message;}
function stopReplay(){clearInterval(replayTimer);replayTimer=null;$('replay').textContent='Replay adversarial explorer';}
function setDirty(){dirty=true;stopReplay();$('preset').value='custom';$('status').textContent='Settings changed';$('status').className='badge stale';tell('Settings changed. Generate & verify to inspect and export the updated maze.');refreshInputs();syncButtons();}
function syncButtons(){const exportable=result?.passed&&!dirty&&!busy;$('export-png').disabled=!exportable;$('export-json').disabled=!exportable;
  $('generate').disabled=busy;$('stress').disabled=busy;$('cancel').hidden=!busy;$('replay').disabled=!result||busy;
  $('apply-wall').disabled=busy||dirty;$('reset-wall').disabled=busy||dirty;
  for(const el of form.elements)if(el.id!=='cancel')el.disabled=busy;
  $('import-config').disabled=busy;$('new-seed').disabled=busy;$('wall-select').disabled=busy||dirty;}
function request(type,extra={}){
  let config;try{config=readConfig();}catch(e){tell(e.message);return Promise.reject(e);}
  stopReplay();worker?.terminate();worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});busy=true;syncButtons();const id=++job;
  $('progress').textContent=type==='stress'?'Testing 30 seeds…':'Generating and checking…';
  return new Promise((resolve,reject)=>{
    pendingReject=reject;
    worker.onerror=e=>{busy=false;pendingReject=null;worker.terminate();syncButtons();tell(e.message);reject(new Error(e.message));};
    worker.onmessage=({data})=>{if(data.id!==job)return;
      if(data.type==='progress'){$('progress').textContent=`Candidate ${data.attempt} / ${data.maxAttempts} · ${data.failedCriteria} unmet criteria`;return;}
      if(data.type==='stress-progress'){$('stress-results').textContent=`${data.done} / 30 checked · ${data.passed} passed`;$('progress').textContent=`Stress test ${data.done} / 30`;return;}
      busy=false;pendingReject=null;worker.terminate();syncButtons();
      if(data.type==='error'){tell(data.message);$('progress').textContent='Check the configuration.';reject(new Error(data.message));return;}
      if(data.type==='result'){result=data.result;dirty=false;selected=null;replayIndex=-1;maskCanvas=null;showResult();}
      if(data.type==='stress-result'){renderStress(data.results,config);$('progress').textContent='Stress test complete.';}
      syncButtons();resolve(data);
    };worker.postMessage({id,type,config,...extra});
  });
}
function showResult(){
  const {maze,raster:r,report,attempts}=result,m=report.metrics;
  $('status').textContent=result.passed?'Verified':'Rejected';$('status').className=`badge ${result.passed?'':'fail'}`;
  $('map-title').textContent=`${maze.config.columns} × ${maze.config.rows} / ${maze.config.wallMode==='mixed'?'Settlement':'Garden'}`;
  $('progress').textContent=`${attempts} candidate${attempts===1?'':'s'} tried · ${maze.config.seed}`;
  const failures=report.checks.filter(c=>!c.pass);tell(result.passed?'':`No passing maze within the attempt limit. Showing a rejected candidate for inspection.\n${failures.map(c=>c.label).join(' · ')}. Adjust the criteria or try another seed.`);
  $('verification-summary').textContent=`${report.checks.filter(c=>c.pass).length} / ${report.checks.length} required checks passed. Candidate ${maze.attempt+1}.`;
  $('checks').replaceChildren(...report.checks.map(c=>{const row=document.createElement('div');row.className=`check-row ${c.pass?'':'failed'}`;
    const icon=document.createElement('span');icon.className='check-icon';icon.textContent=c.pass?'✓':'×';
    const body=document.createElement('div'),name=document.createElement('div'),detail=document.createElement('div');name.className='check-name';name.textContent=c.label;detail.className='check-detail';detail.textContent=`${format(c.actual)} · ${c.target}`;body.append(name,detail);row.append(icon,body);return row;}));
  const stats=[[`${r.widthMetres.toFixed(1)} × ${r.heightMetres.toFixed(1)}`,'Overall size · metres'],[m?.shortestLength??'—',`Shortest route · ${m?Math.round(m.shortestLength*r.cellPitchMetres):'—'} m`],[m?.paths.length??'—','Verified win paths ≥'],[m?.deadEnds.length??'—','Dead-end branches']];
  $('metrics').replaceChildren(...stats.map(([value,label])=>{const el=document.createElement('div');el.className='metric';const v=document.createElement('strong'),l=document.createElement('span');v.textContent=value;l.textContent=label;el.append(v,l);return el;}));
  $('simulations').replaceChildren(...(report.simulations?.rows??[]).map(s=>{const el=document.createElement('div');el.className='simulation-card';const name=document.createElement('strong'),score=document.createElement('div'),detail=document.createElement('p');name.textContent=s.name;score.className='number';score.textContent=`${s.completed} / ${s.runs} escaped`;detail.className='hint';detail.textContent=s.required?`${s.steps} steps · required to finish`:`${Math.round(s.steps/s.runs)} average steps · diagnostic`;el.append(name,score,detail);return el;}));
  $('endpoints').textContent=`Start: cell (0, 0). Exit: cell (${maze.config.columns-1}, ${maze.config.rows-1}). PNG: ${r.width} × ${r.height}.`;
  $('wall-editor').hidden=true;$('replay-step').max=Math.max(0,(report.simulations?.adversarialTrace.length??1)-1);document.querySelector('.replay-control').hidden=true;draw();
  $('wall-select').replaceChildren(new Option('Select a wall…',''),...r.segments.map(s=>new Option(`${s.id} · ${s.thicknessMetres} m`,s.id)));
}
function format(v){return Number.isFinite(v)||typeof v!=='number'?String(v):'none';}
function draw(){if(!result)return;const {maze,raster:r,report}=result;
  if(canvas.width!==r.width||canvas.height!==r.height){canvas.width=r.width;canvas.height=r.height;}
  if(!maskCanvas){maskCanvas=document.createElement('canvas');maskCanvas.width=r.width;maskCanvas.height=r.height;const off=maskCanvas.getContext('2d'),data=off.createImageData(r.width,r.height);for(let i=0;i<r.pixels.length;i++){data.data[i*4]=data.data[i*4+1]=data.data[i*4+2]=r.pixels[i];data.data[i*4+3]=255;}off.putImageData(data,0,0);}
  ctx.clearRect(0,0,r.width,r.height);ctx.drawImage(maskCanvas,0,0);ctx.lineCap='round';ctx.lineJoin='round';
  const path=(nodes,color,width,offset=0)=>{if(!nodes?.length)return;ctx.beginPath();nodes.forEach((id,i)=>{const p=cellPixel(maze,r,id);if(i===0)ctx.moveTo(p.x+offset,p.y+offset);else ctx.lineTo(p.x+offset,p.y+offset);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  if($('show-widths').checked){for(const s of r.segments){ctx.fillStyle=s.thicknessMetres<maze.config.thickWall?'#2ebbd288':'#a76de888';ctx.fillRect(s.x,s.y,s.w,s.h);}}
  if($('show-dead').checked)for(const p of report.metrics?.deadEndPaths??[])path(p,'#d56a30b3',Math.max(2,r.passagePixels*.3));
  if($('show-paths').checked)(report.metrics?.paths??[]).slice().reverse().forEach((p,i,arr)=>path(p,['#067b62','#3763e0','#ab43ba','#d49100'][arr.length-1-i],Math.max(2,r.passagePixels*.18),(arr.length-1-i)*r.passagePixels*.13));
  const dot=(id,color,radius)=>{const p=cellPixel(maze,r,id);ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,r.passagePixels*.08);ctx.stroke();};
  if($('show-choices').checked)for(const n of report.metrics?.choices??[])dot(n,'#d89016',Math.max(2,r.passagePixels*.15));
  if($('show-endpoints').checked){dot(maze.start,'#00816a',r.passagePixels*.44);dot(maze.exit,'#315ae7',r.passagePixels*.44);ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(7,r.passagePixels*.58)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';for(const [id,label]of [[maze.start,'S'],[maze.exit,'E']]){const p=cellPixel(maze,r,id);ctx.fillText(label,p.x,p.y);}}
  if(selected){ctx.strokeStyle='#ec3856';ctx.lineWidth=2;ctx.strokeRect(selected.x-2,selected.y-2,selected.w+4,selected.h+4);}
  if(replayIndex>=0){const trace=report.simulations?.adversarialTrace??[];path(trace.slice(0,replayIndex+1),'#e54565aa',Math.max(2,r.passagePixels*.2));dot(trace[replayIndex],'#e02b54',r.passagePixels*.4);}
  applyZoom();
}
function applyZoom(){const value=$('zoom').value;canvas.classList.toggle('zoomed',value!=='fit');canvas.style.width=value==='fit'?'':`${canvas.width*Number(value)}px`;canvas.style.height=value==='fit'?'':`${canvas.height*Number(value)}px`;}
function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function basename(){return `maze-${result.maze.config.seed.replace(/[^a-zA-Z0-9_-]/g,'-')}-a${result.maze.attempt}`;}
function renderStress(rows,config){const box=$('stress-results');box.replaceChildren();const summary=document.createElement('strong');summary.textContent=`${rows.filter(r=>r.passed).length} / ${rows.length} seeds passed`;box.append(summary);for(const row of rows.filter(r=>!r.passed)){const button=document.createElement('button');button.textContent=`Inspect ${row.seed}`;button.title=row.failures.join(', ');button.onclick=()=>{if(busy)return;populate({...config,seed:row.seed});setDirty();request('generate').catch(()=>{});};box.append(button);}const save=document.createElement('button');save.textContent='Save stress report';save.onclick=()=>download(JSON.stringify({schemaVersion:1,config,results:rows},null,2),'maze-stress-report.json','application/json');box.append(save);}
form.addEventListener('submit',e=>{e.preventDefault();request('generate').catch(()=>{});});form.addEventListener('input',e=>{if(e.target.id==='preset')return;
  let removed=0;if(['columns','rows','wallMode','wallThickness','thinWall','thickWall'].includes(e.target.name)){
    const cols=Number(form.elements.columns.value),rows=Number(form.elements.rows.value),uniform=form.elements.wallMode.value==='uniform',min=Number(form.elements[uniform?'wallThickness':'thinWall'].value),max=Number(form.elements[uniform?'wallThickness':'thickWall'].value);
    for(const [id,width]of Object.entries(overrides)){const [axis,x,y]=id.split('-');if(width<min||width>max||(axis==='v'?(Number(x)>=cols||Number(y)>=rows):(Number(x)>=cols||Number(y)>=rows))){delete overrides[id];removed++;}}
  }setDirty();if(removed)tell(`${removed} wall override${removed===1?' was':'s were'} cleared because the wall range or grid dimensions changed. Generate & verify to apply the new settings.`);
});
$('preset').onchange=()=>{const preset=PRESETS[$('preset').value];if(!preset)return;const name=$('preset').value;let current;try{current=readConfig();}catch{current=DEFAULT_CONFIG;}populate({...current,...preset,wallOverrides:{}});setDirty();$('preset').value=name;};
$('new-seed').onclick=()=>{form.elements.seed.value=`watch-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;setDirty();};
$('cancel').onclick=()=>{worker?.terminate();job++;busy=false;pendingReject?.(new Error('Cancelled'));pendingReject=null;$('progress').textContent='Cancelled. Previous maze retained.';syncButtons();};
for(const el of document.querySelectorAll('.layer-bar input'))el.onchange=draw;$('zoom').onchange=applyZoom;
$('export-png').onclick=()=>{if(result?.passed&&!dirty&&!busy)download(encodePNG(result.raster),`${basename()}.png`,'image/png');};
$('export-json').onclick=()=>{if(result?.passed&&!dirty&&!busy)download(JSON.stringify(exportManifest(result),null,2),`${basename()}.json`,'application/json');};
$('save-config').onclick=()=>{try{download(JSON.stringify(readConfig(),null,2),'maze-config.json','application/json');}catch(e){tell(e.message);}};
$('import-config').onclick=()=>$('config-file').click();$('config-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100_000)throw new Error('Config must be smaller than 100 KB.');const parsed=JSON.parse(await file.text());populate(resolveConfig(parsed.config??parsed));setDirty();}catch(error){tell(error.message);}finally{e.target.value='';}};
function selectTab(id){for(const tab of [$('checks-tab'),$('simulation-tab')]){const active=tab.id===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$(tab.getAttribute('aria-controls')).hidden=!active;}}
for(const tab of [$('checks-tab'),$('simulation-tab')]){tab.onclick=()=>selectTab(tab.id);tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const id=tab.id==='checks-tab'?'simulation-tab':'checks-tab';selectTab(id);$(id).focus();}};}
$('replay').onclick=()=>{if(replayTimer){stopReplay();return;}replayIndex=0;document.querySelector('.replay-control').hidden=false;$('replay').textContent='Pause replay';replayTimer=setInterval(()=>{const trace=result.report.simulations.adversarialTrace;replayIndex=Math.min(replayIndex+1,trace.length-1);$('replay-step').value=replayIndex;$('replay-value').textContent=`${replayIndex} / ${trace.length-1}`;draw();if(replayIndex===trace.length-1)stopReplay();},45);};
$('replay-step').oninput=()=>{stopReplay();replayIndex=Number($('replay-step').value);$('replay-value').textContent=`${replayIndex} / ${$('replay-step').max}`;draw();};
function selectWall(wall){selected=wall;$('wall-editor').hidden=!selected;$('wall-select').value=selected?.id??'';if(selected){$('wall-id').textContent=selected.id;$('wall-current').textContent=`Current: ${selected.thicknessMetres} m · ${result.maze.config.wallMode==='uniform'?'switch to mixed walls to vary thickness':'local segment override'}`;$('wall-value').value=selected.thicknessMetres;}draw();}
canvas.onclick=e=>{if(!result||busy||dirty)return;const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*canvas.width/box.width,y=(e.clientY-box.top)*canvas.height/box.height;selectWall(result.raster.segments.find(s=>x>=s.x-2&&x<=s.x+s.w+2&&y>=s.y-2&&y<=s.y+s.h+2)??null);};
$('wall-select').onchange=()=>{if(!result||busy||dirty)return;selectWall(result.raster.segments.find(s=>s.id===$('wall-select').value)??null);};
$('apply-wall').onclick=()=>{if(!selected||busy||dirty)return;const next={...overrides,[selected.id]:Number($('wall-value').value)};try{resolveConfig({...readConfig(),wallOverrides:next});overrides=next;dirty=true;request('edit',{maze:result.maze}).catch(()=>{});}catch(e){tell(e.message);}};
$('reset-wall').onclick=()=>{if(!selected||busy||dirty)return;delete overrides[selected.id];dirty=true;request('edit',{maze:result.maze}).catch(()=>{});};
$('stress').onclick=()=>request('stress').catch(()=>{});
populate(DEFAULT_CONFIG);request('generate').catch(()=>{});
registerMazeTools(document.modelContext,{
  async generate(config){if(busy)throw new Error('An operation is already running.');const validated=resolveConfig(config);populate(validated);setDirty();await request('generate');return brief();},
  read(){return brief();}
});
function brief(){return result?{passed:result.passed,settingsChanged:dirty,busy,seed:result.maze.config.seed,attempt:result.maze.attempt,sizeMetres:[result.raster.widthMetres,result.raster.heightMetres],checks:result.report.checks}: {busy,generated:false};}
