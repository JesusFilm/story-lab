import bpy
from pathlib import Path

root = Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = .86
    return mat

cover = material('Deep green cloth', (.025, .09, .065))
paper = material('Warm ivory pages', (.9, .8, .61))
trim = material('Antique brass', (.55, .37, .17))

def block(name, dims, pos, mat, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    mod = obj.modifiers.new('Soft hand-bound edges', 'BEVEL')
    mod.width = bevel; mod.segments = 2
    obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
    return obj

# A small closed book, upright on a shelf. Dimensions are metres.
block('Page block', (.29, .065, .42), (0, 0, .23), paper)
block('Front board', (.31, .016, .45), (0, -.043, .23), cover)
block('Back board', (.31, .016, .45), (0, .043, .23), cover)
block('Spine', (.027, .098, .45), (-.158, 0, .23), cover)
block('Inlaid top line', (.27, .003, .008), (0, -.053, .421), trim, .002)
block('Inlaid bottom line', (.27, .003, .008), (0, -.053, .039), trim, .002)

bpy.ops.wm.save_as_mainfile(filepath=str(root / 'little-light-book-source.blend'))
bpy.ops.export_scene.gltf(filepath=str(root / 'little-light-book-runtime.glb'), export_format='GLB', export_apply=True)
