// Year strip: same layout as the 30-day timeline (one row per site, Sun lane on top, Earth lane
// below), but with 12 month cells. Each cell is shaded by its percentage and labelled with it.
// Click a month to jump there.
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function createSeasons(canvas, onPickMonth, tip) {
  const ctx = canvas.getContext('2d');
  let rows = [], now = null;
  const LABEL_W = 150;

  function draw() {
    const dpr = Math.min(devicePixelRatio, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!rows.length) return;
    const axisH = 16, rowH = Math.min(44, (H - axisH) / rows.length);
    const cw = (W - LABEL_W - 8) / 12;
    const font = css('--font');
    const nowMonth = now ? new Date(now).getUTCMonth() : -1;

    rows.forEach((r, i) => {
      const top = i * rowH + 2, bh = (rowH - 6) / 2;
      ctx.font = `${r.active ? 600 : 400} 12px ${font}`;
      ctx.fillStyle = r.active ? css('--ink-1') : css('--ink-2');
      ctx.fillText(ellipsize(r.name, 19), 14, top + rowH / 2 + 2);
      if (r.active) { ctx.fillStyle = css('--sun'); ctx.beginPath(); ctx.arc(6, top + rowH / 2 - 2, 3, 0, Math.PI * 2); ctx.fill(); }
      r.months.forEach((m, k) => {
        const x = LABEL_W + k * cw;
        cell(x, top, cw, bh, m.sunPct, css('--sun'), '#1d1407');
        cell(x, top + bh + 1, cw, bh, m.earthPct, css('--earth'), '#04121f');
      });
    });

    // month labels and the current month
    const base = H - axisH + 12;
    ctx.font = `12px ${font}`;
    MONTHS.forEach((m, k) => {
      ctx.fillStyle = k === nowMonth ? css('--ink-1') : css('--ink-3');
      ctx.fillText(m, LABEL_W + k * cw + 4, base);
    });
    if (nowMonth >= 0) {
      ctx.strokeStyle = css('--ink-1'); ctx.lineWidth = 2;
      ctx.strokeRect(LABEL_W + nowMonth * cw + 1, 1, cw - 2, rows.length * rowH);
      ctx.lineWidth = 1;
    }

    function cell(x, y, w, h, pct, color, dark) {
      ctx.fillStyle = css('--track');
      ctx.fillRect(x + 1, y, w - 2, h);
      ctx.globalAlpha = 0.08 + 0.92 * (pct / 100) ** 2; // squared so 60% vs 100% reads clearly
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y, w - 2, h);
      ctx.globalAlpha = 1;
      if (h >= 10 && w >= 34) {
        ctx.font = `600 ${Math.min(12, h - 2)}px ${font}`;
        ctx.fillStyle = pct > 55 ? dark : css('--ink-1');
        ctx.fillText(`${Math.round(pct)}%`, x + 6, y + h / 2 + 4);
      }
    }
  }

  // Hover: exact numbers for any cell (lanes get thin when several sites are compared).
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const H = canvas.clientHeight, rowH = Math.min(44, (H - 16) / Math.max(1, rows.length));
    const k = Math.floor(((px - LABEL_W) / (canvas.clientWidth - LABEL_W - 8)) * 12), i = Math.floor(py / rowH);
    const row = rows[i], m = row?.months[k];
    if (!(px >= LABEL_W && m)) { tip.hidden = true; return; }
    tip.innerHTML = `<b>${row.name}, ${MONTHS[k]}</b><span class="t-sun">Sun up ${Math.round(m.sunPct)}% of the month</span><span class="t-earth">Earth in view ${Math.round(m.earthPct)}%</span><span class="t-hint">Click to jump to ${MONTHS[k]}</span>`;
    tip.hidden = false;
    const host = tip.offsetParent?.getBoundingClientRect() || r;
    const x = e.clientX - host.left, y = e.clientY - host.top;
    tip.style.left = `${Math.min(x + 14, host.width - tip.offsetWidth - 8)}px`;
    tip.style.top = `${Math.max(4, y - tip.offsetHeight - 10)}px`;
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left;
    if (px < LABEL_W) return;
    const k = Math.floor(((px - LABEL_W) / (canvas.clientWidth - LABEL_W - 8)) * 12);
    if (k >= 0 && k < 12) onPickMonth(k);
  });
  new ResizeObserver(draw).observe(canvas);
  return {
    setRows(r) { rows = r; draw(); },
    setNow(t) { const m = new Date(t).getUTCMonth(); if (now === null || new Date(now).getUTCMonth() !== m) { now = +t; draw(); } else now = +t; },
  };
}

const ellipsize = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
