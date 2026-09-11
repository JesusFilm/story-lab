"""Render inspectable views and export a simplified, textured static GLB."""
import bpy, bmesh, json, math, sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'renders'
scene=bpy.context.scene
scene.cycles.samples=64
scene.cycles.use_denoising=True
scene.render.resolution_x=1400
scene.render.resolution_y=1400
scene.render.resolution_percentage=100
character=bpy.data.collections['SHEPHERD | editable parts']
meshes=[o for o in character.objects if o.type=='MESH']
deps=bpy.context.evaluated_depsgraph_get()
def tris(ob):
    me=ob.evaluated_get(deps).to_mesh();me.calc_loop_triangles();n=len(me.loop_triangles)
    ob.evaluated_get(deps).to_mesh_clear()
    return n

authoring_triangles=sum(tris(ob) for ob in meshes)
print('AUTHORING TRIANGLES',authoring_triangles,flush=True)
source=bpy.data.texts.get('README | START HERE') or bpy.data.texts.new('README | START HERE')
source.clear()
source.write('SHEPHERD — REFERENCE MODEL STUDY\n\n'
             'Editable anatomy, tunic, shearling vest, belt, sandals, eyes and mesh grooming.\n'
             'The character is approximately 1.82 m tall, in a static T-pose.\n'
             'Use the five cameras in STUDIO to inspect front, side, back, beauty and portrait views.\n'
             'Toggle the REFERENCE collection to see the packed original sheet.\n'
             'All textures are packed. No add-ons are required to open or render.\n\n'
             'The body uses the CC0 MakeHuman basemesh and morph targets.\n'
             'Clothing, sandals, belt, grooming and scene are constructed by the Python script.\n'
             'This is a reference-guided prototype, with approximate facial likeness and cloth folds.\n'
             'It has no animation rig, facial controls, LOD chain or production hair cards.\n'
             'The GLB is a simplified static mesh export; the BLEND retains the editable authoring parts.\n')
script=bpy.data.texts.get('build_shepherd.py') or bpy.data.texts.new('build_shepherd.py')
script.clear();script.write((ROOT/'scripts'/'build_shepherd.py').read_text())
scene.camera=bpy.data.objects['04 THREE-QUARTER']
scene.render.filepath=str(OUT/'shepherd-beauty.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'shepherd.blend'))

render_jobs=[] if '--export-only' in sys.argv else [('01 FRONT','front',1400),('02 SIDE','side',1400),('03 BACK','back',1400),('04 THREE-QUARTER','shepherd-beauty',1600),('05 PORTRAIT','shepherd-detail',1400)]
for camera,name,size in render_jobs:
    scene.camera=bpy.data.objects[camera]
    bpy.data.objects['Studio ground'].hide_render=camera in ['01 FRONT','02 SIDE','03 BACK']
    scene.render.resolution_x=size;scene.render.resolution_y=size
    scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)
    print('RENDERED',name,flush=True)

# Evaluate modifiers into export-only copies. The authoring geometry remains intact.
exports=bpy.data.collections.new('EXPORT | temporary evaluated meshes')
scene.collection.children.link(exports)
copies=[]
for src in meshes:
    me=bpy.data.meshes.new_from_object(src.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps)
    ob=bpy.data.objects.new(src.name,me);exports.objects.link(ob);ob.matrix_world=src.matrix_world.copy()
    if src.name.startswith('Body |'):
        bm=bmesh.new();bm.from_mesh(me)
        hidden=[]
        for face in bm.faces:
            if all(.548<v.co.z<1.345 and abs(v.co.x)<.238 for v in face.verts):hidden.append(face)
            elif all(.22<abs(v.co.x)<.449 and 1.37<v.co.z<1.53 for v in face.verts):hidden.append(face)
        bmesh.ops.delete(bm,geom=hidden,context='FACES')
        bm.to_mesh(me);bm.free()
    name=src.name
    ratio=.8
    if name.startswith('Tunic | knee-length'):ratio=1.0
    elif name.startswith('Body |'):ratio=.46
    elif name.startswith(('Tunic |','Vest | open')):ratio=.19
    elif 'groomed locks' in name or 'varied brown strands' in name:ratio=.22 if name.startswith('Hair |') else .15
    elif name.startswith('Eyebrows |'):ratio=.30
    elif 'loose fleece tufts' in name:ratio=.16
    elif 'root coverage' in name:ratio=.60
    if len(me.polygons)>160 and ratio<1:
        dec=ob.modifiers.new('Static export reduction','DECIMATE');dec.ratio=ratio;dec.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=ob
        ob.select_set(True)
        bpy.ops.object.modifier_apply(modifier=dec.name)
        ob.select_set(False)
    copies.append(ob)

bpy.ops.object.select_all(action='DESELECT')
for ob in copies:ob.select_set(True)
bpy.context.view_layer.objects.active=copies[0]
export_triangles=0
for ob in copies:ob.data.calc_loop_triangles();export_triangles+=len(ob.data.loop_triangles)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'shepherd.glb'),export_format='GLB',use_selection=True,
    export_apply=True,export_animations=False,export_lights=False,export_cameras=False,
    export_materials='EXPORT',export_texcoords=True,export_normals=True,export_yup=True)
stats={'blender_version':bpy.app.version_string,'authoring_mesh_parts':len(meshes),
       'authoring_evaluated_triangles':authoring_triangles,'glb_triangles':export_triangles,
       'glb_bytes':(ROOT/'shepherd.glb').stat().st_size,'rigged':False,
       'textures_packed':True,'reference_image_packed':True,
       'method':'MakeHuman CC0 anatomical base + reference-guided Blender Python tailoring and grooming'}
(ROOT/'model-stats.json').write_text(json.dumps(stats,indent=2))
print('FINAL STATS',json.dumps(stats),flush=True)
for ob in copies:
    me=ob.data;bpy.data.objects.remove(ob,do_unlink=True)
    if me.users==0:bpy.data.meshes.remove(me)
bpy.data.collections.remove(exports)
print('RENDER AND EXPORT COMPLETE',flush=True)
