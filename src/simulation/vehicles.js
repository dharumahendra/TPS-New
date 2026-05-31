// ═══════════════════════════════════════════════════════════════
// js/vehicles.js — Procedural Car & Motorcycle Builders
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

// Warna pool per tipe kendaraan (dibuat lebih cerah agar kontras dengan jalan)
const CAR_COLORS   = [0xfafafa, 0xff4444, 0x4488ff, 0xffcc00, 0x44cc66, 0xee77ee, 0x44eeee, 0xffaa44];
const MOTOR_COLORS = [0xfafafa, 0xff4444, 0x4488ff, 0xffaa00, 0x44ccaa, 0xee55aa];

// Material roda (shared)
const WHEEL_MAT = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
const WHEEL_RIM  = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.8 });

/**
 * Buat material body kendaraan.
 */
function bodyMat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.25,
  });
}

/**
 * Buat satu roda (ban + velg).
 * @param {number} r      - radius
 * @param {number} h      - ketebalan
 * @param {number} rimR   - radius velg
 */
function makeWheel(r = 0.2, h = 0.15, rimR = 0.1) {
  const group = new THREE.Group();

  // Ban
  const tireGeo = new THREE.CylinderGeometry(r, r, h, 16);
  tireGeo.rotateX(Math.PI / 2); // Putar geometry sehingga sumbu (axle) sejajar dengan Z
  const tire = new THREE.Mesh(tireGeo, WHEEL_MAT);
  
  // Velg
  const rimGeo = new THREE.CylinderGeometry(rimR, rimR, h + 0.01, 8);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, WHEEL_RIM);

  group.add(tire, rim);

  return group;
}

/**
 * Buat model mobil prosedural.
 * @param {number} colorHex - warna acak dari pool
 * @returns {{ group: THREE.Group, wheels: THREE.Group[], type: string }}
 */
export function createCar(colorHex) {
  const color = colorHex ?? CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
  const mat   = bodyMat(color);
  const group = new THREE.Group();

  // ── Body utama ──────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.55, 0.9),
    mat
  );
  body.position.set(0, 0.3, 0);
  body.castShadow = true;
  group.add(body);

  // ── Kabin (di atas belakang) ─────────────────────────────────
  const cabinMat = bodyMat(blendColor(color, 0x000000, 0.15));
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.48, 0.82),
    cabinMat
  );
  cabin.position.set(-0.2, 0.76, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Kaca depan (garis gelap)
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.38, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.7 })
  );
  windshield.position.set(0.31, 0.76, 0);
  group.add(windshield);

  // ── Lampu depan ──────────────────────────────────────────────
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 0.6
  });
  [-0.25, 0.25].forEach(zOff => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.18), headlightMat);
    hl.position.set(0.91, 0.32, zOff);
    group.add(hl);
  });

  // ── Lampu belakang ───────────────────────────────────────────
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5
  });
  [-0.28, 0.28].forEach(zOff => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.15), taillightMat);
    tl.position.set(-0.91, 0.34, zOff);
    group.add(tl);
  });

  // ── 4 Roda ───────────────────────────────────────────────────
  const wheelPositions = [
    [ 0.65, 0.2, -0.46],  // depan kanan
    [ 0.65, 0.2,  0.46],  // depan kiri
    [-0.65, 0.2, -0.46],  // belakang kanan
    [-0.65, 0.2,  0.46],  // belakang kiri
  ];

  const wheels = wheelPositions.map(([wx, wy, wz]) => {
    const w = makeWheel(0.2, 0.15, 0.1);
    w.position.set(wx, wy, wz);
    group.add(w);
    return w;
  });

  return { group, wheels, type: 'car', baseColor: color };
}

/**
 * Buat model motor prosedural.
 * @param {number} colorHex
 * @returns {{ group: THREE.Group, wheels: THREE.Group[], type: string }}
 */
export function createMotorcycle(colorHex) {
  const color = colorHex ?? MOTOR_COLORS[Math.floor(Math.random() * MOTOR_COLORS.length)];
  const mat   = bodyMat(color);
  const group = new THREE.Group();

  // ── Body ramping ──────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.35, 0.4),
    mat
  );
  body.position.set(0, 0.42, 0);
  body.castShadow = true;
  group.add(body);

  // ── Tangki / seat ─────────────────────────────────────────────
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.22, 0.35),
    bodyMat(blendColor(color, 0xffffff, 0.1))
  );
  tank.position.set(0.1, 0.58, 0);
  group.add(tank);

  // ── Setang ────────────────────────────────────────────────────
  const handlebar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 })
  );
  handlebar.position.set(0.5, 0.58, 0);
  group.add(handlebar);

  // ── Knalpot ───────────────────────────────────────────────────
  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.9 })
  );
  exhaust.rotation.z = Math.PI / 2;
  exhaust.position.set(-0.3, 0.25, 0.22);
  group.add(exhaust);

  // ── Lampu depan ───────────────────────────────────────────────
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 0.5 });
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), hlMat);
  hl.position.set(0.62, 0.46, 0);
  group.add(hl);

  // ── 2 Roda (lebih besar) ─────────────────────────────────────
  const wheelPositions = [
    [ 0.5, 0.28, 0],   // depan
    [-0.5, 0.28, 0],   // belakang
  ];

  const wheels = wheelPositions.map(([wx, wy, wz]) => {
    const w = makeWheel(0.28, 0.14, 0.13);
    w.position.set(wx, wy, wz);
    group.add(w);
    return w;
  });

  return { group, wheels, type: 'motorcycle', baseColor: color };
}

/**
 * Dapatkan warna acak berdasarkan tipe.
 */
export function randomCarColor(rng) {
  return CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)];
}

export function randomMotorColor(rng) {
  return MOTOR_COLORS[Math.floor(rng() * MOTOR_COLORS.length)];
}

/**
 * Animasikan roda kendaraan proporsional kecepatan.
 * @param {object} vehicle - vehicle object dari simulation
 * @param {number} delta   - deltaTime
 */
export function animateWheels(vehicle, delta) {
  const speed = vehicle.currentSpeed;
  if (!vehicle.wheels || speed < 0.01) return;

  const omega = speed * delta * 4.5;
  vehicle.wheels.forEach(w => {
    w.rotation.z -= omega; // Putar roda di sumbu Z (axle)
  });
}

/**
 * Set warna emissive kendaraan (untuk indikator macet).
 */
export function setVehicleEmissive(vehicle, color, intensity = 0.5) {
  vehicle.group.traverse(child => {
    if (child.isMesh && child.material && child.material.emissive !== undefined) {
      child.material.emissive.setHex(color);
      child.material.emissiveIntensity = intensity;
    }
  });
}

// ── Utility ──────────────────────────────────────────────────

/**
 * Blend dua warna hex (simple lerp).
 */
function blendColor(hex1, hex2, t) {
  const r1 = (hex1 >> 16) & 0xff, g1 = (hex1 >> 8) & 0xff, b1 = hex1 & 0xff;
  const r2 = (hex2 >> 16) & 0xff, g2 = (hex2 >> 8) & 0xff, b2 = hex2 & 0xff;
  const r  = Math.round(r1 + (r2 - r1) * t);
  const g  = Math.round(g1 + (g2 - g1) * t);
  const b  = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}
