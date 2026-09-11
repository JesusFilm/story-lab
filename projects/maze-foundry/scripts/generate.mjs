import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {generate,exportManifest,encodePNG} from '../src/index.mjs';
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('node scripts/generate.mjs [config.json] [output-directory]\nDefaults: built-in config, ./exports. Failed mazes do not export a PNG.');process.exit(0);}
const config=args[0]?JSON.parse(await readFile(resolve(args[0]),'utf8')):{},out=resolve(args[1]??'exports'),result=generate(config);
await mkdir(out,{recursive:true});
const stem=`maze-${result.maze.config.seed.replace(/[^a-zA-Z0-9_-]/g,'-')}-a${result.maze.attempt}`;
await writeFile(resolve(out,`${stem}.report.json`),JSON.stringify(result.report,null,2));
if(!result.passed){console.error('Rejected: '+result.report.checks.filter(c=>!c.pass).map(c=>c.label).join(', '));process.exitCode=1;}
else{await writeFile(resolve(out,`${stem}.png`),encodePNG(result.raster));await writeFile(resolve(out,`${stem}.json`),JSON.stringify(exportManifest(result),null,2));console.log(`Verified maze exported to ${out}/${stem}.{png,json}`);}
