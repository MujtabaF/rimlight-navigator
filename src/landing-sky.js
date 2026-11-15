// Landing-page animation: the Shackleton ridge's real 360° skyline (NASA LOLA horizon mask) with
// the Sun and Earth moving over 30 days, computed live by the same physics as the navigator.
// Two lamps show when the lander has power and a direct link to Earth.
import { analyse } from './core/analysis.js';
import { terrainHorizon } from './core/horizon.js';

const BASE = import.meta.env.BASE_URL;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

export async function startSky(canvas, { lampSun, lampEarth, dateEl, reduce }) {
  const d = await (await fetch(`${BASE}data/sites/shackleton-ridge.json`)).json();
  const site = { lat: d.lat, lon: d.lon, heightM: d.heightM };
  const hz = terrainHorizon(d);
  const { series } = analyse(site, hz, new Date('2027-01-08T00:00:00Z'), 30, 30);
  const EL0 = -8, EL1 = 9; // vertical range in degrees (stretched so the low polar sky is readable)
  const DURATION = 20000;  // ms for the 30 days
  const sun = css('--sun'), earth = css('--earth');
  let visible = true, t0 = performance.now();

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(canvas);

  function frame(f) { // f = 0..1 through the 30 days
    const dpr = Math.min(devicePixelRatio, 2), W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const x = (az) => (((az % 360) + 360) % 360) / 360 * W;
    const y = (el) => H - ((el - EL0) / (EL1 - EL0)) * H;

    // faint sky grid and the flat horizon
    ctx.strokeStyle = 'rgba(233,228,218,0.06)'; ctx.lineWidth = 1;
    for (let el = -6; el <= 8; el += 2) { ctx.beginPath(); ctx.moveTo(0, y(el)); ctx.lineTo(W, y(el)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(233,228,218,0.18)'; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(0, y(0)); ctx.lineTo(W, y(0)); ctx.stroke(); ctx.setLineDash([]);

    const i = Math.min(series.length - 1, Math.floor(f * (series.length - 1)));
    const p = series[i];

    // tracks: the last few days, fading
    const trail = (key, color, days) => {
      const n = days * 48;
      for (let k = Math.max(0, i - n); k < i; k++) {
        const q = series[k], a = (k - (i - n)) / n;
        ctx.globalAlpha = 0.12 + 0.5 * a * (q[key + 'Vis'] > 0.5 ? 1 : 0.35);
        ctx.fillStyle = color;
        ctx.fillRect(x(q[key + 'Az']) - 1, y(q[key + 'El']) - 1, 2, 2);
      }
      ctx.globalAlpha = 1;
    };
    trail('earth', earth, 6);
    trail('sun', sun, 3);

    // bodies (behind the terrain, so the skyline hides them exactly as the numbers say)
    const glow = ctx.createRadialGradient(x(p.sunAz), y(p.sunEl), 0, x(p.sunAz), y(p.sunEl), 34);
    glow.addColorStop(0, 'rgba(255,215,150,0.95)'); glow.addColorStop(0.25, 'rgba(255,181,71,0.55)'); glow.addColorStop(1, 'rgba(255,181,71,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x(p.sunAz), y(p.sunEl), 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(x(p.sunAz), y(p.sunEl), 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = earth; ctx.beginPath(); ctx.arc(x(p.earthAz), y(p.earthEl), 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(79,163,255,0.5)'; ctx.lineWidth = 6; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(x(p.earthAz), y(p.earthEl), 10, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 1;

    // the skyline, drawn last so it covers whatever is behind it
    const g = ctx.createLinearGradient(0, y(3), 0, H);
    g.addColorStop(0, '#4a463f'); g.addColorStop(1, '#141310');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let k = 0; k <= 720; k++) ctx.lineTo((k / 720) * W, y(hz.elAt(k / 2)));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // rim light along the crest, brightest towards the Sun
    for (let k = 0; k < 720; k++) {
      const az = k / 2, dAz = Math.abs(((az - p.sunAz + 540) % 360) - 180);
      const lit = p.sunEl > -1.5 ? Math.max(0, 1 - dAz / 70) : 0;
      ctx.strokeStyle = `rgba(255,190,110,${0.15 + 0.75 * lit})`; ctx.lineWidth = 1 + lit;
      ctx.beginPath(); ctx.moveTo((k / 720) * W, y(hz.elAt(az))); ctx.lineTo(((k + 1) / 720) * W, y(hz.elAt(az + 0.5))); ctx.stroke();
    }
    ctx.lineWidth = 1;

    // compass
    ctx.fillStyle = 'rgba(233,228,218,0.5)'; ctx.font = `600 12px ${css('--font')}`; ctx.textAlign = 'center';
    [['N', 0], ['E', 90], ['S', 180], ['W', 270], ['N', 360]].forEach(([l, az]) => ctx.fillText(l, Math.min(W - 8, Math.max(8, x(az === 360 ? 359.9 : az))), H - 8));
    ctx.textAlign = 'left';

    lampSun.classList.toggle('on', p.sunVis > 0.5);
    lampEarth.classList.toggle('on', p.earthVis > 0.5);
    dateEl.textContent = new Date(p.t).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function loop() {
    if (!visible) return;
    const f = ((performance.now() - t0) % DURATION) / DURATION;
    frame(f);
    if (!reduce) requestAnimationFrame(loop);
  }
  new ResizeObserver(() => frame(((performance.now() - t0) % DURATION) / DURATION)).observe(canvas);
  if (reduce) frame(0.35); else loop();
}
