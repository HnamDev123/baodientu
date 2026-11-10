(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- trang trí loading: luồng dữ liệu + hạt sáng ---------- */
(function decorateLoader() {
  const st = $('#ldStream'), dots = $('#ldDots'), HEX = '0123456789ABCDEF';
  const cols = Math.min(16, Math.max(6, Math.floor(innerWidth / 60)));
  for (let i = 0; i < cols; i++) {
    const sp = document.createElement('span');
    sp.textContent = Array.from({ length: 26 }, () => HEX[(Math.random() * 16) | 0]).join('');
    sp.style.left = ((i + Math.random() * .8) / cols * 100).toFixed(1) + '%';
    sp.style.animationDuration = rnd(6, 13).toFixed(1) + 's';
    sp.style.animationDelay = (-rnd(0, 12)).toFixed(1) + 's';
    sp.style.opacity = rnd(.4, 1).toFixed(2);
    st.appendChild(sp);
  }
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('i');
    d.style.cssText = `left:${rnd(0, 100).toFixed(1)}%;--s:${rnd(3, 7).toFixed(1)}px;--t:${rnd(5, 10).toFixed(1)}s;--d:${(-rnd(0, 8)).toFixed(1)}s;--x:${rnd(-50, 50).toFixed(0)}px`;
    dots.appendChild(d);
  }
})();

/* ---------- hiệu ứng gợn sóng khi chạm nút ---------- */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn-start,.btn-read,.presets button,.play');
  if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
  const sp = document.createElement('span'); sp.className = 'rp';
  sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 700);
});

/* =====================================================
   1. LOADING — tiến độ phụ thuộc vào mạng thật của người dùng
   ===================================================== */
const loader = $('#loader'), fill = $('#ld-fill'), pctEl = $('#ld-pct'), statusEl = $('#ld-status');
const parts = { logo: 0, fonts: 0, page: 0 };           // mỗi phần 0..1
const weight = { logo: .3, fonts: .35, page: .35 };
const t0 = performance.now();
const MIN_MS = 1500;                                    // để người dùng kịp thấy hiệu ứng

// (a) logo đã nhúng sẵn trong trang, chờ ảnh giải mã xong
async function loadLogo() {
  const im = $('#ld-logo');
  try {
    if (im.decode) await im.decode();
    else if (!im.complete) await new Promise(r => { im.onload = im.onerror = r; });
  } catch (e) { /* bỏ qua */ }
  parts.logo = 1;
}
// (b) phông chữ (có timeout để không treo khi mạng chặn Google Fonts)
async function loadFonts() {
  const job = Promise.all([
    document.fonts.load('800 1em "Playfair Display"'),
    document.fonts.load('400 1em "Be Vietnam Pro"'),
    document.fonts.load('600 1em "Be Vietnam Pro"'),
    document.fonts.load('500 1em "JetBrains Mono"')
  ]).catch(() => {});
  const tick = setInterval(() => { parts.fonts = Math.min(.9, parts.fonts + .02); }, 120);
  await Promise.race([job, wait(12000)]);
  clearInterval(tick); parts.fonts = 1;
}
// (c) toàn bộ trang
const pageReady = new Promise(res => {
  if (document.readyState === 'complete') res();
  else window.addEventListener('load', res, { once: true });
}).then(() => { parts.page = 1; });
document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') parts.page = Math.max(parts.page, .5);
});

const msgs = [[0, 'KHỞI TẠO HỆ THỐNG…'], [25, 'TẢI TÀI NGUYÊN…'], [55, 'ĐỒNG BỘ PHÔNG CHỮ…'], [85, 'DỰNG GIAO DIỆN…'], [99, 'SẴN SÀNG!']];
let shown = 0, finished = false;
function frame() {
  const real = (parts.logo * weight.logo + parts.fonts * weight.fonts + parts.page * weight.page) * 100;
  const cap = Math.min(100, (performance.now() - t0) / MIN_MS * 100);
  const target = Math.min(real, cap);
  shown += (target - shown) * .1 + (target > shown ? .05 : 0);
  if (target >= 100 && shown > 99.4) shown = 100;
  const p = Math.min(100, shown);
  fill.style.width = p.toFixed(1) + '%';
  pctEl.textContent = Math.floor(p) + '%';
  for (const [at, m] of msgs) if (p >= at) statusEl.textContent = m;
  if (p >= 100 && !finished) { finished = true; endLoading(); return; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
loadLogo(); loadFonts();

async function endLoading() {
  await wait(350);
  loader.classList.add('done');
  document.body.classList.remove('is-loading');
  document.body.classList.add('lock');
  await wait(450);
  loader.remove();
  startWelcome();
}

/* =====================================================
   2. CHÀO MỪNG — chữ hiện từng từ rồi tan biến, sau đó xuất hiện nút
   ===================================================== */
const welcome = $('#welcome'), greet = $('#greet'), startBtn = $('#startBtn');
const GREETING = 'Kính chào quý thầy cô và các bạn đã đến với website báo điện tử của chúng em';

async function startWelcome() {
  welcome.hidden = false;
  const SYM = ['sin', 'cos', 'tan', 'cot', 'α', 'β', 'π', '√', '∠', '°', 'Δ', 'θ', '0°', '90°', '180°', 'x²', '∑', '½'];
  const nSym = innerWidth < 700 ? 14 : 24;
  $('#symbols').innerHTML = Array.from({ length: nSym }, () =>
    `<span style="left:${rnd(0, 94).toFixed(1)}%;font-size:${rnd(18, 52).toFixed(0)}px;--t:${rnd(9, 19).toFixed(1)}s;--d:${(-rnd(0, 14)).toFixed(1)}s;--r:${rnd(-60, 60).toFixed(0)}deg">${SYM[(Math.random() * SYM.length) | 0]}</span>`).join('');
  const words = GREETING.split(' ');
  greet.innerHTML = words.map((w, i) => {
    const hl = /^(thầy|cô|chúng|em)$/i.test(w) ? ' hl' : '';
    const dx = ((Math.random() - .5) * 140).toFixed(0) + 'px', r = ((Math.random() - .5) * 40).toFixed(0) + 'deg';
    return `<span class="w${hl}" style="animation-delay:${i * 130}ms;--i:${i};--dx:${dx};--r:${r}">${w}</span>`;
  }).join(' ');
  await wait(words.length * 130 + 700 + 1800);          // hiện hết + đọc
  greet.classList.add('dissolve');                      // tan biến
  await wait(words.length * 35 + 1000);
  greet.hidden = true;
  startBtn.hidden = false;
}

/* =====================================================
   3. HOA NỞ + LỜI TRI ÂN
   ===================================================== */
const bloom = $('#bloom'), bouquet = $('#bouquet');
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

function buildBouquet() {
  bouquet.innerHTML = '';
  const base = [200, 430];
  const flowers = [
    { x: 200, y: 120, r: 58, c: ['#ff7aa8', '#ff4f8b'], n: 9 },
    { x: 118, y: 175, r: 46, c: ['#ffb066', '#f26a21'], n: 8 },
    { x: 282, y: 175, r: 46, c: ['#ffffff', '#ffd9e6'], n: 8 },
    { x: 150, y: 80,  r: 36, c: ['#ffe27a', '#ffc21a'], n: 8 },
    { x: 252, y: 78,  r: 36, c: ['#c9b8ff', '#9a82ff'], n: 8 },
    { x: 78,  y: 255, r: 34, c: ['#ff9bbd', '#ff6b9d'], n: 7 },
    { x: 322, y: 255, r: 34, c: ['#ffc58a', '#ff9a45'], n: 7 },
    { x: 200, y: 215, r: 40, c: ['#ffffff', '#ffe0c7'], n: 8 }
  ];
  // thân + lá
  flowers.forEach((f, i) => {
    const d0 = (0.1 + i * .12).toFixed(2) + 's';
    const midx = (base[0] + f.x) / 2 + (f.x - base[0]) * .1, midy = (base[1] + f.y) / 2 + 20;
    const path = el('path', { class: 'stem', d: `M${base[0]} ${base[1]} Q${midx} ${midy} ${f.x} ${f.y + 12}` }, bouquet);
    const len = Math.ceil(path.getTotalLength());
    path.style.setProperty('--len', len); path.style.setProperty('--d', d0);
    const lx = base[0] + (f.x - base[0]) * .45, ly = base[1] + (f.y - base[1]) * .5;
    const dir = f.x < base[0] ? -1 : 1;
    const lg = el('g', { transform: `translate(${lx} ${ly}) rotate(${dir < 0 ? 208 : -28})` }, bouquet);
    const leaf = el('ellipse', { class: 'leaf', cx: 20, cy: 0, rx: 20, ry: 8 }, lg);
    leaf.style.setProperty('--d', (0.7 + i * .1).toFixed(2) + 's');
  });
  // giấy gói + nơ
  const wrap = el('g', { class: 'wrap-p' }, bouquet);
  el('path', { d: 'M110 330 L290 330 L222 452 L178 452 Z', fill: '#2f2f85' }, wrap);
  el('path', { d: 'M130 330 L270 330 L216 440 L184 440 Z', fill: '#f26a21', opacity: .95 }, wrap);
  el('path', { d: 'M178 440 L222 440 L215 456 L185 456 Z', fill: '#1d1d5c' }, wrap);
  el('path', { d: 'M200 360 C165 335 160 380 200 366 C240 380 235 335 200 360Z', fill: '#fff' }, wrap);
  el('circle', { cx: 200, cy: 362, r: 6, fill: '#fff' }, wrap);
  // hoa
  flowers.forEach((f, i) => {
    const g = el('g', { class: 'fl', transform: `translate(${f.x} ${f.y})` }, bouquet);
    const sway = el('g', { class: 'sway' }, g);
    sway.style.setProperty('--sd', (-i * .7).toFixed(1) + 's');
    sway.style.setProperty('--sa', (i % 2 ? 4 : -4) + 'deg');
    const start = 1.0 + i * .22;
    for (let k = 0; k < f.n; k++) {
      const ang = (360 / f.n) * k;
      const pg = el('g', { transform: `rotate(${ang})` }, sway);
      const pet = el('ellipse', { class: 'petal', cx: 0, cy: -f.r * .55, rx: f.r * .3, ry: f.r * .55, fill: f.c[k % 2] }, pg);
      pet.style.setProperty('--d', (start + k * .06).toFixed(2) + 's');
    }
    const core = el('circle', { class: 'core', cx: 0, cy: 0, r: f.r * .2, fill: '#ffb21e' }, sway);
    core.style.setProperty('--d', (start + .5).toFixed(2) + 's');
  });
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  welcome.classList.add('out');
  buildBouquet();
  bloom.hidden = false;
  await wait(60);
  petalBurst(36);                                       // cánh hoa bay nhẹ nhàng
  bouquet.classList.add('go');
  $('.bouquet-box').classList.add('lit');
  const sk = $('#sparks');
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * 6.283, rr = rnd(.28, .52);
    const e = document.createElement('i'); e.className = 'spark';
    e.style.cssText = `left:${(50 + Math.cos(a) * rr * 100).toFixed(1)}%;top:${(36 + Math.sin(a) * rr * 100 * .9).toFixed(1)}%;--s:${rnd(8, 19).toFixed(0)}px;--t:${rnd(2.2, 4.2).toFixed(1)}s;--d:${(1.2 + rnd(0, 3)).toFixed(1)}s`;
    sk.appendChild(e);
  }
  await wait(1800);
  $('.tribute').classList.add('show-t');
  await wait(900); welcome.hidden = true;
});

$('#readBtn').addEventListener('click', async e => {
  e.currentTarget.disabled = true;
  const paper = $('#paper'), curtain = $('#curtain');
  curtain.className = 'cover';
  await wait(820);
  paper.hidden = false;
  document.body.classList.remove('lock');
  bloom.hidden = true; bloom.classList.add('out');
  cv.classList.add('soft');
  window.scrollTo(0, 0);
  const n = new Date();
  $('#today').textContent = `Số đặc biệt 20/11 · ${n.getDate()}/${n.getMonth() + 1}/${n.getFullYear()}`;
  setupReveal();
  paper.classList.add('in');
  curtain.className = 'open';
  await wait(950);
  curtain.className = '';
});

/* hiện dần các khối nội dung khi cuộn tới */
function setupReveal() {
  const els = [...document.querySelectorAll('.m-head, .m-grid > .card, .demo-end')];
  const show = el => { el.classList.add('in'); setTimeout(() => el.classList.remove('rv'), 1800); };
  const circ = $('#circ');
  if (!('IntersectionObserver' in window)) { circ.classList.add('on'); return; }
  els.forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--rd', ((i % 2) * .12) + 's'); });
  const io = new IntersectionObserver(list => list.forEach(en => {
    if (!en.isIntersecting) return;
    if (en.target === circ) circ.classList.add('on'); else show(en.target);
    io.unobserve(en.target);
  }), { threshold: .12 });
  els.forEach(el => io.observe(el));
  io.observe(circ);
}

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

/* =====================================================
   4. TOÁN — nửa đường tròn đơn vị tương tác
   ===================================================== */
let playing = false, raf = 0;
const svg = $('#circ'), slider = $('#ang'), angOut = $('#angOut');
const O = { x: 320, y: 312 }, R = 270;
const P = (x, y) => [O.x + x * R, O.y - y * R];
const exact = {
  0:   ['0', '1', '0', '∄'],
  30:  ['1/2', '√3/2', '√3/3', '√3'],
  45:  ['√2/2', '√2/2', '1', '1'],
  60:  ['√3/2', '1/2', '√3', '√3/3'],
  90:  ['1', '0', '∄', '0'],
  120: ['√3/2', '−1/2', '−√3', '−√3/3'],
  135: ['√2/2', '−√2/2', '−1', '−1'],
  150: ['1/2', '−√3/2', '−√3/3', '−√3'],
  180: ['0', '−1', '0', '∄']
};
const f3 = v => { v = Math.abs(v) < 5e-4 ? 0 : v; return (+v.toFixed(3)).toString().replace('.', ',').replace('-', '−'); };

function drawBase() {
  const [ax, ay] = P(-1, 0), [bx, by] = P(1, 0), [tx, ty] = P(0, 1);
  svg.innerHTML = `
    <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8b8bb5"/></marker></defs>
    <line x1="22" y1="${O.y}" x2="618" y2="${O.y}" stroke="#8b8bb5" stroke-width="1.5" marker-end="url(#ar)"/>
    <line x1="${O.x}" y1="${O.y}" x2="${O.x}" y2="24" stroke="#8b8bb5" stroke-width="1.5" marker-end="url(#ar)"/>
    <path class="arc" d="M${ax} ${ay} A${R} ${R} 0 0 1 ${bx} ${by}" fill="rgba(47,47,133,.05)" stroke="#2f2f85" stroke-width="3"/>
    <g font-family="JetBrains Mono,monospace" font-size="15" fill="#2f2f85">
      <text x="${ax - 6}" y="${ay + 24}" text-anchor="middle">−1</text>
      <text x="${bx + 6}" y="${by + 24}" text-anchor="middle">1</text>
      <text x="${O.x - 12}" y="${ty + 5}" text-anchor="end">1</text>
      <text x="${O.x - 10}" y="${O.y + 22}" text-anchor="end">O</text>
      <text x="612" y="${O.y + 22}" text-anchor="end" fill="#8b8bb5">x</text>
      <text x="${O.x + 12}" y="30" fill="#8b8bb5">y</text>
    </g>
    <g id="dyn"></g>
    <circle id="mring" class="mring" r="9" cx="320" cy="42"/>`;
}
function draw(a) {
  const rad = a * Math.PI / 180, x = Math.cos(rad), y = Math.sin(rad);
  const [mx, my] = P(x, y), [hx, hy] = P(x, 0), [vx, vy] = P(0, y);
  const ar = 52, [sx, sy] = [O.x + ar, O.y], [ex, ey] = [O.x + ar * x, O.y - ar * y];
  const large = 0;
  $('#dyn').innerHTML = `
    <path d="M${sx} ${sy} A${ar} ${ar} 0 ${large} 0 ${ex} ${ey}" fill="none" stroke="#f26a21" stroke-width="3"/>
    <line x1="${O.x}" y1="${O.y}" x2="${mx}" y2="${my}" stroke="#2f2f85" stroke-width="2.5"/>
    <line x1="${mx}" y1="${my}" x2="${hx}" y2="${hy}" stroke="#f26a21" stroke-width="2" stroke-dasharray="6 5"/>
    <line x1="${mx}" y1="${my}" x2="${vx}" y2="${vy}" stroke="#2fa36b" stroke-width="2" stroke-dasharray="6 5"/>
    <circle cx="${hx}" cy="${hy}" r="4.5" fill="#f26a21"/><circle cx="${vx}" cy="${vy}" r="4.5" fill="#2fa36b"/>
    <circle cx="${mx}" cy="${my}" r="9" fill="#f26a21" stroke="#fff" stroke-width="3"/>
    <g font-family="Be Vietnam Pro,sans-serif" font-size="15" font-weight="600">
      <text x="${mx + (x >= 0 ? -14 : 14)}" y="${my - 12}" text-anchor="${x >= 0 ? 'end' : 'start'}" fill="#2f2f85">M(${f3(x)}; ${f3(y)})</text>
      <text x="${(O.x + hx) / 2}" y="${O.y + 40}" text-anchor="middle" fill="#f26a21">cos α = ${f3(x)}</text>
      <text x="${vx + 12}" y="${(vy + O.y) / 2 - (y > .5 ? 0 : 16)}" fill="#2fa36b" ${a === 0 || a === 180 ? 'opacity="0"' : ''}>sin α</text>
      <text x="${O.x + ar + 10}" y="${O.y - 12}" fill="#f26a21" font-size="16" ${a === 0 ? 'opacity="0"' : ''}>α</text>
    </g>`;
  const mr = $('#mring'); mr.setAttribute('cx', mx); mr.setAttribute('cy', my);
  // giá trị
  const tan = Math.abs(x) < 1e-9 ? null : y / x, cot = Math.abs(y) < 1e-9 ? null : x / y;
  const ex_ = exact[a];
  const out = (v, i) => v === null ? '∄' : (ex_ ? `${ex_[i]}` : f3(v));
  const setV = (id, v) => { const e = $(id); if (e.textContent === v) return; e.textContent = v;
    if (!playing) { e.classList.remove('tick'); void e.offsetWidth; e.classList.add('tick'); } };
  setV('#vSin', out(y, 0)); setV('#vCos', out(x, 1)); setV('#vTan', out(tan, 2)); setV('#vCot', out(cot, 3));
  const idx = [0, 30, 45, 60, 90, 120, 135, 150, 180].indexOf(a);
  document.querySelectorAll('.table-card tr').forEach(tr => [...tr.children].forEach((c, j) => c.classList.toggle('hl', idx >= 0 && j === idx + 1)));
  angOut.textContent = a + '°';
  document.querySelectorAll('#presets button').forEach(b => b.classList.toggle('on', +b.dataset.a === a));
}
const presets = $('#presets');
[0, 30, 45, 60, 90, 120, 135, 150, 180].forEach(a => {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.a = a; b.textContent = a + '°';
  b.addEventListener('click', () => { stopPlay(); slider.value = a; draw(a); });
  presets.appendChild(b);
});
slider.addEventListener('input', () => { stopPlay(); draw(+slider.value); });
const playBtn = $('#playBtn');
function stopPlay() { playing = false; cancelAnimationFrame(raf); playBtn.classList.remove('on'); playBtn.textContent = '▶ Tự chạy'; }
function startPlay() {
  playing = true; playBtn.classList.add('on'); playBtn.textContent = '❚❚ Dừng';
  const ph = Math.asin(Math.max(-1, Math.min(1, (+slider.value - 90) / 90))), t0 = performance.now();
  const step = t => {
    if (!playing) return;
    const a = Math.round(90 + 90 * Math.sin(ph + (t - t0) / 9000 * 2 * Math.PI));
    if (a !== +slider.value) { slider.value = a; draw(a); }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
playBtn.addEventListener('click', () => playing ? stopPlay() : startPlay());
drawBase(); draw(+slider.value);
})();
