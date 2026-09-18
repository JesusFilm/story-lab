/* Opt-in local diagnostic. No Three.js import, network collection, or retained asset references. */
(() => {
 'use strict';
 if (!new URLSearchParams(location.search).has('profile')) return;
 const samples=[], events=[], resources=[], models=[], providers=new Map();
 const started=new Date().toISOString();
 const limit=3600;
 let steady=null;
 let dropped=0, lastState='', longTasks=0, longTaskMs=0;
 const keep=(list,item)=>{if(list.length<limit)list.push(item);else dropped++;};
 const path=url=>{try {const u=new URL(url,location.href);return u.protocol==='blob:'?'blob:media':u.pathname;}catch{return 'unknown';}};
 // Inventory is a logical resource estimate, NOT a measurement of GPU resident memory.
 // Deduplicate shared ArrayBuffers, Texture objects and decoded image sources independently.
 function inventory(root){
  const buffers=new Set(), geometries=new Set(), textures=new Set(), images=new Map(), materials=new Set();
  let geometryBytes=0, textureRGBABytes=0, meshes=0, triangles=0;
  const array=a=>{const b=(a?.array||a?.data?.array)?.buffer;if(b&&!buffers.has(b)){buffers.add(b);geometryBytes+=b.byteLength;}};
  const texture=t=>{if(!t?.isTexture||textures.has(t))return;textures.add(t);const image=t.source?.data||t.image;if(!image)return;const w=image.width||image.videoWidth||0,h=image.height||image.videoHeight||0;if(!w||!h)return;images.set(image,w*h*4);textureRGBABytes+=w*h*4*(t.generateMipmaps?4/3:1);};
  root.traverse(o=>{
   if(o.isMesh){meshes++;const g=o.geometry;triangles+=(g?.index?.count||g?.attributes?.position?.count||0)/3;}
   const g=o.geometry;
   if(g&&!geometries.has(g)){geometries.add(g);array(g.index);Object.values(g.attributes).forEach(array);Object.values(g.morphAttributes).flat().forEach(array);}
   array(o.instanceMatrix);array(o.instanceColor);
   for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(!m||materials.has(m))continue;materials.add(m);Object.values(m).forEach(texture);for(const u of Object.values(m.uniforms||{}))texture(u.value);}
   texture(o.skeleton?.boneTexture);
  });
  texture(root.background);texture(root.environment);
  return {meshes,geometries:geometries.size,materials:materials.size,textureObjects:textures.size,imageSources:images.size,geometryArrayBufferBytes:geometryBytes,textureRGBAEstimatedBytes:Math.round(textureRGBABytes),decodedImageRGBAEstimatedBytes:[...images.values()].reduce((a,b)=>a+b,0),placedTriangles:Math.round(triangles)};
 }
 function sample(reason='interval'){
  const before=performance.now(), owners={};
  for(const [name,read] of providers){try{owners[name]=read();}catch(error){owners[name]={error:String(error)};}}
  const m=performance.memory;
  const loader=document.getElementById('loading');
  const imgs=[...document.images].filter(i=>i.naturalWidth).map(i=>({path:path(i.currentSrc),width:i.naturalWidth,height:i.naturalHeight}));
  const row={ms:Math.round(before),reason,visible:!document.hidden,focused:document.hasFocus(),phase:document.body?.dataset.storyPhase||'boot',loaderVisible:!!loader&&!loader.hidden&&getComputedStyle(loader).display!=='none',heap:m?{used:m.usedJSHeapSize,total:m.totalJSHeapSize,limit:m.jsHeapSizeLimit}:null,owners,domImages:imgs,longTasks,longTaskMs:Math.round(longTaskMs)};
  row.samplingMs=+(performance.now()-before).toFixed(2);
  keep(samples,row);
  const state=JSON.stringify([row.phase,owners.story?.kind,owners.world?.point,owners.world?.travel,row.loaderVisible]);
  if(state!==lastState){lastState=state;keep(events,{ms:row.ms,type:'state',phase:row.phase,story:owners.story?.kind,point:owners.world?.point,travel:owners.world?.travel,loader:row.loaderVisible});}
  const display=document.getElementById('memory-status');
  if(display)display.textContent=`${row.phase} · heap ${m?(m.usedJSHeapSize/1048576).toFixed(1)+' MiB':'unavailable'} · ${samples.length} samples`;
  return row;
 }
 function mark(name){keep(events,{ms:Math.round(performance.now()),type:'mark',name});sample(name);}
 function report(){
  return {version:1,started,metadata:{userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemoryGiB:navigator.deviceMemory??null,crossOriginIsolated,heapAvailable:!!performance.memory,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches},limits:['JS heap is browser-provided, potentially quantized; not total process or GPU memory.','Graphics estimates include hidden scene assets, omit driver/framebuffer overhead and are not additive with heap.','DOM images exclude browser-owned decoded caches and off-DOM images. HTMLAudioElement decoder memory, transient synthetic sounds and browser process RSS are unavailable.','Per-model numbers are load-time inventories; scene inventory deduplicates shared resources.','Two-second samples may miss brief peaks; long-task and resource observers supplement them.','No forced GC or disposal; profiling does not change loading policy.'],dropped,samples,events,resources,models,steady:steady?{...steady,heap:Array.from(steady.heap.subarray(0,steady.heapCount)),frames:Array.from(steady.frames.subarray(0,steady.frameCount))}:null};
 }
 window.shepherdMemory={inventory,register:(name,read)=>providers.set(name,read),mark,report,observeLoader(loader){
  const original=loader.loadAsync;
  loader.loadAsync=async function(url,...args){const start=performance.now();try{const gltf=await original.call(this,url,...args);keep(models,{path:path(url),ms:Math.round(performance.now()),durationMs:Math.round(performance.now()-start),...inventory(gltf.scene)});return gltf;}catch(error){keep(events,{ms:Math.round(performance.now()),type:'model-error',path:path(url),message:String(error)});throw error;}};
 }};
 try{new PerformanceObserver(list=>{for(const r of list.getEntries())keep(resources,{path:path(r.name),startMs:Math.round(r.startTime),durationMs:Math.round(r.duration),transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize,initiator:r.initiatorType});}).observe({type:'resource',buffered:true});}catch{}
 try{new PerformanceObserver(list=>{for(const r of list.getEntries()){longTasks++;longTaskMs+=r.duration;keep(events,{type:'long-task',ms:Math.round(r.startTime),durationMs:Math.round(r.duration)});}}).observe({type:'longtask',buffered:true});}catch{}
 addEventListener('error',e=>keep(events,{type:'error',ms:Math.round(performance.now()),message:e.message||'Resource error'}));
 addEventListener('unhandledrejection',e=>keep(events,{type:'rejection',ms:Math.round(performance.now()),message:String(e.reason)}));
 addEventListener('DOMContentLoaded',()=>{
  const panel=document.createElement('details');panel.id='memory-profile';panel.style.cssText='position:fixed;top:4px;left:4px;z-index:10000;background:#172025;color:white;padding:5px;font:12px system-ui;max-width:360px';
  panel.innerHTML='<summary>Memory profiler</summary><p id="memory-status"></p><button id="memory-steady">Measure 60s idle</button><p id="memory-steady-status"></p><button id="memory-save">Save local profile</button> <button id="memory-download">Download JSON</button><p id="memory-saved"></p>';
  document.body.append(panel);
  document.getElementById('memory-steady').onclick=()=>{
   if(steady?.running)return;
   if(!performance.memory){document.getElementById('memory-steady-status').textContent='JS heap measurement is unavailable in this browser.';return;}
   steady={running:true,startMs:performance.now(),durationMs:60000,heap:new Float64Array(1400),heapCount:0,frames:new Float64Array(15000),frameCount:0,focusLost:false,scene:document.body.dataset.storyPhase};
   let previous=steady.startMs,nextHeap=steady.startMs;
   const tick=now=>{
    if(document.hidden||!document.hasFocus())steady.focusLost=true;
    if(steady.frameCount<steady.frames.length)steady.frames[steady.frameCount++]=now-previous;
    previous=now;
    if(now>=nextHeap&&steady.heapCount+2<=steady.heap.length){steady.heap[steady.heapCount++]=now-steady.startMs;steady.heap[steady.heapCount++]=performance.memory?.usedJSHeapSize||0;nextHeap=now+100;}
    document.getElementById('memory-steady-status').textContent=`Idle measurement: ${Math.min(60,Math.floor((now-steady.startMs)/1000))}/60 seconds`;
    if(now-steady.startMs<60000)requestAnimationFrame(tick);
    else{steady.running=false;steady.endMs=now;document.getElementById('memory-steady-status').textContent='Idle measurement complete';}
   };
   requestAnimationFrame(tick);
  };
  document.getElementById('memory-save').onclick=async()=>{sample('save');const status=document.getElementById('memory-saved');try{const response=await fetch('./__debug/memory-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report())});if(!response.ok)throw Error('Start serve.py with --profile-dir, or use Download JSON.');const result=await response.json();status.textContent=`Saved ${result.file}`;}catch(error){status.textContent=error.message;}};
  document.getElementById('memory-download').onclick=()=>{sample('download');const url=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='shepherd-memory-profile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  mark('dom-ready');
 });
 const timer=setInterval(sample,2000);
 addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 mark('profiler-start');
})();
