"""Adapt CC0 artist meshes for V2; never generate human anatomy from primitives.
Run Blender --background --python blender/prepare_free_characters.py.
Sources are cached by scripts/fetch_free_assets.py. Public exports embed textures.
"""
import bpy, bmesh, pathlib, math, json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/free-models'; OUT=ROOT/'public/models-v2'; OUT.mkdir(parents=True,exist_ok=True)
BASE=CACHE/'universal-base-characters/Universal Base Characters[Standard]'
# Read the artist's garment geometry and original skin weights before opening a clean scene.
bpy.ops.wm.open_mainfile(filepath=str(CACHE/'MONK_1.blend'))
robe=bpy.data.objects['Body']; oldrig=bpy.data.objects['Armature']
source_vertices=[(v.co.copy(),[(robe.vertex_groups[g.group].name,g.weight) for g in v.groups if g.weight>.0001])for v in robe.data.vertices]
source_faces=[(list(p.vertices),p.material_index,[tuple(robe.data.uv_layers.active.data[i].uv)for i in p.loop_indices])for p in robe.data.polygons]
source_bones={b.name:(b.head_local.copy(),b.tail_local.copy())for b in oldrig.data.bones}
cloth_image=bpy.data.images['monk-tuc-body'];cloth_image.filepath_raw=str(OUT/'robe-source.png');cloth_image.file_format='PNG';cloth_image.save()
# A single neutral cloth texture retains the authored folds, with a muted linen palette.
import numpy as np
pixels=np.array(cloth_image.pixels[:],dtype=np.float32).reshape((-1,4));lum=pixels[:,:3]@np.array([.2126,.7152,.0722]);pixels[:,:3]=np.clip(.42+lum[:,None]*.66,.0,.93);pixels[:,3]=1
cloth_image.pixels.foreach_set(pixels.ravel());cloth_image.filepath_raw=str(OUT/'robe-neutral.png');cloth_image.save()
MAP={'ToSpine':'pelvis','Spine':'spine_01','Spine1':'spine_03','Neck':'neck_01','Head':'Head','Hips':'pelvis'}
for suffix,side in [('L','l'),('R','r')]:
 for old,new in [('Shoulder','clavicle'),('Arm','upperarm'),('ForeArm','lowerarm'),('Hand','hand'),('UpLeg','thigh'),('Leg','calf'),('Foot','foot'),('ToeBase','ball')]: MAP[old+'_'+suffix]=new+'_'+side

def imported(path):
 old=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path));return [o for o in bpy.data.objects if o not in old and o.name in bpy.context.scene.objects]

def solid_material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.91;return m

def clean_materials(objects):
 for o in objects:
  if o.type!='MESH':continue
  for m in o.data.materials:
   if not m or not m.use_nodes:continue
   # Some source glTFs reference absent *_png normal files. Remove those links.
   for n in list(m.node_tree.nodes):
    if n.type=='TEX_IMAGE' and (not n.image or n.image.size[0]==0):m.node_tree.nodes.remove(n)
   p=m.node_tree.nodes.get('Principled BSDF')
   if p:p.inputs['Roughness'].default_value=.83
 for im in bpy.data.images:
  if im.size[0]>512:im.scale(512,512)

def face_shapes(body,eyes,brows,gender):
 # Small authored adaptations; these are NOT a supplied ARKit or phoneme rig.
 # Geometry has a closed mouth: jaw motion is deliberately restrained.
 def neutral_shape(obj,name):
  # Never capture the currently mixed face into a new expression. Blender's
  # default from_mix=True contaminated blinks with earlier mouth deformations.
  key=obj.shape_key_add(name=name,from_mix=False)
  key.value=0
  return key
 for obj in [body,eyes,brows]:neutral_shape(obj,'Basis')
 eye_height=(min(v.co.z for v in eyes.data.vertices)+max(v.co.z for v in eyes.data.vertices))/2
 face_height_offset=eye_height-1.6985
 jaw=neutral_shape(body,'jawOpen');wide=neutral_shape(body,'mouthWide')
 for v in body.data.vertices:
  x,y,z=v.co; front=max(0,min(1,(-y-.016)/.035)); region=max(0,1-abs(x)/.083)*front
  z-=face_height_offset
  lower=max(0,min(1,(1.68-z)/.035))*max(0,min(1,(z-1.57)/.045))
  jaw.data[v.index].co.z-=.018*region*lower
  jaw.data[v.index].co.y-=.003*region*lower
  lip=max(0,1-abs(z-1.656)/.024)*front
  wide.data[v.index].co.x+=x*.13*lip
 for side in ['Left','Right']:
  shape=neutral_shape(eyes,'eyeBlink'+side)
  for v in eyes.data.vertices:
   if (v.co.x>0)==(side=='Left'):
    shape.data[v.index].co.z=eye_height+(v.co.z-eye_height)*.03
  lid=neutral_shape(body,'eyeBlink'+side)
  for v in body.data.vertices:
   x,y,z=v.co
   z-=face_height_offset
   if (x>0)==(side=='Left') and y<-.048:
    f=max(0,1-abs(abs(x)-.028)/.026)*max(0,1-abs(z-1.704)/.025)
    lid.data[v.index].co.z-=.008*f
 brow=neutral_shape(brows,'browRaise')
 for i,v in enumerate(brows.data.vertices):brow.data[i].co.z+=.006*max(0,1-abs(v.co.x)/.07)

variants=[
 ('teacher','Male','Hair_Long','Hair_Beard',(.86,.80,.66),1.0),
 ('listener-earth','Male','Hair_SimpleParted','Hair_Beard',(.43,.29,.17),1.04),
 ('listener-olive','Male','Hair_Buzzed',None,(.35,.39,.25),.94),
 ('listener-elder','Male','Hair_Long','Hair_Beard',(.53,.48,.37),.97),
 ('listener-woman','Female','Hair_Buns',None,(.54,.37,.26),1.0),
 ('listener-blue','Female','Hair_Long',None,(.30,.38,.41),.94),
]
for name,gender,hair,beard,tint,width in variants:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 objects=imported(BASE/f'Base Characters/Godot - UE/Superhero_{gender}_FullBody.gltf')
 rig=next(o for o in objects if o.type=='ARMATURE');rig.name='Humanoid'
 body=next(o for o in objects if o.type=='MESH' and len(o.data.vertices)>1000);body.name='Body'
 eyes=next(o for o in objects if o.name=='Eyes');brows=next(o for o in objects if o.name=='Eyebrows')
 if gender=='Female':
  oldrig=rig;male=imported(BASE/'Base Characters/Godot - UE/Superhero_Male_FullBody.gltf');rig=next(o for o in male if o.type=='ARMATURE')
  for ob in objects:
   if ob.type=='MESH':
    ob.parent=rig
    for mod in ob.modifiers:
     if mod.type=='ARMATURE':mod.object=rig
  for ob in male:
   if ob!=rig:bpy.data.objects.remove(ob,do_unlink=True)
  bpy.data.objects.remove(oldrig,do_unlink=True);rig.name='Humanoid'
 # Build the sourced garment in the target bind pose, preserving its topology and UVs.
 coords=[];weights=[]
 for co,groups in source_vertices:
  useful=[(MAP[n],w,n)for n,w in groups if n in MAP and MAP[n] in rig.data.bones]
  if not useful: useful=[('pelvis',1,'ToSpine')]
  total=sum(w for _,w,_ in useful);p=Vector((0,0,0));ws={}
  for target,w,old in useful:
   w/=total;sh,st=source_bones[old];b=rig.data.bones[target]
   if old.startswith(('Arm_','ForeArm_','Hand_','Shoulder_')):
    q=(st-sh).normalized().rotation_difference((b.tail_local-b.head_local).normalized());point=b.head_local+q@(co-sh)
   else:point=co+(b.head_local-sh)
   p+=point*w;ws[target]=ws.get(target,0)+w
  # Preserve the authored skirt silhouette; only its weights need the rig remap.
  if co.z<1.12:p=co.copy()
  # Allow cloth clearance around the more athletic source torso.
  if p.z>1.05 and abs(p.x)<.29:p.x*=1.12;p.y=.045+(p.y-.045)*1.17
  # Tuck the wide source skirt waist beneath the fitted tunic.
  f=max(0,min(1,(p.z-.72)/.24));p.x*=1-.38*f;p.y=.045+(p.y-.045)*(1-.42*f)
  p.z+=.12*f
  coords.append(p);weights.append(ws)
 # Discard source hands / boot polygons; the Quaternius body supplies proper feet and fingers.
 faces=[];uvs=[]
 for indices,mat,uv in source_faces:
  if mat!=0 or min(source_vertices[i][0].z for i in indices)<.12 or max(source_vertices[i][0].z for i in indices)>1.10:continue
  if any(sum(w for n,w in source_vertices[i][1] if n.startswith(('Shoulder_','Arm_','ForeArm_','Hand_','f_','thumb')))>.05 for i in indices):continue
  faces.append(indices);uvs.append(uv)
 mesh=bpy.data.meshes.new('CDmir robe adapted');mesh.from_pydata(coords,[],faces);mesh.update();garment=bpy.data.objects.new('Robe',mesh);bpy.context.collection.objects.link(garment)
 uv=mesh.uv_layers.new(name='UVMap')
 for poly,values in zip(mesh.polygons,uvs):
  for idx,value in zip(poly.loop_indices,values):uv.data[idx].uv=value
 for bone in rig.data.bones:garment.vertex_groups.new(name=bone.name)
 for i,ws in enumerate(weights):
  for n,w in ws.items():garment.vertex_groups[n].add([i],w,'REPLACE')
 # Remove unused source vertices so bounds/weight checks reflect actual cloth.
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS');bm.to_mesh(mesh);bm.free()
 garment.parent=rig;mod=garment.modifiers.new('Skin','ARMATURE');mod.object=rig
 cloth=solid_material('Woven linen',tint);tex=cloth.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'robe-neutral.png'))
 mix=cloth.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*tint,1);cloth.node_tree.links.new(tex.outputs['Color'],mix.inputs[1]);cloth.node_tree.links.new(mix.outputs['Color'],cloth.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 # glTF does not export arbitrary shader multiplication. Tint the source pixels explicitly.
 im=tex.image.copy();px=np.array(im.pixels[:],dtype=np.float32).reshape((-1,4));px[:,:3]*=np.array(tint);im.pixels.foreach_set(px.ravel());im.filepath_raw=str(OUT/(name+'-cloth.png'));im.file_format='PNG';im.save();tex.image=im
 cloth.node_tree.links.new(tex.outputs['Color'],cloth.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);garment.data.materials.append(cloth)
 for ob in [body,eyes,brows,garment]:
  for p in ob.data.polygons:p.use_smooth=True
 # Use matching Quaternius peasant sleeves/tunic above the adapted skirt.
 # The original garment's shoulders fit a different body; mixing matched parts avoids that retopology.
 outfit=next((CACHE/'modular-character-outfits-fantasy').rglob('Male_Peasant.gltf'))
 more=imported(outfit)
 for ob in more:
  if ob.type=='MESH':
   if not ('Body' in ob.name or 'Arms' in ob.name):bpy.data.objects.remove(ob,do_unlink=True);continue
   if 'Body' in ob.name:
    bm=bmesh.new();bm.from_mesh(ob.data)
    # Remove the fantasy belt/buckle and split shirt tails below the natural waist.
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z<1.115],context='VERTS');bm.to_mesh(ob.data);bm.free()
   ob.parent=rig
   for mod in ob.modifiers:
    if mod.type=='ARMATURE':mod.object=rig
   for mi,mat in enumerate(ob.data.materials):
    if len(ob.data.materials)==1 or mi==0:ob.data.materials[mi]=cloth
   for poly in ob.data.polygons:poly.use_smooth=True
  elif ob.type=='ARMATURE':bpy.data.objects.remove(ob,do_unlink=True)
 # A small, plain cloth sash bridges the join between the two authors' garments.
 # This is a local clothing adaptation, not generated human anatomy.
 points=[];faces=[];N=48
 for row,(z,rx,ry) in enumerate([(1.005,.237,.195),(1.08,.237,.19),(1.17,.223,.185)]):
  for i in range(N):
   a=i/N*math.tau;fold=.003*math.sin(a*7)
   points.append(((rx+fold)*math.cos(a),.045+(ry+fold)*math.sin(a),z+.006*math.sin(a*2)))
 for row in range(2):
  for i in range(N):faces.append((row*N+i,row*N+(i+1)%N,(row+1)*N+(i+1)%N,(row+1)*N+i))
 mesh=bpy.data.meshes.new('Cloth sash');mesh.from_pydata(points,[],faces);mesh.update();sash=bpy.data.objects.new('Cloth sash',mesh);bpy.context.collection.objects.link(sash);sash.parent=rig
 for n in ['pelvis','spine_01']:sash.vertex_groups.new(name=n)
 for v in mesh.vertices:
  f=max(0,min(1,(v.co.z-1.00)/.23));sash.vertex_groups['pelvis'].add([v.index],1-f,'REPLACE');sash.vertex_groups['spine_01'].add([v.index],f,'REPLACE')
 mod=sash.modifiers.new('Skin','ARMATURE');mod.object=rig;sash.data.materials.append(solid_material('Dark woven sash',(.12,.085,.05)))
 uv=sash.data.uv_layers.new(name='UVMap')
 for poly in mesh.polygons:
  for idx in poly.loop_indices:
   vertex=mesh.loops[idx].vertex_index;uv.data[idx].uv=((vertex%N)/N,(vertex//N)/2)
 for poly in mesh.polygons:poly.use_smooth=True
 # Omit occluded faces rather than letting the underlying body poke through the clothing.
 # The visible neck and lower legs overlap the garments; skeleton and garment remain continuous.
 bm=bmesh.new();bm.from_mesh(body.data)
 remove=[v for v in bm.verts if (.48<v.co.z<1.53 and not (abs(v.co.x)<.095 and v.co.z>1.32)) or (abs(v.co.x)>.16 and v.co.z>1.4 and v.co.z<1.59)]
 bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(body.data);bm.free()
 for v in body.data.vertices:
  if v.co.z<1.53 and v.co.z>1.32 and abs(v.co.x)<.10:v.co.y=max(v.co.y,.015)
 for h in [hair,beard]:
  if not h:continue
  path=BASE/f'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/{h}.gltf'
  more=imported(path)
  for ob in more:
   if ob.type=='MESH':
    ob.parent=rig
    for m in ob.modifiers:
     if m.type=='ARMATURE':m.object=rig
    if h!=beard:
     offset=max(v.co.z for v in body.data.vertices)+.018-max(v.co.z for v in ob.data.vertices)
     for v in ob.data.vertices:v.co.z+=offset
    ob.data.materials.clear();ob.data.materials.append(solid_material('Hair',(.29,.27,.23) if name=='listener-elder' else (.075,.038,.019)))
   elif ob.type=='ARMATURE':bpy.data.objects.remove(ob,do_unlink=True)
 face_shapes(body,eyes,brows,gender)
 for ob in [body,eyes,brows]:
  for key in ob.data.shape_keys.key_blocks:key.value=0
 brows.data.materials.clear();brows.data.materials.append(solid_material('Brows',(.055,.025,.012)))
 # Variation changes proportions on the whole skinned assembly, never disconnected limbs.
 rig.scale.x=width
 clean_materials([o for o in bpy.context.scene.objects if o.type=='MESH'])
 for ob in bpy.context.scene.objects:
  if ob.type=='MESH' and any(m.type=='ARMATURE'for m in ob.modifiers):ob.select_set(True)
  else:ob.select_set(ob==rig)
 bpy.context.view_layer.objects.active=rig
 rig['asset_origin']='Quaternius CC0 human/hair + CDmir/TinyWorlds CC0 robe';rig['facial_controls']='Locally adapted subtle jaw, mouth width, blink and brow morphs; not phoneme accurate'
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_extras=True,export_yup=True,export_image_format='JPEG',export_jpeg_quality=85,export_morph=True)
 if name=='teacher':bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/v2-teacher.blend'))
 print('EXPORTED',name,flush=True)
# Keep only runtime GLBs here. Source texture extracts are reproducible intermediates.
for p in OUT.glob('*.png'):p.unlink()
