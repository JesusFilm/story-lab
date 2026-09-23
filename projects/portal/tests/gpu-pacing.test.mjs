import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../../../prototypes/shepherd-adventure/src/mobile-rendering.mjs',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'').replace(/\bexport /g,'');
function fixture(){
 let now=0,draws=0,deleted=0,failures=0,state=0,lost=false,onVisibility=()=>{};
 const gl={ALREADY_SIGNALED:1,CONDITION_SATISFIED:2,WAIT_FAILED:3,SYNC_GPU_COMMANDS_COMPLETE:4,clientWaitSync:()=>state,isContextLost:()=>lost,fenceSync:()=>({}),deleteSync:()=>deleted++,flush(){}};
 const document={hidden:false,getElementById:()=>({}),addEventListener(type,callback){if(type==='visibilitychange')onVisibility=callback}};
 const context={Vector3:class{},document,performance:{now:()=>now},console,window:{storyLoading:{show(){},fail(){failures++}},shepherdStartup:{mark(){},failure(){}}}};
 const watch=runInNewContext(source+';watchRenderer',context);
 const renderer={getContext:()=>gl,domElement:{addEventListener(){}},debug:{},info:{render:{calls:1,triangles:1}},render(){draws++}};
 const guard=watch(renderer,{mobile:false});
 return {renderer,guard,document,now:v=>now=v,state:v=>state=v,lost:()=>lost=true,visibility:()=>onVisibility(),get draws(){return draws},get deleted(){return deleted},get failures(){return failures}};
}
test('only one GPU frame is in flight; completion releases the next draw',()=>{
 const f=fixture();f.renderer.render({},{});assert.equal(f.draws,1);assert.equal(f.guard.canRender(),false);
 for(let i=0;i<20;i++)f.renderer.render({},{});assert.equal(f.draws,1);assert.equal(f.guard.frames,1);
 f.state(1);assert.equal(f.guard.canRender(),true);assert.equal(f.deleted,1);f.renderer.render({},{});assert.equal(f.draws,2);
});
test('a visibly stuck GPU produces one actionable failure instead of queuing draws',()=>{
 const f=fixture();f.renderer.render({},{});f.guard.canRender();f.now(30001);assert.equal(f.guard.canRender(),false);assert.equal(f.guard.failed,true);assert.equal(f.failures,1);assert.equal(f.draws,1);f.guard.canRender();assert.equal(f.failures,1);
});
test('background time is excluded from the GPU stall deadline',()=>{
 const f=fixture();f.renderer.render({},{});f.guard.canRender();f.document.hidden=true;f.visibility();f.now(60000);assert.equal(f.guard.failed,false);
 f.document.hidden=false;f.visibility();f.guard.canRender();f.now(80000);f.guard.canRender();assert.equal(f.guard.failed,false);f.state(2);assert.equal(f.guard.canRender(),true);
});
test('context loss during an in-flight frame stops readiness',()=>{
 const f=fixture();f.renderer.render({},{});f.lost();assert.equal(f.guard.canRender(),false);assert.equal(f.guard.failed,true);assert.equal(f.failures,1);
});
