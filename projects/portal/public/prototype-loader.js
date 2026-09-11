// Runs before module initialization so startup failures never leave a silent overlay.
(() => {
 const script=document.currentScript,entry=script.dataset.entry;
 const status=document.querySelector('#loading-text'),overlay=document.querySelector('#loading');
 let failed=false;
 function fail(message){
  failed=true;overlay.hidden=false;
  status.textContent='Could not start the prototype: '+message;
  if(!document.querySelector('#retry-load')){
   const retry=document.createElement('button');retry.id='retry-load';retry.textContent='Reload prototype';retry.onclick=()=>location.reload();overlay.append(retry);
  }
 }
 window.addEventListener('error',event=>{if(event.message)fail(event.message);});
 window.addEventListener('unhandledrejection',event=>fail(event.reason?.message||String(event.reason)));
 status.textContent='Starting the 3D renderer…';
 const slow=setTimeout(()=>{if(!overlay.hidden&&!failed)status.textContent='Still loading the 3D scene. The first visit downloads the models; a slow connection may take a little longer.';},20000);
 import(new URL('../../vendor/three/build/three.module.js',document.baseURI).href).then(THREE=>{
  THREE.DefaultLoadingManager.onProgress=(_url,loaded,total)=>{if(!failed&&!overlay.hidden)status.textContent=`Preparing models: ${loaded} of ${total} resources ready…`;};
  THREE.DefaultLoadingManager.onError=()=>fail('A model could not be downloaded. Check your connection and reload.');
  return import(new URL(entry,document.baseURI).href);
 }).catch(error=>{clearTimeout(slow);fail(error.message);});
 const observer=new MutationObserver(()=>{if(overlay.hidden){clearTimeout(slow);observer.disconnect();}});
 observer.observe(overlay,{attributes:true,attributeFilter:['hidden']});
})();
