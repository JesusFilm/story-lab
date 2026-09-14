import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {mkdirSync} from 'node:fs';
const out=fileURLToPath(new URL('../review/2026-09-14-house-5',import.meta.url));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
try{for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:720},reducedMotion:mobile?'reduce':'no-preference'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8766/rehearsal.html?point=5');await page.waitForFunction(()=>window.routeRehearsal?.getState().ready,null,{timeout:120000});
await page.screenshot({path:out+`/${mobile?'mobile-':''}arrival.png`});
await page.locator('#advance').click();await page.waitForTimeout(1000);if(!mobile)await page.screenshot({path:out+'/knock.png'});
await page.waitForFunction(()=>window.routeRehearsal.getState().houseTracks.phase==='unanswered');
assert.deepEqual((await page.evaluate(()=>window.routeRehearsal.getState())).house.played,[0,1,2,3,4,5]);
if(!mobile)await page.screenshot({path:out+'/unanswered.png'});
await page.locator('#advance').click();await page.waitForTimeout(2000);await page.locator('#pause').click();const held=await page.evaluate(()=>window.routeRehearsal.getState().houseTracks);await page.waitForTimeout(400);assert.deepEqual(await page.evaluate(()=>window.routeRehearsal.getState().houseTracks),held);if(!mobile)await page.screenshot({path:out+'/well-search.png'});await page.locator('#pause').click();await page.waitForFunction(()=>window.routeRehearsal.getState().houseTracks.spotted);await page.waitForTimeout(2000);
await page.screenshot({path:out+`/${mobile?'mobile-':''}tracks.png`});
await page.locator('#advance').click();await page.waitForFunction(()=>window.routeRehearsal.getState().index===5,null,{timeout:45000});
assert.deepEqual(errors,[]);console.log(JSON.stringify({mobile,errors,state:await page.locator('#beat').textContent()}));await page.close();
}}finally{await browser.close();}
