// Bound both fetch and GLTF parse/decode jobs. Selection precedes loader.loadAsync.
export function configureAssetLoading(loader,{concurrency=2,timeout=45000}={}){
 const load=loader.loadAsync.bind(loader),queue=[];let active=0,failure=null;
 const previousError=loader.manager.onError;
 loader.manager.onError=url=>{previousError?.(url);failure=Error('Required model resource failed: '+url);for(const pending of queue.splice(0))pending.reject(failure);};
 function pump(){while(!failure&&active<concurrency&&queue.length){const job=queue.shift();active++;
  const selected=window.shepherdStartup?.asset(job.url)||job.url,start=performance.now();
  window.shepherdStartup?.mark('model-start',{url:selected});
  // FileLoader's fetch cannot be aborted through GLTFLoader. A failed timeout
  // rejects readiness and reload discards the graph; do not start queued work.
  let timer;Promise.race([load(selected).then(gltf=>{if(failure)throw failure;return gltf;}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Model load timed out: '+selected)),timeout);})]).then(gltf=>{
   window.shepherdStartup?.model({url:selected,start,end:performance.now()});job.resolve(gltf);
  },error=>{failure=error;job.reject(error);for(const pending of queue.splice(0))pending.reject(error);}).finally(()=>{clearTimeout(timer);active--;setTimeout(pump,0);});
 }}
 loader.loadAsync=url=>new Promise((resolve,reject)=>{if(failure){reject(failure);return;}queue.push({url,resolve,reject});pump();});
}

export function sceneInventory(scene){
 const geometries=new Set(),textures=new Set(),sources=new Set(),materials=new Set(),buffers=new Set();let meshes=0,viewBytes=0,triangles=0,rgba=0;
 scene.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position?.count||0)/3*(o.count||1);geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
 for(const g of geometries)for(const a of [g.index,...Object.values(g.attributes),...Object.values(g.morphAttributes).flat()].filter(Boolean)){const array=a.array||a.data?.array;if(array){viewBytes+=array.byteLength;buffers.add(array.buffer);}}
 for(const t of textures){const i=t.image;if(i&&!sources.has(i)){sources.add(i);rgba+=(i.width||0)*(i.height||0)*4*(t.generateMipmaps?4/3:1);}}
 return {meshes,materials:materials.size,geometries:geometries.size,textures:textures.size,imageSources:sources.size,sceneTrianglesIncludingInstances:triangles,geometryViewBytes:viewBytes,geometryBackingBytes:[...buffers].reduce((n,b)=>n+b.byteLength,0),logicalTextureRGBAWithMipmaps:Math.round(rgba),limits:'Logical scene inventory, including hidden meshes; not GPU residency or total process/phone RAM. Backing buffers can include other GLB data.'};
}
