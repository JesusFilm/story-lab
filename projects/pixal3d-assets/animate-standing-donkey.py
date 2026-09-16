"""Add a calm head/breathing idle to a grounded donkey facing Blender -Y.
Blender --background --python-exit-code 1 --python this-file -- input.glb output.glb
Feet remain fixed; this is an idle rig, not a walking rig.
"""
import bpy, sys, math
from pathlib import Path
from mathutils import Vector, Matrix
source, output=map(Path,sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
# This generated source is broadside, with its head toward (-X, -Y). Face -Y.
rotation=Matrix.Rotation(math.pi/4,4,'Z')
for mesh in meshes:
 matrix=rotation@mesh.matrix_world
 mesh.parent=None;mesh.matrix_world=Matrix.Identity(4)
 for v in mesh.data.vertices:v.co=matrix@v.co
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
h=hi.z;length=hi.y-lo.y
pivot_y=lo.y+length*.34
bpy.ops.object.select_all(action='DESELECT')
data=bpy.data.armatures.new('Donkey idle rig')
arm=bpy.data.objects.new('Donkey idle',data);bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name,head,tail,parent in [('ground',(0,0,0),(0,0,h*.3),None),('breath',(0,0,h*.45),(0,0,h*.7),'ground'),('donkey-head',(0,pivot_y,h*.55),(0,pivot_y-length*.2,h*.8),'breath')]:
 b=data.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(lo,hi,v):
 t=max(0,min(1,(v-lo)/(hi-lo)));return t*t*(3-2*t)
for mesh in meshes:
 groups={name:mesh.vertex_groups.new(name=name) for name in ['ground','breath','donkey-head']}
 for v in mesh.data.vertices:
  p=mesh.matrix_world@v.co
  body=smooth(h*.43,h*.65,p.z)
  head=(1-smooth(lo.y+length*.27,lo.y+length*.44,p.y))*smooth(h*.43,h*.64,p.z)
  for name,w in [('ground',1-body),('breath',body*(1-head)),('donkey-head',body*head)]:
   if w>0:groups[name].add([v.index],w,'REPLACE')
 mod=mesh.modifiers.new('Calm upper-body idle','ARMATURE');mod.object=arm;mesh.parent=arm
for frame in range(1,242,10):
 t=(frame-1)/240*math.tau
 b=arm.pose.bones['breath'];b.location.z=.002*math.sin(t);b.keyframe_insert('location',frame=frame)
 b=arm.pose.bones['donkey-head'];b.rotation_mode='XYZ';b.rotation_euler=(.018*math.sin(t),.009*math.sin(t),0);b.keyframe_insert('rotation_euler',frame=frame)
arm.animation_data.action.name='calm-donkey-idle'
scene=bpy.context.scene;scene.render.fps=30;scene.frame_end=241;scene.frame_set(1)
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format='GLB',export_animations=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output.with_suffix('.blend').resolve()))
