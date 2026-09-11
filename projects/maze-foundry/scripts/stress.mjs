import {generate,PRESETS} from '../src/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const count=Number(process.argv[2]??20);
if(!Number.isInteger(count)||count<1||count>1000)throw new Error('Seed count must be an integer from 1 to 1000.');
const results=[],start=performance.now();
for(const [preset,settings]of Object.entries(PRESETS))for(const wallMode of ['uniform','mixed'])for(let i=0;i<count;i++){
  const seed=`regression-${preset}-${wallMode}-${i}`,t=performance.now(),r=generate({...settings,wallMode,seed});
  results.push({preset,wallMode,seed,passed:r.passed,attempts:r.attempts,milliseconds:Math.round(performance.now()-t),failures:r.report.checks.filter(c=>!c.pass).map(c=>c.label)});
}
const summary={generatorVersion:'0.1.0',seedsPerPresetAndWallMode:count,total:results.length,passed:results.filter(r=>r.passed).length,milliseconds:Math.round(performance.now()-start),results};
await mkdir(new URL('../checks/',import.meta.url),{recursive:true});await writeFile(new URL('../checks/stress-report.json',import.meta.url),JSON.stringify(summary,null,2));
console.log(`${summary.passed}/${summary.total} mazes passed in ${summary.milliseconds} ms`);
if(summary.passed!==summary.total){console.log(JSON.stringify(results.filter(r=>!r.passed),null,2));process.exitCode=1;}
