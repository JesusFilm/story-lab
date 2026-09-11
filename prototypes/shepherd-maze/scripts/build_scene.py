"""Blender 5.1: create original editable prototype assets; never edits source references."""
import bpy, math, json, random, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / 'map/maze-layout.json'
layout = json.loads(MAP.read_text())
for folder in ('assets', 'renders', 'checks'):
    (ROOT / folder).mkdir(exist_ok=True)

def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.materials):
        if block.users == 0: bpy.data.materials.remove(block)

def mat(name, color, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = .74
    bsdf.inputs['Metallic'].default_value = metallic
    return m

def finish(obj, name, material, parent=None, smooth=False):
    obj.name = name
    obj.data.materials.append(material)
    if parent: obj.parent = parent
    if smooth:
        for p in obj.data.polygons: p.use_smooth = True
    return obj

def box(name, loc, scale, material, bevel=.06, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Soft edges', 'BEVEL'); mod.width = bevel; mod.segments = 2
        o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return finish(o, name, material, parent)

def sphere(name, loc, scale, material, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1, location=loc)
    o = bpy.context.object; o.scale = scale
    return finish(o, name, material, parent, True)

def cone(name, loc, r1, r2, depth, material, parent=None):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r1, radius2=r2, depth=depth, location=loc)
    return finish(bpy.context.object, name, material, parent, True)

def empty(name, loc=(0,0,0), parent=None):
    o = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(o)
    o.location = loc; o.parent = parent; return o

def curve(name, points, radius, material, parent=None):
    c = bpy.data.curves.new(name, 'CURVE'); c.dimensions='3D'; c.bevel_depth=radius; c.bevel_resolution=3
    s = c.splines.new('BEZIER'); s.bezier_points.add(len(points)-1)
    for p, co in zip(s.bezier_points, points):
        p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o)
    c.materials.append(material); o.parent=parent
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return o

def camera(name, loc, target, lens=48, ortho=None):
    bpy.ops.object.camera_add(location=loc)
    o=bpy.context.object; o.name=name
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    o.data.lens=lens
    if ortho: o.data.type='ORTHO'; o.data.ortho_scale=ortho
    return o

def lighting():
    scene=bpy.context.scene
    scene.world.color=(.25,.28,.35)
    for name, loc, energy, size, color in [
        ('Warm key', (4,-6,9), 1100, 7, (1,.84,.67)),
        ('Cool fill', (-4,-2,5), 800, 6, (.7,.84,1)),
        ('Rim', (1,4,7), 1400, 5, (1,.74,.46))]:
        bpy.ops.object.light_add(type='AREA',location=loc)
        o=bpy.context.object; o.name=name; o.data.energy=energy; o.data.shape='DISK'; o.data.size=size; o.data.color=color
        o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()

def save_export(name):
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.samples=24
    scene.render.resolution_x=1400; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    scene.render.image_settings.file_format='PNG'
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets'/f'{name}.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for o in scene.objects:
        if o.type in {'MESH','EMPTY'} and not o.get('render_only'): o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets'/f'{name}.glb'), export_format='GLB',
        use_selection=True, export_apply=True, export_animations=False, export_extras=True)

reset()
skin=mat('Honey clay skin',(.55,.30,.16)); hair=mat('Espresso curls',(.065,.034,.022))
robe=mat('Linen',(.83,.74,.55)); vest=mat('Sage wool',(.16,.30,.27))
leather=mat('Chestnut leather',(.22,.095,.04)); eye=mat('Dark eyes',(.027,.025,.019))
white=mat('Eye whites',(.95,.9,.78)); gold=mat('Brass buckle',(.72,.43,.12),.45)
root=empty('Shepherd')
torso=cone('Linen tunic',(0,0,1.04),.39,.26,.84,robe,root); torso.scale.y=.77
sphere('Torso',(0,0,1.39),(.32,.22,.31),robe,root)
for side in (-1,1):
    sphere('Vest panel',(.20*side,-.09,1.4),(.125,.19,.31),vest,root)
sphere('Vest back',(0,.145,1.4),(.30,.10,.30),vest,root)
belt=cone('Belt',(0,0,1.12),.355,.345,.10,leather,root); belt.scale.y=.8
box('Buckle',(0,-.291,1.12),(.13,.045,.11),gold,.02,root)
cone('Neck',(0,0,1.7),.115,.115,.23,skin,root)
sphere('Head',(0,-.01,1.93),(.28,.245,.33),skin,root)
sphere('Hair cap',(0,.035,2.075),(.284,.244,.225),hair,root)
for side in (-1,1):
    sphere('Ear',(.274*side,-.01,1.94),(.065,.048,.10),skin,root)
    sphere('Eye white',(.105*side,-.225,1.98),(.066,.031,.047),white,root)
    sphere('Eye pupil',(.105*side,-.254,1.98),(.03,.017,.033),eye,root)
    sphere('Eye glint',(.098*side,-.267,1.994),(.009,.006,.01),white,root)
    brow=sphere('Eyebrow',(.10*side,-.228,2.055),(.073,.032,.02),hair,root)
    brow.rotation_euler.y=.1*side
sphere('Nose',(0,-.253,1.92),(.048,.063,.065),skin,root)
sphere('Beard',(0,-.08,1.77),(.23,.19,.15),hair,root)
sphere('Muzzle',(0,-.22,1.827),(.09,.024,.03),skin,root)
for side in (-1,1): sphere('Moustache',(.054*side,-.242,1.85),(.064,.032,.027),hair,root)
rng=random.Random(21)
for i in range(22):
    a=i*math.tau/22
    sphere('Curl',(.244*math.cos(a),.018+.208*math.sin(a),2.13+rng.uniform(-.045,.04)),(.072,.071,.072),hair,root)
for side,label in [(-1,'L'),(1,'R')]:
    arm=empty('Arm'+label,(side*.35,0,1.55),root)
    sphere('Sleeve'+label,(side*.045,0,-.14),(.13,.13,.24),robe,arm)
    sphere('Forearm'+label,(side*.075,-.018,-.40),(.078,.09,.17),skin,arm)
    sphere('Hand'+label,(side*.08,-.027,-.54),(.082,.065,.10),skin,arm)
    leg=empty('Leg'+label,(side*.15,0,.72),root)
    sphere('Calf'+label,(0,0,-.27),(.09,.09,.28),skin,leg)
    cone('Ankle'+label,(0,0,-.56),.067,.068,.20,skin,leg)
    sphere('Sandal'+label,(0,-.09,-.65),(.13,.215,.067),leather,leg)
    box('Sandal strap'+label,(0,-.11,-.58),(.20,.08,.05),robe,.02,leg)
    if side==1:
        curve('Crook',[(.12,-.09,-1.42),(.12,-.09,-.3),(.12,-.09,.42),(.18,-.09,.62),(.37,-.09,.63),(.46,-.09,.46),(.40,-.09,.34)],.033,leather,arm)
lighting()
ground=box('Studio ground',(0,0,-.13),(200,200,.15),mat('Studio sand',(.14,.19,.20)),0); ground['render_only']=True
bpy.context.scene.camera=camera('Front-on character',(0,-6.7,2.85),(0,0,1.13),60)
save_export('shepherd-prototype')
bpy.context.scene.render.resolution_x=1000; bpy.context.scene.render.resolution_y=1200
bpy.context.scene.render.filepath=str(ROOT/'renders/character-front.png')
bpy.ops.render.render(write_still=True)

reset()
walls=[mat('Sandstone '+str(i),c) for i,c in enumerate([(.53,.40,.27),(.62,.48,.32),(.69,.53,.36),(.57,.45,.32)])]
cap=mat('Limestone caps',(.78,.67,.49)); roof=mat('Terracotta',(.43,.23,.14))
door=mat('Muted teal doors',(.085,.22,.21)); dark=mat('Deep window recess',(.085,.085,.062))
sand=mat('Warm dusty ground',(.38,.32,.23)); base=mat('Diorama edge',(.13,.18,.19))
wood=mat('Timber',(.24,.12,.05)); ochre=mat('Golden arrival',(.9,.55,.12))
box('Diorama plinth',(70,-70,-1),(167,169,1.8),base,.8)
box('Ground',(70,-70,-.08),(164,166,.16),sand,.1)
rect_meta=[]
for i,(x,y,x2,y2) in enumerate(layout['solid_rectangles_tiles']):
    w,d=(x2-x)*4,(y2-y)*4; cx,cz=(x+x2)*2,(y+y2)*2
    perimeter=x==0 or y==0 or x2==35 or y2==35
    h=2.2 if perimeter else [2.7,3.1,2.5,3.4,2.9][i%5]
    o=box(f'Wall_{i:03}',(cx,-cz,h/2),(w,d,h),walls[i%4],.055)
    o['solid_rectangle_tiles']=[x,y,x2,y2]; o['collision_source']='maze-layout.json'
    rect_meta.append({'name':o.name,'rect_tiles':[x,y,x2,y2],'height':h})
    box(f'Cap_{i:03}',(cx,-cz,h+.07),(w-.14,d-.14,.14),cap,.045)
    if perimeter: continue
    # All decoration remains inside the canonical footprint.
    for j in range(max(1,int(w/5))):
        wx=x*4+min(w-.7,1.1+j*5)
        box('Window',(wx,-(y2*4-.025),1.65),(.62,.045,.72),dark,.035)
        box('Lintel',(wx,-(y2*4-.06),2.08),(.83,.13,.13),cap,.03)
    box('Door',(cx,-(y2*4-.02),.70),(.85,.04,1.4),door,.06)
    if i%9==0:
        sphere('Roof dome',(cx,-cz,h+.11),(min(w/2-.3,1.7),min(d/2-.3,1.7),.95),cap)
    elif i%7==0:
        cone('Roof jar',(cx,-cz,h+.35),.31,.22,.56,roof)
    elif i%6==0:
        box('Upper room',(cx,-cz,h+.40),(min(w-.5,2.5),min(d-.5,2.5),.65),walls[(i+1)%4],.08)

# Requested cars are contemporary shape studies on the southern apron, outside the map.
rubber=mat('Tyres',(.038,.048,.048)); glass=mat('Car glass',(.11,.25,.29),.2)
for i,(x,z,c) in enumerate([(21,147,(.19,.37,.36)),(39,146,(.64,.29,.13)),(58,147,(.72,.60,.38))]):
    paint=mat('Car paint '+str(i),c)
    box(f'Car_{i}_body',(x,-z,.75),(2.2,4,.7),paint,.24)
    box('Car cabin',(x,-(z-.2),1.38),(1.85,2.1,.85),glass,.24)
    box('Car roof',(x,-(z-.2),1.82),(1.88,2.08,.15),paint,.09)
    for sx in (-1,1):
        for sz in (-1,1):
            wheel=cone('Wheel',(x+sx*1.05,-(z+sz*1.25),.46),.43,.43,.24,rubber)
            wheel.rotation_euler.y=math.pi/2
    for sx in (-1,1): box('Headlight',(x+sx*.67,-(z+2.01),.8),(.46,.045,.22),cap,.045)

# Small open stall beyond the north exit. It does not obstruct the destination node.
for x in (131.9,136.1):
    for z in (-4.8,-.5): box('Stall post',(x,-z,1.4),(.24,.24,2.8),wood,.03)
box('Stall roof',(134,2.7,2.95),(5,5.4,.25),wood,.06)
box('Manger',(134,3.7,.55),(1.4,.7,.5),ochre,.1)

# Batch decorative surfaces by material to keep the exported draw-call count modest.
protected={m['name'] for m in rect_meta} | {'Diorama plinth','Ground'}
groups={}
for o in list(bpy.context.scene.objects):
    if o.type=='MESH' and o.name not in protected:
        groups.setdefault(o.data.materials[0].name,[]).append(o)
for name,objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True); bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join(); bpy.context.object.name='Details_'+name.replace(' ','_')

bpy.ops.object.light_add(type='SUN', location=(20,20,80))
sun=bpy.context.object; sun.rotation_euler=(.5,-.4,-.4); sun.data.energy=3; sun.data.angle=.12
bpy.context.scene.world.color=(.3,.36,.42)
bpy.context.scene.camera=camera('World overview',(182,-210,180),(70,-70,0),ortho=244)
save_export('maze-world')
bpy.context.scene.render.resolution_x=1500; bpy.context.scene.render.resolution_y=1500
bpy.context.scene.render.filepath=str(ROOT/'renders/maze-overview.png')
bpy.ops.render.render(write_still=True)
(ROOT/'checks/asset-manifest.json').write_text(json.dumps({
    'generator':'Blender '+bpy.app.version_string,'map_sha256':hashlib.sha256(MAP.read_bytes()).hexdigest(),
    'source_map':str(MAP.relative_to(ROOT)),'world_units':'metres',
    'blender_axes':'x east, y north, z up','gltf_axes':'x east, y up, z south',
    'solid_rectangles':rect_meta,'cars':'3 static blockouts south of maze, outside its 140m footprint',
    'character':'Original procedural smooth prototype; articulated object pivots, no skin rig',
    'point_1':'Existing end node [16, 0], provisional interpretation'
},indent=2)+'\n')
print('WATCH_GAME_ASSETS_COMPLETE')
