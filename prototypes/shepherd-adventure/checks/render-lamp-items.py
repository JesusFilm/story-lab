"""Render the actual runtime lamp and oil jar as transparent inspection PNGs.
Run with Blender --background --python checks/render-lamp-items.py.
"""
from pathlib import Path
import bpy
from mathutils import Vector, Matrix

root=Path(__file__).resolve().parents[1]
out=root/'assets/lamp-assembly'
out.mkdir(parents=True,exist_ok=True)
for name,source in [('lamp','portable-lantern-tripo.glb'),('oil','oil-jar-pixal3d.glb')]:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/'assets'/source))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
 low=Vector(tuple(min(p[i] for p in points) for i in range(3)))
 high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
 scale=1/(high.z-low.z);center=(low+high)/2
 for o in meshes:
  transform=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4)
  for v in o.data.vertices:v.co=(transform@v.co-center)*scale
  o.data.update()
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
 scene.render.resolution_x=scene.render.resolution_y=512;scene.render.resolution_percentage=100
 scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
 scene.world=bpy.data.worlds.new('Neutral');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.65,.65,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
 for loc,power,size in [((2,-3,4),240,3),((-3,-1,2),180,3),((1,3,3),200,2)]:
  light=bpy.data.lights.new('Softbox','AREA');light.energy=power;light.size=size;o=bpy.data.objects.new('Softbox',light);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
 cam=bpy.data.cameras.new('Item camera');o=bpy.data.objects.new('Item camera',cam);scene.collection.objects.link(o);scene.camera=o
 o.location=(1.6,-3,1.05);o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler();cam.type='ORTHO';cam.ortho_scale=1.35
 scene.view_settings.view_transform='AgX';scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
