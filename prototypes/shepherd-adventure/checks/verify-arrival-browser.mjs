import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8866';
try{
 for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},reducedMotion:mobile?'reduce':'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.locator('#story-overlay').waitFor({state:'visible'});await page.locator('#story-skip').click();await page.waitForFunction(()=>window.lanternJourney,null,{timeout:90000});await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#begin').click();
 await page.evaluate(async()=>{const {Journey}=await import('./src/journey-model.mjs');const original=Journey.prototype.inspect;Journey.prototype.inspect=function(){this.at='goal';this.phase='choice';this.gateSequence=null;this.followerTime=100;this.updateFollowers(100);return original.call(this);};window.lanternJourney.command('ArrowUp');});
 if(!mobile){assert(await page.locator('#hear-good-news').isHidden());await page.waitForTimeout(1500);await page.locator('#pause').click();const t=await page.evaluate(()=>window.lanternJourney.getState().arrivalTime);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.lanternJourney.getState().arrivalTime),t);await page.locator('#resume').click();}
 await page.locator('#hear-good-news').waitFor({state:'visible',timeout:15000});assert(await page.locator('#story-overlay').isHidden());assert.equal(await page.locator('#hear-good-news').textContent(),'heard the good news');
 const state=await page.evaluate(()=>window.lanternJourney.getState());assert.equal(state.outroStarted,false);assert.equal(state.view.avatarVisible,false);assert(Math.abs(state.view.position[0]+28.35)<.01);assert(state.view.look[0]<-33);
 await page.screenshot({path:fileURLToPath(new URL('../docs/nativity-scene/arrival-'+(mobile?'portrait':'landscape')+'.png',import.meta.url))});
 await page.locator('#hear-good-news').click();await page.locator('#story-overlay').waitFor({state:'visible'});assert.equal(await page.locator('#story-overlay').getAttribute('aria-label'),'The shepherds find Jesus');await page.locator('#story-skip').click();await page.locator('#again').waitFor({state:'visible'});await page.locator('#again').click();await page.locator('#story-overlay').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.lanternJourney.getState().outroStarted),false);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: six-second first-person reveal, pause/resume, user-triggered outro, restart, portrait reduced motion and zero page errors.');
}finally{await browser.close();}
