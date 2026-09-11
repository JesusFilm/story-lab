"""Non-destructive runtime LOD from the existing Tripo wall segment."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[5]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'prototypes/shepherd-adventure/assets/low-wall-kit-tripo-v2.glb'))
for o in list(bpy.data.objects):
 if o.type=='MESH':
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  modifier=o.modifiers.new('Perimeter runtime LOD','DECIMATE');modifier.ratio=.20
  bpy.ops.object.modifier_apply(modifier=modifier.name);o.select_set(False)
out=Path(__file__).with_name('low-wall-perimeter.glb')
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB')
print('Runtime wall export:',out)
