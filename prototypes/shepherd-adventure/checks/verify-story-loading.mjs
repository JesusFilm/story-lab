import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8896';
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.addInitScript(()=>{window.mediaURLs={created:[],revoked:[]};const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=create(blob);window.mediaURLs.created.push(url);return url;};URL.revokeObjectURL=url=>{window.mediaURLs.revoked.push(url);return revoke(url);};});
 let releaseGame;const gameGate=new Promise(resolve=>releaseGame=resolve);let gameRequested=false;
 await page.route('**/src/journey.mjs',async route=>{gameRequested=true;await gameGate;await route.continue();});
 await page.goto(origin+'/');await page.locator('#story-overlay').waitFor({state:'visible'});
 assert.equal(await page.locator('#loading').isHidden(),true);assert.equal(await page.locator('#story-sound').textContent(),'Music on');assert(!await page.getByRole('button',{name:/Start story/}).count());
 await page.waitForFunction(()=>document.querySelector('#story-scene').dataset.phase==='revealing');
 assert(!requests.some(url=>url.endsWith('nativity.jpg')));assert(requests.some(url=>url.endsWith('silent-night-96k.mp3')));
 await page.waitForTimeout(200);assert(gameRequested);assert(!await page.evaluate(()=>!!window.lanternJourney));
 await page.locator('#story-sound').click();assert.equal(await page.locator('#story-sound').textContent(),'Music off');
 await page.locator('#story-skip').click();await page.locator('#loading').waitFor({state:'visible'});assert.equal(await page.locator('#loading-text').textContent(),'Loading...');
 assert.equal(await page.locator('#story-scene img').count(),0);const released=await page.evaluate(()=>window.mediaURLs);assert(released.created.slice(0,2).every(url=>released.revoked.includes(url)));
 releaseGame();await page.waitForFunction(()=>window.lanternJourney,null,{timeout:90000});await page.locator('#loading').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.lanternJourney.getState().phase),'intro');
 await page.locator('#begin').click();assert.equal(await page.evaluate(()=>window.lanternJourney.getState().phase),'choice');
 // Stage only location transitions, using the actual host updateUI / inspect path.
 let releaseEnding;const endingGate=new Promise(resolve=>releaseEnding=resolve);let endingRequests=0;
 await page.route('**/nativity.jpg',async route=>{endingRequests++;await endingGate;await route.continue();});
 await page.evaluate(async()=>{const {Journey}=await import('./src/journey-model.mjs');const original=Journey.prototype.inspect;window.stageAt=at=>{Journey.prototype.inspect=function(){this.at=at;this.phase='choice';this.gateSequence=null;this.discoveries.add('gate');return original.call(this);};window.lanternJourney.command('ArrowUp');};window.stageAt('arch');});
 await page.waitForTimeout(300);assert.equal(endingRequests,1);assert(await page.locator('#loading').isHidden());
 await page.evaluate(()=>{window.lanternJourney.command('Enter');window.stageAt('goal');});await page.locator('#loading').waitFor({state:'visible'});releaseEnding();await page.locator('#story-overlay').waitFor({state:'visible'});assert(await page.locator('#loading').isHidden());assert.equal(endingRequests,1);
 assert.equal(await page.locator('#story-sound').textContent(),'Music off');await page.locator('#story-skip').click();assert(await page.locator('#ending').isVisible());assert.equal(await page.locator('#story-scene img').count(),0);
 // Restart keeps the prepared 3D world, but acquires a new story lease.
 await page.locator('#again').click();await page.locator('#story-overlay').waitFor({state:'visible'});await page.locator('#story-skip').click();await page.locator('#begin').click();
 await page.unroute('**/nativity.jpg');await page.evaluate(()=>window.stageAt('arch'));
 await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('nativity.jpg')).length>=2);
 await page.waitForTimeout(500);
 await page.evaluate(()=>{window.loaderFlashes=0;new MutationObserver(()=>{if(!document.querySelector('#loading').hidden)window.loaderFlashes++;}).observe(document.querySelector('#loading'),{attributes:true,attributeFilter:['hidden']});window.lanternJourney.command('Enter');window.stageAt('goal');});
 await page.locator('#story-overlay').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.loaderFlashes),0);await page.locator('#story-skip').click();
 assert.deepEqual(errors,[]);console.log('PASS: story-first autoplay; music defaults on/mutes; game imports in background; early Begin waits; media released; camera order; gate prefetch; ending joins pending download.');
 await page.close();
 const failure=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await failure.route('**/announcement.jpg',r=>r.abort());await failure.goto(origin+'/');await failure.locator('.loading-retry').waitFor({state:'visible'});await failure.unroute('**/announcement.jpg');await failure.locator('.loading-retry').click();await failure.locator('#story-overlay').waitFor({state:'visible'});await failure.screenshot({path:'/tmp/shepherd-loading-mobile.png'});await failure.close();console.log('PASS: failed intro retries; mobile/reduced-motion story opens.');
 const blocked=await browser.newPage();await blocked.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;window.allowAudio=()=>{HTMLMediaElement.prototype.play=play;};HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Gesture required','NotAllowedError'));});
 await blocked.goto(origin+'/story-preview.html');await blocked.locator('#story-audio-retry').waitFor({state:'visible'});assert(await blocked.locator('#story-overlay').isVisible());await blocked.locator('#story-sound').click();assert.equal(await blocked.locator('#story-sound').textContent(),'Music off');await blocked.evaluate(()=>window.allowAudio());await blocked.locator('#story-sound').click();
 // Advance to the last passage; it must wait for Begin instead of leaving.
 while(await blocked.locator('#story-progress').textContent()!=='8 / 8'){await blocked.locator('#story-next').click();await blocked.waitForTimeout(450);}
 await blocked.locator('#story-next').click();assert.match(await blocked.locator('#story-next').textContent(),/Begin adventure/);await blocked.waitForTimeout(5000);assert.equal(await blocked.locator('#story-progress').textContent(),'8 / 8');await blocked.locator('#story-next').click();await blocked.waitForFunction(()=>document.querySelector('#story-overlay').getAttribute('aria-label')==='The shepherds find Jesus');await blocked.close();console.log('PASS: blocked autoplay keeps story playable; final passage waits for Begin.');
}finally{await browser.close();}
