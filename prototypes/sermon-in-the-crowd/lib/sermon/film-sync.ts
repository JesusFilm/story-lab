import { EDIT, sourceTimeAt } from './performance.ts';

// Hold the last source frame during the short silent gaps in the teaching edit.
export function filmFrameAt(time: number) {
  const source = sourceTimeAt(time);
  if (source !== null) return { time: source, active: true };
  const previous = EDIT.segments.findLast(segment => segment.editEnd <= time);
  return { time: previous?.end ?? EDIT.segments[0].start, active: false };
}
