// Optional matched visual comparison. These are staged review captures, not a
// claimed browser walkthrough. Run separately from timing benchmarks.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.BENCH_URL||'http://127.0.0.1:8962/story-lab/prototypes/shepherd-adventure/';
const out=process.env.CAPTURE_OUT||'test-results/tier-captures';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const tier of ['minimal','low','existing']){
 const context=await browser.newContext({viewport:{width:393,height:851},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('crash'));
 try{
  await page.goto(base+`?quality=${tier}&diagnostics`);await page.locator('#story-overlay').waitFor({state:'visible'});await page.locator('#story-skip').tap();await page.locator('#loading').waitFor({state:'hidden',timeout:120000});await page.locator('#skip-opening').tap();await page.waitForFunction(()=>document.querySelector('#advance').textContent==='Find a lamp');
  for(const [name,index] of [['entry',null],['house-staged',1]]){
   if(index!==null)await page.evaluate(index=>{document.querySelector('#jump-point').value=String(index);document.querySelector('#jump').click();},index);
   await page.locator('#pause').tap();await page.locator('#player-options').waitFor({state:'visible'});await page.locator('#player-options').evaluate(e=>e.style.visibility='hidden');
   await page.screenshot({path:`${out}/${tier}-${name}.png`,scale:'css',timeout:60000});await page.locator('#player-options').evaluate(e=>e.style.visibility='');await page.locator('#player-resume').tap();
  }
  await fs.writeFile(`${out}/${tier}.json`,JSON.stringify({tier,errors,diagnostics:await page.evaluate(()=>shepherdStartup.report()),state:await page.evaluate(()=>routeRehearsal.getState()),limits:'Same 393x851 viewport and static pause-menu capture; House 1 is staged via the existing review control, not walked.'},null,2));
  if(errors.length)throw Error(errors.join('; '));console.log(tier,'captured');
 }finally{await context.close();}
}}finally{await browser.close();}
