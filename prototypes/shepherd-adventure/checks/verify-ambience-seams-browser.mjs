const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../../projects/portal/node_modules/playwright-core/index.mjs');
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage();await page.goto((process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8766')+'/assets/audio/credits.html');
 const metrics=await page.evaluate(async()=>{
  const {loadNightRecording,crossfadeLoop}=await import('/src/night-ambience.mjs');
  const context=new OfflineAudioContext(1,24000,24000),result=[];
  for(const key of ['crickets','voices','women','family']){
   const raw=await loadNightRecording(context,key),loop=crossfadeLoop(context,raw),a=loop.getChannelData(0),n=2400;
   const rms=(start,end)=>Math.sqrt(a.slice(start,end).reduce((sum,x)=>sum+x*x,0)/(end-start));
   result.push({key,seconds:loop.duration,joinJump:Math.abs(a[0]-a.at(-1)),rmsBefore:rms(a.length-n,a.length),rmsAfter:rms(0,n),rmsAll:rms(0,a.length),peak:a.reduce((m,x)=>Math.max(m,Math.abs(x)),0)});
  }
  return result;
 });
 console.log(JSON.stringify(metrics,null,2));
 for(const m of metrics){if(m.key==='crickets'){assert(m.rmsBefore>m.rmsAll*.15);assert(m.rmsAfter>m.rmsAll*.15);}assert(m.joinJump<m.rmsAll*2);assert(m.peak<1);}
 console.log('PASS decoded loops: no cricket silence at wrap, no oversized boundary jumps or clipping. Natural speech pauses retained.');
}finally{await browser.close();}
