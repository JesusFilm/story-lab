import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {DEFAULT_CONFIG,PRESETS,resolveConfig,generate,generateCandidate,rasterize,verify,winPaths,encodePNG,exportManifest} from '../src/index.mjs';
import {edgeKey} from '../src/graph.mjs';

test('same seed and config produce identical graph, raster and simulations',()=>{
  const a=generate(),b=generate();assert.ok(a.passed);assert.deepEqual(a.maze,b.maze);assert.deepEqual(a.raster.pixels,b.raster.pixels);assert.deepEqual(a.report,b.report);
  assert.notDeepEqual(generate({seed:'another-seed'}).maze.adjacency,a.maze.adjacency);
});
test('all presets meet criteria with both wall types',()=>{
  for(const settings of Object.values(PRESETS))for(const wallMode of ['uniform','mixed']){const r=generate({...settings,wallMode});assert.ok(r.passed,JSON.stringify(r.report.checks.filter(c=>!c.pass)));}
});
test('repair supports two- and three-step minimum choice spacing',()=>{
  for(const minChoiceSpacing of [2,3]){const r=generate({minChoiceSpacing,maxAttempts:10});assert.ok(r.passed);assert.ok(r.report.metrics.minChoiceSpacing>=minChoiceSpacing);}
});
test('edge sizes and one-pixel mixed walls satisfy the same raster contract',()=>{
  for(const [columns,rows,pixelsPerMetre]of [[4,4,8],[4,32,8],[32,4,8],[48,48,2]]){
    const r=generate({columns,rows,pixelsPerMetre,minDeadEnds:0,minSolutionLength:1,minWinPaths:1,maxCorridorLength:2303,maxFirstChoice:2303});assert.ok(r.passed,`${columns} × ${rows}`);
  }
  for(const thickWall of [1,1.375]){const r=generate({thinWall:.125,thickWall,thickProbability:0});assert.ok(r.passed,JSON.stringify(r.report.checks.filter(c=>!c.pass)));assert.ok(r.raster.segments.every(s=>s.thicknessMetres===.125));}
});
test('invalid, contradictory, unknown and oversized settings are rejected',()=>{
  for(const config of [{columns:NaN},{rows:4.2},{seed:''},{playerWidth:3},{thinWall:2,thickWall:1},{minChoiceSpacing:10,maxCorridorLength:5},{minWinPaths:5},{minDeadEnds:400},{minSolutionLength:320},{columns:48,rows:48,passageWidth:8,thickWall:4,pixelsPerMetre:24},{columns:2},{madeUp:true},{wallOverrides:[]},{wallOverrides:{'v-0-0':1}},{wallOverrides:{'h-1-1':4}},{wallThickness:0.125,pixelsPerMetre:2}])assert.throws(()=>resolveConfig(config),JSON.stringify(config));
});
test('impossible targets produce explicit rejection; cannot export manifest',()=>{
  const r=generate({minDeadEnds:318,maxAttempts:2});assert.equal(r.passed,false);assert.equal(r.attempts,2);assert.ok(r.report.checks.some(c=>!c.pass));assert.throws(()=>exportManifest(r),/blocked/);
});
test('side cycles do not count as extra simple win paths',()=>{
  // Main route 0—1—2; cycle 1—3—4—1 hangs from a single articulation.
  const a=[[1],[0,2,3,4],[1],[1,4],[1,3]];assert.equal(winPaths(a,0,2,4).length,1);
  a[3].push(2);a[2].push(3);const paths=winPaths(a,0,2,4);assert.ok(paths.length>=2);for(const p of paths)assert.equal(new Set(p).size,p.length);
});
test('Yen route results match exhaustive enumeration on small graphs',()=>{
  for(let seed=0;seed<12;seed++){
    const maze=generateCandidate({...PRESETS.easy,columns:4,rows:4,minDeadEnds:0,minSolutionLength:1,seed:`tiny-${seed}`},0),a=maze.adjacency;
    const all=[];function walk(path){if(path.at(-1)===15){all.push(path);return;}for(const next of a[path.at(-1)])if(!path.includes(next))walk([...path,next]);}walk([0]);all.sort((a,b)=>a.length-b.length);
    const found=winPaths(a,0,15,4);assert.equal(found.length,Math.min(4,all.length));assert.deepEqual(found.map(p=>p.length),all.slice(0,4).map(p=>p.length));
  }
});
test('wall sampling, overrides and physical scale are deterministic',()=>{
  const r=generate(),segments=r.raster.segments;assert.deepEqual(new Set(segments.map(s=>s.thicknessMetres)),new Set([.5,1.5]));
  const s=segments[0],maze=structuredClone(r.maze);maze.config.wallOverrides[s.id]=1;const edited=rasterize(maze);assert.equal(edited.segments[0].thicknessMetres,1);
  assert.deepEqual(edited.segments.slice(1),segments.slice(1));assert.ok(verify(maze,edited).passed);assert.deepEqual(maze.adjacency,r.maze.adjacency);
  const garden=generate({wallMode:'uniform',wallThickness:1.25});assert.deepEqual(new Set(garden.raster.segments.map(s=>s.thicknessMetres)),new Set([1.25]));
  for(const [prob,width]of [[0,.5],[1,1.5]])assert.deepEqual(new Set(generate({thickProbability:prob}).raster.segments.map(s=>s.thicknessMetres)),new Set([width]));
  const meta=exportManifest(r);assert.equal(meta.size.widthMetres,r.raster.width/8);assert.equal(meta.image.walkableValue,255);assert.equal(meta.start.metres.x,(meta.start.pixel.x+.5)/8);
});
test('independent raster verifier catches pinholes, blocked paths, leaks, nonbinary data and wrong scale',()=>{
  const r=generate();const checkMutation=(mutate,id)=>{const raster={...r.raster,pixels:r.raster.pixels.slice()};mutate(raster);const report=verify(r.maze,raster);assert.equal(report.passed,false);assert.equal(report.checks.find(c=>c.id===id)?.pass,false,id);};
  checkMutation(q=>{q.pixels[0]=255;},'boundary');
  checkMutation(q=>{q.pixels[0]=17;},'binary');
  checkMutation(q=>{q.width++;},'raster-size');
  const s=r.raster.segments[0];checkMutation(q=>{const x=s.orientation==='v'?s.column*q.pitch+Math.floor(q.wallPixels/2):s.x+Math.floor(q.pitch/2),y=s.orientation==='h'?s.row*q.pitch+Math.floor(q.wallPixels/2):s.y+Math.floor(q.pitch/2);q.pixels[y*q.width+x]=255;},'closed-walls');
  const next=r.maze.adjacency[0][0];checkMutation(q=>{const x=next===1?q.pitch+Math.floor(q.wallPixels/2):Math.floor(q.wallPixels/2+q.pitch/2),y=next===1?Math.floor(q.wallPixels/2+q.pitch/2):q.pitch+Math.floor(q.wallPixels/2);q.pixels[y*q.width+x]=0;},'open-passages');
});
test('graph corruption cannot receive a passing verification',()=>{
  const r=generate(),maze=structuredClone(r.maze);maze.adjacency[0].push(maze.adjacency[0][0]);assert.equal(verify(maze,r.raster).passed,false);
  const other=structuredClone(r.maze);other.adjacency[0]=[];assert.equal(verify(other,r.raster).passed,false);
  for(const value of [null,42,{}]){const malformed=structuredClone(r.maze);malformed.adjacency[1]=value;assert.equal(verify(malformed,r.raster).passed,false);}
});
test('maximum footprint fits; subpixel shortfall is rejected before generation',()=>{
  assert.ok(generate({playerWidth:2}).passed);
  assert.throws(()=>generate({passageWidth:1.1,playerWidth:1.1,pixelsPerMetre:2,thinWall:.5,maxAttempts:1}),/rounding/);
});
test('replayed adversarial traversal only crosses real edges and reaches exit',()=>{
  const r=generate(),trace=r.report.simulations.adversarialTrace;assert.equal(trace[0],r.maze.start);assert.equal(trace.at(-1),r.maze.exit);
  for(let i=1;i<trace.length;i++)assert.ok(r.maze.adjacency[trace[i-1]].includes(trace[i]),edgeKey(trace[i-1],trace[i]));assert.ok(trace.length<=2*r.maze.adjacency.length);
});
test('PNG decodes with a separate zlib decoder and matches every binary pixel',()=>{
  const r=generate(),png=encodePNG(r.raster);assert.deepEqual([...png.slice(0,8)],[137,80,78,71,13,10,26,10]);
  const view=new DataView(png.buffer,png.byteOffset,png.byteLength),idat=[];let width,height;const types=[];
  for(let pos=8;pos<png.length;){const length=view.getUint32(pos),type=new TextDecoder().decode(png.slice(pos+4,pos+8)),data=png.slice(pos+8,pos+8+length);types.push(type);
    // Independent table-based CRC checks both data integrity and chunk framing.
    let crc=0xffffffff;const table=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
    for(const byte of png.slice(pos+4,pos+8+length))crc=table[(crc^byte)&255]^(crc>>>8);assert.equal((crc^0xffffffff)>>>0,view.getUint32(pos+8+length));
    if(type==='IHDR'){width=new DataView(data.buffer).getUint32(0);height=new DataView(data.buffer).getUint32(4);assert.deepEqual([...data.slice(8)],[8,0,0,0,0]);}if(type==='IDAT')idat.push(data);pos+=length+12;
  }
  assert.deepEqual(types,['IHDR','IDAT','IEND']);const raw=inflateSync(Buffer.concat(idat));assert.equal(raw.length,(width+1)*height);
  for(let y=0;y<height;y++){assert.equal(raw[y*(width+1)],0);assert.deepEqual(new Uint8Array(raw.subarray(y*(width+1)+1,(y+1)*(width+1))),r.raster.pixels.subarray(y*width,(y+1)*width));}
});
