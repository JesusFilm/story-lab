"""Blender: fit dominant base/roof planes of a prepared annex; reject baked-in tilt."""
import bpy,numpy as np,json,sys
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
model=Path(args[0]).resolve()
result={}
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(model))
pts=np.array([tuple(o.matrix_world@v.co) for o in bpy.context.scene.objects if o.type=='MESH' for v in o.data.vertices]);rng=np.random.default_rng(42)
for name,sel in [('base',pts[:,2]<np.quantile(pts[:,2],.3)),('roof',pts[:,2]>np.quantile(pts[:,2],.7))]:
 p=pts[sel];best=None
 for i in range(800):
  a,b,c=p[rng.choice(len(p),3,replace=False)];n=np.cross(b-a,c-a);n/=max(np.linalg.norm(n),1e-10)
  if abs(n[2])<.85:continue
  if n[2]<0:n=-n
  d=-a@n;inside=np.abs(p@n+d)<.025;score=inside.sum()
  if best is None or score>best[0]:best=(score,n,d,inside)
 q=p[best[3]];u,s,v=np.linalg.svd(q-q.mean(0),full_matrices=False);n=v[-1];n=n if n[2]>0 else -n
 result[name]={'normal':n.tolist(),'angle_deg':float(np.degrees(np.arccos(n[2]))),'inliers':int(best[0]),'points':len(p)}

assert result['base']['angle_deg']<1, 'Building base is tilted'
assert result['roof']['angle_deg']<2, 'Roof is not approximately horizontal'
print(json.dumps(result,indent=2))
if len(args)>1:Path(args[1]).write_text(json.dumps(result,indent=2)+'\n')
