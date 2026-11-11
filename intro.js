(() => {
'use strict';
const { $, reduce, wait, rnd, petalBurst } = window.BM;
const LOGO = $('#ld-logo').src;

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
  startIntro();
}


/* =====================================================
   2. GIỚI THIỆU — "Một sản phẩm đến từ nhóm …", rồi tự chuyển sang trang bài học
   ===================================================== */
const intro = $('#intro'), curtain = $('#curtain'), skip = $('#skipLink');
let leaving = false;

async function startIntro() {
  $('#inLogo').src = LOGO;
  intro.hidden = false;
  const SYM = ['sin', 'cos', 'tan', 'cot', 'α', 'β', 'π', '√', '∠', '°', 'Δ', 'θ', '0°', '90°', '180°', 'x²', '∑', '½'];
  const nSym = innerWidth < 700 ? 14 : 24;
  $('#symbols').innerHTML = Array.from({ length: nSym }, () =>
    `<span style="left:${rnd(0, 94).toFixed(1)}%;font-size:${rnd(18, 52).toFixed(0)}px;--t:${rnd(9, 19).toFixed(1)}s;--d:${(-rnd(0, 14)).toFixed(1)}s;--r:${rnd(-60, 60).toFixed(0)}deg">${SYM[(Math.random() * SYM.length) | 0]}</span>`).join('');
  petalBurst(24);
  await wait(80);
  intro.classList.add('go', 'ph-on');
  await wait(reduce ? 2500 : 4200);
  leave();
}

async function leave() {
  if (leaving) return; leaving = true;
  curtain.className = 'cover';                          // màn chắn + chữ "Nội dung chính"
  await wait(2200);
  try { sessionStorage.setItem('bm-in', '1'); } catch (e) { /* bỏ qua */ }
  location.href = 'bai-hoc.html';
}
skip.addEventListener('click', e => { e.preventDefault(); leave(); });
addEventListener('pageshow', e => { if (e.persisted) location.reload(); });   // bấm Back từ trang bài học
})();
