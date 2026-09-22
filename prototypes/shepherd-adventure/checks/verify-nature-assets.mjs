import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url)),folder=path.join(root,'prototypes/shepherd-adventure/assets/nature');
const provenance=JSON.parse(readFileSync(path.join(folder,'provenance.json')));
assert.equal(provenance.origin,'third-party');assert.equal(provenance.generator,'not-tripo');assert.equal(provenance.license,'CC0-1.0');
assert.match(readFileSync(path.join(folder,'LICENSE.txt'),'utf8'),/CC0 1.0/);
for(const file of provenance.runtime_files){const p=path.join(root,file.path);assert(existsSync(p),file.path);const bytes=readFileSync(p);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);assert.equal(bytes.length,file.bytes,file.path);}
let dependencies=0;
for(const name of provenance.models){const gltf=JSON.parse(readFileSync(path.join(folder,name+'.gltf')));assert.equal(gltf.asset.version,'2.0');for(const resource of [...gltf.buffers,...(gltf.images||[])]){const resolved=path.resolve(folder,resource.uri);assert(resolved.startsWith(folder+path.sep),'Dependency must remain local');assert(existsSync(resolved),resource.uri);dependencies++;}}
console.log(`Nature assets passed: ${provenance.models.length} non-Tripo models, ${dependencies} local dependencies, license and runtime hashes verified.`);
