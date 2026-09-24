import * as THREE from 'three';
import {JourneyCamera} from './journey-camera.mjs';
import {renderingBudget} from './mobile-rendering.mjs';

// Shared renderer and lighting for the game and the route rehearsal.
export function createJourneyScene(canvas){
const budget=renderingBudget();
const renderer=new THREE.WebGLRenderer({canvas,antialias:budget.antialias});renderer.setPixelRatio(budget.pixelRatio);renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=!budget.mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#020409');scene.fog=new THREE.Fog('#071020',28,100);
const cameraRig=new JourneyCamera();
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,500);
scene.add(new THREE.HemisphereLight('#91b6dd','#263047',.65));
const moon=new THREE.DirectionalLight('#93b7e9',1.05);moon.position.set(-35,50,25);moon.castShadow=true;moon.shadow.mapSize.set(budget.shadowSize,budget.shadowSize);Object.assign(moon.shadow.camera,{left:-55,right:55,top:65,bottom:-65,near:1,far:160});moon.shadow.normalBias=.06;moon.shadow.bias=-.0003;scene.add(moon,moon.target);
// Broad, soft starlight falls across the settlement while the horizon stays dark.
const starlight=new THREE.SpotLight('#8bb9ff',1800,160,.67,.85,2);
starlight.position.set(-18,62,-28);starlight.target.position.set(0,0,-8);scene.add(starlight,starlight.target);
const star=new THREE.Mesh(new THREE.SphereGeometry(.24,12,8),new THREE.MeshBasicMaterial({color:'#d8e8ff',toneMapped:false,fog:false}));star.position.copy(starlight.position);scene.add(star);
// Soft transparent shaft makes the star's illumination legible from the fields.
const beamGeometry=new THREE.ConeGeometry(24,62,48,1,true);beamGeometry.translate(0,-31,0);
const beam=new THREE.Mesh(beamGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
 vertexShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 view=modelViewMatrix*vec4(position,1.);vView=-view.xyz;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float fade=sin(vUv.y*3.14159)*smoothstep(0.,.4,abs(dot(normalize(vNormal),normalize(vView))));gl_FragColor=vec4(.35,.55,1.,fade*.035);}`}));
beam.position.copy(starlight.position);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),starlight.target.position.clone().sub(starlight.position).normalize());scene.add(beam);
const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=128;const starContext=starCanvas.getContext('2d'),starGradient=starContext.createRadialGradient(64,64,0,64,64,64);starGradient.addColorStop(0,'#ffffff');starGradient.addColorStop(.08,'#e2efffff');starGradient.addColorStop(.25,'#a7caff88');starGradient.addColorStop(1,'#8bb9ff00');starContext.fillStyle=starGradient;starContext.fillRect(0,0,128,128);
const starHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(starCanvas),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,toneMapped:false}));starHalo.position.copy(star.position);starHalo.scale.set(7,7,7);scene.add(starHalo);
return {renderer,scene,camera,cameraRig,budget};
}
