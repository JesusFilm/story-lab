import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../../../prototypes/shepherd-adventure/src/startup.js',import.meta.url),'utf8');
function launch({query='',saved=null,memory=8,cores=8,connection={downlink:10,effectiveType:'4g'},coarse=false,storageDenied=false}={}){
 const storage=new Map(saved?[['shepherd-quality',saved]]:[]);
 const context={URL,URLSearchParams,navigator:{deviceMemory:memory,hardwareConcurrency:cores,connection},location:{search:query},matchMedia:()=>({matches:coarse}),performance:{now:()=>1,getEntriesByName:()=>[],getEntriesByType:()=>[],setResourceTimingBufferSize:()=>{}},localStorage:{getItem:k=>{if(storageDenied)throw Error();return storage.get(k)},setItem:(k,v)=>{if(storageDenied)throw Error();storage.set(k,v)}},addEventListener:()=>{},document:{baseURI:'https://example.test/story-lab/prototypes/shepherd-adventure/',currentScript:null}};
 context.window=context;runInNewContext(script,context);return context;
}
test('conservative capability policy uses several signals and missing-API fallback',()=>{
 assert.equal(launch().shepherdStartup.tier,'low');assert.equal(launch({coarse:true}).shepherdStartup.tier,'low');
 for(const hints of [{memory:4},{cores:4},{connection:{saveData:true}},{connection:{downlink:4}},{connection:{effectiveType:'3g'}},{memory:null,cores:null,connection:null}])assert.equal(launch(hints).shepherdStartup.tier,'minimal');
});
test('query and stored overrides are stable; blocked storage is harmless',()=>{
 assert.equal(launch({query:'?quality=existing',memory:2,saved:'low'}).shepherdStartup.tier,'existing');
 assert.equal(launch({query:'?quality=invalid',saved:'minimal'}).shepherdStartup.tier,'minimal');
 assert.equal(launch({query:'?quality=low',storageDenied:true}).shepherdStartup.tier,'low');
});
test('small tiers fail closed, then select the hosted derivative before loading',()=>{
 const c=launch({query:'?quality=minimal'});assert.throws(()=>c.shepherdStartup.asset('./assets/test.glb'),/asset list unavailable/);
 c.shepherdAssetVariants={minimal:{'assets/test.glb':'assets/quality/minimal/test.glb'}};
 assert.equal(c.shepherdStartup.asset('./assets/test.glb'),'https://example.test/story-lab/prototypes/shepherd-adventure/assets/quality/minimal/test.glb');
 assert.equal(launch({query:'?quality=existing'}).shepherdStartup.asset('./assets/test.glb'),'./assets/test.glb');
});
