import assert from 'node:assert/strict';
import {access, mkdir, readFile, stat} from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const here=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(here,'dist');
const prefix='/story-lab/';
const mime={'.bin':'application/octet-stream','.css':'text/css','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.html':'text/html','.jpg':'image/jpeg','.js':'text/javascript','.json':'application/json','.mjs':'text/javascript','.mp3':'audio/mpeg','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain','.vtt':'text/vtt','.wav':'audio/wav'};

const server=http.createServer(async(request,response)=>{
 try{
  const url=new URL(request.url,'http://127.0.0.1');
  if(!url.pathname.startsWith(prefix)){response.writeHead(404).end('Not found');return;}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length));
  let target=path.resolve(dist,relative);
  if(target!==dist&&!target.startsWith(dist+path.sep)){response.writeHead(403).end('Forbidden');return;}
  if((await stat(target)).isDirectory())target=path.join(target,'index.html');
  response.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
  response.end(await readFile(target));
 }catch(error){response.writeHead(error?.code==='ENOENT'?404:500).end('Not found');}
});

await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const address=server.address();
const origin=`http://127.0.0.1:${address.port}`;
const executablePath=process.env.BROWSER_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/google-chrome');
await access(executablePath);
const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const failures=[];
page.on('pageerror',error=>failures.push(`page error: ${error.message}`));
page.on('requestfailed',request=>{if(/\.(?:m?js)(?:\?|$)/.test(request.url()))failures.push(`script request failed: ${request.url()} (${request.failure()?.errorText})`);});
page.on('response',response=>{if(response.status()>=400&&/\.(?:m?js)(?:\?|$)/.test(response.url()))failures.push(`script HTTP ${response.status()}: ${response.url()}`);});

try{
 await page.goto(`${origin}${prefix}prototypes/shepherd-adventure/`,{waitUntil:'domcontentloaded'});
 await page.locator('#story-overlay').waitFor({state:'visible',timeout:30000});
 assert.equal(await page.locator('#loading').isHidden(),true,'loader should hide while the opening story is playable');
 await page.locator('#story-skip').click();
 const transition=await page.waitForFunction(()=>window.routeRehearsal&&!document.querySelector('#pause').disabled&&document.body.dataset.storyPhase==='intro'?'ready':/could not|reload to try again/i.test(document.querySelector('#loading-text')?.textContent||'')?'failed':false,null,{timeout:120000});
 const transitionState=await transition.jsonValue();await transition.dispose();
 assert.equal(transitionState,'ready',`gameplay transition ended in state: ${transitionState}`);
 await page.locator('#loading').waitFor({state:'hidden'});
 assert(!/could not|reload to try again/i.test(await page.locator('#loading-text').innerText()),'loader reported a startup failure');
 assert.equal(failures.length,0,failures.join('\n'));
 console.log('PASS: Shepherd Adventure public build opens its story, loads gameplay, and enables controls at /story-lab/.');
}catch(error){
 const state=await page.evaluate(()=>({loaderHidden:document.querySelector('#loading')?.hidden,loaderText:document.querySelector('#loading-text')?.textContent,phase:document.body.dataset.storyPhase,pauseDisabled:document.querySelector('#pause')?.disabled,storyHidden:document.querySelector('#story-overlay')?.hidden})).catch(()=>null);
 error.message+=`\nPage state: ${JSON.stringify(state)}`;
 await mkdir(path.join(here,'test-results'),{recursive:true});
 await page.screenshot({path:path.join(here,'test-results','shepherd-adventure-smoke-failure.png'),fullPage:true,timeout:5000}).catch(()=>{});
 if(failures.length)error.message+=`\n${failures.join('\n')}`;
 throw error;
}finally{
 server.closeAllConnections();
 server.close();
 await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
}
process.exit(0);
