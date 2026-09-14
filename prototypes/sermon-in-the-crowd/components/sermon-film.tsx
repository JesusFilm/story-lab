import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SERMON } from '@/lib/sermon/media';
import { filmFrameAt } from '@/lib/sermon/film-sync';

type Props = { time: number; playing: boolean; onClose: () => void };

export function SermonFilm({ time, playing, onClose }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const latest = useRef({ time, playing });
  latest.current = { time, playing };
  const [status, setStatus] = useState('Loading original film…');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const media = video.current!;
    let disposed = false;
    let destroyStream: (() => void) | undefined;
    let playPending = false;
    let playBlocked = false;
    setFailed(false);
    setStatus('Loading original film…');
    const fail = () => { if (!disposed) { setFailed(true); setStatus('Original film unavailable. The sermon can still play.'); } };
    const sync = () => {
      if (disposed || media.readyState < 1 || media.error) return;
      const frame = filmFrameAt(latest.current.time);
      // Hard seek across edits and after scrubbing; small drift is corrected too.
      if (Math.abs(media.currentTime - frame.time) > (latest.current.playing ? 0.25 : 0.04)) media.currentTime = frame.time;
      if (latest.current.playing && frame.active && !document.hidden) {
        if (media.paused && !playPending && !playBlocked) {
          playPending = true;
          void media.play().catch(() => {
            playBlocked = true;
            if (!disposed) setStatus('Press Retry to resume the original film.');
          }).finally(() => { playPending = false; });
        }
      } else media.pause();
    };
    const loaded = () => { sync(); setStatus(''); };
    const waiting = () => setStatus('Buffering original film…');
    media.addEventListener('loadedmetadata', sync);
    media.addEventListener('canplay', loaded);
    media.addEventListener('waiting', waiting);
    media.addEventListener('error', fail);
    media.muted = true;
    {
      void import('hls.js').then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) {
          if (media.canPlayType('application/vnd.apple.mpegurl')) media.src = SERMON.hls;
          else fail();
          return;
        }
        const hls = new Hls({ maxBufferLength: 15 });
        destroyStream = () => hls.destroy();
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { console.warn('Original film stream:', data.type, data.details); hls.destroy(); fail(); } });
        hls.loadSource(SERMON.hls);
        hls.attachMedia(media);
      }).catch(error => { console.warn('Original film setup:', error); fail(); });
    }
    const timer = window.setInterval(sync, 100);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      media.removeEventListener('loadedmetadata', sync);
      media.removeEventListener('canplay', loaded);
      media.removeEventListener('waiting', waiting);
      media.removeEventListener('error', fail);
      destroyStream?.();
      media.pause();
      media.removeAttribute('src');
      media.load();
    };
  }, [attempt]);

  return <aside className="film-panel" aria-label="Original film comparison">
    <div className="film-heading"><strong>Original film</strong><button onClick={onClose} aria-label="Hide original film"><X size={16}/></button></div>
    <video ref={video} muted playsInline preload="metadata" aria-label="Original JESUS film, synchronized with the sermon" />
    {status && <div className="film-status" role="status">{status}<button onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
    <p>{failed ? 'Check your connection or open the source below.' : 'Synced to the sermon · film muted'}</p>
    <a href={SERMON.source} target="_blank" rel="noreferrer">JESUS · Jesus Film Project ↗</a>
  </aside>;
}
