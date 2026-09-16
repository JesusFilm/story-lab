"""Add a restrained upper-body idle to an already posed, metre-scale character.
Blender --background --python animate-seated-character.py -- input.glb output.glb
The seated lower body and stool remain fixed. This is not a locomotion rig.
"""
import bpy, sys, math
from pathlib import Path
from mathutils import Vector
source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
height=max(p.z for p in points)
# Prepared models have their base at zero and face Blender -Y.
data=bpy.data.armatures.new('Seated upper-body rig')
arm=bpy.data.objects.new('Seated idle',data);bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name,z,parent in [('seat',0,None),('breath',.52,'seat'),('head',.78,'breath')]:
 bone=data.edit_bones.new(name);bone.head=(0,0,height*z);bone.tail=(0,0,height*(z+.12))
 if parent:bone.parent=data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(lo,hi,z):
 t=max(0,min(1,(z-lo)/(hi-lo)));return t*t*(3-2*t)
for mesh in meshes:
 groups={n:mesh.vertex_groups.new(name=n) for n in ['seat','breath','head']}
 for v in mesh.data.vertices:
  z=(mesh.matrix_world@v.co).z/height
  body=smooth(.53,.7,z);head=smooth(.78,.88,z)
  for name,weight in [('seat',1-body),('breath',body*(1-head)),('head',body*head)]:
   if weight>0:groups[name].add([v.index],weight,'REPLACE')
 modifier=mesh.modifiers.new('Upper-body idle','ARMATURE');modifier.object=arm
 mesh.parent=arm
for frame in range(1,242,10):
 t=(frame-1)/240*math.tau
 for name in ['breath','head']:
  b=arm.pose.bones[name];b.rotation_mode='XYZ'
  b.rotation_euler=(.007*math.sin(t),0,0) if name=='breath' else (.021*math.sin(t),.009*math.sin(t),0)
  b.keyframe_insert('rotation_euler',frame=frame)
arm.animation_data.action.name='quiet-seated-idle'
scene=bpy.context.scene;scene.render.fps=30;scene.frame_end=241;scene.frame_set(1)
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format='GLB',export_animations=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output.with_suffix('.blend').resolve()))
print('Seated idle exported: 8 seconds; feet and stool fixed.')
