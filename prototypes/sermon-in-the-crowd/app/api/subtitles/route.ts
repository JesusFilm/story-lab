import { SERMON } from '../../../lib/sermon/media';
// Fixed upstream only; this is not an arbitrary URL proxy. No film transcript is bundled.
export async function GET() {
  try {
    const response = await fetch(SERMON.subtitles, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) return new Response('Subtitles unavailable', { status: 502 });
    const body = await response.text();
    if (!body.trimStart().startsWith('WEBVTT')) return new Response('Invalid subtitle response', { status: 502 });
    return new Response(body, { headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'private, max-age=3600' } });
  } catch { return new Response('Subtitles unavailable', { status: 502 }); }
}
