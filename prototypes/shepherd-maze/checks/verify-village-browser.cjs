const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),capturePrefix=process.env.CAPTURE_PREFIX||'village';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const checks={};
 const state=()=>page.evaluate(()=>watchGame.getState());
 const shot=async name=>{await page.waitForTimeout(1500);await page.screenshot({path:path.join(root,'renders/'+capturePrefix+'-'+name+'.png')});};
 async function load(difficulty='medium'){
  await page.goto('http://127.0.0.1:8765/?qa');await page.waitForFunction(()=>window.watchGame?.getState().ready);
  if(difficulty!=='medium')await page.click(`[data-difficulty="${difficulty}"]`);
 }
 try{
  await load();await shot('intro');assert.equal((await state()).difficulty,'medium');
  await page.keyboard.press('ArrowRight');assert.equal((await state()).difficulty,'maximum');
  await page.keyboard.press('ArrowLeft');assert.equal((await state()).difficulty,'medium');
  await page.keyboard.press('Enter');await page.waitForTimeout(700);
  assert((await state()).distance>.5);checks.starts_and_walks_without_holding={pass:true};assert.equal(await page.locator('#decision-copy').count(),0);
  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.speed<7.99;i++){
   if(c.decision&&!c.decision.selected)c.command(c.suggestedAction,c.decision.id);
   if(c.phase==='stopped')c.command('forward');if(c.phase==='deadend')c.command('back');c.step(.02);
  }});
  await page.waitForFunction(()=>{const s=watchGame.getState();return s.speed>7.9&&s.gaitBlend>.85;});
  await page.screenshot({path:path.join(root,'renders/'+capturePrefix+'-running.png')});
  const running=await state();assert.equal(running.gait,'run');
  await page.keyboard.press('Enter');await page.waitForTimeout(200);await page.keyboard.press('Enter');
  assert.equal((await state()).speed,3.8);await page.waitForTimeout(250);assert.equal((await state()).speed,3.8);
  await page.screenshot({path:path.join(root,'renders/'+capturePrefix+'-resume-walking.png')});
  checks.running_animation_and_walk_after_pause={pass:true,runningSpeed:running.speed,runBlend:running.gaitBlend};
  await page.waitForFunction(()=>watchGame.getState().phase==='walking');
  await page.keyboard.press('ArrowDown');await page.waitForTimeout(1050);
  let current=await state();assert.equal(current.phase,'stopped');const turned={...current};
  await page.waitForTimeout(250);assert.equal((await state()).z,turned.z);assert.equal((await state()).x,turned.x);
  await page.keyboard.press('ArrowUp');await page.waitForTimeout(200);
  const resumed=await state();assert((resumed.x-turned.x)*Math.sin(turned.heading)+(resumed.z-turned.z)*Math.cos(turned.heading)>.1);
  checks.tap_uturn_wait_resume={pass:true};
  await page.keyboard.press('Enter');assert.equal((await state()).menu,'pause');
  const paused=await state();await page.waitForTimeout(250);assert.equal((await state()).elapsed,paused.elapsed);
  // Every pause/help menu item can be reached with arrows and OK.
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');
  assert.match(await page.locator('#menu-actions .selected').innerText(),/Help me finish/);
  await page.keyboard.press('Enter');assert.equal((await state()).menu,'confirm');assert(!(await state()).routeVisible);
  assert.match(await page.locator('#menu-copy').innerText(),/completion events or achievements/);
  await shot('route-warning');await page.keyboard.press('Enter');assert(!(await state()).routeVisible);
  checks.remote_menu_warning_and_cancel={pass:true};
  await page.click('#route');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert((await state()).routeVisible);assert.equal((await state()).completionType,'guided');assert(!(await state()).challengeCompletionEligible);
  checks.confirmation_enables_guidance={pass:true};
  // Inspect every loaded village mesh against the Foundry raster rectangles.
  const geometry=await page.evaluate(()=>watchGame.qa.geometry());const map=await page.evaluate(()=>watchGame.qa.map);
  assert.equal(geometry.length,map.solids.length);
  for(const wall of geometry){const index=Number(wall.name.slice(5));assert.deepEqual(wall.rect,map.solid_rectangles_tiles[index]);const[x,z,x2,z2]=wall.rect;
   for(const[a,b]of[[wall.min[0],x*map.tile_m],[wall.max[0],x2*map.tile_m],[wall.min[2],z*map.tile_m],[wall.max[2],z2*map.tile_m]])assert(Math.abs(a-b)<.001);}
  checks.village_blender_bounds_match={pass:true,walls:geometry.length};
  await load();await page.keyboard.press('Enter');
  // Queue a real key press during the approach, before reaching the turning point.
  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&!c.decision;i++)c.step(.02);});
  await page.waitForTimeout(800);
  const early=await state(),earlyChoice=early.decision.options.find(o=>o.action!=='forward')||early.decision.options[0];
  assert.equal(early.phase,'walking');assert(await page.locator('#decisions').isVisible());
  assert.equal((await page.locator('#choices').innerText()).trim(),'');
  assert.equal(await page.locator('#choices button').count(),early.decision.options.length);
  await page.keyboard.press({left:'ArrowLeft',right:'ArrowRight',forward:'ArrowUp'}[earlyChoice.action]);
  assert.equal((await state()).decision.selected,earlyChoice.next);
  assert(await page.locator(`#choices [data-action="${earlyChoice.action}"]`).evaluate(b=>b.classList.contains('queued')));
  await page.screenshot({path:path.join(root,'renders/'+capturePrefix+'-queued-turn.png')});
  const departure=await page.evaluate(id=>{
   const c=watchGame.qa.controller;let waited=false;
   for(let i=0;i<500&&c.decision?.id===id;i++){c.step(.01);waited ||= c.phase==='waiting';}
   return {waited,to:c.edge?.to,phase:c.phase};
  },early.decision.id);
  assert.equal(departure.waited,false);assert.equal(departure.to,earlyChoice.next);
  await page.waitForTimeout(100);assert(await page.locator('#decisions').isHidden());
  checks.arrow_only_early_key_queues_automatic_turn={pass:true};
  await load();await page.keyboard.press('Enter');
  // Accelerate traversal to a real choice, then test the real event listeners while waiting.
  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.phase!=='waiting';i++)c.step(.02);});
  await page.waitForTimeout(350);current=await state();assert.equal(current.phase,'waiting');
  const waitingDistance=current.distance;await page.waitForTimeout(350);assert.equal((await state()).distance,waitingDistance);
  await shot('medium-junction');
  const choice=current.decision.options[0],key={left:'ArrowLeft',right:'ArrowRight',forward:'ArrowUp'}[choice.action];
  await page.keyboard.press(key);await page.waitForTimeout(550);assert((await state()).distance>waitingDistance);
  checks.no_choice_waits_and_single_late_tap_moves={pass:true};
  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&!['waiting','deadend'].includes(c.phase);i++)c.step(.02);});
  if((await state()).phase==='deadend'){
   const distance=(await state()).distance;await page.waitForTimeout(200);assert.equal((await state()).distance,distance);
   await page.keyboard.press('ArrowDown');await page.waitForTimeout(900);await page.keyboard.press('ArrowUp');
   await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.phase!=='waiting';i++)c.step(.02);});
   checks.deadend_stops_and_returns_on_taps={pass:true};
  }
  current=await state();assert.equal(current.phase,'waiting');
  const repeatKey={left:'ArrowLeft',right:'ArrowRight',forward:'ArrowUp'}[current.decision.options[0].action];
  await page.evaluate(key=>dispatchEvent(new KeyboardEvent('keydown',{key,repeat:true,bubbles:true})),repeatKey);
  assert.equal((await state()).phase,'waiting');checks.held_key_repeat_does_not_choose={pass:true};
  const staleId=current.decision.id;await page.keyboard.press('ArrowDown');await page.waitForTimeout(1000);
  assert.equal((await state()).phase,'stopped');assert.equal(await page.evaluate(id=>watchGame.command('forward',id),staleId),false);
  checks.old_decision_rejected_after_uturn={pass:true};
  await page.evaluate(()=>dispatchEvent(new Event('blur')));assert.equal((await state()).menu,'pause');
  const clock=(await state()).elapsed;await page.waitForTimeout(200);assert.equal((await state()).elapsed,clock);await page.keyboard.press('Enter');
  checks.blur_pauses_and_freezes_trail_age={pass:true};
  await load('maximum');await page.keyboard.press('Enter');
  assert.equal((await state()).mapMode,'local');assert(!(await state()).routeVisible);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>watchGame.qa.mapPixel(0,0)[3]),0);
  assert((await page.evaluate(()=>watchGame.qa.mapPixel(175,175)[3]))>0);
  await page.keyboard.press('m');assert.equal((await state()).mapMode,'local');assert.equal(await page.locator('[data-view="map"]').count(),0);
  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.phase!=='waiting';i++)c.step(.02);});
  await shot('maximum-local-map');
  const prints=await page.evaluate(()=>({count:watchGame.qa.controller.trail.items.length,alpha:watchGame.qa.controller.trail.opacity(watchGame.qa.controller.trail.items[0])}));
  assert(prints.count>10);assert(prints.alpha>0);checks.visible_recent_footprints={pass:true,...prints};
  await page.click('#route');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  assert((await state()).routeVisible);assert.equal((await state()).mapMode,'local');
  assert.equal(await page.evaluate(()=>watchGame.qa.mapPixel(0,0)[3]),0);
  checks.maximum_circular_map_stays_clipped_after_guidance={pass:true};
  await shot('maximum-guided');
  // Complete through actual graph updates and render the real completion state.
  await page.evaluate(()=>{
   const c=watchGame.qa.controller;
   for(let i=0;i<100000&&!c.arrived;i++){
    if(c.decision&&!c.decision.selected){const action=c.suggestedAction;if(action==='back')c.command('back');else c.command(action,c.decision.id);}
    if(c.phase==='stopped')c.command('forward');if(c.phase==='deadend')c.command('back');c.step(.02);
   }
  });
  await page.waitForFunction(()=>watchGame.getState().menu==='result');await page.waitForTimeout(1500);
  assert((await state()).arrived);assert.match(await page.locator('#menu-copy').innerText(),/Guided completion/);await shot('completion');
  checks.guided_completion={pass:true};
  await page.keyboard.press('Enter');assert(!(await state()).started);assert(await page.locator('#modal-shade').isHidden());
  await page.keyboard.press('ArrowRight');assert.equal((await state()).difficulty,'easy');await page.keyboard.press('Enter');
  assert((await state()).routeVisible);assert.equal((await state()).routeSource,'difficulty');assert.equal((await state()).mapMode,'full');await shot('easy');
  checks.new_run_and_easy_guidance={pass:true};
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  mobile.on('pageerror',e=>errors.push(String(e)));
  await mobile.goto('http://127.0.0.1:8765/?qa');await mobile.waitForFunction(()=>window.watchGame?.getState().ready);
  await mobile.locator('[data-difficulty="maximum"]').tap();await mobile.waitForTimeout(350);await mobile.screenshot({path:path.join(root,'renders/'+capturePrefix+'-mobile-intro.png')});
  await mobile.locator('#start').tap();await mobile.waitForTimeout(600);
  await mobile.locator('#pause').tap();
  await mobile.getByRole('button',{name:'Turn around and wait',exact:true}).tap();
  await mobile.waitForTimeout(1000);assert.equal((await mobile.evaluate(()=>watchGame.getState())).phase,'stopped');
  assert.equal(await mobile.locator('#choices button').count(),1);
  await mobile.locator('#choices [data-action="forward"]').tap();
  await mobile.waitForFunction(()=>watchGame.getState().phase==='deadend');
  await mobile.waitForTimeout(150);
  assert.equal(await mobile.locator('#choices button').count(),1);
  assert(await mobile.locator('#choices [data-action="back"]').isVisible());
  await mobile.screenshot({path:path.join(root,'renders/'+capturePrefix+'-mobile-deadend.png')});
  await mobile.locator('#choices [data-action="back"]').tap();
  await mobile.waitForTimeout(1000);assert.equal((await mobile.evaluate(()=>watchGame.getState())).phase,'stopped');
  await mobile.locator('#choices [data-action="forward"]').tap();
  await mobile.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.phase!=='waiting';i++)c.step(.02);});
  await mobile.waitForTimeout(1500);
  await mobile.screenshot({path:path.join(root,'renders/'+capturePrefix+'-mobile-play.png')});
  const mobileChoice=await mobile.locator('#choices button').first().getAttribute('data-action');
  await mobile.locator(`#choices [data-action="${mobileChoice}"]`).tap();
  await mobile.waitForTimeout(600);assert.notEqual((await mobile.evaluate(()=>watchGame.getState())).phase,'waiting');
  await mobile.locator('#pause').tap();assert.equal((await mobile.evaluate(()=>watchGame.getState())).menu,'pause');
  assert(await mobile.locator('#decisions').isHidden());
  checks.deadend_back_arrow_and_resume_arrow_touch={pass:true};
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  checks.emulated_touch_taps_and_mobile_layout={pass:true};await mobile.close();
  // Focus loss paused the desktop; sample while rendering/walking, without assistance shortcuts.
  await page.evaluate(()=>watchGame.qa.handleKey('Enter'));
  checks.frame_timing=await page.evaluate(()=>new Promise(resolve=>{
   const samples=[];let last=performance.now();function frame(t){samples.push(t-last);last=t;
   if(samples.length<120)requestAnimationFrame(frame);else{samples.shift();samples.sort((a,b)=>a-b);resolve({median_ms:samples[59],p95_ms:samples[113],note:'Short headless desktop sample; physical TV/phone unverified'});}}requestAnimationFrame(frame);
  }));
  assert.deepEqual(errors,[]);checks.no_browser_errors={pass:true};
  fs.writeFileSync(path.join(__dirname,capturePrefix+'-browser-verification.json'),JSON.stringify({date:new Date().toISOString().slice(0,10),environment:'Local headless Chrome; desktop and emulated touch',checks,errors},null,2)+'\n');
  console.log(JSON.stringify(checks,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
