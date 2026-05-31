import React, { useEffect, useRef } from 'react';
import { startScene } from './simulation/sceneInit.js';

export default function App() {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Pastikan hanya diinisialisasi sekali (React StrictMode memanggil dua kali di dev)
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Mulai Three.js scene setelah DOM siap
    const cleanup = startScene(containerRef.current);
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="app-layout">

      {/* ═══════════════════════════════════════════════════════
           PANEL TENGAH — THREE.JS CANVAS
      ═══════════════════════════════════════════════════════ */}
      <main className="canvas-wrapper">
        <div id="canvas-container" ref={containerRef}>
          {/* Three.js renderer akan di-inject di sini */}
        </div>

        {/* Overlay: FPS + status */}
        <div className="canvas-overlay top-left">
          <div className="fps-badge" id="fps-display">60 FPS</div>
          <div className="sim-status" id="sim-status-badge">▶ Berjalan</div>
        </div>

        {/* Overlay: Reset view button */}
        <div className="canvas-overlay top-right">
          <button className="btn-overlay" id="btn-reset-view" title="Reset kamera ke posisi awal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.09"/>
            </svg>
            Reset View
          </button>
        </div>

        {/* Overlay: Legend */}
        <div className="canvas-overlay bottom-left">
          <div className="legend">
            <div className="legend-title">Legenda Rute</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#4f8cff'}}></span>Jalan Utama → Utama</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#ff9f44'}}></span>Jalan Utama → Mall</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#44ff88'}}></span>Jalan Utama → Jalan A</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#ff4488'}}></span>Keluar Mall → Utama</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#ff4444'}}></span>Keluar Mall → Jalan A</div>
            <div className="legend-item"><span className="leg-color" style={{background:'#aa88ff'}}></span>Jalan B → Utama</div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
           PANEL KANAN — KONTROL & STATISTIK
      ═══════════════════════════════════════════════════════ */}
      <aside className="control-panel" id="control-panel">

        {/* KONTROL SIMULASI */}
        <section className="cp-section">
          <div className="cp-section-title">Kontrol Simulasi</div>
          <div className="playback-controls">
            <button className="btn-control active" id="btn-play-pause">
              <svg id="icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{display:'none'}}>
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              <svg id="icon-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              <span id="btn-play-label">Pause</span>
            </button>
            <button className="btn-control" id="btn-reset-sim">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.09"/>
              </svg>
              Reset
            </button>
          </div>
          <div className="speed-controls">
            <span className="cp-label">Kecepatan</span>
            <div className="speed-btns">
              <button className="btn-speed" data-speed="0.5">0.5×</button>
              <button className="btn-speed active" data-speed="1">1×</button>
              <button className="btn-speed" data-speed="2">2×</button>
              <button className="btn-speed" data-speed="4">4×</button>
            </div>
          </div>
        </section>

        {/* VOLUME PER RUTE */}
        <section className="cp-section">
          <div className="cp-section-title">
            Volume Kendaraan / Menit
            <span className="section-badge">Poisson λ</span>
          </div>

          <div className="slider-group" data-route="mainToMain" style={{'--route-color':'#4f8cff'}}>
            <div className="slider-header">
              <label className="slider-label">Jalan Utama → Jalan Utama</label>
              <span className="slider-value" id="val-mainToMain">12</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-mainToMain"
                   min="0" max="60" defaultValue="12" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>

          <div className="slider-group" data-route="mainToMall" style={{'--route-color':'#ff9f44'}}>
            <div className="slider-header">
              <label className="slider-label">Jalan Utama → Masuk Mall</label>
              <span className="slider-value" id="val-mainToMall">6</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-mainToMall"
                   min="0" max="60" defaultValue="6" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>

          <div className="slider-group" data-route="mainToRoadA" style={{'--route-color':'#44ff88'}}>
            <div className="slider-header">
              <label className="slider-label">Jalan Utama → Jalan A</label>
              <span className="slider-value" id="val-mainToRoadA">2</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-mainToRoadA"
                   min="0" max="60" defaultValue="2" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>

          <div className="slider-group" data-route="mallToMain" style={{'--route-color':'#ff4488'}}>
            <div className="slider-header">
              <label className="slider-label">Keluar Mall → Jalan Utama</label>
              <span className="slider-value" id="val-mallToMain">10</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-mallToMain"
                   min="0" max="60" defaultValue="10" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>

          <div className="slider-group" data-route="mallToRoadA" style={{'--route-color':'#ff4444'}}>
            <div className="slider-header">
              <label className="slider-label">Keluar Mall → Jalan A</label>
              <span className="slider-value" id="val-mallToRoadA">10</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-mallToRoadA"
                   min="0" max="60" defaultValue="10" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>

          <div className="slider-group" data-route="roadBToMain" style={{'--route-color':'#aa88ff'}}>
            <div className="slider-header">
              <label className="slider-label">Jalan B → Jalan Utama</label>
              <span className="slider-value" id="val-roadBToMain">4</span>
            </div>
            <input type="range" className="slider route-slider" id="sl-roadBToMain"
                   min="0" max="60" defaultValue="4" step="1" />
            <div className="slider-minmax"><span>0</span><span>60</span></div>
          </div>
        </section>

        {/* PARAMETER STOKASTIK */}
        <section className="cp-section">
          <div className="cp-section-title">
            Parameter Stokastik
            <span className="section-badge">Normal μ,σ</span>
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label className="slider-label">Rasio Mobil (% dari total)</label>
              <span className="slider-value" id="val-car-ratio">60%</span>
            </div>
            <input type="range" className="slider" id="sl-car-ratio"
                   min="0" max="100" defaultValue="60" step="5" />
            <div className="slider-hint">Bernoulli p(mobil)</div>
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label className="slider-label">Kecepatan rata-rata μ</label>
              <span className="slider-value" id="val-speed-mean">6</span>
            </div>
            <input type="range" className="slider" id="sl-speed-mean"
                   min="1" max="15" defaultValue="6" step="0.5" />
            <div className="slider-hint">unit/detik, σ = 1.5</div>
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label className="slider-label">Tingkat Kesabaran Pengendara μ</label>
              <span className="slider-value" id="val-patience">10</span>
            </div>
            <input type="range" className="slider" id="sl-patience"
                   min="2" max="60" defaultValue="10" step="1" />
            <div className="slider-hint">detik menunggu sebelum frustrasi, σ = μ/4</div>
          </div>
        </section>

        {/* SEED */}
        <section className="cp-section">
          <div className="cp-section-title">Seed Simulasi</div>
          <div className="seed-row">
            <input type="text" className="seed-input" id="seed-input"
                   placeholder="Masukkan seed..." defaultValue="42" maxLength="10" />
            <button className="btn-seed" id="btn-random-seed" title="Generate seed acak">🎲</button>
          </div>
          <div className="slider-hint">Seed sama → simulasi identik (reproducibility)</div>
        </section>

        {/* STATISTIK REAL-TIME */}
        <section className="cp-section">
          <div className="cp-section-title">Statistik Real-Time</div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" id="stat-total">0</div>
              <div className="stat-label">Total Aktif</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" id="stat-waiting">0</div>
              <div className="stat-label">Menunggu</div>
            </div>
            <div className="stat-card">
              <div className="stat-value danger" id="stat-congestion">0%</div>
              <div className="stat-label">Kemacetan</div>
            </div>
            <div className="stat-card">
              <div className="stat-value success" id="stat-throughput">0</div>
              <div className="stat-label">Throughput/min</div>
            </div>
          </div>

          <div className="congestion-bar-wrapper">
            <div className="congestion-bar-label">
              <span>Tingkat Kemacetan</span>
              <span id="congestion-pct">0%</span>
            </div>
            <div className="congestion-bar-track">
              <div className="congestion-bar-fill" id="congestion-bar"></div>
            </div>
          </div>

          <div className="stat-detail">
            <div className="stat-row">
              <span className="stat-row-label">Rata-rata waktu tunggu</span>
              <span className="stat-row-value" id="stat-avg-wait">0.0s</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">Kendaraan despawned</span>
              <span className="stat-row-value" id="stat-despawned">0</span>
            </div>
          </div>

          <div className="route-breakdown">
            <div className="cp-label" style={{marginBottom:'8px'}}>Breakdown per Rute</div>
            <div className="route-stat" id="rs-mainToMain">
              <span className="rs-dot" style={{background:'#4f8cff'}}></span>
              <span className="rs-name">Utama→Utama</span>
              <span className="rs-count" id="rc-mainToMain">0</span>
            </div>
            <div className="route-stat" id="rs-mainToMall">
              <span className="rs-dot" style={{background:'#ff9f44'}}></span>
              <span className="rs-name">Utama→Mall</span>
              <span className="rs-count" id="rc-mainToMall">0</span>
            </div>
            <div className="route-stat" id="rs-mainToRoadA">
              <span className="rs-dot" style={{background:'#44ff88'}}></span>
              <span className="rs-name">Utama→Jln A</span>
              <span className="rs-count" id="rc-mainToRoadA">0</span>
            </div>
            <div className="route-stat" id="rs-mallToMain">
              <span className="rs-dot" style={{background:'#ff4488'}}></span>
              <span className="rs-name">Mall→Utama</span>
              <span className="rs-count" id="rc-mallToMain">0</span>
            </div>
            <div className="route-stat" id="rs-mallToRoadA">
              <span className="rs-dot" style={{background:'#ff4444'}}></span>
              <span className="rs-name">Mall→Jln A</span>
              <span className="rs-count" id="rc-mallToRoadA">0</span>
            </div>
            <div className="route-stat" id="rs-roadBToMain">
              <span className="rs-dot" style={{background:'#aa88ff'}}></span>
              <span className="rs-name">Jln B→Utama</span>
              <span className="rs-count" id="rc-roadBToMain">0</span>
            </div>
          </div>
        </section>

      </aside>
    </div>
  );
}
