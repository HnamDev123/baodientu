(() => {
'use strict';
const { $, reduce, wait, rnd } = window.BM;
const lamp = $('#lamp'), night = $('#night');
if (!lamp || !night) return;

const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

/* =====================================================
   ÂM THANH — tiếng "tách" của công tắc + nhạc nền (chỉ phát sau khi người xem chạm vào dây)
   ===================================================== */
const AC = window.AudioContext || window.webkitAudioContext;
let actx = null, gain = null;
const bgm = new Audio('nhac.m4a');
bgm.preload = 'none'; bgm.loop = false;

function unlockAudio() {
  try {
    if (!actx && AC) actx = new AC();
    if (actx && actx.state === 'suspended') actx.resume();
  } catch (e) { /* bỏ qua */ }
}
function clickSound() {
  if (!actx) return;
  try {
    const t = actx.currentTime, len = Math.floor(actx.sampleRate * .05);
    const buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .8; g.gain.value = .5;
    src.connect(bp); bp.connect(g); g.connect(actx.destination); src.start(t);
    const o = actx.createOscillator(), og = actx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + .08);
    og.gain.setValueAtTime(.35, t); og.gain.exponentialRampToValueAtTime(.001, t + .12);
    o.connect(og); og.connect(actx.destination); o.start(t); o.stop(t + .15);
  } catch (e) { /* bỏ qua */ }
}
const Music = {
  fadeTimer: 0,
  start() {                                              // gọi ngay trong cú chạm của người xem để trình duyệt cho phát
    try {
      if (actx && !gain) { const mes = actx.createMediaElementSource(bgm); gain = actx.createGain(); gain.gain.value = 0; mes.connect(gain); gain.connect(actx.destination); }
    } catch (e) { gain = null; }
    bgm.currentTime = 0;
    if (gain && actx) { gain.gain.cancelScheduledValues(actx.currentTime); gain.gain.value = 0; } else bgm.volume = 0;
    const p = bgm.play(); if (p && p.catch) p.catch(() => {});
  },
  fade(to, sec) {
    clearInterval(this.fadeTimer);
    if (gain && actx) {
      const t = actx.currentTime; gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(to, t + sec);
    } else {
      const from = bgm.volume, t0 = performance.now();
      this.fadeTimer = setInterval(() => {
        const k = clamp01((performance.now() - t0) / (sec * 1000));
        try { bgm.volume = from + (to - from) * k; } catch (e) { /* iOS: bỏ qua */ }
        if (k >= 1) clearInterval(this.fadeTimer);
      }, 60);
    }
  },
  stop(sec) { this.fade(0, sec); setTimeout(() => bgm.pause(), sec * 1000 + 80); }
};
const nMute = $('#nMute');
if (nMute) nMute.addEventListener('click', () => {
  bgm.muted = !bgm.muted;
  nMute.setAttribute('aria-pressed', bgm.muted ? 'true' : 'false');
  nMute.setAttribute('aria-label', bgm.muted ? 'Bật nhạc' : 'Tắt nhạc');
});

/* =====================================================
   DÂY ĐÈN — rơi xuống, đung đưa, kéo dây để tắt đèn
   ===================================================== */
const rig = $('#lampRig'), pullBtn = $('#pull'), cord = $('#cordLine'), hint = $('#lampHint');
let pull = 0, vel = 0, dragging = false, startY = 0, startPull = 0, moved = 0, triggered = false, scale = 1, rafS = 0, tugT = 0;
const MAXP = 130, TRIG = 78;

function setPull(p) {
  pull = p;
  cord.setAttribute('y2', (360 + p).toFixed(1));
  pullBtn.style.transform = 'translate(-50%,-50%) translateY(' + (p * scale).toFixed(1) + 'px)';
}
function springBack() {
  cancelAnimationFrame(rafS);
  const step = () => {
    vel += -pull * .16; vel *= .82; setPull(pull + vel);
    if (Math.abs(pull) < .2 && Math.abs(vel) < .2) { setPull(0); vel = 0; return; }
    rafS = requestAnimationFrame(step);
  };
  rafS = requestAnimationFrame(step);
}
function autoPull() {                                    // chạm nhẹ / phím Enter: tự giật xuống
  if (triggered) return;
  cancelAnimationFrame(rafS); scale = rig.clientWidth / 360;
  const from = pull, t0 = performance.now();
  const step = t => {
    const k = clamp01((t - t0) / 240); setPull(from + (108 - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) rafS = requestAnimationFrame(step); else fire();
  };
  rafS = requestAnimationFrame(step);
}
function tug() {                                         // gợi ý: dây tự giật nhẹ để người xem để ý
  if (triggered || dragging || !lamp.classList.contains('in')) return;
  vel = 3.2; springBack();
}
pullBtn.addEventListener('pointerdown', e => {
  if (triggered) return;
  e.preventDefault(); dragging = true; moved = 0; startY = e.clientY; startPull = pull;
  scale = rig.clientWidth / 360; cancelAnimationFrame(rafS);
  try { pullBtn.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
  lamp.classList.add('grab'); unlockAudio();
});
pullBtn.addEventListener('pointermove', e => {
  if (!dragging) return;
  moved = Math.max(moved, Math.abs(e.clientY - startY));
  setPull(Math.max(-8, Math.min(MAXP, startPull + (e.clientY - startY) / scale)));
  if (pull >= MAXP - 3) { dragging = false; lamp.classList.remove('grab'); fire(); }
});
function endDrag() {
  if (!dragging) return;
  dragging = false; lamp.classList.remove('grab');
  if (moved < 6) autoPull();                             // chỉ chạm, không kéo
  else if (pull >= TRIG) fire();
  else springBack();
}
pullBtn.addEventListener('pointerup', endDrag);
pullBtn.addEventListener('pointercancel', endDrag);
pullBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlockAudio(); autoPull(); } });

async function fire() {
  if (triggered) return; triggered = true;
  clearInterval(tugT); unlockAudio();
  hint.classList.add('gone');
  clickSound(); Music.start();
  lamp.classList.add('snap', 'flick'); springBack();
  await wait(1100); lamp.classList.add('off');          // đèn tắt, màn hình tối dần
  await wait(900);
  startNight();
}

/* đèn: hiện khi cuộn tới, bụi sáng bay trong chùm sáng */
if ('IntersectionObserver' in window) {
  new IntersectionObserver((es, io) => es.forEach(e => {
    if (e.isIntersecting) { lamp.classList.add('in'); io.disconnect(); tugT = setInterval(tug, 4200); }
  }), { threshold: .3 }).observe(lamp);
} else { lamp.classList.add('in'); }
addEventListener('resize', () => { scale = rig.clientWidth / 360; setPull(pull); });
setPull(0);

/* =====================================================
   MÀN ĐEN — chữ hiện dần → lá hoa cuộn tròn → bông hoa nở → lời chúc → ảnh thầy cô lơ lửng
   ===================================================== */
const nc = $('#nc'), c = nc.getContext('2d'), nText = $('#nText'), nHead = $('#nHead'), nSign = $('#nSign'), nEnd = $('#nEnd');
const photos = [...document.querySelectorAll('#nPhotos .tp')], lines = [...document.querySelectorAll('#nStack .n-line')];

/* mốc thời gian (ms) tính từ lúc màn đen bắt đầu */
const T = { txt1: 1300, dis1: 4900, txt2a: 6700, txt2b: 8700, dis2: 14400, swirl: 15200, bloom: 23200,
  head: 28200, wish: [30200, 34500, 38800, 43100, 47400, 51700], photo: [32200, 34900, 37600, 40300, 43000], end: 57500 };
const PET = ['#ff8fb8', '#ffc0d8', '#fff0f6', '#ffb199', '#ffd7a8'], LEAF = ['#5fbf7a', '#3f9f62', '#8fd69a'];
const FLOWER = [
  { n: 10, f: 1.00, c: ['#ff8fb8', '#ffc0d8', '#fff0f6'] },
  { n: 8, f: .76, c: ['#ff6fa3', '#ffb0cd', '#ffe1ec'] },
  { n: 6, f: .54, c: ['#ff4f8b', '#ff9bbd', '#ffd0e0'] }
];
let W = 0, H = 0, D = 1, CX = 0, CY = 0, R = 100, on = false, raf = 0, t0 = 0, timers = [], ff = [], sw = [], fall = [], lastNow = 0;
const at = (ms, fn) => timers.push(setTimeout(fn, ms));
const pick = a => a[(Math.random() * a.length) | 0];

function geom() {
  W = innerWidth; H = innerHeight; D = Math.min(2, devicePixelRatio || 1);
  nc.width = Math.round(W * D); nc.height = Math.round(H * D);
  const mob = W < 700;
  CX = W / 2; CY = H * (mob ? .31 : .37); R = Math.min(W * .26, H * .2, 170);
  const pw = mob ? Math.max(74, Math.min(96, W * .22)) : Math.min(150, Math.max(110, W * .11));
  const pos = mob
    ? [[.22, .15, -6], [.80, .17, 5], [.11, .40, -4], [.89, .45, 6], [.50, .065, 2]]
    : [[-.30, -.20, -6], [.30, -.22, 5], [-.40, .10, -4], [.40, .08, 6], [0, -.255, 2]];
  photos.forEach((el, i) => {
    const p = pos[i], x = mob ? p[0] * W : CX + p[0] * W, y = mob ? p[1] * H : CY + p[1] * H;
    el.style.setProperty('--x', x.toFixed(0) + 'px'); el.style.setProperty('--y', y.toFixed(0) + 'px');
    el.style.setProperty('--r', p[2] + 'deg'); el.style.setProperty('--pw', pw.toFixed(0) + 'px');
    el.style.setProperty('--ft', (6 + i * 1.1).toFixed(1) + 's'); el.style.setProperty('--fd', (-i * 1.3).toFixed(1) + 's');
  });
}
function seedParticles() {
  const mob = W < 700;
  ff = Array.from({ length: mob ? 34 : 56 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.8, 2.3), ph: rnd(0, 6.28), sp: rnd(.5, 1.4), dx: rnd(-.1, .1), dy: rnd(-.16, -.02) }));
  const maxR = Math.hypot(W, H) * .62, nP = mob ? 84 : 120, nL = mob ? 10 : 16;
  sw = Array.from({ length: nP + nL }, (_, i) => ({
    leaf: i >= nP, a0: rnd(0, 6.283), r0: maxR * rnd(.6, 1), k: rnd(1.5, 2.7), d: rnd(0, 2600), dur: rnd(4600, 5600),
    s: rnd(.7, 1.2), col: i >= nP ? pick(LEAF) : pick(PET), rEnd: R * rnd(.02, .14), tw: rnd(0, 6.28)
  }));
  fall = Array.from({ length: mob ? 18 : 30 }, () => ({ x: rnd(0, W), y: rnd(-H, 0), vy: rnd(.022, .05), ph: rnd(0, 6.28), amp: rnd(14, 40), s: rnd(.1, .2), col: pick(PET), rot: rnd(0, 6.28), vr: rnd(-.0012, .0012) }));
}

/* ---- hình vẽ cánh hoa / lá ---- */
function petal(len, wid) {
  c.beginPath(); c.moveTo(0, 0);
  c.bezierCurveTo(wid, -len * .25, wid * .95, -len * .8, 0, -len);
  c.bezierCurveTo(-wid * .95, -len * .8, -wid, -len * .25, 0, 0); c.closePath();
}
function leaf(len, wid) {
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(wid, -len * .5, 0, -len); c.quadraticCurveTo(-wid, -len * .5, 0, 0); c.closePath();
}

function drawFireflies(now) {
  for (const f of ff) {
    f.x += f.dx; f.y += f.dy; if (f.y < -6) { f.y = H + 6; f.x = rnd(0, W); } if (f.x < -6) f.x = W + 6; if (f.x > W + 6) f.x = -6;
    const a = .25 + .55 * (.5 + .5 * Math.sin(now / 1000 * f.sp + f.ph));
    const gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
    gr.addColorStop(0, 'rgba(255,226,170,' + (a * .55).toFixed(3) + ')'); gr.addColorStop(.35, 'rgba(255,210,140,' + (a * .14).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,210,140,0)');
    c.fillStyle = gr; c.fillRect(f.x - f.r * 6, f.y - f.r * 6, f.r * 12, f.r * 12);
    c.fillStyle = 'rgba(255,240,200,' + a.toFixed(3) + ')'; c.beginPath(); c.arc(f.x, f.y, f.r * .8, 0, 6.2832); c.fill();
  }
}
function drawSwirl(ts) {
  const end = T.bloom - T.swirl;
  const glow = clamp01((ts - 3500) / 4500) * (1 - clamp01((ts - end - 600) / 900));
  if (glow > .01) {
    const g = c.createRadialGradient(CX, CY, 0, CX, CY, R * 1.9);
    g.addColorStop(0, 'rgba(255,170,205,' + (.42 * glow).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,205,0)');
    c.fillStyle = g; c.fillRect(CX - R * 2, CY - R * 2, R * 4, R * 4);
  }
  const fade = 1 - clamp01((ts - end + 200) / 1100);
  for (const p of sw) {
    const u = clamp01((ts - p.d) / p.dur); if (u <= 0 || fade <= 0) continue;
    const e = u * u * (3 - 2 * u), r = p.r0 * (1 - e) + p.rEnd * e, th = p.a0 + p.k * 6.2832 * e;
    const x = CX + r * Math.cos(th), y = CY + r * Math.sin(th);
    const head = th + 1.5708 + .7 * (1 - e) + p.tw + ts * .0016;
    const sz = R * .5 * p.s * (1 - .45 * e), a = clamp01(u / .12) * fade * .92;
    c.save(); c.translate(x, y); c.rotate(head); c.globalAlpha = a; c.fillStyle = p.col;
    if (p.leaf) leaf(sz * 1.05, sz * .34); else petal(sz, sz * .36);
    c.fill(); c.restore();
  }
  c.globalAlpha = 1;
}
function drawFlower(t) {
  const g = ease(clamp01((t - (T.bloom - 900)) / 1400)); if (g <= 0) return;
  const oRaw = clamp01((t - (T.bloom + 300)) / 7000), o = ease(oRaw), breathe = 1 + .025 * Math.sin(t / 900);
  c.save(); c.translate(CX, CY); c.scale(g * breathe, g * breathe);
  const gl = c.createRadialGradient(0, 0, 0, 0, 0, R * (1.5 + 1.3 * o));
  gl.addColorStop(0, 'rgba(255,150,195,' + (.2 + .26 * o).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,150,195,0)');
  c.fillStyle = gl; c.fillRect(-R * 3, -R * 3, R * 6, R * 6);
  if (o > .15) {                                         // tia sáng xoay chậm phía sau
    c.save(); c.rotate(-t * .00007); c.fillStyle = 'rgba(255,205,225,' + (.07 * o).toFixed(3) + ')';
    for (let i = 0; i < 16; i++) { c.rotate(6.2832 / 16); c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * .11, -R * 2.4); c.lineTo(R * .11, -R * 2.4); c.closePath(); c.fill(); }
    c.restore();
  }
  FLOWER.forEach((L, li) => {
    const ol = ease(clamp01((oRaw - li * .1) / .8)), len = R * L.f * (.34 + .66 * ol), wid = R * L.f * (.18 + .2 * ol);
    const rot = t * .0001 * (li % 2 ? -1 : 1) + li * .31;
    for (let i = 0; i < L.n; i++) {
      c.save(); c.rotate(rot + i * 6.2832 / L.n);
      const gr = c.createLinearGradient(0, 0, 0, -len);
      gr.addColorStop(0, L.c[0]); gr.addColorStop(.6, L.c[1]); gr.addColorStop(1, L.c[2]);
      c.fillStyle = gr; c.globalAlpha = .94; petal(len, wid); c.fill();
      c.globalAlpha = .35; c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); c.restore();
    }
  });
  const cr = R * .16 * (.6 + .4 * o), cg = c.createRadialGradient(0, 0, 0, 0, 0, cr);
  cg.addColorStop(0, '#fff3b0'); cg.addColorStop(.6, '#ffd45e'); cg.addColorStop(1, '#f0a53a');
  c.globalAlpha = 1; c.fillStyle = cg; c.beginPath(); c.arc(0, 0, cr, 0, 6.2832); c.fill();
  for (let i = 0; i < 22; i++) {
    const a = i * 2.399 + t * .0002, rr = cr * (.35 + .75 * ((i * 37) % 10) / 10);
    c.fillStyle = 'rgba(255,236,150,' + (.55 + .4 * Math.sin(t / 400 + i)).toFixed(2) + ')';
    c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.5, 0, 6.2832); c.fill();
  }
  c.restore();
  const flash = clamp01(1 - Math.abs(t - (T.bloom + 500)) / 800);   // chớp sáng lúc hoa bung nở
  if (flash > 0) {
    const fg = c.createRadialGradient(CX, CY, 0, CX, CY, R * 3.2);
    fg.addColorStop(0, 'rgba(255,235,245,' + (.4 * flash).toFixed(3) + ')'); fg.addColorStop(1, 'rgba(255,235,245,0)');
    c.fillStyle = fg; c.fillRect(0, 0, W, H);
  }
}
function drawFall(dt, t) {
  for (const p of fall) {
    p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 30) { p.y = -30; p.x = rnd(0, W); }
    const x = p.x + Math.sin(t / 1600 + p.ph) * p.amp, sz = R * p.s * 2.4;
    c.save(); c.translate(x, p.y); c.rotate(p.rot + Math.sin(t / 900 + p.ph) * .5); c.globalAlpha = .55; c.fillStyle = p.col;
    petal(sz, sz * .38); c.fill(); c.restore();
  }
  c.globalAlpha = 1;
}
function frame() {
  raf = 0; if (!on) return;
  const now = performance.now(), t = now - t0, dt = Math.min(60, now - (lastNow || now)); lastNow = now;
  c.setTransform(D, 0, 0, D, 0, 0); c.clearRect(0, 0, W, H);
  drawFireflies(now);
  if (t > T.swirl && t < T.bloom + 1500) drawSwirl(t - T.swirl);
  if (t > T.bloom - 900) drawFlower(t);
  if (t > T.bloom + 4500 && !reduce) drawFall(dt, t);
  raf = requestAnimationFrame(frame);
}

/* ---- chữ hiện từng chữ rồi tan biến ---- */
function say(text, cls) {
  const d = document.createElement('div'); d.className = 'nl ' + (cls || ''); let i = 0;
  d.innerHTML = text.split(' ').map(w => '<span class="wd">' + [...w].map(ch =>
    `<span class="ch" style="--i:${i++};--dx:${rnd(-30, 30) | 0}px;--r:${rnd(-14, 14) | 0}deg">${ch}</span>`).join('') + '</span>').join(' ');
  nText.appendChild(d);
}
function dissolve() { nText.classList.add('out'); at(1800, () => { nText.innerHTML = ''; nText.classList.remove('out'); }); }
function showWish(i) {
  lines.forEach((l, j) => { if (j < i) { l.classList.remove('on'); l.classList.add('off'); } });
  lines[i].classList.remove('off'); lines[i].classList.add('on');
}
function resetDOM() {
  nText.innerHTML = ''; nText.classList.remove('out');
  nHead.classList.remove('on'); nSign.classList.remove('on'); nEnd.hidden = true;
  lines.forEach(l => l.classList.remove('on', 'off')); photos.forEach(p => p.classList.remove('show'));
}
lines.forEach(l => { let i = 0; l.innerHTML = l.textContent.trim().split(' ').map(w => `<span class="w" style="--i:${i++}">${w}</span>`).join(' '); });

function schedule() {
  at(T.txt1, () => say('Ơ… gì ấy nhỉ?'));
  at(T.dis1, dissolve);
  at(T.txt2a, () => say('À, quên mất…'));
  at(T.txt2b, () => say('còn một phần chúng em muốn gửi đến thầy cô', 'l2'));
  at(T.dis2, dissolve);
  at(T.head, () => nHead.classList.add('on'));
  T.wish.forEach((ms, i) => at(ms, () => showWish(i)));
  T.photo.forEach((ms, i) => at(ms, () => photos[i].classList.add('show')));
  at(T.wish[5] + 3200, () => nSign.classList.add('on'));
  at(T.end, () => { nEnd.hidden = false; $('#nReplay').focus({ preventScroll: true }); });
}
function showFinalNow() {                                // người xem tắt chuyển động: hiện thẳng kết quả
  t0 = performance.now() - (T.bloom + 8000);
  nHead.classList.add('on'); showWish(5); nSign.classList.add('on'); nEnd.hidden = false;
  photos.forEach(p => { p.style.opacity = 1; p.classList.add('show'); });
}

function startNight(replay) {
  clearTimers(); geom(); on = true; lastNow = 0;
  resetDOM(); seedParticles();
  if (!replay) {
    night.classList.add('on'); night.setAttribute('aria-hidden', 'false'); document.body.classList.add('night-on');
  } else { Music.start(); }
  t0 = performance.now();
  Music.fade(.8, 6);                                     // nhạc nhỏ dần vào từ màn đen
  if (reduce) showFinalNow(); else schedule();
  if (!raf) raf = requestAnimationFrame(frame);
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
async function backToLesson() {
  clearTimers(); Music.stop(1.4);
  night.classList.remove('on'); night.setAttribute('aria-hidden', 'true');
  await wait(1300);
  on = false; cancelAnimationFrame(raf); raf = 0; document.body.classList.remove('night-on');
  lamp.classList.remove('flick', 'snap', 'off'); hint.classList.remove('gone'); triggered = false; vel = 0; setPull(0);
}
$('#nReplay').addEventListener('click', () => { unlockAudio(); startNight(true); });
$('#nBack').addEventListener('click', backToLesson);
addEventListener('keydown', e => {                      // Esc: thoát màn đen, quay lại bài
  if (e.key === 'Escape' && on && night.classList.contains('on')) backToLesson();
});
addEventListener('resize', () => { if (on) { geom(); } });
})();
