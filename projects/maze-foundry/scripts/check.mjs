import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const dir of ['src','web','scripts'])for(const file of await readdir(new URL(`../${dir}/`,import.meta.url)))if(file.endsWith('.mjs')){
  const path=new URL(`../${dir}/${file}`,import.meta.url);const r=spawnSync(process.execPath,['--check',path.pathname],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);
  const source=await readFile(path,'utf8');for(const [,relative]of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))if(relative.startsWith('.'))await readFile(new URL(relative,path));
}
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');for(const [,relative]of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await readFile(new URL(`../${relative}`,import.meta.url));
console.log('All modules parse; local imports and page assets resolve. Static app needs no bundling.');
