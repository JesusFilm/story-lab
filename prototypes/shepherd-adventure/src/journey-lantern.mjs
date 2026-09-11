import * as THREE from 'three';

export const LANTERN_URL='/assets/portable-lantern-tripo.glb';
export const CARRIED_LANTERN_HEIGHT=.30;
export const SETTLEMENT_LANTERN_HEIGHT=.40;

// Reuse the export's geometry and textures; fitting never modifies the source.
export function fitLantern(source,totalHeight){
 const model=source.clone(true),root=new THREE.Group();root.name='portable-lantern-tripo';
 root.userData.assetId='structure-lamp';root.userData.heightMetres=totalHeight;
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<=0)throw new Error('The lantern model has invalid bounds');
 const scale=totalHeight/size.y,fitted=new THREE.Group();fitted.add(model);fitted.scale.setScalar(scale);fitted.position.copy(center).multiplyScalar(-scale);
 model.traverse(o=>{if(o.isMesh){
  o.castShadow=true;o.receiveShadow=true;o.geometry.computeBoundingBox();
  const box=o.geometry.boundingBox,minY=box.min.y,height=box.max.y-box.min.y;
  const illuminate=original=>{
   const material=original.clone();material.emissive.set('#ffc36a');material.emissiveIntensity=1.8;
   // The exported glass shares an opaque atlas with the bronze. Mask emission to
   // pale pane pixels in the chamber; preserve all original PBR maps and geometry.
   material.onBeforeCompile=shader=>{
    shader.uniforms.lanternMinY={value:minY};shader.uniforms.lanternHeight={value:height};
    shader.vertexShader='varying float vLanternHeight;uniform float lanternMinY;uniform float lanternHeight;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLanternHeight=(position.y-lanternMinY)/lanternHeight;');
    shader.fragmentShader='varying float vLanternHeight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     float chamber=smoothstep(.1,.17,vLanternHeight)*(1.-smoothstep(.55,.61,vLanternHeight));
     float pale=smoothstep(.16,.42,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));
     totalEmissiveRadiance*=chamber*pale;`);
   };
   material.customProgramCacheKey=()=> 'lantern-pane-emission-v1';return material;
  };
  o.material=Array.isArray(o.material)?o.material.map(illuminate):illuminate(o.material);
 }});root.add(fitted);return root;
}

export function setLanternLit(root,enabled){
 root.traverse(o=>{if(o.isMesh)for(const material of Array.isArray(o.material)?o.material:[o.material])if(material.isMeshStandardMaterial)material.emissiveIntensity=enabled?1.8:0;});
}
