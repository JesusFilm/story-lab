"""Normalize an already posed Tripo model without changing topology or UVs.
Blender --background --python-exit-code 1 --python this-file -- source.glb output-dir height yaw-degrees
Yaw uses Blender Z. Outputs a static GLB and geometry/preparation report.
"""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Matrix,Vector
source,out,height,yaw=sys.argv[sys.argv.index('--')+1:];source=Path(source);out=Path(out);height=float(height);yaw=float(yaw);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
rotation=Matrix.Rotation(math.radians(yaw),4,'Z')
points=[rotation@o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
factor=height/(hi.z-lo.z);offset=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
# Uniform normalization preserves the source UVs, topology, normals and material maps.
for o in meshes:
 m=rotation@o.matrix_world;o.parent=None;o.matrix_world=Matrix.Identity(4)
 transform=Matrix.Scale(factor,4)@Matrix.Translation(-offset)@m
 o.data.transform(transform);o.data.update()
 bpy.context.view_layer.objects.active=o
 for mat in o.data.materials:
  if mat and mat.use_nodes:
   for n in mat.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':
     for socket in ['Metallic','Roughness']:
      for link in list(n.inputs[socket].links):mat.node_tree.links.remove(link)
     n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=.9
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
runtime=out/(source.stem.replace('-source','')+'-runtime.glb')
bpy.ops.export_scene.gltf(filepath=str(runtime.resolve()),export_format='GLB',use_selection=True,export_image_format='JPEG',export_image_quality=95)
images={n.image for o in meshes for m in o.data.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
(out/'mesh-review.json').write_text(json.dumps({'source':source.name,'runtime':runtime.name,'height_metres':height,'orientation_z_degrees':yaw,'dimensions_metres':list((hi-lo)*factor),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'textures':[{'size':list(i.size)} for i in images],'preparation':'Uniform scale and grounded centered pivot; preserve source topology, UVs and normals. Matte nonmetallic cloth, skin, straw and wood.'},indent=2)+'\n')
