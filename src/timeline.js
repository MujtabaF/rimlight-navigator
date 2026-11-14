// "Light & link" strip: for each site, a 30-day bar showing when the Sun is up (power)
// and when Earth is up (direct-to-Earth comms). Click or drag to scrub time.

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const DAY = 86400e3;

export function createTimeline(canvas, onScrub) {
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
    const a0 = rows[0].analysis;
    const t0 = a0.series[0].t, t1 = a0.series[a0.series.length - 1].t;
    const x = (t) => LABEL_W + ((t - t0) / (t1 - t0)) * (W - LABEL_W - 8);
    const axisH = 16;
    const rowH = Math.min(34, (H - axisH) / rows.length);
    ctx.font = `12px ${css('--font')}`;

    rows.forEach((r, i) => {
      const top = i * rowH + 2, bh = (rowH - 6) / 2;
      ctx.fillStyle = r.active ? css('--ink-1') : css('--ink-2');
      ctx.fillText(ellipsize(r.name, 20), 6, top + rowH / 2 + 2);
      ctx.fillStyle = css('--track');
      ctx.fillRect(LABEL_W, top, W - LABEL_W - 8, bh);
      ctx.fillRect(LABEL_W, top + bh + 1, W - LABEL_W - 8, bh);
      const s = r.analysis.series, dt = s[1].t - s[0].t;
      for (const p of s) {
        const w = Math.max(1, x(p.t + dt) - x(p.t));
        if (p.sunVis > 0.01) {
          ctx.globalAlpha = p.sunVis; ctx.fillStyle = css('--sun');
          ctx.fillRect(x(p.t), top, w, bh);
        }
        if (p.earthVis > 0.5) {
          ctx.globalAlpha = 1; ctx.fillStyle = css('--earth');
          ctx.fillRect(x(p.t), top + bh + 1, w, bh);
        }
      }
      ctx.globalAlpha = 1;
    });

    // day ticks
    const base = H - axisH + 12;
    ctx.fillStyle = css('--ink-3');
    ctx.strokeStyle = css('--line');
    const firstDay = Math.ceil(t0 / DAY) * DAY;
    for (let t = firstDay, k = 0; t <= t1; t += DAY, k++) {
      ctx.beginPath(); ctx.moveTo(x(t), 0); ctx.lineTo(x(t), H - axisH); ctx.stroke();
      if (k % 3 === 0) {
        const d = new Date(t);
        ctx.fillText(d.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }), x(t) + 2, base);
      }
    }
    // playhead
    if (now) {
      ctx.strokeStyle = css('--ink-1');
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x(now), 0); ctx.lineTo(x(now), H - axisH + 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
    canvas._toTime = (px) => t0 + ((px - LABEL_W) / (W - LABEL_W - 8)) * (t1 - t0);
  }

  let dragging = false;
  const scrub = (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    if (px < LABEL_W || !canvas._toTime) return;
    onScrub(new Date(canvas._toTime(px)));
  };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); scrub(e); });
  canvas.addEventListener('pointermove', (e) => dragging && scrub(e));
  canvas.addEventListener('pointerup', () => { dragging = false; });

  new ResizeObserver(draw).observe(canvas);
  return {
    setRows(r) { rows = r; draw(); },
    setNow(t) { now = t.getTime(); draw(); },
  };
}

const ellipsize = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
