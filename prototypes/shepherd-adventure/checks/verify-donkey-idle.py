"""Verify exported donkey hoof stability, visible motion and loop closure.
Blender --background --python-exit-code 1 --python this-file -- model.glb report.json
"""
import bpy,sys,json
from pathlib import Path
source,output=map(Path,sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30;bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
s=bpy.context.scene;meshes=[o for o in s.objects if o.type=='MESH']
def pts(f):
 s.frame_set(f);d=bpy.context.evaluated_depsgraph_get();return [o.matrix_world@v.co for o in meshes for v in o.evaluated_get(d).data.vertices]
a,b=map(int,bpy.data.actions[0].frame_range);base=pts(a);h=max(p.z for p in base);feet=[i for i,p in enumerate(base) if p.z<h*.4];rows=[]
for f in [a+60,a+120,a+180,b]:
 p=pts(f);rows.append({'frame':f,'feet_max':max((p[i]-base[i]).length for i in feet),'motion_max':max((x-y).length for x,y in zip(p,base))})
assert max(r['feet_max']for r in rows)<1e-6
assert max(r['motion_max']for r in rows)>.003
assert rows[-1]['motion_max']<1e-6
output.write_text(json.dumps(rows,indent=2)+'\n');print(rows)
