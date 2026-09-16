import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8766';
const out=fileURLToPath(new URL('../review/2026-09-13-lamp-workbench/',import.meta.url));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const ready=page=>page.waitForFunction(()=>window.routeRehearsal?.getState().ready,null,{timeout:120000});
const state=page=>page.evaluate(()=>window.routeRehearsal.getState());
const capture=(page,name)=>page.screenshot({path:out+'/'+name+'.png'});
try{
 if(process.argv.includes('--baseline')){
  const p=await browser.newPage({viewport:{width:1440,height:900}});
  for(const path of ['rehearsal.html','rehearsal.css','src/rehearsal.mjs','src/rehearsal-route.mjs','src/journey-world.mjs']){
   const body=execFileSync('git',['show','HEAD:prototypes/shepherd-adventure/'+path],{encoding:'utf8'});
   await p.route('**/'+path+(path.endsWith('.html')?'*':''),r=>r.fulfill({status:200,contentType:path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'text/javascript',body}));
  }
  await p.goto(origin+'/rehearsal.html?point=1');await ready(p);await capture(p,'before-staged');await p.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/rehearsal.html?point=1');await ready(page);await capture(page,'after-staged');
 await page.locator('#advance').click();await page.waitForTimeout(1200);await capture(page,'01-lamp-body');
 assert.equal((await state(page)).lantern,false);
 await page.locator('#lamp-action').click();await page.locator('#lamp-title').filter({hasText:'Linen wick'}).waitFor();await capture(page,'02-wick');
 await page.locator('#lamp-back').click();assert.equal((await state(page)).lampAssembly.step,1);await page.locator('#advance').click();
 await page.locator('#pause').click();assert(await page.locator('#lamp-action').isDisabled());await page.locator('#pause').click();
 await page.locator('#lamp-action').click();await capture(page,'03-oil');assert.equal((await state(page)).lamp.benches[0].wickVisible,false);
 await page.locator('#lamp-action').click();await capture(page,'04-flint');
 await page.locator('#lamp-action').click();await capture(page,'05-ready-to-light');
 assert.equal((await state(page)).lantern,false);await page.locator('#lamp-action').click();await page.waitForTimeout(900);await capture(page,'06-lit');
 assert.equal((await state(page)).lamp.benches[0].lit,true);assert.equal((await state(page)).lantern,false);
 await page.locator('#lamp-action').click();await page.waitForTimeout(700);await capture(page,'07-collected');
 assert.equal((await state(page)).lantern,true);assert.equal((await state(page)).lamp.benches[0].lampVisible,false);assert(await page.locator('#lamp-reward').isVisible());
 await page.locator('#advance').click();await page.waitForTimeout(1800);await capture(page,'08-departure');
 await page.waitForFunction(()=>window.routeRehearsal.getState().index===1&&!window.routeRehearsal.getState().destination,null,{timeout:45000});
 assert.equal(await page.locator('#advance').textContent(),'Knock on door');assert.equal((await state(page)).lantern,true);await capture(page,'09-house-1-placeholder');
 await page.locator('#review-tools').evaluate(e=>e.open=true);await page.locator('#jump-point').selectOption('0');await page.locator('#jump').click();assert.equal((await state(page)).lantern,false);assert.equal((await state(page)).lampAssembly.step,0);
 await page.locator('#review-tools').evaluate(e=>e.open=true);await page.locator('#restart').click();assert.equal((await state(page)).lampAssembly.step,0);assert.equal((await state(page)).index,-1);
 await page.locator('#advance').click();await page.waitForFunction(()=>window.routeRehearsal.getState().index===0&&!window.routeRehearsal.getState().destination,null,{timeout:45000});await capture(page,'10-full-incoming-walk');
 assert.deepEqual(errors,[]);await page.close();
 console.log('PASS desktop: actual incoming walk, each item, back/resume, pause, flame before collection, one award, departure to House 1 knock action, jump/reset.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});
 await mobile.goto(origin+'/rehearsal.html?point=1');await ready(mobile);await mobile.locator('#advance').click();await capture(mobile,'11-mobile-body');
 for(let i=0;i<5;i++){await mobile.locator('#lamp-action').click();}
 await capture(mobile,'12-mobile-lit');assert(await mobile.locator('#lamp-action').isVisible());assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.locator('#lamp-action').click();assert.equal((await state(mobile)).lantern,true);await mobile.close();
 console.log('PASS mobile reduced motion: all steps reachable and light awarded, no horizontal overflow.');
 const failure=await browser.newPage({viewport:{width:390,height:844}});await failure.route('**/lamp-workbench-pixal3d.glb',r=>r.abort());
 await failure.goto(origin+'/rehearsal.html?point=1');await failure.locator('.loading-retry').waitFor({state:'visible',timeout:120000});await capture(failure,'13-model-failure');
 await failure.unroute('**/lamp-workbench-pixal3d.glb');await failure.locator('.loading-retry').click();await ready(failure);await failure.close();
 console.log('PASS cold model failure: visible retry loads the scene successfully.');
}finally{await browser.close();}
