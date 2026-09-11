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
  await page.waitForFunction(()=>window.watchGame?.getState().ready,null,{timeout:90000}).catch(async error=>{
   console.error(JSON.stringify({errors,loading:await page.locator('#loading-text').innerText()},null,2));throw error;
  });
  let current=await state();
  assert.equal(current.characterVersion,'v2');assert.equal(current.environmentVersion,'v2');
  assert.equal(current.environment.replacementCount,240);assert.deepEqual(current.environment.counts,{'low-wall':56,market:17,home:9,'animal-stall':15,'low-courtyard':143});
  assert.equal(current.environment.visibleV2,240);assert.equal(current.environment.visibleLegacy,0);
  assert.match(current.environment.models['low-wall'].url,/low-wall-kit/);assert.match(current.environment.models.home.url,/house-01/);
  assert.match(current.environment.models.market.url,/market-stall/);assert.match(current.environment.models['animal-stall'].url,/animal-pen/);
  assert.match(current.environment.models['structure-lamp'].url,/structure-lamp/);assert.match(current.environment.models.sheep.url,/sheep/);
  assert.equal(current.environment.generatedLampCount,82);assert.equal(current.environment.visibleGeneratedLamps,82);
  assert.equal(current.environment.sheepCount,15);assert.equal(current.environment.visibleSheep,15);
  assert.deepEqual(current.environment.sheepClips,['preset:quadruped:walk','idle']);
  assert.deepEqual(new Set(current.environment.sheepActors.map(actor=>actor.animation)),new Set(['idle','walk']));
  for(const actor of current.environment.sheepActors){
   const [x,z,x2,z2]=actor.rect,[px,,pz]=actor.position;assert(px>x&&px<x2&&pz>z&&pz<z2,`${actor.foundryId} sheep leaves its pen`);
  }
  checks.v2_replaces_all_tagged_solids={pass:true,counts:current.environment.counts};
  checks.generated_lamps_and_one_animated_sheep_per_pen={pass:true,lamps:82,sheep:15,clips:current.environment.sheepClips};

  const fits=await page.evaluate(()=>watchGame.qa.environmentFits());assert.equal(fits.length,240);
  for(const fit of fits){
   const [x,z,x2,z2]=fit.rect,[minX,minY,minZ]=fit.min,[maxX,,maxZ]=fit.max;
   assert(Math.abs(minY)<1e-4,`${fit.name} is not grounded`);
   assert(minX>=x-1e-4&&maxX<=x2+1e-4&&minZ>=z-1e-4&&maxZ<=z2+1e-4,`${fit.name} exceeds its authoritative footprint`);
   if(fit.kind==='low-wall')assert(Math.abs(fit.size[1]-.9)<1e-3,`${fit.name} wall height`);
   else if(['home','low-courtyard'].includes(fit.kind)){
    assert.equal(fit.assetKind,'home',`${fit.name} does not use House 01`);
    assert(fit.size[1]>2.5&&fit.size[1]<3.8,`${fit.name} house height`);
   }
   else assert(Math.abs(fit.size[1]-2.8)<1e-3,`${fit.name} structure height`);
  }
  checks.fits_preserve_foundry_footprints={pass:true,grounded:fits.length,houseHeight:fits.find(f=>f.kind==='home').size[1],courtyardHomes:fits.filter(f=>f.kind==='low-courtyard').length};
  await page.screenshot({path:path.join(root,'renders/environment-v2-intro.png')});

  await page.click('#start');await page.waitForFunction(()=>watchGame.getState().distance>.5);
  const switched=await page.evaluate(()=>{
   const before=watchGame.getState();document.querySelector('#character-version').click();const after=watchGame.getState();
   return {before,after,label:document.querySelector('#character-version').innerText,url:location.search};
  });
  for(const key of ['x','z','heading','distance','elapsed','footprints','phase','decision','difficulty','completionType','routeVisible'])
   assert.deepEqual(switched.after[key],switched.before[key],key);
  assert.equal(switched.after.characterVersion,'v1');assert.equal(switched.after.environmentVersion,'v1');
  assert.equal(switched.after.environment.visibleV2,0);assert.equal(switched.after.environment.visibleLegacy,240);
  assert.equal(switched.after.environment.visibleGeneratedLamps,0);assert.equal(switched.after.environment.visibleSheep,0);
  assert.match(switched.label,/V1/);assert.match(switched.url,/character=v1/);
  await page.screenshot({path:path.join(root,'renders/environment-v1-midwalk.png')});
  await page.evaluate(()=>watchGame.qa.setCharacterVersion('v2'));
  current=await state();assert.equal(current.environmentVersion,'v2');assert.equal(current.environment.visibleV2,240);
  checks.live_whole_prototype_switch_preserves_run={pass:true,distance:current.distance,footprints:current.footprints};
  await page.screenshot({path:path.join(root,'renders/environment-v2-midwalk.png')});
  await page.evaluate(()=>{
   watchGame.qa.handleKey('Enter');
   Object.assign(watchGame.qa.controller,{x:68,z:14,heading:Math.PI/2});
   document.querySelector('#menu').hidden=true;document.querySelector('#modal-shade').hidden=true;
  });
  await page.waitForTimeout(500);await page.screenshot({path:path.join(root,'renders/environment-v2-house-01.png')});
  await page.evaluate(()=>{
   const solid=watchGame.qa.map.solids.find(item=>item.kind==='animal-stall'),[x,z,x2,z2]=solid.rect,c=watchGame.qa.controller;
   if(x2-x>=z2-z)Object.assign(c,{x:(x+x2)/2,z:z-3,heading:0});else Object.assign(c,{x:x-3,z:(z+z2)/2,heading:Math.PI/2});
  });
  await page.waitForTimeout(500);await page.screenshot({path:path.join(root,'renders/environment-v2-animal-pen-sheep.png')});
  await page.evaluate(()=>{
   const solid=watchGame.qa.map.solids.find(item=>item.kind==='market'),[x,z,x2,z2]=solid.rect,c=watchGame.qa.controller;
   if(x2-x>=z2-z)Object.assign(c,{x:(x+x2)/2,z:z-3,heading:0});else Object.assign(c,{x:x-3,z:(z+z2)/2,heading:Math.PI/2});
  });
  await page.waitForTimeout(500);await page.screenshot({path:path.join(root,'renders/environment-v2-market-lamp.png')});

  const legacy=await browser.newPage({viewport:{width:1000,height:760}});
  await legacy.goto('http://127.0.0.1:8765/?qa&character=v1');await legacy.waitForFunction(()=>window.watchGame?.getState().ready);
  const legacyState=await legacy.evaluate(()=>watchGame.getState());assert.equal(legacyState.environmentVersion,'v1');
  assert.equal(legacyState.environment.visibleLegacy,240);assert.equal(legacyState.environment.visibleV2,0);
  assert.equal(legacyState.environment.visibleGeneratedLamps,0);assert.equal(legacyState.environment.visibleSheep,0);await legacy.close();
  checks.direct_v1_path_preserved={pass:true};

  assert.deepEqual(errors,[]);checks.no_browser_errors={pass:true};
  const result={date:'2026-09-10',environment:'Local headless Chrome',checks,errors};
  fs.writeFileSync(path.join(__dirname,'environment-variants-verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(checks,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
