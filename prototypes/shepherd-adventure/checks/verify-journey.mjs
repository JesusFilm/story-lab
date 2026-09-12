import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Journey,NODE,NODES,EDGES,links,lanePoints} from '../src/journey-model.mjs';
let checks=0;const check=fn=>{fn();checks++;};
function walk(j,to){const e=j.options.find(e=>e.to===to);assert(e,`unavailable ${j.at} -> ${to}`);assert(j.commit(e));assert.equal(j.phase,'walking',`${j.at} -> ${to}`);for(let i=0;i<2000&&j.travel;i++)j.step(.05);assert.equal(j.at,to);}
function finishGate(j){for(let i=0;i<3000&&j.phase==='gate-sequence';i++)j.step(.05);assert.equal(j.phase,'choice');}
function inspect(j){assert(j.inspect());if(j.phase==='gate-sequence'){finishGate(j);return;}if(j.phase!=='arrival')assert(j.closeInspection());}
function prepare(j){walk(j,'gate');walk(j,'hearth');assert.equal(j.phase,'craft');for(const action of ['insert','raise','pour','pour','cap','spark'])j.craft.act(action);assert(j.finishCraft());walk(j,'gate');}
check(()=>{assert.equal(new Set(NODES.map(n=>n.id)).size,NODES.length);for(const e of EDGES){assert(NODE[e.a]&&NODE[e.b]);assert(!('cost' in e));}});
check(()=>{const j=new Journey();j.start();walk(j,'gate');assert(!j.options.some(e=>e.to==='field'));assert.equal(j.back(),false);assert.equal(j.commit(links('gate').find(e=>e.to==='field')),false);assert(j.inspected.has('gate'));assert.equal(j.phase,'choice');const before=j.distance;j.commit(j.options.find(e=>e.to==='well'));assert.equal(j.phase,'inspect');assert.equal(j.distance,before);j.closeInspection();walk(j,'hearth');assert.equal(j.phase,'craft');assert(!j.lantern);});
check(()=>{const j=new Journey();j.start();j.commit();j.step(1);j.paused=true;const before=j.snapshot();j.step(100);assert.deepEqual(j.snapshot(),before);});
const routes=[];
check(()=>{for(const route of [['well','square','pen','arch','goal'],['olive','lookout','olive','market','square','arch','goal']]){const j=new Journey();j.start();prepare(j);for(const to of route){walk(j,to);if(j.phase==='gate-sequence'){const p=j.position;j.paused=true;j.step(10);assert.deepEqual(j.position,p);j.paused=false;finishGate(j);}}assert.equal(j.phase,'arrival');assert(j.gateOpen);assert(j.discoveries.has(route[0]==='well'?'rear':'overlook'));routes.push({route:route.join(' → '),metres:Math.round(j.distance)});j.reset();assert.deepEqual(j.snapshot(),new Journey().snapshot());}});
check(()=>{const j=new Journey();j.start();prepare(j);j.recover();assert(j.lantern);assert.equal(j.at,'gate');});
// Independent finite-state graph: inventory bits wick/oil/lantern, knowledge bits overlook/rear/gate.
const key=([at,i,k])=>`${at}:${i}:${k}`;
function next([at,i,k]){const out=[];if(at==='hearth')out.push([at,i|7,k]);if(at==='lookout')out.push([at,i,k|1]);if(at==='pen')out.push([at,i,k|2]);if(at==='arch')out.push([at,i,k|4]);for(const e of links(at)){if(['field','wick','oil'].includes(e.to))continue;if(at==='gate'&&!(i&4)&&!['field','hearth'].includes(e.to))continue;if(e.requires==='overlook'&&!(k&1)||e.requires==='rear'&&!(k&2)||['gate','welcome'].includes(e.requires)&&!(k&4))continue;out.push([e.to,i,k]);}return out;}
const queue=[['field',0,0]],states=new Map(),reverse=new Map();while(queue.length){const state=queue.shift(),id=key(state);if(states.has(id))continue;states.set(id,state);for(const n of next(state)){const nk=key(n);if(!reverse.has(nk))reverse.set(nk,[]);reverse.get(nk).push(id);if(!states.has(nk))queue.push(n);}}
check(()=>{const q=[...states].filter(([,s])=>s[0]==='goal').map(([id])=>id),winning=new Set();while(q.length){const id=q.shift();if(winning.has(id))continue;winning.add(id);q.push(...(reverse.get(id)||[]));}for(const id of states.keys())assert(winning.has(id),`softlock ${id}`);});
check(()=>{for(const e of EDGES)for(const p of lanePoints(e))assert(Number.isFinite(p.x)&&Number.isFinite(p.z));});
const report={status:'passed',checks,knowledgeStates:states.size,routes,limits:'State safety and reachability do not establish enjoyment, clue readability or actual remote performance.'};writeFileSync(new URL('./journey-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
