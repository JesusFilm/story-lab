"""Fetch only selected CC0 textures from the MakeHuman system asset ZIP."""
from pathlib import Path
import io, json, urllib.request, zipfile

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip'

class RemoteFile(io.RawIOBase):
    def __init__(self):
        r = urllib.request.urlopen(urllib.request.Request(URL, method='HEAD'), timeout=30)
        self.size = int(r.headers['Content-Length'])
        self.pos = 0
        self.cache = {}
    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        return self.pos
    def read(self, n=-1):
        if n < 0: n = self.size-self.pos
        end = min(self.pos+n, self.size)
        if end <= self.pos: return b''
        key = (self.pos, end)
        if key not in self.cache:
            req = urllib.request.Request(URL, headers={'Range': f'bytes={self.pos}-{end-1}', 'User-Agent': 'Shepherd-reference-study'})
            with urllib.request.urlopen(req, timeout=45) as r:
                if r.status != 206: raise RuntimeError('Server must support byte ranges')
                self.cache[key] = r.read()
        self.pos = end
        return self.cache[key]

with zipfile.ZipFile(RemoteFile()) as archive:
    candidates = [n for n in archive.namelist() if any(s in n for s in ('middleage_caucasian_male', 'young_caucasian_male', 'brown_eye', 'eyebrow003'))]
    print('Available:', *candidates, sep='\n', flush=True)
    picked = [n for n in candidates if ('middleage_caucasian_male' in n and n.endswith(('.png', '.jpg', '.mhmat'))) or 'brown_eye' in n]
    manifest = []
    for n in picked:
        dst = ROOT/'sources'/Path(n).name
        print('Downloading',n,archive.getinfo(n).compress_size,'compressed bytes',flush=True)
        dst.write_bytes(archive.read(n))
        manifest.append({'file': dst.name, 'archive_member': n, 'url': URL, 'license': 'CC0 1.0'})
        print('Saved', dst.name, dst.stat().st_size, flush=True)
    (ROOT/'sources'/'skin-manifest.json').write_text(json.dumps(manifest, indent=2))
