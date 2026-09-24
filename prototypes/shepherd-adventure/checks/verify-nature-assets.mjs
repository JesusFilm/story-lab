import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const DEFAULT_ROOT=fileURLToPath(new URL('../../../',import.meta.url));
const RECORD_FIELDS=['path','sha256','bytes','upstream_sha256','upstream_bytes'];
const UPSTREAM_FIELDS=['upstream_sha256','upstream_bytes'];

const hasOwn=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const readJson=file=>JSON.parse(readFileSync(file,'utf8'));

function resolveInside(root,relative,label){
  const base=path.resolve(root);
  const resolved=path.resolve(base,relative);
  assert(resolved===base||resolved.startsWith(base+path.sep),`${label} escapes its root: ${relative}`);
  return resolved;
}

function validateRecord(record,label){
  assert(record&&typeof record==='object',`${label} must be an object`);
  assert.equal(typeof record.path,'string',`${label} path must be a string`);
  assert.match(record.sha256,/^[0-9a-f]{64}$/,`${label} SHA-256 must be a lowercase hex digest`);
  assert(Number.isInteger(record.bytes)&&record.bytes>=0,`${label} byte count must be a non-negative integer`);
  const hasUpstreamSha=hasOwn(record,'upstream_sha256');
  const hasUpstreamBytes=hasOwn(record,'upstream_bytes');
  assert.equal(hasUpstreamSha,hasUpstreamBytes,`${label} must include both upstream fields or neither`);
  if(hasUpstreamSha){
    assert.match(record.upstream_sha256,/^[0-9a-f]{64}$/,`${label} upstream SHA-256 must be a lowercase hex digest`);
    assert(Number.isInteger(record.upstream_bytes)&&record.upstream_bytes>=0,`${label} upstream byte count must be a non-negative integer`);
  }
}

function indexRecords(records,label){
  assert(Array.isArray(records),`${label} must be an array`);
  const indexed=new Map();
  for(const record of records){
    validateRecord(record,`${label} ${record?.path??'<unknown>'}`);
    assert(!indexed.has(record.path),`${label} contains duplicate path ${record.path}`);
    indexed.set(record.path,record);
  }
  return indexed;
}

function comparableRecord(record){
  return Object.fromEntries(RECORD_FIELDS.filter(field=>hasOwn(record,field)).map(field=>[field,record[field]]));
}

function comparableRecords(records,label){
  return [...indexRecords(records,label).entries()]
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([recordPath,record])=>({recordPath,...comparableRecord(record)}));
}

function assertRecordSetsEqual(expected,actual,label){
  assert.deepEqual(comparableRecords(actual,`${label} actual`),comparableRecords(expected,`${label} expected`),label);
}

function verifyRecordsOnDisk(records,root,label){
  const indexed=indexRecords(records,label);
  for(const record of indexed.values()){
    const filePath=resolveInside(root,record.path,`${label} ${record.path}`);
    assert(existsSync(filePath),`${label} is missing on disk: ${record.path}`);
    const bytes=readFileSync(filePath);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha256,record.sha256,`${label} SHA-256 mismatch for ${record.path}`);
    assert.equal(bytes.length,record.bytes,`${label} byte count mismatch for ${record.path}`);
  }
  return indexed;
}

function resolvedRecordMap(records,root,label){
  const map=new Map();
  for(const record of records){
    const resolved=resolveInside(root,record.path,`${label} ${record.path}`);
    assert(!map.has(resolved),`${label} contains duplicate resolved path ${resolved}`);
    map.set(resolved,record);
  }
  return map;
}

function assertManifestConsistency(library,runtimeExport,prototype){
  const libraryKeys=Object.keys(library).sort();
  const exportKeys=Object.keys(runtimeExport).sort();
  const prototypeKeys=Object.keys(prototype).sort();
  assert.deepEqual(prototypeKeys,exportKeys,'prototype provenance and runtime-export.json have different top-level fields');
  for(const key of libraryKeys){
    assert(hasOwn(runtimeExport,key),`runtime-export.json is missing provenance field ${key}`);
    assert.deepEqual(runtimeExport[key],library[key],`library provenance and runtime-export.json mismatch at ${key}`);
  }
  for(const key of exportKeys){
    assert.deepEqual(prototype[key],runtimeExport[key],`prototype provenance and runtime-export.json mismatch at ${key}`);
  }
}

function assertSourcesManifest({sources,prototype,prototypeRoot,repositoryRoot,sourceRoot}){
  assert(sources&&Array.isArray(sources.files),'assets/sources.json files must be an array');
  const natureEntries=sources.files.filter(entry=>typeof entry?.file==='string'&&entry.file.startsWith('assets/nature/'));
  const runtimeRecords=prototype.runtime_files;
  const sourceRecords=prototype.files;
  const runtimeByPath=resolvedRecordMap(runtimeRecords,repositoryRoot,'prototype runtime records');
  const sourceByPath=resolvedRecordMap(sourceRecords,sourceRoot,'prototype source records');
  const seenRuntime=new Set();
  const seenSource=new Set();
  for(const entry of natureEntries){
    assert.equal(typeof entry.source,'string',`nature source entry ${entry.file} source must be a string`);
    assert.match(entry.sha256,/^[0-9a-f]{64}$/,`nature source entry ${entry.file} SHA-256 must be a lowercase hex digest`);
    const runtimePath=resolveInside(prototypeRoot,entry.file,`nature source entry ${entry.file}`);
    const runtime=runtimeByPath.get(runtimePath);
    assert(runtime,`assets/sources.json nature entry has no runtime record: ${entry.file}`);
    assert(!seenRuntime.has(runtimePath),`assets/sources.json has duplicate nature entry: ${entry.file}`);
    seenRuntime.add(runtimePath);
    assert.equal(entry.sha256,runtime.sha256,`assets/sources.json SHA-256 disagrees with runtime record for ${entry.file}`);
    if(hasOwn(entry,'bytes'))assert.equal(entry.bytes,runtime.bytes,`assets/sources.json byte count disagrees with runtime record for ${entry.file}`);

    const sourcePath=resolveInside(repositoryRoot,entry.source,`nature source entry ${entry.file} source`);
    const source=sourceByPath.get(sourcePath);
    assert(source,`assets/sources.json nature entry has no source record: ${entry.source}`);
    assert(!seenSource.has(sourcePath),`assets/sources.json has duplicate nature source: ${entry.source}`);
    seenSource.add(sourcePath);
    assert.equal(hasOwn(entry,'upstream_sha256'),hasOwn(entry,'upstream_bytes'),`assets/sources.json ${entry.file} must include both upstream fields or neither`);
    for(const field of UPSTREAM_FIELDS){
      if(hasOwn(entry,field)){
        assert(hasOwn(source,field),`assets/sources.json ${entry.file} includes ${field} without a matching source record field`);
        assert.equal(entry[field],source[field],`assets/sources.json ${field} disagrees with source record for ${entry.file}`);
      }
    }
  }
  assert.equal(natureEntries.length,runtimeRecords.length,'assets/sources.json nature entry count does not match runtime record count');
  assert.deepEqual([...seenRuntime].sort(),[...runtimeByPath.keys()].sort(),'assets/sources.json nature entries do not cover all runtime records');
  assert.deepEqual([...seenSource].sort(),[...sourceByPath.keys()].sort(),'assets/sources.json nature entries do not cover all source records');
  return natureEntries.length;
}

export function loadNatureContext(repositoryRoot=DEFAULT_ROOT){
  const root=path.resolve(repositoryRoot);
  const prototypeRoot=path.join(root,'prototypes/shepherd-adventure');
  const prototypeNatureRoot=path.join(prototypeRoot,'assets/nature');
  const sourceRoot=path.join(root,'assets/nature/quaternius-stylized-nature');
  return {
    repositoryRoot:root,
    prototypeRoot,
    prototypeNatureRoot,
    sourceRoot,
    library:readJson(path.join(sourceRoot,'provenance.json')),
    runtimeExport:readJson(path.join(sourceRoot,'runtime-export.json')),
    prototype:readJson(path.join(prototypeNatureRoot,'provenance.json')),
    sources:readJson(path.join(prototypeRoot,'assets/sources.json')),
  };
}

export function verifyNatureAssets(context=loadNatureContext()){
  const {repositoryRoot,prototypeRoot,prototypeNatureRoot,sourceRoot,library,runtimeExport,prototype,sources}=context;
  assert.equal(library.origin,'third-party');
  assert.equal(library.generator,'not-tripo');
  assert.equal(library.license,'CC0-1.0');
  assert.equal(prototype.origin,'third-party');
  assert.equal(prototype.generator,'not-tripo');
  assert.equal(prototype.license,'CC0-1.0');
  assert.match(readFileSync(resolveInside(prototypeNatureRoot,'LICENSE.txt','prototype license'),'utf8'),/CC0 1\.0/);
  assertManifestConsistency(library,runtimeExport,prototype);

  const librarySource=verifyRecordsOnDisk(library.files,sourceRoot,'library provenance source');
  const exportSource=verifyRecordsOnDisk(runtimeExport.files,sourceRoot,'runtime-export source');
  const prototypeSource=verifyRecordsOnDisk(prototype.files,sourceRoot,'prototype provenance source');
  assertRecordSetsEqual(library.files,runtimeExport.files,'library/runtime-export source records differ');
  assertRecordSetsEqual(library.files,prototype.files,'library/prototype source records differ');

  const exportRuntime=verifyRecordsOnDisk(runtimeExport.runtime_files,repositoryRoot,'runtime-export runtime');
  const prototypeRuntime=verifyRecordsOnDisk(prototype.runtime_files,repositoryRoot,'prototype runtime');
  assertRecordSetsEqual(runtimeExport.runtime_files,prototype.runtime_files,'runtime-export/prototype runtime records differ');
  assert.equal(librarySource.size,exportSource.size,'source record counts differ between library manifests');
  assert.equal(librarySource.size,prototypeSource.size,'source record counts differ between library and prototype manifests');
  assert.equal(exportRuntime.size,prototypeRuntime.size,'runtime record counts differ between runtime manifests');

  const natureEntries=assertSourcesManifest({sources,prototype,prototypeRoot,repositoryRoot,sourceRoot});
  let dependencies=0;
  for(const name of prototype.models){
    const gltfPath=resolveInside(prototypeNatureRoot,`${name}.gltf`,`nature model ${name}`);
    const gltf=JSON.parse(readFileSync(gltfPath,'utf8'));
    assert.equal(gltf.asset.version,'2.0',`${name}.gltf must use glTF 2.0`);
    for(const resource of [...(gltf.buffers??[]),...(gltf.images??[])]){
      assert.equal(typeof resource.uri,'string',`${name}.gltf dependency URI must be a string`);
      const resolved=resolveInside(prototypeNatureRoot,resource.uri,`${name}.gltf dependency`);
      assert(existsSync(resolved),`${name}.gltf dependency is missing: ${resource.uri}`);
      dependencies++;
    }
  }
  return {models:prototype.models.length,dependencies,sourceRecords:librarySource.size,runtimeRecords:prototypeRuntime.size,natureEntries};
}

const isMain=process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url));
if(isMain){
  const result=verifyNatureAssets();
  console.log(`Nature assets passed: ${result.models} non-Tripo models, ${result.dependencies} local dependencies, ${result.sourceRecords} source records, ${result.runtimeRecords} runtime files, license, hashes, byte counts, provenance manifests and sources.json verified.`);
}
