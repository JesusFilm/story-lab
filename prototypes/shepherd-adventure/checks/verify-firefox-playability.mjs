#!/usr/bin/env node
// VM visual smoke check. Uses the installed Firefox/geckodriver and Node 22 only.
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const output=join(root,'captures','firefox-playability',new Date().toISOString().replace(/[:.]/g,'-'));
const origin=process.env.WATCH_GAME_TEST_ORIGIN;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const stages=[];const errors=[];const failedRequests=[];const responses=[];
let server,driver,sid,base,bidi;
function start(command,args,options={}){const child=spawn(command,args,{cwd:root,stdio:['ignore','ignore','pipe'],...options});child.stderr.on('data',()=>{});return child;}
async function port(){return new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function waitFor(label,condition,timeout=90000){const until=Date.now()+timeout;let last;while(Date.now()<until){try{last=await condition();if(last)return last;}catch(e){last=e.message;}await sleep(350);}throw Error(`Timed out waiting for ${label}; last=${JSON.stringify(last)}`);}
async function http(method,path,body){const res=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});const json=await res.json();if(!res.ok||json.value?.error)throw Error(`${method} ${path}: ${JSON.stringify(json.value)}`);return json.value;}
const sessionPath=()=>`/session/${sid}`;
async function js(source,...args){return http('POST',sessionPath()+'/execute/sync',{script:`return (${source})(...arguments);`,args});}
async function navigate(url){await http('POST',sessionPath()+'/url',{url});}
async function click(id){const element=await http('POST',sessionPath()+'/element',{using:'css selector',value:'#'+id});await http('POST',sessionPath()+`/element/${element['element-6066-11e4-a52e-4f735466cecf']}/click`,{});}
async function state(){return js(()=>{const g=window.routeRehearsal?.getState(),canvas=document.querySelector('#world');return {visible:document.visibilityState,hidden:document.hidden,loading:document.querySelector('#loading')?.hidden,story:document.querySelector('#story-overlay')?.hidden,storyNext:document.querySelector('#story-next')?.textContent,phase:document.body.dataset.storyPhase,game:g&&{ready:g.ready,index:g.index,phase:g.phase,paused:g.paused,destination:g.destination,buffer:g.buffer,lantern:g.lantern},canvas:canvas&&[canvas.width,canvas.height],webgl:!!canvas?.getContext('webgl2')};});}
function rendered(s){return s.visible==='visible'&&!s.hidden&&s.loading&&s.game?.ready&&s.webgl&&s.game.buffer?.[0]>0&&s.game.buffer?.[1]>0&&s.canvas?.[0]>0&&s.canvas?.[1]>0;}
async function shot(name){const value=await http('GET',sessionPath()+'/screenshot');await writeFile(join(output,`${name}.png`),Buffer.from(value,'base64'));}
async function record(name,{image=true}={}){const s=await state();stages.push({name,...s});if(image)await shot(name);console.log(`${name}: ${JSON.stringify({visible:s.visible,loading:s.loading,storyNext:s.storyNext,phase:s.phase,game:s.game,rendered:rendered(s)})}`);return s;}
async function storyThrough(finalLabel){let labels=[];for(let i=0;i<20;i++){const s=await state();const label=s.storyNext;labels.push(label);if(label===finalLabel){await click('story-next');return labels;}if(!['Start','Next verse'].includes(label)||s.story)throw Error(`Unexpected story control ${label}`);await click('story-next');await sleep(1700);}throw Error(`Story never reached ${finalLabel}: ${labels}`);}
function connectBidi(url){return new Promise((resolve,reject)=>{const ws=new WebSocket(url);const timer=setTimeout(()=>reject(Error('BiDi connection timeout')),10000);ws.onopen=()=>{clearTimeout(timer);ws.send(JSON.stringify({id:1,method:'session.subscribe',params:{events:['log.entryAdded','network.responseCompleted','network.fetchError']}}));resolve(ws);};ws.onerror=reject;ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}if(m.method==='log.entryAdded'&&['error','fatal'].includes(m.params?.level))errors.push({level:m.params.level,text:m.params.text});if(m.method==='network.fetchError')failedRequests.push({url:m.params?.request?.url,error:m.params?.errorText});if(m.method==='network.responseCompleted'){const {request,response}=m.params||{};responses.push({url:request?.url,status:response?.status});if(response?.status>=400&&!request?.url?.endsWith('/favicon.ico'))failedRequests.push({url:request?.url,status:response.status});}};});}
try{
 await mkdir(output,{recursive:true});
 let gameOrigin=origin;
 if(!gameOrigin){const p=await port();gameOrigin=`http://127.0.0.1:${p}`;server=start('python3',['serve.py','--port',String(p)]);}
 await waitFor('prototype HTTP server',async()=>{const r=await fetch(gameOrigin+'/');return r.ok;},60000);
 const driverPort=await port();base=`http://127.0.0.1:${driverPort}`;driver=start('geckodriver',['--host','127.0.0.1','--port',String(driverPort)]);
 await waitFor('geckodriver',async()=>{const r=await fetch(base+'/status');return r.ok;},30000);
 const options={args:['-width','1440','-height','900']};if(process.env.FIREFOX_HEADLESS==='1')options.args.unshift('-headless');
 const session=await http('POST','/session',{capabilities:{alwaysMatch:{browserName:'firefox',webSocketUrl:true,'moz:firefoxOptions':options}}});sid=session.sessionId;
 const browser={name:session.capabilities.browserName,version:session.capabilities.browserVersion,headless:session.capabilities['moz:headless'],display:process.env.DISPLAY||null,webdriver:session.capabilities['moz:geckodriverVersion']};
 if(!browser.headless&&!browser.display)throw Error('Headed Firefox needs an existing DISPLAY; set FIREFOX_HEADLESS=1 for a fallback run.');
 bidi=await connectBidi(session.capabilities.webSocketUrl);
 await navigate(gameOrigin+'/');
 await waitFor('opening story media',async()=>{const s=await state();return !s.story&&s.storyNext==='Start'&&s.loading;});
 await record('01-opening');
 const opening=await storyThrough('Start adventure');
 await waitFor('real WebGL scene',async()=>{const s=await state();return rendered(s)&&s.phase==='intro'&&s.story;},120000);
 await record('02-intro-webgl');
 await click('skip-opening');
 await waitFor('playable route entry',async()=>{const s=await state();return rendered(s)&&s.phase==='playing'&&s.game.index===-1&&!s.game.paused;});
 await record('03-route-entry');
 await click('advance');
 await waitFor('route movement',async()=>{const s=await state();return s.game?.destination===0&&s.game.phase==='walking';});
 await record('04-route-moving');
 await click('pause');
 await waitFor('pause',async()=>{const s=await state();return s.game?.paused&&s.game.destination===0;});
 await record('05-paused');
 await click('player-resume');
 await waitFor('resume',async()=>{const s=await state();return !s.game?.paused&&s.game.destination===0;});
 await record('06-resumed',{image:false});
 await click('pause');await click('player-restart');
 await waitFor('restart opening',async()=>{const s=await state();return !s.story&&s.storyNext==='Start';});
 await record('07-restart-opening');
 // The documented preview stages only the ending story component. It does not imply a ten-stop route pass.
 await navigate(gameOrigin+'/story-preview.html?story=ending');
 await waitFor('ending preview',async()=>{const s=await state();return !s.story&&s.storyNext==='Start'&&s.loading;});
 await record('08-ending');
 const ending=await storyThrough('Finish story');
 await waitFor('replay opening',async()=>{const s=await state();return !s.story&&s.storyNext==='Start';});
 await record('09-replay-opening');
 const failures={javascript:errors,requests:failedRequests};
 const report={result:errors.length||failedRequests.length?'failed':'passed',browser,origin:gameOrigin,opening,ending,stages,failures,requestsObserved:responses.length,requests:responses};
 await writeFile(join(output,'trace.json'),JSON.stringify(report,null,2)+'\n');
 if(report.result!=='passed')throw Error(`Browser errors or failed requests: ${JSON.stringify(failures)}`);
 console.log(`PASS: ${output}`);
}catch(e){console.error(`FAIL: ${e.stack||e}`);if(sid){try{await writeFile(join(output,'trace.json'),JSON.stringify({result:'failed',error:String(e),stages,errors,failedRequests,responses},null,2)+'\n');}catch{}}process.exitCode=1;
}finally{bidi?.close();if(sid)await http('DELETE',sessionPath()).catch(()=>{});driver?.kill();server?.kill();}
