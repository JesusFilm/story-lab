"""Align a generated trough to its principal axes and fit 1.8 x .45 x .65 metres.
Blender --background --python-exit-code 1 --python this-file -- input.glb output.glb
"""
import bpy,sys,numpy as np,json
from pathlib import Path
from mathutils import Matrix,Vector
src,out=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(Path(src).resolve()));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
p=np.array([list(o.matrix_world@v.co)for o in meshes for v in o.data.vertices]);vals,vec=np.linalg.eigh(np.cov(p.T));print('PCA',vals,vec)
x=vec[:,2];x*=1 if x[0]>0 else -1
z=vec[:,max(range(2),key=lambda i:abs(vec[2,i]))];z*=1 if z[2]>0 else -1
y=np.cross(z,x);axes=np.array([x,y,z]);aligned=p@axes.T
lo=aligned.min(0);hi=aligned.max(0);print('ALIGNED',lo,hi,'size',hi-lo)
scale=np.array([1.8,.45,.65])/(hi-lo);center=(lo+hi)/2;center[2]=lo[2]
for o in meshes:
 m=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4)
 for v in o.data.vertices:v.co=Vector(((axes@np.array(m@v.co)-center)*scale).tolist())
 o.data.update()
bpy.ops.export_scene.gltf(filepath=str(Path(out).resolve()),export_format='GLB')
Path(out).with_suffix('.alignment.json').write_text(json.dumps({'principal_axes':axes.tolist(),'source_extents':(hi-lo).tolist(),'runtime_metres':[1.8,.45,.65]},indent=2)+'\n')
