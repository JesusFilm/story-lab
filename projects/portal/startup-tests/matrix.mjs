// Independent browser process per case/tier, with an outer kill deadline even if
// a renderer is too wedged for page.evaluate or context.close to return.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
const out=process.env.BENCH_OUT||'test-results/matched-matrix';await fs.mkdir(out,{recursive:true});
const cases=(process.env.BENCH_CASES||'fast,cpu4,cpu6,reported4,net16,net05,combined4,combined16,combined05').split(',');
const tiers=(process.env.BENCH_TIERS||'before,minimal,low').split(',');
for(const name of cases)for(const tier of tiers){
 const env={...process.env,BENCH_CASES:name,BENCH_TIERS:tier==='before'?'existing':tier,BENCH_OUT:out+'/'+tier,BENCH_URL:tier==='before'?(process.env.BEFORE_URL||'http://127.0.0.1:8963/story-lab/prototypes/shepherd-adventure/'):(process.env.AFTER_URL||'http://127.0.0.1:8962/story-lab/prototypes/shepherd-adventure/')};
 const child=spawn(process.execPath,[new URL('./benchmark.mjs',import.meta.url).pathname],{env,stdio:['ignore','pipe','pipe'],detached:true});let log='';child.stdout.on('data',d=>{log+=d;process.stdout.write(d)});child.stderr.on('data',d=>{log+=d;});
 let killed=false;const timer=setTimeout(()=>{killed=true;try{process.kill(-child.pid,'SIGKILL')}catch{}},280000);
 const code=await new Promise(resolve=>child.on('close',resolve));clearTimeout(timer);await fs.writeFile(`${out}/${name}-${tier}-runner.json`,JSON.stringify({name,tier,code,killed,log},null,2));
}
