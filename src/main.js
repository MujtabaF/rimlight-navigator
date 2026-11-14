import '@fontsource-variable/archivo/wdth.css';
import './style.css';
import { loadSites, loadPatch, customSite, fmtLat, fmtLon } from './sites.js';
import { analyse, stateAt, nextTransition } from './core/analysis.js';
import { createScene } from './scene.js';
import { createPanorama } from './panorama.js';
import { createTimeline } from './timeline.js';
import { createStory } from './story.js';

const DAY = 86400e3, HOUR = 3600e3;
const WINDOW_DAYS = 30;
const $ = (s) => document.querySelector(s);

const app = {
  sites: [], byId: new Map(),
  active: null, compare: [],
  date: new Date('2027-01-01T00:00:00Z'),
  windowStart: null, analyses: new Map(),
  playing: false, speed: 6, // simulated hours per real second
};

const scene = createScene($('#viewport'));
const panorama = createPanorama($('#panorama'));
const timeline = createTimeline($('#timeline'), (d) => { setDate(d); });
const story = createStory(app, $('#story'));

// ---------------- analysis cache ----------------
function ensureWindow() {
  const t = app.date.getTime();
  const ws = app.windowStart?.getTime();
  if (ws == null || t < ws || t > ws + WINDOW_DAYS * DAY) {
    app.windowStart = new Date(Math.floor(t / DAY) * DAY - 2 * DAY);
    app.analyses.clear();
  }
}
function analysisFor(site) {
  ensureWindow();
  if (!app.analyses.has(site.id)) app.analyses.set(site.id, analyse(site, site.horizon, app.windowStart, WINDOW_DAYS, 30));
  return app.analyses.get(site.id);
}

// Next visibility change after `date`, located from the 30-min series then refined by bisection.
function countdown(site, a, body) {
  const t = app.date.getTime();
  const vis = (ms) => stateAt(site, site.horizon, new Date(ms))[body].visible > 0.5;
  const now = vis(t);
  const s = a.series;
  let i = s.findIndex((p) => p.t > t);
  if (i < 0) return { now, at: null };
  for (; i < s.length; i++) {
    if ((s[i][body + 'Vis'] > 0.5) !== now) {
      let lo = Math.max(t, s[i - 1]?.t ?? t), hi = s[i].t;
      while (hi - lo > 60e3) { const m = (lo + hi) / 2; if (vis(m) === now) lo = m; else hi = m; }
      return { now, at: hi };
    }
  }
  // Not inside the window: search up to 60 days ahead once, then reuse while still valid.
  const key = `${site.id}|${body}|${now}`;
  const c = farCache.get(key);
  if (c && c.from <= t && (c.at === null ? t - c.from < DAY : c.at > t)) return { now, at: c.at };
  const at = nextTransition(site, site.horizon, app.date, body, !now, 60);
  farCache.set(key, { from: t, at });
  return { now, at };
}
const farCache = new Map();

// ---------------- rendering ----------------
function renderAll() {
  const site = app.active;
  const a = analysisFor(site);
  const st = stateAt(site, site.horizon, app.date);
  scene.setState(st);
  panorama.setState(st);
  timeline.setNow(app.date);
  renderReadout(site, a, st);
  $('#date').value = app.date.toISOString().slice(0, 16);
}

function renderAnalyses() {
  const a = analysisFor(app.active);
  scene.setTracks(a);
  panorama.setAnalysis(a);
  const rows = [app.active, ...app.compare.filter((s) => s.id !== app.active.id)]
    .map((s) => ({ name: s.name, analysis: analysisFor(s), active: s === app.active }));
  timeline.setRows(rows);
  renderCompare(rows);
}

function renderReadout(site, a, st) {
  const sun = countdown(site, a, 'sun');
  const earth = countdown(site, a, 'earth');
  const sunState = st.sun.visible >= 0.99 ? 'Sunlit' : st.sun.visible > 0.01 ? `Sun ${Math.round(st.sun.visible * 100)}% visible` : 'In shadow';
  set('#sun-el', `${st.sun.el.toFixed(1)}°`);
  set('#sun-state', sunState);
  set('#sun-next', sun.at ? `${sun.now ? 'Sunset' : 'Sunrise'} in ${dur(sun.at - app.date)}` : sun.now ? 'No sunset for 60+ days' : 'No sunrise for 60+ days');
  set('#earth-el', `${st.earth.el.toFixed(1)}°`);
  set('#earth-state', st.earth.visible > 0.5 ? 'Earth in view: direct link possible' : 'Earth below horizon: relay needed');
  set('#earth-next', earth.at ? `${earth.now ? 'Earthset' : 'Earthrise'} in ${dur(earth.at - app.date)}` : earth.now ? 'Earth stays up for 60+ days' : 'Earth stays down for 60+ days');
  set('#power-v', `${Math.round(st.power.verticalTracking * 100)}%`);
  set('#power-h', `${Math.round(st.power.horizontal * 100)}%`);
  $('#power-bar-v').style.inlineSize = `${st.power.verticalTracking * 100}%`;
  $('#power-bar-h').style.inlineSize = `${st.power.horizontal * 100}%`;
  const m = a.summary;
  set('#m-sun', `${m.sunlitPct.toFixed(0)}%`);
  set('#m-earth', `${m.earthVisiblePct.toFixed(0)}%`);
  set('#m-both', `${m.bothPct.toFixed(0)}%`);
  set('#m-dark', hours(m.longestDarkHours));
  set('#m-noearth', hours(m.longestNoEarthHours));
  $('#readout').dataset.sun = st.sun.visible > 0.5 ? 'up' : 'down';
}

function renderSiteHeader(site) {
  set('#site-name', site.name);
  set('#site-coords', `${fmtLat(site.lat)}, ${fmtLon(site.lon)}${site.hasTerrain ? `, ${(site.heightM / 1000).toFixed(2)} km elevation` : ''}`);
  set('#site-source', site.hasTerrain ? 'Horizon from NASA LOLA terrain (240 m and 40 m maps)' : 'Smooth horizon: terrain not modelled here');
  set('#site-blurb', site.blurb || '');
  document.querySelectorAll('.site-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === site.id));
}

function renderCompare(rows) {
  const body = $('#compare-body');
  body.innerHTML = rows.map((r) => `<tr class="${r.active ? 'is-active' : ''}"><th scope="row">${r.name}</th>
    <td>${r.analysis.summary.sunlitPct.toFixed(0)}%</td><td>${r.analysis.summary.earthVisiblePct.toFixed(0)}%</td>
    <td>${hours(r.analysis.summary.longestDarkHours)}</td></tr>`).join('');
  $('#compare').hidden = rows.length < 2;
}

// ---------------- actions ----------------
async function setSite(site) {
  app.active = site;
  renderSiteHeader(site);
  const patch = await loadPatch(site).catch(() => null);
  scene.setSite(site, patch);
  panorama.setSite(site);
  renderAnalyses();
  renderAll();
}
function setDate(d) {
  const before = app.windowStart?.getTime();
  app.date = d;
  ensureWindow();
  if (app.windowStart.getTime() !== before) renderAnalyses();
  renderAll();
}
function toggleCompare(id) {
  const s = app.byId.get(id);
  app.compare = app.compare.includes(s) ? app.compare.filter((x) => x !== s) : [...app.compare, s].slice(-4);
  document.querySelectorAll('.cmp-btn').forEach((b) => b.setAttribute('aria-pressed', app.compare.some((x) => x.id === b.dataset.id)));
  renderAnalyses();
}
function setPlaying(p) {
  app.playing = p;
  $('#play').setAttribute('aria-pressed', p);
  $('#play').textContent = p ? 'Pause' : 'Play';
}

// Story-mode helpers
app.peakSun = (id) => {
  const a = analysisFor(app.byId.get(id));
  let best = a.series[0];
  for (const p of a.series) if (p.sunEl > best.sunEl) best = p;
  return new Date(best.t);
};
app.nextSunrise = (id, afterHours = 0) => {
  const a = analysisFor(app.byId.get(id));
  const s = a.series;
  for (let i = 1; i < s.length; i++) if (s[i].sunVis > 0.5 && s[i - 1].sunVis <= 0.5) return new Date(s[i].t + afterHours * HOUR);
  return app.date;
};
app.applyChapter = async (c) => {
  setPlaying(false);
  app.compare = (c.compare || []).map((id) => app.byId.get(id));
  document.querySelectorAll('.cmp-btn').forEach((b) => b.setAttribute('aria-pressed', app.compare.some((x) => x.id === b.dataset.id)));
  await setSite(app.byId.get(c.site));
  const at = c.at({ ...app, windowStart: () => app.windowStart });
  setDate(at);
  if (c.eye !== scene.eye) { scene.setEyeLevel(c.eye, stateAt(app.active, app.active.horizon, app.date).sun.az); syncEye(); }
  if (c.speed) { app.speed = c.speed; $('#speed').value = String(c.speed); }
  setPlaying(!!c.play);
};

// ---------------- UI wiring ----------------
function buildSiteList() {
  const groups = Map.groupBy ? Map.groupBy(app.sites, (s) => s.group) : groupBy(app.sites);
  $('#site-list').innerHTML = [...groups].map(([g, list]) => `
    <li class="group"><h3>${g}</h3><ul>${list.map((s) => `
      <li class="site-row">
        <button class="site-btn" data-id="${s.id}" aria-pressed="false">
          <span class="nm">${s.name}</span><span class="co">${fmtLat(s.lat)}${s.hasTerrain ? ', terrain' : ''}</span>
        </button>
        <button class="cmp-btn" data-id="${s.id}" aria-pressed="false" title="Add to comparison" aria-label="Compare ${s.name}">+</button>
      </li>`).join('')}</ul></li>`).join('');
  $('#site-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('site-btn')) setSite(app.byId.get(b.dataset.id));
    else toggleCompare(b.dataset.id);
  });
}

function syncEye() {
  $('#eye').setAttribute('aria-pressed', scene.eye);
  $('#eye').textContent = scene.eye ? 'Orbit view' : 'Stand on the surface';
}

function wire() {
  $('#play').addEventListener('click', () => setPlaying(!app.playing));
  $('#speed').addEventListener('change', (e) => { app.speed = +e.target.value; });
  $('#back-day').addEventListener('click', () => setDate(new Date(app.date - DAY)));
  $('#fwd-day').addEventListener('click', () => setDate(new Date(+app.date + DAY)));
  $('#date').addEventListener('change', (e) => { const d = new Date(e.target.value + 'Z'); if (!isNaN(d)) setDate(d); });
  $('#today').addEventListener('click', () => setDate(new Date()));
  $('#eye').addEventListener('click', () => {
    scene.setEyeLevel(!scene.eye, stateAt(app.active, app.active.horizon, app.date).sun.az);
    syncEye();
  });
  $('#story-btn').addEventListener('click', () => (story.active ? story.stop() : story.start()));
  $('#custom').addEventListener('submit', (e) => {
    e.preventDefault();
    const lat = +$('#c-lat').value, lon = +$('#c-lon').value;
    if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) { set('#c-msg', 'Latitude must be within ±90 and longitude within ±180.'); return; }
    set('#c-msg', '');
    const s = customSite(lat, lon);
    app.byId.set('custom', s);
    setSite(s);
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === ' ') { e.preventDefault(); setPlaying(!app.playing); }
    else if (e.key === 'ArrowRight') setDate(new Date(+app.date + (e.shiftKey ? DAY : HOUR)));
    else if (e.key === 'ArrowLeft') setDate(new Date(app.date - (e.shiftKey ? DAY : HOUR)));
    else if (e.key === 'PageDown' || (e.key === 'n' && story.active)) story.next();
    else if (e.key === 'PageUp' || (e.key === 'p' && story.active)) story.prev();
    else if (e.key === 'Escape' && story.active) story.stop();
    else if (e.key === 'f') document.body.classList.toggle('focus');
  });
}

let last = performance.now();
function tick(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (app.playing && app.speed) setDate(new Date(+app.date + dt * app.speed * HOUR));
  requestAnimationFrame(tick);
}

// ---------------- helpers ----------------
function set(sel, v) { const el = $(sel); if (el.textContent !== v) el.textContent = v; }
function dur(ms) {
  const min = Math.max(1, Math.round(ms / 60e3));
  if (min < 60) return `${min} min`;
  if (min < 48 * 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  const h = Math.floor(min / 60);
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}
function hours(h) { return h >= 48 ? `${(h / 24).toFixed(1)} days` : `${h.toFixed(0)} h`; }
function groupBy(arr) { const m = new Map(); for (const s of arr) { if (!m.has(s.group)) m.set(s.group, []); m.get(s.group).push(s); } return m; }

// ---------------- boot ----------------
(async function boot() {
  app.sites = await loadSites();
  app.sites.forEach((s) => app.byId.set(s.id, s));
  buildSiteList();
  wire();
  syncEye();
  // Deep links (also a backup for live demos): ?site=malapert&t=2027-01-05T12:00&eye=1  or  ?tour=3
  const q = new URLSearchParams(location.search);
  await setSite(app.byId.get(q.get('site')) || app.byId.get('shackleton-ridge'));
  if (q.get('t')) setDate(new Date(q.get('t') + (q.get('t').endsWith('Z') ? '' : 'Z')));
  if (q.get('eye') === '1') { scene.setEyeLevel(true, stateAt(app.active, app.active.horizon, app.date).sun.az); syncEye(); }
  if (q.get('tour')) await story.goTo(+q.get('tour') - 1);
  document.body.classList.add('ready');
  requestAnimationFrame(tick);
})();
