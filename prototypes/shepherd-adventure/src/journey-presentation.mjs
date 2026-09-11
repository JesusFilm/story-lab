// Presentation math stays independent of Three.js so transitions and ground contact
// can be checked against the actual terrain triangles.
export const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export function blendFrame(a,b,t){const u=ease(t),mix=(x,y)=>Object.fromEntries(['x','y','z'].map(k=>[k,x[k]+(y[k]-x[k])*u]));return {position:mix(a.position,b.position),look:mix(a.look,b.look)};}
export function terrainSurface(position,x,z){
 const gx=Math.max(0,Math.min(239.999999,(x+110)/220*240)),gz=Math.max(0,Math.min(259.999999,(z+140)/240*260));
 const ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,a=iz*241+ix,b=a+241;
 const A=position.getY(a),B=position.getY(b),C=position.getY(b+1),D=position.getY(a+1);
 // PlaneGeometry uses triangles (a,b,d) and (b,c,d).
 return u+v<=1?A+(D-A)*u+(B-A)*v:C+(B-C)*(1-u)+(D-C)*(1-v);
}
export function sampleRibbon(points,width,surface,spacing=.18){
 const samples=[{...points[0],distance:0}];let distance=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(length/spacing));for(let j=1;j<=steps;j++)samples.push({x:a.x+(b.x-a.x)*j/steps,z:a.z+(b.z-a.z)*j/steps,distance:distance+length*j/steps});distance+=length;}
 const positions=[],uvs=[],indices=[];
 samples.forEach((p,i)=>{const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1;for(const side of [-1,1]){const x=p.x-(b.z-a.z)/length*width*.5*side,z=p.z+(b.x-a.x)/length*width*.5*side;positions.push(x,surface(x,z)+.035,z);uvs.push(p.distance/distance,(side+1)/2);}if(i){const a=(i-1)*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}});
 return {positions,uvs,indices,length:distance};
}
