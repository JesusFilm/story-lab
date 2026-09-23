import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../../../prototypes/shepherd-adventure/src/startup.js',import.meta.url),'utf8');
function launch({query='',saved=null,memory=8,cores=8,connection={downlink:10},coarse=false,fine=true,ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform='',touch=0,ch,storageDenied=false}={}){
 const storage=new Map(saved?[['shepherd-quality',saved]]:[]);
 const context={URL,URLSearchParams,requestAnimationFrame:()=>{},navigator:{userAgent:ua,platform,maxTouchPoints:touch,userAgentData:ch,deviceMemory:memory,hardwareConcurrency:cores,connection},location:{search:query},matchMedia:q=>({matches:q==='(pointer: coarse)'?coarse:fine}),performance:{now:()=>1,getEntriesByName:()=>[],getEntriesByType:()=>[],setResourceTimingBufferSize:()=>{}},addEventListener:()=>{},document:{baseURI:'https://example.test/story-lab/prototypes/shepherd-adventure/',currentScript:null}};
 Object.defineProperty(context,'localStorage',{get(){if(storageDenied)throw Error('blocked');return {getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}}});
 context.window=context;runInNewContext(script,context);return context;
}
const phone={ua:'Mozilla/5.0 (Linux; Android 11; SM-A505F) Mobile Safari/537.36',touch:5,coarse:true,fine:false};
test('mobile/tablets remain Minimal regardless of apparent capacity',()=>{
 for(const options of [phone,{...phone,memory:4,cores:8,connection:{downlink:4}}, {...phone,memory:16,cores:16}, {ua:'masked',ch:{mobile:true}}, {ua:'masked',ch:{mobile:false,platform:'Android'}}, {ua:'Mozilla/5.0 (Linux; Android 10; K)',ch:{mobile:false}}, {ua:'Mozilla/5.0 (iPad; CPU OS 17)'}, {ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X)',platform:'MacIntel',touch:5}, {ua:'Mozilla/5.0 (X11; Linux x86_64)',platform:'Linux x86_64',touch:5,coarse:true,fine:false}, {ua:'',touch:5,coarse:true,fine:false}])assert.equal(launch(options).shepherdStartup.tier,'minimal',JSON.stringify(options));
});
test('desktops including absent APIs and touch laptops default to Original',()=>{
 for(const options of [{},{memory:null,cores:null,connection:null},{memory:2,cores:2,connection:{saveData:true,downlink:1}}, {coarse:true,touch:10,fine:false}, {ua:'Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/18 Safari',platform:'MacIntel',memory:null}, {ua:'Mozilla/5.0 (X11; Linux x86_64) Firefox/140',memory:null}, {ua:'X11 Linux x86_64',coarse:true,touch:5,fine:true},{ua:'CrOS',coarse:true,touch:5,fine:false}, {ua:'',coarse:true,touch:0}])assert.equal(launch(options).shepherdStartup.tier,'existing',JSON.stringify(options));
});
test('legacy storage and bare quality links are ignored; diagnostics overrides are visit-only',()=>{
 for(const saved of ['minimal','low','existing']){
  assert.equal(launch({saved}).shepherdStartup.tier,'existing');
  assert.equal(launch({...phone,saved}).shepherdStartup.tier,'minimal');
 }
 assert.equal(launch({...phone,query:'?quality=existing'}).shepherdStartup.tier,'minimal');
 for(const tier of ['minimal','low','existing']){
  const c=launch({...phone,query:`?diagnostics&quality=${tier}`,storageDenied:true});
  assert.equal(c.shepherdStartup.tier,tier);assert.equal(c.shepherdStartup.report().selection,'diagnostic-override');
 }
 assert.equal(launch({query:'?diagnostics&quality=invalid',saved:'minimal',storageDenied:true}).shepherdStartup.tier,'existing');
 assert.equal(launch({...phone,storageDenied:true}).shepherdStartup.report().reason,'mobile-user-agent');
});
test('automatic routing uses hosted derivatives before any media loads; missing table fails closed',()=>{
 const c=launch(phone);assert.throws(()=>c.shepherdStartup.asset('./assets/test.glb'),/asset list unavailable/);
 c.shepherdAssetVariants={minimal:{'assets/test.glb':'assets/quality/minimal/test.glb'}};
 assert.equal(c.shepherdStartup.asset('./assets/test.glb'),'https://example.test/story-lab/prototypes/shepherd-adventure/assets/quality/minimal/test.glb');
 c.navigator.userAgent='Desktop';assert.equal(c.shepherdStartup.tier,'minimal');
 assert.equal(launch().shepherdStartup.asset('./assets/test.glb'),'./assets/test.glb');
});
