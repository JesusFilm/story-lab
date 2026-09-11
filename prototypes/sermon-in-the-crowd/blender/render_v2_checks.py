import bpy,pathlib,math
from mathutils import Vector
P=pathlib.Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(P/'public/models-v2/teacher.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
old=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(P/'.cache/free-models/retargeted-motion.glb'))

for o in list(bpy.data.objects):
 if o not in old:bpy.data.objects.remove(o,do_unlink=True)
rig.animation_data_create();action=next(a for a in bpy.data.actions if a.name=='Idle_Loop');rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
for t in rig.animation_data.nla_tracks:rig.animation_data.nla_tracks.remove(t)
bpy.context.scene.frame_set(15)
bpy.ops.mesh.primitive_plane_add(size=200);ground=bpy.context.object;m=bpy.data.materials.new('Ground');m.diffuse_color=(.28,.26,.20,1);ground.data.materials.append(m)
bpy.ops.object.camera_add(location=(2.3,-4.2,2.1));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.95))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.45;bpy.context.scene.camera=cam
for loc,power,size in [((-3,-4,6),700,5),((3,1,4),500,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.world=bpy.data.worlds.new('World');s.world.color=(.25,.25,.25);s.render.resolution_x=720;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.filepath=str(P/'docs/v2/qa/teacher-idle.png');bpy.ops.render.render(write_still=True)
for name,filename in [('Walk_Loop','walk'),('Sitting_Idle_Loop','sit')]:
 a=bpy.data.actions.get(name);rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0];s.frame_set(15);s.render.filepath=str(P/('docs/v2/qa/teacher-'+filename+'.png'));bpy.ops.render.render(write_still=True)
