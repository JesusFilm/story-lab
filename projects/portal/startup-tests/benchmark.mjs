import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const base=process.env.BENCH_URL||'http://127.0.0.1:8962/story-lab/prototypes/shepherd-adventure/';
const output=process.env.BENCH_OUT||'test-results/startup';await fs.mkdir(output,{recursive:true});
export const matrix={fast:{cpu:1},cpu4:{cpu:4},cpu6:{cpu:6},reported4:{cpu:1,bytes:500000,latency:150},net16:{cpu:1,bytes:200000,latency:150},net05:{cpu:1,bytes:62500,latency:400},combined4:{cpu:4,bytes:500000,latency:150},combined16:{cpu:4,bytes:200000,latency:150},combined05:{cpu:6,bytes:62500,latency:400}};
const names=(process.env.BENCH_CASES||Object.keys(matrix).join(',')).split(',');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
const browserCDP=await browser.newBrowserCDPSession();
for(const name of names)for(const tier of (process.env.BENCH_TIERS||'existing').split(',')){
 const config=matrix[name];if(!config)throw Error(name);
 const context=await browser.newContext({viewport:{width:393,height:851},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript({path:new URL('./probe.js',import.meta.url).pathname});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:config.cpu});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:config.latency||0,downloadThroughput:config.bytes||-1,uploadThroughput:config.bytes||-1,connectionType:'wifi'});
 await page.goto(new URL('/story-lab/__probe.html',base).href);
 const calibration=await page.evaluate(async()=>{
  const start=performance.now();const response=await fetch('/story-lab/__probe.bin');const data=await response.arrayBuffer();const end=performance.now();
  const samples=[];for(let j=0;j<3;j++){let n=0;const t=performance.now();for(let i=0;i<12000000;i++)n=(n*1664525+1013904223)|0;samples.push({ms:performance.now()-t,n});}
  return {networkMs:end-start,bytes:data.byteLength,cpu:samples};
 });
 if(calibration.bytes!==256000)throw Error('Calibration endpoint unavailable');
 if(config.bytes&&calibration.networkMs<calibration.bytes/config.bytes*1000*.85)throw Error('Network throttle ineffective');
 for(const cache of (process.env.BENCH_CACHE||'cold,warm').split(',')){
  if(cache==='cold')await cdp.send('Network.clearBrowserCache');
  const result={name,tier,cache,config,calibration,version:browser.version(),platform:os.release(),cpus:os.cpus().length,date:new Date().toISOString(),base,events:[],network:[],status:'running',cacheNote:cache==='warm'?'Reuses the preceding attempt cache; a failed cold attempt may only partially prime it.':'Browser HTTP cache cleared.'};
  const onError=e=>result.events.push({type:'pageerror',message:e.message});const onCrash=()=>result.events.push({type:'crash'});
  const onResponse=r=>{if(r.status()>=400)result.events.push({type:'http',url:r.url(),status:r.status()});};
  result.phases=[];result.requests=[];const requests=new Map();
  const onRequest=e=>{if(!/^https?:/.test(e.request.url))return;const request={path:new URL(e.request.url).pathname,start:e.timestamp,type:e.type,receivedBodyBytes:0};requests.set(e.requestId,request);result.requests.push(request);};
  const onData=e=>{const request=requests.get(e.requestId);if(request)request.receivedBodyBytes+=e.encodedDataLength;};
  cdp.on('Network.dataReceived',onData);
  const onFailed=e=>result.events.push({type:'network-failed',path:requests.get(e.requestId)?.path,message:e.errorText,canceled:e.canceled});
  cdp.on('Network.requestWillBeSent',onRequest);cdp.on('Network.loadingFailed',onFailed);
  const onFinish=e=>result.network.push({...requests.get(e.requestId),bytes:e.encodedDataLength,end:e.timestamp});
  page.on('pageerror',onError);page.on('crash',onCrash);page.on('response',onResponse);cdp.on('Network.loadingFinished',onFinish);
  const checkpoint=setInterval(()=>fs.writeFile(path.join(output,`${name}-${tier}-${cache}-partial.json`),JSON.stringify(result,null,2)).catch(()=>{}),10000);
  const wallStart=Date.now();let timer;const timeout=Number(process.env.BENCH_TIMEOUT||120000);
  try{await Promise.race([(async()=>{
   await page.goto('about:blank');
   await page.goto(base+`?quality=${tier}&diagnostics`,{waitUntil:'domcontentloaded',timeout});
   await page.locator('#story-overlay').waitFor({state:'visible',timeout});
   result.phases.push({phase:'diorama-visible',wallMs:Date.now()-wallStart});await page.evaluate(()=>startupProbe.mark('diorama-visible-harness'));
   await page.screenshot({path:path.join(output,`${name}-${tier}-${cache}-diorama.png`),scale:'css',timeout:15000});
   await page.locator('#story-next').tap();await page.waitForFunction(()=>document.querySelector('#story-next').textContent==='Next verse');
   // A short, fixed observation window detects background preparation contention.
   await page.waitForTimeout(2000);
   await page.locator('#story-skip').tap();
   await page.locator('#skip-opening').waitFor({state:'visible',timeout});
   result.phases.push({phase:'world-visible',wallMs:Date.now()-wallStart});await page.evaluate(()=>startupProbe.mark('world-first-frame-harness'));
   await page.locator('#skip-opening').tap();
   await page.waitForFunction(()=>document.querySelector('#advance').textContent==='Find a lamp');
   
   await page.locator('#advance').tap();
   await page.waitForFunction(()=>window.routeRehearsal.getState().destination===0);
   await page.evaluate(()=>startupProbe.mark('touch-movement'));
   if(tier!=='existing'&&await page.evaluate(()=>window.shepherdStartup?.tier)!==tier)throw Error('Requested quality was not selected');
   if(result.events.some(e=>['pageerror','crash','http'].includes(e.type)))throw Error('Browser errors during launch');
   // A timed-out Playwright operation can finish while partial evidence is
   // being saved. It must never turn a bounded failure back into success.
   if(result.status==='running')result.status='passed';
  })(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(`bounded ${timeout}ms timeout`)),timeout))]);}
  catch(e){result.status='failed';result.error=e.message;}
  finally{clearTimeout(timer);clearInterval(checkpoint);result.processes=await browserCDP.send('SystemInfo.getProcessInfo').then(async r=>Promise.all(r.processInfo.map(async p=>{const status=await fs.readFile(`/proc/${p.id}/status`,'utf8').catch(()=> '');return {type:p.type,cpuSeconds:p.cpuTime,rssKiB:Number(status.match(/VmRSS:\s+(\d+)/)?.[1]||0)};}))).catch(()=>null);result.probe=await Promise.race([page.evaluate(()=>({probe:window.startupProbe?.report(),diagnostics:window.shepherdStartup?.report(),state:window.routeRehearsal?.getState()})).catch(()=>null),new Promise(r=>setTimeout(()=>r(null),5000))]);
   await fs.writeFile(path.join(output,`${name}-${tier}-${cache}.json`),JSON.stringify(result,null,2));console.log(name,tier,cache,result.status,result.probe?.probe?.marks.filter(m=>['diorama-visible-harness','world-first-frame-harness','touch-movement'].includes(m.phase)));
   page.off('pageerror',onError);page.off('crash',onCrash);page.off('response',onResponse);cdp.off('Network.loadingFinished',onFinish);cdp.off('Network.requestWillBeSent',onRequest);cdp.off('Network.dataReceived',onData);cdp.off('Network.loadingFailed',onFailed);
  }
  if(result.status==='failed'){await page.goto('about:blank',{timeout:5000}).catch(()=>{});}if(!result.probe)break;
 }
 await context.close();
}
await browser.close();
