"""Blender background: prepare a detailed stall while retaining its source UV atlas.

blender --background --python prepare-stall.py -- source.glb output-dir --height 2.8 --triangles 150000
"""
import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector, Matrix, Euler


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('output_dir', type=Path)
parser.add_argument('--height', type=float, required=True, help='Height in metres')
parser.add_argument('--triangles', type=int, default=8000)
parser.add_argument('--texture-size', type=int, default=1024)
parser.add_argument('--rotate', type=float, nargs=3, default=[0, 0, 0], metavar=('X', 'Y', 'Z'),
                    help='Correct source orientation in Blender XYZ degrees before fitting')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.height <= 0 or args.triangles < 100 or args.texture_size < 64:
    parser.error('Positive height, at least 100 triangles and 64px textures required')
out = args.output_dir.resolve()
out.mkdir(parents=True, exist_ok=True)
runtime = out / (args.source.stem.replace('-source', '') + '-runtime.glb')
if runtime.exists():
    raise SystemExit('Refusing to overwrite runtime model')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(args.source.resolve()))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes:
    raise SystemExit('Source has no mesh')
rotation = Euler(tuple(math.radians(v) for v in args.rotate), 'XYZ').to_matrix().to_4x4()
points = [rotation @ obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
factor = args.height / (hi.z - lo.z)
offset = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for obj in meshes:
    # Bake world coordinates and normalization into mesh; preserve UVs/materials.
    matrix = rotation @ obj.matrix_world
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    for vertex in obj.data.vertices:
        vertex.co = (matrix @ vertex.co - offset) * factor
    obj.data.update()


def stats():
    used_images = {node.image for obj in meshes for slot in obj.material_slots if slot.material and slot.material.use_nodes
                   for node in slot.material.node_tree.nodes if node.type == 'TEX_IMAGE' and node.image}
    return {'triangles': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes),
            'meshes': len(meshes),
            'uv_layers': [len(o.data.uv_layers) for o in meshes],
            'textures': [{'name': i.name, 'size': list(i.size)} for i in sorted(used_images, key=lambda i:i.name)]}


source_stats = stats()
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 768
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world = bpy.data.worlds.new('Neutral studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .32, .32, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .6
scene.view_settings.view_transform = 'AgX'
bpy.ops.mesh.primitive_plane_add(size=args.height * 200)
floor = bpy.context.object
floor.name = 'Review floor'
mat = bpy.data.materials.new('Neutral gray')
mat.diffuse_color = (.28, .28, .28, 1)
floor.data.materials.append(mat)
for name, position, power, size in [('Key', (2, -3, 4), 80, 3), ('Fill', (-3, -1, 2), 40, 3), ('Rim', (1, 3, 3), 60, 2)]:
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = power * args.height ** 2
    light.shape = 'DISK'
    light.size = size * args.height
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = Vector(position) * args.height
    obj.rotation_euler = (Vector((0, 0, args.height / 2)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
camera_data = bpy.data.cameras.new('Review camera')
camera = bpy.data.objects.new('Review camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = 'ORTHO'
camera_data.ortho_scale = args.height * 1.5
camera_data.clip_start = .001


def render(name, angle):
    camera.location = Vector((math.sin(angle) * 2.8, -math.cos(angle) * 2.8, 1.8)) * args.height
    camera.rotation_euler = (Vector((0, 0, args.height / 2)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(out / name)
    bpy.ops.render.render(write_still=True)


render('source-front.png', .35)
ratio = min(1, args.triangles / source_stats['triangles'])
for obj in meshes:
    high = obj.copy()
    high.data = obj.data.copy()
    scene.collection.objects.link(high)
    high.name = 'Bake source'
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    # GLB vertices split at UV/normal seams. Weld coincident geometry first;
    # decimating isolated triangle islands otherwise tears the surface apart.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=args.height * 0.00001)
    bpy.ops.object.mode_set(mode='OBJECT')
    if ratio < 1:
        modifier = obj.modifiers.new('Static prop LOD', 'DECIMATE')
        modifier.ratio = ratio
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.validate(verbose=True)
    obj.data.update()
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    # Retain the source atlas: selected-to-active rebaking across closely spaced
    # canopy, stock and shelves produced black patches on these generated stalls.
    # Decimation interpolates the existing UVs; inspect matched renders for seams.
    for slot in obj.material_slots:
        material = slot.material
        if material and material.use_nodes:
            for node in material.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    image = node.image
                    if max(image.size) > args.texture_size:
                        factor = args.texture_size / max(image.size)
                        image.scale(int(image.size[0] * factor), int(image.size[1] * factor))
                        image.pack()
    high.hide_render = True
    high.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(runtime), export_format='GLB', use_selection=True,
                         export_image_format='JPEG', export_image_quality=90)
runtime_stats = stats()
# Review the exported file itself, including exported material/UV interpretation.
for obj in meshes:
    obj.hide_render = True
bpy.ops.import_scene.gltf(filepath=str(runtime))
render('runtime-front.png', .35)
render('runtime-rear.png', math.pi + .35)
(out / 'mesh-review.json').write_text(json.dumps({
    'source': source_stats, 'runtime': runtime_stats, 'height_metres': args.height,
    'decimation_ratio': ratio, 'texture_limit': args.texture_size,
    'orientation_xyz_degrees': args.rotate,
    'note': 'Weld and conservatively decimate; preserve original UVs and source material atlas, reduce textures. Static prop; not rigged.'
}, indent=2) + '\n')
print(json.dumps({'runtime': str(runtime), 'source': source_stats, 'result': runtime_stats}))
