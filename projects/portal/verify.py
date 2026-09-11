"""Audit the actual upload artifact and its static dependency paths."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import hashlib, json, re, struct
from html.parser import HTMLParser

HERE = Path(__file__).resolve().parent
OUT = HERE/'dist'
manifest=json.loads((HERE/'publication.json').read_text())
patterns={
 'email':r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',
 'credential':r'(?i)(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]{20,}|-----BEGIN .*PRIVATE KEY|AKIA[A-Z0-9]{16})',
 'personal/internal':r'(?i)(jacobus|\bJaco\b|/Users/|/home/|\bconfidential\b|\binternal only\b|credits_consumed|task_id|source_candidate)',
 'private/local link':r'(?i)(localhost|127\.0\.0\.1|github\.com/JesusFilm/story-lab|/api/library)',
}
files=sorted(p for p in OUT.rglob('*') if p.is_file())
assert files
for p in files:
 rel=p.relative_to(OUT)
 assert not any(x in rel.parts for x in ['provenance','review','checks','learnings','.git','node_modules'])
 assert p.suffix in {'.html','.css','.mjs','.js','.json','.jpg','.glb','.txt','.wav','.vtt','.svg','.md','.png','.mp3','.gltf','.bin',''}
 assert p.name not in {'sources.json','publication.json','asset.json','package.json'}
 if p.suffix in {'.png','.mp3'}:
  assert rel.as_posix() in manifest['reviewed_files'],f'Unreviewed media: {rel}'
 if rel.parts[0]=='vendor':continue  # Pinned upstream runtime and its required license.
 if p.suffix=='.glb':
  raw=p.read_bytes();assert raw[:4]==b'glTF'
  n=struct.unpack_from('<I',raw,12)[0];text=raw[20:20+n].decode();data=json.loads(text)
  assert all('uri' not in x for k in ['images','buffers'] for x in data.get(k,[])),p
 elif p.suffix in {'.html','.css','.mjs','.js','.json','.gltf'}:text=p.read_text()
 else:continue
 for label,pattern in patterns.items():
  assert not re.search(pattern,text),f'{label} found in {rel}; inspect privately before publication'

class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  self.links += [v for k,v in attrs if k in ['href','src','data-model','data-entry'] and v]

def check(base,document,target):
 if target.startswith(('http:','https:','data:','#','blob:')):return
 result=unquote(urlsplit(urljoin('https://example.test'+base+document,target)).path)
 assert result.startswith(base),f'Escaped deployment base: {document}: {target}'
 path=OUT/result[len(base):]
 if path.is_dir():path=path/'index.html'
 assert path.is_file(),f'Missing dependency at {base}: {document}: {target}'

for base in ['/', '/story-lab/', '/story-lab-demos/']:
 for p in files:
  name=p.relative_to(OUT).as_posix()
  if p.suffix=='.gltf':
   data=json.loads(p.read_text())
   for kind in ['images','buffers']:
    for item in data.get(kind,[]):
     if 'uri' in item:check(base,name,item['uri'])
  elif p.suffix=='.html':
   parser=Links();parser.feed(p.read_text())
   for target in parser.links:check(base,name,target)
  elif p.suffix in {'.mjs','.js'}:
   text=p.read_text()
   for target in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',text):check(base,name,target)
   # Prototype asset/fetch paths are relative to the document, not the source module.
   if name.startswith('prototypes/'):
    document='/'.join(name.split('/')[:2])+'/index.html'
    for target in re.findall(r'''['"](\./(?:assets|maps)/[^'"]+)['"]''',text):
     if target.endswith('/'):
      assert (OUT/Path(document).parent/target).is_dir(),target
     else:check(base,document,target)
for proto in manifest['prototypes']:
 if proto['slug']=='story-diorama-lab':
  root=OUT/'prototypes'/proto['slug']
  for filename in ['building.png','animals.png','flood.png','promise.png','reverie.mp3','childhood.mp3','hiraeth.mp3']:
   assert (root/'assets'/filename).is_file()
  for page in ['index.html','noah.html']:
   assert 'CC BY 4.0' in (root/page).read_text()
  assert 'reusable storytelling component' in proto['description']
 if proto.get('retrospective'):
  target=f"prototypes/{proto['slug']}/retrospective.html"
  assert (OUT/target).is_file()
  assert f'href="{target}"' in (OUT/'index.html').read_text()
 for name, expected in proto.get('static_outputs', {}).items():
  output=OUT/'prototypes'/proto['slug']/name
  assert hashlib.sha256(output.read_bytes()).hexdigest()==expected,name
 for name in proto['files']:assert (OUT/name).is_file(),name
# The portal exposes one entry per experience; model versions belong inside it.
index = (OUT/'index.html').read_text()
for proto in manifest['prototypes']:
 assert index.count(f'aria-label="Play {proto["title"]}"') == 1
 if proto.get('static_build'):
  root = OUT/'prototypes'/proto['slug']
  for required in ['audio/sermon-teaching.wav', 'audio/sermon-teaching.vtt',
                   'audio/speech-envelope.json', 'models-v2/motions.json', 'models-v2/CREDITS.md']:
   assert (root/required).stat().st_size > 0
  for segment in json.loads((root/'audio/edit-manifest.json').read_text())['segments']:
   assert (root/segment['audio'].lstrip('/')).is_file()
for asset in manifest['assets']:assert (OUT/asset['model']).is_file()
size=sum(p.stat().st_size for p in files)
assert size < 1_000_000_000
# Kept outside dist: an exact evidence inventory, never part of the public site.
(HERE/'publication-inventory.json').write_text(json.dumps({
 'bytes':size,'files':{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
},indent=2)+'\n')
print(f'PASS: {len(files)} files, {size/1_000_000:.1f} MB; sensitive-content scan and dependency checks at /, /story-lab/ and /story-lab-demos/.')
