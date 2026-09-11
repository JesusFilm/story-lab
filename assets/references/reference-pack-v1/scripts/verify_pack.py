"""Decode reference images, verify inventory and mask, write file manifest.
Run after build_maze.py. Requires Pillow only. Does not regenerate artwork.
"""
from pathlib import Path
from PIL import Image
from collections import deque
import json, hashlib, re

ROOT=Path(__file__).resolve().parents[1]
expected={
 'storyline-1-shepherd':['01-angel-in-the-field','02-follow-the-light','03-nativity-arrival'],
 'storyline-2-temple':['01-return-to-jerusalem','02-jerusalem-search-district','03-market-witness','04-found-among-the-teachers'],
}
checks={}; files=[]
for story,names in expected.items():
    checks[story+'_image_count']=len(list((ROOT/story/'images').glob('*.png')))==len(names)
    for name in names:
        path=ROOT/story/'images'/f'{name}.png'
        checks[f'{story}/{name}_prompt']=(ROOT/story/'prompts'/f'{name}.txt').is_file()
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            img.load(); w,h=img.size
            checks[f'{story}/{name}_landscape_resolution']=w>=1600 and h>=900 and 1.7<w/h<1.85
            payload=path.read_bytes()
            # C2PA payload can contain a CBOR software agent: name gpt-image, version 2.0.
            marker=b'gpt-imagegversionc2.0' in payload
            files.append({'path':str(path.relative_to(ROOT)),'format':img.format,'width':w,'height':h,'mode':img.mode,'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest(),'generation_mode':'built-in image_gen','c2pa_gpt_image_2_0_marker':marker})
mp=ROOT/'storyline-1-shepherd/map'
layout=json.loads((mp/'maze-layout.json').read_text())
maze=json.loads((mp/'verification.json').read_text())
checks['maze_checks_pass']=maze['status']=='PASS' and all(maze['checks'].values())
checks['map_has_editable_exports']=all((mp/x).is_file() for x in ['maze-clean.svg','maze-annotated.svg','maze-layout.json'])
with Image.open(mp/'walkability-mask.png') as mask:
    mask.load(); checks['mask_strictly_binary']=set(mask.getdata())=={0,255}
    # Independently decode the saved raster at every tile center, then flood-fill it.
    n=len(layout['walkability_grid']); raster=[[mask.getpixel((x*16+8,y*16+8))==255 for x in range(n)] for y in range(n)]
    checks['saved_mask_matches_layout']=raster==layout['walkability_grid']
    start=(1,n-2); q=deque([start]); reached={start:0}
    while q:
        x,y=q.popleft()
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0<=nx<n and 0<=ny<n and raster[ny][nx] and (nx,ny) not in reached:
                reached[(nx,ny)]=reached[(x,y)]+1;q.append((nx,ny))
    checks['saved_mask_all_passages_reachable']=len(reached)==sum(map(sum,raster))
    checks['saved_mask_shortest_distance_matches_graph']=reached.get((n-2,1))==maze['shortest_path_edges']*2
for p in sorted(mp.glob('*.png')):
    with Image.open(p) as im:
        im.load(); files.append({'path':str(p.relative_to(ROOT)),'format':im.format,'width':im.width,'height':im.height,'mode':im.mode,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'generation_mode':'deterministic Python diagram'})
html=(ROOT/'gallery.html').read_text()
checks['gallery_local_links_exist']=all(path=='artifact-verification.json' or (ROOT/path).is_file() for path in re.findall(r'(?:src|href)="([^"]+)"',html) if not path.startswith(('#','https:')))
report={'status':'PASS' if all(checks.values()) else 'FAIL','checks':checks,'files':files,'visual_review':'VISUAL-REVIEW.md','limitations':'Image decoding and graph checks do not establish historical accuracy, 3D usability or real-device latency.'}
(ROOT/'artifact-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':report['status'],'checks_passed':sum(checks.values()),'checks_total':len(checks),'images':len(files),'scene_dimensions':[(f['width'],f['height']) for f in files[:7]],'gpt_image_2_provenance_markers':sum(f.get('c2pa_gpt_image_2_0_marker',False) for f in files)},indent=2))
assert all(checks.values()), 'Pack checks failed'
