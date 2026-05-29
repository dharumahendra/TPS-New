// ═══════════════════════════════════════════════════════════════
// js/main.js — Entry Point
// Scene, Camera, Renderer, Lighting, OrbitControls, Animate Loop
// ═══════════════════════════════════════════════════════════════
import * as THREE                from 'three';
import { OrbitControls }         from 'three/addons/controls/OrbitControls.js';
import { buildRoad }             from './road.js';
import { addLabels }             from './labels.js';
import { initSimulation, updateSimulation, state } from './simulation.js';
import { initUI, updateFPS }     from './ui.js';

// ── SCENE ─────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog        = new THREE.FogExp2(0x1a1a1a, 0.018);

// ── RENDERER ──────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace   = THREE.SRGBColorSpace;
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// ── CAMERA ────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

// Posisi isometrik dari atas-kanan, target ke tengah peta
const CAM_DEFAULT_POS    = new THREE.Vector3(20, 18, 22);
const CAM_DEFAULT_TARGET = new THREE.Vector3(0, 0, 8);
camera.position.copy(CAM_DEFAULT_POS);

// ── ORBIT CONTROLS ────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(CAM_DEFAULT_TARGET);
controls.enableDamping   = true;
controls.dampingFactor   = 0.07;
controls.minDistance     = 5;
controls.maxDistance     = 90;
controls.maxPolarAngle   = Math.PI / 2.1;
controls.screenSpacePanning = false;
controls.update();

// ── RESET VIEW (smooth lerp) ──────────────────────────────────
let  isResetting   = false;
const resetTarget  = new THREE.Vector3();
const resetCamPos  = new THREE.Vector3();

function resetView() {
  isResetting  = true;
  resetCamPos.copy(CAM_DEFAULT_POS);
  resetTarget.copy(CAM_DEFAULT_TARGET);
}

// ── LIGHTING ──────────────────────────────────────────────────
// Ambient — pencahayaan dasar
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// Directional — matahari
const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
sun.position.set(15, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.width  = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near    = 0.5;
sun.shadow.camera.far     = 80;
sun.shadow.camera.left    = -35;
sun.shadow.camera.right   = 35;
sun.shadow.camera.top     = 35;
sun.shadow.camera.bottom  = -35;
sun.shadow.bias           = -0.001;
scene.add(sun);

// Hemisphere — sky/ground bounce
const hemi = new THREE.HemisphereLight(0x4488cc, 0x223322, 0.35);
scene.add(hemi);

// Fill light dari kiri
const fill = new THREE.DirectionalLight(0xaabbff, 0.25);
fill.position.set(-15, 10, -5);
scene.add(fill);

// ── BUILD WORLD ───────────────────────────────────────────────
const roadData = buildRoad(scene);
addLabels(scene);

// ── INIT SIMULATION ───────────────────────────────────────────
const seedVal = document.getElementById('seed-input')?.value || '42';
initSimulation(scene, parseInt(seedVal));

// ── INIT UI ───────────────────────────────────────────────────
const cameraRig = { camera, controls, resetView };
initUI(scene, cameraRig);

// Initial resize
onResize();

// ── ANIMATE LOOP ──────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const rawDelta = clock.getDelta();
  // Clamp deltaTime supaya tidak terlalu besar saat tab tidak aktif
  const delta    = Math.min(rawDelta, 0.05) * state.speedMult;

  // OrbitControls update (damping)
  controls.update();

  // Smooth reset view
  if (isResetting) {
    camera.position.lerp(resetCamPos, 0.06);
    controls.target.lerp(resetTarget, 0.06);

    const distPos = camera.position.distanceTo(resetCamPos);
    const distTgt = controls.target.distanceTo(resetTarget);
    if (distPos < 0.1 && distTgt < 0.1) {
      camera.position.copy(resetCamPos);
      controls.target.copy(resetTarget);
      isResetting = false;
    }
    controls.update();
  }

  // Update simulasi
  if (state.running) {
    updateSimulation(delta);
  }

  // Render
  renderer.render(scene, camera);

  // FPS counter
  updateFPS();
}

animate();
