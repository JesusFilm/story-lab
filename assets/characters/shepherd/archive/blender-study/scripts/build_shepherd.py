"""Build the reference-guided shepherd in Blender 5.1; no add-ons required.

Run: Blender --background --factory-startup --python scripts/build_shepherd.py
MakeHuman's CC0 anatomical mesh and targets are inputs, not generated geometry.
The outfit, accessories, grooming, presentation, and materials are built here.
"""
import bpy, bmesh, math, json, random, sys
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
SRC, TEX, OUT = ROOT/'sources', ROOT/'textures', ROOT/'renders'
random.seed(24)
rng = np.random.default_rng(24)
PI = math.pi

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)
character = bpy.data.collections.get('Collection')
character.name = 'SHEPHERD | editable parts'
stage = bpy.data.collections.new('STUDIO | cameras and lights')
bpy.context.scene.collection.children.link(stage)
reference = bpy.data.collections.new('REFERENCE | toggle in viewport')
bpy.context.scene.collection.children.link(reference)
master = bpy.data.objects.new('Shepherd | 1.80 m | T-pose', None)
character.objects.link(master)
master.empty_display_size = .1

def move_to(obj, collection):
    for c in list(obj.users_collection): c.objects.unlink(obj)
    collection.objects.link(obj)
    if collection == character: obj.parent = master
    return obj

def mesh_obj(name, vertices, faces, material=None, uvs=None, collection=character):
    me = bpy.data.meshes.new(name)
    me.from_pydata(vertices, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    if collection == character: ob.parent = master
    if material: me.materials.append(material)
    for p in me.polygons: p.use_smooth = True
    if uvs:
        layer = me.uv_layers.new(name='UVMap')
        for poly, uv in zip(me.polygons, uvs):
            for li, co in zip(poly.loop_indices, uv): layer.data[li].uv = co
    return ob

def finish(ob, subdiv=0, thickness=0, bevel=0):
    if subdiv:
        m=ob.modifiers.new('Tailored surface smoothing', 'SUBSURF');m.levels=subdiv;m.render_levels=subdiv
    if thickness:
        m=ob.modifiers.new('Real material thickness', 'SOLIDIFY');m.thickness=thickness;m.offset=0
    if bevel:
        m=ob.modifiers.new('Soft worn edges', 'BEVEL');m.width=bevel;m.segments=2
    return ob

def pbr(name, color, rough=.7, metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    return m,bs

def save_image(name, rgb, noncolor=False):
    h,w=rgb.shape[:2]
    im=bpy.data.images.new(name,width=w,height=h,alpha=True)
    if noncolor: im.colorspace_settings.name='Non-Color'
    rgba=np.ones((h,w,4),dtype=np.float32);rgba[:,:,:3]=np.clip(rgb,0,1)
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw=str(TEX/(name+'.png'));im.file_format='PNG';im.save()
    im.pack()
    return im

def texture_material(name, base, kind):
    n=1024;y,x=np.mgrid[0:n,0:n]/n
    noise=rng.random((n,n))
    if kind=='linen':
        warp=np.sin(x*2*PI*70+.35*np.sin(y*2*PI*5))
        weft=np.sin(y*2*PI*70+.28*np.sin(x*2*PI*4))
        weave=(warp+weft)*.11+warp*weft*.12
        broad=.012*np.sin(x*2*PI*3+.6)*np.sin(y*2*PI*5)
        h=.50+weave+noise*.12
        value=.91+weave*.22+broad+(noise-.5)*.12
        normal_strength=.32;rough=.93
    elif kind=='wool':
        field=np.fft.fft2(noise)
        fy=np.fft.fftfreq(n)[:,None];fx=np.fft.fftfreq(n)[None,:]
        h=np.fft.ifft2(field*np.exp(-(fx*fx+fy*fy)*450)).real
        h=(h-h.min())/(h.max()-h.min())
        value=.83+h*.27;normal_strength=5.;rough=.96
    else:
        field=np.fft.fft2(noise)
        fy=np.fft.fftfreq(n)[:,None];fx=np.fft.fftfreq(n)[None,:]
        h=np.fft.ifft2(field*np.exp(-(fx*fx+fy*fy)*40)).real
        h=(h-h.min())/(h.max()-h.min())
        value=.78+h*.30+.035*np.sin(y*2*PI*17);normal_strength=1.35;rough=.7
    rgb=np.array(base)[None,None,:]*value[:,:,None]
    image=save_image(name+' | albedo',rgb)
    dy,dx=np.gradient(h)
    norm=np.stack((-dx*normal_strength,-dy*normal_strength,np.ones_like(h)*.12),axis=-1)
    norm/=np.linalg.norm(norm,axis=-1)[:,:,None]
    normal=save_image(name+' | normal',norm*.5+.5,True)
    mat,bs=pbr(name,base,rough)
    nt=mat.node_tree
    tx=nt.nodes.new('ShaderNodeTexImage');tx.image=image
    nt.links.new(tx.outputs['Color'],bs.inputs['Base Color'])
    tn=nt.nodes.new('ShaderNodeTexImage');tn.image=normal
    nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.6
    nt.links.new(tn.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
    return mat

linen=texture_material('Tunic | coarse undyed flax',(.40,.335,.248),'linen')
wool=texture_material('Vest | warm natural shearling',(.68,.585,.445),'wool')
leather=texture_material('Leather | weathered umber',(.18,.094,.041),'leather')
edge,_=pbr('Leather | burnished cut edge',(.105,.054,.024),.83)
thread,_=pbr('Flax | hand stitching',(.46,.347,.208),.95)
trim,_=pbr('Shearling | rolled binding',(.42,.327,.221),.91)
bronze,_=pbr('Buckle | tarnished bronze',(.25,.185,.09),.45,.78)
hairmat,hairbs=pbr('Hair | dark brown curls',(.018,.010,.006),.82)
hairbs.inputs['Coat Weight'].default_value=0
hairbs.inputs['Specular IOR Level'].default_value=.22
hairlight,hlbs=pbr('Hair | warm curl highlights',(.029,.017,.009),.84)
hlbs.inputs['Specular IOR Level'].default_value=.22
beardroot,brbs=pbr('Beard | translucent stubble roots',(.038,.022,.013),.95)
brbs.inputs['Alpha'].default_value=.70

def parse_obj(path):
    vs=[];tex=[];faces=[];uv=[];groups=[];group=''
    for l in path.read_text().splitlines():
        a=l.split()
        if not a: continue
        if a[0]=='v': vs.append([float(v) for v in a[1:4]])
        elif a[0]=='vt': tex.append([float(v) for v in a[1:3]])
        elif a[0]=='g': group=' '.join(a[1:])
        elif a[0]=='f':
            f=[v.split('/') for v in a[1:]]
            faces.append([int(v[0])-1 for v in f])
            uv.append([tex[int(v[1])-1] if len(v)>1 and v[1] else (0,0) for v in f])
            groups.append(group)
    return np.array(vs), faces, uv, groups

raw,faces,uvs,groups=parse_obj(SRC/'base.obj')
for filename,weight in [('caucasian-male-young.target',.86),('caucasian-male-old.target',.14),('universal-male-young-maxmuscle-averageweight.target',.38)]:
    for l in (SRC/filename).read_text().splitlines():
        a=l.split()
        if len(a)==4 and not a[0].startswith('#'): raw[int(a[0])]+=np.array(list(map(float,a[1:])))*weight

ids=sorted({v for f,g in zip(faces,groups) if g=='body' for v in f})
floor=min(raw[i,1] for i in ids)
scale=1.78/(max(raw[i,1] for i in ids)-floor)
coords=np.stack([raw[:,0]*scale,-raw[:,2]*scale,(raw[:,1]-floor)*scale+.023],axis=1)
skel=json.loads((SRC/'default.mhskel').read_text())
weights=json.loads((SRC/'default_weights.mhw').read_text())['weights']
def joint(name): return Vector(coords[skel['joints'][name]].mean(axis=0))
def bonehead(n): return joint(skel['bones'][n]['head'])

def rotation_frame(axis, across, target):
    a=axis.normalized();b=(across-a*across.dot(a)).normalized();c=a.cross(b).normalized()
    old=Matrix((a,b,c)).transposed()
    aa=target.normalized();bb=Vector((0,-1,0));cc=aa.cross(bb).normalized()
    return Matrix((aa,bb,cc)).transposed() @ old.transposed()

transforms={}
for side,sign in [('L',1),('R',-1)]:
    sh=bonehead('upperarm01.'+side);el=bonehead('lowerarm01.'+side);wr=bonehead('wrist.'+side)
    mid=bonehead('finger3-1.'+side)
    across=bonehead('finger2-1.'+side)-bonehead('finger5-1.'+side)
    target=Vector((sign,0,0))
    r1=(el-sh).normalized().rotation_difference(target).to_matrix()
    r2=rotation_frame(wr-el,across,target)
    rh=rotation_frame(mid-wr,across,target)
    e2=sh+target*(el-sh).length
    w2=e2+target*(wr-el).length
    for n in weights:
        if not n.endswith('.'+side): continue
        if n.startswith('upperarm'): transforms[n]=(r1,sh,sh)
        elif n.startswith('lowerarm'): transforms[n]=(r2,el,e2)
        elif n.startswith(('wrist','finger','metacarpal')): transforms[n]=(rh,wr,w2)

posed=np.zeros_like(coords);totals=np.zeros(len(coords))
for name,weighted in weights.items():
    trans=transforms.get(name)
    for i,w in weighted:
        if i>=len(coords): continue
        pos=Vector(coords[i])
        if trans: r,a,b=trans;pos=r@(pos-a)+b
        posed[i]+=np.array(pos)*w;totals[i]+=w
valid=totals>1e-6;posed[valid]/=totals[valid,None];posed[~valid]=coords[~valid]

skin,skinbs=pbr('Skin | sun-weathered complexion',(.38,.235,.145),.65)
skinbs.inputs['Subsurface Weight'].default_value=.085
skinbs.inputs['Subsurface Radius'].default_value=(.7,.3,.17)
skinbs.inputs['Subsurface Scale'].default_value=.008
skinpath=SRC/'middleage_lightskinned_male_diffuse.png'
if skinpath.exists():
    im=bpy.data.images.load(str(skinpath),check_existing=True)
    # Tint in Blender's image data, retaining the original CC0 texture unchanged.
    pix=np.array(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4)
    pix[:,:,:3]*=np.array([.91,.83,.72])
    tinted=save_image('Shepherd skin | albedo',pix[:,:,:3])
    tx=skin.node_tree.nodes.new('ShaderNodeTexImage');tx.image=tinted
    skin.node_tree.links.new(tx.outputs['Color'],skinbs.inputs['Base Color'])
noise=skin.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=460
bump=skin.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.17;bump.inputs['Distance'].default_value=.0006
skin.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);skin.node_tree.links.new(bump.outputs['Normal'],skinbs.inputs['Normal'])

mapping={v:i for i,v in enumerate(ids)}
bodyfaces=[[mapping[v] for v in f] for f,g in zip(faces,groups) if g=='body']
bodyuv=[u for u,g in zip(uvs,groups) if g=='body']
body=mesh_obj('Body | shaped anatomy and individual fingers',posed[ids].tolist(),bodyfaces,skin,bodyuv)
finish(body,1)
body['source']='MakeHuman CC0 hm08 base; age/muscle targets; weighted T-pose conversion'
body['height_m']=1.78
print('BODY',len(body.data.vertices),'vertices',tuple(round(a,3) for a in body.dimensions),flush=True)

# Fit the supplied eyeballs through their barycentric correspondence to the base.
ev,ef,eu,eg=parse_obj(SRC/'high-poly.obj')
meta=(SRC/'high-poly.mhclo').read_text().splitlines();start=next(i for i,l in enumerate(meta) if l.startswith('verts '))+1
fitted=[]
for l in meta[start:]:
    a=l.split()
    if len(a)!=9: break
    ix=list(map(int,a[:3]));ww=np.array(list(map(float,a[3:6])));off=np.array(list(map(float,a[6:9])))
    co=(raw[ix]*ww[:,None]).sum(axis=0)+off
    fitted.append((co[0]*scale,-co[2]*scale,(co[1]-floor)*scale+.023))
eye,eyebs=pbr('Eyes | warm brown iris',(.8,.73,.64),.22)
eyeimg=SRC/'brown_eye.png'
if eyeimg.exists():
    tx=eye.node_tree.nodes.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(str(eyeimg));tx.image.pack()
    eye.node_tree.links.new(tx.outputs['Color'],eyebs.inputs['Base Color'])
eyes=mesh_obj('Eyes | cornea and iris',fitted,ef,eye,eu)
finish(eyes,1)
# Explicit sclera and iris geometry gives predictable eyes in both Blender and glTF.
bpy.data.objects.remove(eyes,do_unlink=True)
sclera,sclerabs=pbr('Eyes | softly ivory sclera',(.66,.615,.53),.26)
sclerabs.inputs['Coat Weight'].default_value=.30
sz=512;iy,ix=np.mgrid[0:sz,0:sz]/(sz-1)*2-1
ir=np.sqrt(ix*ix+iy*iy);angle=np.arctan2(iy,ix)
streak=.68+.21*np.sin(angle*91+ir*16)+.11*np.sin(angle*147-ir*31)
col=np.zeros((sz,sz,3));col[:]=(.012,.007,.003)
for k,c in enumerate([.145,.079,.027]):col[:,:,k]=c*streak*(.75+.25*np.sin(ir*PI))
col[ir<.39]=(.003,.002,.001)
col[ir>.94]=(.013,.009,.005)
iris_img=save_image('Eyes | radial brown iris',col)
iris,irisbs=pbr('Eyes | brown iris with limbal ring',(.12,.065,.027),.31)
it=iris.node_tree.nodes.new('ShaderNodeTexImage');it.image=iris_img
iris.node_tree.links.new(it.outputs['Color'],irisbs.inputs['Base Color'])
irisbs.inputs['Coat Weight'].default_value=.36
for side,sign in [('L',1),('R',-1)]:
    center=Vector((sign*.0311,-.1320,1.6898))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=1,location=center)
    ob=bpy.context.object;ob.name='Eyes | '+side+' sclera';ob.scale=(.0152,.0138,.0123)
    move_to(ob,character);ob.data.materials.append(sclera)
    for p in ob.data.polygons:p.use_smooth=True
    vv=[];ff=[];uu=[]
    for j in range(13):
        radius=.00475*j/12
        for i in range(65):
            a=2*PI*i/64;x=radius*math.cos(a);z=radius*math.sin(a)
            y=-.0138*math.sqrt(max(0,1-(x/.0152)**2-(z/.0123)**2))-.00010
            vv.append(tuple(center+Vector((x,y,z))))
            if i and j:
                q=j*65+i;ff.append((q-66,q-65,q,q-1))
                uu.append([(.5+(vv[v][0]-center.x)/.0095,.5+(vv[v][2]-center.z)/.0095) for v in ff[-1]])
    mesh_obj('Eyes | '+side+' iris',vv,ff,iris,uu)

# Tube sweeps are used for seams, stitches and groomed locks, not for anatomy.
def tube_into(verts,faces,points,radius,sides=5):
    offset=len(verts)
    for i,p in enumerate(points):
        p=Vector(p);t=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        if t.length<1e-8:t=Vector((0,0,1))
        t.normalize();a=t.cross(Vector((0,0,1)))
        if a.length<.1:a=t.cross(Vector((0,1,0)))
        a.normalize();b=t.cross(a).normalized()
        rad=radius if isinstance(radius,(float,int)) else radius[i]
        for j in range(sides):
            v=p+rad*(math.cos(2*PI*j/sides)*a+math.sin(2*PI*j/sides)*b);verts.append(tuple(v))
        if i:
            for j in range(sides):faces.append((offset+(i-1)*sides+j,offset+(i-1)*sides+(j+1)%sides,offset+i*sides+(j+1)%sides,offset+i*sides+j))

def tubes(name,paths,radius,material,sides=5):
    vv=[];ff=[]
    for p in paths:
        if len(p)>1:tube_into(vv,ff,p,radius,sides)
    return mesh_obj(name,vv,ff,material)

def ring_surface(name,fn,rows,cols,material,u_repeat=8,v_repeat=5,open_ring=False):
    vv=[fn(j/rows,i/cols) for j in range(rows+1) for i in range(cols+1)]
    ff=[];uu=[]
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;ff.append((a,a+1,a+cols+2,a+cols+1))
            uu.append([(i/cols*u_repeat,j/rows*v_repeat),((i+1)/cols*u_repeat,j/rows*v_repeat),((i+1)/cols*u_repeat,(j+1)/rows*v_repeat),(i/cols*u_repeat,(j+1)/rows*v_repeat)])
    ob=mesh_obj(name,vv,ff,material,uu)
    if not open_ring:
        bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(ob.data);bm.free()
    return ob

def profile(z, table):
    return float(np.interp(z,[v[0] for v in table],[v[1] for v in table]))

TX=[(1.02,.187),(1.10,.183),(1.25,.198),(1.37,.217),(1.46,.226),(1.49,.204),(1.515,.112),(1.53,.063)]
TY=[(1.02,.129),(1.10,.129),(1.25,.133),(1.37,.133),(1.46,.108),(1.49,.095),(1.515,.067),(1.53,.058)]
def signed_power(x,p):return math.copysign(abs(x)**p,x)
def torso_point(z,t,extra=0,folds=True):
    th=2*PI*t;rx=profile(z,TX)+extra;ry=profile(z,TY)+extra
    fold=(.003*math.sin(th*12+z*10)+.002*math.sin(th*21-z*8)) if folds else 0
    power=.64 if z<1.46 else .78
    return ((rx+fold)*signed_power(math.sin(th),power),-.024-(ry+fold)*signed_power(math.cos(th),power),z)

def blouse_fn(v,u):
    z=1.018+v*.512
    p=list(torso_point(z,u))
    # A small center-front slit in the collar.
    if v>.87:p[2]-=.036*max(0,1-min(u,1-u)*45)*((v-.87)/.13)
    return p

tunic=ring_surface('Tunic | shoulder and chest panels',blouse_fn,30,88,linen,10,4)
finish(tunic,1,.0025)

def skirt_fn(v,u):
    z=.536+v*.510;th=2*PI*u
    rx=.246-(.246-.188)*v**.75;ry=.144-(.144-.131)*v
    wave=(.0033*math.sin(th*7+v*.8)+.0052*math.sin(th*13+.4*math.sin(v*6))+.0025*math.sin(th*23-v*.8))*(.35+.65*(1-v))
    z+=.0032*math.sin(th*7+.4)*(1-v)**4
    return ((rx+wave)*signed_power(math.sin(th),.61),-.014-(ry+wave)*signed_power(math.cos(th),.61),z)

skirt=ring_surface('Tunic | knee-length gathered skirt',skirt_fn,32,112,linen,12,4.3)
finish(skirt,1,.003)
hem_paths=[]
for h in [.005,.014]:hem_paths.append([tuple(np.array(skirt_fn(h/.51,t/180))+[0,-.0007,0]) for t in range(181)])
tubes('Tunic | doubled hem stitching',hem_paths,.0008,thread,4)
for side,sign in [('L',1),('R',-1)]:
    def sleeve_fn(v,u):
        x=.179+v*.293;th=2*PI*u
        ry=.087-.016*v;rz=.099-.020*v
        fold=.0026*math.sin(th*9-v*3)+.0018*math.sin(v*22+th*2)
        return (sign*x,-.023+(ry+fold)*math.cos(th),1.451+(rz+fold)*math.sin(th)-.009*v)
    sleeve=ring_surface('Tunic | '+side+' elbow sleeve',sleeve_fn,20,56,linen,3.2,2.4)
    finish(sleeve,1,.003)
    tubes('Tunic | '+side+' cuff seam',[[sleeve_fn(.983,t/112) for t in range(113)]],.0012,thread,5)

# Open-front vest, with shaped armholes cut from its tailored shell.
vrows=38;vcols=104;vv=[]
for j in range(vrows+1):
    z=1.069+j/vrows*.471
    for i in range(vcols+1):
        t=.044+i/vcols*.912
        p=list(torso_point(min(z,1.53),t,.012,False));p[2]=z
        p[2]+=.003*math.sin(t*21)*(1-j/vrows)
        vv.append(p)
ff=[];uu=[]
for j in range(vrows):
    z=1.069+(j+.5)/vrows*.471
    for i in range(vcols):
        t=.044+(i+.5)/vcols*.912;th=t*2*PI
        # Oval armholes at both sides, beneath a real shoulder bridge.
        hole=False
        for center in [PI/2,3*PI/2]:
            if ((th-center)/.49)**2+((z-1.435)/.077)**2<1:hole=True
        if hole:continue
        a=j*(vcols+1)+i;ff.append((a,a+1,a+vcols+2,a+vcols+1))
        uu.append([(i/vcols*8,j/vrows*3),((i+1)/vcols*8,j/vrows*3),((i+1)/vcols*8,(j+1)/vrows*3),(i/vcols*8,(j+1)/vrows*3)])
vest=mesh_obj('Vest | open shearling with armholes',vv,ff,wool,uu)
finish(vest,1,.008)
cloud=bpy.data.textures.new('Shearling surface breakup',type='CLOUDS');cloud.noise_scale=.012;cloud.noise_depth=2
disp=vest.modifiers.new('Small fleece relief', 'DISPLACE');disp.texture=cloud;disp.strength=.0023;disp.mid_level=.5
count=Counter(tuple(sorted((f[k],f[(k+1)%4]))) for f in ff for k in range(4))
bound=[[vv[a],vv[b]] for (a,b),n in count.items() if n==1]
tubes('Vest | bound opening and armhole edges',bound,.0037,trim,5)
backseam=[torso_point(1.074+i/50*.42,.5,.017,False) for i in range(51)]
tubes('Vest | center-back sewn seam',[backseam],.0013,trim,5)

def belt_fn(v,u):
    th=2*PI*u;z=1.025+(v-.5)*.043
    return (.195*signed_power(math.sin(th),.62),-.019-.142*signed_power(math.cos(th),.62),z+.004*math.sin(th))
belt=ring_surface('Belt | continuous leather strap',belt_fn,3,112,leather,8,.35)
finish(belt,0,.005,.0013)
for v in [.13,.87]:
    tubes('Belt | saddle stitch '+str(v),[[belt_fn(v,i/150) for i in range(151)]],.0008,thread,4)

def rounded_rectangle(cx,cy,cz,w,h,r=.005):
    points=[]
    for x,z,a in [(cx+w/2-r,cz+h/2-r,0),(cx-w/2+r,cz+h/2-r,90),(cx-w/2+r,cz-h/2+r,180),(cx+w/2-r,cz-h/2+r,270)]:
        for q in range(6):
            ang=math.radians(a+q/5*90);points.append((x+r*math.cos(ang),cy,z+r*math.sin(ang)))
    return points+[points[0]]

tubes('Belt | bronze frame buckle',[rounded_rectangle(.017,-.170,1.027,.054,.046)],.0032,bronze,8)
tubes('Belt | buckle tongue',[[(.014,-.172,1.027),(.039,-.172,1.027)]],.0019,bronze,6)
tailverts=[];tailfaces=[];tailuv=[]
for j in range(21):
    t=j/20;z=1.015-.192*t;x=.060+.012*math.sin(t*3.2);y=-.171-.012*math.sin(t*PI)
    width=.024*(1-.38*max(0,(t-.8)/.2))
    tailverts.extend([(x-width/2,y,z),(x+width/2,y,z)])
    if j:
        tailfaces.append((2*j-2,2*j-1,2*j+1,2*j));tailuv.append([(0,t),(1,t),(1,t+.05),(0,t+.05)])
tail=mesh_obj('Belt | hanging strap',tailverts,tailfaces,leather,tailuv);finish(tail,1,.004,.001)
print('CLOTHING BUILT',flush=True)

# Surface queries serve sandals and surface-following grooming.
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
evalbody=body.evaluated_get(deps);bmsh=evalbody.to_mesh();bmsh.calc_loop_triangles()
surfverts=[Vector(v.co) for v in bmsh.vertices]
tris=[tuple(t.vertices) for t in bmsh.loop_triangles]
bvh=BVHTree.FromPolygons(surfverts,tris,all_triangles=True)
BODY_SURFACE=(surfverts,tris)

def sandals():
    for side,sign in [('L',1),('R',-1)]:
        points=np.array([v for v in posed[ids] if v[2]<.12 and v[0]*sign>0])
        cx=float(np.median(points[:,0]));ymin=float(points[:,1].min())-.011;ymax=float(points[:,1].max())+.012
        # An anatomical sole outline with a broad toe and narrowed arch/heel.
        outline=[]
        for i in range(72):
            a=2*PI*i/72;y=(ymin+ymax)/2+(ymax-ymin)/2*math.cos(a)
            t=(y-ymin)/(ymax-ymin);w=profile(t,[(0,.025),(.15,.059),(.36,.058),(.65,.041),(.86,.043),(1,.026)])
            x=cx+w*math.sin(a)
            outline.append((x,y))
        verts=[(x,y,z) for z in [.005,.023] for x,y in outline]
        faces=[tuple(reversed(range(72))),tuple(range(72,144))]
        faces += [(i,(i+1)%72,(i+1)%72+72,i+72) for i in range(72)]
        ob=mesh_obj('Sandals | '+side+' shaped leather sole',verts,faces,leather);finish(ob,0,0,.004)
        # Give the sole a UV map in physical space.
        layer=ob.data.uv_layers.new(name='UVMap')
        for poly in ob.data.polygons:
            for li in poly.loop_indices:
                v=ob.data.vertices[ob.data.loops[li].vertex_index].co;layer.data[li].uv=(v.x*12,v.y*12)
        tubes('Sandals | '+side+' sole welt', [[(x,y,.023) for x,y in outline+[outline[0]]]],.0011,thread,4)
        for k,cy in enumerate([ymin+.070,ymin+.130]):
            vv=[];ff=[];uu=[]
            width=.027 if k==0 else .031
            for j in range(4):
                y=cy+(j/3-.5)*width
                for i in range(29):
                    x=cx+(i/28-.5)*.126
                    loc,no,face,dist=bvh.ray_cast(Vector((x,y,.28)),Vector((0,0,-1)),.30)
                    z=max(.033,loc.z+.005) if loc else .032
                    vv.append((x,y,z))
                    if j and i:
                        a=j*29+i;ff.append((a-30,a-29,a,a-1));uu.append([(i/28,j/3),(i/28+.036,j/3),(i/28+.036,j/3+.3),(i/28,j/3+.3)])
            strap=mesh_obj('Sandals | '+side+' fitted foot strap '+str(k+1),vv,ff,leather,uu);finish(strap,1,.005,.001)
        # Ankle strap with vertical leather keepers anchored to the sole.
        ankle=bonehead('foot.'+side);ax=ankle.x;ay=ankle.y
        def ankle_fn(v,u):
            th=u*2*PI
            return (ax+.041*math.sin(th),ay-.043*math.cos(th),.114+(v-.5)*.023)
        ankle_ob=ring_surface('Sandals | '+side+' ankle strap',ankle_fn,2,56,leather,2,.3)
        finish(ankle_ob,0,.004,.001)
        for sg in [-1,1]:
            vv=[]
            for j in range(9):
                f=j/8
                for k in [-1,1]:vv.append((ax+sg*(.048-.007*f),ay+.009+k*.008,.026+f*.091))
            ff=[(j*2,j*2+1,j*2+3,j*2+2) for j in range(8)]
            keeper=mesh_obj('Sandals | '+side+' heel keeper '+str(sg),vv,ff,leather)
            finish(keeper,1,.004,.001)
        tubes('Sandals | '+side+' bronze ankle clasp',[rounded_rectangle(ax+sign*.029,ay-.037,.114,.017,.021,.003)],.0013,bronze,6)
sandals()

# Grooming is implemented below, after the anatomical surface is available.
def groom():
    sv,st=BODY_SURFACE
    info=[]
    for tri in st:
        a,b,c=[sv[i] for i in tri]
        cross=(b-a).cross(c-a);area=cross.length/2
        if area>1e-10:info.append((tri,(a+b+c)/3,cross.normalized(),area))
    def scalp_mask(p,n):
        if p.z<1.648 or abs(p.x)>.087:return False
        front=max(0,min(1,(-p.y-.015)/.102))
        front=front*front*(3-2*front)
        cut=1.648+.105*front-.018*(min(1,abs(p.x)/.08)**2)*front
        return p.z>cut
    mouth=bonehead('oris01');print('GROOM mouth',tuple(mouth),flush=True)
    mz=1.605
    def beard_mask(p,n):
        if not (1.562<p.z<1.683 and p.y<-.070 and n.y<.25 and abs(p.x)<.077):return False
        top=mz+.012+.051*(min(1,abs(p.x)/.07)**1.3)
        if p.z>top:return False
        if abs(p.x)<.025 and mz-.006<p.z<mz+.009:return False
        return True
    def moustache_mask(p,n):
        return abs(p.x)<.034 and mz+.011<p.z<mz+.025 and p.y<-.137 and n.y<-.2
    def brow_mask(p,n):
        return .013<abs(p.x)<.060 and 1.712<p.z<1.727-.10*abs(p.x) and p.y<-.117 and n.y<-.25
    def grow(name,mask,count,root_offset,length,width,curl_radius,turns):
        choices=[q for q in info if mask(q[1],q[2])]
        if not choices:return
        capv=[];capf=[]
        for tri,c,n,a in choices:
            start=len(capv);capv.extend([tuple(sv[i]+n*root_offset*.55) for i in tri]);capf.append((start,start+1,start+2))
        cap=mesh_obj(name+' | root coverage',capv,capf,hairmat if turns>1 else beardroot)
        bm=bmesh.new();bm.from_mesh(cap.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0003);bm.to_mesh(cap.data);bm.free()
        weights_area=np.array([q[3] for q in choices]);weights_area/=weights_area.sum()
        vv=[];ff=[];lv=[];lf=[]
        for pick in rng.choice(len(choices),size=count,p=weights_area):
            tri,c,n,area=choices[int(pick)];a,b,c=[sv[i] for i in tri]
            u=random.random();v=random.random()
            if u+v>1:u=1-u;v=1-v
            root=a+(b-a)*u+(c-a)*v+n*root_offset
            t=n.cross(Vector((0,0,1)))
            if t.length<.2:t=n.cross(Vector((0,1,0)))
            t.normalize();bt=n.cross(t).normalized()
            phase=random.random()*2*PI;rad=curl_radius*random.uniform(.65,1.3)
            ln=length*random.uniform(.7,1.25)
            steps=19 if turns>1 else 8
            points=[];radii=[]
            for k in range(steps):
                f=k/(steps-1);ang=phase+turns*2*PI*f
                if turns>1:
                    rr=rad*(.30+.70*math.sin(PI*f))
                    pos=root+t*(rr*math.cos(ang))+bt*(rr*math.sin(ang))+n*(ln*math.sin(PI*f*.87))
                else:
                    down=Vector((0,0,-1));down=(down-n*down.dot(n))
                    if down.length<.2:down=bt
                    down.normalize()
                    pos=root+down*(ln*f)+n*(.002*math.sin(PI*f))+t*(rad*math.sin(ang)*f)
                points.append(pos);radii.append(width*(.90-.72*f)*random.uniform(.92,1.08))
            if random.random()<.17:tube_into(lv,lf,points,radii,5 if turns>1 else 4)
            else:tube_into(vv,ff,points,radii,5 if turns>1 else 4)
        mesh_obj(name+' | groomed locks',vv,ff,hairmat)
        if lv:mesh_obj(name+' | varied brown strands',lv,lf,hairlight)
    grow('Hair | short irregular curls',scalp_mask,1250,.0023,.014,.00150,.0056,1.30)
    grow('Beard | close-cropped cheek and jaw',beard_mask,2300,.0008,.0044,.00043,.0007,.3)
    grow('Moustache | split above upper lip',moustache_mask,500,.0008,.0043,.00044,.0005,.25)
    print('GROOMING BUILT',flush=True)

groom()
evalbody.to_mesh_clear()

# Brows follow the actual forehead surface, above the modeled eyelid rims.
for sign,label in [(1,'L'),(-1,'R')]:
    vv=[];ff=[]
    for k in range(420):
        t=random.random();x=sign*(.015+t*.045)
        z=1.707+.003*math.sin(t*PI)-.006*t+random.uniform(-.0024,.0024)*(1-t*.65)
        root,normal,face,dist=bvh.ray_cast(Vector((x,-.4,z)),Vector((0,1,0)),.45)
        if root is None:continue
        root+=normal*.0007
        ln=random.uniform(.0025,.0044)*(1-.6*t)
        pts=[root+Vector((sign*ln*f,-.00035*math.sin(PI*f),ln*.35*math.sin(PI*f))) for f in [0,.25,.5,.75,1]]
        tube_into(vv,ff,pts,[.00036,.00038,.00033,.00022,.00009],3)
    mesh_obj('Eyebrows | '+label+' groomed brow',vv,ff,hairmat)

# Fine, irregular fleece tufts soften the vest's silhouette.
vest.data.calc_loop_triangles()
vtri=list(vest.data.loop_triangles)
areas=np.array([t.area for t in vtri]);areas/=areas.sum()
wv=[];wf=[]
for pick in rng.choice(len(vtri),size=1300,p=areas):
    tri=vtri[int(pick)];a,b,c=[vest.data.vertices[i].co for i in tri.vertices]
    n=(b-a).cross(c-a).normalized();u=random.random();v=random.random()
    if u+v>1:u=1-u;v=1-v
    p=a+(b-a)*u+(c-a)*v+n*.005
    tangent=n.cross(Vector((0,0,1)))
    if tangent.length<.1:tangent=n.cross(Vector((0,1,0)))
    tangent.normalize();other=n.cross(tangent)
    phase=random.random()*2*PI;pts=[]
    for j in range(7):
        t=j/6;rad=.0018*math.sin(PI*t)
        pts.append(p+tangent*rad*math.cos(t*5+phase)+other*rad*math.sin(t*5+phase)+n*.0035*math.sin(PI*t))
    tube_into(wv,wf,pts,[.0005*(1-j/9) for j in range(7)],3)
fuzzmat,_=pbr('Wool | loose fleece tips',(.56,.465,.341),.98)
mesh_obj('Vest | short loose fleece tufts',wv,wf,fuzzmat)

def look_at(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.cycles.max_bounces=6
scene.cycles.transparent_max_bounces=4
scene.world.color=(.25,.25,.25)
world=scene.world;world.use_nodes=True
world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.48,.52,.57,1)
world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.35
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG'
scene.render.resolution_x=1100;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.film_transparent=False
floor_mat,_=pbr('Studio | neutral warm grey',(.225,.235,.245),.94)
bpy.ops.mesh.primitive_plane_add(size=200)
ground=bpy.context.object;ground.name='Studio ground';move_to(ground,stage);ground.data.materials.append(floor_mat)
ground.scale=(30,30,30)
for name,loc,power,size,col in [('Key | large softbox',(-3,-4,5),500,4,(1,.90,.80)),('Fill | cool softbox',(3,-1,3),220,3,(.8,.9,1)),('Rim | shoulder edge',(1,3,4),420,3,(1,.96,.87))]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=col
    ob=bpy.data.objects.new(name,data);stage.objects.link(ob);ob.location=loc;look_at(ob,(0,0,1))
for name,loc in [('01 FRONT',(0,-5,.92)),('02 SIDE',(5,0,.92)),('03 BACK',(0,5,.92)),('04 THREE-QUARTER',(3.2,-5,1.5)),('05 PORTRAIT',(.45,-2.8,1.72))]:
    data=bpy.data.cameras.new(name);data.type='ORTHO';data.ortho_scale=.64 if 'PORTRAIT' in name else 2.18
    ob=bpy.data.objects.new(name,data);stage.objects.link(ob);ob.location=loc
    look_at(ob,(0,-.02,1.57) if 'PORTRAIT' in name else (0,0,.91))
scene.camera=bpy.data.objects['04 THREE-QUARTER']

refpath=ROOT.parents[1]/'shepherd-reference-sheet.png'
im=bpy.data.images.load(str(refpath));im.pack()
refob=bpy.data.objects.new('Original reference sheet',None);reference.objects.link(refob)
refob.empty_display_type='IMAGE';refob.data=im;refob.empty_display_size=4.1
refob.location=(0,.7,.9);refob.rotation_euler=(PI/2,0,0);refob.color[3]=.7;refob.hide_render=True
reference.hide_viewport=True
scene.unit_settings.system='METRIC'
scene['study']='Reference-guided Blender modeling; anatomical base reuse plus procedural tailoring and grooming.'
scene['reference_image']='../../shepherd-reference-sheet.png'

# Open in a useful material-preview three-quarter view; the reference is toggleable.
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active;space.shading.type='MATERIAL'
            space.overlay.show_floor=False;space.overlay.show_axis_x=False;space.overlay.show_axis_y=False
            space.region_3d.view_distance=3.0;space.region_3d.view_location=(0,0,.92)
            space.region_3d.view_rotation=bpy.data.objects['04 THREE-QUARTER'].rotation_euler.to_quaternion()
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'shepherd.blend'))
scene.render.filepath=str(OUT/'preview.png')
bpy.ops.render.render(write_still=True)
scene.camera=bpy.data.objects['05 PORTRAIT']
scene.render.filepath=str(OUT/'portrait-preview.png')
bpy.ops.render.render(write_still=True)
print('BUILD COMPLETE',flush=True)
