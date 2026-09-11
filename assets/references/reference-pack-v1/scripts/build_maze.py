"""Reproducible graph, floorplan, PNG/SVG map and independent raster verification.
Run: python3 assets/references/reference-pack-v1/scripts/build_maze.py (Pillow, networkx).
"""
from pathlib import Path
import json, random, math, hashlib
from collections import deque
from itertools import islice
import networkx as nx
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'storyline-1-shepherd/map'
OUT.mkdir(parents=True, exist_ok=True)
N, TILE_M, SPEED = 17, 4, 3.2
S, E = (0, N-1), (N-1, 0)
full = nx.grid_2d_graph(N, N)
def edgekey(a,b): return tuple(sorted((a,b)))
for seed in range(210, 1200):
    rng=random.Random(seed)
    G=nx.Graph(); G.add_nodes_from(full)
    seen={S}; stack=[S]
    while stack:
        a=stack[-1]; avail=[b for b in full[a] if b not in seen]
        if not avail: stack.pop(); continue
        b=rng.choice(avail); G.add_edge(a,b); seen.add(b); stack.append(b)
    if nx.shortest_path_length(G,S,E)<90: continue
    candidates=[(a,b) for a,b in full.edges if not G.has_edge(a,b)]
    rng.shuffle(candidates); loops=0
    for a,b in candidates:
        if a in (S,E) or b in (S,E): continue
        G.add_edge(a,b)
        if nx.shortest_path_length(G,S,E)<80: G.remove_edge(a,b)
        else: loops+=1
        if loops==8: break
    paths=list(islice(nx.shortest_simple_paths(G,S,E),250))
    if len(paths)<3: continue
    def es(p): return {edgekey(a,b) for a,b in zip(p,p[1:])}
    chosen=[paths[0]]
    for _ in range(2):
        options=[p for p in paths if p not in chosen and len(p)<=len(paths[0])+40]
        if not options: break
        chosen.append(max(options,key=lambda p:min(len(es(p)^es(q)) for q in chosen)))
    if len(chosen)==3 and min(len(es(a)^es(b)) for i,a in enumerate(chosen) for b in chosen[i+1:])>=20: break
else: raise RuntimeError('Could not meet maze constraints')

dead=sorted(v for v in G if G.degree(v)==1 and v not in (S,E))
branches=[]
for leaf in dead:
    p=[leaf]; prev=None; cur=leaf
    while True:
        nexts=[v for v in G[cur] if v!=prev]
        if not nexts: break
        prev,cur=cur,nexts[0]; p.append(cur)
        if G.degree(cur)!=2 or cur in (S,E): break
    branches.append(p)
dist=nx.single_source_shortest_path_length(G,E)
defaults={v:min(G[v],key=lambda x:(dist[x],x)) for v in G if v!=E}
W=2*N+1
grid=[[0]*W for _ in range(W)]
def gp(v): return (2*v[0]+1,2*v[1]+1)
for v in G:
    x,y=gp(v); grid[y][x]=1
for a,b in G.edges:
    ax,ay=gp(a); bx,by=gp(b); grid[(ay+by)//2][(ax+bx)//2]=1
grid[W-1][1]=1; grid[0][W-2]=1
mask=Image.new('L',(W*16,W*16),0); md=ImageDraw.Draw(mask)
for y,row in enumerate(grid):
    for x,val in enumerate(row):
        if val: md.rectangle((x*16,y*16,(x+1)*16-1,(y+1)*16-1),fill=255)
mask.save(OUT/'walkability-mask.png')
# Maximal horizontal solid rectangles, merged vertically when spans match.
rects=[]; active={}
for y,row in enumerate(grid):
    runs=[]; x=0
    while x<W:
        if row[x]: x+=1; continue
        start=x
        while x<W and not row[x]: x+=1
        runs.append((start,x))
    current={}
    for span in runs:
        if span in active: idx=active[span]; rects[idx][3]=y+1
        else: idx=len(rects); rects.append([span[0],y,span[1],y+1])
        current[span]=idx
    active=current

obstacles=[]; used=set()
for ri,p in enumerate(chosen):
    for frac in (.28,.67):
        k=int((len(p)-2)*frac)
        for off in range(len(p)-2):
            idx=(k+off)%(len(p)-2); a,b=p[idx:idx+2]
            key=edgekey(a,b)
            if G.degree(a)==2 and G.degree(b)==2 and key not in used:
                used.add(key); obstacles.append({'id':f'O{len(obstacles)+1:02}', 'type':'jump' if len(obstacles)%2==0 else 'duck','edge':[a,b], 'default':'auto_step_over' if len(obstacles)%2==0 else 'auto_duck'}); break

def node(v): return f'{v[0]},{v[1]}'
routes=[]
for i,p in enumerate(chosen):
    length=(len(p)-1)*8
    decisions=sum(G.degree(v)>=3 for v in p[1:-1])
    routes.append({'id':chr(65+i),'nodes':p,'length_m':length,'edges':len(p)-1,'decision_junctions':decisions,'travel_seconds':round(length/SPEED,1),'with_2s_per_choice_seconds':round(length/SPEED+decisions*2,1)})
data={'seed':seed,'grid_nodes_per_axis':N,'tile_m':TILE_M,'node_spacing_m':8,'footprint_m':[W*TILE_M,W*TILE_M], 'corridor_width_m':4,'start':S,'end':E,'coordinate_system':'x east, y south; top-left origin; node center=((2*x+1.5)*4, (2*y+1.5)*4) metres','nodes':[{'id':node(v),'xy':v,'degree':G.degree(v),'distance_to_end_edges':dist[v],'default_next':defaults.get(v)} for v in sorted(G)],'edges':[[a,b] for a,b in sorted(G.edges)],'walkability_grid':grid,'solid_rectangles_tiles':rects,'routes':routes,'dead_ends':dead,'dead_end_branches':branches,'obstacles':obstacles,'assumptions':{'speed_m_s':SPEED,'decision_delay_s':2,'camera':'north-up trailing elevated camera; beacon bearing indicator persists when offscreen','roof_height_m':[2.4,3.2],'wall_height_m':2.2,'star_beacon':'artistic wayfinding device'}}
(OUT/'maze-layout.json').write_text(json.dumps(data,indent=2)+'\n')

# Render a deterministic designer map. PNG and editable SVG use the same primitives.
SIZE=2240; CELL=52; OX,OY=210,230
im=Image.new('RGB',(SIZE, SIZE),'#0e1826'); draw=ImageDraw.Draw(im)
svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">']
def rect(box,fill,outline=None,width=1):
    draw.rectangle(box,fill=fill,outline=outline,width=width)
    x,y,x2,y2=box; svg.append(f'<rect x="{x}" y="{y}" width="{x2-x}" height="{y2-y}" fill="{fill}" stroke="{outline or fill}" stroke-width="{width}"/>')
def line(pts,fill,width=2):
    draw.line(pts,fill=fill,width=width,joint='curve'); svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in pts)}" fill="none" stroke="{fill}" stroke-width="{width}" stroke-linejoin="round"/>')
def circle(x,y,r,fill,outline=None):
    draw.ellipse((x-r,y-r,x+r,y+r),fill=fill,outline=outline,width=2); svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{outline or fill}" stroke-width="2"/>')
def text(x,y,s,size=24,fill='#e8e2d4'):
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',size)
    draw.text((x,y),s,font=font,fill=fill); import html
    svg.append(f'<text x="{x}" y="{y+size*.91}" fill="{fill}" font-family="Arial,sans-serif" font-size="{size}">{html.escape(s)}</text>')
def pt(v):
    x,y=gp(v); return (OX+(x+.5)*CELL,OY+(y+.5)*CELL)
rect((0,0,SIZE,SIZE),'#0e1826')
text(100,58,'FOLLOW THE LIGHT',58)
text(103,130,'01 / BETHLEHEM     •     VERIFIED LEVEL PLAN     •     CONCEPT v1',25,'#acb9c7')
rect((OX,OY,OX+W*CELL,OY+W*CELL),'#293b4a')
rng=random.Random(99)
for x,y,x2,y2 in rects:
    a,b,c,d=OX+x*CELL,OY+y*CELL,OX+x2*CELL,OY+y2*CELL
    color=rng.choice(['#766c60','#817568','#897c6b','#70695e'])
    rect((a,b,c,d),color,'#1c2833',3)
    if x>0 and y>0 and x2<W and y2<W:
        rect((a+8,b+8,c-8,d-8),color,'#a6967f',2)
        line([(a+8,d-8),(c-8,b+8)],'#655f55',2)
    else: line([(a+5,b+5),(c-5,b+5)],'#aa9881',2)
# Clean environment is the same floorplan, no route overlays or labels.
im.save(OUT/'maze-clean.png')
(OUT/'maze-clean.svg').write_text('\n'.join(svg+['</svg>']))
colors=['#57dccc','#dfb9ff','#ffd06a']
for i,p in enumerate(chosen):
    # Parallel annotation offsets are <=0.55m, inside the 4m corridor.
    delta=(i-1)*7
    pts=[(x+delta,y+delta) for x,y in map(pt,p)]
    line(pts,'#12232e',8); line(pts,colors[i],4)
for i,p in enumerate(branches):
    pts=list(map(pt,p)); line(pts,'#e38176',3)
    x,y=pt(p[0]); line([(x-7,y-7),(x+7,y+7)],'#ffaca0',3); line([(x-7,y+7),(x+7,y-7)],'#ffaca0',3)
for obs in obstacles:
    a,b=map(pt,obs['edge']); x,y=(a[0]+b[0])/2,(a[1]+b[1])/2
    circle(x,y,13,'#12232e','#f2ede0'); text(x-7,y-11,'J' if obs['type']=='jump' else 'D',20)
sx,sy=pt(S); ex,ey=pt(E)
circle(sx,sy,19,'#57dccc'); text(sx-8,sy-14,'S',25,'#0e1826')
circle(ex,ey,19,'#ffd06a'); text(ex-8,ey-14,'E',25,'#0e1826')
line([(sx,sy+27),(sx,OY+W*CELL+20)],'#57dccc',3)
text(sx-35,OY+W*CELL+27,'START / FIELD',22,'#57dccc')
line([(ex,ey-26),(ex,OY-20)],'#ffd06a',3)
text(ex-170,OY-52,'END / OPEN STALL',22,'#ffd06a')
text(95,OY+40,'N',30); line([(110,OY+115),(110,OY+80),(98,OY+95),(110,OY+80),(122,OY+95)],'#e8e2d4',3)
text(100,2130,f'140 × 140 m   /   4 m alleys   /   {len(dead)} dead ends   /   {loops} independent loops',25)
for i,r in enumerate(routes):
    x=620+i*490; line([(x,2072),(x+55,2072)],colors[i],6)
    text(x+70,2056,f'{r["id"]}  {r["length_m"]} m  /  {r["travel_seconds"]/60:.1f} min',23,colors[i])
text(620,2100,'Coral × = dead-end spur     J = jump / auto-step     D = duck / auto-duck',23,'#acb9c7')
text(100,2180,'Travel estimates at 3.2 m/s; choices and exploration add time. Roof blocks and walls are solid.',22,'#acb9c7')
im.save(OUT/'maze-annotated.png'); (OUT/'maze-annotated.svg').write_text('\n'.join(svg+['</svg>']))

# Independent raster flood fill: compare distance, count endpoints and check no leak.
q=deque([(1,W-2)]); rd={(1,W-2):0}
while q:
    x,y=q.popleft()
    for u,v in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
        if 0<=u<W and 0<=v<W and grid[v][u] and (u,v) not in rd:
            rd[(u,v)]=rd[(x,y)]+1; q.append((u,v))
checks={
 'all_289_graph_nodes_connected':nx.is_connected(G),
 'opposite_sides':S[1]==N-1 and E[1]==0,
 'three_distinct_simple_successful_routes':len({tuple(p) for p in chosen})==3 and all(p[0]==S and p[-1]==E and len(p)==len(set(p)) and all(G.has_edge(a,b) for a,b in zip(p,p[1:])) for p in chosen),
 'meaningful_alternative_routes':min(len(es(a)^es(b)) for i,a in enumerate(chosen) for b in chosen[i+1:])>=20,
 'at_least_20_dead_ends':len(dead)>=20,
 'at_least_4_loops':G.number_of_edges()-G.number_of_nodes()+1>=4,
 'fastest_travel_at_least_3_minutes':nx.shortest_path_length(G,S,E)*8/SPEED>=180,
 'reference_routes_under_7_minutes_with_choice_allowance':all(r['with_2s_per_choice_seconds']<420 for r in routes),
 'raster_all_walkable_tiles_connected':len(rd)==sum(map(sum,grid)),
 'raster_shortest_matches_graph':rd[(W-2,1)]==2*nx.shortest_path_length(G,S,E),
 'exactly_two_boundary_openings':sum(grid[0])+sum(grid[-1])+sum(row[0]+row[-1] for row in grid[1:-1])==2,
 'all_defaults_strictly_approach_exit':all(dist[w]==dist[v]-1 for v,w in defaults.items()),
 'obstacles_on_open_edges_away_from_junctions':all(G.has_edge(*o['edge']) and all(G.degree(v)==2 for v in o['edge']) for o in obstacles),
}
# Sample shifted colored route centerlines in saved collision mask.
mask=Image.open(OUT/'walkability-mask.png').convert('L')
valid=True
for i,p in enumerate(chosen):
    delta=(i-1)*7/CELL
    for a,b in zip(p,p[1:]):
        ax,ay=gp(a); bx,by=gp(b)
        for step in range(101):
            t=step/100; x=int((ax+.5+(bx-ax)*t+delta)*16); y=int((ay+.5+(by-ay)*t+delta)*16)
            valid &= mask.getpixel((x,y))==255
checks['rendered_route_lines_stay_in_walkable_mask']=valid
report={'status':'PASS' if all(checks.values()) else 'FAIL','checks':checks,'seed':seed,'nodes':len(G),'edges':G.number_of_edges(),'cycle_rank':loops,'dead_ends':len(dead),'routes':[{k:v for k,v in r.items() if k!='nodes'} for r in routes],'shortest_path_edges':nx.shortest_path_length(G,S,E),'timing_scope':'Estimates, not user playtests. Excludes intro/outro, dead-end detours, auto-obstacle animation time and runtime latency.','not_verified':['3D line of sight','engine collision/navmesh','controller latency on real hardware','historical reconstruction']}
dirs=[(0,-1),(1,0),(0,1),(-1,0)]
for hand,order in [('left',[-1,0,1,2]),('right',[1,0,-1,2])]:
    cur=S; heading=0; states=set(); steps=0
    while cur!=E and (cur,heading) not in states:
        states.add((cur,heading))
        for turn in order:
            d=(heading+turn)%4; v=(cur[0]+dirs[d][0],cur[1]+dirs[d][1])
            if v in G[cur]: cur=v; heading=d; steps+=1; break
    report.setdefault('wall_following',{})[hand]={'reaches_exit':cur==E,'steps':steps,'travel_minutes':round(steps*8/SPEED/60,2),'repeated_orientation_state':cur!=E}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2)); assert all(checks.values()), 'Maze requirements failed'
