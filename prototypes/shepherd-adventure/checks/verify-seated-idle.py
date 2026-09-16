"""Check real exported skin deformation, fixed lower body and loop continuity.
Blender --background --python-exit-code 1 --python this-file -- model.glb report.json
"""
import bpy,sys,json
from pathlib import Path
source,out=map(Path,sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30;bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
scene=bpy.context.scene;meshes=[o for o in scene.objects if o.type=='MESH']
def points(frame):
 scene.frame_set(frame);deps=bpy.context.evaluated_depsgraph_get()
 return [o.matrix_world@v.co for o in meshes for v in o.evaluated_get(deps).data.vertices]
start,end=map(int,bpy.data.actions[0].frame_range);print("Imported clip frames",start,end,flush=True)
base=points(start);h=max(p.z for p in base);low=[i for i,p in enumerate(base) if p.z<h*.5];head=[i for i,p in enumerate(base) if p.z>h*.88]
rows=[]
for frame in [round(start+(end-start)*t) for t in [.25,.5,.75,1]]:
 p=points(frame);rows.append({'frame':frame,'lower_body_max_metres':max((p[i]-base[i]).length for i in low),'head_max_metres':max((p[i]-base[i]).length for i in head),'all_max_metres':max((a-b).length for a,b in zip(p,base))})
assert max(r['lower_body_max_metres'] for r in rows)<1e-6,'Lower body must stay fixed'
assert max(r['head_max_metres'] for r in rows)>.002,'Idle must move the visible head'
assert rows[-1]['all_max_metres']<1e-6,'Loop must close cleanly'
out.write_text(json.dumps({'model':source.name,'motion_samples':rows,'checks':'Fixed lower body, visible upper-body motion, closed eight-second loop'},indent=2)+'\n');print(out.read_text())
