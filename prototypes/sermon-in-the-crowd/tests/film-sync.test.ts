import test from 'node:test';
import assert from 'node:assert/strict';
import { EDIT } from '../lib/sermon/performance.ts';
import { filmFrameAt } from '../lib/sermon/film-sync.ts';

test('film follows all eleven source cuts and holds each silent gap', () => {
  for (let i = 0; i < EDIT.segments.length; i++) {
    const part = EDIT.segments[i];
    assert.equal(filmFrameAt(part.editStart).active, true);
    assert.ok(Math.abs(filmFrameAt(part.editStart).time - part.start) < 1e-8);
    assert.ok(Math.abs(filmFrameAt(part.editStart + 0.1).time - part.start - 0.1) < 1e-8);
    const next = EDIT.segments[i + 1];
    if (next && next.editStart > part.editEnd) {
      assert.deepEqual(filmFrameAt((part.editEnd + next.editStart) / 2), { time: part.end, active: false });
    }
  }
  assert.deepEqual(filmFrameAt(EDIT.duration), { time: EDIT.segments.at(-1)!.end, active: false });
  assert.deepEqual(filmFrameAt(0), { time: EDIT.segments[0].start, active: true });
});
