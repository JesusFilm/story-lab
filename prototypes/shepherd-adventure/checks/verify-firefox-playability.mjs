#!/usr/bin/env node
// VM visual smoke check. Uses the installed Firefox/geckodriver and Node 22 only.
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const output=join(root,'captures','firefox-playability',new Date().toISOString().replace(/[:.]/g,'-'));
const origin=process.env.WATCH_GAME_TEST_ORIGIN?.replace(/\/$/,'');
const requestedViewport={width:1440,height:900};
const MAX_TAIL=8192,MAX_TEXT=1200;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const stages=[],errors=[],failedRequests=[],responses=[];
const pageRequests=new Set();
const children=[];
const runAbort=new AbortController();
let gameOrigin=origin,server,driver,sid,base,bidi,viewport,windowHandle;
let cleanupPromise=null,signalReason=null,report=null;
const cleanupFailures=[];

function sanitize(value,limit=MAX_TEXT){
 let text=String(value??'').replace(/\u001b\[[0-?]*[ -\/]*[@-~]/g,'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ');
 text=text.replace(/((?:authorization|cookie|token|password|secret|api[_-]?key)\s*[:=]\s*)(?:bearer\s+)?\S+/gi,'$1[redacted]');
 text=text.replace(/([?&](?:access[_-]?token|api[_-]?key|token|password|secret)=)[^&#\s]*/gi,'$1[redacted]');
 text=text.replace(/(https?:\/\/)(?:[^\/\s:@]+(?::[^\/\s@]*)?@)/gi,'$1[redacted]@');
 return text.length>limit?text.slice(0,limit)+'…':text;
}
function safeUrl(value){
 try{const url=new URL(String(value));url.username='';url.password='';url.search='';url.hash='';return sanitize(url.toString());}catch{return sanitize(value);}
}
function safeError(error){return sanitize(error?.stack||error?.message||error,MAX_TEXT*2);}
function json(value){try{return JSON.stringify(value);}catch{return sanitize(value);}}
function failFast(error){error.failFast=true;return error;}
function assertNotAborted(){if(signalReason)throw failFast(signalReason);}

class TailBuffer{
 constructor(limit){this.limit=limit;this.value='';}
 append(value){this.value=(this.value+String(value)).slice(-this.limit);}
 text(){return sanitize(this.value,this.limit);}
}

function childSummary(info){
 const status=info.error?`spawn error: ${info.error}`:info.exit?`exit code=${info.exit.code??'null'} signal=${info.exit.signal??'none'}`:'running';
 return `${info.name} (${sanitize(info.command)} ${info.args.map(sanitize).join(' ')}): ${status}\nstdout tail:\n${info.stdout.text()||'(empty)'}\nstderr tail:\n${info.stderr.text()||'(empty)'}`;
}
function startChild(name,command,args){
 const info={name,command,args:args.map(String),child:null,stdout:new TailBuffer(MAX_TAIL),stderr:new TailBuffer(MAX_TAIL),exit:null,error:null,stopRequested:false};
 children.push(info);
 try{
  const child=spawn(command,args,{cwd:root,stdio:['ignore','pipe','pipe']});
  info.child=child;
  child.stdout?.on('data',data=>info.stdout.append(data));
  child.stderr?.on('data',data=>info.stderr.append(data));
  child.once('error',error=>{info.error=safeError(error);});
  child.once('exit',(code,signal)=>{info.exit={code,signal};});
 }catch(error){info.error=safeError(error);}
 return info;
}
function assertChildrenHealthy(context){
 for(const info of children){
  if(info.stopRequested)continue;
  if(info.error||info.exit)throw failFast(new Error(`${context}: child process stopped unexpectedly\n${childSummary(info)}`));
 }
}
function diagnostics(){return children.map(info=>({name:info.name,command:info.command,args:info.args.map(sanitize),pid:info.child?.pid??null,exit:info.exit,error:info.error,stdoutTail:info.stdout.text(),stderrTail:info.stderr.text()}));}

function requestSignal(){return AbortSignal.any([runAbort.signal,AbortSignal.timeout(45000)]);}
async function http(method,path,body,options={}){
 const checkChildren=options.checkChildren!==false;
 if(checkChildren)assertChildrenHealthy(`${method} ${path}`);
 if(!base)throw new Error(`WebDriver is not available for ${method} ${path}`);
 let response;
 try{
  response=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:options.signal||requestSignal()});
 }catch(error){throw new Error(`${method} ${path}: ${safeError(error)}`);}
 const text=await response.text();
 let payload=null;
 try{payload=text?JSON.parse(text):null;}catch{throw new Error(`${method} ${path}: invalid JSON response`);}
 if(!response.ok)throw new Error(`${method} ${path}: HTTP ${response.status} ${sanitize(text)}`);
 if(payload?.value?.error)throw new Error(`${method} ${path}: ${sanitize(json(payload.value))}`);
 if(checkChildren)assertChildrenHealthy(`${method} ${path}`);
 return payload?.value;
}
const sessionPath=()=>`/session/${sid}`;
async function js(source,...args){return http('POST',sessionPath()+'/execute/sync',{script:`return (${source})(...arguments);`,args});}
async function navigate(url){await http('POST',sessionPath()+'/url',{url});}
async function focusState(){return js(()=>({focused:document.hasFocus(),visibility:document.visibilityState,hidden:document.hidden,activeElement:document.activeElement?.id||document.activeElement?.tagName||null}));}
async function activateWindow(){
 if(!windowHandle){const handles=await http('GET',sessionPath()+'/window/handles');windowHandle=handles?.[0];}
 if(windowHandle)await http('POST',sessionPath()+'/window',{handle:windowHandle});
 return focusState();
}
async function click(id){
 try{
  await activateWindow();
  const element=await http('POST',sessionPath()+'/element',{using:'css selector',value:'#'+id});
  const key='element-6066-11e4-a52e-4f735466cecf';
  await http('POST',sessionPath()+`/element/${element[key]}/click`,{});
 }catch(error){
  let focus='unavailable';
  try{focus=json(await focusState());}catch{}
  throw new Error(`Click #${id} failed (${safeError(error)}); focus=${focus}`);
 }
}

function isPageRequest(url){
 if(!url||!gameOrigin)return false;
 try{return new URL(url).origin===new URL(gameOrigin).origin;}catch{return false;}
}

class BidiMonitor{
 constructor(url){this.url=url;this.ws=null;this.nextId=1;this.pending=new Map();this.expectedClose=false;this.unexpectedClose=null;this.transportError=null;this.connected=false;this.subscription=null;}
 async connect(){
  await new Promise((resolve,reject)=>{
   let settled=false;
   const socket=new WebSocket(this.url);this.ws=socket;
   const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('BiDi connection timeout'));}},10000);
   socket.onopen=()=>{if(settled)return;settled=true;clearTimeout(timer);this.connected=true;resolve();};
   socket.onerror=event=>{const message=sanitize(event?.message||'BiDi WebSocket error');this.transportError=message;if(!settled){settled=true;clearTimeout(timer);reject(new Error(message));}};
   socket.onclose=event=>{
    this.connected=false;
    if(!this.expectedClose)this.unexpectedClose={code:event.code,reason:sanitize(event.reason||'')};
    const error=new Error(`BiDi socket closed${this.expectedClose?'':' unexpectedly'} (code=${event.code}, reason=${sanitize(event.reason||'none')})`);
    for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(failFast(error));}
    this.pending.clear();
    if(!settled){settled=true;clearTimeout(timer);reject(error);}
   };
   socket.onmessage=event=>this.message(event.data);
  });
 }
 message(data){
  let message;
  try{message=JSON.parse(data);}catch{return;}
  if(message.id!==undefined&&this.pending.has(message.id)){
   const pending=this.pending.get(message.id);this.pending.delete(message.id);clearTimeout(pending.timer);
   if(message.type!=='success'){pending.reject(failFast(new Error(`BiDi ${pending.method} failed: ${sanitize(json(message))}`)));return;}
   pending.resolve(message.result);return;
  }
  if(message.method==='log.entryAdded'&&['error','fatal'].includes(message.params?.level))errors.push({level:message.params.level,text:sanitize(message.params?.text)});
  if(message.method==='network.beforeRequestSent'){
   const url=message.params?.request?.url;if(isPageRequest(url))pageRequests.add(safeUrl(url));
  }
  if(message.method==='network.fetchError'){
   const url=message.params?.request?.url;if(isPageRequest(url))pageRequests.add(safeUrl(url));
   if(isPageRequest(url))failedRequests.push({url:safeUrl(url),error:sanitize(message.params?.errorText)});
  }
  if(message.method==='network.responseCompleted'){
   const {request,response}=message.params||{},url=request?.url,status=response?.status;
   if(isPageRequest(url))pageRequests.add(safeUrl(url));
   responses.push({url:safeUrl(url),status:Number.isFinite(status)?status:null});
   if(status>=400&&!String(url).endsWith('/favicon.ico'))failedRequests.push({url:safeUrl(url),status});
  }
 }
 throwIfUnhealthy(){
  if(this.unexpectedClose)throw failFast(new Error(`BiDi socket closed unexpectedly (code=${this.unexpectedClose.code}, reason=${this.unexpectedClose.reason||'none'})`));
  if(this.transportError&&!this.expectedClose)throw failFast(new Error(`BiDi transport error: ${this.transportError}`));
  if(!this.connected&&this.subscription)throw failFast(new Error('BiDi socket is no longer connected'));
 }
 async command(method,params,timeout=10000){
  this.throwIfUnhealthy();
  if(!this.ws||this.ws.readyState!==1)throw failFast(new Error(`BiDi socket is not open for ${method}`));
  const id=this.nextId++;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(id);reject(failFast(new Error(`Timed out waiting for BiDi ${method} response`)));},timeout);
   this.pending.set(id,{method,timer,resolve,reject});
   try{this.ws.send(JSON.stringify({id,method,params}));}catch(error){clearTimeout(timer);this.pending.delete(id);reject(failFast(new Error(`Could not send BiDi ${method}: ${safeError(error)}`)));}
  });
 }
 async subscribe(events){
  const result=await this.command('session.subscribe',{events});
  if(!result||typeof result!=='object'||Array.isArray(result))throw failFast(new Error(`BiDi session.subscribe returned an invalid result: ${sanitize(json(result))}`));
  this.subscription={events:[...events],response:result};
  return result;
 }
 async close(){
  if(!this.ws)return;
  this.expectedClose=true;
  if(this.ws.readyState===1){try{this.ws.close(1000,'check complete');}catch{}}
  const deadline=Date.now()+1000;while(this.ws.readyState!==3&&Date.now()<deadline)await sleep(25);
 }
}

async function port(){return new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const address=s.address();const value=typeof address==='object'&&address?address.port:null;s.close(error=>error?reject(error):resolve(value));});});}
async function waitFor(label,condition,timeout=90000,interval=350){
 const until=Date.now()+timeout;let last;
 while(Date.now()<until){
  assertNotAborted();assertChildrenHealthy(label);bidi?.throwIfUnhealthy();
  try{last=await condition();if(last)return last;}
  catch(error){if(error?.failFast)throw error;last=safeError(error);}
  await sleep(interval);
 }
 throw new Error(`Timed out waiting for ${label}; last=${sanitize(json(last))}\n${children.map(info=>childSummary(info)).join('\n')}`);
}

async function state(){
 const value=await js(()=>{
  const api=window.routeRehearsal,g=api?.getState?.(),canvas=document.querySelector('#world'),gl=canvas?.getContext('webgl2');
  const probe=window.__firefoxPlayabilityProbe??={frames:0};
  if(!probe.started){probe.started=true;const tick=()=>{probe.frames++;requestAnimationFrame(tick);};requestAnimationFrame(tick);}
  if(!probe.errors){probe.errors=[];addEventListener('error',event=>probe.errors.push({message:event.message,source:event.filename,line:event.lineno,column:event.colno}));addEventListener('unhandledrejection',event=>probe.errors.push({message:String(event.reason)}));}
  let frameSignal=null,frameSignalName=null,frameSignalError=null;
  try{
   if(typeof api?.getFrameCount==='function'){frameSignal=api.getFrameCount();frameSignalName='getFrameCount';}
   else if(typeof api?.getFrameSamples==='function'){frameSignal=api.getFrameSamples().length;frameSignalName='getFrameSamples.length';}
  }catch(error){frameSignalError=String(error);}
  const result={visible:document.visibilityState,hidden:document.hidden,focused:document.hasFocus(),activeElement:document.activeElement?.id||document.activeElement?.tagName||null,loading:document.querySelector('#loading')?.hidden,story:document.querySelector('#story-overlay')?.hidden,storyPlaying:document.body.classList.contains('story-playing'),storyNext:document.querySelector('#story-next')?.textContent,phase:document.body.dataset.storyPhase,game:g&&{ready:g.ready,index:g.index,phase:g.phase,paused:g.paused,destination:g.destination,distance:g.distance,position:g.position,buffer:g.buffer,lantern:g.lantern},progressSignal:g&&Number.isFinite(g.distance)?{name:'journey.distance',value:g.distance}:frameSignal===null?null:{name:frameSignalName,value:frameSignal,error:frameSignalError},frameSignal:frameSignal===null?null:{name:frameSignalName,value:frameSignal,error:frameSignalError},frameProbe:probe.frames,canvas:canvas&&[canvas.width,canvas.height],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,webgl:!!gl,webglContextLost:gl?gl.isContextLost():null};
  result.pageErrors=probe.errors;
  return result;
 });
 value.pageErrors=(value.pageErrors||[]).map(error=>({message:sanitize(error?.message),source:error?.source?safeUrl(error.source):null,line:error?.line??null,column:error?.column??null}));
 if(value.webglContextLost){throw failFast(new Error('WebGL context is lost'));}
 return value;
}
function rendered(value){return value.visible==='visible'&&!value.hidden&&value.loading===true&&value.game?.ready&&value.webgl&&value.webglContextLost===false&&value.game.buffer?.[0]>0&&value.game.buffer?.[1]>0&&value.canvas?.[0]>0&&value.canvas?.[1]>0;}
async function shot(name){const value=await http('GET',sessionPath()+'/screenshot');if(typeof value!=='string')throw new Error(`Screenshot ${name} returned no image data`);await writeFile(join(output,`${name}.png`),Buffer.from(value,'base64'));}
async function record(name,{image=true}={}){const value=await state();stages.push({name,...value});if(image)await shot(name);console.log(`${name}: ${json({visible:value.visible,loading:value.loading,storyNext:value.storyNext,phase:value.phase,game:value.game,viewport:value.viewport,focused:value.focused,webglContextLost:value.webglContextLost,progressSignal:value.progressSignal,frameSignal:value.frameSignal,rendered:rendered(value)})}`);return value;}
async function storyThrough(finalLabel){const labels=[];for(let i=0;i<20;i++){const value=await state(),label=value.storyNext;labels.push(label);if(label===finalLabel){await click('story-next');return labels;}if(!['Start','Next verse'].includes(label)||value.story)throw new Error(`Unexpected story control ${sanitize(label)}; focus=${json({focused:value.focused,visibility:value.visible,activeElement:value.activeElement})}`);await click('story-next');await sleep(1700);}throw new Error(`Story never reached ${finalLabel}: ${labels.join(', ')}`);}

async function configureViewport(){
 let rect=null,verified=null;
 for(let attempt=0;attempt<4;attempt++){
  const width=Math.max(320,requestedViewport.width+(verified?requestedViewport.width-verified.innerWidth:0));
  const height=Math.max(240,requestedViewport.height+(verified?requestedViewport.height-verified.innerHeight:0));
  rect=await http('POST',sessionPath()+'/window/rect',{width,height});
  verified=await js(()=>({innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio}));
  if(verified.innerWidth===requestedViewport.width&&verified.innerHeight===requestedViewport.height)break;
 }
 if(verified?.innerWidth!==requestedViewport.width||verified?.innerHeight!==requestedViewport.height)throw failFast(new Error(`Could not establish deterministic CSS viewport ${requestedViewport.width}x${requestedViewport.height}; got ${json(verified)}`));
 return {requestedWindow:{...requestedViewport},windowRect:rect,verifiedCss:[verified.innerWidth,verified.innerHeight],outer:[verified.outerWidth,verified.outerHeight],dpr:verified.dpr};
}
function telemetry(){return {subscriptionAcknowledged:!!bidi?.subscription,subscribedEvents:bidi?.subscription?.events||[],subscriptionResponse:bidi?.subscription?.response||null,pageRequestsObserved:pageRequests.size,responseEvents:responses.length,failedNetworkEvents:failedRequests.length,validated:!!bidi?.subscription&&pageRequests.size>0&&!bidi.unexpectedClose,limits:'BiDi telemetry covers the subscribed page/network/log events observed during this run; it is not a complete browser performance or visual oracle.',socketUnexpectedClose:bidi?.unexpectedClose||null};}
function assertTelemetry(){bidi?.throwIfUnhealthy();if(!bidi?.subscription)throw failFast(new Error('BiDi telemetry was not acknowledged'));if(pageRequests.size===0)throw failFast(new Error('BiDi telemetry observed no page requests'));}

async function stopChild(info){
 if(!info)return;
 info.stopRequested=true;
 if(!info.child||info.exit)return;
 try{info.child.kill('SIGTERM');}catch{}
 const deadline=Date.now()+3000;while(!info.exit&&Date.now()<deadline)await sleep(50);
 if(!info.exit){try{info.child.kill('SIGKILL');}catch{}const end=Date.now()+1000;while(!info.exit&&Date.now()<end)await sleep(50);}
}
async function cleanup(){
 if(cleanupPromise)return cleanupPromise;
 cleanupPromise=(async()=>{
  if(bidi)bidi.expectedClose=true;
  const activeSid=sid;
  if(activeSid&&base){try{await http('DELETE',`/session/${activeSid}`,undefined,{checkChildren:false,signal:AbortSignal.timeout(5000)});}catch(error){cleanupFailures.push(`WebDriver session cleanup: ${safeError(error)}`);}}
  sid=null;
  if(bidi){try{await bidi.close();}catch(error){cleanupFailures.push(`BiDi cleanup: ${safeError(error)}`);}}
  await stopChild(driver);await stopChild(server);
 })();
 return cleanupPromise;
}
function signalHandler(signal){
 if(signalReason)return;
 signalReason=new Error(`Received ${signal}; cleanup requested`);process.exitCode=signal==='SIGINT'?130:143;runAbort.abort(signalReason);void cleanup();
}
process.once('SIGINT',()=>signalHandler('SIGINT'));process.once('SIGTERM',()=>signalHandler('SIGTERM'));

async function run(){
 await mkdir(output,{recursive:true});
 const headless=process.env.FIREFOX_HEADLESS==='1',display=process.env.DISPLAY?.trim()||null;
 try{
  if(!headless&&!display)throw new Error('No DISPLAY is available for headed Firefox. Set FIREFOX_HEADLESS=1 before session creation for a fallback run; no browser session was created.');
  if(!headless)console.warn(`Headed Firefox uses shared DISPLAY=${display}; keep that display undisturbed and keep other windows from stealing focus while this visual check runs.`);
  if(!gameOrigin){const gamePort=await port();gameOrigin=`http://127.0.0.1:${gamePort}`;server=startChild('prototype-server','python3',['serve.py','--port',String(gamePort)]);}
  await waitFor('prototype HTTP server',async()=>{const response=await fetch(gameOrigin+'/',{signal:requestSignal()});return response.ok;},60000);
  const driverPort=await port();base=`http://127.0.0.1:${driverPort}`;driver=startChild('geckodriver','geckodriver',['--host','127.0.0.1','--port',String(driverPort)]);
  await waitFor('geckodriver',async()=>{const response=await fetch(base+'/status',{signal:requestSignal()});return response.ok;},30000);
  const options={args:['-width',String(requestedViewport.width),'-height',String(requestedViewport.height)]};if(headless)options.args.unshift('-headless');
  const session=await http('POST','/session',{capabilities:{alwaysMatch:{browserName:'firefox',webSocketUrl:true,'moz:firefoxOptions':options}}});sid=session.sessionId;
  if(!sid||typeof session.capabilities?.webSocketUrl!=='string')throw failFast(new Error(`Firefox did not provide a WebDriver session and BiDi URL: ${sanitize(json(session))}`));
  const capabilities=session.capabilities;
  const browser={name:capabilities.browserName,version:capabilities.browserVersion,headless,display,webdriver:capabilities['moz:geckodriverVersion']||null};
  viewport=await configureViewport();
  bidi=new BidiMonitor(capabilities.webSocketUrl);await bidi.connect();
  await bidi.subscribe(['log.entryAdded','network.beforeRequestSent','network.responseCompleted','network.fetchError']);
  await navigate(gameOrigin+'/');
  await waitFor('opening story media',async()=>{const value=await state();return !value.story&&value.storyNext==='Start'&&value.loading;});
  const opening=await record('01-opening');
  await storyThrough('Start adventure');
  await waitFor('real WebGL scene',async()=>{const value=await state();return rendered(value)&&value.phase==='intro'&&value.story;},120000);
  // Avoid an unnecessary 3D screenshot here; route-entry and paused-walking captures
  // are the visual evidence, and keeping the first gameplay frame live avoids a
  // screenshot-induced compositor/focus ambiguity before the route check.
  const intro=await record('02-intro-webgl',{image:false});
  if(Number.isFinite(opening.frameProbe)&&Number.isFinite(intro.frameProbe)&&!(intro.frameProbe>opening.frameProbe))throw new Error(`Animation frame probe did not advance between opening and live WebGL scene: before=${opening.frameProbe}, after=${intro.frameProbe}`);
  await click('skip-opening');
  await waitFor('playable route entry',async()=>{const value=await state();return rendered(value)&&value.phase==='playing'&&value.game.index===-1&&!value.game.paused;});
  // Keep the WebGL loop live until the first walking state is observed; the
  // stable paused-walking capture below is the route visual evidence.
  await record('03-route-entry',{image:false});
  await click('advance');
  const movement=await waitFor('first route movement',async()=>{const value=await state();return value.game?.destination===0&&value.game.phase==='walking'?value:null;});
  await click('pause');
  await waitFor('stable walking pause',async()=>{const value=await state();return value.game?.paused&&value.game.destination===0&&value.game.phase==='walking'?value:null;});
  await record('04-route-moving-paused');
  await click('player-resume');
  const resumed=await waitFor('resume on first route leg',async()=>{const value=await state();return !value.game?.paused&&value.game.destination===0&&value.game.phase==='walking'?value:null;});
  stages.push({name:'05-resumed-before-progress',...resumed});
  console.log(`05-resumed-before-progress: ${json({game:resumed.game,focused:resumed.focused,visible:resumed.visible,storyPlaying:resumed.storyPlaying,progressSignal:resumed.progressSignal,frameSignal:resumed.frameSignal,frameProbe:resumed.frameProbe})}`);
  const frameProgress={exposed:Number.isFinite(opening.frameProbe)&&Number.isFinite(intro.frameProbe),name:'requestAnimationFrame probe',before:opening.frameProbe,after:intro.frameProbe,advanced:intro.frameProbe>opening.frameProbe,routeMovementSignal:movement.progressSignal||null,routeFrameSignal:movement.frameSignal||null,resumedSignal:resumed.progressSignal||null};
  await click('pause');
  await waitFor('pause before restart',async()=>{const value=await state();return value.game?.paused&&value.game.destination===0&&value.game.phase==='walking';});
  await click('player-restart');
  await waitFor('restart opening',async()=>{const value=await state();return !value.story&&value.storyNext==='Start';});
  await record('06-restart-opening');
  // This direct review stages only the ending story component. It is not the game's arrival/ending transition.
  await navigate(gameOrigin+'/story-preview.html?story=ending');
  await waitFor('direct ending story preview',async()=>{const value=await state();return !value.story&&value.storyNext==='Start'&&value.loading;});
  await record('07-direct-ending-story-preview');
  const ending=await storyThrough('Finish story');
  await waitFor('direct story replay opening',async()=>{const value=await state();return !value.story&&value.storyNext==='Start';});
  await record('08-direct-story-replay',{image:false});
  await waitFor('BiDi page-request evidence',async()=>{bidi?.throwIfUnhealthy();return pageRequests.size>0;},10000,50);
  assertTelemetry();
  const failures={javascript:errors,requests:failedRequests};
  report={result:errors.length||failedRequests.length?'failed':'passed',browser,origin:safeUrl(gameOrigin),viewport,opening,ending,frameProgress,stages,failures};
  if(report.result!=='passed')console.error(`Browser errors or failed requests: ${json(failures)}`);
 }catch(error){
  report={result:'failed',error:safeError(error),origin:safeUrl(gameOrigin),viewport,stages,failures:{javascript:errors,requests:failedRequests},frameProgress:null};
  console.error(`FAIL: ${safeError(error)}`);
  process.exitCode=1;
 }finally{
  try{bidi?.throwIfUnhealthy();}catch(error){report??={result:'failed'};report.result='failed';report.error=safeError(error);process.exitCode=1;}
  await cleanup();
  if(cleanupFailures.length){report??={result:'failed'};report.result='failed';report.cleanupFailures=[...cleanupFailures];process.exitCode=1;}
  report??={result:'failed',error:'No result was produced'};
  report.stages=stages;report.telemetry=telemetry();report.diagnostics=diagnostics();report.cleanupFailures=[...cleanupFailures];
  try{await writeFile(join(output,'trace.json'),json(report)+'\n');}catch(error){console.error(`Could not write trace: ${safeError(error)}`);process.exitCode=1;}
 }
 if(report.result==='passed')console.log(`PASS: ${output}`);else if(!signalReason)console.error(`FAIL: ${output}`);
}

await run();
