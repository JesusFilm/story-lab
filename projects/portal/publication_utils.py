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

def prototype_card(proto,retrospective_link=''):
    base=f"prototypes/{proto['slug']}/"
    entry=base+proto.get('entry','')
    image=proto['slug']+'.jpg'+(('?v='+proto['image_version']) if proto.get('image_version') else '')
    return f'''<article class="prototype-card"><a class="prototype-preview" href="{entry}" target="_blank" rel="noopener noreferrer" aria-label="Play {html.escape(proto['title'])}"><img src="{image}" alt="{html.escape(proto.get('image_alt', 'Saved scene from '+proto['title']))}" width="960" height="600"></a><div class="card-copy"><span class="eyebrow">Playable prototype</span><h2>{html.escape(proto['title'])}</h2><p>{html.escape(proto['description'])}</p><div class="card-actions"><a class="action" href="{entry}" target="_blank" rel="noopener noreferrer">Play prototype <span aria-hidden="true">↗</span></a>{retrospective_link}</div></div></article>'''
