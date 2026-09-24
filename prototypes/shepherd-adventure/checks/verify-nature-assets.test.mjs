import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {loadNatureContext,verifyNatureAssets} from './verify-nature-assets.mjs';

const fixtureRoot=fileURLToPath(new URL('./fixtures/nature-provenance/',import.meta.url));
const freshContext=()=>loadNatureContext(fixtureRoot);
const sourceManifests=context=>[context.library,context.runtimeExport,context.prototype];

test('nature provenance fixture passes source/runtime and cross-manifest checks',()=>{
  assert.deepEqual(verifyNatureAssets(freshContext()),{models:0,dependencies:0,sourceRecords:2,runtimeRecords:2,natureEntries:2});
});

test('stale source SHA-256 is rejected even when every manifest agrees',()=>{
  const context=freshContext();
  for(const manifest of sourceManifests(context))manifest.files[1].sha256='0'.repeat(64);
  assert.throws(()=>verifyNatureAssets(context),/library provenance source SHA-256 mismatch for originals\/source\.dat/);
});

test('stale source byte count is rejected even when every manifest agrees',()=>{
  const context=freshContext();
  for(const manifest of sourceManifests(context))manifest.files[1].bytes+=1;
  assert.throws(()=>verifyNatureAssets(context),/library provenance source byte count mismatch for originals\/source\.dat/);
});

test('optional upstream metadata is part of cross-manifest consistency',()=>{
  const context=freshContext();
  context.runtimeExport.files[1].upstream_sha256='2'.repeat(64);
  assert.throws(()=>verifyNatureAssets(context),/library provenance and runtime-export\.json mismatch at files/);
});

test('sources.json optional upstream metadata must agree with its source record',()=>{
  const context=freshContext();
  context.sources.files.find(entry=>entry.file==='assets/nature/runtime.dat').upstream_bytes+=1;
  assert.throws(()=>verifyNatureAssets(context),/assets\/sources\.json upstream_bytes disagrees with source record for assets\/nature\/runtime\.dat/);
});
