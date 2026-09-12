// Shared layout and pacing for the single entrance to the Nativity enclosure.
export const ANIMAL_GATE={x:-21,z:-39,yaw:Math.PI/4,width:4.4};
const half=ANIMAL_GATE.width/2,dx=Math.cos(ANIMAL_GATE.yaw)*half,dz=-Math.sin(ANIMAL_GATE.yaw)*half;
export const ANIMAL_GATE_ENDS=[{x:ANIMAL_GATE.x-dx,z:ANIMAL_GATE.z-dz},{x:ANIMAL_GATE.x+dx,z:ANIMAL_GATE.z+dz}];
export const ANIMAL_AREA_WALLS=[
 [{x:-40,z:-37},{x:-23,z:-37}],
 [{x:-23,z:-37},ANIMAL_GATE_ENDS[0]],
 [ANIMAL_GATE_ENDS[1],{x:-16,z:-44}],
 [{x:-16,z:-44},{x:-3,z:-63}],
 [{x:-3,z:-63},{x:-3,z:-80}]
].map(([a,b])=>({kind:'animal-area-wall',a,b,height:1.45}));
export const FINAL_APPROACH_CONTROLS=[
 {x:-8,z:-26},{x:-10,z:-32},{x:-14,z:-35.5},{x:-21,z:-39},
 {x:-25,z:-42},{x:-27.5,z:-48},{x:-28,z:-55},{x:-27.5,z:-62},
 {x:-27,z:-67},{x:-28,z:-72}
];
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function animalViewWeight(p){return smooth(42,47,-p.z)*(1-smooth(58,66,-p.z))*smooth(23,27,-p.x);}
export function finalApproachSpeed(p){return 4.4-2.4*smooth(37,45,-p.z);}
