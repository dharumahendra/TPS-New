# Simulasi Lalu Lintas 3D - Pakuwon Mall Jogja 🚗🚦

Proyek **Agent-Based Modeling (ABM)** interaktif yang memodelkan dinamika kemacetan lalu lintas di persimpangan jalan keluar pusat perbelanjaan (Pakuwon Mall Jogja) menggunakan pendekatan probabilitas dan sistem antrian stokastik. 

Dibangun dengan antarmuka **React (Vite)** dan rendering grafis 3D secara *real-time* menggunakan **Three.js**.

---

## 🎯 Tujuan Proyek
Mensimulasikan bagaimana ketidakpastian (stokastik) dari faktor-faktor mikroskopis memicu efek *bottleneck* dan kemacetan secara *emergent* tanpa perlu diprogram secara absolut. Simulasi ini digunakan sebagai eksperimen visual untuk mempelajari reaksi berantai pada ekosistem lalu lintas.

## 🛠️ Teknologi yang Digunakan
- **Vite + React.js** — Struktur *framework* UI dan manajemen state (panel kendali interaktif).
- **Three.js** — Mesin *rendering* lingkungan dan pergerakan model 3D kendaraan.
- **Vanilla CSS** — Pemodelan *styling* antarmuka (*dashboard* simulasi).

## 📊 Pemodelan Stokastik
Model ini menggunakan beberapa distribusi acak untuk meniru kondisi nyata di jalan:
1. **Distribusi Poisson & Eksponensial**: Menentukan *waktu kedatangan kendaraan (arrival rate)* antar agen di tiap-tiap rute independen, menciptakan pola kedatangan yang sporadis (kadang kosong, kadang bergerombol).
2. **Distribusi Normal (Box-Muller Transform)**: Menentukan *kecepatan rata-rata* dan *batas tingkat kesabaran* (detik) masing-masing pengemudi yang bervariasi.
3. **Distribusi Bernoulli**: Secara dinamis menentukan tipe agen (Mobil vs Motor) sesuai rasio probabilitas input.

## ✨ Fitur Unggulan
- **Interactive Control Panel**: Pengguna dapat mengubah volume *spawn*, rasio mobil, dan tingkat kecepatan/kesabaran secara *real-time* dan melihat efeknya langsung.
- **Twin-Linking Synchronization (Paired Spawn)**: Algoritma *queueing* khusus untuk akses jalan ganda yang memaksa kendaraan keluar mall untuk sinkron dengan kembarannya di lajur sebelah demi menghindari asimetri antrian akibat *dwell-time*.
- **Constraint Lalu Lintas**: Logika khusus yang mencegah kendaraan bervolume rendah (sepeda motor) masuk atau keluar melalui akses perbelanjaan.
- **Collision Avoidance**: Kalkulasi deteksi O(n²) untuk pengereman proporsional saat mendekati kendaraan di depan.
- **Garbage Collection**: Penghapusan paksa agen (*safety despawn*) untuk menjaga sistem berjalan optimal di bawah batas 120 agen aktif secara bersamaan.

---

## 🚀 Cara Menjalankan Secara Lokal

Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) di komputer Anda.

1. **Clone repositori ini** (atau *download* sebagai .zip)
   ```bash
   git clone https://github.com/username-anda/repo-simulasi-lalu-lintas.git
   cd repo-simulasi-lalu-lintas
   ```

2. **Instal seluruh *dependencies***
   ```bash
   npm install
   ```

3. **Jalankan *development server***
   ```bash
   npm run dev
   ```

4. **Buka di Browser**
   Buka URL lokal yang diberikan pada terminal (umumnya `http://localhost:5173/`).

---

## 🔗 Deploy Publik (Vercel)
Proyek ini sepenuhnya kompatibel dan direkomendasikan untuk di-deploy secara statis di Vercel. 
Karena menggunakan Vite, konfigurasi _build_ default dari Vercel (`npm run build`, output ke `dist`) akan otomatis mengenali dan meluncurkan proyek Anda ke URL publik.
