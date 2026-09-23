// Continuous decorative-wall versus transformed-structure checks shared by
// the canonical and rehearsal layout verifiers.
const STRUCTURE_KINDS=new Set(['house','annex','empty-stall','pen','vegetable-stall','pottery-stall','tanner-stall']);
const REPAIRED_WALL_PATHS=new Set([2,5]);
const HOST_JOIN_LENGTH=1;
const EPSILON=1e-7;

function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function convexHull(points){
 const sorted=[...new Map(points.map(point=>[point.join(','),point])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const half=items=>{const result=[];for(const point of items){while(result.length>1&&cross(result.at(-2),result.at(-1),point)<=0)result.pop();result.push(point);}return result;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
function orientation(a,b,c){return (b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);}
function pointSegmentDistance(point,a,b){const dx=b.x-a.x,dz=b.z-a.z,lengthSquared=dx*dx+dz*dz,t=lengthSquared?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/lengthSquared)):0;return Math.hypot(point.x-a.x-t*dx,point.z-a.z-t*dz);}
function segmentSegmentDistance(a,b,c,d){
 const [o1,o2,o3,o4]=[orientation(a,b,c),orientation(a,b,d),orientation(c,d,a),orientation(c,d,b)];
 const onSegment=(p,q,r)=>q.x>=Math.min(p.x,r.x)-EPSILON&&q.x<=Math.max(p.x,r.x)+EPSILON&&q.z>=Math.min(p.z,r.z)-EPSILON&&q.z<=Math.max(p.z,r.z)+EPSILON;
 if((o1>0&&o2<0||o1<0&&o2>0)&&(o3>0&&o4<0||o3<0&&o4>0))return 0;
 if(Math.abs(o1)<EPSILON&&onSegment(a,c,b)||Math.abs(o2)<EPSILON&&onSegment(a,d,b)||Math.abs(o3)<EPSILON&&onSegment(c,a,d)||Math.abs(o4)<EPSILON&&onSegment(c,b,d))return 0;
 return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
}
function pointInConvexHull(point,hull){
 let sign=0;
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],value=(b[0]-a[0])*(point.z-a[1])-(b[1]-a[1])*(point.x-a[0]);
  if(Math.abs(value)<EPSILON)continue;
  const next=Math.sign(value);if(sign&&next!==sign)return false;sign=next;
 }
 return true;
}
export function segmentFootprintDistance(a,b,footprint){
 if(pointInConvexHull(a,footprint)||pointInConvexHull(b,footprint))return 0;
 let distance=Infinity;
 for(let i=0;i<footprint.length;i++){
  const c=footprint[i],d=footprint[(i+1)%footprint.length];
  distance=Math.min(distance,segmentSegmentDistance(a,b,{x:c[0],z:c[1]},{x:d[0],z:d[1]}));
 }
 return distance;
}
function transformedFootprint(root,THREE){
 const points=[],vertex=new THREE.Vector3();root.updateMatrixWorld(true);
 root.traverse(object=>{
  if(!object.isMesh||!object.geometry?.attributes?.position)return;
  const positions=object.geometry.attributes.position;
  for(let index=0;index<positions.count;index++){
   vertex.fromBufferAttribute(positions,index);
   if(object.isSkinnedMesh)object.applyBoneTransform(index,vertex);
   vertex.applyMatrix4(object.matrixWorld);points.push([vertex.x,vertex.z]);
  }
 });
 if(points.length<3)throw Error(`${root.name||'structure'} has no transformed footprint vertices`);
 return convexHull(points);
}
function structureFootprints(world,THREE){
 return world.settlementFeatures.filter(feature=>STRUCTURE_KINDS.has(feature.kind)).map(feature=>({label:feature.label,kind:feature.kind,footprint:transformedFootprint(feature.root,THREE)}));
}
function pointAlong(a,b,distance){const length=Math.hypot(b.x-a.x,b.z-a.z);if(!length)return {...a};const t=Math.min(1,distance/length);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}
function hostJoinAllowed(wall,feature,footprint,radius){
 const length=Math.hypot(wall.b.x-wall.a.x,wall.b.z-wall.a.z);if(!length)return false;
 if(wall.startHost===feature.label){
  const exit=pointAlong(wall.a,wall.b,HOST_JOIN_LENGTH);
  return segmentFootprintDistance(exit,wall.b,footprint)>=radius-EPSILON;
 }
 if(wall.endHost===feature.label){
  const entry=pointAlong(wall.b,wall.a,HOST_JOIN_LENGTH);
  return segmentFootprintDistance(wall.a,entry,footprint)>=radius-EPSILON;
 }
 return false;
}
function minimumCaseClearance(walls,feature,radius){return Math.min(...walls.map(wall=>segmentFootprintDistance(wall.a,wall.b,feature.footprint)-radius));}

const REPORTED_CASES=[
 {pathIndex:2,feature:'House 1 annex',label:'House 1 annex clearance'},
 {pathIndex:2,feature:'House 1',label:'House 1 host join'},
 {pathIndex:5,feature:'House 8',label:'House 8 clearance'},
 {pathIndex:5,feature:'House 8 annex',label:'House 8 annex host join'}
];

export function verifyDecorativeWallStructureClearance(world,THREE,layout){
 // This is deliberately limited to the two reviewed runs. It protects the
 // repair without turning the check into an unrelated all-wall audit.
 const structures=structureFootprints(world,THREE),walls=world.wallSegments.filter(wall=>wall.kind==='decoration-wall'&&REPAIRED_WALL_PATHS.has(wall.pathIndex)),violations=[],hostJoinExceptions=[];
 let minimumClearance=Infinity;
 for(const wall of walls){
  const radius=wall.width/2;
  for(const feature of structures){
   const clearance=segmentFootprintDistance(wall.a,wall.b,feature.footprint)-radius;
   if(clearance<minimumClearance)minimumClearance=clearance;
   if(clearance>=-EPSILON)continue;
   if(hostJoinAllowed(wall,feature,feature.footprint,radius)){hostJoinExceptions.push({pathIndex:wall.pathIndex,feature:feature.label,segment:{a:wall.a,b:wall.b},clearance});continue;}
   violations.push({pathIndex:wall.pathIndex,feature:feature.label,segment:{a:wall.a,b:wall.b},clearance,startHost:wall.startHost??null,endHost:wall.endHost??null});
  }
 }
 const reported=REPORTED_CASES.map(test=>{
  const candidates=walls.filter(wall=>wall.pathIndex===test.pathIndex),feature=structures.find(item=>item.label===test.feature);
  if(!candidates.length)throw Error(`${layout}: missing decorative wall path ${test.pathIndex} for ${test.label}`);
  if(!feature)throw Error(`${layout}: missing structure ${test.feature} for ${test.label}`);
  return {...test,minimumClearance:minimumCaseClearance(candidates,feature,candidates[0].width/2)};
 });
 if(violations.length)throw Error(`${layout}: decorative wall intersects transformed structure footprint: ${JSON.stringify(violations)}`);
 const nonHostClearances=walls.flatMap(wall=>structures.map(feature=>({wall,feature,clearance:segmentFootprintDistance(wall.a,wall.b,feature.footprint)-wall.width/2}))).filter(({wall,feature,clearance})=>!(clearance<-EPSILON&&hostJoinAllowed(wall,feature,feature.footprint,wall.width/2))).map(({clearance})=>clearance);
 const minimumNonHostClearance=Math.min(...nonHostClearances);
 return {layout,wallPaths:[...REPAIRED_WALL_PATHS],wallSegments:walls.length,structureFootprints:structures.map(({label,kind,footprint})=>({label,kind,vertices:footprint.length})),minimumClearance,minimumNonHostClearance,reported,hostJoinExceptions};
}
