// Share link + CSV export, so a team can look at exactly the same site, date and comparison.
// The address bar always holds the current state:
//   ?site=malapert&t=2027-01-13T05:00&cmp=shackleton-ridge,im2&eye=1&dock=year
//   custom points: ?lat=-87.5&lon=45&t=...

/** Build the shareable URL for the current state. */
export function stateUrl(app, { eye = false, dock = '30d' } = {}) {
  const q = new URLSearchParams();
  if (app.active?.id === 'custom') { q.set('lat', app.active.lat.toFixed(4)); q.set('lon', app.active.lon.toFixed(4)); }
  else if (app.active) q.set('site', app.active.id);
  q.set('t', app.date.toISOString().slice(0, 16));
  const cmp = app.compare.filter((s) => s.id !== app.active?.id && s.id !== 'custom').map((s) => s.id);
  if (cmp.length) q.set('cmp', cmp.join(','));
  if (eye) q.set('eye', '1');
  if (dock === 'year') q.set('dock', 'year');
  return `${location.origin}${location.pathname}?${q}`;
}

/** Keep the address bar in sync without adding history entries (throttled while playing). */
export function createUrlSync(getUrl) {
  let last = 0, pending = null;
  return function sync(force = false) {
    const now = performance.now();
    const go = () => { pending = null; last = performance.now(); history.replaceState(null, '', getUrl()); };
    if (force || now - last > 1000) go();
    else if (!pending) pending = setTimeout(go, 1000 - (now - last));
  };
}

/** CSV of the 30-day window, hour by hour (every 30 min), for the selected site and compared sites. */
export function windowCsv(rows) {
  const head = ['site', 'latitude_deg', 'longitude_deg', 'time_utc', 'sun_elevation_deg', 'sun_azimuth_deg',
    'sun_visible_fraction', 'earth_elevation_deg', 'earth_azimuth_deg', 'earth_in_view', 'upright_panel_power_fraction'];
  const lines = [head.join(',')];
  for (const { site, analysis } of rows) {
    const name = `"${site.name.replace(/"/g, '""')}"`;
    for (const p of analysis.series) {
      lines.push([name, site.lat.toFixed(4), site.lon.toFixed(4), new Date(p.t).toISOString().slice(0, 16) + 'Z',
        p.sunEl.toFixed(3), p.sunAz.toFixed(2), p.sunVis.toFixed(3), p.earthEl.toFixed(3), p.earthAz.toFixed(2),
        p.earthVis > 0.5 ? 1 : 0, p.pv.toFixed(3)].join(','));
    }
  }
  return lines.join('\n') + '\n';
}

export function download(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copy text; falls back to a selectable prompt when the clipboard API is blocked. */
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { window.prompt('Copy this link:', text); return false; }
}
