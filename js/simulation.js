// ═══════════════════════════════════════════════════════════════
// js/simulation.js — Core Simulation Engine
//
// Distribusi stokastik:
//   - Poisson process (arrival kendaraan per rute)
//   - Eksponensial (inter-arrival time via inverse transform)
//   - Normal / Box-Muller (kecepatan, kesabaran)
//   - Bernoulli (tipe kendaraan)
//   - Mulberry32 (seeded PRNG)
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { createCar, createMotorcycle, randomCarColor, randomMotorColor, animateWheels, setVehicleEmissive } from './vehicles.js';

// ── SEEDED PRNG: Mulberry32 ────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── DISTRIBUSI STOKASTIK ───────────────────────────────────────

/** Eksponensial(λ) — inter-arrival time (detik) dari Poisson process */
function exponentialRV(rng, lambdaPerSec) {
  if (lambdaPerSec <= 0) return Infinity;
  return -Math.log(1 - rng()) / lambdaPerSec;
}

/** Normal(μ, σ) — Box-Muller transform */
function normalRV(rng, mu, sigma) {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

/** Clamp helper */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── WAYPOINTS PER RUTE ─────────────────────────────────────────
// Format: { x, z } — Y dihitung dari tipe kendaraan
// Koordinat sesuai road.js

function getWaypoints(routeName, laneOffset = 0) {
  const lo = laneOffset;
  switch (routeName) {
    case 'mainToMain':
      return [
        { x:  32,  z: lo },
        { x:  -1,  z: lo },
        { x: -35,  z: lo },
      ];

    case 'mainToMall':
      return [
        { x:  32,   z: lo },
        { x:  8,    z: lo },
        { x:  5.5,  z: 1.5 },
        { x:  5.35, z: 2.35 },
        { x: 16.65, z: 13.65 }
      ];

    case 'mainToRoadA':
      return [
        { x:  32,  z: lo },
        { x:  -3,  z: lo },
        { x:  -4,  z: 2  },
        { x:  -5,  z: 5  },
        { x:  -5,  z: 33 },
      ];

    // ── LAJUR 0 (dalam/kiri diagonal) ─────────────────────────
    case 'mallToMain':          // lane 0 → Jalan Utama
      return [
        { x: 10.42, z: 17.88 },
        { x: -0.88, z:  6.58 },
        { x: -2.5,  z:  3    },
        { x: -5,    z:  lo   },
        { x: -35,   z:  lo   },
      ];

    case 'mallLane0ToRoadA':    // lane 0 → Jalan A (tetap di lajur 0 sampai ujung diagonal)
      return [
        { x: 10.42, z: 17.88 },
        { x: -0.88, z:  6.58 },
        { x: -2.5,  z:  3    },
        { x: -4,    z:  2    },
        { x: -5,    z:  5    },
        { x: -5,    z:  33   },
      ];

    // ── LAJUR 1 (luar/kanan diagonal) ─────────────────────────
    case 'mallToRoadA':         // lane 1 → Jalan A
      return [
        { x: 12.88, z: 15.42 },
        { x:  1.58, z:  4.12 },
        { x: -0.5,  z:  1.5  },
        { x: -3,    z:  lo   },
        { x: -4,    z:  2    },
        { x: -5,    z:  5    },
        { x: -5,    z:  33   },
      ];

    case 'mallLane1ToMain':     // lane 1 → Jalan Utama (tetap di lajur 1 sampai ujung diagonal)
      return [
        { x: 12.88, z: 15.42 },
        { x:  1.58, z:  4.12 },
        { x: -0.5,  z:  1.5  },
        { x: -3,    z:  lo   },
        { x: -35,   z:  lo   },
      ];

    case 'roadBToMain':
      return [
        { x:  -9,  z: 32  },
        { x:  -9,  z:  5  },
        { x:  -9,  z:  2  },
        { x: -11,  z:  0.5},
        { x: -14,  z:  lo },
        { x: -35,  z:  lo },
      ];

    default:
      return [{ x: 32, z: 0 }, { x: -35, z: 0 }];
  }
}

// ── ROUTE DEFINITIONS ──────────────────────────────────────────
const ROUTE_KEYS = ['mainToMain', 'mainToMall', 'mainToRoadA', 'roadBToMain'];

const ROUTE_COLORS = {
  mainToMain:       0x4f8cff,
  mainToMall:       0xff9f44,
  mainToRoadA:      0x44ff88,
  mallToMain:       0xff4488,
  mallLane0ToRoadA: 0xff4444,  // sama dengan mallToRoadA
  mallToRoadA:      0xff4444,
  mallLane1ToMain:  0xff4488,  // sama dengan mallToMain
  roadBToMain:      0xaa88ff,
};

// Peta route lajur mall ke nama base untuk statistik routeCounts
const MALL_LANE_TO_BASE = {
  mallToMain:       'mallToMain',
  mallLane0ToRoadA: 'mallToRoadA',
  mallToRoadA:      'mallToRoadA',
  mallLane1ToMain:  'mallToMain',
};

// ── SIMULATION STATE ───────────────────────────────────────────
let scene_ref    = null;
let rng          = mulberry32(42);

export const state = {
  running:      true,
  speedMult:    1.0,
  vehicles:     [],
  despawnCount: 0,
  uturnCount:   0,
  totalWaitTime:0,
  throughputBuffer: [],   // timestamp despawn untuk hitung /menit

  params: {
    mainToMain:  12,
    mainToMall:  6,
    mainToRoadA: 2,
    mallToMain:  10,
    mallToRoadA: 10,
    roadBToMain: 4,
    patience:    10,
    carRatio:    0.6,
    speedMean:   6,
  },

  // Accumulator per rute
  accumulators: {
    mainToMain:  0,
    mainToMall:  0,
    mainToRoadA: 0,
    mallExit0:   0,   // lajur fisik kiri keluar mall
    mallExit1:   0,   // lajur fisik kanan keluar mall
    roadBToMain: 0,
  },

  // Inter-arrival time berikutnya (dalam detik)
  nextArrival: {
    mainToMain:  0,
    mainToMall:  0,
    mainToRoadA: 0,
    mallExit0:   0,
    mallExit1:   0,
    roadBToMain: 0,
  },

  // Statistik
  routeCounts: {
    mainToMain:  0,
    mainToMall:  0,
    mainToRoadA: 0,
    mallToMain:  0,
    mallToRoadA: 0,
    roadBToMain: 0,
  },
};

/**
 * Inisialisasi simulasi dengan referensi scene dan seed.
 */
export function initSimulation(scene, seed = 42) {
  scene_ref = scene;
  resetSimulation(scene, seed);
}

/**
 * Reset semua kendaraan dan counter.
 */
export function resetSimulation(scene, seed) {
  // Hapus semua kendaraan lama
  state.vehicles.forEach(v => scene.remove(v.group));
  state.vehicles = [];
  state.despawnCount   = 0;
  state.uturnCount     = 0;
  state.totalWaitTime  = 0;
  state.throughputBuffer = [];
  Object.keys(state.routeCounts).forEach(k => state.routeCounts[k] = 0);

  // Reset PRNG
  const s = parseInt(seed) || 42;
  rng = mulberry32(s);
  mallExitLane = 0;

  // Reset accumulators & next arrival times
  ROUTE_KEYS.forEach(key => {
    state.accumulators[key] = 0;
    state.nextArrival[key]  = exponentialRV(rng, state.params[key] / 60) * rng();
  });
  // Dua spawner lajur mall exit — masing-masing rate = totalMallRate/2
  const laneRate = (state.params.mallToMain + state.params.mallToRoadA) / 2;
  const lrSec    = laneRate / 60;
  state.accumulators.mallExit0 = 0;
  state.accumulators.mallExit1 = 0;
  state.nextArrival.mallExit0  = lrSec > 0 ? exponentialRV(rng, lrSec) * rng() : Infinity;
  state.nextArrival.mallExit1  = lrSec > 0 ? exponentialRV(rng, lrSec) * rng() : Infinity;
}

// ── MAIN UPDATE LOOP ───────────────────────────────────────────

/**
 * Dipanggil setiap frame dari main.js
 * @param {number} delta - deltaTime (detik, sudah × speedMult)
 */
export function updateSimulation(delta) {
  if (!state.running || !scene_ref) return;

  // 1. Spawn kendaraan baru (Poisson process per rute)
  spawnVehicles(delta);

  // 2. Update posisi, rotasi, roda setiap kendaraan
  for (let i = state.vehicles.length - 1; i >= 0; i--) {
    const v = state.vehicles[i];
    const alive = updateVehicle(v, delta);
    if (!alive) {
      scene_ref.remove(v.group);
      state.vehicles.splice(i, 1);

      // Throughput tracking
      state.despawnCount++;
      state.throughputBuffer.push(performance.now());
    }
  }

  // 3. Collision detection & queuing
  applyCollisionAvoidance();

  // 4. Congestion emissive
  updateCongestionVisuals();

  // 5. Bersihkan throughput buffer > 60 detik lalu
  const now = performance.now();
  state.throughputBuffer = state.throughputBuffer.filter(t => now - t < 60000);
}

// ── SPAWN SYSTEM ───────────────────────────────────────────────

// Round-robin counter untuk lajur fisik keluar mall
let mallExitLane = 0;

function spawnVehicles(delta) {
  // Rute reguler (bukan mall exit)
  ROUTE_KEYS.forEach(route => {
    const rate = state.params[route];
    if (rate <= 0) return;
    state.accumulators[route] += delta;
    while (state.accumulators[route] >= state.nextArrival[route]) {
      state.accumulators[route] -= state.nextArrival[route];
      state.nextArrival[route] = exponentialRV(rng, rate / 60);
      if (state.vehicles.length < 200) spawnVehicle(route);
    }
  });

  // Dua spawner terpisah per lajur fisik keluar mall — rate masing-masing = totalRate/2
  const totalMallRate = state.params.mallToMain + state.params.mallToRoadA;
  if (totalMallRate > 0) {
    const laneRate = totalMallRate / 2;
    const lrSec    = laneRate / 60;

    [0, 1].forEach(laneIdx => {
      const key = `mallExit${laneIdx}`;
      state.accumulators[key] += delta;
      while (state.accumulators[key] >= state.nextArrival[key]) {
        state.accumulators[key] -= state.nextArrival[key];
        state.nextArrival[key] = exponentialRV(rng, lrSec);
        if (state.vehicles.length < 200) {
          // Setiap kendaraan dari KEDUA lajur memilih tujuan secara independen
          // berdasarkan rasio slider, sehingga kemacetan tersebar rata
          const goMain = rng() < state.params.mallToMain / totalMallRate;
          const dest   = goMain ? 'mallToMain' : 'mallToRoadA';
          spawnVehicle(dest, laneIdx);
        }
      }
    });
  }
}

function spawnVehicle(dest, forceLane = null) {
  const isCar      = rng() < state.params.carRatio;
  const isMallExit = dest === 'mallToMain' || dest === 'mallToRoadA';
  const laneOffset = isMallExit ? 0 : (rng() - 0.5) * 0.8;

  // Pilih varian waypoints yang sesuai lajur fisik + tujuan
  // Setiap lajur mengikuti jalurnya sendiri di diagonal, baru berpisah setelah ujung
  let waypointKey = dest;
  if (forceLane !== null && isMallExit) {
    if (forceLane === 0 && dest === 'mallToRoadA') waypointKey = 'mallLane0ToRoadA';
    if (forceLane === 1 && dest === 'mallToMain')  waypointKey = 'mallLane1ToMain';
  }

  const waypoints = getWaypoints(waypointKey, laneOffset);
  if (!waypoints || waypoints.length < 2) return;

  // Tujuan (dest) menentukan warna dan statistik
  const actualRoute = dest;
  // Buat model kendaraan
  const colorFn = isCar ? randomCarColor : randomMotorColor;
  const createFn = isCar ? createCar : createMotorcycle;
  const vehicle  = createFn(colorFn(rng));

  // Set posisi spawn (waypoint pertama)
  const spawnWP = waypoints[0];
  const yOff    = isCar ? 0 : 0;   // Y sudah di-handle dalam model (roda di bawah)
  vehicle.group.position.set(spawnWP.x, 0, spawnWP.z);

  // Arah awal: dari WP[0] ke WP[1]
  const dir = getDirection(waypoints[0], waypoints[1]);
  vehicle.group.rotation.y = Math.atan2(-dir.z, dir.x);

  scene_ref.add(vehicle.group);

  // Kecepatan: Normal(μ_slider, σ=1.5), clamp min 1
  const spd = clamp(normalRV(rng, state.params.speedMean, 1.5), 1, 18);

  // Kesabaran: Normal(μ_slider, σ=μ/4), clamp min 2
  const pat = clamp(normalRV(rng, state.params.patience, state.params.patience / 4), 2, 60);

  state.vehicles.push({
    group:        vehicle.group,
    wheels:       vehicle.wheels,
    type:         vehicle.type,
    routeName:    actualRoute,
    physicalLane: forceLane,   // null = bukan mall exit, 0/1 = lajur fisik
    waypoints,
    wpIndex:      1,
    maxSpeed:     spd,
    currentSpeed: spd,
    patience:     pat,
    waitTime:     0,
    isStopped:    false,
    isUturn:      false,
    uturnProgress:0,
    uturnDir:     1,
    congestionTimer: 0,
    baseColor:    vehicle.baseColor,
    color:        ROUTE_COLORS[actualRoute] ?? 0xffffff,
    routeColor:   ROUTE_COLORS[actualRoute] ?? 0xffffff,
    spawnTime:    performance.now(),
  });

  // Statistik: gabungkan varian lajur ke base route
  const countKey = MALL_LANE_TO_BASE[actualRoute] ?? actualRoute;
  if (state.routeCounts[countKey] !== undefined) state.routeCounts[countKey]++;
}

// ── VEHICLE UPDATE ─────────────────────────────────────────────

/**
 * Update satu kendaraan. Return false jika harus di-despawn.
 */
function updateVehicle(v, delta) {
  if (v.wpIndex >= v.waypoints.length) {
    // Sudah melewati semua waypoints → despawn
    state.totalWaitTime += v.waitTime;
    return false;
  }

  const target = v.waypoints[v.wpIndex];
  const pos    = v.group.position;
  const dx     = target.x - pos.x;
  const dz     = target.z - pos.z;
  const dist   = Math.sqrt(dx * dx + dz * dz);

  // Sampai di waypoint → lanjut ke berikutnya
  if (dist < 0.3) {
    v.wpIndex++;
    return true;
  }

  // Hadapkan ke waypoint
  const targetAngle = Math.atan2(-dz, dx);
  let   currAngle   = v.group.rotation.y;
  let   diff        = targetAngle - currAngle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  v.group.rotation.y += diff * Math.min(1, 8 * delta);

  // Gerak maju
  const speed  = v.currentSpeed;
  const moveX  = (dx / dist) * speed * delta;
  const moveZ  = (dz / dist) * speed * delta;
  pos.x       += moveX;
  pos.z       += moveZ;

  // Animasi roda
  animateWheels(v, delta);

  // Hitung waktu tunggu
  if (v.isStopped) {
    v.waitTime  += delta;
  }

  return true;
}



// ── COLLISION AVOIDANCE ────────────────────────────────────────

function applyCollisionAvoidance() {
  const vehicles = state.vehicles;
  const n        = vehicles.length;

  // Reset semua ke maxSpeed dulu
  vehicles.forEach(v => {
    v.isStopped = false;
    v.currentSpeed = v.maxSpeed;
  });

  // O(n²) proximity check
  for (let i = 0; i < n; i++) {
    const a = vehicles[i];

    const ax = a.group.position.x;
    const az = a.group.position.z;
    // Arah gerak kendaraan A
    const dirX = Math.cos(a.group.rotation.y);
    const dirZ = -Math.sin(a.group.rotation.y);

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = vehicles[j];

      const bx   = b.group.position.x;
      const bz   = b.group.position.z;
      const dx   = bx - ax;
      const dz   = bz - az;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 4.5) continue; // skip jauh

      // Kendaraan di LAJUR FISIK BERBEDA pada jalan diagonal mall tidak saling mempengaruhi
      if (a.physicalLane !== null && a.physicalLane !== undefined &&
          b.physicalLane !== null && b.physicalLane !== undefined &&
          a.physicalLane !== b.physicalLane) continue;

      // Cek apakah B ada di depan A
      const dot = dx * dirX + dz * dirZ;
      if (dot <= 0) continue;  // bukan di depan

      const lateral = Math.abs(dx * dirZ - dz * dirX);
      if (lateral > 1.2) continue; // beda lajur atau tidak searah


      // Cek deadlock (keduanya saling menganggap ada di depan)
      const bDirX = Math.cos(b.group.rotation.y);
      const bDirZ = -Math.sin(b.group.rotation.y);
      const dotB = (-dx) * bDirX + (-dz) * bDirZ;

      if (dotB > 0) {
        // Mutual conflict! Gunakan UUID sebagai tie-breaker agar tidak saling tunggu
        if (a.group.uuid < b.group.uuid) {
          continue; // A jalan terus, B yang akan mengerem
        }
      }

      // Deceleration berdasarkan jarak
      if (dist < 1.8) {
        // Berhenti total
        a.currentSpeed = 0;
        a.isStopped    = true;
      } else if (dist < 3.5) {
        // Decelerate proporsional
        const factor   = (dist - 1.8) / (3.5 - 1.8);
        const newSpeed = a.maxSpeed * factor;
        if (newSpeed < a.currentSpeed) {
          a.currentSpeed = newSpeed;
          a.isStopped    = (newSpeed < 0.2);
        }
      }
    }
  }
}

// ── CONGESTION VISUALS ─────────────────────────────────────────

function updateCongestionVisuals() {
  state.vehicles.forEach(v => {
    if (v.isStopped || v.currentSpeed < 0.5) {
      v.congestionTimer += 0.016;
    } else {
      v.congestionTimer = Math.max(0, v.congestionTimer - 0.03);
    }

    // Emissive merah jika macet cukup lama
    if (v.congestionTimer > 2.5) {
      const pulse = 0.3 + 0.3 * Math.sin(performance.now() * 0.003);
      setVehicleEmissive(v, 0xff2200, pulse);
    } else {
      setVehicleEmissive(v, 0x000000, 0);
    }
  });
}

// ── STATISTICS GETTERS ─────────────────────────────────────────

export function getStats() {
  const total    = state.vehicles.length;
  const waiting  = state.vehicles.filter(v => v.isStopped || v.currentSpeed < 0.2).length;
  const pct      = total > 0 ? Math.round((waiting / total) * 100) : 0;
  const throughput = state.throughputBuffer.length; // per menit (buffer = 60s)
  const avgWait  = state.despawnCount > 0
    ? (state.totalWaitTime / state.despawnCount).toFixed(1)
    : '0.0';

  return {
    total,
    waiting,
    congestionPct: pct,
    throughput,
    avgWait,
    despawnCount:  state.despawnCount,
    uturnCount:    state.uturnCount,
    routeCounts:   { ...state.routeCounts },
  };
}

// ── UTILITY ────────────────────────────────────────────────────

function getDirection(from, to) {
  const dx   = to.x - from.x;
  const dz   = to.z - from.z;
  const len  = Math.sqrt(dx * dx + dz * dz) || 1;
  return { x: dx / len, z: dz / len };
}
