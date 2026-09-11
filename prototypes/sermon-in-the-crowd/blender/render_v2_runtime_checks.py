"""Render CPU-baked Three.js poses, including runtime gestures and facial morphs.
First run scripts/capture-v2-runtime-poses.ts, then run this file in Blender.
"""
import bpy,json,pathlib,re
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[1]
for capture in json.loads((ROOT/'.cache/free-models/runtime-poses.json').read_text()):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models-v2'/(capture['model']+'.glb')))
 original_materials={obj.name.replace(' ','_'):list(obj.data.materials) for obj in bpy.data.objects if obj.type=='MESH'}
 # Keep the original textures/materials, replace geometry with the runtime result.
 for obj in list(bpy.data.objects):bpy.data.objects.remove(obj,do_unlink=True)
 for item in capture['meshes']:
  mesh=bpy.data.meshes.new(item['name']);indices=item['indices']
  mesh.from_pydata(item['positions'],[],[indices[i:i+3] for i in range(0,len(indices),3)]);mesh.update()
  obj=bpy.data.objects.new(item['name'],mesh);bpy.context.collection.objects.link(obj)
  # glTF import can create per-mesh material variants for vertex-color support.
  materials=original_materials.get(item['name'])
  if materials is None:
   # Three.js splits multi-material glTF primitives into numbered child meshes.
   match=re.match(r'^(.*)_(\d+)$',item['name'])
   materials=[original_materials[match[1]][int(match[2])-1]]
  for material in materials:mesh.materials.append(material)
  for poly in mesh.polygons:
   poly.use_smooth=True
   for group in item['groups']:
    if group['start']<=poly.index*3<group['start']+group['count']:poly.material_index=group['materialIndex']
  if item['uv']:
   uv=mesh.uv_layers.new()
   for loop in mesh.loops:
    u,v=item['uv'][loop.vertex_index];uv.data[loop.index].uv=(u,1-v)
  if item['color']:
   color=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
   mesh.color_attributes.active_color=color
   for loop in mesh.loops:color.data[loop.index].color=item['color'][loop.vertex_index]
 bpy.ops.mesh.primitive_plane_add(size=200);ground=bpy.context.object
 mat=bpy.data.materials.new('Ground');mat.diffuse_color=(.28,.26,.20,1);ground.data.materials.append(mat)
 bpy.ops.object.camera_add(location=(2,-4.5,2.2));cam=bpy.context.object
 cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.35;bpy.context.scene.camera=cam
 for loc,power,size in [((-3,-4,6),700,5),((3,1,4),500,4)]:
  bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
  light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
 scene.world=bpy.data.worlds.new('World');scene.world.color=(.25,.25,.25)
 scene.render.resolution_x=600;scene.render.resolution_y=800;scene.render.resolution_percentage=100
 scene.render.filepath=str(ROOT/'docs/v2/qa'/('runtime-'+capture['name']+'.png'))
 bpy.ops.render.render(write_still=True)
