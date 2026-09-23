import {test,expect} from '@playwright/test';
const entry='prototypes/shepherd-adventure/';

// Read the WebGL drawing buffer in the same animation frame as game rendering.
// HTML, a canvas element, draw-call counters and a solid clear colour cannot pass.
// Five-bit channels retain real variation in the minimal night palette; four-bit
// bins collapsed the healthy WebKit village to 23 colours (13.6% lit).
async function pixels(page){
 return page.evaluate(()=>new Promise(resolve=>{
 const previous=window.routeRehearsal?.getState().rendering.frames||0;
 function sample(){
  // GPU backpressure can intentionally skip a rAF. Read only in a frame that
  // actually submitted a draw, before the default drawing buffer is discarded.
  if((window.routeRehearsal?.getState().rendering.frames||0)===previous){requestAnimationFrame(sample);return;}
  const canvas=document.getElementById('world'),gl=canvas.getContext('webgl2');
  if(!gl||gl.isContextLost())return resolve({colours:0,lit:0});
  const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,data=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);
  const colours=new Set();let lit=0,n=0;
  for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];colours.add((r>>3)*1024+(g>>3)*32+(b>>3));if(Math.max(r,g,b)>35)lit++;n++;}
  resolve(window.mobileLastPixels={colours:colours.size,lit:lit/n,width:w,height:h});
 }requestAnimationFrame(sample);
 }));
}
async function rendered(page,{intro=false}={}){
 await expect.poll(async()=>{const p=await pixels(page);return p.colours>(intro?12:24)&&p.lit>(intro ? 0.005 : 0.03);},{message:'actual varied, illuminated 3D pixels',timeout:45000}).toBe(true);
}
async function capture(page,info,name){
 await rendered(page);
 await info.attach(name,{body:await page.screenshot({scale:'css'}),contentType:'image/png'});
 await info.attach(name+'-pixels',{body:JSON.stringify(await pixels(page)),contentType:'application/json'});
}
async function opening(page){
 await page.goto(entry);
 await expect(page.locator('#story-overlay')).toBeVisible();
 await expect(page.locator('#story-scene img:visible').first()).toBeVisible();
 await page.locator('#story-next').tap();
 await expect(page.locator('#story-next')).toHaveText('Next verse');
 await page.locator('#story-skip').tap();
 await expect(page.locator('#loading')).toBeHidden({timeout:150000});
 await expect(page.locator('#skip-opening')).toBeVisible();
 await rendered(page,{intro:true}); // Wide night-sky shot is intentionally darker.
 await page.locator('#skip-opening').tap();
 await expect(page.locator('#advance')).toHaveText('Find a lamp');
 await rendered(page);
}

test.beforeEach(async({page})=>{
 const logs=[];page.__mobileLogs=logs;
 page.on('pageerror',error=>logs.push({type:'pageerror',message:error.message}));
 page.on('crash',()=>logs.push({type:'crash'}));
 page.on('console',message=>{if(['error','warning'].includes(message.type()))logs.push({type:message.type(),message:message.text()});});
 page.on('requestfailed',r=>{
  const message=r.failure()?.errorText;
  // Closing scripture releases its streaming Audio source. An aborted music
  // request is expected; genuine HTTP/audio errors and all asset aborts remain.
  if(r.url().endsWith('/assets/story/silent-night-96k.mp3')&&message==='net::ERR_ABORTED')return;
  logs.push({type:'requestfailed',url:r.url(),message});
 });
 page.on('response',r=>{if(r.status()>=400)logs.push({type:'http',url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{
  window.mobileContextEvents=[];window.mobileTextureUploads=[];
  const storage=WebGL2RenderingContext.prototype.texStorage2D;
  WebGL2RenderingContext.prototype.texStorage2D=function(target,levels,format,width,height){window.mobileTextureUploads.push([width,height]);return storage.apply(this,arguments);};
  const upload=WebGL2RenderingContext.prototype.texImage2D;
  WebGL2RenderingContext.prototype.texImage2D=function(...args){
   const image=args.length===6?args[5]:null;
   if(image?.width)window.mobileTextureUploads.push([image.width,image.height]);
   return upload.apply(this,args);
  };
  for(const type of ['webglcontextlost','webglcontextrestored','webglcontextcreationerror'])document.addEventListener(type,event=>window.mobileContextEvents.push({type,message:event.statusMessage}),true);
 });
});
test.afterEach(async({page},info)=>{
 await info.attach('browser-log',{body:JSON.stringify(page.__mobileLogs,null,2),contentType:'application/json'});
 const state=await page.evaluate(()=>({state:window.routeRehearsal?.getState(),events:window.mobileContextEvents,textureUploads:window.mobileTextureUploads,pixels:window.mobileLastPixels,ua:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio})).catch(()=>null);
 await info.attach('state',{body:JSON.stringify(state,null,2),contentType:'application/json'});
});

test('cold story → rendered world → touch lamp assembly, rotation and context recovery',async({page},info)=>{
 await opening(page);await capture(page,info,'entry-world');
 expect(await page.evaluate(()=>window.mobileTextureUploads.length)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>Math.max(...window.mobileTextureUploads.flat()))).toBeLessThanOrEqual(512);
 const size=page.viewportSize();await page.setViewportSize({width:size.height,height:size.width});
 await expect.poll(()=>page.evaluate(()=>{const c=document.querySelector('#world');return c.width===innerWidth&&c.height===innerHeight;})).toBe(true);
 await capture(page,info,'rotated-world');
 await page.locator('#advance').tap();
 await expect(page.locator('#advance')).toHaveText('Get a lamp!',{timeout:180000});
 await page.locator('#advance').tap();
 for(let step=0;step<6;step++){
  const button=page.locator('#lamp-action');await expect(button).toBeVisible();
  const label=await button.textContent();await button.tap();
  if(label==='Take lamp')break;
  await expect(button).not.toHaveText(label);
  // These are deliberate single taps; preserve the game's double-tap guard.
  await page.waitForTimeout(550);
 }
 await expect.poll(()=>page.evaluate(()=>window.routeRehearsal.getState().lantern)).toBe(true);
 await capture(page,info,'lamp-carried');
 expect(page.__mobileLogs).toEqual([]);
 expect(await page.evaluate(()=>window.mobileContextEvents)).toEqual([]);
 // Actual WebGL context loss, not a DOM event that leaves the renderer healthy.
 await page.evaluate(()=>{const gl=document.querySelector('#world').getContext('webgl2');const ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('WEBGL_lose_context unavailable');ext.loseContext();});
 await expect(page.locator('#loading')).toBeVisible();
 await expect(page.locator('#loading-text')).toContainText('3D view');
 await expect(page.locator('.loading-retry')).toBeVisible();
 await info.attach('context-loss',{body:await page.screenshot({scale:'css'}),contentType:'image/png'});
 await info.attach('context-events',{body:JSON.stringify(await page.evaluate(()=>window.mobileContextEvents)),contentType:'application/json'});
 await expect.poll(()=>page.evaluate(()=>window.routeRehearsal.getState().ready)).toBe(false);
 await page.locator('.loading-retry').tap();
 await expect(page.locator('#story-overlay')).toBeVisible();page.__mobileLogs.length=0;
 await page.locator('#story-skip').tap();await expect(page.locator('#loading')).toBeHidden({timeout:150000});
 await rendered(page,{intro:true});await page.locator('#skip-opening').tap();await rendered(page);expect(page.__mobileLogs).toEqual([]);
});

test('required model failure is actionable and reload recovers',async({page},info)=>{
 await page.route('**/shepherd-tripo-v2.glb',route=>route.abort('failed'));
 await page.goto(entry);await expect(page.locator('#story-overlay')).toBeVisible();await page.locator('#story-skip').tap();
 await expect(page.locator('#loading-text')).toContainText('could not load',{timeout:120000});
 await expect(page.locator('.loading-retry')).toBeVisible();
 await info.attach('asset-failure',{body:await page.screenshot({scale:'css'}),contentType:'image/png'});
 await info.attach('expected-asset-failure-log',{body:JSON.stringify(page.__mobileLogs),contentType:'application/json'});
 await page.unroute('**/shepherd-tripo-v2.glb');await page.locator('.loading-retry').tap();
 await expect(page.locator('#story-overlay')).toBeVisible();page.__mobileLogs.length=0;await page.locator('#story-skip').tap();
 await expect(page.locator('#loading')).toBeHidden({timeout:150000});await rendered(page,{intro:true});await page.locator('#skip-opening').tap();await rendered(page);expect(page.__mobileLogs).toEqual([]);
});

test('pixel check rejects a renderer that only clears its canvas',async({page})=>{
 await opening(page);
 await page.evaluate(()=>{
  const prototype=WebGL2RenderingContext.prototype;
  const methods=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'];
  const originals=methods.map(name=>prototype[name]);
  window.restoreDrawing=()=>methods.forEach((name,i)=>prototype[name]=originals[i]);
  methods.forEach(name=>prototype[name]=()=>{});
 });
 await expect.poll(async()=>{const p=await pixels(page);return p.colours<=2&&p.lit<.03;}).toBe(true);
 // Controls and canvas still exist: the old DOM-only smoke test would pass.
 await expect(page.locator('#advance')).toBeVisible();
 await page.evaluate(()=>window.restoreDrawing());await rendered(page);
 expect(page.__mobileLogs).toEqual([]);
});
