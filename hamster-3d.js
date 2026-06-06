import * as THREE from './vendor/three/build/three.module.js';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';

window.__hamster3dStatus = 'module-loaded';

const hamster = document.getElementById('hamster');
const canvas = document.getElementById('hamster-3d-canvas');

if (!hamster || !canvas) {
  throw new Error('Hamster 3D mount not found');
}

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas,
  powerPreference: 'high-performance',
});

renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
camera.position.set(0, 0.18, 4.6);
camera.lookAt(0, 0, 0);

const keyLight = new THREE.DirectionalLight(0xffefd0, 3.1);
keyLight.position.set(2.4, 3.4, 4.2);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.HemisphereLight(0xfff2d8, 0x7b5d93, 2.4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xbdd8ff, 1.9);
rimLight.position.set(-2.8, 1.8, -2.2);
scene.add(rimLight);

const root = new THREE.Group();
const modelPivot = new THREE.Group();
root.add(modelPivot);
scene.add(root);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.92, 48),
  new THREE.MeshBasicMaterial({
    color: 0x2b1732,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.set(0, -0.82, 0);
shadow.scale.set(1.25, 0.42, 1);
scene.add(shadow);

const clock = new THREE.Clock();
const loader = new GLTFLoader();
let loadedModel = null;
let rafId = 0;
let visible = true;
let baseY = 0;

const state = {
  current: 'idle',
  actionTime: 0,
};

const MODEL_FRONT_Y = Math.PI;

const classToState = () => {
  if (hamster.classList.contains('sleeping')) return 'sleeping';
  if (hamster.classList.contains('eating') || hamster.classList.contains('mouth-open')) return 'eating';
  if (hamster.classList.contains('happy') || hamster.classList.contains('bounce')) return 'happy';
  if (hamster.classList.contains('walking')) return 'walking';
  if (hamster.classList.contains('catching')) return 'catching';
  return 'idle';
};

function resize() {
  const rect = hamster.getBoundingClientRect();
  const size = Math.max(180, Math.ceil(Math.max(rect.width, rect.height) * 1.65));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(size, size, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}

function normalizeModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;

  model.position.sub(center);
  model.scale.setScalar(1.95 / maxAxis);

  const normalizedBox = new THREE.Box3().setFromObject(model);
  const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
  const normalizedSize = normalizedBox.getSize(new THREE.Vector3());
  model.position.x -= normalizedCenter.x;
  model.position.y -= normalizedCenter.y;
  model.position.z -= normalizedCenter.z;
  baseY = -0.08 + Math.max(0, 1.5 - normalizedSize.y) * 0.1;
  modelPivot.position.y = baseY;
}

function prepareMaterials(model) {
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    if (node.material) {
      node.material.roughness = Math.min(node.material.roughness ?? 0.75, 0.86);
      node.material.envMapIntensity = 0.65;
      node.material.needsUpdate = true;
    }
  });
}

function updateState() {
  const next = classToState();
  if (next !== state.current) {
    state.current = next;
    state.actionTime = 0;
  }
}

function animateModel(delta, elapsed) {
  state.actionTime += delta;

  const t = state.actionTime;
  const idleBob = Math.sin(elapsed * 1.8) * 0.018;
  const idleTurn = Math.sin(elapsed * 0.85) * 0.035;

  root.position.set(0, idleBob, 0);
  root.rotation.set(0, idleTurn, 0);
  root.scale.setScalar(1);
  modelPivot.position.y = baseY;
  modelPivot.rotation.set(0, MODEL_FRONT_Y, 0);

  shadow.scale.set(1.2 + idleBob * 1.2, 0.4, 1);
  shadow.material.opacity = 0.22 - idleBob * 0.4;

  if (state.current === 'walking') {
    root.position.y = Math.sin(t * 6) * 0.015;
    root.rotation.z = Math.sin(t * 5) * 0.018;
    root.rotation.y = idleTurn + Math.sin(t * 4) * 0.025;
    shadow.scale.set(1.22, 0.38, 1);
  } else if (state.current === 'happy' || state.current === 'catching') {
    const hop = Math.max(0, Math.sin(t * 5)) * 0.04;
    root.position.y = hop;
    root.rotation.z = Math.sin(t * 5) * 0.025;
    root.rotation.y = idleTurn + Math.sin(t * 4) * 0.04;
    root.scale.set(1 + hop * 0.04, 1 - hop * 0.02, 1 + hop * 0.02);
    shadow.scale.set(1.16 + hop * 0.35, 0.36, 1);
    shadow.material.opacity = 0.23 - hop * 0.18;
  } else if (state.current === 'eating') {
    const chew = Math.sin(t * 8);
    root.position.y = -0.005 + Math.abs(chew) * 0.008;
    root.rotation.x = 0.015 + Math.max(0, chew) * 0.015;
    root.rotation.y = idleTurn * 0.5;
    root.scale.set(1.015 + Math.abs(chew) * 0.01, 0.99, 1.01);
  } else if (state.current === 'sleeping') {
    root.position.y = -0.025 + Math.sin(elapsed * 1.1) * 0.008;
    root.rotation.z = -0.035;
    root.rotation.x = 0.025;
    root.scale.set(1.015, 0.985, 1.01);
    shadow.scale.set(1.26, 0.36, 1);
    shadow.material.opacity = 0.19;
  }
}

function renderLoop() {
  if (!visible) return;
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  updateState();
  animateModel(delta, elapsed);
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(renderLoop);
}

function setReady() {
  window.__hamster3dStatus = 'model-ready';
  hamster.classList.add('model-ready');
  resize();
  if (!rafId) renderLoop();
}

function setFallback(error) {
  window.__hamster3dStatus = `fallback: ${error?.message || error}`;
  console.warn('Could not load hamster 3D model:', error);
  hamster.classList.remove('model-ready');
  canvas.setAttribute('hidden', '');
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  visible = !document.hidden;
  if (visible && loadedModel && !rafId) {
    clock.getDelta();
    renderLoop();
  } else if (!visible && rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
});

loader.load(
  'assets/hamster.glb',
  (gltf) => {
    loadedModel = gltf.scene;
    prepareMaterials(loadedModel);
    normalizeModel(loadedModel);
    modelPivot.add(loadedModel);

    setReady();
  },
  undefined,
  setFallback,
);
