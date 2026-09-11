import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const script=readFileSync(new URL('./loading-theatre.js',import.meta.url),'utf8');
for(const option of [1,2,3])for(const reduced of [false,true]){
 let frame,interval,draws=0,cancelled=false;
 const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{draws++})});
 const elements=Object.fromEntries(['#loading-text','.loading-note','.loading-pause','.loading-retry','.loading-elapsed'].map(k=>[k,{textContent:'',hidden:true}]));
 elements.canvas={clientWidth:360,getContext:()=>context};
 const root={dataset:{loadingOption:String(option)},hidden:false,querySelector:k=>elements[k]};
 const observers=[];
 const sandbox={document:{hidden:false,getElementById:()=>root},window:{addEventListener(){}},matchMedia:()=>({matches:reduced,addEventListener(){}}),performance:{now:()=>70000},devicePixelRatio:2,requestAnimationFrame:f=>(frame=f,1),cancelAnimationFrame:()=>{cancelled=true},setInterval:f=>(interval=f,1),clearInterval(){},ResizeObserver:class{observe(){}},MutationObserver:class{constructor(f){this.f=f}observe(el,opts){observers.push({el,opts,f:this.f})}}};
 vm.runInNewContext(script,sandbox);
 const before=draws;for(let i=1;i<800;i++)frame(70000+i*100);assert.equal(draws>before,!reduced);
 elements['.loading-pause'].onclick();assert.equal(elements['.loading-pause'].textContent,reduced?'Pause animation':'Play animation');
 sandbox.window.storyLoading.status('3 of 8 models');assert.equal(elements['#loading-text'].textContent,'3 of 8 models');
 sandbox.window.storyLoading.fail('Download failed');assert.equal(elements['.loading-retry'].hidden,false);sandbox.window.storyLoading.status('Oops');assert.equal(elements['#loading-text'].textContent,'Download failed');
 sandbox.window.storyLoading.ready();observers.find(o=>o.el===root).f();assert.equal(cancelled,true);assert.equal(root.hidden,true);
}
console.log('PASS: all three scenes at mobile width, long animation, reduced motion, pause, real status, failure, readiness cleanup');
