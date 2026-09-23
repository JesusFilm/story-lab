(() => {
 const start=performance.now(), marks=[], errors=[], tasks=[], gaps=[], inputs=[];
 performance.setResourceTimingBufferSize(4000);
 const mark=(phase,detail={})=>marks.push({phase,ms:performance.now(),...detail});
 window.startupProbe={mark,report:()=>({marks,errors,tasks,gaps,inputs,now:performance.now(),heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null,resources:performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('blob:')).map(r=>({url:r.name.replace(location.origin,''),start:r.startTime,end:r.responseEnd,duration:r.duration,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize,initiator:r.initiatorType}))})};
 mark('earliest-script');
 for(const type of ['error','unhandledrejection','webglcontextlost','webglcontextcreationerror'])addEventListener(type,e=>errors.push({type,ms:performance.now(),message:String(e.message||e.reason||e.statusMessage||'')}),true);
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())tasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true});}catch{}
 let previous=start;function frame(now){if(now-previous>100)gaps.push({start:previous,duration:now-previous});previous=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
 for(const type of ['pointerdown','click'])addEventListener(type,e=>{const at=performance.now();requestAnimationFrame(()=>inputs.push({type,target:e.target.id,at,paint:performance.now()-at,queue:Math.max(0,at-e.timeStamp)}));},true);
})();
