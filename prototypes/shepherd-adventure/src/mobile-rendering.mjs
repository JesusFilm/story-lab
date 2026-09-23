import {Vector3} from 'three';
// Select once per launch: rotating a phone must not change its resource budget.
export function renderingBudget(){
 const tier=window.shepherdStartup?.tier||'existing';
 const mobile=tier!=='existing'||matchMedia('(pointer: coarse)').matches;
 return {tier,mobile,maxTextureSize:tier==='minimal'?256:mobile?512:Infinity,pixelRatio:Math.min(devicePixelRatio||1,mobile?1:1.5),antialias:!mobile,shadowSize:mobile?1024:2048,maxPointLights:tier==='minimal'?2:mobile?4:Infinity};
}

// Resize before the first GPU upload, retaining geometry, animations, material
// settings and shared texture sources. Originals remain available to desktop.
export function budgetTextures(loader,budget){
 if(!Number.isFinite(budget.maxTextureSize))return;
 loader.register(()=>({name:'StoryLabTextureBudget',afterRoot(gltf){
  const images=new Map();
  for(const scene of gltf.scenes)scene.traverse(object=>{
   for(const material of (Array.isArray(object.material)?object.material:[object.material])){
    if(!material)continue;
    for(const texture of Object.values(material))if(texture?.isTexture&&texture.image){
     const image=texture.image;
     if(!images.has(image))images.set(image,new Set());
     images.get(image).add(texture);
    }
   }
  });
  for(const [image,textures] of images){
   const ratio=Math.min(1,budget.maxTextureSize/Math.max(image.width,image.height));
   if(ratio===1)continue;
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
   // Keep the full-size decode off the GPU while making the smaller copy.
   const context=canvas.getContext('2d',{willReadFrequently:true});
   if(!context)throw Error('Could not prepare mobile textures');
   context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const texture of textures){texture.source.data=canvas;texture.needsUpdate=true;}
   image.close?.();
  }
 }}));
}

// A context can disappear after loading has finished. Keep a persistent error
// over the world and stop play; reload creates a clean renderer and asset graph.
export function watchRenderer(renderer,budget,onFailure=()=>{}){
 const lightPosition=new Vector3();
 function selectLights(scene,camera){
  if(!budget.mobile)return;
  const lights=[];
  scene.traverse(light=>{if(light.isPointLight){
   let active=light.intensity>0;for(let parent=light.parent;parent;parent=parent.parent)active=active&&parent.visible;
   lights.push({light,distance:active?light.getWorldPosition(lightPosition).distanceToSquared(camera.position):Infinity});
  }});
  lights.sort((a,b)=>a.distance-b.distance);
  lights.forEach(({light,distance},index)=>{light.visible=index<budget.maxPointLights&&Number.isFinite(distance);});
 }
 let failed=false,frames=0,pendingFrame=null,blockedSince=null;
 const gl=renderer.getContext();
 // Hidden tabs may stop rAF entirely, so reset the visible-wait clock on the
 // visibility event rather than relying on another hidden-frame poll.
 document.addEventListener('visibilitychange',()=>{blockedSince=null;});
 // Bound GPU work as well as asset work. Submitting a new frame every rAF can
 // queue seconds of old frames behind a slow GPU and block the next GL call.
 function canRender(){
  if(failed)return false;
  if(!pendingFrame)return true;
  if(gl.isContextLost()){lost();return false;}
  const state=gl.clientWaitSync(pendingFrame,0,0);
  if(state===gl.ALREADY_SIGNALED||state===gl.CONDITION_SATISFIED){gl.deleteSync(pendingFrame);pendingFrame=null;blockedSince=null;return true;}
  if(document.hidden)blockedSince=null;
  else blockedSince??=performance.now();
  if(state===gl.WAIT_FAILED||(blockedSince!==null&&performance.now()-blockedSince>30000)){
   window.shepherdStartup?.failure('gpu-frame','A submitted frame did not complete');
   fail('The 3D view stopped responding. Reload to restart.');
  }
  return false;
 }
 function fail(message){
  if(failed)return;
  failed=true;onFailure();
  window.storyLoading.show();window.storyLoading.fail(message);
  document.getElementById('review-panel').inert=true;
 }
 const lost=()=>fail('The 3D view was interrupted. Reload to restart. If it happens again, close other tabs and try again.');
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost();});
 renderer.debug.onShaderError=(gl,program)=>{console.error('WebGL shader failure:',gl.getProgramInfoLog(program));throw Error('The 3D shaders could not run on this browser.');};
 const render=renderer.render.bind(renderer);
 renderer.render=(scene,camera)=>{
  if(failed)throw Error('The 3D view is unavailable. Reload to restart.');
  if(renderer.getContext().isContextLost()){lost();throw Error('WebGL context lost');}
  if(!canRender())return;
  try{selectLights(scene,camera);const start=performance.now();render(scene,camera);if(!frames)window.shepherdStartup?.mark('first-render-submitted',{duration:performance.now()-start,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});frames++;pendingFrame=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!pendingFrame)throw Error('Could not track the 3D frame');gl.flush();}catch(error){fail('The 3D view could not render. Reload to restart, or try another browser.');throw error;}
 };
 return {get failed(){return failed;},get frames(){return frames;},canRender,fail};
}

// Wait asynchronously for submitted uploads/shaders/draws. A submitted draw is
// not evidence that the GPU has finished it. Keep the loader animating meanwhile.
export async function firstFrameComplete(renderer){
 const gl=renderer.getContext(),sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0),start=performance.now();gl.flush();
 if(!sync)throw Error('Could not check the first 3D frame');
 try{await new Promise((resolve,reject)=>{
  function poll(){
   if(gl.isContextLost())return reject(Error('Context lost during first frame'));
   const state=gl.clientWaitSync(sync,0,0);
   if(state===gl.ALREADY_SIGNALED||state===gl.CONDITION_SATISFIED)return resolve();
   if(state===gl.WAIT_FAILED||performance.now()-start>30000)return reject(Error('First 3D frame did not complete'));
   setTimeout(poll,16);
  }poll();
 });window.shepherdStartup?.mark('first-frame-gpu-complete',{duration:performance.now()-start});}
 finally{gl.deleteSync(sync);}
}
