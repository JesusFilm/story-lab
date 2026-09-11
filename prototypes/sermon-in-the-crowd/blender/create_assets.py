"""Rebuild original low-poly assets: blender -b --python blender/create_assets.py."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
random.seed(612)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1)
 m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.94
 return m
linen=mat('Unbleached linen',(.66,.58,.42)); skin=mat('Warm olive skin',(.45,.285,.17)); hair=mat('Dark brown hair',(.055,.033,.022)); leather=mat('Leather and cord',(.14,.08,.042)); leaf=mat('Olive leaves',(.23,.30,.13)); wood=mat('Weathered olive wood',(.23,.19,.12)); clay=mat('Earthenware',(.45,.235,.13))
def mesh(name,verts,faces,material):
 me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update(); o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o); o.data.materials.append(material); return o

def ellipsoid(name,loc,scale,material,seg=12,rings=8):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc); o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(material); return o

def link(name,a,b,r1,r2,material,vertices=10):
 d=Vector(b)-Vector(a); bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=d.length,location=(Vector(a)+Vector(b))/2); o=bpy.context.object; o.name=name; o.rotation_euler=d.to_track_quat('Z','Y').to_euler(); o.data.materials.append(material); return o

def garment(name,rings,material):
 verts=[]; n=20
 for z,rx,ry in rings:
  for i in range(n):
   a=i*math.tau/n; pleat=1+.045*math.cos(a*10); verts.append((rx*math.cos(a)*pleat,ry*math.sin(a)*pleat,z))
 faces=[tuple(reversed(range(n)))]
 for j in range(len(rings)-1):
  for i in range(n): faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
 return mesh(name,verts,faces,material)

assets=[]
def export(name,start):
 obs=[o for o in bpy.context.scene.objects if o not in start and o.type=='MESH']
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0]; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); bpy.ops.object.join(); o=bpy.context.object; o.name=name
 # glTF uses metres, Y up. Character forward is Blender -Y => glTF +Z.
 bpy.context.scene.cursor.location=(0,0,0); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/f'{name}.glb'),export_format='GLB',use_selection=True,export_apply=True)
 assets.append(o); o.location.x=len(assets)*3
 return o

def person(name,robe_color,mantle_color,hood=False,teacher=False):
 start=set(bpy.context.scene.objects); robe=mat(name+' tunic',robe_color); mantle=mat(name+' mantle',mantle_color)
 garment('Pleated ankle length tunic',[(.13,.25,.16),(.35,.28,.18),(.75,.23,.15),(1.05,.20,.135),(1.36,.25,.145),(1.43,.12,.12)],robe)
 ellipsoid('Neck',(0,0,1.46),(.073,.078,.10),skin)
 ellipsoid('Head',(0,-.005,1.62),(.118,.102,.158),skin)
 ellipsoid('Hair cap',(0,.018,1.69),(.122,.099,.108),hair)
 if teacher or not hood:
  ellipsoid('Back hair',(0,.066,1.58),(.126,.065,.16 if teacher else .095),hair)
  ellipsoid('Beard',(0,-.061,1.53),(.087,.068,.069),hair)
 ellipsoid('Nose',(0,-.11,1.615),(.025,.034,.039),skin,8,6)
 for x in [-.042,.042]:
  ellipsoid('Eye',(x,-.099,1.651),(.013,.009,.007),hair,8,4)
  ellipsoid('Ear',(x/abs(x)*.116,0,1.62),(.016,.026,.038),skin,8,6)
 for side in [-1,1]:
  shoulder=(side*.225,0,1.33); elbow=(side*.32,-.025,1.05); wrist=(side*(.48 if teacher and side==1 else .32),-.20 if teacher and side==1 else -.09,1.19 if teacher and side==1 else .86)
  link('Loose sleeve',elbow,shoulder,.105,.13,robe,12); link('Forearm',elbow,wrist,.06,.045,skin)
  ellipsoid('Hand',wrist,(.047,.035,.078),skin)
  ellipsoid('Sandal',(side*.13,-.055,.065),(.095,.17,.035),leather)
  ellipsoid('Foot',(side*.13,-.065,.10),(.073,.137,.039),skin)
  link('Sandal strap',(side*.13-.065,-.11,.13),(side*.13+.065,-.11,.13),.015,.015,leather,6)
 # A draped rectangular mantle leaves the front of the tunic visible.
 verts=[]
 for j in range(8):
  z=1.42-j*.15
  for i in range(9):
   a=math.pi*i/8; verts.append((.275*math.cos(a),.17*math.sin(a)+.018*math.sin(j*2+i),z))
 faces=[(j*9+i,j*9+i+1,(j+1)*9+i+1,(j+1)*9+i) for j in range(7) for i in range(8)]
 o=mesh('Draped mantle',verts,faces,mantle); mod=o.modifiers.new('Cloth thickness','SOLIDIFY'); mod.thickness=.007
 if hood:
  # Open face hood: rings travel around sides and back, never covering face.
  verts=[]
  for j in range(8):
   z=1.77-j*.075; r=.11+(.04 if j<3 else .08)
   for i in range(11):
    a=-.12+math.pi*1.24*i/10; verts.append((r*math.cos(a),r*math.sin(a),z))
  mesh('Head cloth',verts,[(j*11+i,j*11+i+1,(j+1)*11+i+1,(j+1)*11+i) for j in range(7) for i in range(10)],mantle)
 # Belt at waist with a hanging rope end.
 bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,location=(0,0,1.025),major_radius=.207,minor_radius=.012); o=bpy.context.object; o.scale.y=.69; o.data.materials.append(leather)
 link('Belt end',(.05,-.145,1.03),(.07,-.17,.75),.009,.009,leather,6)
 return export(name,start)
person('jesus',(.76,.69,.53),(.72,.64,.48),teacher=True)
person('listener-ochre',(.40,.28,.16),(.56,.46,.31))
person('listener-sage',(.32,.37,.25),(.52,.53,.40),True)
person('listener-clay',(.43,.24,.18),(.30,.22,.18))
person('listener-blue',(.30,.34,.35),(.40,.44,.44),True)
person('listener-linen',(.65,.59,.47),(.39,.32,.23),True)
start=set(bpy.context.scene.objects)
link('Twisted trunk',(0,0,0),(.15,.06,2.6),.25,.095,wood,9)
for i in range(8):
 a=i*math.tau/8; tip=(math.cos(a)*(1.4+random.random()*.6),math.sin(a)*1.65,2.6+random.random()*.9)
 link('Branch',(.13,0,1.5+random.random()*.8),tip,.075,.018,wood,7)
 for j in range(4):
  p=Vector(tip)+Vector((random.uniform(-.5,.5),random.uniform(-.5,.5),random.uniform(-.25,.3)))
  ellipsoid('Silver olive canopy',p,(.72,.63,.42),leaf,9,5)
export('olive',start)
start=set(bpy.context.scene.objects)
garment('Clay jar',[(0,.14,.14),(.1,.25,.25),(.38,.27,.27),(.56,.13,.13),(.65,.13,.13)],clay)
bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,location=(0,0,.65),major_radius=.13,minor_radius=.018); bpy.context.object.data.materials.append(clay)
export('jar',start)
# Source asset library is intentionally editable and contains all original components.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/sermon-assets.blend'))
print('ASSETS COMPLETE:',len(assets))
