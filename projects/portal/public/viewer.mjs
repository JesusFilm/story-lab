import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const host=document.querySelector('.viewer'),canvas=host.querySelector('canvas'),status=document.querySelector('#model-status');
try {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#172b39');
 scene.add(new THREE.HemisphereLight(0xffffff,0x546172,3));
 const light=new THREE.DirectionalLight(0xffefd8,3);light.position.set(3,5,4);scene.add(light);
 const camera=new THREE.PerspectiveCamera(38,1,.01,1000);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;
 const model=(await new GLTFLoader().loadAsync(host.dataset.model)).scene;
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 model.position.sub(center);scene.add(model);
 const radius=Math.max(size.x,size.y,size.z,.01),distance=radius*2.3;
 controls.minDistance=radius*.7;controls.maxDistance=radius*6;
 function reset(){camera.position.set(distance*.65,distance*.35,distance);controls.target.set(0,0,0);controls.update();}
 function rotate(delta){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),delta);camera.position.copy(controls.target).add(offset);controls.update();}
 function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}
 reset();status.hidden=true;
 document.querySelector('#reset').onclick=reset;
 document.querySelector('#rotate-left').onclick=()=>rotate(-.25);
 document.querySelector('#rotate-right').onclick=()=>rotate(.25);
 document.querySelector('#zoom-in').onclick=()=>zoom(.85);
 document.querySelector('#zoom-out').onclick=()=>zoom(1.15);
 canvas.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','+','=','-'].includes(event.key)){event.preventDefault();if(event.key==='ArrowLeft')rotate(-.15);else if(event.key==='ArrowRight')rotate(.15);else zoom(event.key==='-'?1.15:.85);}});
 new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(host);
 renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
} catch(error) {status.textContent='The 3D preview could not load. Try reloading in a WebGL 2 browser. You can still view the reference art and prompt.';console.error(error);}
