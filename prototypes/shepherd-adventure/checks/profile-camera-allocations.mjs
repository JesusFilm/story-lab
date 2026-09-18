// Isolated Node allocation sampling, not browser RAM or GC pause measurement.
// Optional absolute camera module path lets the same scene exercise another revision.
import {Session} from 'node:inspector/promises';
import {loadSettlement,THREE} from './load-settlement.mjs';
import {pathToFileURL} from 'node:url';
const {JourneyCamera}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:new URL('../src/journey-camera.mjs',import.meta.url));
const {world}=await loadSettlement(),camera=new THREE.PerspectiveCamera(),rig=new JourneyCamera();
const j={position:{x:0,z:50},index:-1,phase:'choice',at:'entry',options:[],lantern:false,gateOpen:false,gateLit:false,lampAssembly:{lit:false,taken:false,step:0}};
const input={player:{x:0,y:0,z:50},heading:Math.PI,ahead:null,boxes:world.occluders,dt:1/60,reuseOutput:true};
const session=new Session();session.connect();await session.post('HeapProfiler.startSampling',{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
for(let i=0;i<1800;i++){const f=rig.update(input);camera.position.set(f.position.x,f.position.y,f.position.z);world.update(1/60,i/60,j);world.updateOcclusion(camera,j.position,1/60);if(i%60===0)await new Promise(setImmediate);}
const {profile}=await session.post('HeapProfiler.stopSampling');const rows=[];function visit(n){if(n.selfSize)rows.push({bytes:n.selfSize,name:n.callFrame.functionName,url:n.callFrame.url.split('/node_modules/').at(-1).split('/shepherd-adventure/').at(-1),line:n.callFrame.lineNumber+1});for(const c of n.children||[])visit(c);}visit(profile.head);rows.sort((a,b)=>b.bytes-a.bytes);console.log(JSON.stringify(rows.slice(0,20),null,2));session.disconnect();
