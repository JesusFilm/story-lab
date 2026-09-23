// Runs after the initial loader, before the story/game graph or asset requests.
(() => {
 const params=new URLSearchParams(location.search),tiers=['minimal','low','existing'];
 const hints={memoryGiB:navigator.deviceMemory??null,cores:navigator.hardwareConcurrency??null,downlinkMbps:navigator.connection?.downlink??null,effectiveType:navigator.connection?.effectiveType??null,saveData:navigator.connection?.saveData??false,coarse:matchMedia('(pointer: coarse)').matches};
 let saved=null;try{saved=localStorage.getItem('shepherd-quality');}catch{}
 const requested=params.get('quality');
 const forced=tiers.includes(requested)?requested:tiers.includes(saved)?saved:null;
 const constrained=hints.saveData||(hints.memoryGiB!==null&&hints.memoryGiB<=4)||(hints.cores!==null&&hints.cores<=4)||(hints.downlinkMbps!==null&&hints.downlinkMbps<=4)||['slow-2g','2g','3g'].includes(hints.effectiveType);
 const tier=forced||(constrained||hints.memoryGiB===null?'minimal':'low');
 if(tiers.includes(requested))try{localStorage.setItem('shepherd-quality',requested);}catch{}
 const enabled=params.has('diagnostics'),marks=[],failures=[],longTasks=[],gaps=[],inputs=[],models=[];
 const append=(list,item)=>{if(list.length<2000)list.push(item);};
 const mark=(phase,detail={})=>{append(marks,{phase,ms:performance.now(),...detail});window.startupProbe?.mark(phase,detail);};
 const asset=url=>{
  if(tier!=='existing'&&!window.shepherdAssetVariants?.[tier])throw Error('Small asset list unavailable. Reload to try again.');
  const absolute=new URL(url,document.baseURI),part=absolute.pathname.match(/(?:^|\/)assets\/.*$/)?.[0]?.replace(/^\//,'');
  const mapped=window.shepherdAssetVariants?.[tier]?.[part];
  if(!mapped)return String(url);
  // The selected table points to self-contained files, including former .gltf.
  return new URL(mapped,new URL('../',document.currentScript?.src||new URL('src/startup.js',document.baseURI))).href;
 };
 const report=()=>({schema:1,build:'__SHEPHERD_BUILD__',tier,selection:forced?'override':'capabilities',hints,marks,failures,longTasks,gaps,inputs,models,heap:performance.memory?{usedJSHeapBytes:performance.memory.usedJSHeapSize,totalJSHeapBytes:performance.memory.totalJSHeapSize}:null,resources:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('blob:')).map(r=>({path:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd,transfer:r.transferSize,encoded:r.encodedBodySize,decodedHTTP:r.decodedBodySize})),limits:'Heap is JS only; HTTP decoded sizes are not image RAM. GPU residency and total phone memory are not measured.'});
 window.shepherdStartup={tier,hints,asset,mark,report,model:entry=>append(models,entry),failure:(type,message)=>{append(failures,{type,message:String(message),ms:performance.now()});mark('failure',{type});}};
 for(const phase of ['html','loader']){const entry=performance.getEntriesByName('shepherd-'+phase)[0];if(entry)marks.push({phase,ms:entry.startTime});}
 mark('startup-script');performance.setResourceTimingBufferSize(2000);
 for(const type of ['error','unhandledrejection','webglcontextlost','webglcontextcreationerror'])addEventListener(type,e=>window.shepherdStartup.failure(type,e.message||e.reason||e.statusMessage||''),true);
 if(enabled){
  for(const Ctor of [window.AudioContext,window.webkitAudioContext].filter((v,i,a)=>v&&a.indexOf(v)===i)){const decode=Ctor.prototype.decodeAudioData;Ctor.prototype.decodeAudioData=function(...args){const start=performance.now();return decode.apply(this,args).then(buffer=>{mark('audio-decoded',{start,duration:performance.now()-start,pcmBytes:buffer.length*buffer.numberOfChannels*4});return buffer;});};}
  if(window.createImageBitmap){const decode=window.createImageBitmap.bind(window);window.createImageBitmap=async(...args)=>{const start=performance.now();try{const image=await decode(...args);mark('image-decoded',{start,width:image.width,height:image.height,duration:performance.now()-start});return image;}catch(error){mark('image-decode-failed',{start});throw error;}};}
  try{new PerformanceObserver(list=>list.getEntries().forEach(e=>append(longTasks,{start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});}catch{}
  let last=performance.now();function frame(now){if(now-last>100)append(gaps,{start:last,duration:now-last});last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  for(const type of ['pointerdown','click'])addEventListener(type,e=>{const at=performance.now();requestAnimationFrame(()=>append(inputs,{type,target:e.target.id,at,queue:Math.max(0,at-e.timeStamp),paint:performance.now()-at}));},true);
 }
 addEventListener('DOMContentLoaded',()=>{
  for(const select of document.querySelectorAll('[data-quality]')){
   select.value=forced||'auto';select.onchange=()=>{try{if(select.value==='auto')localStorage.removeItem('shepherd-quality');else localStorage.setItem('shepherd-quality',select.value);}catch{}
    const url=new URL(location.href);if(select.value==='auto')url.searchParams.delete('quality');else url.searchParams.set('quality',select.value);location.assign(url);};
  }
  for(const img of document.querySelectorAll('img[data-quality-src]'))img.src=asset(img.dataset.qualitySrc);
  for(const button of document.querySelectorAll('[data-diagnostics-export]')){button.hidden=!enabled;button.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='shepherd-startup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};}
 });
})();
