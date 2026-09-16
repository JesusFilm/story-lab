"""Shared presentation/export helpers for explicitly reviewed public content."""
import html, struct

def public_png(raw):
    """Retain pixel/color data; omit textual/provenance chunks from public PNGs."""
    assert raw[:8] == b'\x89PNG\r\n\x1a\n'
    result=bytearray(raw[:8]); offset=8
    keep={b'IHDR',b'PLTE',b'IDAT',b'IEND',b'tRNS',b'sRGB',b'gAMA',b'cHRM'}
    while offset<len(raw):
        length=struct.unpack('>I',raw[offset:offset+4])[0]
        kind=raw[offset+4:offset+8]; end=offset+12+length
        assert end<=len(raw)
        if kind in keep:result.extend(raw[offset:end])
        offset=end
    return bytes(result)

PROTOTYPE_FORMATS = {
    'shepherd-maze': ('Game', 'Navigation & memory'),
    'shepherd-adventure': ('Game', 'Clues & discovery'),
    'sermon-in-the-crowd': ('3D experience', 'Presence & listening'),
    'story-diorama-lab': ('Media', 'Image, text & sound'),
}

def prototype_card(proto, retrospective_link=''):
    base = f"prototypes/{proto['slug']}/"
    entry = base + proto.get('entry', '')
    image = proto['slug'] + '.jpg' + (('?v=' + proto['image_version']) if proto.get('image_version') else '')
    kind, topic = PROTOTYPE_FORMATS.get(proto['slug'], ('Prototype', ''))
    label = 'Watch the story' if kind == 'Media' else 'Open prototype'
    return f'''<article class="directory-row" data-kind="{html.escape(kind)}"><a class="prototype-preview" href="{entry}" aria-label="Play {html.escape(proto['title'])}"><img src="{image}" alt="{html.escape(proto.get('image_alt', 'Saved scene from '+proto['title']))}" width="960" height="600"></a><div class="row-copy"><p class="meta">{html.escape(kind)} / {html.escape(topic)}</p><h2><a href="{entry}">{html.escape(proto['title'])}</a></h2><p>{html.escape(proto['description'])}</p></div><div class="row-actions"><a class="primary" href="{entry}">{label}</a>{retrospective_link}</div></article>'''


def asset_category(prompt_path):
    categories = {'animals': 'Animals', 'characters': 'Characters', 'structures': 'Structures', 'objects': 'Objects', 'nature': 'Nature', 'terrain': 'Terrain'}
    return next((label for segment, label in categories.items() if segment in prompt_path.split('/')), 'Other')


def page(title, body, depth='', script=''):
    active = 'library' if depth else ('share' if title == 'Share a prototype' else 'prototypes')
    def nav_link(key, href, label):
        current = ' aria-current="page"' if active == key else ''
        return f'<a href="{href}"{current}>{label}</a>'
    nav = nav_link('prototypes', depth or './', 'Prototypes') + nav_link('library', depth+'library/', 'Asset library') + nav_link('share', depth+'contribute.html', 'Share a prototype')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · Story Lab</title><meta name="description" content="Games, 3D experiences and media experiments in sharing the gospel. Explore the work and its assets."><link rel="icon" href="data:,"><link rel="stylesheet" href="{depth}portal.css"></head><body><a class="skip" href="#main">Skip to content</a><header class="masthead"><a class="wordmark" href="{depth or './'}">Story Lab<span>Jesus Film Project</span></a><nav aria-label="Main">{nav}</nav></header><main id="main">{body}</main><footer class="site-footer"><span>Story Lab · Jesus Film Project</span><span>Experiments in sharing the gospel through digital media.</span></footer>{script}</body></html>'''


def directory(title, description, items, filters, noun):
    buttons = ''.join(f'<button type="button" data-filter="{html.escape(value)}" aria-pressed="{str(i == 0).lower()}">{html.escape(label)}</button>' for i, (value, label) in enumerate(filters))
    placeholder = 'Name or category' if noun == 'asset' else 'Title, topic or format'
    return f'''<section class="directory" data-noun="{noun}"><div class="directory-top"><div><h1>{title}</h1><p>{description}</p></div><label for="search">Find {"an asset" if noun == "asset" else "a prototype"}<input id="search" type="search" placeholder="{placeholder}"></label></div><div class="filters" role="group" aria-label="Filter {noun}s">{buttons}</div><p class="result-count" role="status" aria-live="polite">{len(items)} {noun}s</p><div class="directory-list">{''.join(items)}</div><div id="empty" hidden><h2>No matching {noun}s</h2><p>Try another search or category.</p><button id="clear-filters" class="primary">Clear search and filters</button></div></section>'''
