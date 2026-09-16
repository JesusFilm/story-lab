import * as THREE from 'three';

// Loose bedding, with thicker banks against the walls and a worn entrance.
// Individual bent stalks share one geometry and material.
export function addNativityStraw(shelter,floorAt=()=>0,{width=4.7,depth=3.6}={}){
 let seed=2817;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.006,0,-.5,.006,0,-.5,-.005,.06,0,.005,.06,0,-.003,.02,.5,.003,.02,.5],3));
 geometry.setIndex([0,1,2,1,3,2,2,3,4,3,5,4]);geometry.computeVertexNormals();
 const straw=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:'#b99852',roughness:1,side:THREE.DoubleSide}),8500);
 straw.name='nativity-loose-straw';const dummy=new THREE.Object3D(),color=new THREE.Color();
 for(let i=0;i<straw.count;i++){
  const x=(random()-.5)*width,z=(random()-.5)*depth;
  const bank=Math.max(0,(Math.abs(x)-(width/2-.8))/.8,(.1-z)/2)*.16;
  const y=floorAt(x,z)+.03+random()*bank;
  dummy.position.set(x,y,z);dummy.rotation.set((random()-.5)*.35,random()*Math.PI*2,(random()-.5)*.3);
  dummy.scale.set(.5+random(),.3+random()*.8,.12+random()*.27);dummy.updateMatrix();straw.setMatrixAt(i,dummy.matrix);
  color.setHSL(.105+random()*.03,.32+random()*.22,.24+random()*.21);straw.setColorAt(i,color);
 }
 straw.receiveShadow=true;straw.castShadow=false;shelter.add(straw);return straw;
}

export function addNativityMotes(shelter){
 const positions=new Float32Array(36*3),base=[];
 for(let i=0;i<36;i++){const x=.7+Math.sin(i*7.3)*.75,y=.45+(i%11)/11*1.8,z=-.5+Math.cos(i*4.7)*.6;base.push([x,y,z]);positions.set([x,y,z],i*3);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const points=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#ead3a1',size:.012,transparent:true,opacity:.2,depthWrite:false}));points.name='lamplit-dust';points.frustumCulled=false;shelter.add(points);
 let elapsed=0;
 return dt=>{elapsed+=dt;for(let i=0;i<base.length;i++){const [x,y,z]=base[i];positions[i*3]=x+Math.sin(elapsed*.17+i)*.06;positions[i*3+1]=y+Math.sin(elapsed*.11+i*2)*.08;positions[i*3+2]=z+Math.cos(elapsed*.13+i)*.04;}geometry.attributes.position.needsUpdate=true;};
}
