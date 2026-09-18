// Each story owns a bounded media lease. HTTP cache is browser-owned; decoded
// images, object URLs and pending fetches are released when the lease is dropped.
import {storyURLs} from './journey-story-data.mjs';
export function createStoryMedia(){
 const leases=new Map();
 function release(kind){const lease=leases.get(kind);if(!lease)return;leases.delete(kind);lease.controller.abort();for(const url of lease.urls)URL.revokeObjectURL(url);lease.urls.length=0;lease.story=null;}
 function prepare(kind){
  if(leases.has(kind))return leases.get(kind).promise;
  const lease={controller:new AbortController(),urls:[],story:null,ready:false,blobBytes:0};leases.set(kind,lease);
  const timer=setTimeout(()=>lease.controller.abort(),30000);
  lease.promise=(async()=>{
   try{
    const manifestURL=storyURLs[kind];
    const response=await fetch(manifestURL,{signal:lease.controller.signal});
    if(!response.ok)throw new Error('Story scripture could not load');
    const manifest=await response.json();
    const source={...manifest,cues:manifest.cues.map(c=>({...c,...(c.image?{image:new URL(c.image,manifestURL).href}:{}),...(c.music?{music:{...c.music,src:new URL(c.music.src,manifestURL).href}}:{})}))};
    const urls=[...new Set(source.cues.flatMap(c=>[c.image,c.music?.src]).filter(Boolean))];
    const entries=await Promise.all(urls.map(async url=>{const response=await fetch(url,{signal:lease.controller.signal});if(!response.ok)throw new Error(`Story media HTTP ${response.status}`);const blob=await response.blob();if(lease.controller.signal.aborted)throw new DOMException('Cancelled','AbortError');lease.blobBytes+=blob.size;const local=URL.createObjectURL(blob);lease.urls.push(local);return [url,local];}));
    const media=new Map(entries);
    lease.story={...source,cues:source.cues.map(c=>({...c,...(c.image?{image:media.get(c.image)}:{}),...(c.music?{music:{...c.music,src:media.get(c.music.src)}}:{})}))};
    // Decode the image before committing the story to the screen.
    await Promise.all(lease.story.cues.filter(c=>c.image).map(async c=>{const image=new Image();image.src=c.image;try{await image.decode();}finally{image.removeAttribute('src');}}));
    if(lease.controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
    lease.ready=true;return lease.story;
   }catch(error){if(leases.get(kind)===lease)release(kind);throw error;}finally{clearTimeout(timer);}
  })();
  return lease.promise;
 }
 return {getMemory:()=>[...leases].map(([kind,l])=>({kind,ready:l.ready,blobBytes:l.blobBytes,objectURLs:l.urls.length})),prepare,release,isReady(kind){return leases.get(kind)?.ready===true;},releaseAll(){for(const kind of [...leases.keys()])release(kind);}};
}
