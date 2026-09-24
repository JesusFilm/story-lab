"""Build only explicitly reviewed public files; never publish the checkout."""
from pathlib import Path
import hashlib, html, json, re, shutil, subprocess
from publication_utils import asset_category, directory, page, prototype_card, public_png, static_output_digest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / 'dist'
MANIFEST = json.loads((HERE / 'publication.json').read_text())

def validate_prototype_module_closure(proto):
    """Keep reviewed prototypes from publishing modules with missing imports."""
    files = set(proto['files'])
    for name in files:
        if not name.endswith('.mjs'):
            continue
        module = ROOT / name
        text = module.read_text()
        for dependency in re.findall(r'''(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]''', text):
            relative = (ROOT / Path(name).parent / dependency).resolve().relative_to(ROOT.resolve())
            dependency_name = relative.as_posix()
            if dependency_name not in files:
                raise ValueError(f'Prototype runtime dependency is not published: {name} -> {dependency_name}')

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

def static_output_names(proto, root):
    if proto.get('static_outputs'):
        for name, expected in proto['static_outputs'].items():
            if hashlib.sha256((root/name).read_bytes()).hexdigest() != expected:
                raise ValueError(f'Static output review required: {name}')
        return proto['static_outputs']
    expected = proto.get('static_output_digest')
    if expected is None or static_output_digest(root, sanitize_png=True) != expected:
        raise ValueError(f"Static output review required: {proto['slug']}")
    return {p.relative_to(root).as_posix(): None for p in sorted(root.rglob('*')) if p.is_file()}

# Validate everything before clearing the previous successful output.
for proto in MANIFEST['prototypes']:
    validate_prototype_module_closure(proto)
for name in MANIFEST['reviewed_files']:
    source(name)
# Build the explicitly reviewed client-only prototype after validating its inputs.
for proto in MANIFEST['prototypes']:
    if proto.get('static_build'):
        subprocess.run(['npm', 'run', 'build:static'], cwd=ROOT/proto['static_build'], check=True)
        static_output_names(proto, ROOT/proto['static_build']/'dist-static')
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
        if p.suffix in {'.html', '.css', '.mjs'} or relative == 'src/startup.js':
            text = p.read_text()
            if relative == 'src/startup.js':
                identity = hashlib.sha256(''.join(MANIFEST['reviewed_files'][f] for f in sorted(proto['files'])).encode()).hexdigest()[:16]
                text = text.replace('__SHEPHERD_BUILD__', identity)
            # Browser requests resolve against each prototype document, including /story-lab/.
            text = text.replace('/vendor/three/', '../../vendor/three/')
            text = re.sub(r'''(["'`])(/(?:assets|maps)/)''', r'\1.\2', text)
            text = text.replace('http://127.0.0.1:8765/', '../shepherd-maze/')
            text = text.replace('http://127.0.0.1:8766/', '../shepherd-adventure/')
            text = text.replace('Check the local server and model files.', 'Please reload and try again.')
            text = text.replace('Check the local server and assets.', 'Please reload and try again.')
            # Local scene briefs are outside the reviewed public runtime.
            text = text.replace('<a href="docs/story-rebuild/README.md">Scene briefs</a> · ', '')
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
        static_root = ROOT/proto['static_build']/'dist-static'
        for name in static_output_names(proto, static_root):
            copy(static_root/name, base+name)
    retrospective_link = ''
    if proto.get('retrospective'):
        text = source(proto['retrospective']).read_text()
        # This requested public edition retains the learning record and embedded images,
        # but uses public navigation and omits private-file provenance links and names.
        text = text.replace("Jaco’s", "the playtester’s").replace('Jaco', 'The playtester')
        text = re.sub(r'<details>.*?</details>', '<p>Images are embedded for offline reading. Reference art and a saved prototype image illustrate the learning record; diagrams are explanatory.</p><p><a href="./">Play Shepherd Maze</a> · <a href="../shepherd-adventure/">Play Shepherd Adventure</a> · <a href="../../">All prototypes</a></p>', text, flags=re.S)
        text = text.replace('<header>', '<header><p><a href="../../">← All prototypes</a></p>', 1)
        write(base+'retrospective.html', text)
        retrospective_link = f'<a class="retrospective-link" href="{base}retrospective.html" target="_blank" rel="noopener noreferrer">Read retrospective <span aria-hidden="true">↗</span></a>'
    cards.append(prototype_card(proto, retrospective_link))

write('index.html', page('Prototypes', directory('Browse the work', 'Games, 3D experiences and media experiments.', cards, [('All', 'All formats'), ('Game', 'Games'), ('3D experience', '3D experiences'), ('Media', 'Media')], 'prototype'), script='<script type="module" src="directory.js"></script>'))
write('contribute.html', page('Share a prototype', '<section class="contribution"><h1>Share a prototype</h1><p class="standfirst">Bring something the team can try. Games, scenes, film treatments, audio experiments and new ways to tell a story are welcome.</p><h2>Give the work enough context</h2><ol><li><strong>Name the question.</strong> What are you exploring, and who is it for?</li><li><strong>Make it easy to try.</strong> Include a working demo, a representative image and short instructions.</li><li><strong>Ask for useful feedback.</strong> Explain what is working and what remains uncertain.</li><li><strong>Keep the learning.</strong> Add notes after people have tried it. A retrospective can grow over time.</li></ol><h2>Add it to the collection</h2><p>Contributions are made through the Story Lab repository. Add a self-contained prototype with a README and propose a portal entry through a pull request. Include required asset licenses and attribution. The portal uses an explicit reviewed file list before publishing.</p><p>If you do not work in the repository, prepare the details above for a teammate who can help.</p><a href="./">Back to prototypes</a></section>'))
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
    category = asset_category(asset['prompt'])
    asset_cards.append(f'''<article class="directory-row asset-row" data-kind="{category}"><a href="{slug}.html" class="asset-preview" aria-label="View {html.escape(asset['title'])} in 3D"><img src="{reference_image}" alt="Generated reference art for {html.escape(asset['title'])}" loading="lazy" width="480" height="480"></a><div class="row-copy"><p class="meta">{category} / 3D model</p><h2><a href="{slug}.html">{html.escape(asset['title'])}</a></h2></div><div class="row-actions"><a class="primary" href="{slug}.html">View in 3D</a></div></article>''')
    body = f'''<a class="back" href="./">← All assets</a><h1>{html.escape(asset['title'])}</h1><div class="asset-detail"><section><div class="viewer" data-model="{model}"><canvas tabindex="0" aria-label="Rotatable {html.escape(asset['title'])} model. Arrow keys rotate, plus and minus zoom."></canvas><p id="model-status" role="status">Loading model…</p></div><div class="viewer-controls"><button id="rotate-left" aria-label="Rotate left">↶</button><button id="rotate-right" aria-label="Rotate right">↷</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="reset">Reset view</button></div><p class="hint">Drag to rotate · Scroll or pinch to zoom · Arrow keys rotate</p></section><section class="reference"><img src="{reference_image}" alt="Generated reference art for {html.escape(asset['title'])}"><h2>Reference prompt</h2><p class="hint">Original image-generation prompt. The 3D model was developed from this reference; this is an artistic adaptation, not a historical reconstruction.</p><pre>{prompt}</pre></section></div>'''
    script = '<script type="importmap">{"imports":{"three":"../vendor/three/build/three.module.js","three/addons/":"../vendor/three/examples/jsm/"}}</script><script type="module" src="../viewer.mjs"></script>'
    write(f'library/{slug}.html', page(asset['title'], body, '../', script))
asset_filters = [('All', 'All assets')] + [(label, label) for label in ['Animals', 'Characters', 'Structures', 'Objects', 'Nature', 'Terrain'] if any(f'data-kind="{label}"' in card for card in asset_cards)]
if any('data-kind="Other"' in card for card in asset_cards):
    asset_filters.append(('Other', 'Other'))
write('library/index.html', page('Asset library', directory('Asset library', 'Models, reference art and prompts from the prototypes. Preview images are generated reference art.', asset_cards, asset_filters, 'asset'), '../', '<script type="module" src="../directory.js"></script>'))
write('.nojekyll', '')
print(f'Built {sum(p.is_file() for p in OUT.rglob("*"))} public files in {OUT}')
