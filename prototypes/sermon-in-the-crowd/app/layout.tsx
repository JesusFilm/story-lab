import type { Metadata } from 'next';
import './globals.css';
import '../public/loading-theatre.css';
export const metadata: Metadata = {
  title: 'Among the Crowd · A sermon in Galilee',
  description: 'An immersive Three.js and Blender study of the JESUS film sermon, with English audio, subtitles, and WebXR.',
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en" className="dark"><body><div dangerouslySetInnerHTML={{__html: '<div id="loading" class="loading-theatre" data-loading-option="3" aria-label="Loading prototype"><canvas aria-hidden="true"></canvas><h2>A story needs somewhere to begin.</h2><p id="loading-text" role="status" aria-live="polite">Preparing the scene…</p><p class="loading-note">Getting your story ready.</p><span class="loading-elapsed" aria-hidden="true">0s</span><div class="loading-actions"><button type="button" class="loading-pause">Pause animation</button><button type="button" class="loading-retry" hidden>Reload prototype</button></div></div>'}} /><script src="./loading-theatre.js" defer />{children}</body></html>;
}
