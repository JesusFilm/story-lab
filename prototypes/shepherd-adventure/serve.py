"""Local player serving this prototype and its own assets."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
import os, subprocess, argparse, json

ROOT = Path(__file__).resolve().parent
CACHE = Path(os.environ.get('WATCH_GAME_RUNTIME', '/tmp/watch-game-blender-runtime'))
THREE = CACHE / 'node_modules/three'

def ensure_runtime():
    manifest = THREE / 'package.json'
    if not manifest.exists() or json.loads(manifest.read_text())['version'] != '0.169.0':
        print('Installing pinned Three.js 0.169.0 in temporary runtime cache...', flush=True)
        subprocess.run(['npm','install','--prefix',str(CACHE),'--no-audit','--no-fund',
                        '--no-package-lock','--ignore-scripts','three@0.169.0'],check=True)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        base = THREE if path.startswith('/vendor/three/') else ROOT
        rel = path[len('/vendor/three/'):] if base == THREE else path.lstrip('/')
        target = (base / (rel or 'index.html')).resolve()
        if not target.is_relative_to(base.resolve()): return str(ROOT/'not-found')
        return str(target)

    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()

if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--port',type=int,default=8766)
    args=p.parse_args(); ensure_runtime()
    print(f'shepherd-adventure: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
