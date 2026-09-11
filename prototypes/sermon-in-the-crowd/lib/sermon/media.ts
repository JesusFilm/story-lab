export const SERMON = {
  title: 'Sermon on the Mount',
  scripture: 'Luke 6:24–42',
  duration: 219,
  source: 'https://www.jesusfilm.org/watch/jesus.html/sermon-on-the-mount-2/english.html',
  hls: 'https://stream.mux.com/qWaCGua8Z5Ctfbbvd02FDerilCGgwJX1iUPT5tSngATo.m3u8',
  subtitles: 'https://api-media-core.jesusfilm.org/1_jf6112-0-0/editions/ot/subtitles/1_jf6112-0-0_ot_529.vtt',
};
export type Cue = { start: number; end: number; text: string };
export function parseVtt(vtt: string): Cue[] {
  const seconds = (s: string) => s.split(':').reduce((v, n) => v * 60 + Number(n), 0);
  return vtt.replace(/\r/g, '').split(/\n\s*\n/).flatMap(block => {
    const lines = block.split('\n');
    const index = lines.findIndex(line => line.includes('-->'));
    if (index < 0) return [];
    const [a, b] = lines[index].split('-->').map(s => s.trim().split(/\s/)[0]);
    const start = seconds(a), end = seconds(b);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    return [{ start, end, text: lines.slice(index + 1).join(' ').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim() }];
  });
}
export function activeCue(cues: Cue[], time: number) { return cues.find(c => time >= c.start && time < c.end)?.text ?? ''; }
export function formatTime(t: number) { return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; }
