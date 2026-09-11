"""Check that each prototype runs using only its own folder and pinned Three.js cache."""
from pathlib import Path
from http.server import ThreadingHTTPServer
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import threading
from urllib.request import urlopen


def verify(name, checks):
    source = Path(__file__).resolve().parent / name
    with tempfile.TemporaryDirectory(prefix=f'{name}-isolated-') as scratch:
        target = Path(scratch) / name
        shutil.copytree(source, target, ignore=shutil.ignore_patterns(
            'review', 'renders', '__pycache__', '*.blend', '*.zip', '*.log'))
        spec = importlib.util.spec_from_file_location(name.replace('-', '_'), target / 'serve.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        module.ensure_runtime()
        server = ThreadingHTTPServer(('127.0.0.1', 0), module.Handler)
        # Avoid flooding test output with one log line per asset.
        module.Handler.log_message = lambda *_: None
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        origin = f'http://127.0.0.1:{server.server_port}'
        try:
            paths = [p for p in target.rglob('*') if p.is_file() and (
                p.suffix in {'.glb', '.html', '.css', '.mjs'} or
                p.relative_to(target).parts[0] in {'map', 'maps'})]
            for file in paths:
                relative = file.relative_to(target).as_posix()
                with urlopen(f'{origin}/{relative}', timeout=15) as response:
                    assert hashlib.sha256(response.read()).digest() == hashlib.sha256(file.read_bytes()).digest(), relative
            with urlopen(origin + '/vendor/three/build/three.module.js', timeout=15) as response:
                assert response.status == 200
                response.read()
            env = {**os.environ, 'WATCH_GAME_TEST_ORIGIN': origin}
            for check in checks:
                result = subprocess.run(['node', f'checks/{check}.mjs'], cwd=target,
                                        env=env, capture_output=True, text=True)
                if result.returncode:
                    raise RuntimeError(f'{name}/{check}:\n{result.stdout}\n{result.stderr}')
            return {'prototype': name, 'isolated': True, 'http_files_checked': len(paths),
                    'checks_passed': checks, 'visual_review': 'not performed'}
        finally:
            server.shutdown()
            server.server_close()
            worker.join()


if __name__ == '__main__':
    results = [
        verify('shepherd-maze', ['verify-controller', 'verify-village']),
        verify('shepherd-adventure', ['verify-journey', 'verify-journey-poi',
                                     'verify-journey-camera', 'verify-animation-transitions']),
    ]
    print(json.dumps(results, indent=2))
