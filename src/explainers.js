// Two short explainers in one pop-up panel:
//  - Earth vs Moon: how a day at this site compares with a day on Earth
//  - Libration: why Earth isn't fixed in the Moon's sky (drawn from this site's real data)

const hrs = (h) => (h >= 48 ? `${(h / 24).toFixed(1)} days` : `${Math.round(h)} hours`);

function longestRun(series, pred, stepMin) {
  let best = 0, run = 0;
  for (const p of series) { run = pred(p) ? run + 1 : 0; if (run > best) best = run; }
  return (best * stepMin) / 60;
}

// Rough temperatures from NASA LRO Diviner measurements (said as "about" on screen).
function moonTemps(site, sunlitPct) {
  if (sunlitPct < 1) return 'About −240 °C, all the time. Permanently shadowed craters are among the coldest places measured in the Solar System.';
  if (Math.abs(site.lat) >= 80) return 'About −60 °C in sunlight, dropping below −200 °C in shadow. The Sun stays so low that the ground never heats up much.';
  const dayK = 390 * Math.cos((site.lat * Math.PI) / 180) ** 0.25;
  return `Up to about +${Math.round(dayK - 273)} °C at midday, down to about −180 °C at night. No air holds the heat in.`;
}

export function earthVsMoon(site, analysis) {
  const s = analysis.series, step = analysis.stepMin, m = analysis.summary;
  const light = longestRun(s, (p) => p.sunVis > 0.5, step);
  const dark = m.longestDarkHours;
  const full = analysis.days * 24;
  const fmt = (h, word) => (h >= full - step / 60 ? `${word} the whole 30 days` : `${hrs(h)}`);
  const noonEarth = Math.round(90 - Math.abs(site.lat));
  const rows = [
    ['From one sunrise to the next', '24 hours', '29.5 Earth days, everywhere on the Moon'],
    ['Longest daylight here (next 30 days)', 'About 12 hours (up to 24 near the poles in summer)', light < 0.5 ? 'No daylight at all' : fmt(light, 'Sunlit for')],
    ['Longest night here (next 30 days)', 'About 12 hours', dark < 0.5 ? 'No night at all' : fmt(dark, 'Dark for')],
    ['Highest the Sun gets', `${noonEarth}° at this latitude at an equinox`, `${Math.max(0, m.maxSunEl).toFixed(1)}° this month`],
    ['Temperature', 'Mostly between −40 °C and +45 °C', moonTemps(site, m.sunlitPct)],
    ['Sky in daytime', 'Blue (air scatters sunlight)', 'Black with stars (no air)'],
    ['The other world in the sky', 'The Moon rises and sets every day',
      m.earthVisiblePct < 0.5 ? 'Earth never rises here (this part of the Moon faces away from Earth)'
        : m.earthVisiblePct > 99.5 ? 'Earth stays in nearly the same spot and never sets'
          : `Earth hugs the horizon, rising and setting with the monthly wobble (in view ${Math.round(m.earthVisiblePct)}% of these 30 days)`],
    ['Gravity', '1 g', 'One sixth of Earth\'s'],
  ];
  return {
    title: `A day at ${site.name.replace(/ \(.*\)$/, '')} vs a day on Earth`,
    html: `<table class="evm"><thead><tr><th></th><th>On Earth</th><th>Here on the Moon</th></tr></thead><tbody>
      ${rows.map(([k, e, mo]) => `<tr><th scope="row">${k}</th><td>${e}</td><td>${mo}</td></tr>`).join('')}
    </tbody></table>
    <p class="explain-note">Moon temperatures are rounded from NASA's LRO Diviner measurements. Daylight and night figures come from this app's own calculation for this site, including the real terrain where it's loaded.</p>`,
  };
}

export function libration(site, analysis, now) {
  const s = analysis.series;
  // unwrap azimuth around its mean so a path crossing north (0°/360°) stays continuous
  const ref = Math.atan2(s.reduce((a, p) => a + Math.sin(p.earthAz * Math.PI / 180), 0), s.reduce((a, p) => a + Math.cos(p.earthAz * Math.PI / 180), 0)) * 180 / Math.PI;
  const az = (v) => ((v - ref + 540) % 360) - 180;
  const xs = s.map((p) => az(p.earthAz)), ys = s.map((p) => p.earthEl);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const W = 520, H = 230, pad = 34;
  const span = Math.max(x1 - x0, (y1 - y0) * (W - 2 * pad) / (H - 2 * pad), 4);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, k = (W - 2 * pad) / span;
  const X = (v) => W / 2 + (v - cx) * k, Y = (v) => H / 2 - (v - cy) * k;
  const path = s.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join('');
  const hz = site.horizon;
  let sky = '';
  if (y0 < 1 && y1 > -1) { // draw the skyline under the path when it's close to it
    const pts = [];
    const vL = cx - W / 2 / k, vR = cx + W / 2 / k; // full width of the picture
    for (let v = vL; v <= vR; v += (vR - vL) / 160) pts.push(`${X(v).toFixed(1)},${Y(hz.elAt((v + ref + 720) % 360)).toFixed(1)}`);
    sky = `<polygon class="lib-ground" points="${pts.join(' ')} ${W},${H} 0,${H}"/>`;
  }
  const i = Math.max(0, s.findIndex((p) => p.t >= +now));
  const wide = (x1 - x0).toFixed(1), tall = (y1 - y0).toFixed(1);
  return {
    title: 'Why Earth moves in the Moon\'s sky',
    html: `<svg class="lib-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Earth's path in the sky at this site over 30 days">
        ${sky}
        <path class="lib-path" d="${path}"/>
        <circle class="lib-now" cx="${X(xs[i])}" cy="${Y(ys[i])}" r="6"/>
        <text x="${pad}" y="${H - 8}" class="lib-axis">${wide}° side to side</text>
        <text x="${W - pad}" y="16" class="lib-axis" text-anchor="end">${tall}° up and down</text>
      </svg>
      <p class="explain-lead">Earth's real path in the sky at ${site.name.replace(/ \(.*\)$/, '')} over the next 30 days. The dot is where it is now${sky ? ', and the grey shape is the skyline' : ''}.</p>
      <ol class="explain-steps">
        <li>The Moon always shows Earth the same face, so you'd expect Earth to hang perfectly still in its sky.</li>
        <li>But the Moon's orbit is an oval. It speeds up near Earth and slows down far away, while it spins at a steady rate. So Earth drifts east and west by up to about 8°.</li>
        <li>The orbit is also tilted about 6.7° against the Moon's equator, so Earth bobs up and down by up to about 7°.</li>
        <li>Together these make Earth trace a loop every month. This wobble is called <b>libration</b>. Near the south pole, that bobbing decides whether Earth clears the skyline, which is why direct radio contact comes and goes.</li>
      </ol>`,
  };
}
