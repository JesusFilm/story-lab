"""Local player serving this prototype and its own assets."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
import os, subprocess, argparse, json, uuid
from datetime import datetime, timezone

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
    def do_POST(self):
        if self.path != '/__debug/capture':
            self.send_error(404); return
        expected = f'http://127.0.0.1:{self.server.server_port}'
        alternate = f'http://localhost:{self.server.server_port}'
        if self.headers.get('Origin') not in (expected, alternate):
            self.send_error(403); return
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            self.send_error(400); return
        if self.headers.get('Content-Type') != 'image/png' or not 8 <= length <= 32 * 1024 * 1024:
            self.send_error(400); return
        data = self.rfile.read(length)
        if len(data) != length or not data.startswith(b'\x89PNG\r\n\x1a\n'):
            self.send_error(400); return
        directory = ROOT / 'captures'
        directory.mkdir(exist_ok=True)
        if directory.is_symlink():
            self.send_error(403); return
        name = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8] + '.png'
        try:
            with (directory / name).open('xb') as output: output.write(data)
        except OSError:
            self.send_error(500, 'Unable to save capture'); return
        payload = json.dumps({'path': 'captures/' + name}).encode()
        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers(); self.wfile.write(payload)

    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        base = THREE if path.startswith('/vendor/three/') else ROOT
        rel = path[len('/vendor/three/'):] if base == THREE else path.lstrip('/')
        target = (base / (rel or 'index.html')).resolve()
        if not target.is_relative_to(base.resolve()): return str(ROOT/'not-found')
        return str(target)

    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Shepherd-Capture','1')
        super().end_headers()

if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--port',type=int,default=8766)
    args=p.parse_args(); ensure_runtime()
    print(f'shepherd-adventure: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
