"""Inspect only assets observed in an exported memory profile; no network access.
Usage: python3 checks/inventory-profile-assets.py profile.json > inventory.json
Requires Pillow, for embedded PNG/JPEG dimensions. Does not change any assets.
"""
import io, json, struct, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
profile = json.loads(Path(sys.argv[1]).read_text())
rows=[]
for name in sorted({r['path'] for r in profile['resources'] if r['path'].startswith('/assets/')}):
    file=(ROOT/name.lstrip('/')).resolve()
    if not file.is_relative_to(ROOT) or not file.is_file():
        continue
    row={'path':name,'fileBytes':file.stat().st_size}
    if file.suffix == '.glb':
        raw=file.read_bytes()
        assert raw[:4] == b'glTF'
        length=struct.unpack_from('<I',raw,12)[0]
        gltf=json.loads(raw[20:20+length]); binary=raw[28+length:]
        row['images']=[]
        for image in gltf.get('images',[]):
            if 'bufferView' not in image: continue
            view=gltf['bufferViews'][image['bufferView']];offset=view.get('byteOffset',0)
            with Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])) as im:
                row['images'].append({'width':im.width,'height':im.height,'encodedBytes':view['byteLength'],'rgbaBytes':im.width*im.height*4})
    elif file.suffix.lower() in ('.png','.jpg','.jpeg','.webp'):
        with Image.open(file) as im: row.update(width=im.width,height=im.height,rgbaBytes=im.width*im.height*4)
    rows.append(row)
print(json.dumps({'assets':rows,'uniqueFileBytes':sum(r['fileBytes'] for r in rows)},indent=2))
