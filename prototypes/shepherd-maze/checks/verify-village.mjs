import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Controller,canOccupy,nodeWorld,RADIUS,WALK_SPEED} from '../src/controller.mjs';
const mapBytes=readFileSync(new URL('../maps/village/maze-layout.json',import.meta.url));
const map=JSON.parse(mapBytes),foundry=JSON.parse(readFileSync(new URL('../maps/village/foundry-manifest.json',import.meta.url)));
const assets=JSON.parse(readFileSync(new URL('./village-asset-manifest.json',import.meta.url)));
assert(foundry.verification.passed);assert.equal(foundry.config.wallMode,'mixed');
assert.equal(assets.map_sha256,createHash('sha256').update(mapBytes).digest('hex'));
const point=n=>nodeWorld(n,map),checks={foundry_verified:true,asset_hash_matches:true};
// Independently reconstruct the complete collision bitmap from the modeled rectangles.
let pixels=0;
for(let z=0;z<map.walkability_grid.length;z++)for(let x=0;x<map.walkability_grid[0].length;x++){
 const X=(x+.5)*map.tile_m,Z=(z+.5)*map.tile_m;
 const blocked=map.solids.some(s=>X>=s.rect[0]&&X<s.rect[2]&&Z>=s.rect[1]&&Z<s.rect[3]);
 assert.equal(blocked,!map.walkability_grid[z][x]);pixels++;
}
checks.exact_raster_coverage={pixels};
let samples=0;
for(const [a,b] of map.edges){const p=point(a),q=point(b);for(let i=0;i<=160;i++){
 assert(canOccupy(map,p.x+(q.x-p.x)*i/160,p.z+(q.z-p.z)*i/160));samples++;
}}
checks.all_corridors_clear={edges:map.edges.length,samples,radius:RADIUS};
const until=(c,p)=>{for(let i=0;i<100000;i++){if(p(c))return;c.step(.01);}throw new Error('Timed out '+c.phase);};
let approaches=0;
for(const [a,b] of map.edges)for(const [from,to] of [[a,b],[b,a]]){
 if(map.nodes.find(n=>n.id===to.join(',')).degree<3||to.join(',')===map.end.join(','))continue;
 const spawn=()=>{const c=new Controller(map);c.at=from.join(',');Object.assign(c,point(from));c.heading=Math.atan2(to[0]-from[0],to[1]-from[1]);c.depart(to.join(','));return c;};
 const c=spawn();until(c,c=>!!c.decision);assert(Math.abs(c.warningSeconds-2)<.02);assert.equal(c.speed,WALK_SPEED);
 until(c,c=>c.phase==='waiting');const distance=c.distance;for(let i=0;i<100;i++)c.step(.01);assert.equal(c.distance,distance);
 for(const choice of c.decision.options){const early=spawn();until(early,c=>!!c.decision);const id=early.decision.id;assert(early.command(choice.action,id));while(early.decision?.id===id){early.step(.01);assert.notEqual(early.phase,'waiting');}assert.equal(early.edge.to,choice.next);}
 approaches++;
}
checks.junctions_warn_wait_and_accept_early_taps={approaches};
checks.routes=[];
for(const route of map.routes){const c=new Controller(map);c.begin();let ticks=0;
 while(!c.arrived){if(c.decision&&!c.decision.selected){const i=route.nodes.findIndex(n=>n.join(',')===c.decision.at),next=route.nodes[i+1].join(',');assert(c.command(c.decision.options.find(o=>o.next===next).action,c.decision.id));}
 c.step(.02);assert(canOccupy(map,c.x,c.z));assert(++ticks<100000);}
 assert(Math.abs(c.distance-route.length_m)<.001);checks.routes.push({metres:c.distance,seconds:c.elapsed});
}
let positions=0;
for(const[a,b]of map.edges)for(const f of [.2,.8]){
 const c=new Controller(map);c.at=a.join(',');Object.assign(c,point(a));c.heading=Math.atan2(b[0]-a[0],b[1]-a[1]);c.depart(b.join(','));until(c,c=>c.edge.progress>=c.edge.length*f);
 const r=c.route();assert.equal(r.ids.at(-1),map.end.join(','));for(let i=1;i<r.points.length;i++)for(let j=0;j<=40;j++){const p=r.points[i-1],q=r.points[i];assert(canOccupy(map,p.x+(q.x-p.x)*j/40,p.z+(q.z-p.z)*j/40));}positions++;
}
checks.guidance={positions};
const c=new Controller(map);c.begin();until(c,c=>!!c.decision);const first=c.decision.at;until(c,c=>c.phase==='waiting');checks.first_choice={metres:c.distance,seconds:c.elapsed,node:first};
assert(assets.solids.filter(s=>s.kind==='low-wall').every(s=>s.height<1.05));
checks.structure_counts=assets.solids.reduce((a,s)=>(a[s.kind]=(a[s.kind]||0)+1,a),{});
writeFileSync(new URL('./village-verification.json',import.meta.url),JSON.stringify({date:'2026-09-08',seed:map.seed,checks},null,2)+'\n');console.log(JSON.stringify(checks,null,2));
