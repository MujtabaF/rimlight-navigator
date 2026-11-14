// 360° skyline panorama: the horizon the lander actually sees, unrolled flat, with the
// Sun and Earth tracks over the analysis window. This is the "planner's view" — one glance
// shows whether the Sun clears the terrain and where the gaps are.

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function createPanorama(canvas) {
  const ctx = canvas.getContext('2d');
  let site = null, analysis = null, state = null;

  function draw() {
    const dpr = Math.min(devicePixelRatio, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!site) return;

    const padL = 34, padB = 18, padT = 6;
    const pw = W - padL - 8, ph = H - padB - padT;
    let lo = -4, hi = 10;
    for (let az = 0; az < 360; az += 2) hi = Math.max(hi, site.horizon.elAt(az) + 3);
    if (analysis) for (const p of analysis.series) {
      if (p.sunVis > 0.01 || p.sunEl > lo) hi = Math.max(hi, p.sunEl + 2);
      hi = Math.max(hi, p.earthEl + 2);
    }
    hi = Math.min(Math.ceil(hi / 5) * 5, 90);
    if (analysis) for (const p of analysis.series) lo = Math.min(lo, p.earthEl - 1);
    lo = Math.max(Math.floor(lo), -12);
    const x = (az) => padL + (az / 360) * pw;
    const y = (el) => padT + ((hi - el) / (hi - lo)) * ph;

    // grid
    ctx.font = `11px ${css('--font')}`;
    ctx.fillStyle = css('--ink-3');
    ctx.strokeStyle = css('--line');
    ctx.lineWidth = 1;
    const step = hi - lo > 40 ? 15 : hi - lo > 20 ? 5 : 2;
    for (let e = Math.ceil(lo / step) * step; e <= hi; e += step) {
      ctx.beginPath(); ctx.moveTo(padL, y(e)); ctx.lineTo(padL + pw, y(e)); ctx.stroke();
      ctx.fillText(`${e}°`, 4, y(e) + 4);
    }
    for (const [t, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270], ['N', 360]]) {
      ctx.fillText(t, x(az) - 4, H - 4);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, pw, ph);
    ctx.clip();
    // terrain silhouette
    ctx.beginPath();
    ctx.moveTo(x(0), y(lo));
    for (let az = 0; az <= 360; az += 0.5) ctx.lineTo(x(az), y(site.horizon.elAt(az)));
    ctx.lineTo(x(360), y(lo));
    ctx.closePath();
    ctx.fillStyle = css('--terrain');
    ctx.fill();
    ctx.strokeStyle = css('--ink-2');
    ctx.stroke();

    // tracks
    if (analysis) {
      track(analysis.series, 'sun', css('--sun'));
      track(analysis.series, 'earth', css('--earth'));
    }
    // current bodies
    if (state) {
      body(state.earth, css('--earth'), 6);
      body(state.sun, css('--sun'), 7);
    }
    ctx.restore();

    function track(series, k, color) {
      ctx.fillStyle = color;
      for (let i = 0; i < series.length; i += 2) {
        const p = series[i];
        ctx.globalAlpha = p[k + 'Vis'] > 0.5 ? 0.85 : 0.18;
        ctx.fillRect(x(p[k + 'Az']) - 1, y(p[k + 'El']) - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    function body(b, color, r) {
      ctx.beginPath();
      ctx.arc(x(b.az), y(b.el), r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = b.visible > 0.5 ? 1 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  new ResizeObserver(draw).observe(canvas);
  return {
    setSite(s) { site = s; draw(); },
    setAnalysis(a) { analysis = a; draw(); },
    setState(s) { state = s; draw(); },
  };
}
