"""Launch the two independent prototype servers; no repository-wide file serving."""
import argparse
from pathlib import Path
import signal
import socket
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--maze-port', type=int, default=8765)
    parser.add_argument('--adventure-port', type=int, default=8766)
    args = parser.parse_args()
    ports = [args.maze_port, args.adventure_port]
    if len(set(ports)) != 2 or any(not 1 <= port <= 65535 for port in ports):
        parser.error('Choose two distinct ports between 1 and 65535.')
    # Fail before starting either experience if a requested port is occupied.
    for port in ports:
        with socket.socket() as probe:
            try:
                probe.bind(('127.0.0.1', port))
            except OSError:
                parser.error(f'Port {port} is in use; choose another port.')

    root = Path(__file__).resolve().parent
    # Install/check the shared runtime once, before launching concurrent servers.
    import importlib.util
    spec = importlib.util.spec_from_file_location('maze_server', root / 'shepherd-maze/serve.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ensure_runtime()
    children = []
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        for name, port in zip(['shepherd-maze', 'shepherd-adventure'], ports):
            children.append(subprocess.Popen([sys.executable, str(root / name / 'serve.py'), '--port', str(port)]))
        print(f'Maze: http://127.0.0.1:{args.maze_port}/', flush=True)
        print(f'Adventure: http://127.0.0.1:{args.adventure_port}/', flush=True)
        print('Ctrl+C stops both prototypes.', flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(0.25)
        return 1
    except KeyboardInterrupt:
        return 0
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == '__main__':
    raise SystemExit(main())
