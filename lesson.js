(() => {
'use strict';
const { $, reduce, wait, rnd, petalBurst, petalCanvas } = window.BM;
const paper = $('#paper'), curtain = $('#curtain'), root = document.documentElement;
const nowD = new Date();
$('#today').textContent = `Số đặc biệt 20/11 · ${nowD.getDate()}/${nowD.getMonth() + 1}/${nowD.getFullYear()}`;

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


/* ---------- vào trang: mở màn chắn nếu đi từ trang giới thiệu ---------- */
(async function arrive() {
  petalCanvas.classList.add('soft'); petalBurst(12);
  if (!root.classList.contains('arrive')) { paper.classList.add('in'); setupReveal(); return; }
  try { sessionStorage.removeItem('bm-in'); } catch (e) { /* bỏ qua */ }
  await wait(650);
  paper.classList.add('in'); setupReveal();
  curtain.className = 'open';
  root.classList.remove('arrive');
  await wait(950);
  curtain.className = '';
})();

/* =====================================================
   KẾT BÀI — xem hết các công thức thì chữ bay ra, công thức bay khỏi bài học
   ghép thành chữ "TRI ÂN THẦY CÔ", rồi thành con thuyền, rồi hiện lời tri ân
   ===================================================== */
(function finale() {
  const ov = $('#finale'), cvs = $('#fx'), c = cvs.getContext('2d'), msg = $('#finMsg'), banner = $('#finBanner'),
    again = $('#finReplay'), back = $('#finBack'), sentinel = $('.demo-end');
  if (!ov || !sentinel) return;

  const ONE = [...'αβπ√∠°θΔ∑½²=+−xy0123456789'];
  const BANNER = 'Bài học đã xong — còn một lời chúng em muốn gửi tới thầy cô';
  const MONO = '"JetBrains Mono",ui-monospace,Consolas,monospace';
  const SERIF = '"Playfair Display",Georgia,serif';
  const HULL = ['#ffb27d', '#ff9a5c', '#ffd09a', '#ff8f6b', '#ffc489', '#ffa974', '#ffdcb0'];
  const WAVE = ['#8fd3ff', '#5cb4ff', '#c4eaff'];
  const TXT = ['#ffffff', '#ffffff', '#ffd9bd', '#ffb27d', '#c4c4ff'];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pickC = a => a[(Math.random() * a.length) | 0];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  let W = 0, H = 0, D = 1, P = [], S = [], T = null, box = { ox: 0, bw: 1 };
  let phase = 'idle', on = false, raf = 0, timers = [], armed = true, sparkA = 0;
  let fsNow = 13, fsFrom = 13, fsTo = 13, fsT0 = 0;

  /* ---- lấy các điểm nằm trong hình vẽ: kênh đỏ = chữ/thân thuyền, kênh xanh = sóng ---- */
  const STEP = 3;
  function pts(draw) {
    const o = document.createElement('canvas'); o.width = W; o.height = H;
    const x = o.getContext('2d', { willReadFrequently: true });
    draw(x);
    const d = x.getImageData(0, 0, W, H).data, a = [];
    for (let y = 0; y < H; y += STEP) for (let xx = 0; xx < W; xx += STEP) {
      const i = (y * W + xx) * 4;
      if (d[i + 3] > 150) a.push([xx, y, d[i + 2] > d[i] ? 1 : 0]);
    }
    return a;
  }
  /* chọn n điểm cách đều nhau (Poisson) để hình thật nét */
  function poisson(a, n) {
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    let r = Math.sqrt(a.length * STEP * STEP / n) * .95, out = [];
    for (let tries = 0; tries < 10; tries++) {
      const cell = r / Math.SQRT2, gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2;
      const grid = new Int32Array(gw * gh).fill(-1); out = [];
      for (const q of a) {
        const gx = (q[0] / cell) | 0, gy = (q[1] / cell) | 0; let ok = true;
        for (let yy = Math.max(0, gy - 2); yy <= gy + 2 && ok; yy++)
          for (let xx = Math.max(0, gx - 2); xx <= gx + 2; xx++) {
            const id = grid[yy * gw + xx];
            if (id >= 0) { const o = out[id], dx = o[0] - q[0], dy = o[1] - q[1]; if (dx * dx + dy * dy < r * r) { ok = false; break; } }
          }
        if (ok) { grid[gy * gw + gx] = out.length; out.push(q); if (out.length >= n) break; }
      }
      if (out.length >= n * .96) break;
      r *= .9;
    }
    const base = out.length;
    while (out.length < n) { const s = out[(Math.random() * base) | 0]; out.push([s[0] + rnd(-1.5, 1.5), s[1] + rnd(-1.5, 1.5), s[2]]); }
    return { pts: out.slice(0, n), r };
  }

  /* ---- hình 1: chữ TRI ÂN / THẦY CÔ ---- */
  function drawText(x) {
    const tw = Math.min(W * .86, 900);
    x.fillStyle = x.strokeStyle = '#f00'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
    x.font = '800 100px ' + SERIF;
    const s1 = Math.min(100 * tw / x.measureText('TRI ÂN').width, H * .25, 230), s2 = s1 * .52;
    const cap1 = s1 * .7, cap2 = s2 * .7, gap = s1 * .2, top = H * .36 - (cap1 + gap + cap2) / 2;
    x.font = '800 ' + s1 + 'px ' + SERIF; x.lineWidth = s1 * .05;
    x.strokeText('TRI ÂN', W / 2, top + cap1); x.fillText('TRI ÂN', W / 2, top + cap1);
    x.font = '700 ' + s2 + 'px ' + SERIF; x.lineWidth = s2 * .06;
    const str = 'THẦY CÔ', sp = s2 * .32, widths = [...str].map(ch => x.measureText(ch).width);
    let cx0 = W / 2 - (widths.reduce((a, b) => a + b, 0) + sp * (str.length - 1)) / 2;
    [...str].forEach((ch, i) => {
      x.textAlign = 'left'; x.strokeText(ch, cx0, top + cap1 + gap + cap2); x.fillText(ch, cx0, top + cap1 + gap + cap2); cx0 += widths[i] + sp;
    });
  }

  /* ---- hình 2: con thuyền (thân cong, mũi cao có cờ, các mảnh ghép, sóng nước) ---- */
  function drawBoat(x) {
    const bw = Math.min(W * .94, 680), bh = bw * .58, ox = (W - bw) / 2, oy = H * .36 - bh * .58;
    box = { ox, bw };
    const p = (u, v) => [ox + u * bw, oy + v * bh];
    x.fillStyle = '#f00'; x.beginPath();
    x.moveTo(...p(.02, .40));
    x.bezierCurveTo(...p(.12, .86), ...p(.40, 1.02), ...p(.64, .96));
    x.bezierCurveTo(...p(.83, .92), ...p(.92, .68), ...p(.93, .36));
    x.lineTo(...p(.975, .13)); x.lineTo(...p(.885, .09)); x.lineTo(...p(1.0, -.03)); x.lineTo(...p(.995, .22)); x.lineTo(...p(.965, .46));
    x.bezierCurveTo(...p(.90, .62), ...p(.76, .70), ...p(.58, .71));
    x.bezierCurveTo(...p(.36, .72), ...p(.15, .62), ...p(.02, .40));
    x.closePath(); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.lineWidth = Math.max(3.5, bh * .035); x.lineCap = 'butt';
    for (const u of [.14, .26, .38, .50, .62, .74, .84]) { x.beginPath(); x.moveTo(...p(u - .03, .38)); x.lineTo(...p(u + .035, 1.06)); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = '#00f'; x.lineCap = 'round'; x.lineWidth = Math.max(4, bh * .04);
    for (let k = 0; k < 2; k++) {
      x.beginPath();
      const a = k ? .18 : 0, b = k ? .86 : 1;
      for (let i = 0; i <= 60; i++) { const u = a + (b - a) * i / 60, q = p(u * 1.02 - .01, 1.07 + k * .1 + Math.sin(u * 11 + k * 2) * .03); i ? x.lineTo(...q) : x.moveTo(...q); }
      x.stroke();
    }
  }

  /* ---- hạt khởi đầu: lấy ngay chữ trong các công thức đang hiện trên màn hình ---- */
  function sources() {
    const out = [];
    document.querySelectorAll('.card .defs li, .card td, .card th, .card h3, .card p, .m-head h2, .vals b, .vals span, .presets button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
      const chars = [...(el.textContent || '')].filter(ch => /\S/.test(ch));
      if (chars.length) out.push({ r, chars, w: Math.max(1, r.width * Math.min(r.height, 60)) });
    });
    return out;
  }
  function seed() {
    const src = sources(), tot = src.reduce((a, s) => a + s.w, 0), N = innerWidth < 700 ? 760 : 1150;
    P = Array.from({ length: N }, () => {
      let x, y, ch;
      if (src.length) {
        let k = Math.random() * tot, s = src[0];
        for (const q of src) { k -= q.w; if (k <= 0) { s = q; break; } }
        x = rnd(s.r.left, s.r.right); y = rnd(s.r.top, Math.min(s.r.bottom, s.r.top + 60)); ch = pickC(s.chars);
      } else { x = rnd(0, innerWidth); y = rnd(innerHeight * .6, innerHeight); ch = pickC(ONE); }
      const c0 = [220, 220, 255];
      return { ch, x, y, fx: x, fy: y, tx: x, ty: y, k: 0, mv: false, ph: rnd(0, 6.28), c0, c1: c0, cur: c0, t0: 0, dur: 1, sx: 0, sy: 0 };
    });
  }
  function layout() {
    W = innerWidth; H = innerHeight; D = Math.min(2, devicePixelRatio || 1);
    cvs.width = Math.round(W * D); cvs.height = Math.round(H * D);
    const N = P.length;
    const ta = poisson(pts(drawText), N), tb = poisson(pts(drawBoat), N);
    T = { text: ta.pts.sort((a, b) => a[0] - b[0]), boat: tb.pts.sort((a, b) => a[0] - b[0]),
      fText: Math.max(7, Math.min(15, ta.r * 1.45)), fBoat: Math.max(7, Math.min(15, tb.r * 1.65)) };
    S = Array.from({ length: 34 }, () => ({ x: rnd(W * .05, W * .95), y: rnd(H * .05, H * .66), ph: rnd(0, 6.3), s: rnd(8, 16), tw: rnd(1.2, 2.6) }));
  }
  const colorFor = (name, q) => {
    if (name === 'text') return pickC(TXT);
    if (q[2]) return pickC(WAVE);
    if (Math.random() < .3) return '#fff1e0';
    const u = (q[0] - box.ox) / box.bw;
    return HULL[Math.max(0, Math.min(6, Math.floor((u - .02) / .9 * 7)))];
  };
  function assign(name, instant) {
    const tg = T[name], idx = P.map((_, i) => i).sort((a, b) => P[a].x - P[b].x), now = performance.now();
    idx.forEach((pi, j) => {
      const p = P[pi], q = tg[j];
      p.c0 = p.cur; p.c1 = hex(colorFor(name, q)); p.k = q[2];
      if (instant) { p.x = p.fx = p.tx = q[0]; p.y = p.fy = p.ty = q[1]; p.mv = false; p.cur = p.c1; return; }
      p.fx = p.x; p.fy = p.y; p.tx = q[0]; p.ty = q[1];
      p.t0 = now + rnd(0, 650) + j / idx.length * 300; p.dur = rnd(2300, 3300); p.sx = rnd(-110, 110); p.sy = rnd(-110, 110); p.mv = true;
    });
  }
  function go(name) {
    phase = name; assign(name, false);
    fsFrom = fsNow; fsTo = name === 'text' ? T.fText : T.fBoat; fsT0 = performance.now();
  }

  function frame() {
    raf = 0; if (!on) return;
    const now = performance.now();
    c.setTransform(D, 0, 0, D, 0, 0); c.clearRect(0, 0, W, H);
    fsNow = fsFrom + (fsTo - fsFrom) * ease(clamp01((now - fsT0) / 2600));
    c.globalCompositeOperation = 'lighter'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 ' + fsNow.toFixed(1) + 'px ' + MONO;
    for (const p of P) {
      let x, y, cp = 1;
      if (p.mv) {
        const k = clamp01((now - p.t0) / p.dur), e = ease(k); cp = e;
        x = p.fx + (p.tx - p.fx) * e + Math.sin(Math.PI * e) * p.sx;
        y = p.fy + (p.ty - p.fy) * e + Math.sin(Math.PI * e) * p.sy;
        if (k >= 1) { p.mv = false; p.x = p.tx; p.y = p.ty; } else { p.x = x; p.y = y; }
      } else {
        x = p.tx + Math.sin(now / 1100 + p.ph); y = p.ty + Math.cos(now / 1300 + p.ph);
        if (phase === 'boat') y += p.k ? Math.sin(now / 600 + p.tx / 35) * 4 : Math.sin(now / 1400) * 3;
      }
      const r = p.c0[0] + (p.c1[0] - p.c0[0]) * cp, g = p.c0[1] + (p.c1[1] - p.c0[1]) * cp, b = p.c0[2] + (p.c1[2] - p.c0[2]) * cp;
      p.cur = [r, g, b];
      c.globalAlpha = p.mv ? Math.min(1, .55 + cp * .45) : .8 + .2 * Math.sin(now / 500 + p.ph);
      c.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
      c.fillText(p.ch, x, y);
    }
    sparkA += ((phase === 'idle' ? 0 : 1) - sparkA) * .012;
    if (sparkA > .02) {
      c.fillStyle = '#ffe27a';
      for (const s of S) {
        c.globalAlpha = sparkA * Math.max(0, Math.sin(now / 1000 * s.tw + s.ph)) * .9;
        c.font = s.s + 'px sans-serif'; c.fillText('✦', s.x, s.y);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  /* ---- dòng chữ bay ra ---- */
  function buildBanner() {
    banner.classList.remove('off');
    let i = 0;
    banner.innerHTML = BANNER.split(' ').map(w =>
      '<span class="wd">' + [...w].map(ch => `<span class="ch" style="--dx:${rnd(-140, 140) | 0}px;--dy:${rnd(140, 460) | 0}px;--r:${rnd(-45, 45) | 0}deg;animation-delay:${300 + (i++) * 30}ms">${ch}</span>`).join('') + '</span>'
    ).join(' ');
  }

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function sequence() {
    clearTimers();
    msg.classList.remove('show'); again.hidden = true; back.hidden = true;
    buildBanner();
    timers.push(setTimeout(() => go('text'), 500));
    timers.push(setTimeout(() => { banner.classList.add('off'); go('boat'); }, 6700));
    timers.push(setTimeout(() => msg.classList.add('show'), 9400));
    timers.push(setTimeout(() => { again.hidden = false; back.hidden = false; back.focus({ preventScroll: true }); }, 10300));
  }

  function open() {
    if (on) return;
    on = true; armed = false; phase = 'idle'; sparkA = 0; fsNow = fsFrom = fsTo = 13;
    document.body.classList.add('fin-on');
    seed(); layout();
    ov.classList.add('on');
    if (reduce) {
      phase = 'boat'; fsNow = T.fBoat; assign('boat', true); banner.classList.add('off');
      msg.classList.add('show'); again.hidden = false; back.hidden = false;
    } else sequence();
    raf = requestAnimationFrame(frame);
  }
  async function close() {
    if (!on) return;
    clearTimers();
    ov.classList.remove('on'); document.body.classList.remove('fin-on');
    await wait(950);
    on = false; msg.classList.remove('show'); cancelAnimationFrame(raf); raf = 0;
  }
  again.addEventListener('click', () => { phase = 'boat'; sequence(); });
  back.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  let rt = 0;
  addEventListener('resize', () => {
    if (!on) return;
    clearTimeout(rt);
    rt = setTimeout(() => {
      layout();
      if (phase !== 'idle') { fsNow = fsFrom = fsTo = phase === 'text' ? T.fText : T.fBoat; assign(phase, true); }
    }, 200);
  });

  /* ---- kích hoạt khi đã xem hết bài: dòng "Hết bài học" hiện trọn vẹn và mọi thẻ đã được xem ---- */
  const allSeen = () => [...document.querySelectorAll('.m-grid > .card')].every(el => el.classList.contains('in'));
  let ratio = 0, dwell = 0;
  new IntersectionObserver(es => {
    for (const e of es) {
      ratio = e.intersectionRatio;
      if (ratio < .3) armed = true;
      clearTimeout(dwell);
      if (ratio >= .9 && armed && !on) dwell = setTimeout(() => { if (ratio >= .85 && allSeen() && !on) open(); }, 900);
    }
  }, { threshold: [0, .3, .6, .9, 1] }).observe(sentinel);
})();

})();
