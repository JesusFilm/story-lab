import assert from 'node:assert/strict';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {Journey,polylineLength,followerArrivalRoute} from '../src/journey-model.mjs';
import {ARRIVAL_DURATION,ARRIVAL_POSITIONS,ARRIVAL_HEADING,arrivalFrame} from '../src/journey-arrival.mjs';
const {scene,world}=await loadSettlement();
const hills=[];scene.traverse(o=>{if(o.name==='distant-horizon-hill')hills.push(o);});
assert.equal(hills.length,17);for(const hill of hills)assert(new THREE.Box3().setFromObject(hill).max.z<=-119.99,'Horizon cannot intrude into enclosure');
const pen=world.settlementFeatures.find(f=>f.label==='Quiet animal pen').root;
const posts=pen.children.filter(o=>o.name.startsWith('sheep-fence-post-'));
for(const rail of pen.children.filter(o=>o.name==='sheep-fence-rail'))for(const [x,z] of rail.userData.endpoints)assert(posts.some(p=>Math.hypot(p.position.x-x,p.position.z-z)<.001),'Each rail endpoint has a post');
assert.equal(scene.getObjectByName('open-animal-gate-leaf').children.filter(o=>o.name==='gate-leaf-end-post').length,2);
const j=new Journey();j.start();j.at='goal';j.inspect();assert.equal(j.phase,'arrival');assert.equal(j.beginOutro(),false);
j.followerTime=100;j.updateFollowers(100);
const positions=[j.position,...j.followers];for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)assert(Math.hypot(positions[a].x-positions[b].x,positions[a].z-positions[b].z)>=2.19,'Shepherds stand apart');
for(const f of j.followers){assert(!f.moving);assert.equal(f.heading,ARRIVAL_HEADING);}
for(let i=0;i<2;i++){const route=followerArrivalRoute(i);assert.deepEqual(route.at(-1),ARRIVAL_POSITIONS[i+1]);assert(polylineLength(route)>0);}
const from={position:{x:-21,y:4,z:-67},look:{x:-29,y:1,z:-73}};
assert.deepEqual(arrivalFrame(from,0),from);
j.step(2);j.paused=true;const snapshot=j.snapshot();j.step(20);assert.deepEqual(j.snapshot(),snapshot);j.paused=false;j.step(ARRIVAL_DURATION);
const end=arrivalFrame(from,j.arrivalTime);assert(Math.hypot(end.position.x-j.position.x,end.position.z-j.position.z)<.4);assert(end.look.x<end.position.x-5);assert.deepEqual(arrivalFrame(from,0,true),end);
assert.equal(j.outroStarted,false,'Arrival never starts the outro');assert(j.beginOutro());assert.equal(j.beginOutro(),false);j.reset();assert.equal(j.arrivalTime,0);assert.equal(j.outroStarted,false);
console.log('Nativity fixes passed: remote horizon, complete fence/gate posts, spaced arrival, first-person endpoint, explicit outro, pause and reset.');
