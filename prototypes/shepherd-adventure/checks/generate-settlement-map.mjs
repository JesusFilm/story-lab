// Orthographic footprint map from the same scene construction and GLBs as the game.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadSettlement,THREE} from './load-settlement.mjs';
const rehearsal=process.argv.includes('--rehearsal');
const {NODES:originalNodes}=await import('../src/journey-model.mjs');
const {STOPS,CORRIDORS,HOUSE_APPROACHES}=rehearsal?await import('../src/rehearsal-route.mjs'):{};
const NODES=rehearsal?STOPS.map(s=>({id:s.id,name:s.title,...s.anchor})):originalNodes;
const {scene,world}=await loadSettlement(rehearsal?{routePaths:CORRIDORS,houseApproaches:HOUSE_APPROACHES}:undefined);
const outputName=rehearsal?'rehearsal':'settlement';
const round=n=>Math.round(n*1000)/1000;
function hull(points){
 const sorted=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const half=arr=>{const h=[];for(const p of arr){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
const features=world.settlementFeatures.map(({root,label,kind,asset})=>{
 const points=[],v=new THREE.Vector3();
 root.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);points.push([round(v.x),round(v.z)]);}}});
 const box=new THREE.Box3().setFromObject(root);
 const assetSha256=asset?createHash('sha256').update(readFileSync(new URL('..'+asset,import.meta.url))).digest('hex'):null;
 return {label,kind,asset,assetSha256,position:root.position.toArray().map(round),yaw:root.rotation.y,footprint:hull(points),bounds:{min:box.min.toArray().map(round),max:box.max.toArray().map(round)}};
});
const data={projection:'Orthographic X/Z. Same metres-per-pixel on both axes; -Z is up. Footprints are projected convex hulls of actual world-space model vertices, including roof overhangs.',features,routes:world.paths.map(p=>({a:p.edge.a,b:p.edge.b,requires:p.edge.requires,points:p.points})),walls:world.wallSegments,nature:world.nature.placements,nodes:NODES.map(({id,name,x,z})=>({id,name,x,z}))};
writeFileSync(new URL(`../map/${outputName}-layout.json`,import.meta.url),JSON.stringify(data,null,2)+'\n');
const scale=9,ox=448,oy=878,W=1240,H=rehearsal?1500:1900;
const X=x=>ox+x*scale,Y=z=>oy+z*scale;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const colors={'house':'#bdad91','empty-stall':'#ddcfa9','vegetable-stall':'#739b67','pottery-stall':'#779cac','tanner-stall':'#aa7651',pen:'#ac9877',shelter:'#c7a866',workbench:'#d1a35d',animal:'#ded7c1',prop:'#b4a185',well:'#749bab',gate:'#806344'};
const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#f7f4ec"/><style>text{font-family:Arial,sans-serif;fill:#353d36}.label{font-size:12px;font-weight:700;paint-order:stroke;stroke:#f7f4ec;stroke-width:4;stroke-linejoin:round}.small{font-size:13px;fill:#6b7266}.heading{font-size:18px;font-weight:700}</style><text x="64" y="54" font-size="29" font-weight="700">Shepherd Adventure</text><text x="64" y="83" font-size="17">${rehearsal?'Route rehearsal · ten-point village walk':'Settlement inventory · top-down map'}</text><text x="64" y="109" class="small">Actual model footprints and placements · equal scale on X and Z</text>`];
for(let x=-40;x<=40;x+=10)out.push(`<path d="M${X(x)} ${Y(-80)}V${Y(42)}" stroke="#e8e3d7"/><text x="${X(x)}" y="${Y(-80)-12}" text-anchor="middle" class="small">${x}</text>`);
for(let z=-80;z<=40;z+=10)out.push(`<path d="M${X(-40)} ${Y(z)}H${X(40)}" stroke="#e8e3d7"/><text x="${X(-40)-12}" y="${Y(z)+4}" text-anchor="end" class="small">${z}</text>`);
for(const p of data.nature.filter(p=>(!rehearsal||p.z<=52)&&(!p.outside||(p.z>45&&Math.abs(p.x)<20))))out.push(`<circle cx="${X(p.x)}" cy="${Y(p.z)}" r="${p.kind==='tree'?13:5}" fill="${p.kind==='tree'?'#b6c3a0':'#c7c6bd'}" opacity=".65"/>`);
for(const route of data.routes){const retired=['wick','oil'].includes(route.b);out.push(`<polyline points="${route.points.map(p=>`${X(p.x)},${Y(p.z)}`).join(' ')}" fill="none" stroke="${retired?'#cfc8b8':route.requires?'#b69b6a':'#d3bd90'}" stroke-width="${retired?3:7}" ${route.requires||retired?'stroke-dasharray="5 5"':''} stroke-linecap="round"/>`);}
for(const wall of data.walls)out.push(`<line x1="${X(wall.a.x)}" y1="${Y(wall.a.z)}" x2="${X(wall.b.x)}" y2="${Y(wall.b.z)}" stroke="#8b897a" stroke-width="${wall.width*scale}"/>`);
for(const f of features)out.push(`<polygon points="${f.footprint.map(([x,z])=>`${X(x)},${Y(z)}`).join(' ')}" fill="${colors[f.kind]}" stroke="#675e4e" stroke-width="1.2"/>`);
const labelOffsets={'Feeding trough':[-25,14],'Timber gate':[-14,21],'Lamp workbench':[0,20],'Stone well':[4,-18],'Animal pen':[16,39]};
for(const f of features){const b=f.bounds,cx=(b.min[0]+b.max[0])/2,cz=(b.min[2]+b.max[2])/2;const [dx,dy]=labelOffsets[f.label]||[0,4];out.push(`<text class="label" x="${X(cx)+dx}" y="${Y(cz)+dy}" text-anchor="middle">${escape(f.label)}</text>`);}
for(const n of data.nodes.filter(n=>!['wick','oil'].includes(n.id))){if(rehearsal){out.push(`<circle cx="${X(n.x)}" cy="${Y(n.z)}" r="11" fill="#246c68" stroke="#f7f4ec" stroke-width="2"/><text x="${X(n.x)}" y="${Y(n.z)+4}" text-anchor="middle" style="font-size:12px;fill:white">${data.nodes.indexOf(n)+1}</text>`);continue;}out.push(`<circle cx="${X(n.x)}" cy="${Y(n.z)}" r="3.5" fill="#fbf9f1" stroke="#6e715b"/>`);}
const notes=[['INVENTORY',`${features.filter(f=>f.kind==='house').length} houses`,`${features.filter(f=>['vegetable-stall','pottery-stall','tanner-stall'].includes(f.kind)).length} stocked stalls · vegetables, pottery, tanner`,'2 empty stalls','2 animal pens + feeding trough','1 lamp workbench','1 stone well','2 timber gates · village and animal area','1 Nativity shelter'],['READING THE MAP','Solid tan lines: authored routes','Dashed tan: discovery / gate routes','Fine gray dashes: retired supply lanes','Dots: journey stopping points','Green circles: existing trees','Gray walls: perimeter and screens'],['OPEN SPACE','The northwest animal area is enclosed.','A curved path reaches the isolated Nativity.','House numbers identify instances;','they do not imply assigned inhabitants.'],['SCALE & ORIENTATION','9 pixels = 1 game metre on both axes.','Building outlines include roof overhangs.','Village gate closed; animal gate open.','Up is game −Z; right is +X.','This is an inventory plan, not terrain art.']];
if(rehearsal)notes.splice(0,notes.length,
 ['REHEARSAL POINTS',...STOPS.map(s=>`${String(s.number).padStart(2,'0')} · ${s.title}`)],
 ['READING THE MAP','Tan line: sampled walking corridor','Numbers: ten placeholder stopping points','Gray walls: existing perimeter and screens','Tree circles: current rehearsal dressing'],
 ['STRUCTURES','Visited houses face their knocking stops;','retain their accepted centres.','Gate shown closed; opens after point 08.','Doorway and scene performance pending.'],
 ['SCALE & ORIENTATION','9 pixels = 1 game metre on both axes.','Up is game −Z; right is +X.','This is a rehearsal plan, not terrain art.']);
let ty=180;
for(const [title,...lines] of notes){out.push(`<text x="850" y="${ty}" class="heading">${escape(title)}</text>`);ty+=30;for(const line of lines){out.push(`<text x="850" y="${ty}" class="small">${escape(line)}</text>`);ty+=23;}ty+=32;}
out.push(`<path d="M860 1170h90m-90 -6v12m90 -12v12" stroke="#353d36" stroke-width="2"/><text x="905" y="1196" text-anchor="middle" class="small">10 m</text><path d="M1090 1190v-55m-6 9l6 -9l6 9" stroke="#353d36" fill="none" stroke-width="2"/><text x="1090" y="1212" text-anchor="middle" class="small">−Z</text><text x="${X(0)+12}" y="${Y(rehearsal?50:52)+5}" class="small">Player control begins</text><text x="64" y="${H-32}" class="small">Regenerate with node checks/generate-settlement-map.mjs${rehearsal?' --rehearsal':''} after changing routes or placements.</text></svg>`);
writeFileSync(new URL(`../map/${outputName}-map.svg`,import.meta.url),out.join('\n'));
console.log(`Wrote settlement map and layout: ${features.length} labeled features.`);
