// Hermite interpolation with restrained tangents; tested against loaded geometry.
export function sampleCorridor(controls){
 const result=[];
 for(let j=0;j<controls.length-1;j++){
  const a=controls[Math.max(0,j-1)],b=controls[j],c=controls[j+1],d=controls[Math.min(controls.length-1,j+2)];
  const steps=Math.max(8,Math.ceil(Math.hypot(c.x-b.x,c.z-b.z)/.25));
  for(let i=0;i<steps;i++){
   const t=i/steps,t2=t*t,t3=t2*t;
   const v=k=>(2*t3-3*t2+1)*b[k]+(t3-2*t2+t)*.35*(c[k]-a[k])+(-2*t3+3*t2)*c[k]+(t3-t2)*.35*(d[k]-b[k]);
   result.push({x:v('x'),z:v('z')});
  }
 }
 return [...result,{...controls.at(-1)}];
}
export function lengthOf(points){return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.z-points[i].z),0);}
export function positionOn(points,distance){
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);
  if(distance<=length||i===points.length-1){const t=length?Math.min(1,Math.max(0,distance/length)):0;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:Math.atan2(b.x-a.x,b.z-a.z)};}
  distance-=length;
 }
 return {...points[0],heading:Math.PI};
}
