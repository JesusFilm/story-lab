// Runs after the initial loader, before the story/game graph or asset requests.
(() => {
 const params=new URLSearchParams(location.search),tiers=['minimal','low','existing'];
 const hints={memoryGiB:navigator.deviceMemory??null,cores:navigator.hardwareConcurrency??null,downlinkMbps:navigator.connection?.downlink??null,effectiveType:navigator.connection?.effectiveType??null,saveData:navigator.connection?.saveData??false,coarse:matchMedia('(pointer: coarse)').matches};
 // Classification is a download policy, not a GPU benchmark. Do not use
 // viewport size, RAM, core count or a coarse pointer alone to demote desktops.
 const ua=navigator.userAgent||'',platform=navigator.userAgentData?.platform||navigator.platform||'';
 const touch=navigator.maxTouchPoints||0;
 const mobileHint=navigator.userAgentData?.mobile===true;
 const mobileUA=/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle|PlayBook/i.test(ua);
 const mobilePlatform=/Android|iOS/i.test(platform);
 const ipad=/Mac/i.test(platform+' '+ua)&&touch>1;
 // Android's desktop-site mode can hide both Android and the mobile hint.
 // Limit this fallback to Linux/unknown platforms with touch-only input; normal
 // Windows/ChromeOS touch laptops and Linux machines with a mouse stay desktop.
 const desktopPlatform=/Windows|Win32|Win64|Mac|CrOS|Chrome OS/i.test(platform+' '+ua);
 const touchOnly=!desktopPlatform&&touch>1&&hints.coarse&&!matchMedia('(any-pointer: fine)').matches;
 const deviceReason=mobileHint?'ua-mobile':mobilePlatform?'mobile-platform':mobileUA?'mobile-user-agent':ipad?'ipad-desktop-user-agent':touchOnly?'touch-only-tablet-fallback':'desktop-default';
 const mobile=mobileHint||mobilePlatform||mobileUA||ipad||touchOnly;
 const enabled=params.has('diagnostics'),requested=params.get('quality');
 // Old stored choices and bare/shared quality links never override automatic.
 // Explicit diagnostic URLs apply only to this visit (including reload/retry).
 const forced=enabled&&tiers.includes(requested)?requested:null;
 const tier=forced||(mobile?'minimal':'existing');
 const selection=forced?'diagnostic-override':'automatic',reason=forced?'diagnostics-quality-parameter':deviceReason;
 const marks=[],failures=[],longTasks=[],gaps=[],inputs=[],models=[];
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
 const report=()=>({schema:1,build:'__SHEPHERD_BUILD__',tier,selection,reason,deviceReason,hints,marks,failures,longTasks,gaps,inputs,models,heap:performance.memory?{usedJSHeapBytes:performance.memory.usedJSHeapSize,totalJSHeapBytes:performance.memory.totalJSHeapSize}:null,resources:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('blob:')).map(r=>({path:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd,transfer:r.transferSize,encoded:r.encodedBodySize,decodedHTTP:r.decodedBodySize})),limits:'Heap is JS only; HTTP decoded sizes are not image RAM. GPU residency and total phone memory are not measured.'});
 window.shepherdStartup={tier,selection,reason,hints,asset,mark,report,model:entry=>append(models,entry),failure:(type,message)=>{append(failures,{type,message:String(message),ms:performance.now()});mark('failure',{type});}};
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
  for(const img of document.querySelectorAll('img[data-quality-src]'))img.src=asset(img.dataset.qualitySrc);
 });
})();
