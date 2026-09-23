import {test,expect} from '@playwright/test';
const entry='prototypes/shepherd-adventure/';
test.afterEach(async({page},info)=>{const report=await page.evaluate(()=>window.shepherdStartup?.report()).catch(()=>null);await info.attach('startup-diagnostics',{body:JSON.stringify(report,null,2),contentType:'application/json'});});
async function pixels(page){return page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
 const gl=document.querySelector('#world').getContext('webgl2'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,data=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
 const colors=new Set();let lit=0,n=0;for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const i=(y*w+x)*4;colors.add((data[i]>>3)*1024+(data[i+1]>>3)*32+(data[i+2]>>3));lit+=Math.max(data[i],data[i+1],data[i+2])>35;n++;}resolve({colors:colors.size,lit:lit/n});
})));}
async function rendered(page){await expect.poll(async()=>{const p=await pixels(page);return p.colors>24&&p.lit>.03;},{timeout:30000}).toBe(true);}
function assetViolations(resources,tier){return resources.filter(r=>/\/assets\/.*\.(glb|gltf|bin|png|jpg|webp)(?:$|\?)/.test(r.path)&&!r.path.includes(`/quality/${tier}/`));}
async function capture(page,info,name){await page.locator('#pause').tap();await expect(page.locator('#player-options')).toBeVisible();await page.locator('#player-options').evaluate(e=>e.style.visibility='hidden');await info.attach(name,{body:await page.screenshot({scale:'css'}),contentType:'image/png'});await page.locator('#player-options').evaluate(e=>e.style.visibility='');await page.locator('#player-resume').tap();}

test('4 Mbps + 4x CPU cold launch: responsive diorama, smaller assets, lamp and first house',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('crash'));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.clearBrowserCache');
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:500000,uploadThroughput:500000,connectionType:'wifi'});
 await page.goto('/story-lab/__probe.html');
 const calibration=await page.evaluate(async()=>{const t=performance.now();const bytes=(await(await fetch('/story-lab/__probe.bin')).arrayBuffer()).byteLength;return {bytes,ms:performance.now()-t};});
 expect(calibration.bytes).toBe(256000);expect(calibration.ms).toBeGreaterThan(450);
 const requests=new Map(),received=new Map(),finished=new Map();
 cdp.on('Network.requestWillBeSent',e=>{if(/^https?:/.test(e.request.url))requests.set(e.requestId,{path:new URL(e.request.url).pathname});});
 cdp.on('Network.dataReceived',e=>{if(requests.has(e.requestId))received.set(e.requestId,(received.get(e.requestId)||0)+e.encodedDataLength);});
 cdp.on('Network.loadingFinished',e=>{if(requests.has(e.requestId))finished.set(e.requestId,e.encodedDataLength);});
 const observedTransfer=()=>[...requests.keys()].reduce((n,id)=>n+(finished.get(id)??received.get(id)??0),0);
 await page.goto(entry+'?quality=minimal&diagnostics');
 await expect(page.locator('#story-overlay')).toBeVisible({timeout:15000});
 await expect.poll(()=>page.locator('#story-scene img:visible').first().evaluate(img=>img.complete&&img.naturalWidth>100)).toBe(true);
 const shown=await page.evaluate(()=>performance.now());expect(shown).toBeLessThan(15000);
 await info.attach('diorama',{body:await page.screenshot({scale:'css'}),contentType:'image/png'});
 await page.locator('#story-next').tap();await expect(page.locator('#story-next')).toHaveText('Next verse');
 await page.waitForTimeout(1200);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('village-game')||/\.(glb|gltf)$/.test(r.name)))).toBe(false);
 const story=await page.evaluate(()=>shepherdStartup.report());
 expect(Math.max(0,...story.inputs.filter(x=>x.target==='story-next').map(x=>x.queue+x.paint))).toBeLessThan(1200);
 await page.locator('#story-skip').tap();
 await expect(page.locator('#loading')).toBeHidden({timeout:65000});
 await expect(page.locator('#skip-opening')).toBeVisible();await page.locator('#skip-opening').tap();await rendered(page);
 const report=await page.evaluate(()=>shepherdStartup.report());
 expect(report.marks.find(x=>x.phase==='world-ready').ms).toBeLessThan(75000);
 expect(assetViolations([...requests.values()],'minimal')).toEqual([]);
 expect(requests.size).toBeLessThanOrEqual(115);
 expect(report.resources.filter(r=>r.path.includes('/assets/')).length).toBeLessThanOrEqual(55);
 const startupTransferBytes=observedTransfer();expect(startupTransferBytes).toBeLessThan(10000000);
 expect(report.resources.some(r=>r.path.includes('square-nativity-stall'))).toBe(false);
 expect(Math.max(0,...report.longTasks.filter(x=>x.start<report.marks.find(m=>m.phase==='world-ready').ms).map(x=>x.duration))).toBeLessThan(6000);
 // Fault control: the budget rejects one accidentally fetched original.
 expect(assetViolations([...report.resources,{path:'/assets/shepherd-tripo-v2.glb'}],'minimal')).toHaveLength(1);
 await capture(page,info,'minimal-entry');
 await page.locator('#advance').tap();await expect(page.locator('#advance')).toHaveText('Get a lamp!',{timeout:90000});await page.locator('#advance').tap();
 for(let i=0;i<6;i++){const button=page.locator('#lamp-action');await expect(button).toBeVisible();const label=await button.textContent();await button.tap();if(label==='Take lamp')break;await expect(button).not.toHaveText(label);}
 await expect.poll(()=>page.evaluate(()=>routeRehearsal.getState().lantern)).toBe(true);
 await page.locator('#advance').tap();await expect(page.locator('#advance')).toHaveText('Knock on door',{timeout:90000});await page.locator('#advance').tap();
 await expect.poll(()=>page.evaluate(()=>routeRehearsal.getState().houseRejection.complete),{timeout:40000}).toBe(true);await rendered(page);await capture(page,info,'minimal-first-house');
 expect(errors).toEqual([]);
 await info.attach('measurements',{body:JSON.stringify({calibration,startupTransferBytes,report:await page.evaluate(()=>shepherdStartup.report()),pixels:await pixels(page),state:await page.evaluate(()=>routeRehearsal.getState())},null,2),contentType:'application/json'});
});

test('selection, persistence, absent APIs, invalid override and low/original asset routing',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'deviceMemory',{get:()=>undefined});Object.defineProperty(navigator,'connection',{get:()=>undefined});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>undefined});});
 await page.goto(entry+'?quality=invalid');await expect(page.locator('#story-overlay')).toBeVisible();expect(await page.evaluate(()=>shepherdStartup.tier)).toBe('minimal');
 await page.goto(entry+'?quality=low');await expect(page.locator('#story-overlay')).toBeVisible();expect(await page.evaluate(()=>shepherdStartup.tier)).toBe('low');expect(assetViolations(await page.evaluate(()=>shepherdStartup.report().resources),'low')).toEqual([]);
 await page.goto(entry);await expect(page.locator('#story-overlay')).toBeVisible();expect(await page.evaluate(()=>shepherdStartup.tier)).toBe('low');
 await page.goto(entry+'?quality=existing');await expect(page.locator('#story-overlay')).toBeVisible();expect(await page.evaluate(()=>shepherdStartup.asset('./assets/shepherd-tripo-v2.glb'))).toBe('./assets/shepherd-tripo-v2.glb');
 // Storage denial must not prevent startup or a query override.
 await page.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw Error('blocked storage');};});
 await page.goto(entry+'?quality=minimal');await expect(page.locator('#story-overlay')).toBeVisible();expect(await page.evaluate(()=>shepherdStartup.tier)).toBe('minimal');
});

test('desktop low tier and mobile original render regression',async({browser},info)=>{
 for(const tier of ['low','existing']){
  const context=await browser.newContext({viewport:tier==='existing'?{width:393,height:851}:{width:1024,height:768},isMobile:tier==='existing',hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8964/story-lab/'+entry+'?quality='+tier);await expect(page.locator('#story-overlay')).toBeVisible();await page.locator('#story-skip').tap();await expect(page.locator('#loading')).toBeHidden({timeout:100000});await page.locator('#skip-opening').tap();await rendered(page);
  await info.attach(tier+'-pixels',{body:JSON.stringify(await pixels(page)),contentType:'application/json'});expect(errors).toEqual([]);await context.close();
 }
});

test('staged later-route check: deferred shelter loads once, renders and reports failure',async({page},info)=>{
 await page.goto(entry+'?quality=minimal&diagnostics');await expect(page.locator('#story-overlay')).toBeVisible();await page.locator('#story-skip').tap();await expect(page.locator('#loading')).toBeHidden({timeout:60000});await page.locator('#skip-opening').tap();
 expect(await page.evaluate(()=>shepherdStartup.report().resources.some(r=>r.path.includes('square-nativity-stall')))).toBe(false);
 // Explicitly staged via the existing review control, not a claimed full walk.
 await page.evaluate(()=>{document.querySelector('#jump-point').value='8';document.querySelector('#jump').click();});
 await page.route('**/quality/minimal/optimized/square-nativity-stall.glb',route=>route.abort());
 await page.locator('#advance').tap();await expect(page.locator('#loading-text')).toContainText('shelter could not load');await expect(page.locator('.loading-retry')).toBeVisible();
 await page.unroute('**/quality/minimal/optimized/square-nativity-stall.glb');await page.locator('.loading-retry').tap();await expect(page.locator('#story-overlay')).toBeVisible();await page.locator('#story-skip').tap();await expect(page.locator('#loading')).toBeHidden({timeout:60000});await page.locator('#skip-opening').tap();
 await page.evaluate(()=>{document.querySelector('#jump-point').value='8';document.querySelector('#jump').click();});await page.locator('#advance').tap();await expect(page.locator('#loading')).toBeHidden({timeout:60000});
 await expect.poll(()=>page.evaluate(()=>shepherdStartup.report().marks.filter(m=>m.phase==='final-area-ready').length)).toBe(1);
 const resources=await page.evaluate(()=>shepherdStartup.report().resources);expect(resources.some(r=>r.path.includes('/minimal/optimized/square-nativity-stall.glb'))).toBe(true);expect(assetViolations(resources,'minimal')).toEqual([]);
 await page.evaluate(()=>{document.querySelector('#jump-point').value='9';document.querySelector('#jump').click();});await rendered(page);await capture(page,info,'minimal-shelter-staged');
});

test('missing small-asset table fails closed without original downloads',async({page})=>{
 const originals=[];page.on('request',request=>{if(/\/assets\/.*\.(glb|gltf|png|jpg)$/.test(request.url())&&!request.url().includes('/quality/'))originals.push(request.url());});
 await page.route('**/src/quality-assets.js',route=>route.abort());
 await page.goto(entry+'?quality=minimal');await expect(page.locator('.loading-retry')).toBeVisible();expect(originals).toEqual([]);await expect(page.locator('#story-overlay')).toBeHidden();
});
