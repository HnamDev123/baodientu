(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- hiệu ứng gợn sóng khi chạm nút ---------- */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn-start,.btn-read,.presets button,.play,.fin-actions button');
  if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
  const sp = document.createElement('span'); sp.className = 'rp';
  sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 700);
});


/* =====================================================
   Cánh hoa rơi nhẹ nhàng (canvas)
   ===================================================== */
const cv = $('#petals'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, petals = [], running = false, target = 0;
const cols = ['#ff8fb3', '#ffb066', '#ffffff', '#ffd1e0', '#ffe27a'];
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener('resize', resize); resize();
function mk(anywhere) {
  return { x: Math.random() * W, y: anywhere ? Math.random() * H : -20, s: 6 + Math.random() * 9,
    vy: .35 + Math.random() * .7, ph: Math.random() * 6.28, sw: .4 + Math.random() * .9,
    rot: Math.random() * 6.28, vr: (Math.random() - .5) * .03, c: cols[(Math.random() * cols.length) | 0], a: .55 + Math.random() * .4 };
}
function petalBurst(n) {
  if (reduce) n = Math.min(n, 10);
  target = innerWidth < 700 ? Math.min(n, 22) : n;
  while (petals.length < target) petals.push(mk(true));
  if (!running) { running = true; requestAnimationFrame(loop); }
}
let lastT = 0;
function loop(t) {
  if (document.hidden) { requestAnimationFrame(loop); return; }
  const dt = Math.min(2, (t - lastT) / 16.7 || 1); lastT = t;
  cx.clearRect(0, 0, W, H);
  for (const p of petals) {
    p.ph += .012 * p.sw * dt; p.y += p.vy * dt; p.x += Math.sin(p.ph) * .6 * dt; p.rot += p.vr * dt;
    if (p.y > H + 20) Object.assign(p, mk(false));
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(1, .65 + .35 * Math.cos(p.ph * 2));
    cx.globalAlpha = p.a; cx.fillStyle = p.c;
    cx.beginPath(); cx.ellipse(0, 0, p.s * .5, p.s, 0, 0, 6.2832); cx.fill();
    cx.restore();
  }
  requestAnimationFrame(loop);
}


window.BM = { $, reduce, wait, rnd, petalBurst, petalCanvas: cv };
})();
