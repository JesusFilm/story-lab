import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.HOUSE_REVIEW_OUTPUT||fileURLToPath(new URL('../review/2026-09-13-house-1/',import.meta.url));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8766';
const state=p=>p.evaluate(()=>window.routeRehearsal.getState());
const ready=p=>p.waitForFunction(()=>window.routeRehearsal?.getState().ready,null,{timeout:120000});
const shot=(p,n)=>p.screenshot({path:out+n+'.png'});
async function jump(p,index){await p.locator('#review-tools').evaluate(e=>e.open=true);await p.locator('#jump-point').selectOption(String(index));await p.locator('#jump').click();}
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/rehearsal.html?point=2');await ready(p);await shot(p,'01-ready');
 assert.equal(await p.locator('#advance').textContent(),'Knock on door');await p.locator('#advance').click();
 await p.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.elapsed>.86);await shot(p,'02-knock');
 await p.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.phase==='refusal');await shot(p,'03-response');
 assert((await state(p)).house.light>0);assert((await state(p)).house.voiceReady);assert.equal((await state(p)).house.audioFailed,false);
 await p.locator('#pause').click();const held=(await state(p)).houseRejection.elapsed;await p.waitForTimeout(400);assert.equal((await state(p)).houseRejection.elapsed,held);assert(await p.locator('#advance').isDisabled());await p.locator('#pause').click();
 await p.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.complete);await shot(p,'04-next-action');assert.equal((await state(p)).house.light,0);assert.deepEqual((await state(p)).house.played,[0,1,2,'voice']);
 await p.locator('#advance').click();await p.waitForFunction(()=>window.routeRehearsal.getState().index===2&&!window.routeRehearsal.getState().destination,null,{timeout:30000});await shot(p,'05-house-3');assert.equal(await p.locator('#advance').textContent(),'Knock on door');
 await p.locator('#advance').click();await p.waitForFunction(()=>!document.getElementById('sighting-overlay').hidden&&!document.getElementById('sighting-next').disabled);for(let i=0;i<4;i++)await p.locator('#sighting-next').click();
 await p.locator('#advance').click();await p.waitForFunction(()=>window.routeRehearsal.getState().index===3&&!window.routeRehearsal.getState().destination,null,{timeout:30000});assert.equal((await state(p)).gateOpen,false);
 await jump(p,1);assert.equal((await state(p)).houseRejection.phase,'ready');await p.locator('#advance').click();await p.waitForTimeout(2800);await jump(p,4);assert.equal((await state(p)).house.light,0);
 await jump(p,1);assert.equal((await state(p)).house.light,0);
 await p.locator('#review-tools').evaluate(e=>e.open=true);await p.locator('#replay').click();await p.waitForFunction(()=>window.routeRehearsal.getState().index===1&&!window.routeRehearsal.getState().destination,null,{timeout:30000});await shot(p,'06-incoming-walk');assert.equal((await state(p)).houseRejection.phase,'ready');
 await jump(p,0);await p.locator('#advance').click();
 for(let i=0;i<6;i++)await p.locator('#lamp-action').click();
 assert((await state(p)).lantern);await p.locator('#advance').click();await p.waitForFunction(()=>window.routeRehearsal.getState().index===1&&!window.routeRehearsal.getState().destination,null,{timeout:30000});
 assert.equal(await p.locator('#advance').textContent(),'Knock on door');await shot(p,'10-lamp-to-house-walk');
 assert.deepEqual(errors,[]);await p.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await mobile.goto(origin+'/rehearsal.html?point=2');await ready(mobile);await shot(mobile,'07-mobile-ready');await mobile.locator('#advance').tap();await mobile.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.phase==='refusal');await shot(mobile,'08-mobile-response');await mobile.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.complete);await shot(mobile,'09-mobile-next');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.locator('#advance').tap();assert.equal((await state(mobile)).destination,2);await mobile.close();
 const silent=await browser.newPage();await silent.route('**/resident-refusal.mp3',r=>r.abort());await silent.goto(origin+'/rehearsal.html?point=2');await ready(silent);await silent.locator('#advance').click();await silent.waitForFunction(()=>window.routeRehearsal.getState().houseRejection.complete);assert((await state(silent)).house.audioFailed);assert(await silent.locator('#advance').isEnabled());await silent.close();
 console.log('PASS desktop and mobile: knocks/voice loaded, light timing, pause, next-house walk, gate placeholder, interruption/replay, portrait reduced motion, unavailable voice fallback, no page errors.');
}finally{await browser.close();}
