"""Render exported game geometry; environment textures intentionally omitted.
Run export-nativity-review.mjs first, then Blender --background --python this-file.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
for item in json.loads(Path('/tmp/nativity-review-geometry.json').read_text())['meshes']:
 mesh=bpy.data.meshes.new(item['name']);ids=item['indices'];mesh.from_pydata(item['vertices'],[],[ids[i:i+3] for i in range(0,len(ids),3)]);mesh.update()
 obj=bpy.data.objects.new(item['name'],mesh);bpy.context.collection.objects.link(obj)
 mat=bpy.data.materials.new('Review base color');mat.diffuse_color=(*item['color'],1);obj.data.materials.append(mat)
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(root/'assets/nativity-family-pixal3d.glb'))
parent=bpy.data.objects.new('Family placement',None);bpy.context.collection.objects.link(parent)
for obj in set(bpy.data.objects)-before:
 if obj!=parent and obj.parent is None:obj.parent=parent
h=lambda x,z:.28*math.sin(x*.11)*math.cos(z*.09)+.12*math.sin(z*.22)+.035*math.sin(x*1.8+z*.9)
parent.location=(-33.9,73,h(-33,-73)+.06);parent.rotation_euler.z=math.pi/2
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.3));floor=bpy.context.object
mat=bpy.data.materials.new('Review ground');mat.diffuse_color=(.23,.22,.17,1);floor.data.materials.append(mat)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.world=bpy.data.worlds.new('Review world');scene.world.color=(.3,.3,.3)
light=bpy.data.lights.new('Soft daylight','AREA');light.energy=18000;light.shape='DISK';light.size=35
obj=bpy.data.objects.new('Soft daylight',light);scene.collection.objects.link(obj);obj.location=(-5,50,40)
obj.rotation_euler=(Vector((-25,62,0))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Review camera');camera=bpy.data.objects.new('Review camera',data);scene.collection.objects.link(camera);scene.camera=camera
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
out=root/'docs/nativity-scene'
for name,position,target,ortho in [('area-composition.png',(8,36,38),(-24,60,0),52),('shelter-composition.png',(-20,66,5),(-33,73,1.5),12)]:
 camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=ortho
 scene.render.filepath=str(out/name);bpy.ops.render.render(write_still=True)
