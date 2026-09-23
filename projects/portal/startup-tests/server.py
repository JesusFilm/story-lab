"""Benchmark-only probes; never part of the published artifact."""
import argparse, importlib.util
from pathlib import Path
from http.server import ThreadingHTTPServer
spec = importlib.util.spec_from_file_location('portal_server', Path(__file__).resolve().parents[1] / 'serve.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class Handler(module.PortalHandler):
    def do_GET(self):
        if self.path.startswith('/story-lab/__probe'):
            body = b'<!doctype html><title>Calibration</title>' if 'html' in self.path else bytes(range(256))*1000
            self.send_response(200)
            self.send_header('Content-Type', 'text/html' if 'html' in self.path else 'application/octet-stream')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()
parser=argparse.ArgumentParser()
parser.add_argument('--port',type=int,default=8962)
parser.add_argument('--dist',type=Path)
args=parser.parse_args()
if args.dist: module.HERE=args.dist.resolve().parent
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
