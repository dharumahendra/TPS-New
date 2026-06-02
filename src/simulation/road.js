// ═══════════════════════════════════════════════════════════════
// js/road.js — Road, Sidewalks, Mall Accesses, Mall Building
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

// Material pool (reusable)
const MAT = {
  asphalt:   new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95, metalness: 0 }),
  asphaltAlt:new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.9,  metalness: 0 }),
  sidewalk:  new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 1,    metalness: 0 }),
  lineWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6,  metalness: 0 }),
  lineYellow:new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6,  metalness: 0 }),
  mall:      new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.7,  metalness: 0.1, transparent: true, opacity: 0.85 }),
  mallRoof:  new THREE.MeshStandardMaterial({ color: 0x0f2a44, roughness: 0.6,  metalness: 0.2 }),
  ground:    new THREE.MeshStandardMaterial({ color: 0x141a14, roughness: 1,    metalness: 0 }),
  grass:     new THREE.MeshStandardMaterial({ color: 0x1a2818, roughness: 1,    metalness: 0 }),
  median:    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1,    metalness: 0 }),
};

/**
 * Helper: buat PlaneGeometry horizontal
 */
function makePlane(w, h, mat, x, y, z, rotY = 0) {
  const geo  = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotY;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Helper: buat garis marka putus-putus di sepanjang sumbu X
 */
function makeDashedLine(scene, z, xStart, xEnd, y = 0.015, dashLen = 1.5, gapLen = 1.5, mat = MAT.lineWhite) {
  for (let x = xStart; x < xEnd; x += dashLen + gapLen) {
    const geo  = new THREE.PlaneGeometry(dashLen, 0.12);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x + dashLen / 2, y, z);
    scene.add(mesh);
  }
}

/**
 * Helper: garis solid memanjang (X-axis)
 */
function makeSolidLine(scene, z, xStart, xEnd, y = 0.015, width = 0.1, mat = MAT.lineWhite) {
  const len  = xEnd - xStart;
  const geo  = new THREE.PlaneGeometry(len, width);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(xStart + len / 2, y, z);
  scene.add(mesh);
}

/**
 * Helper: garis solid memanjang (Z-axis)
 */
function makeSolidLineZ(scene, x, zStart, zEnd, y = 0.015, width = 0.1, mat = MAT.lineWhite) {
  const len  = zEnd - zStart;
  const geo  = new THREE.PlaneGeometry(width, len);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, zStart + len / 2);
  scene.add(mesh);
}

/**
 * Bangun seluruh road environment dan tambahkan ke scene.
 * @returns {object} data titik-titik penting untuk simulation.js
 */
export function buildRoad(scene) {

  // ── GROUND BASE ──────────────────────────────────────────────
  const ground = makePlane(120, 90, MAT.ground, 0, -0.02, 15);
  scene.add(ground);

  // Rumput/tanah di sekitar
  const grass1 = makePlane(120, 10, MAT.grass, 0, -0.015, -9);
  const grass2 = makePlane(60,  30, MAT.grass, -35, -0.015, 20);
  const grass3 = makePlane(40,  30, MAT.grass, 25, -0.015, 25);
  scene.add(grass1, grass2, grass3);

  // ── JALAN UTAMA (horizontal, traffic ke kiri = -X) ──────────
  // Lebar 6 unit (Z: -3 ke +3), panjang X: -34 ke +32
  const mainRoad = makePlane(66, 6, MAT.asphalt, -1, 0, 0);
  scene.add(mainRoad);

  // Trotoar atas (Z = -4 ke -5)
  const trotoarTop = makePlane(66, 2, MAT.sidewalk, -1, 0.02, -4);
  scene.add(trotoarTop);

  // Trotoar bawah — hanya dari X=-14 ke kiri, karena kanan ada akses mall
  const trotoarBotLeft = makePlane(20, 2, MAT.sidewalk, -24, 0.02, 4);
  scene.add(trotoarBotLeft);

  // Garis tepi jalan utama (atas dan bawah)
  makeSolidLine(scene, -3,  -34, 32, 0.016, 0.15);  // tepi atas
  makeSolidLine(scene, +3,  -34, -11, 0.016, 0.15); // tepi bawah kiri (sebelum Jalan B)
  makeSolidLine(scene, +3,  2.95, 3.172, 0.016, 0.15); // tepi bawah pemisah jalur Mall Keluar dan Masuk
  makeSolidLine(scene, +3,  8.828, 32, 0.016, 0.15); // tepi bawah kanan (setelah Mall Masuk)
  makeSolidLine(scene, +1.5, 8.828, 32, 0.016, 0.1, MAT.lineYellow); // batas lajur khusus masuk mall
  makeSolidLineZ(scene, 8.828, 1.5, 3, 0.016, 0.1, MAT.lineYellow); // akhir lajur khusus di persimpangan akses mall

  // ── PERSIMPANGAN JALAN A & B ─────────────────────────────────
  // Area pertemuan Jalan A (X=-5) dan Jalan B (X=-9) dengan main road
  // Buat area persimpangan lebih lebar di Z: 0–6, X: -13 ke -1
  const junctionAB = makePlane(12, 6, MAT.asphalt, -7, 0.005, 3);
  scene.add(junctionAB);

  // ── JALAN A (vertikal, satu arah ↓ menjauhi main road) ──────
  // X: -3 ke -7 (lebar 4), Z: 4 ke 32
  const roadA = makePlane(4, 28, MAT.asphalt, -5, 0, 18);
  scene.add(roadA);

  // Tepi Jalan A
  makeSolidLineZ(scene, -3,  6.95, 32, 0.016, 0.12); // tepi kanan (bertemu ujung marka Mall Keluar)
  makeSolidLineZ(scene, -7,  3, 32, 0.016, 0.12); // tepi kiri

  // Marka tengah Jalan A (putus-putus Z-axis)
  for (let z = 4.95; z < 32; z += 2.5) {
    const geo  = new THREE.PlaneGeometry(0.1, 1.4);
    const mesh = new THREE.Mesh(geo, MAT.lineWhite);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(-5, 0.016, z + 0.7);
    scene.add(mesh);
  }

  // ── JALAN B (vertikal, satu arah ↑ menuju main road) ────────
  // X: -7 ke -11 (lebar 4), Z: 4 ke 32
  const roadB = makePlane(4, 28, MAT.asphalt, -9, 0, 18);
  scene.add(roadB);

  // Tepi Jalan B
  makeSolidLineZ(scene, -7,  3, 32, 0.016, 0.12); // tepi kanan (shared dg A, maju hingga jalan utama)
  makeSolidLineZ(scene, -11, 3, 32, 0.016, 0.12); // tepi kiri

  // Marka Jalan B
  for (let z = 4; z < 32; z += 2.5) {
    const geo  = new THREE.PlaneGeometry(0.1, 1.4);
    const mesh = new THREE.Mesh(geo, MAT.lineWhite);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(-9, 0.016, z + 0.7);
    scene.add(mesh);
  }

  // Median antara A dan B (garis solid di X=-7)
  // sudah covered oleh tepi kanan A = tepi kiri B

  // ── AKSES MALL UTAMA MASUK (diagonal, 1 lajur) ────────────────
  // Dari main road ~(X=8, Z=3) diagonal ke area mall ~(X=18, Z=14)
  // Sudut ~45°, panjang ≈ 15 unit, lebar 4 unit
  const mallInLength = 16;
  const mallInWidth  = 4;
  const mallIn = new THREE.Mesh(
    new THREE.PlaneGeometry(mallInLength, mallInWidth),
    MAT.asphaltAlt
  );
  mallIn.rotation.x = -Math.PI / 2;
  mallIn.rotation.z = -Math.PI / 4;   // 45° diagonal
  mallIn.position.set(11, 0.005, 8);
  mallIn.receiveShadow = true;
  scene.add(mallIn);

  // Marka tepi akses masuk (garis putih sepanjang diagonal)
  drawLineFromTo(scene, 8.828, 3, 21.828, 16, 0.12, MAT.lineWhite); // Kiri
  drawLineFromTo(scene, 3.172, 3, 16.172, 16, 0.12, MAT.lineWhite); // Kanan

  // ── AKSES MALL UTAMA KELUAR (diagonal, 2 lajur) ───────────────
  // Dari area mall ~(X=14, Z=18) diagonal ke main road ~(X=4, Z=3)
  // Sudut ~45°, panjang ≈ 16 unit, lebar 7 unit (2 lajur)
  const mallOutLength = 16;
  const mallOutWidth  = 7;
  const mallOut = new THREE.Mesh(
    new THREE.PlaneGeometry(mallOutLength, mallOutWidth),
    MAT.asphaltAlt
  );
  mallOut.rotation.x = -Math.PI / 2;
  mallOut.rotation.z = -Math.PI / 4;  // -45° diagonal
  mallOut.position.set(6, 0.003, 11);
  mallOut.receiveShadow = true;
  scene.add(mallOut);

  // Marka akses keluar: tepi + garis tengah pemisah 2 lajur
  drawLineFromTo(scene, 2.95, 3, 15.95, 16, 0.12, MAT.lineWhite); // Kiri (bertemu main road)
  drawLineFromTo(scene, -3, 6.95, 6.05, 16, 0.12, MAT.lineWhite); // Kanan (bertemu Road A)
  drawDashedLineFromTo(scene, -2, 3, 11, 16, 0.12, MAT.lineYellow); // Tengah putus-putus

  // Persimpangan akses mall dengan jalan utama
  const juncMall = makePlane(10, 6, MAT.asphalt, 6, 0.004, 3);
  scene.add(juncMall);

  // ── AREA MALL (bangunan) ───────────────────────────────────────
  // Bodi utama mall
  const mallBody = new THREE.Mesh(
    new THREE.BoxGeometry(16, 4, 12),
    MAT.mall
  );
  mallBody.position.set(17, 2, 19);
  mallBody.castShadow = true;
  mallBody.receiveShadow = true;
  scene.add(mallBody);

  // Atap mall
  const mallRoof = new THREE.Mesh(
    new THREE.BoxGeometry(17, 0.4, 13),
    MAT.mallRoof
  );
  mallRoof.position.set(17, 4.2, 19);
  scene.add(mallRoof);

  // Garis dekorasi di dinding mall
  for (let i = 0; i < 4; i++) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2a5a8a, metalness: 0.3 })
    );
    pillar.position.set(9.5 + i * 4.5, 2, 12.8);
    scene.add(pillar);
  }

  // Papan nama mall
  const signGeo = new THREE.BoxGeometry(6, 1.2, 0.2);
  const signMat = new THREE.MeshStandardMaterial({ color: 0x4f8cff, emissive: 0x1a4aaa, emissiveIntensity: 0.4 });
  const sign    = new THREE.Mesh(signGeo, signMat);
  sign.position.set(17, 5, 13.1);
  scene.add(sign);

  // ── AREA PARKIR (visual) ──────────────────────────────────────
  const parking = makePlane(14, 8, MAT.asphalt, 17, 0.001, 12.5);
  scene.add(parking);

  // Garis parkir
  for (let i = -3; i <= 3; i++) {
    const geo  = new THREE.PlaneGeometry(0.08, 4);
    const mesh = new THREE.Mesh(geo, MAT.lineWhite);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(14 + (i + 3.5) * 2, 0.02, 12.5);
    scene.add(mesh);
  }

  // ── LAMPU JALAN (visual dekorasi) ────────────────────────────
  addStreetLights(scene);

  return {
    // Koordinat referensi penting untuk simulation.js
    mainRoadZ:    0,      // Z tengah jalan utama
    mainRoadXEnd: 32,     // X spawn kendaraan dari kanan
    mainRoadXDespawn: -34,// X despawn ke kiri
    roadAX: -5,           // X tengah Jalan A
    roadAZStart: 4,
    roadAZEnd: 32,
    roadBX: -9,           // X tengah Jalan B
    roadBZStart: 4,
    roadBZEnd: 32,
    mallInEntry:  { x: 8,  z: 3  },  // titik belok masuk mall di main road
    mallOutEntry: { x: 4,  z: 3  },  // titik keluar mall bergabung main road
    mallCenter:   { x: 17, z: 19 },
    mallInAccess: { x: 16, z: 14 },  // ujung dalam akses masuk mall
    mallOutStart: { x: 13, z: 17 },  // titik kendaraan keluar dari mall
    roadAJunction:{ x: -5, z: 3  },  // titik belok ke Jalan A dari main road
    roadBJunction:{ x: -9, z: 4  },  // titik merge dari Jalan B ke main road
    // Lane offsets untuk multi-kendaraan
    mainLaneOffsets: [-1, 0, 1],
    roadALaneOffset: 0,
    roadBLaneOffset: 0,
  };
}

// ── HELPERS MARKA DIAGONAL & EXACT LINES ────────────────────────

function drawLineFromTo(scene, x1, z1, x2, z2, width, mat) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(-dz, dx);
  const geo = new THREE.PlaneGeometry(length, width);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = angle;
  mesh.position.set((x1 + x2) / 2, 0.016, (z1 + z2) / 2);
  scene.add(mesh);
}

function drawDashedLineFromTo(scene, x1, z1, x2, z2, width, mat) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(-dz, dx);
  const dashLen = 1.2;
  const gapLen = 1.0;
  for (let d = 0; d < length; d += dashLen + gapLen) {
    if (d + dashLen > length) break;
    const cx = x1 + (dx / length) * (d + dashLen / 2);
    const cz = z1 + (dz / length) * (d + dashLen / 2);
    const geo = new THREE.PlaneGeometry(dashLen, width);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle;
    mesh.position.set(cx, 0.016, cz);
    scene.add(mesh);
  }
}

/**
 * Tambahkan tiang lampu jalan dekoratif.
 */
function addStreetLights(scene) {
  const positions = [
    [-20, 0, -4.5],
    [0,   0, -4.5],
    [15,  0, -4.5],
    [-20, 0, +4.5],
    [5,   0, +4.5],
  ];

  positions.forEach(([x, y, z]) => {
    // Tiang
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 })
    );
    pole.position.set(x, 2, z);
    scene.add(pole);

    // Kepala lampu
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.5 })
    );
    lamp.position.set(x, 4.2, z);
    scene.add(lamp);

    // Point light kecil
    const light = new THREE.PointLight(0xffffee, 0.5, 12);
    light.position.set(x, 4, z);
    scene.add(light);
  });
}
