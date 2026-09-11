import assert from 'node:assert/strict';
import {blendFrame,sampleRibbon,terrainSurface} from '../src/journey-presentation.mjs';
import {EDGES,lanePoints} from '../src/journey-model.mjs';
import {height} from '../src/journey-terrain.mjs';
const a={position:{x:-9,y:8,z:85},look:{x:-4,y:23,z:-8}},b={position:{x:0,y:3.6,z:42},look:{x:0,y:1.2,z:34}};
for(const [t,want] of [[0,a],[1,b]])for(const part of ['position','look'])for(const axis of ['x','y','z'])assert(Math.abs(blendFrame(a,b,t)[part][axis]-want[part][axis])<1e-10);
assert(Math.abs(blendFrame(a,b,.001).position.z-a.position.z)<.00001,'gentle departure');
assert(Math.abs(blendFrame(a,b,.999).position.z-b.position.z)<.00001,'gentle arrival');
// A planar mesh must interpolate exactly on both triangle halves, including seams.
const planar={getY:i=>{const x=-110+(i%241)*220/240,z=-140+Math.floor(i/241)*240/260;return x*.3-z*.2;}};
for(const x of [-100,-.2,1,99])for(const z of [-130,-.7,1,90])assert(Math.abs(terrainSurface(planar,x,z)-(x*.3-z*.2))<1e-8);
const field={getY:i=>height(-110+(i%241)*220/240,-140+Math.floor(i/241)*240/260)};let vertices=0;
for(const edge of EDGES){const ribbon=sampleRibbon(lanePoints(edge),.32,(x,z)=>terrainSurface(field,x,z));for(let i=0;i<ribbon.positions.length;i+=3){const [x,y,z]=ribbon.positions.slice(i,i+3);assert(Math.abs(y-terrainSurface(field,x,z)-.035)<1e-7);vertices++;}assert.equal(ribbon.uvs[0],0);assert.equal(ribbon.uvs.at(-2),1);}
console.log(`Presentation checks passed: eased camera endpoints, terrain triangle interpolation, ${vertices} grounded route vertices, forward/reverse progress coordinates.`);
