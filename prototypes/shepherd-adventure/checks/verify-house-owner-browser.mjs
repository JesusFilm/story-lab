import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.HOUSE_REVIEW_OUTPUT||fileURLToPath(new URL('../review/2026-09-15-companion-reunion/owner-regression/',import.meta.url));mkdirSync(out,{recursive:true});
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8766';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],state=p=>p.evaluate(()=>window.routeRehearsal.getState());
const ready=p=>p.waitForFunction(()=>window.routeRehearsal?.getState().ready,null,{timeout:120000});
const conversation=p=>p.waitForFunction(()=>!document.getElementById('sighting-overlay').hidden&&!document.getElementById('sighting-next').disabled);
const shot=(p,name)=>p.screenshot({path:out+'/'+name+'.png'});
async function jump(p,index){await p.locator('#review-tools').evaluate(e=>e.open=true);await p.locator('#jump-point').selectOption(String(index));await p.locator('#jump').click();}
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/rehearsal.html?point=8&stall-pose=house');await ready(p);await p.locator('#pause').click();await p.locator('#advance').click();
 await p.waitForFunction(()=>window.routeRehearsal.getState().index===8&&window.routeRehearsal.getState().destination===null,null,{timeout:45000});
 await p.waitForTimeout(700);assert.equal(await p.locator('#advance').textContent(),'Knock on the door');await shot(p,'01-arrival');
 await p.locator('#advance').dblclick();await p.waitForFunction(()=>window.routeRehearsal.getState().houseOwner.elapsed>.85);await p.locator('#pause').click();await shot(p,'02-knock');
 const held=(await state(p)).houseOwner;await p.waitForTimeout(300);assert.deepEqual((await state(p)).houseOwner,held);await p.locator('#pause').click();await conversation(p);
 assert.deepEqual((await state(p)).house.played,[0,1,2]);assert.equal((await state(p)).sighting.failed,false);await shot(p,'03-question');
 await p.locator('#sighting-next').click();assert.match(await p.locator('.sd-text').textContent(),/about to give birth/);await shot(p,'04-owner-labor');
 await p.locator('#sighting-next').click();assert.match(await p.locator('.sd-text').textContent(),/no room in my house/);await shot(p,'05-owner-shelter');
 await p.locator('#pause').click();assert(await p.locator('#sighting-next').isDisabled());await p.waitForTimeout(300);assert.equal((await state(p)).houseOwner.page,2);await p.locator('#pause').click();
 await p.locator('#sighting-next').click();await shot(p,'06-pointing');assert.match(await p.locator('.sd-text').textContent(),/far end/);await p.waitForTimeout(400);assert.equal((await state(p)).houseOwner.page,3);
 await p.locator('#sighting-next').click();await p.waitForFunction(()=>document.getElementById('sighting-overlay').hidden);assert.equal((await state(p)).destination,null);assert.equal((await state(p)).reunion.phase,'arriving');
 await p.getByRole('button',{name:'Tell them what you learned'}).waitFor({state:'visible',timeout:30000});
 await p.locator('#advance').click();await p.locator('#advance').click();await p.locator('#advance').click();
 assert.equal(await p.locator('#advance').textContent(),'Follow the others');await shot(p,'07-onward');
 await p.locator('#advance').dblclick();await p.waitForFunction(()=>window.routeRehearsal.getState().index===9&&window.routeRehearsal.getState().destination===null,null,{timeout:60000});assert.match(await p.locator('#beat').textContent(),/Scene pending/);await shot(p,'08-nativity-placeholder');
 await jump(p,8);assert.equal((await state(p)).houseOwner.phase,'ready');await p.locator('#advance').click();await p.waitForTimeout(300);await jump(p,6);assert.equal((await state(p)).sighting.open,false);
 // Shared presenter and knock still select House 8's own response and imagery.
 await p.locator('#advance').click();await conversation(p);await p.locator('#sighting-next').click();assert.match(await p.locator('.sd-text').textContent(),/empty stall by the gate/);await p.locator('#sighting-next').click();await p.waitForFunction(()=>document.getElementById('sighting-overlay').hidden);await p.waitForFunction(()=>document.getElementById('advance').textContent==='Go to the stall',{timeout:10000});assert.equal(await p.locator('#advance').textContent(),'Go to the stall');await p.locator('#advance').click();assert.equal((await state(p)).destination,7);
 await jump(p,8);await p.locator('#review-tools').evaluate(e=>e.open=true);await p.locator('#replay').click();await p.waitForFunction(()=>window.routeRehearsal.getState().index===8&&window.routeRehearsal.getState().destination===null,null,{timeout:45000});assert.equal((await state(p)).houseOwner.phase,'ready');await p.close();
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});m.on('pageerror',e=>errors.push(e.message));
 await m.addInitScript(()=>{window.AudioContext=class{constructor(){throw Error('Sound off test');}};});
 await m.goto(origin+'/rehearsal.html?point=9');await ready(m);await shot(m,'09-mobile-arrival');await m.locator('#advance').tap();await conversation(m);
 for(let i=0;i<3;i++){assert.equal(await m.locator('.sd-window').evaluate(e=>e.scrollHeight>e.clientHeight+1),false);await m.locator('#sighting-next').tap();}
 assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await shot(m,'10-mobile-pointing');await m.locator('#sighting-next').tap();assert.equal((await state(m)).reunion.phase,'arriving');await m.close();
 const f=await browser.newPage({viewport:{width:1280,height:720}});f.on('pageerror',e=>errors.push(e.message));await f.route('**/assets/house-9/*.png',r=>r.abort());
 await f.goto(origin+'/rehearsal.html?point=9');await ready(f);await f.locator('#advance').click();await conversation(f);assert((await state(f)).sighting.failed);
 for(let i=0;i<3;i++)await f.locator('#sighting-next').click();assert.match(await f.locator('.sd-text').textContent(),/far end/);await shot(f,'11-image-fallback');
 await f.unroute('**/assets/house-9/*.png');await f.locator('#sighting-retry').click();await conversation(f);assert.equal((await state(f)).sighting.failed,false);assert.equal((await state(f)).houseOwner.page,3);await f.locator('#sighting-next').click();await f.waitForFunction(()=>document.getElementById('sighting-overlay').hidden);await f.close();
 assert.deepEqual(errors,[]);console.log('PASS House 9 browser: incoming walk, knock/pause, all dialogue, explicit departure, later placeholder, House 8 regression, replay, silent portrait/reduced motion, image failure/retry; no page errors.');
}finally{await browser.close();}
