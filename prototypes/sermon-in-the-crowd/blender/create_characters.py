"""Original articulated low-poly character library. Metres, +Z forward after glTF export."""
import bpy, math, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.92;return m
leather=mat('worn leather',(.15,.09,.05));eye=mat('eyes',(.022,.016,.012));mouth=mat('mouth interior',(.11,.035,.025))
parts={};active='torso'
def add(o,m):o.data.materials.append(m);parts.setdefault(active,[]).append(o);return o

def sphere(n,p,s,m,seg=12,rings=8):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=p);o=bpy.context.object;o.name=n;o.scale=s;return add(o,m)
def link(n,a,b,r1,r2,m):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=r1,radius2=r2,depth=d.length,location=(Vector(a)+Vector(b))/2);o=bpy.context.object;o.name=n;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return add(o,m)
def mesh(n,v,f,m):
 me=bpy.data.meshes.new(n);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);return add(o,m)
def rings(n,rr,m):
 v=[];count=24
 for z,rx,ry in rr:
  for i in range(count):
   a=i*math.tau/count;p=1+.055*math.cos(a*12);v.append((rx*math.cos(a)*p,ry*math.sin(a)*p,z))
 f=[tuple(reversed(range(count)))]
 for j in range(len(rr)-1):
  for i in range(count):f.append((j*count+i,j*count+(i+1)%count,(j+1)*count+(i+1)%count,(j+1)*count+i))
 f.append(tuple((len(rr)-1)*count+i for i in range(count)));return mesh(n,v,f,m)
def character(name,index,sex='male',age=35,stock=1,face=1,hood=False):
 global active,parts
 parts={};random.seed(441+index)
 robeColors=[(.75,.68,.52),(.40,.28,.17),(.36,.39,.28),(.43,.25,.19),(.30,.36,.39),(.64,.57,.44),(.39,.32,.27),(.48,.40,.27),(.47,.34,.28),(.37,.40,.36),(.56,.48,.36)]
 robe=mat(name+' linen',robeColors[index]);cloak=mat(name+' mantle',tuple(c*.78 for c in robeColors[(index+3)%len(robeColors)]));skin=mat(name+' skin',[(.48,.31,.20),(.39,.24,.145),(.55,.365,.23),(.45,.28,.16)][index%4]);hair=mat(name+' hair',(.36,.34,.30) if age>60 else (.065+.014*(index%3),.040,.025))
 width=.24*stock;fz=1.615;fw=.117*face;fy=.107 if index%2 else .098;headh=.155*(1+(index%3-1)*.07)
 active='torso';rings('tunic',[(.17,width*1.1,.17),(.48,width*1.06,.18),(.82,width*.90,.145),(1.03,width*.81,.135),(1.29,width,.15),(1.40,width*.91,.13),(1.44,.105,.09)],robe)
 sphere('neck',(0,0,1.455),(.071,.075,.095),skin)
 # Short mantle over shoulders with a draped back, separated from the arms.
 v=[]
 for j in range(7):
  z=1.42-j*.15
  for i in range(13):
   a=i*math.pi/12;v.append(((width+.015)*math.cos(a),.18*math.sin(a)+.013*math.sin(j+i),z))
 mesh('mantle folds',v,[(j*13+i,j*13+i+1,(j+1)*13+i+1,(j+1)*13+i) for j in range(6) for i in range(12)],cloak)
 bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=5,location=(0,0,1.02),major_radius=width*.85,minor_radius=.012);o=bpy.context.object;o.scale.y=.14/(width*.85);add(o,leather)
 link('hanging cord',(.05,-.151,1.025),(.08,-.185,.79),.009,.009,leather)
 active='head';sphere('face',(0,-.004,fz),(fw,fy,headh),skin,16,10)
 sphere('hair crown',(0,.018,1.687),(fw*1.06,fy*.99,.108),hair,14,8)
 if not hood:
  if index==0 or sex=='female':sphere('long hair',(0,.073,1.59),(fw*1.08,.068,.17),hair)
  elif age<60:
   for i in range(7):sphere('hair curl',((random.random()-.5)*.17,(random.random()-.5)*.13,1.726+random.random()*.035),(.045,.034,.039),hair,8,6)
 sphere('nose',(0,-fy-.012,1.608),(.021+(index%3)*.004,.031+(index%2)*.008,.038),skin,10,6)
 for side in [-1,1]:
  sphere('ear',(side*fw,0,1.62),(.020,.022,.038),skin,8,6)
  sphere('eye socket',(side*fw*.39,-fy*.91,1.647),(.023,.01,.015),skin)
  sphere('eye',(side*fw*.39,-fy*.995,1.647),(.011,.008,.0065),eye,8,6)
  link('brow',(side*fw*.23,-fy,1.669),(side*fw*.56,-fy*.94,1.672),.008,.007,hair)
 sphere('upper lip',(0,-fy*.94,1.553),(.035,.014,.009),skin,12,6)
 sphere('mouth opening',(0,-fy*.96,1.541),(.030,.011,.011),mouth,12,6)
 if age>60:
  for side in [-1,1]:link('cheek crease',(side*.07,-fy*.90,1.59),(side*.052,-fy*.94,1.555),.003,.002,cloak)
 if hood:
  v=[]
  for j in range(8):
   for i in range(15):
    a=-.28+i*(math.pi+.56)/14;r=.135 if j<2 else .16+.007*j;v.append((r*math.cos(a),r*math.sin(a)+.023,1.776-j*.055))
  mesh('open face head cloth',v,[(j*15+i,j*15+i+1,(j+1)*15+i+1,(j+1)*15+i) for j in range(7) for i in range(14)],cloak)
 active='jaw';sphere('chin',(0,-.022,1.517),(.076*face,.078,.037),skin)
 if sex=='male' and (index==0 or index%3!=2):
  sphere('beard',(0,-.043,1.521),(.085*face,.071,.068 if age<60 else .10),hair,14,8)
  # A moustache belongs to the head, so the beard/jaw can visibly articulate.
  active='head';sphere('moustache',(0,-fy*.95,1.564),(.057,.018,.018),hair,12,6)
 active='blink';
 for side in [-1,1]:sphere('eyelid',(side*fw*.39,-fy*1.045,1.647),(.014,.006,.012),skin,8,6)
 joints={'torso':((0,0,1.01),None),'head':((0,0,1.455),'torso'),'jaw':((0,0,1.55),'head'),'blink':((0,0,1.647),'head')}
 for side,label in [(-1,'left'),(1,'right')]:
  shoulder=(side*width*.95,0,1.35);elbow=(side*(width+.092),-.018,1.08);wrist=(side*(width+.105),-.065,.855)
  active='arm_'+label;link('loose upper sleeve',elbow,shoulder,.091,.115,robe)
  active='forearm_'+label;link('forearm',elbow,wrist,.059,.039,skin);sphere('hand',(wrist[0],wrist[1]-.007,wrist[2]-.035),(.043,.033,.079),skin)
  sphere('thumb',(wrist[0]-side*.036,wrist[1]-.005,wrist[2]-.025),(.019,.023,.042),skin,8,6)
  active='leg_'+label;link('lower leg',(side*.125,0,.12),(side*.125,0,.46),.045,.066,skin)
  active='foot_'+label;sphere('sandal',(side*.125,-.05,.058),(.080,.158,.027),leather);sphere('toes',(side*.125,-.061,.091),(.067,.125,.034),skin)
  link('sandal strap',(side*.125-.06,-.1,.12),(side*.125+.06,-.1,.12),.014,.014,leather)
  joints['arm_'+label]=(shoulder,'torso');joints['forearm_'+label]=(elbow,'arm_'+label);joints['leg_'+label]=((side*.125,0,.72),None);joints['foot_'+label]=((side*.125,0,.11),'leg_'+label)
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root);nodes={}
 for key,(pivot,parent) in joints.items():
  n=bpy.data.objects.new(name+'_'+key,None);bpy.context.collection.objects.link(n);n['joint']=key;n.parent=nodes[parent] if parent else root;n.location=Vector(pivot)-(Vector(joints[parent][0]) if parent else Vector((0,0,0)));nodes[key]=n
 bpy.context.view_layer.update()
 for key,objects in parts.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);bpy.ops.object.join();o=bpy.context.object;o.name=name+'_'+key+'_mesh'
  world=o.matrix_world.copy();o.parent=nodes[key];o.matrix_world=world
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in root.children_recursive:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/f'{name}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
 root.location.x=index*2.2
character('jesus',0)
character('listener-ochre',1,stock=1.20,face=1.07)
character('listener-sage',2,sex='female',stock=.87,face=.93,hood=True)
character('listener-clay',3,age=67,stock=.87,face=.95)
character('listener-blue',4,sex='female',stock=1.10,face=1.08,hood=True)
character('listener-linen',5,age=24,stock=.83,face=.88)
character('listener-elder',6,age=75,stock=.96,face=1.06,hood=True)
character('listener-broad',7,age=48,stock=1.28,face=1.16)
character('listener-young',8,age=19,stock=.82,face=.87)
character('listener-woman',9,sex='female',age=46,stock=1.04,face=.96,hood=True)
character('listener-traveller',10,age=42,stock=.94,face=1.02)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/sermon-characters.blend'))
print('11 articulated models exported')
