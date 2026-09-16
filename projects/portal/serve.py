"""Preview the reviewed portal build under its GitHub Pages URL prefix."""

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


HERE = Path(__file__).resolve().parent
PREFIX = '/story-lab/'


class PortalHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE / 'dist'), **kwargs)

    def translate_path(self, path):
        relative = urlsplit(path).path.removeprefix(PREFIX)
        return super().translate_path('/' + relative)

    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', PREFIX)
            self.end_headers()
        elif urlsplit(self.path).path.startswith(PREFIX):
            super().do_GET()
        else:
            self.send_error(404)

    def do_HEAD(self):
        if urlsplit(self.path).path.startswith(PREFIX):
            super().do_HEAD()
        else:
            self.send_error(404)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8768)
    args = parser.parse_args()
    if not (HERE / 'dist' / 'index.html').is_file():
        parser.error('Build the portal first with npm run build.')
    with ThreadingHTTPServer(('127.0.0.1', args.port), PortalHandler) as server:
        print(f'Preview: http://127.0.0.1:{args.port}{PREFIX}', flush=True)
        server.serve_forever()
