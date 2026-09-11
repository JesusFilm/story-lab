import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVtt, activeCue, formatTime } from '../lib/sermon/media.ts';
test('parses official-style timestamps, identifiers and formatting',()=>{
 const cues=parseVtt('WEBVTT\r\n\r\n1\r\n00:01.000 --> 00:03.500 align:center\r\n<b>First line</b>\r\nSecond &amp; last\r\n\r\n00:00:04.000 --> 00:00:05.000\r\nAnother cue\r\n');
 assert.deepEqual(cues,[{start:1,end:3.5,text:'First line Second & last'},{start:4,end:5,text:'Another cue'}]);
 assert.equal(activeCue(cues,.99),'');assert.equal(activeCue(cues,1),'First line Second & last');assert.equal(activeCue(cues,3.5),'');assert.equal(activeCue(cues,4),'Another cue');assert.equal(activeCue(cues,5),'');
});
test('ignores metadata and malformed intervals without inventing captions',()=>{
 assert.deepEqual(parseVtt('WEBVTT\n\nNOTE A comment\n\nnot-time --> 00:02.000\nBroken\n\n00:04.000 --> 00:02.000\nReversed'),[]);
});
test('time label follows real media time',()=>{assert.equal(formatTime(0),'0:00');assert.equal(formatTime(219),'3:39');assert.equal(formatTime(63.9),'1:03');});
