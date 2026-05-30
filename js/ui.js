// ═══════════════════════════════════════════════════════════════
// js/ui.js — UI Bindings: Sliders, Stats, Seed, Controls
// ═══════════════════════════════════════════════════════════════
import { state, getStats, resetSimulation } from './simulation.js';

let statsInterval = null;

/**
 * Inisialisasi semua UI bindings.
 * @param {THREE.Scene} scene
 * @param {object}      cameraRig - { camera, controls, resetView }
 */
export function initUI(scene, cameraRig) {
  bindRouteSliders();
  bindStochasticSliders();
  bindSeed(scene);
  bindPlayPause();
  bindReset(scene);
  bindSpeedButtons();
  bindResetView(cameraRig);
  bindNavItems();

  // Update stats setiap 400ms
  statsInterval = setInterval(() => updateStats(), 400);
}

// ── SLIDER RUTE ────────────────────────────────────────────────

const ROUTE_SLIDERS = [
  { id: 'mainToMain',  valId: 'val-mainToMain',  key: 'mainToMain'  },
  { id: 'mainToMall',  valId: 'val-mainToMall',  key: 'mainToMall'  },
  { id: 'mainToRoadA', valId: 'val-mainToRoadA', key: 'mainToRoadA' },
  { id: 'roadBToMain', valId: 'val-roadBToMain', key: 'roadBToMain' },
];

function bindRouteSliders() {
  ROUTE_SLIDERS.forEach(({ id, valId, key }) => {
    const slider = document.getElementById(`sl-${id}`);
    const valEl  = document.getElementById(valId);
    if (!slider || !valEl) return;

    // Set initial
    valEl.textContent = slider.value;
    updateSliderFill(slider);

    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      valEl.textContent       = val;
      state.params[key]       = val;
      // Reset accumulator so new rate takes effect immediately
      state.accumulators[key] = 0;
      updateSliderFill(slider);
    });
  });

  // Binding untuk kedua slider keluar mall (independen, masing-masing slider
  // mengontrol volume tujuan; kepadatan lajur fisik diatur oleh spawner gabungan)
  [
    { id: 'sl-mallToMain',  valId: 'val-mallToMain',  key: 'mallToMain'  },
    { id: 'sl-mallToRoadA', valId: 'val-mallToRoadA', key: 'mallToRoadA' },
  ].forEach(({ id, valId, key }) => {
    const slider = document.getElementById(id);
    const valEl  = document.getElementById(valId);
    if (!slider || !valEl) return;

    valEl.textContent = slider.value;
    state.params[key] = parseInt(slider.value);
    updateSliderFill(slider);

    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      valEl.textContent = val;
      state.params[key] = val;
      // Reset mall exit accumulator agar rate baru langsung berlaku
      state.accumulators.mallExit0 = 0;
      state.accumulators.mallExit1 = 0;
      updateSliderFill(slider);
    });
  });
}

// ── SLIDER STOKASTIK ──────────────────────────────────────────

function bindStochasticSliders() {


  // Rasio mobil
  const slCar = document.getElementById('sl-car-ratio');
  const vCar  = document.getElementById('val-car-ratio');
  if (slCar && vCar) {
    updateSliderFill(slCar);
    slCar.addEventListener('input', () => {
      vCar.textContent       = `${slCar.value}%`;
      state.params.carRatio  = parseInt(slCar.value) / 100;
      updateSliderFill(slCar);
    });
  }

  // Kecepatan rata-rata
  const slSpd = document.getElementById('sl-speed-mean');
  const vSpd  = document.getElementById('val-speed-mean');
  if (slSpd && vSpd) {
    updateSliderFill(slSpd);
    slSpd.addEventListener('input', () => {
      vSpd.textContent         = slSpd.value;
      state.params.speedMean   = parseFloat(slSpd.value);
      updateSliderFill(slSpd);
    });
  }
}

/**
 * Update track fill visual pada slider.
 */
function updateSliderFill(slider) {
  const min  = parseFloat(slider.min)  || 0;
  const max  = parseFloat(slider.max)  || 60;
  const val  = parseFloat(slider.value);
  const pct  = ((val - min) / (max - min)) * 100;
  // Ambil warna dari CSS variable --route-color atau gunakan accent
  const color = getComputedStyle(slider.closest('.slider-group') || slider)
    .getPropertyValue('--route-color').trim() || '#4f8cff';
  slider.style.background = `linear-gradient(to right, ${color} ${pct}%, #333 ${pct}%)`;
}

// ── SEED ──────────────────────────────────────────────────────

function bindSeed(scene) {
  const input  = document.getElementById('seed-input');
  const btnRnd = document.getElementById('btn-random-seed');
  if (!input || !btnRnd) return;

  btnRnd.addEventListener('click', () => {
    const seed = Math.floor(Math.random() * 999999).toString();
    input.value = seed;
    resetSimulation(scene, seed);
    flashElement(input);
  });

  input.addEventListener('change', () => {
    resetSimulation(scene, input.value);
  });
}

// ── PLAY / PAUSE ──────────────────────────────────────────────

function bindPlayPause() {
  const btn       = document.getElementById('btn-play-pause');
  const iconPlay  = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const label     = document.getElementById('btn-play-label');
  const badge     = document.getElementById('sim-status-badge');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.running = !state.running;

    if (state.running) {
      iconPlay.style.display  = 'none';
      iconPause.style.display = 'block';
      label.textContent       = 'Pause';
      badge.textContent       = '▶ Berjalan';
      badge.style.color       = '';
      btn.classList.add('active');
    } else {
      iconPlay.style.display  = 'block';
      iconPause.style.display = 'none';
      label.textContent       = 'Play';
      badge.textContent       = '⏸ Dijeda';
      badge.style.color       = 'var(--warning)';
      btn.classList.remove('active');
    }
  });
}

// ── RESET SIMULASI ────────────────────────────────────────────

function bindReset(scene) {
  const btn = document.getElementById('btn-reset-sim');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const seed = document.getElementById('seed-input')?.value || '42';
    resetSimulation(scene, seed);
    // Reset stat display
    updateStats();
  });
}

// ── SPEED MULTIPLIER ──────────────────────────────────────────

function bindSpeedButtons() {
  document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.speedMult = parseFloat(btn.dataset.speed);
    });
  });
}

// ── RESET VIEW ────────────────────────────────────────────────

function bindResetView(cameraRig) {
  const btn = document.getElementById('btn-reset-view');
  if (!btn || !cameraRig) return;
  btn.addEventListener('click', () => {
    cameraRig.resetView();
  });
}

// ── NAV ITEMS ─────────────────────────────────────────────────

function bindNavItems() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

// ── STATS UPDATE ──────────────────────────────────────────────

let prevTotal = 0;

export function updateStats() {
  const s = getStats();

  // Total aktif
  setEl('stat-total', s.total);
  if (s.total !== prevTotal) flashElement(document.getElementById('stat-total'));
  prevTotal = s.total;

  // Menunggu
  setEl('stat-waiting', s.waiting);

  // Kemacetan
  const pct    = s.congestionPct;
  const pctEl  = document.getElementById('stat-congestion');
  const barEl  = document.getElementById('congestion-bar');
  const pctLbl = document.getElementById('congestion-pct');

  if (pctEl)  { pctEl.textContent = `${pct}%`; }
  if (barEl)  { barEl.style.width  = `${pct}%`; }
  if (pctLbl) { pctLbl.textContent = `${pct}%`; }

  if (pctEl) {
    pctEl.classList.toggle('pulsing', pct > 60);
  }

  // Throughput
  setEl('stat-throughput', s.throughput);

  // Detail
  setEl('stat-avg-wait',  `${s.avgWait}s`);
  setEl('stat-despawned', s.despawnCount);

  // Route breakdown
  Object.entries(s.routeCounts).forEach(([key, count]) => {
    const el = document.getElementById(`rc-${key}`);
    if (el) el.textContent = count;
  });
}

// ── FPS COUNTER ───────────────────────────────────────────────

let fpsFrames    = 0;
let fpsLastTime  = performance.now();

export function updateFPS() {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsLastTime >= 500) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    const el  = document.getElementById('fps-display');
    if (el) {
      el.textContent = `${fps} FPS`;
      el.style.color = fps >= 50 ? 'var(--success)' : fps >= 30 ? 'var(--warning)' : 'var(--danger)';
    }
    fpsFrames   = 0;
    fpsLastTime = now;
  }
}

// ── UTILITY ───────────────────────────────────────────────────

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function flashElement(el) {
  if (!el) return;
  el.style.transition = 'opacity 0.1s';
  el.style.opacity    = '0.4';
  setTimeout(() => { el.style.opacity = '1'; }, 150);
}
