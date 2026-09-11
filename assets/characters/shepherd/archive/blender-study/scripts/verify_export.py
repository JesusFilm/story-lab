"""Reimport the GLB into an empty Blender scene and verify geometry/materials."""
import bpy, json, math, struct
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'shepherd.glb').read_bytes()
magic,version,length=struct.unpack_from('<4sII',raw)
assert magic==b'glTF' and version==2 and length==len(raw)
n,kind=struct.unpack_from('<I4s',raw,12)
assert kind==b'JSON'
gltf=json.loads(raw[20:20+n])
assert gltf.get('meshes') and gltf.get('materials')
assert all('uri' not in x or x['uri'].startswith('data:') for x in gltf.get('images',[]))
assert all('uri' not in x for x in gltf.get('buffers',[]))

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'shepherd.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert objects,'GLB contains no meshes'
points=[o.matrix_world@v.co for o in objects for v in o.data.vertices]
assert all(all(math.isfinite(a) for a in v) for v in points)
bounds=[(min(v[i] for v in points),max(v[i] for v in points)) for i in range(3)]
height=bounds[2][1]-bounds[2][0]
width=bounds[0][1]-bounds[0][0]
assert 1.75<height<1.90,(height,bounds)
assert 1.70<width<2.05,(width,bounds)
assert all(o.data.materials for o in objects),'Export lost a material assignment'
triangles=0
for o in objects:o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
result={'glb_version':version,'mesh_objects':len(objects),'triangles':triangles,
        'height_m':height,'armspan_m':width,'materials':len(gltf['materials']),
        'embedded_images':len(gltf.get('images',[])),'external_image_dependencies':False,
        'finite_geometry':True,'reimport_in_blender':'passed'}
(ROOT/'verification.json').write_text(json.dumps(result,indent=2))
print('VERIFIED',json.dumps(result),flush=True)

# Render the actual imported GLB, using the original studio for a fair comparison.
with bpy.data.libraries.load(str(ROOT/'shepherd.blend'),link=False) as (src,dst):
    dst.collections=['STUDIO | cameras and lights']
    dst.worlds=[src.worlds[0]] if src.worlds else []
for c in dst.collections:
    if c:bpy.context.scene.collection.children.link(c)
scene=bpy.context.scene
if dst.worlds:scene.world=dst.worlds[0]
scene.camera=bpy.data.objects['04 THREE-QUARTER']
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'renders'/'glb-reimport-check.png')
bpy.ops.render.render(write_still=True)
