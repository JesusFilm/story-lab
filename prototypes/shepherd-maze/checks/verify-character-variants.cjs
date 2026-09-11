const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 const state=()=>page.evaluate(()=>watchGame.getState());
 const checks={};
 try{
  await page.goto('http://127.0.0.1:8765/?qa&character=v2');
  await page.waitForFunction(()=>window.watchGame?.getState().ready);
  let current=await state();assert.equal(current.characterVersion,'v2');
  assert.deepEqual(current.characterAnimations,[
   'preset:biped:idle','preset:biped:walk','preset:biped:run','preset:biped:turn','preset:biped:look_around'
  ]);
  assert.match(current.characterAnimation,/idle/);
  await page.screenshot({path:path.join(root,'renders/character-v2-intro.png')});
  checks.v2_url_and_five_clips={pass:true,animation:current.characterAnimation,calibration:current.characterCalibration};

  await page.click('#start');await page.waitForFunction(()=>watchGame.getState().distance>.5);
  await page.waitForFunction(()=>watchGame.getState().characterAnimation==='preset:biped:walk');
  const switched=await page.evaluate(()=>{
   const before=watchGame.getState();document.querySelector('#character-version').click();const after=watchGame.getState();
   return {before,after,url:location.search,label:document.querySelector('#character-version').innerText};
  });
  for(const key of ['x','z','heading','distance','elapsed','footprints','phase','decision','difficulty','completionType','routeVisible'])
   assert.deepEqual(switched.after[key],switched.before[key],key);
  assert.equal(switched.after.characterVersion,'v1');assert.match(switched.url,/character=v1/);assert.match(switched.label,/V1/);
  await page.screenshot({path:path.join(root,'renders/character-v1-midwalk.png')});
  const switchedBack=await page.evaluate(()=>{
   const before=watchGame.getState();watchGame.qa.setCharacterVersion('v2');const after=watchGame.getState();return {before,after,url:location.search};
  });
  for(const key of ['x','z','heading','distance','elapsed','footprints','phase','decision','difficulty','completionType','routeVisible'])
   assert.deepEqual(switchedBack.after[key],switchedBack.before[key],key);
  assert.equal(switchedBack.after.characterVersion,'v2');assert.match(switchedBack.url,/character=v2/);
  checks.live_switch_preserves_run={pass:true,distance:switchedBack.after.distance,footprints:switchedBack.after.footprints};

  await page.evaluate(()=>{const c=watchGame.qa.controller;for(let i=0;i<20000&&c.speed<7.99;i++){
   if(c.decision&&!c.decision.selected)c.command(c.suggestedAction,c.decision.id);
   if(c.phase==='stopped')c.command('forward');if(c.phase==='deadend')c.command('back');c.step(.02);
  }});
  await page.waitForFunction(()=>watchGame.getState().gait==='run');
  await page.waitForFunction(()=>watchGame.getState().characterAnimation==='preset:biped:run');
  checks.walk_and_run_select_authored_clips={pass:true};
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(()=>watchGame.getState().characterAnimation==='preset:biped:turn');
  await page.waitForFunction(()=>watchGame.getState().phase==='stopped');
  await page.waitForFunction(()=>watchGame.getState().characterAnimation==='preset:biped:idle');
  checks.turn_and_stand_select_authored_clips={pass:true};
  await page.waitForTimeout(4200);
  assert.equal((await state()).characterAnimation,'preset:biped:look_around');
  checks.look_around_idle_variation={pass:true};
  await page.screenshot({path:path.join(root,'renders/character-v2-look-around.png')});

  const legacy=await browser.newPage({viewport:{width:1000,height:760}});
  await legacy.goto('http://127.0.0.1:8765/?qa&character=v1');await legacy.waitForFunction(()=>window.watchGame?.getState().ready);
  assert.equal((await legacy.evaluate(()=>watchGame.getState())).characterVersion,'v1');
  assert.match(await legacy.locator('#character-version').innerText(),/V1/);await legacy.close();
  checks.v1_url_path={pass:true};

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await mobile.goto('http://127.0.0.1:8765/?qa&character=v2');await mobile.waitForFunction(()=>window.watchGame?.getState().ready);
  assert(await mobile.locator('#character-version').isVisible());assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await mobile.locator('#character-version').tap();assert.equal((await mobile.evaluate(()=>watchGame.getState())).characterVersion,'v1');
  await mobile.screenshot({path:path.join(root,'renders/character-toggle-mobile.png')});await mobile.close();
  checks.mobile_toggle={pass:true};

  assert.deepEqual(errors,[]);checks.no_browser_errors={pass:true};
  const result={date:'2026-09-10',environment:'Local headless Chrome; desktop and emulated touch',checks,errors};
  fs.writeFileSync(path.join(__dirname,'character-variants-verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(checks,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
