import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {Controller,Footprints,canOccupy,nodeWorld,angleDelta,RADIUS,SPEED,WALK_SPEED,RUN_SPEED,FOOTPRINT_CAPACITY} from '../src/controller.mjs';
import {RunSession,visibleOnMap} from '../src/session.mjs';
const map=JSON.parse(readFileSync(new URL('../map/maze-layout.json',import.meta.url)));
const checks={};
function until(c,predicate,limit=100000){for(let i=0;i<limit;i++){if(predicate(c))return;c.step(.01);}throw new Error('Condition timed out: '+JSON.stringify(c.snapshot()));}
function atEdge(a,b){const c=new Controller(map);c.at=a.join(',');Object.assign(c,nodeWorld(a));c.heading=Math.atan2(b[0]-a[0],b[1]-a[1]);c.depart(b.join(','));return c;}
let samples=0;
for(const[a,b]of map.edges){const p=nodeWorld(a),q=nodeWorld(b);for(let i=0;i<=80;i++){assert(canOccupy(map,p.x+(q.x-p.x)*i/80,p.z+(q.z-p.z)*i/80));samples++;}}
checks.all_graph_corridors_clear={pass:true,edges:map.edges.length,samples,radius_m:RADIUS};
let warnings=0;const degrees=new Map(map.nodes.map(n=>[n.id,n.degree]));
for(const[a,b]of map.edges)for(const[from,to]of[[a,b],[b,a]])if(degrees.get(to.join(','))>=3&&to.join(',')!==map.end.join(',')){
 const c=atEdge(from,to);until(c,x=>!!x.decision);const announced=c.elapsed,id=c.decision.id;
 assert(Math.abs(c.warningSeconds-2)<.02);until(c,x=>x.phase==='waiting');
 assert(c.elapsed-announced>=1.98);const snapshot={x:c.x,z:c.z,d:c.distance};
 for(let i=0;i<300;i++)c.step(.01);assert.equal(c.distance,snapshot.d);assert.equal(c.x,snapshot.x);assert.equal(c.z,snapshot.z);
 assert(!c.command('forward',id-1));assert.equal(c.phase,'waiting');
 for(const choice of c.decision.options){
  const trial=atEdge(from,to);until(trial,x=>x.phase==='waiting');const oldId=trial.decision.id;
  assert(trial.command(choice.action,oldId));assert.equal(trial.edge.to,choice.next);
  assert(!trial.command(choice.action,oldId)); // Consumed choice cannot apply to a later state.
  const early=atEdge(from,to);until(early,x=>!!x.decision);
  const queuedId=early.decision.id;assert(early.command(choice.action,queuedId));
  while(early.decision?.id===queuedId){early.step(.01);assert.notEqual(early.phase,'waiting');}
  assert.equal(early.edge.to,choice.next); // Same node-centred automatic departure as a forced bend.

 }
 warnings++;
}
checks.every_junction_approach_warns_waits_and_auto_turns_early={pass:true,approaches:warnings,speed_m_s:SPEED};
const pacing=new Controller(map);pacing.begin();
for(let i=0;i<60;i++){pacing.step(.01);assert.equal(pacing.speed,WALK_SPEED);}
until(pacing,c=>c.speed>=RUN_SPEED-1e-6);const atRun=pacing.distance;
pacing.restartPace();for(let i=0;i<60;i++){pacing.step(.01);if(pacing.phase==='walking')assert.equal(pacing.speed,WALK_SPEED);}
until(pacing,c=>!!c.decision);assert.equal(pacing.speed,WALK_SPEED);
checks.walk_run_resume_and_anticipation={pass:true,walk_m_s:WALK_SPEED,run_m_s:RUN_SPEED,first_full_run_at_m:atRun};
let fullSpeedWarnings=0;
for(const[a,b]of map.edges)for(const[from,to]of[[a,b],[b,a]])if(degrees.get(to.join(','))>=3&&to.join(',')!==map.end.join(',')){
 const fast=atEdge(from,to);fast.travelSpeed=RUN_SPEED;fast.movingSinceResume=10;
 until(fast,c=>!!c.decision);assert.equal(fast.speed,WALK_SPEED);const began=fast.elapsed;
 until(fast,c=>c.phase==='waiting');assert(fast.elapsed-began>=1.98);fullSpeedWarnings++;
}
checks.running_approaches_preserve_choice_time={pass:true,approaches:fullSpeedWarnings};
const fastTrail=new Footprints();for(let i=0;i<1200;i++){fastTrail.age(.05);fastTrail.walk({x:0,z:i*.05*RUN_SPEED},{x:0,z:(i+1)*.05*RUN_SPEED},0);}
assert(fastTrail.items.length>600);assert(fastTrail.items.length<=FOOTPRINT_CAPACITY);
checks.full_running_trail_fits_render_capacity={pass:true,prints:fastTrail.items.length,capacity:FOOTPRINT_CAPACITY};
for(const route of map.routes){
 const c=new Controller(map);c.begin();let ticks=0,decisions=new Set();
 while(!c.arrived){
  if(c.decision&&!c.decision.selected){
   const index=route.nodes.findIndex(n=>n.join(',')===c.decision.at),next=route.nodes[index+1]?.join(',');
   const choice=c.decision.options.find(o=>o.next===next);assert(choice,`Missing choice for route ${route.id} at ${c.decision.at}`);
   decisions.add(c.decision.id);assert(c.command(choice.action,c.decision.id));
  }
  c.step(.02);assert.notEqual(c.phase,'waiting');assert(canOccupy(map,c.x,c.z));assert(++ticks<100000);
 }
 assert(Math.abs(c.distance-route.length_m)<.01);assert.equal(c.phase,'arrived');
 checks['route_'+route.id+'_tap_navigation']={pass:true,metres:c.distance,decisions:decisions.size};
}
const c=new Controller(map);c.begin();until(c,x=>x.distance>=3);const pos={x:c.x,z:c.z},heading=c.heading;
assert(c.command('back'));until(c,x=>x.phase==='stopped');assert.equal(c.x,pos.x);assert.equal(c.z,pos.z);
assert(Math.abs(Math.abs(angleDelta(heading,c.heading))-Math.PI)<1e-6);
for(let i=0;i<200;i++)c.step(.01);assert.equal(c.x,pos.x);assert.equal(c.z,pos.z);
assert(c.command('forward'));until(c,x=>x.phase==='deadend');assert.equal(c.at,map.start.join(','));assert(c.command('back'));
until(c,x=>x.phase==='stopped');assert(c.command('forward'));
checks.mid_edge_uturn_deadend_and_explicit_resume={pass:true};
const d=new Controller(map);d.begin();until(d,x=>!!x.decision);const oldId=d.decision.id;
assert(d.command('back',oldId));until(d,x=>x.phase==='stopped');assert(!d.command('forward',oldId));assert(d.command('forward'));
checks.uturn_cancels_queued_and_stale_commands={pass:true};
// Shortest guidance must be continuous, clear and valid from either side of every edge.
let routes=0;
for(const[a,b]of map.edges){for(const fraction of [.2,.8]){
 const c=atEdge(a,b);while(c.edge.progress<c.edge.length*fraction)c.step(.01);
 const route=c.route();assert.equal(route.ids.at(-1),map.end.join(','));
 for(let i=1;i<route.points.length;i++){
  const p=route.points[i-1],q=route.points[i];assert(Math.abs(p.x-q.x)<.001||Math.abs(p.z-q.z)<.001);
  for(let j=0;j<=20;j++)assert(canOccupy(map,p.x+(q.x-p.x)*j/20,p.z+(q.z-p.z)*j/20));
 }
 routes++;
}}
checks.guidance_from_arbitrary_edges={pass:true,positions:routes};
const trail=new Footprints();trail.walk({x:0,z:0},{x:0,z:6},0);assert.equal(trail.items.length,10);
assert(trail.items[0].x*trail.items[1].x<0);const print=trail.items[0];trail.age(20);assert(Math.abs(trail.opacity(print)-2/3)<1e-6);
trail.age(39);assert(trail.items.length===10);trail.age(1);assert.equal(trail.items.length,0);
checks.footprints_alternate_visible_at_20s_expire_at_60s={pass:true};
for(const difficulty of ['easy','medium','maximum']){
 const run=new RunSession(difficulty);run.mapUsed=true;
 assert.equal(run.routeVisible,difficulty==='easy');assert.equal(run.config.map,difficulty==='maximum'?'local':'full');
 assert.equal(visibleOnMap(run,{x:6,z:134},{x:134,z:6}),difficulty!=='maximum');
 if(difficulty!=='easy'){
  run.earnedDiscoveries.push('example-preserved-event');assert(!run.confirmRoute());assert(!run.routeVisible);
  assert(run.requestRoute());assert(!run.routeVisible);run.cancelRoute();assert(!run.routeVisible);
  run.requestRoute();assert(run.confirmRoute());assert(run.routeVisible);assert(!run.result().challengeCompletionEligible);
  assert.deepEqual(run.result().earnedDiscoveries,['example-preserved-event']);assert.equal(run.result().completionType,'guided');
 }
 checks[difficulty+'_assistance_policy']={pass:true};
}
writeFileSync(new URL('./controller-verification.json',import.meta.url),JSON.stringify({date:'2026-09-08',scope:'Graph movement, footprints and difficulty policies; not physical-device testing',checks},null,2)+'\n');
console.log(JSON.stringify(checks,null,2));
