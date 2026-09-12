"""Build only explicitly reviewed public files; never publish the checkout."""
from pathlib import Path
import hashlib, html, json, re, shutil, subprocess
from publication_utils import prototype_card, public_png

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / 'dist'
MANIFEST = json.loads((HERE / 'publication.json').read_text())

def source(name):
    unresolved = ROOT / name
    path = unresolved.resolve()
    if not path.is_relative_to(ROOT) or unresolved.is_symlink():
        raise ValueError('Invalid source path')
    expected = MANIFEST['reviewed_files'].get(name)
    if not expected or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f'Public review required for changed/unreviewed source: {name}')
    return path

def write(name, content):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)

def copy(src, name):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == '.png':
        path.write_bytes(public_png(src.read_bytes()))
    else:
        shutil.copyfile(src, path)

def page(title, body, depth='', script=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · Story Lab</title><meta name="description" content="Play biblical story prototypes and explore the art behind them."><link rel="icon" href="data:,"><link rel="stylesheet" href="{depth}portal.css"></head><body><header class="masthead"><a class="wordmark" href="{depth or './'}">✦ Story Lab</a><nav aria-label="Main"><a href="{depth}#prototypes">Play</a><a href="{depth}library/">Asset library</a></nav></header><main>{body}</main><footer class="site-footer">Biblical stories, explored through play. <span>Experimental prototypes · WebGL 2 required for 3D</span></footer>{script}</body></html>'''

# Validate everything before clearing the previous successful output.
for name in MANIFEST['reviewed_files']:
    source(name)
# Build the explicitly reviewed client-only prototype after validating its inputs.
for proto in MANIFEST['prototypes']:
    if proto.get('static_build'):
        subprocess.run(['npm', 'run', 'build:static'], cwd=ROOT/proto['static_build'], check=True)
        for name, expected in proto['static_outputs'].items():
            p = ROOT/proto['static_build']/'dist-static'/name
            if hashlib.sha256(p.read_bytes()).hexdigest() != expected:
                raise ValueError(f'Static output review required: {name}')
three = HERE / 'node_modules/three'
assert json.loads((three/'package.json').read_text())['version'] == '0.169.0'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for p in (HERE/'public').iterdir():
    if p.suffix in {'.jpg', '.css', '.mjs', '.js'}:
        copy(p, p.name)
# Stage only the runtime module dependency closure, not all examples or source maps.
queue = ['build/three.module.js', 'examples/jsm/loaders/GLTFLoader.js',
         'examples/jsm/utils/SkeletonUtils.js', 'examples/jsm/controls/OrbitControls.js']
seen = set()
while queue:
    name = queue.pop()
    if name in seen:
        continue
    seen.add(name)
    p = (three/name).resolve()
    assert p.is_relative_to(three.resolve())
    text = p.read_text()
    copy(p, 'vendor/three/'+name)
    for dep in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''', text):
        queue.append(str((p.parent/dep).resolve().relative_to(three.resolve())))
copy(three/'LICENSE', 'vendor/three/LICENSE.txt')

cards = []
for proto in MANIFEST['prototypes']:
    slug = proto['slug']
    base = f'prototypes/{slug}/'
    for name in proto['files']:
        p = source(name)
        relative = name.removeprefix(base)
        if p.suffix in {'.html', '.css', '.mjs'}:
            text = p.read_text()
            # Browser requests resolve against each prototype document, including /story-lab/.
            text = text.replace('/vendor/three/', '../../vendor/three/')
            text = re.sub(r'''(["'`])(/(?:assets|maps)/)''', r'\1.\2', text)
            text = text.replace('http://127.0.0.1:8765/', '../shepherd-maze/')
            text = text.replace('http://127.0.0.1:8766/', '../shepherd-adventure/')
            text = text.replace('Check the local server and model files.', 'Please reload and try again.')
            text = text.replace('Check the local server and assets.', 'Please reload and try again.')
            if p.suffix == '.html' and not proto.get('plain_static'):
                # Story-first prototypes own their startup. The generic wrapper
                # imports Three.js eagerly and would delay their small intro.
                if not proto.get('owns_loading'):
                    text = re.sub(r'<script type="module" src="([^"]+)"></script>', r'<script src="../../prototype-loader.js" data-entry="\1"></script>', text)
                if slug != 'shepherd-adventure':
                    text = text.replace('<body>', '<body><a href="../../" style="position:fixed;right:1rem;top:5rem;z-index:1000;color:#fff;background:#142330;padding:.5rem .75rem;border-radius:.5rem;font:14px system-ui">← Story Lab</a>')
            write(base+relative, text)
        else:
            copy(p, base+relative)
    if proto.get('static_build'):
        for name in proto['static_outputs']:
            copy(ROOT/proto['static_build']/'dist-static'/name, base+name)
    retrospective_link = ''
    if proto.get('retrospective'):
        text = source(proto['retrospective']).read_text()
        # This requested public edition retains the learning record and embedded images,
        # but uses public navigation and omits private-file provenance links and names.
        text = text.replace("Jaco’s", "the playtester’s").replace('Jaco', 'The playtester')
        text = re.sub(r'<details>.*?</details>', '<p>Images are embedded for offline reading. Reference art and a saved prototype image illustrate the learning record; diagrams are explanatory.</p><p><a href="./">Play Shepherd Maze</a> · <a href="../shepherd-adventure/">Play Shepherd Adventure</a> · <a href="../../">All prototypes</a></p>', text, flags=re.S)
        text = text.replace('<header>', '<header><p><a href="../../">← All prototypes</a></p>', 1)
        write(base+'retrospective.html', text)
        retrospective_link = f'<a class="retrospective-link" href="{base}retrospective.html">Read retrospective <span aria-hidden="true">↗</span></a>'
    cards.append(prototype_card(proto, retrospective_link))

write('index.html', page('Play', f'''<section class="intro"><span class="eyebrow">A collection of experiments</span><h1>Step into a story.</h1><p>Small journeys through biblical worlds. Choose a prototype and start exploring.</p></section><section id="prototypes" class="prototype-grid" aria-label="Playable prototypes">{''.join(cards)}</section><a class="library-link" href="library/"><div><span class="eyebrow">Behind the scenes</span><h2>The pieces of the world</h2><p>Turn the models around and read the prompts that shaped their reference art.</p></div><span class="action">Explore {len(MANIFEST['assets'])} assets ↗</span></a>'''))
asset_cards = []
for asset in MANIFEST['assets']:
    slug = asset['slug']
    reference_image = f'../{slug}.jpg'
    if asset.get('reference'):
        reference_image = '../' + asset['reference']
        copy(source(asset['reference']), asset['reference'])
    # Reuse the reviewed model already required by a prototype where possible.
    model = '../'+asset['model']
    if not (OUT/asset['model']).exists():
        copy(source(asset['model']), asset['model'])
    prompt = html.escape(source(asset['prompt']).read_text())
    asset_cards.append(f'''<a class="asset-card" href="{slug}.html"><img src="{reference_image}" alt="Generated reference art for {html.escape(asset['title'])}" loading="lazy" width="480" height="480"><h2>{html.escape(asset['title'])}</h2><span>View in 3D ↗</span></a>''')
    body = f'''<a class="back" href="./">← All assets</a><h1>{html.escape(asset['title'])}</h1><div class="asset-detail"><section><div class="viewer" data-model="{model}"><canvas tabindex="0" aria-label="Rotatable {html.escape(asset['title'])} model. Arrow keys rotate, plus and minus zoom."></canvas><p id="model-status" role="status">Loading model…</p></div><div class="viewer-controls"><button id="rotate-left" aria-label="Rotate left">↶</button><button id="rotate-right" aria-label="Rotate right">↷</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="reset">Reset view</button></div><p class="hint">Drag to rotate · Scroll or pinch to zoom · Arrow keys rotate</p></section><section class="reference"><img src="{reference_image}" alt="Generated reference art for {html.escape(asset['title'])}"><h2>Reference prompt</h2><p class="hint">Original image-generation prompt. The 3D model was developed from this reference; this is an artistic adaptation, not a historical reconstruction.</p><pre>{prompt}</pre></section></div>'''
    script = '<script type="importmap">{"imports":{"three":"../vendor/three/build/three.module.js","three/addons/":"../vendor/three/examples/jsm/"}}</script><script type="module" src="../viewer.mjs"></script>'
    write(f'library/{slug}.html', page(asset['title'], body, '../', script))
write('library/index.html', page('Asset library', f'<section class="intro"><span class="eyebrow">Behind the scenes</span><h1>The pieces of the world.</h1><p>{len(asset_cards)} models from the prototypes, with their generated reference art and original prompts.</p></section><section class="asset-grid" aria-label="Asset library">'+''.join(asset_cards)+'</section>', '../'))
write('.nojekyll', '')
print(f'Built {sum(p.is_file() for p in OUT.rglob("*"))} public files in {OUT}')
