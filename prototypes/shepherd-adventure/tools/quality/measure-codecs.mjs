// Compare bytes and native decode cost at matching resolution, without a new
// runtime codec. Run after generation; benchmark output is explicitly supplied.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {chromium} from '../../../../projects/portal/node_modules/playwright/index.mjs';
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(new URL('../../assets/house-01-tripo-v2.glb',import.meta.url).pathname);
const input=doc.getRoot().listTextures()[0].getImage(),candidates=[];
for(const size of [256,512])for(const format of ['png','jpeg','webp']){const data=await sharp(input).resize(size,size,{fit:'inside'}).toFormat(format,{quality:68}).toBuffer();candidates.push({size,format,bytes:data.length,data:data.toString('base64')});}
const browser=await chromium.launch({headless:true});const page=await browser.newPage(),cdp=await page.context().newCDPSession(page);const results=[];
for(const cpu of [1,4,6]){
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 for(const candidate of candidates){const times=await page.evaluate(async c=>{const blob=await(await fetch(`data:image/${c.format};base64,${c.data}`)).blob();const result=[];for(let i=0;i<12;i++){const start=performance.now();const image=await createImageBitmap(blob);result.push(performance.now()-start);image.close();}return result;},candidate);results.push({cpu,size:candidate.size,format:candidate.format,bytes:candidate.bytes,decodeMs:times});}
}
await fs.writeFile(process.argv[2]||'/tmp/shepherd-codecs.json',JSON.stringify({browser:browser.version(),source:'assets/house-01-tripo-v2.glb first embedded texture',notes:'Native createImageBitmap; 12 repeated independent bitmaps. Fetch/data-URL conversion excluded. Not Android codec performance.',results},null,2));await browser.close();
