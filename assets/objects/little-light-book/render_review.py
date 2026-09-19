import bpy, json, math, struct
from mathutils import Vector
from pathlib import Path
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root/'little-light-book-source.blend'))
world=bpy.context.scene.world
world.color=(.13,.13,.13)
bpy.ops.object.light_add(type='AREA', location=(.7,-1.1,1.3))
light=bpy.context.object; light.data.energy=80; light.data.shape='DISK'; light.data.size=2
bpy.ops.object.camera_add(location=(.72,-.9,.72))
cam=bpy.context.object; direction=Vector((0,0,.23))-cam.location; cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=.85
scene=bpy.context.scene; scene.camera=cam; scene.view_settings.view_transform='Standard'; scene.view_settings.look='Medium High Contrast'; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=768; scene.render.resolution_y=768; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(root/'little-light-book-review.png')
bpy.ops.render.render(write_still=True)
meshes=[o for o in bpy.data.objects if o.type=='MESH']
with open(root/'little-light-book-runtime.glb','rb') as glb:
    glb.read(12); chunk_size, _ = struct.unpack('<II',glb.read(8)); data=json.loads(glb.read(chunk_size))
exported_triangles=sum(data['accessors'][prim['indices']]['count']//3 for mesh in data['meshes'] for prim in mesh['primitives'])
(root/'mesh-review.json').write_text(json.dumps({'meshes':len(meshes),'source_base_triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),'exported_runtime_triangles':exported_triangles,'target_dimensions_m':[.31,.45,.098]},indent=2))
