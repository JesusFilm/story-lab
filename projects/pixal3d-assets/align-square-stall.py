"""Level and align this generated nativity shell using measured interior surfaces.
Preserves its textured masonry; trims the inferred exterior awning.
Blender --background --python-exit-code 1 --python this-file -- input.glb output.glb
"""
import bpy,sys,json,math,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
src,out=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(Path(src).resolve()));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
def bvh():
 vs=[];fs=[]
 for o in meshes:
  n=len(vs);vs.extend(o.matrix_world@v.co for v in o.data.vertices);fs.extend(tuple(n+i for i in p.vertices)for p in o.data.polygons)
 return BVHTree.FromPolygons(vs,fs)
def transform(m):
 for o in meshes:
  mat=m@o.matrix_world;o.parent=None;o.matrix_world=Matrix.Identity(4)
  for v in o.data.vertices:v.co=mat@v.co
  o.data.update()
b=bvh();floor=[]
for x in [-.8,-.4,0,.4,.8]:
 for y in [-.8,-.4,0,.4,.8]:
  h=b.ray_cast(Vector((x,y,1.4)),Vector((0,0,-1)),5)[0]
  if h:floor.append(list(h))
p=np.array(floor);coef=np.linalg.lstsq(np.column_stack([p[:,0],p[:,1],np.ones(len(p))]),p[:,2],rcond=None)[0];normal=Vector((-coef[0],-coef[1],1)).normalized();print('floor',coef,'normal',normal[:]);level=normal.rotation_difference(Vector((0,0,1))).to_matrix().to_4x4();transform(level)
b=bvh();back=[]
for x in np.linspace(-.5,1.3,20):
 h=b.ray_cast(Vector((x,0,1.4)),Vector((0,1,0)),10)[0]
 if h:back.append(list(h))
p=np.array(back);slope,intercept=np.polyfit(p[:,0],p[:,1],1);yaw=-math.atan(slope);print('back',slope,intercept,'yaw',math.degrees(yaw));rot=Matrix.Rotation(yaw,4,'Z');transform(rot)
# Measure room boundaries, excluding the model's invented exterior door awning.
b=bvh()
def hits(axis,positions):
 result=[]
 for a in positions:
  origin=Vector((0,a,1.4)) if axis[0] else Vector((a,0,1.4))
  hit=b.ray_cast(origin,Vector(axis),10)[0]
  if hit:result.append(hit)
 return result
left=float(np.median([v.x for v in hits((-1,0,0),[-.8,-.4,0,.4,.8])]))
right=float(np.median([v.x for v in hits((1,0,0),[-.8,-.4,0,.4,.8])]))
back=float(np.median([v.y for v in hits((0,1,0),[-.6,-.3,0,.3,.6])]))
front=min(v.y for v in hits((0,-1,0),[left+.1,left+.2,left+.3,left+.4,left+.5]))
floor_z=float(np.median([b.ray_cast(Vector((x,y,1)),Vector((0,0,-1)),5)[0].z for x in [-.4,0,.4] for y in [-.4,0,.4]]))
print('ROOM',left,right,front,back,'floor',floor_z)
# Remove only the unsupported exterior awning and its legs; retain the stone shell.
import bmesh
for o in meshes:
 bm=bmesh.new();bm.from_mesh(o.data)
 remove=[v for v in bm.verts if v.co.x<left-.4 and v.co.z<2.2 and v.co.y>front+.6]
 bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(o.data);bm.free()
# Room coordinates, not the asymmetric roof/wing AABB, define the square.
center=np.array([(left+right)/2,(front+back)/2,floor_z]);scale=np.array([6/(right-left),6/(back-front),1.36])
for o in meshes:
 for v in o.data.vertices:v.co=Vector(((np.array(v.co)-center)*scale).tolist())
 o.data.update()
lo=np.array([left,front,floor_z]);hi=np.array([right,back,2.8])
bpy.ops.export_scene.gltf(filepath=str(Path(out).resolve()),export_format='GLB')
Path(out).with_suffix('.alignment.json').write_text(json.dumps({'floor_plane':coef.tolist(),'floor_normal':list(normal),'yaw_degrees':math.degrees(yaw),'leveled_bounds':[lo.tolist(),hi.tolist()],'interior_square_metres':[6,6],'floor_zero':True},indent=2)+'\n')
