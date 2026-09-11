// The Foundry export stays intact; this adapter owns only the walkthrough contract.
import {readFileSync,writeFileSync} from 'node:fs';
import {generate,exportManifest,encodePNG} from '../../../projects/maze-foundry/src/index.mjs';
const dir=new URL('../maps/village/',import.meta.url);
const config=JSON.parse(readFileSync(new URL('config.json',dir)));
const result=generate(config);
if(!result.passed)throw new Error(JSON.stringify(result.report));
const manifest=exportManifest(result),r=result.raster,p=r.pixelsPerMetre;
const write=(name,data)=>writeFileSync(new URL(name,dir),JSON.stringify(data,null,2)+'\n');
write('foundry-manifest.json',manifest);
writeFileSync(new URL('maze.png',dir),encodePNG(r));
const xy=id=>[id%config.columns,Math.floor(id/config.columns)];
const solids=manifest.wallSegments.map(s=>({id:s.id,kind:s.thicknessMetres<1?'low-wall':['home','market','animal-stall'][((s.column*7+s.row*3+(s.orientation==='h'?1:0))%3)],rect:[s.x/p,s.y/p,(s.x+s.w)/p,(s.y+s.h)/p],thickness:s.thicknessMetres,orientation:s.orientation}));
for(let y=0;y<=config.rows;y++)for(let x=0;x<=config.columns;x++)solids.push({id:`post-${x}-${y}`,kind:'low-courtyard',rect:[x*r.pitch/p,y*r.pitch/p,(x*r.pitch+r.wallPixels)/p,(y*r.pitch+r.wallPixels)/p]});
const W=r.widthMetres,H=r.heightMetres,t=r.wallPixels/p;
for(const[id,rect]of [['north',[0,0,W,t]],['south',[0,H-t,W,H]],['west',[0,0,t,H]],['east',[W-t,0,W,H]]])solids.push({id,kind:'boundary',rect});
const layout={schema:'watch-game-foundry-adapter-v1',seed:manifest.seed,source:'foundry-manifest.json',
 width_m:W,height_m:H,tile_m:1/p,node_pitch_m:r.cellPitchMetres,
 node_origin_m:[manifest.start.metres.x,manifest.start.metres.z],
 start:xy(result.maze.start),end:xy(result.maze.exit),
 nodes:manifest.adjacency.map((ns,i)=>({id:xy(i).join(','),xy:xy(i),degree:ns.length})),
 edges:manifest.adjacency.flatMap((ns,i)=>ns.filter(n=>n>i).map(n=>[xy(i),xy(n)])),
 routes:manifest.verifiedWinPaths.map((nodes,i)=>({id:String(i+1),nodes:nodes.map(xy),length_m:(nodes.length-1)*r.cellPitchMetres})),
 solids,solid_rectangles_tiles:solids.map(s=>s.rect.map(v=>v*p)),
 walkability_grid:Array.from({length:r.height},(_,y)=>Array.from(r.pixels.slice(y*r.width,(y+1)*r.width),v=>v===255?1:0))};
write('maze-layout.json',layout);
console.log(JSON.stringify({seed:manifest.seed,attempt:manifest.attempt,size:manifest.size,metrics:manifest.verification.metrics,kinds:solids.reduce((a,s)=>(a[s.kind]=(a[s.kind]||0)+1,a),{})},null,2));
