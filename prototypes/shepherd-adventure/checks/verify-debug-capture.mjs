import assert from 'node:assert/strict';
import {readFile,unlink} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.WATCH_GAME_TEST_ORIGIN||'http://127.0.0.1:8876';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/?debug');await page.locator('#debug-tools').waitFor({timeout:90000});await page.locator('#loading').waitFor({state:'hidden'});
 const pos=()=>page.evaluate(()=>window.lanternJourney.getState().view.position);
 const start=await pos();await page.mouse.click(900,500);await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');assert.notDeepEqual(await pos(),start);
 await page.locator('#debug-scene').selectOption('Animal pen');assert.deepEqual(await pos(),[-20,7,-43]);
 await page.locator('#debug-scene').selectOption('Nativity');await page.mouse.move(900,500);await page.mouse.down({button:'right'});await page.mouse.move(1000,520,{steps:5});await page.mouse.up({button:'right'});await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');assert.notDeepEqual(await pos(),start);
 await page.locator('#debug-scene').selectOption('Village');await page.locator('#debug-scene').selectOption('Nativity');
 await page.locator('#debug-freeze').click();const frozen=await pos();const initial=await page.locator('#debug-image').evaluate(c=>c.toDataURL());
 await page.mouse.move(500,350);await page.mouse.down();await page.mouse.move(700,500,{steps:12});await page.mouse.up();const drawn=await page.locator('#debug-image').evaluate(c=>c.toDataURL());assert.notEqual(initial,drawn);
 await page.locator('#debug-undo').click();assert.equal(await page.locator('#debug-image').evaluate(c=>c.toDataURL()),initial);
 for(const tool of ['Arrow','Rectangle','Ellipse','Line']) {await page.locator('#debug-tool').selectOption(tool);await page.mouse.move(450,300);await page.mouse.down();await page.mouse.move(750,540,{steps:5});await page.mouse.up();}
 await page.keyboard.down('w');await page.waitForTimeout(200);await page.keyboard.up('w');assert.deepEqual(await pos(),frozen);
 await page.locator('#debug-capture').click();await page.waitForFunction(()=>document.querySelector('#debug-status').textContent.startsWith('Saved '));
 const path=(await page.locator('#debug-status').textContent()).slice(6);assert.match(path,/^captures\/[\w-]+\.png$/);const file=new URL('../'+path,import.meta.url),bytes=await readFile(file);assert(bytes.length>10000);const encoded=await page.locator('#debug-image').evaluate(c=>c.toDataURL().split(',')[1]);assert.equal(bytes.toString('base64'),encoded);
 await page.screenshot({path:'/tmp/shepherd-debug-capture.png'});await unlink(file);
 const bad=await page.request.post(origin+'/__debug/capture',{headers:{Origin:'https://example.com','Content-Type':'image/png'},data:bytes});assert.equal(bad.status(),403);
 await page.locator('#debug-freeze').click();await page.mouse.click(900,600);await page.keyboard.down('e');await page.waitForTimeout(200);await page.keyboard.up('e');assert((await pos())[1]>frozen[1]);
 assert.deepEqual(errors,[]);console.log('PASS: bookmarks, WASD/mouse flight, elevation, freeze, shapes, undo, exact PNG saved to captures, foreign-origin rejection, no page errors.');
} finally {await browser.close();}
