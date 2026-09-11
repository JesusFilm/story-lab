"""Rebuild only the village world, retaining the original character and reference world."""
from pathlib import Path
# Share the established Blender primitive/export helpers without running its asset builds.
HELPERS = Path(__file__).with_name('build_scene.py')
exec(compile(HELPERS.read_text().split('\nreset()\nskin=')[0], str(HELPERS), 'exec'))
MAP = ROOT / 'maps/village/maze-layout.json'
layout = json.loads(MAP.read_text())
reset()
plaster=[mat('Plaster '+str(i),c) for i,c in enumerate([(.72,.55,.36),(.83,.71,.51),(.62,.42,.27),(.76,.62,.45)])]
stone=mat('Weathered fieldstone',(.48,.43,.32)); cap=mat('Pale stone caps',(.69,.62,.47))
wood=mat('Cedar timber',(.24,.12,.055)); reed=mat('Reed thatch',(.56,.40,.19))
teal=mat('Indigo green shutters',(.09,.26,.24)); dark=mat('Deep recesses',(.095,.075,.049))
cloth=[mat('Awning '+str(i),c) for i,c in enumerate([(.60,.22,.12),(.20,.37,.34),(.84,.66,.35)])]
linen=mat('Cream canvas',(.88,.78,.55)); clay=mat('Clay vessels',(.52,.23,.115))
produce=[mat('Figs',(.28,.15,.27)),mat('Olives',(.26,.34,.10)),mat('Pomegranates',(.64,.14,.07))]
wool=mat('Sheep fleece',(.82,.77,.62)); animaldark=mat('Sheep face and legs',(.21,.17,.12))
foliage=mat('Sage courtyard herbs',(.25,.36,.15)); earth=mat('Garden soil',(.28,.21,.12))
sand=mat('Packed ochre earth',(.56,.45,.31)); edge=mat('Diorama edge',(.16,.23,.22))
W,H=layout['width_m'],layout['height_m']
box('Diorama plinth',(W/2,-H/2,-.65),(W+12,H+12,1.2),edge,.6)
box('Ground',(W/2,-H/2,-.07),(W+11,H+11,.14),sand,.08)
records=[]

def join_objects(objects,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True);bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();o=bpy.context.object;o.name=name
    return o

for i,solid in enumerate(layout['solids']):
    before=set(bpy.context.scene.objects)
    x,z,x2,z2=solid['rect'];w,d=x2-x,z2-z;cx,cz=(x+x2)/2,(z+z2)/2
    horizontal=w>=d;L=max(w,d);D=min(w,d);kind=solid['kind']
    def pos(u,v,h): return (cx+u if horizontal else cx+v, -(cz+v if horizontal else cz+u), h)
    def block(name,u,v,h,a,b,c,m,bevel=.025):
        return box(name,pos(u,v,h),(a,b,c) if horizontal else (b,a,c),m,bevel)
    def orb(name,u,v,h,a,b,c,m):
        return sphere(name,pos(u,v,h),(a,b,c) if horizontal else (b,a,c),m)
    if kind in ('low-wall','low-courtyard','boundary'):
        height=.90 if kind=='low-wall' else .48 if kind=='low-courtyard' else 1.05+(i%4)*.018
        block('Stone foundation',0,0,height/2,L,D,height,stone,.035)
        block('Coping',0,0,height+.045,L-.025,D-.025,.09,cap,.02)
        # Recessed joints keep every brick within the exported raster footprint.
        if kind=='low-wall':
            for j in range(int(L/.85)):
                u=-L/2+.43+j*.85
                for side in (-1,1):
                    block('Stone face',u,side*(D/2-.014),.52,.76,.025,.31,cap,.02)
        if kind=='low-courtyard':
            block('Garden soil',0,0,.59,L-.36,D-.36,.12,earth,.015)
            for side in (-1,1):
                block('Planter rim',0,side*(D/2-.12),.65,L-.12,.16,.25,cap)
                block('Planter end',side*(L/2-.12),0,.65,.16,D-.12,.25,cap)
            if i%4!=0:
                for u,v in [(-.95,-.80),(.80,-.7),(-.65,.85),(.9,.9)]:
                    orb('Courtyard herbs',u,v,.78,.52,.48,.31,foliage)
            else:
                for u in (-.65,.65):
                    cone('Courtyard storage jar',pos(u,0,.90),.30,.19,.60,clay)
    elif kind=='home':
        height=3.15+(i%4)*.32
        block('House plaster',0,0,height/2,L,D,height,plaster[i%4],.07)
        block('Flat roof',0,0,height+.08,L-.08,D-.08,.16,cap,.04)
        for side in (-1,1):
            block('Roof parapet',0,side*(D/2-.16),height+.29,L-.12,.20,.44,plaster[i%4])
        for end in (-1,1):block('End parapet',end*(L/2-.16),0,height+.29,.2,D-.12,.44,plaster[i%4])
        for j in range(max(1,int(L/4))):
            u=-L/2+2+j*4
            for side in (-1,1):
                v=side*(D/2-.03)
                block('Door recess',u,v,.90,1.05,.055,1.8,dark)
                block('Wooden door',u,v-side*.006,.84,.86,.06,1.67,teal)
                block('Door lintel',u,v-side*.06,1.86,1.25,.17,.18,cap)
                block('Window',u+1.05,v,2.18,.55,.055,.64,dark)
                block('Window shutter',u+1.05,v-side*.015,2.18,.39,.065,.53,teal)
                for k in (-1,1):block('Shutter brace',u+1.05,v-side*.025,2.18+k*.16,.48,.075,.04,wood,0)
        block('Roof room',-L*.23,0,height+.65,min(2.2,L*.25),D*.53,1.15,plaster[(i+1)%4],.06)
        block('Roof room coping',-L*.23,0,height+1.27,min(2.3,L*.26),D*.57,.15,cap,.035)
        for j in (0,1):cone('Roof jar',pos(L*.22+j*.55,0,height+.43),.23,.15,.60,clay)
    elif kind=='market':
        block('Market stone plinth',0,0,.18,L,D,.36,stone,.025)
        block('Market back wall',0,0,1.18,L-.1,.35,2.0,plaster[(i+1)%4])
        for side in (-1,1):
            for u in (-L/2+.25,L/2-.25):block('Awning post',u,side*(D/2-.24),1.45,.15,.15,2.9,wood)
            for j in range(int(L/.7)):
                u=-L/2+.4+j*.7
                block('Striped market canopy',u,side*D*.24,2.82,.69,D*.48,.11,cloth[i%3] if j%2 else linen,.01)
                block('Canvas valance',u,side*(D/2-.08),2.63,.69,.12,.35,cloth[i%3] if j%2 else linen,.01)
            for j in range(3):
                u=(j-1)*2.7
                block('Produce table',u,side*1.30,.85,2.25,.91,.16,wood)
                block('Crate',u,side*1.30,1.04,1.96,.77,.25,clay)
                for a in range(5):
                    for b in range(2):orb('Market fruit',u-.7+a*.35,side*1.30-.20+b*.36,1.24,.15,.15,.14,produce[j])
        for j in (-1,1):cone('Storage amphora',pos(j*(L/2-.5),0,.80),.28,.18,.85,clay)
    elif kind=='animal-stall':
        block('Animal pen foundation',0,0,.17,L,D,.34,stone)
        for side in (-1,1):
            for u in (-L/2+.17,0,L/2-.17):block('Pen post',u,side*(D/2-.16),.85,.17,.17,1.7,wood)
            for h in (.65,1.12):block('Pen fence rail',0,side*(D/2-.15),h,L-.12,.12,.13,wood)
        for end in (-1,1):
            for h in (.65,1.12):block('Pen end rail',end*(L/2-.15),0,h,.12,D-.12,.13,wood)
        for u in (-L/2+.24,-.4):
            for v in (-D/2+.24,D/2-.24):block('Shelter post',u,v,1.35,.18,.18,2.7,wood)
        block('Reed shelter roof',-L/4,0,2.77,L/2-.15,D-.12,.22,reed)
        for j in range(12):block('Roof reed binding',-L/2+.33+j*(L/2-.4)/12,0,2.90,.05,D-.14,.045,wood,.008)
        block('Feeding trough',0,0,.58,1.6,.60,.50,wood)
        block('Hay',0,0,.87,1.48,.50,.17,linen)
        for j in range(3):
            u=-L/2+1.25+j*3.3;v=(-.65 if j%2 else .60)
            orb('Sheep body',u,v,.86,.65,.35,.39,wool)
            orb('Sheep head',u+.56,v,1.02,.23,.22,.26,animaldark)
            for du in (-.38,.38):
                for dv in (-.21,.21):block('Sheep leg',u+du,v+dv,.49,.09,.09,.42,animaldark)
            for dv in (-.27,.27):orb('Sheep ear',u+.55,v+dv,1.10,.13,.13,.055,wool)
    objects=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
    o=join_objects(objects,f'Wall_{i:03}')
    o['solid_rectangle_tiles']=layout['solid_rectangles_tiles'][i]
    o['village_kind']=kind;o['foundry_id']=solid['id'];o['collision_source']='maps/village/maze-layout.json'
    coords=[o.matrix_world@Vector(c) for c in o.bound_box]
    bounds=[min(c.x for c in coords),-max(c.y for c in coords),max(c.x for c in coords),-min(c.y for c in coords)]
    if max(abs(a-b) for a,b in zip(bounds,solid['rect']))>.001:raise ValueError((solid['id'],bounds,solid['rect']))
    records.append({'name':o.name,'foundry_id':solid['id'],'kind':kind,'rect_m':solid['rect'],'height':max(c.z for c in coords)})

# Arrival shelter occupies the goal cell, with its central crossing kept open.
gx=layout['node_origin_m'][0]+layout['end'][0]*layout['node_pitch_m']
gz=layout['node_origin_m'][1]+layout['end'][1]*layout['node_pitch_m']
before=set(bpy.context.scene.objects)
for dx in (-1.55,1.55):
    for dz in (-1.55,1.55):box('Arrival shelter post',(gx+dx,-(gz+dz),1.5),(.17,.17,3),wood,.025)
box('Arrival shelter canopy',(gx,-gz,3.15),(3.5,3.5,.20),reed,.04)
box('Manger',(gx+1.35,-(gz+1.05),.56),(.65,1.05,.56),wood,.04)
box('Manger straw',(gx+1.35,-(gz+1.05),.88),(.55,.95,.14),linen,.02)
goal=join_objects([o for o in bpy.context.scene.objects if o not in before and o.type=='MESH'],'Arrival_shelter')

bpy.ops.object.light_add(type='SUN',location=(20,20,80))
sun=bpy.context.object;sun.rotation_euler=(.5,-.4,-.4);sun.data.energy=2.5;sun.data.angle=.15
bpy.context.scene.world.color=(.35,.40,.46)
bpy.context.scene.camera=camera('Village overview',(W*1.3,-H*1.6,105),(W/2,-H/2,0),ortho=145)
save_export('village-world')
bpy.context.scene.cycles.samples=16
bpy.context.scene.render.resolution_x=1500;bpy.context.scene.render.resolution_y=1200
bpy.context.scene.render.filepath=str(ROOT/'renders/village-overview.png')
bpy.ops.render.render(write_still=True)
(ROOT/'checks/village-asset-manifest.json').write_text(json.dumps({
 'generator':'Blender '+bpy.app.version_string,'map_sha256':hashlib.sha256(MAP.read_bytes()).hexdigest(),
 'source_map':'maps/village/maze-layout.json','foundry_manifest':'maps/village/foundry-manifest.json',
 'world_units':'metres','blender_axes':'x east, y north, z up','gltf_axes':'x east, y up, z south',
 'solids':records,'bounds_verified':True,'goal_shelter':'Corner posts and offset manger clear both centreline approaches; overhead roof at 3.05m.',
 'provenance':'Original procedural village adaptation; no historical accuracy claim. Character unchanged.'
},indent=2)+'\n')
print('WATCH_GAME_VILLAGE_COMPLETE')
