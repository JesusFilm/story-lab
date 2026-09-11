import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EDIT, segmentAt, sourceTimeAt, editedTimeAt, teacherPose } from '../lib/sermon/performance.ts';
import { parseVtt } from '../lib/sermon/media.ts';
const cues=parseVtt(fs.readFileSync(new URL('../public/audio/sermon-teaching.vtt',import.meta.url),'utf8'));
test('teaching edit retains eleven ordered source excerpts and excludes interactions',()=>{
 assert.equal(EDIT.segments.length,11);assert.equal(cues.length,43);assert.ok(Math.abs(EDIT.duration-136.21)<.001);
 const text=cues.map(c=>c.text).join(' ');
 for(const interruption of ["That's all I've got",'Laughing',"He must be mad",'How could He touch','How could He talk','Disgusting','Save us','Lead us','Guide us','We need You'])assert.ok(!text.includes(interruption),interruption);
 let end=0;
 for(const segment of EDIT.segments){assert.ok(segment.end>segment.start);assert.ok(segment.editStart>=end);assert.ok(Math.abs(segment.editEnd-segment.editStart-(segment.end-segment.start))<.002);end=segment.editEnd;}
 for(const c of cues){assert.ok(c.start>=0&&c.end<=EDIT.duration);assert.ok(segmentAt(c.start+.001));}
});
test('source/edit timeline mapping round-trips and treats inserted pauses as silence',()=>{
 for(const s of EDIT.segments){const midpoint=(s.editStart+s.editEnd)/2;const source=sourceTimeAt(midpoint)!;assert.ok(Math.abs(editedTimeAt(source)-midpoint)<1e-6);}
 for(let i=0;i<EDIT.segments.length-1;i++)assert.equal(sourceTimeAt(EDIT.segments[i].editEnd+.1),null);
 assert.equal(sourceTimeAt(EDIT.duration),null);
});
test('choreography is continuous and finite through every audio edit',()=>{
 for(let t=0;t<EDIT.duration;t+=.04){const p=teacherPose(t),next=teacherPose(t+.04);for(const v of Object.values(p))assert.ok(Number.isFinite(v));assert.ok(Math.hypot(next.x-p.x,next.z-p.z)<.12,'No teleporting across edits');}
 assert.ok(teacherPose(editedTimeAt(64)).armR<-.5,'Cheek illustration raises a hand');
 assert.ok(teacherPose(editedTimeAt(80)).crouch>.15,'Giving passage lowers toward seated listener');
 assert.ok(teacherPose(editedTimeAt(167)).crouch<.01,'Judgment passage stands upright');
});
