import {mountNativityLantern} from './nativity-lantern-mount.mjs';
import {addHouseAnnexes} from './house-annexes.mjs';
import {HOUSE_YAWS} from './village-layout.mjs';
import {NATIVITY,createNativityShelter,dressNativity} from './journey-nativity.mjs';
import {WORKBENCH_URL,WORKBENCH_BEARING,addWorkbenchParts} from './lamp-workbench-model.mjs';
import {addVillageNature} from './journey-nature.mjs';
import {addVillageWalls,VILLAGE_BOUNDS} from './journey-boundaries.mjs';
import {LANTERN_URL,CARRIED_LANTERN_HEIGHT,SETTLEMENT_LANTERN_HEIGHT,fitLantern,setLanternLit} from './journey-lantern.mjs';
import {terrainSurface,sampleRibbon} from './journey-presentation.mjs';
import {obstructionTarget} from './journey-camera.mjs';
import {loadJourneyPOIModels} from './journey-poi-models.mjs';
import {addHouseDecorations} from './house-decorations.mjs';
import * as THREE from 'three';
import {NODES,NODE,EDGES,lanePoints,openingPath} from './journey-model.mjs';

function random(seed=914){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
import {height} from './journey-terrain.mjs';
export {height} from './journey-terrain.mjs';
const paths=[...EDGES.map(e=>({edge:e,points:lanePoints(e)})),{edge:{id:'opening-approach',a:'field',b:'field'},points:openingPath}];
function distanceToSegment(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
function pathDistance(x,z){let d=1e4;for(const path of paths)for(let i=1;i<path.points.length;i++)d=Math.min(d,distanceToSegment(x,z,path.points[i-1],path.points[i]));return d;}
function dirtTexture(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),r=random(876),img=ctx.createImageData(512,512);
 for(let i=0;i<img.data.length;i+=4){const v=185+r()*60;img.data[i]=v;img.data[i+1]=v*.96;img.data[i+2]=v*.90;img.data[i+3]=255;}ctx.putImageData(img,0,0);
 for(let i=0;i<6500;i++){const x=r()*512,y=r()*512,s=.2+r()*2.1;ctx.fillStyle=r()>.5?'#a69a7960':'#392f2580';ctx.beginPath();ctx.ellipse(x,y,s,s*.5,r()*6,0,Math.PI*2);ctx.fill();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(40,40);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#fff6d5');g.addColorStop(.08,'#ffe5abdd');g.addColorStop(.23,'#efba6170');g.addColorStop(1,'#df9d3200');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function createJourneyWorld(scene,{routePaths=null,houseApproaches={}}={}){
 // Old paths define the accepted settlement placement and gate anchors.
 // New story routes only change walkable dressing/ribbons, never move buildings.
 const activePaths=routePaths??paths;
 function walkDistance(x,z){if(!routePaths)return pathDistance(x,z);let d=1e4;for(const path of activePaths)for(let i=1;i<path.points.length;i++)d=Math.min(d,distanceToSegment(x,z,path.points[i-1],path.points[i]));return d;}
 const settlementFeatures=[];
 function recordFeature(root,label,kind,asset=null){root.name=label;settlementFeatures.push({root,label,kind,asset});}
 const fading=[],occlusionBounds=[];
 function watchOcclusion(root,kind,moving=false){
  root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;
  const bounds={min:{x:b.min.x,y:b.min.y,z:b.min.z},max:{x:b.max.x,y:b.max.y,z:b.max.z},kind};
  const meshes=[];root.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();meshes.push({mesh:o,casts:o.castShadow,materials:(Array.isArray(o.material)?o.material:[o.material]).map(m=>({m,opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite}))});}});
  fading.push({root,bounds,meshes,opacity:1,moving});occlusionBounds.push(bounds);
 }
 function updateOcclusion(camera,player,dt,inspecting=false){
  const eye=camera.position,ground=height(player.x,player.z);let faded=0;
  for(const item of fading){
   if(item.moving){item.root.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(item.root);Object.assign(item.bounds.min,b.min);Object.assign(item.bounds.max,b.max);}
   const target=obstructionTarget(eye,{x:player.x,y:ground,z:player.z},item.bounds,inspecting);item.opacity+=(target-item.opacity)*(1-Math.exp(-(target<item.opacity?14:3)*dt));
   if(item.opacity<.98)faded++;
   for(const {mesh,casts,materials} of item.meshes){mesh.castShadow=casts&&item.opacity>.85;for(const {m,opacity,transparent,depthWrite} of materials){const translucent=item.opacity<.995;if(m.transparent!==(transparent||translucent)){m.transparent=transparent||translucent;m.needsUpdate=true;}m.opacity=opacity*item.opacity;m.depthWrite=depthWrite&&!translucent;}}
  }return faded;
 }

 const rng=random(),terrain=new THREE.PlaneGeometry(220,240,240,260);terrain.rotateX(-Math.PI/2);terrain.translate(0,0,-20);
 const pos=terrain.attributes.position,colors=new Float32Array(pos.count*3),dirt=new THREE.Color('#a49474'),grass=new THREE.Color('#555b42'),rock=new THREE.Color('#555550');
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),d=walkDistance(x,z),h=height(x,z);pos.setY(i,h+(pathDistance(x,z)>3?Math.sin(x*.32)*Math.sin(z*.27)*.14:0));
  const color=grass.clone().lerp(dirt,1-THREE.MathUtils.smoothstep(d,1.1,3.4));color.lerp(rock,Math.max(0,Math.sin(x*.21+z*.15))*.18).multiplyScalar(.78+rng()*.38);color.toArray(colors,i*3);
 }
 terrain.setAttribute('color',new THREE.BufferAttribute(colors,3));terrain.computeVertexNormals();const tex=dirtTexture();
 const ground=new THREE.Mesh(terrain,new THREE.MeshStandardMaterial({map:tex,vertexColors:true,roughness:1,bumpMap:tex,bumpScale:.1}));ground.receiveShadow=true;scene.add(ground);
 // Distant land masses keep an actual horizon beyond the settlement.
 const hillMat=new THREE.MeshBasicMaterial({color:'#020409'});
 for(let i=0;i<17;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(1,14,7),hillMat);m.scale.set(18+rng()*30,6+rng()*11,15+rng()*23);m.name='distant-horizon-hill';m.position.set(-130+i*17,-3,-120-m.scale.z-rng()*20);scene.add(m);}
 // Low grass remains procedural; all trees and rocks use licensed model assets.
 const dummy=new THREE.Object3D();let placed=0;
 const blade=new THREE.ConeGeometry(.1,.65,3),tufts=new THREE.InstancedMesh(blade,new THREE.MeshStandardMaterial({color:'#696445',roughness:1,flatShading:true}),4000);placed=0;
 for(let i=0;i<15000&&placed<4000;i++){const x=(rng()-.5)*120,z=rng()*140-80;if(walkDistance(x,z)<2.1||(Math.abs(x-NATIVITY.x)<NATIVITY.depth/2+.4&&Math.abs(z-NATIVITY.z)<NATIVITY.width/2+.4))continue;const s=.25+rng()*.8;dummy.position.set(x,height(x,z)+s*.28,z);dummy.scale.set(s,s,s);dummy.rotation.set(.2,rng()*6,.3);dummy.updateMatrix();tufts.setMatrixAt(placed++,dummy.matrix);}tufts.count=placed;scene.add(tufts);
 const bark=new THREE.MeshStandardMaterial({color:'#453e31',roughness:1});
 // Sparse sky stars; no destination beacon reveals the solution.
 const stars=[];for(let i=0;i<900;i++){const theta=rng()*Math.PI*2,v=.08+rng()*.9;stars.push(Math.cos(theta)*Math.sqrt(1-v*v)*210,v*210,Math.sin(theta)*Math.sqrt(1-v*v)*210);}
 const sky=new THREE.BufferGeometry();sky.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(sky,new THREE.PointsMaterial({color:'#bed3e8',size:.29,transparent:true,opacity:.8,sizeAttenuation:true,fog:false})));
 const glow=glowTexture(),lamps=[],flames=[],lanternMounts=[];
 function lampVisual(size){
  const root=new THREE.Group();root.name='lantern-fixture';
  const core=new THREE.Mesh(new THREE.SphereGeometry(size*.065,8,6),new THREE.MeshBasicMaterial({color:'#fff1bb',toneMapped:false}));core.name='lantern-flame';core.scale.y=1.8;core.position.y=-size*.08;root.add(core);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.62,toneMapped:false}));halo.name='lantern-halo';halo.position.copy(core.position);halo.scale.setScalar(size*2.4);root.add(halo);flames.push(halo);
  lanternMounts.push({root,size});return {root,halo,core};
 }
 function lightAt(x,z,y=1.8,intensity=20,enabled=true){
  const visual=lampVisual(SETTLEMENT_LANTERN_HEIGHT);visual.root.position.set(x,height(x,z)+y,z);scene.add(visual.root);
  const light=new THREE.PointLight('#ffc170',intensity*2.2,18,2);light.position.copy(visual.root.position);if(enabled)scene.add(light);
  const source={x,z,y:visual.root.position.y,intensity:intensity*2.2,enabled,light};visual.core.visible=enabled;visual.halo.visible=enabled;visual.root.userData.unlit=!enabled;lamps.push(source);return {source,...visual};
 }
 for(const n of NODES.filter(n=>n.fire&&(!routePaths||n.id==='hearth'))){
  if(n.id==='hearth'){lightAt(n.x+1.45,n.z+.82,1.38,3.2);continue;}
  lightAt(n.x+1.5,n.z,1.25,25);const stand=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,1.3,6),bark);stand.position.set(n.x+1.5,height(n.x+1.5,n.z)+.6,n.z);scene.add(stand);
 }
 const routeGroup=new THREE.Group();scene.add(routeGroup);const routes=[];
 for(const path of activePaths){
  const ribbon=sampleRibbon(path.points,.32,(x,z)=>terrainSurface(pos,x,z));
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(ribbon.positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(ribbon.uvs,2));geometry.setIndex(ribbon.indices);
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,uniforms:{emphasis:{value:1},time:{value:0},reverse:{value:false},still:{value:false}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec2 vUv;uniform float time;uniform float emphasis;uniform bool reverse;uniform bool still;void main(){float along=reverse?1.-vUv.x:vUv.x;float phase=mod(time*.24,1.28)-.14;float tail=phase-along;float pulse=still?0.:smoothstep(-.025,0.,tail)*(1.-smoothstep(0.,.19,tail));float edge=abs(vUv.y-.5)*2.;float core=1.-smoothstep(.25,.55,edge);float halo=1.-smoothstep(.15,1.,edge);vec3 color=mix(vec3(.65,.39,.12),vec3(1.,.89,.52),pulse);gl_FragColor=vec4(color,(halo*(.18+.4*pulse)+core*(.4+.2*pulse))*emphasis);}`});
  const line=new THREE.Mesh(geometry,mat);line.renderOrder=2;routeGroup.add(line);routes.push({edge:path.edge,line});
 }
 const markers=[];
 for(const n of NODES){const m=new THREE.Mesh(new THREE.RingGeometry(n.fire?.7:.5,n.fire?.85:.61,40),new THREE.MeshBasicMaterial({color:n.fire?'#e5c07a':'#9bb9c8',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(n.x,height(n.x,n.z)+.10,n.z);scene.add(m);markers.push({node:n,mesh:m});}
 let nativityLife=null;
 const shelter=createNativityShelter(scene,recordFeature);
 const timber=new THREE.MeshStandardMaterial({color:'#65503a',roughness:1}),straw=new THREE.MeshStandardMaterial({color:'#766248',roughness:1});
 function box(parent,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const nativityLamp=lightAt(NATIVITY.x,NATIVITY.z,2.3,14);
 // Environmental clues are represented in the scene, not solely in a text reward.
 const clueTargets={};
 function target(id,x,y,z){clueTargets[id]={x,y:height(x,z)+y,z};}
 const stone=new THREE.MeshStandardMaterial({color:'#786c57',roughness:1});
 // Set the masonry beside the junction; the old blockout intersected the ridge lane.
 const well=new THREE.Group();well.name='journey-well';const wellX=NODE.well.x+1.2,wellZ=NODE.well.z-2.8;well.position.set(wellX,height(wellX,wellZ),wellZ);scene.add(well);
 box(well,.07,1.5,.07,1.28,.75,0,timber);
 const water=new THREE.Mesh(new THREE.CircleGeometry(.68,32),new THREE.MeshStandardMaterial({color:'#0b1720',roughness:.35}));water.name='well-water';water.rotation.x=-Math.PI/2;water.position.y=.22;well.add(water);
 target('well',well.position.x,.6,well.position.z);if(!routePaths)lightAt(well.position.x+1.28,well.position.z,1.5,16);
 const mud=new THREE.MeshStandardMaterial({color:'#33281e',roughness:1});
 for(const id of ['well','square']){const n=NODE[id];for(let i=0;i<7;i++)for(const side of [-1,1]){const track=new THREE.Mesh(new THREE.SphereGeometry(.07,5,3),mud);track.scale.set(1,.12,1.3);track.position.set(n.x+.6+side*.11+i*.11,height(n.x+.6+side*.11+i*.11,n.z-i*.38)+.015,n.z-i*.38);scene.add(track);}target(id==='square'?'square':'well',n.x+1.1,.25,n.z-1);}
 target('pen',NODE.pen.x+1.8,.8,NODE.pen.z);
 const gatePath=paths.find(p=>p.edge.requires==='gate').points;const gp=gatePath[6],gn=gatePath[7];
 const gate=new THREE.Group();gate.name='journey-gate';gate.position.set(gp.x,height(gp.x,gp.z),gp.z);gate.rotation.y=Math.atan2(gn.x-gp.x,gn.z-gp.z);scene.add(gate);
 for(const x of [-1.55,1.55])box(gate,.18,2.1,.18,x,1.05,0,timber);
 const gateLeaf=new THREE.Group();gateLeaf.name='journey-gate-hinge';gateLeaf.position.x=-1.5;gate.add(gateLeaf);
 target('market',gp.x,1.2,gp.z);target('arch',gp.x,1.2,gp.z);
 const gateLampX=gp.x+Math.cos(gate.rotation.y)*1.55,gateLampZ=gp.z-Math.sin(gate.rotation.y)*1.55;const gateLamp=lightAt(gateLampX,gateLampZ,2.25,routePaths?6:18,!routePaths);gateLamp.root.name='gate-lantern';
 target('lookout',-2.5,1,-19);target('olive',-23,2,3);target('ridge',18,2,-25);target('gate',0,1.5,15);target('field',1.5,1.2,36);target('goal',NATIVITY.x+1,1,NATIVITY.z);
 // One sheltered workbench holds all three components.
 const workbenches=[],benchItems=[];
 for(const id of ['hearth']){
  const n=NODE[id],g=new THREE.Group();g.position.set(n.x+1.5,height(n.x+1.5,n.z),n.z);scene.add(g);
  g.rotation.y=WORKBENCH_BEARING;
  workbenches.push(g);
  recordFeature(g,'Lamp workbench','workbench',WORKBENCH_URL);
  const empty=lampVisual(CARRIED_LANTERN_HEIGHT);empty.root.name='hearth-lantern';empty.root.position.y=.725+CARRIED_LANTERN_HEIGHT/2;empty.core.visible=false;empty.halo.visible=false;g.add(empty.root);
  const light=new THREE.PointLight('#ffcd83',0,6,2);empty.root.add(light);g.userData.lampVisual=empty;g.userData.lampLight=light;
  target(id,g.position.x,.9,g.position.z);
 }

 // Shared Tripo body, with the flame and real illumination controlled separately.
 const carriedVisual=lampVisual(CARRIED_LANTERN_HEIGHT),lantern=carriedVisual.root;lantern.name='carried-lantern';scene.add(lantern);
 const carried=new THREE.PointLight('#ffcd83',20,12,2);lantern.add(carried);
 let modelCount=0,wallSegments=[],nature=null;const fits=[],occluders=[];
 const samples=paths.flatMap(path=>path.points.slice(1).flatMap((b,i)=>Array.from({length:9},(_,k)=>({x:path.points[i].x+(b.x-path.points[i].x)*k/8,z:path.points[i].z+(b.z-path.points[i].z)*k/8}))));
 function clearance(rect){return Math.min(...samples.map(p=>Math.hypot(Math.max(rect[0]-p.x,0,p.x-rect[2]),Math.max(rect[1]-p.z,0,p.z-rect[3]))));}
 function placeSafely(outer,x,z,stall=false){
  outer.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(outer),size=bounds.getSize(new THREE.Vector3());
  const candidates=[];for(let ix=-16;ix<=16;ix++)for(let iz=-16;iz<=16;iz++)candidates.push({x:x+ix*.5,z:z+iz*.5,d:ix*ix+iz*iz});candidates.sort((a,b)=>a.d-b.d);
  for(const c of candidates){const rect=[c.x-size.x/2,c.z-size.z/2,c.x+size.x/2,c.z+size.z/2];
   if(stall){
    const b=VILLAGE_BOUNDS;
    if(rect[0]<b.minX+6||rect[2]>b.maxX-6||rect[1]<b.minZ+6||rect[3]>b.maxZ-6)continue;
    if([well,gate,shelter,...workbenches].some(root=>{const b=new THREE.Box3().setFromObject(root);return rect[0]<b.max.x+.6&&rect[2]>b.min.x-.6&&rect[1]<b.max.z+.6&&rect[3]>b.min.z-.6;}))continue;
   }
   if(clearance(rect)<.85||fits.some(f=>rect[0]<f.rect[2]+.5&&rect[2]>f.rect[0]-.5&&rect[1]<f.rect[3]+.5&&rect[3]>f.rect[1]-.5))continue;
   outer.position.set(c.x,height(c.x,c.z)-.05,c.z);fits.push({rect,clearance:clearance(rect)});return c;
  }throw new Error('No clear scenery placement near '+x+','+z);
 }
 async function dress(loader){
  nativityLife=await dressNativity(loader,scene,shelter,recordFeature,watchOcclusion);modelCount+=14;mountNativityLantern(shelter,nativityLamp,SETTLEMENT_LANTERN_HEIGHT);
  const jarSource=(await loader.loadAsync('/assets/oil-jar-pixal3d.glb')).scene;
  const benchSource=(await loader.loadAsync(WORKBENCH_URL)).scene;
  for(const bench of workbenches){
   const parts=addWorkbenchParts(bench,benchSource.clone(true));
   const jar=jarSource.clone(true);jar.name='workbench-oil-jar';jar.position.set(.55,parts.topAt(.55,-.15),-.15);jar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});bench.add(jar);
   const visual=bench.userData.lampVisual;visual.root.position.set(0,parts.topAt(0,0)+CARRIED_LANTERN_HEIGHT/2,0);
   benchItems.push({...parts,jar,visual,light:bench.userData.lampLight});watchOcclusion(bench,'prop');modelCount+=2;
  }
  const lanternSource=(await loader.loadAsync(LANTERN_URL)).scene;
  const poi=await loadJourneyPOIModels(loader);well.add(poi.well);poi.gate.position.x=1.5;gateLeaf.add(poi.gate);
  settlementFeatures.push({root:well,label:'Stone well',kind:'well'},{root:gate,label:'Timber gate',kind:'gate'});
  watchOcclusion(well,'prop');watchOcclusion(gateLeaf,'gate-leaf',true);modelCount+=2;
  const specs=[
   {label:'House',kind:'house',url:'/assets/house-01-tripo-v2.glb',height:4.3,items:[[-8,19,.3],[10,18,-.3],[-10,0,.2],[5,1,-.35],[22,8,-.1],[-25,-8,.3],[-9,-15,-.2],[10,-17,.4],[-18,-29,.1],[5,-30,-.3],[22,-35,.2]]},
   {label:'Empty stall',kind:'empty-stall',url:'/assets/market-stall-tripo-v2.glb',height:3.1,items:[[-21,-16,.1],[-1,-5,Math.PI]]},
   {label:'Animal pen',kind:'pen',url:'/assets/animal-pen-tripo-v2.glb',height:2.1,items:[[25,-26,.1]]},
   // Stall item angles specify the open-front bearing; source geometry is off-axis.
   // Local front offsets measured from roofless top-down runtime-model renders.
   {label:'Vegetables',kind:'vegetable-stall',url:'/assets/vegetable-market-stall-pixal3d.glb',height:2.8,items:[[-29,1.5,106*Math.PI/180],[31,-9,-86*Math.PI/180]],frontYaw:-25*Math.PI/180,stall:true},
   {label:'Pottery',kind:'pottery-stall',url:'/assets/pottery-market-stall-pixal3d.glb',height:2.8,items:[[-21.5,7.5,126*Math.PI/180],[31,-2.5,-101*Math.PI/180]],frontYaw:-28*Math.PI/180,stall:true},
   {label:'Tanner',kind:'tanner-stall',url:'/assets/tanner-market-stall-pixal3d.glb',height:2.8,items:[[28,-16,-75*Math.PI/180]],frontYaw:-33*Math.PI/180,stall:true}
  ];
  for(const spec of specs){const gltf=await loader.loadAsync(spec.url);const source=gltf.scene;const b=new THREE.Box3().setFromObject(source),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
   for(const [index,[x,z,rot]] of spec.items.entries()){const outer=new THREE.Group(),m=source.clone(true),s=Math.min(spec.height/size.y,6/Math.max(size.x,size.z));m.scale.setScalar(s);m.position.set(-center.x*s,-b.min.y*s,-center.z*s);outer.add(m);outer.rotation.y=rot-(spec.frontYaw||0);outer.position.set(x,height(x,z),z);outer.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const placed=placeSafely(outer,x,z,spec.stall);// Keep the established centre; only turn the visited house toward its stop.
    // The house asset's door facade faces local +X (verified in arrival renders).
    const approach=spec.kind==='house'?houseApproaches[index+1]:null;
    if(spec.kind==='house'&&HOUSE_YAWS[index+1]!==undefined)outer.rotation.y=HOUSE_YAWS[index+1];
    if(approach)outer.rotation.y=Math.atan2(-(approach.z-placed.z),approach.x-placed.x);
    scene.add(outer);outer.updateMatrixWorld(true);const collisionBounds=new THREE.Box3().setFromObject(outer);occluders.push({min:{x:collisionBounds.min.x,y:collisionBounds.min.y,z:collisionBounds.min.z},max:{x:collisionBounds.max.x,y:collisionBounds.max.y,z:collisionBounds.max.z}});modelCount++;watchOcclusion(outer,'structure');
    recordFeature(outer,spec.label+(spec.items.length>1?' '+(index+1):''),spec.kind,spec.url);
    if(spec.url.includes('house')&&(!routePaths||[3,8,9].includes(index+1)))lightAt(placed.x+.8,placed.z+2,1.6,22);
   }
  }
  modelCount+=await addHouseAnnexes(loader,scene,settlementFeatures,(x,z)=>terrainSurface(pos,x,z),recordFeature,watchOcclusion,occluders);
  modelCount+=await addHouseDecorations(loader,scene,settlementFeatures,(x,z)=>terrainSurface(pos,x,z),recordFeature,watchOcclusion);
  // Existing procedural grass must not poke through the new pots and stonework.
  const dressingBounds=settlementFeatures.filter(f=>f.root.userData.decoration||f.root.userData.annex).map(f=>new THREE.Box3().setFromObject(f.root).expandByScalar(.12));
  const grassMatrix=new THREE.Matrix4(),grassPosition=new THREE.Vector3();
  for(let i=0;i<tufts.count;i++){tufts.getMatrixAt(i,grassMatrix);grassPosition.setFromMatrixPosition(grassMatrix);if(dressingBounds.some(b=>grassPosition.x>=b.min.x&&grassPosition.x<=b.max.x&&grassPosition.z>=b.min.z&&grassPosition.z<=b.max.z)){grassMatrix.scale(new THREE.Vector3(0,0,0));tufts.setMatrixAt(i,grassMatrix);}}
  tufts.instanceMatrix.needsUpdate=true;
  const wallSource=(await loader.loadAsync('/assets/low-wall-perimeter.glb')).scene;
  const stall=settlementFeatures.find(f=>f.label==='Empty stall 1')?.root;
  const stallJoin=routePaths&&stall?stall.localToWorld(new THREE.Vector3(2,0,2.4)):null;
  wallSegments=addVillageWalls(wallSource,scene,{x:gp.x,z:gp.z,yaw:gate.rotation.y,stallJoin},watchOcclusion,occluders,(x,z)=>terrainSurface(pos,x,z),settlementFeatures);
  nature=await addVillageNature(loader,scene,fits,walkDistance,watchOcclusion);
  for(const {root,size} of lanternMounts){const body=fitLantern(lanternSource,size);root.add(body);setLanternLit(body,!root.userData.unlit&&root.name!=='hearth-lantern'&&root.name!=='gate-lantern');}
 }
 return {dress,terrain,audioEnvironment(){return {lights:lamps.filter(l=>l.enabled),well:well.position,houses:settlementFeatures.filter(f=>/^House (3|8|9)$/.test(f.label)).map(f=>({id:Number(f.label.split(' ')[1]),x:f.root.position.x,z:f.root.position.z}))};},updateNativity(dt,reduced=false){nativityLife?.update(dt,reduced);},paths:activePaths,markers,fits,occluders,settlementFeatures,get wallSegments(){return wallSegments;},get nature(){return nature;},occlusionBounds,updateOcclusion,clueTargets,get modelCount(){return modelCount;},get lanternCount(){return lanternMounts.length;},lampState(){return {carriedVisible:lantern.visible,carriedPosition:lantern.position.toArray(),benches:benchItems.map(i=>({lampVisible:i.visual.root.visible,lit:i.visual.core.visible,wickVisible:i.wick.visible,flintVisible:i.flint.visible}))};},update(dt,time,journey,heading=Math.PI,reduced=false,carryPosition=null){
  nativityLife?.update(dt,reduced);
  const p=journey.position,selected=journey.choice;gateLeaf.rotation.y+=((journey.gateOpen?-Math.PI*.48:0)-gateLeaf.rotation.y)*(1-Math.exp(-3*dt));const gateLit=routePaths?!!journey.gateLit:journey.gateOpen;if(gateLit&&!gateLamp.source.light.parent)scene.add(gateLamp.source.light);gateLamp.source.enabled=gateLit;gateLamp.halo.visible=gateLit;gateLamp.core.visible=gateLit;setLanternLit(gateLamp.root,gateLit);
  lamps.forEach(source=>{source.light.intensity=source.enabled?source.intensity:0;});
  for(const item of benchItems){
   const assembly=journey.lampAssembly,lit=!!assembly?.lit&&!assembly?.taken;
   item.visual.root.visible=!journey.lantern;item.visual.core.visible=lit;item.visual.halo.visible=lit;setLanternLit(item.visual.root,lit);item.light.intensity=lit?2:0;
   item.wick.visible=!assembly||assembly.step<2;item.flint.visible=!assembly||assembly.step<4;
  }
  lantern.visible=journey.lantern;
  lantern.position.set(p.x+Math.sin(heading)*.95+Math.cos(heading)*.35,height(p.x,p.z)+(1.05+(journey.gateSequence?.stage==='light'?Math.sin(Math.PI*Math.min(3,journey.gateSequence.elapsed)/3)*.9:0))+(reduced?0:Math.sin(time*2.4)*.045),p.z+Math.cos(heading)*.95-Math.sin(heading)*.35);
  if(carryPosition)lantern.position.copy(carryPosition).add(new THREE.Vector3(0,-CARRIED_LANTERN_HEIGHT/2,0));
  lantern.rotation.y=heading;carried.intensity=journey.lantern?(routePaths?6:20):0;
  routes.forEach(({edge,line})=>{const active=!routePaths&&journey.phase==='choice'&&journey.options.some(option=>option.id===edge.id);const reveal=journey.phase==='inspect'&&((journey.at==='lookout'&&edge.requires==='overlook')||(journey.at==='pen'&&edge.requires==='rear'));line.visible=active||reveal;line.material.uniforms.emphasis.value=edge.id===selected?.id||reveal?1:.32;line.material.uniforms.time.value=time;line.material.uniforms.reverse.value=edge.b===journey.at;line.material.uniforms.still.value=reduced;});
  markers.forEach(({node,mesh})=>{mesh.visible=false;});
  flames.forEach(f=>f.material.opacity=.62);
 }};
}
