// Landing-date chart: one bar per day of the timeline's 30-day window. Bar height = days of sunlight a lander
// gets before its first sunset (capped at 20); colour = good / workable / poor; the thin strip
// underneath = Earth contact over the first two weeks. Hover to read a day, click to land then.
const LEVEL_VAR = { good: '--good', ok: '--sun', poor: '--poor' };
const MAX_DAYS = 20;

export function createDateChart(canvas, { onPick, onHover }) {
  let days = [], now = null, hover = -1;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function geom() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const top = 4, strip = 5, axis = 14, barH = H - top - strip - 3 - axis;
    return { W, H, top, strip, axis, barH, bw: W / Math.max(1, days.length) };
  }

  function draw() {
    const dpr = Math.min(devicePixelRatio, 2);
    const { W, H, top, strip, barH, bw } = geom();
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!days.length) return;
    // 10-day guide: the "good" threshold
    const y10 = top + barH * (1 - 10 / MAX_DAYS);
    ctx.strokeStyle = css('--line'); ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(0, y10); ctx.lineTo(W, y10); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = css('--ink-3'); ctx.font = `10px ${css('--font')}`;
    ctx.fillText('10 days', W - 38, y10 - 3);

    days.forEach((d, i) => {
      const x = i * bw, h = Math.max(1.5, barH * Math.min(d.lightHours / 24, MAX_DAYS) / MAX_DAYS);
      ctx.globalAlpha = hover === -1 || hover === i ? 1 : 0.55;
      ctx.fillStyle = css(LEVEL_VAR[d.level]);
      ctx.fillRect(x + 0.5, top + barH - h, Math.max(1, bw - 1), h);
      ctx.globalAlpha = 0.25 + 0.75 * d.earthFrac;
      ctx.fillStyle = css('--earth');
      ctx.fillRect(x + 0.5, top + barH + 3, Math.max(1, bw - 1), d.earthFrac > 0.02 ? strip : 0);
    });
    ctx.globalAlpha = 1;

    // week ticks
    ctx.fillStyle = css('--ink-3'); ctx.font = `10px ${css('--font')}`;
    days.forEach((d, i) => {
      if (i % 7 === 0) ctx.fillText(d.date.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }), i * bw + 1, H - 2);
    });
    // where "now" is
    if (now) {
      const t0 = Date.UTC(days[0].date.getUTCFullYear(), days[0].date.getUTCMonth(), days[0].date.getUTCDate());
      const x = ((now - t0) / 86400e3) * bw;
      if (x >= 0 && x <= W) {
        ctx.strokeStyle = css('--ink-1'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, top + barH + strip + 3); ctx.stroke();
      }
    }
  }

  const indexAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * days.length);
    return i >= 0 && i < days.length ? i : -1;
  };
  canvas.addEventListener('pointermove', (e) => { const i = indexAt(e); if (i !== hover) { hover = i; draw(); onHover(i >= 0 ? days[i] : null); } });
  canvas.addEventListener('pointerleave', () => { hover = -1; draw(); onHover(null); });
  canvas.addEventListener('click', (e) => { const i = indexAt(e); if (i >= 0) onPick(days[i]); });
  new ResizeObserver(draw).observe(canvas);

  return {
    setDays(d) { days = d; draw(); },
    setNow(t) { if (now === null || Math.abs(t - now) >= 3600e3) { now = t; draw(); } }, // ~1 px per hour
  };
}
