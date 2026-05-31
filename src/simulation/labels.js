// ═══════════════════════════════════════════════════════════════
// js/labels.js — TextSprite Billboard Labels (always face camera)
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';

/**
 * Membuat THREE.Sprite dengan teks yang selalu menghadap kamera.
 * @param {string} text - Teks label
 * @param {object} opts - Opsi styling
 */
export function createTextSprite(text, opts = {}) {
  const {
    fontSize     = 28,
    fontFace     = 'Inter, Arial, sans-serif',
    textColor    = 'rgba(255,255,255,0.95)',
    bgColor      = 'rgba(15,15,15,0.75)',
    borderColor  = 'rgba(79,140,255,0.6)',
    borderWidth  = 2,
    padding      = 12,
    scale        = 1.0,
  } = opts;

  // Buat canvas offscreen
  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d');

  ctx.font = `600 ${fontSize}px ${fontFace}`;
  const textW  = ctx.measureText(text).width;
  const canvasW = textW + padding * 2 + borderWidth * 2;
  const canvasH = fontSize + padding * 1.4 + borderWidth * 2;

  canvas.width  = canvasW;
  canvas.height = canvasH;

  // Set ulang setelah resize
  ctx.font = `600 ${fontSize}px ${fontFace}`;

  // Background rounded rect
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvasW - r, 0);
  ctx.quadraticCurveTo(canvasW, 0, canvasW, r);
  ctx.lineTo(canvasW, canvasH - r);
  ctx.quadraticCurveTo(canvasW, canvasH, canvasW - r, canvasH);
  ctx.lineTo(r, canvasH);
  ctx.quadraticCurveTo(0, canvasH, 0, canvasH - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.stroke();

  // Teks
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  // Buat texture & sprite
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,   // selalu di atas geometri
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  const aspect = canvasW / canvasH;
  sprite.scale.set(aspect * scale * 1.2, scale * 1.2, 1);

  return sprite;
}

/**
 * Tambahkan semua label billboard ke scene.
 * @param {THREE.Scene} scene
 */
export function addLabels(scene) {
  const labels = [
    {
      text: '← Jalan Utama',
      pos:  [0, 3.5, -5],
      opts: { fontSize: 16, scale: 0.5 }
    },
    {
      text: '↘ Masuk Mall',
      pos:  [11, 3.5, 6],
      opts: { fontSize: 16, scale: 0.5, borderColor: 'rgba(255,159,68,0.7)' }
    },
    {
      text: '↖ Keluar Mall',
      pos:  [6, 3.5, 10],
      opts: { fontSize: 16, scale: 0.5, borderColor: 'rgba(255,68,136,0.7)' }
    },
    {
      text: 'Jalan A  ↓',
      pos:  [-4, 3.5, 14],
      opts: { fontSize: 14, scale: 0.45, borderColor: 'rgba(68,255,136,0.6)' }
    },
    {
      text: 'Jalan B  ↑',
      pos:  [-10, 3.5, 14],
      opts: { fontSize: 14, scale: 0.45, borderColor: 'rgba(170,136,255,0.6)' }
    },
    {
      text: '🏬  MALL',
      pos:  [17, 6.5, 18],
      opts: { fontSize: 18, scale: 0.55, borderColor: 'rgba(79,140,255,0.5)' }
    },
    {
      text: '⬅ Akses Masuk (Sek.)',
      pos:  [-4, 2.5, 22],
      opts: { fontSize: 12, scale: 0.35, bgColor: 'rgba(15,15,15,0.55)', borderColor: 'rgba(68,255,136,0.4)' }
    },
    {
      text: '➡ Akses Keluar (Sek.)',
      pos:  [-10, 2.5, 22],
      opts: { fontSize: 12, scale: 0.35, bgColor: 'rgba(15,15,15,0.55)', borderColor: 'rgba(170,136,255,0.4)' }
    },
  ];

  labels.forEach(({ text, pos, opts }) => {
    const sprite = createTextSprite(text, opts);
    sprite.position.set(...pos);
    scene.add(sprite);
  });
}
