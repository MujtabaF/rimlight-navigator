import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz.css';
import './style.css';
import { loadSites, loadPatch, customSite, fmtLat, fmtLon } from './sites.js';
import { analyse, stateAt, nextTransition } from './core/analysis.js';
import { createScene } from './scene.js';
import { createPanorama } from './panorama.js';
import { createTimeline } from './timeline.js';
import { createStory } from './story.js';
import { createDateChart } from './datechart.js';
import { createSeasons } from './seasons.js';
import { monthlyStats } from './core/seasons.js';
import { landingDays, bestDays, classify, EARTH_DAYS, rateTouchdown } from './core/landing.js';
import { stateUrl, createUrlSync, windowCsv, download, copyText } from './share.js';
import { earthVsMoon, libration } from './explainers.js';

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
const dateChart = createDateChart($('#datechart'), {
  onPick: (d) => setDate(new Date(d.date)),
  onHover: (d) => set('#dates-info', d ? describeDay(d) : DATES_HINT),
});
const seasons = createSeasons($('#seasons'), (month) => {
  const d = app.date, y = d.getUTCFullYear();
  const dim = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
  setDate(new Date(Date.UTC(y, month, Math.min(d.getUTCDate(), dim), d.getUTCHours(), d.getUTCMinutes())));
}, $('#seasons-tip'));
app.dockView = '30d';
const syncUrl = createUrlSync(() => stateUrl(app, { eye: scene.eye, dock: app.dockView }));
const DATES_HINT = 'Tall green bars mean long sunlight and Earth contact. Click a day to land then.';

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
  scene.setState(st, app.date);
  panorama.setState(st);
  timeline.setNow(app.date);
  dateChart.setNow(+app.date);
  if (app.dockView === 'year') seasons.setNow(app.date);
  // While playing, the right panel ticks ~3 times a second so the numbers stay readable;
  // the 3D view, timeline and charts still update every frame.
  const t = performance.now();
  if (!app.playing || t - lastReadout > 330) { lastReadout = t; renderReadout(site, a, st); }
  $('#date').value = app.date.toISOString().slice(0, 16);
}

let lastReadout = 0;

function renderAnalyses() {
  const a = analysisFor(app.active);
  scene.setTracks(a);
  panorama.setAnalysis(a);
  const rows = [app.active, ...app.compare.filter((s) => s.id !== app.active.id)]
    .map((s) => ({ id: s.id, name: s.name, analysis: analysisFor(s), active: s === app.active }));
  timeline.setRows(rows);
  renderCompare(rows);
  if (app.dockView === 'year') renderSeasons();
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
  renderVerdict(m, sun, earth, a);
  updateCompareVerdicts();
  renderDvd();
}

// Plain-English verdict for a solar lander touching down at the current time. Same rule as the
// landing-date chart (core/landing.js classify; docs/DECISIONS.md #12): "good" needs 10+ days of
// light before the first sunset and Earth in view at least half of the first two weeks.
function earthNextDays(a, days) {
  const t0 = +app.date, t1 = t0 + days * DAY;
  let n = 0, up = 0;
  for (const p of a.series) if (p.t >= t0 && p.t < t1) { n++; if (p.earthVis > 0.5) up++; }
  return n ? up / n : a.summary.earthVisiblePct / 100;
}
function renderVerdict(m, sun, earth, a) {
  const lightMs = sun.now ? (sun.at ? sun.at - app.date : Infinity) : 0;
  let power;
  if (m.sunlitPct < 0.5) power = 'No sunlight at all this month: solar power will not work here.';
  else if (!sun.now) power = sun.at ? `In shadow now. The Sun rises in ${dur(sun.at - app.date)}.` : 'In shadow for at least 60 days.';
  else power = sun.at ? `${dur(lightMs)} of sunlight before the first sunset.` : 'Sunlight for 60+ days without a sunset.';

  let link;
  if (m.earthVisiblePct < 0.5) link = 'Earth never rises this month, so a relay satellite is needed.';
  else if (earth.now) link = earth.at ? `Earth in view for ${dur(earth.at - app.date)} more.` : 'Earth stays in view.';
  else link = earth.at ? `No direct link to Earth for ${dur(earth.at - app.date)}.` : 'Earth stays below the horizon for 60+ days.';

  const level = classify(lightMs / DAY, earthNextDays(a, EARTH_DAYS));
  $('#verdict').dataset.level = level;
  set('#verdict-chip', { good: 'Good time to land', ok: 'Workable, with limits', poor: 'Poor time to land' }[level]);
  set('#verdict-text', `${power} ${link}`);
}

function renderSiteHeader(site) {
  set('#site-name', site.name);
  // The right panel always describes the selected site (amber dot), even when others are compared.
  set('#verdict-title', `If a solar lander touched down at ${site.name.replace(/ \(.*\)$/, '')} now`);
  set('#site-coords', `${fmtLat(site.lat)}, ${fmtLon(site.lon)}${site.hasTerrain ? `, ${(site.heightM / 1000).toFixed(2)} km elevation` : ''}`);
  set('#site-source', site.source || (site.hasTerrain ? 'Horizon from NASA LOLA terrain' : 'Smooth horizon: terrain not modelled here'));
  set('#site-blurb', site.blurb || '');
  document.querySelectorAll('.site-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === site.id));
}

// Side-by-side cards for the selected site and every compared site: verdict right now, a mini
// strip of landing days for the same 30-day window, Sun % / Earth % over the window, best day.
const datesCache = new Map();
function datesFor(site) {
  const key = `${site.id}|${site.lat}|${site.lon}|${+app.windowStart}`;
  if (!datesCache.has(key)) datesCache.set(key, landingDays(site, site.horizon, app.windowStart, WINDOW_DAYS));
  return datesCache.get(key);
}
function renderCompare(rows) {
  $('#compare').hidden = rows.length < 2;
  if (rows.length < 2) return;
  $('#compare-list').innerHTML = rows.map((r) => {
    const s = app.byId.get(r.id) || app.active, days = datesFor(s), best = bestDays(days, 1)[0];
    const m = r.analysis.summary;
    const strip = days.map((d) => `<i class="lvl-${d.level}" style="block-size:${Math.max(8, Math.min(100, (d.lightHours / 24 / 20) * 100))}%"></i>`).join('');
    return `<button class="cmp-card${r.active ? ' is-active' : ''}" data-id="${r.id}">
      <span class="cc-head"><span class="cc-name">${r.name.replace(/ \(.*\)$/, '')}</span><span class="cc-verdict" data-id="${r.id}"></span></span>
      <span class="cc-strip" aria-hidden="true">${strip}</span>
      <span class="cc-stats"><span><b class="c-sun">${m.sunlitPct.toFixed(0)}%</b> sunlit</span><span><b class="c-earth">${m.earthVisiblePct.toFixed(0)}%</b> Earth</span><span>Best <b>${best ? fmtDay(best.date) : 'none'}</b></span></span>
    </button>`;
  }).join('');
  updateCompareVerdicts();
}
// Verdict "right now" for every card (same rule as the main verdict). Runs with the readout.
function updateCompareVerdicts() {
  if ($('#compare').hidden) return;
  document.querySelectorAll('.cc-verdict').forEach((el) => {
    const s = el.dataset.id === app.active.id ? app.active : app.byId.get(el.dataset.id);
    if (!s) return;
    const a = analysisFor(s), sun = countdown(s, a, 'sun');
    const light = sun.now ? (sun.at ? sun.at - app.date : 60 * DAY) : 0;
    const level = classify(light / DAY, earthNextDays(a, EARTH_DAYS));
    el.className = `cc-verdict lvl-${level}`;
    el.textContent = { good: 'Good now', ok: 'Workable now', poor: 'Poor now' }[level];
    el.closest('.cmp-card').dataset.level = level;
  });
}

// ---------------- actions ----------------
async function setSite(site) {
  app.active = site;
  renderSiteHeader(site);
  const patch = await loadPatch(site).catch(() => null);
  scene.setSite(site, patch);
  panorama.setSite(site);
  renderAnalyses();
  renderDates();
  renderAll();
  syncUrl(true);
}
function setDate(d) {
  const before = app.windowStart?.getTime();
  app.date = d;
  ensureWindow();
  if (app.windowStart.getTime() !== before) { renderAnalyses(); renderDates(); }
  renderAll();
  syncUrl();
}

// ---------------- year view (seasons) ----------------
const seasonCache = new Map();
function renderSeasons() {
  const year = app.date.getUTCFullYear();
  const list = [app.active, ...app.compare.filter((s) => s.id !== app.active.id)];
  seasons.setRows(list.map((s) => {
    const key = `${s.id}|${s.lat}|${s.lon}|${year}`;
    if (!seasonCache.has(key)) seasonCache.set(key, monthlyStats(s, s.horizon, year));
    return { name: s.name, active: s === app.active, months: seasonCache.get(key) };
  }));
  seasons.setNow(app.date);
}
function setDockView(v) {
  app.dockView = v;
  $('#timeline').hidden = v !== '30d';
  $('#seasons').hidden = v !== 'year';
  document.querySelectorAll('.dock-tab').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dock === v));
  if (v === 'year') renderSeasons();
  syncUrl(true);
}

// ---------------- compare two landing dates ----------------
// Pin one moment, move to another: both touchdowns for the selected site, side by side.
const rateCache = new Map();
function rateAt(site, date) {
  const key = `${site.id}|${site.lat}|${site.lon}|${Math.round(+date / HOUR)}`;
  if (!rateCache.has(key)) { if (rateCache.size > 200) rateCache.clear(); rateCache.set(key, rateTouchdown(site, site.horizon, new Date(Math.round(+date / HOUR) * HOUR))); }
  return rateCache.get(key);
}
function renderDvd() {
  const grid = $('#dvd-grid');
  if (!app.pinned) { grid.hidden = true; $('#dvd-hint').hidden = false; return; }
  const A = rateAt(app.active, app.pinned), B = rateAt(app.active, app.date);
  const same = Math.abs(app.date - app.pinned) < HOUR;
  $('#dvd-hint').hidden = !same;
  set('#dvd-hint', 'Now move to another date (timeline, chart or +1 day) to compare.');
  const LV = { good: 'Good', ok: 'Workable', poor: 'Poor' }, RK = { poor: 0, ok: 1, good: 2 };
  const when = (d) => `${fmtDay(d)}<small>${new Date(d).toISOString().slice(11, 16)} UTC</small>`;
  const cmp = (a, b, higher = true) => (same || a === b ? ['', ''] : (a > b) === higher ? ['better', ''] : ['', 'better']);
  const light = (r) => (r.lightHours < 1 ? 'None' : `${r.capped ? '30+ days' : hours(r.lightHours)}`);
  const rows = [
    ['Verdict', `<span class="lvl-${A.level}">${LV[A.level]}</span>`, `<span class="lvl-${B.level}">${LV[B.level]}</span>`, cmp(RK[A.level], RK[B.level])],
    ['Sunlight before first sunset', light(A), light(B), cmp(A.lightHours, B.lightHours)],
    ['Earth in view, first 2 weeks', `${Math.round(A.earthFrac * 100)}%`, `${Math.round(B.earthFrac * 100)}%`, cmp(Math.round(A.earthFrac * 100), Math.round(B.earthFrac * 100))],
    ['Longest night, next 30 days', A.longestDarkHours < 1 ? 'None' : hours(A.longestDarkHours), B.longestDarkHours < 1 ? 'None' : hours(B.longestDarkHours), cmp(Math.round(A.longestDarkHours), Math.round(B.longestDarkHours), false)],
  ];
  grid.innerHTML = `<span></span><span class="dh">Pinned ${when(app.pinned)}</span><span class="dh">Current ${when(app.date)}</span>`
    + rows.map(([k, a, b, [ca, cb]]) => `<span class="dk">${k}</span><span class="dv ${ca}">${a}</span><span class="dv ${cb}">${b}</span>`).join('');
  grid.hidden = false;
}
function togglePin() {
  app.pinned = app.pinned ? null : new Date(app.date);
  $('#pin-btn').textContent = app.pinned ? 'Unpin' : 'Pin this date';
  renderDvd();
}

// ---------------- focus mode (F or the Hide panels button) ----------------
function toggleFocus() {
  const on = document.body.classList.toggle('focus');
  $('#focus-btn').setAttribute('aria-pressed', on);
  $('#focus-btn').textContent = on ? 'Show panels' : 'Hide panels';
}

// ---------------- explainers ----------------
function openExplainer({ title, html }) {
  set('#explain-title', title);
  $('#explain-body').innerHTML = html;
  if (!$('#explain').open) $('#explain').showModal();
}

// ---------------- landing-date chart ----------------
// Covers exactly the same 30 days as the timeline below, so both move in step.
function renderDates() {
  const site = app.active;
  if (!site) return;
  ensureWindow();
  const days = datesFor(site);
  dateChart.setDays(days);
  const picks = bestDays(days, 3);
  $('#dates-best').innerHTML = picks.length
    ? `<span>Best:</span>${picks.map((p) => `<button class="day-chip lvl-${p.level}" data-t="${+p.date}" title="${describeDay(p)}">${fmtDay(p.date)}</button>`).join('')}`
    : '<span>No day in this window gives a solar lander more than 2 days of light here.</span>';
  set('#dates-info', DATES_HINT);
}
function fmtDay(d) { return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
function describeDay(d) {
  const light = d.lightHours < 1 ? 'no sunlight at touchdown' : `${d.capped ? 'over ' : ''}${hours(d.lightHours)} of sunlight before the first sunset`;
  const lvl = { good: 'Good', ok: 'Workable', poor: 'Poor' }[d.level];
  return `${fmtDay(d.date)}: ${lvl}. ${light[0].toUpperCase() + light.slice(1)}, Earth in view ${Math.round(d.earthFrac * 100)}% of the first two weeks.`;
}
function toggleCompare(id) {
  const s = app.byId.get(id);
  app.compare = app.compare.includes(s) ? app.compare.filter((x) => x !== s) : [...app.compare, s].slice(-4);
  syncCompareButtons();
  renderAnalyses();
  syncUrl(true);
}
function setPlaying(p) {
  app.playing = p;
  $('#play').setAttribute('aria-pressed', p);
  $('#play').textContent = p ? 'Pause' : 'Play';
  if (!p && app.active) renderAll(); // show exact numbers as soon as playback stops
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
  syncCompareButtons();
  await setSite(app.byId.get(c.site));
  const at = c.at({ ...app, windowStart: () => app.windowStart });
  setDate(at);
  // faceAway: look at the far side, lit by the Sun behind you (e.g. a crater wall towering above).
  const sunAz = stateAt(app.active, app.active.horizon, app.date).sun.az + (c.faceAway ? 180 : 0);
  if (c.eye && scene.eye) scene.setEyeLevel(false);
  if (c.eye !== scene.eye) { scene.setEyeLevel(c.eye, sunAz); syncEye(); }
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

function syncCompareButtons() {
  document.querySelectorAll('.cmp-btn').forEach((b) => {
    const on = app.compare.some((x) => x.id === b.dataset.id);
    b.setAttribute('aria-pressed', on);
    b.textContent = on ? '✓' : '+';
    b.title = on ? 'Remove from comparison' : 'Add to comparison';
  });
}

function syncEye() {
  $('#eye').setAttribute('aria-pressed', scene.eye);
  $('#eye').textContent = scene.eye ? 'Orbit view' : 'Stand on the surface';
}

function wire() {
  $('#play').addEventListener('click', () => setPlaying(!app.playing));
  $('#focus-btn').addEventListener('click', toggleFocus);
  $('#pin-btn').addEventListener('click', togglePin);
  $('#evm-btn').addEventListener('click', () => openExplainer(earthVsMoon(app.active, analysisFor(app.active))));
  $('#lib-btn').addEventListener('click', () => openExplainer(libration(app.active, analysisFor(app.active), app.date)));
  $('#explain-close').addEventListener('click', () => $('#explain').close());
  $('#explain').addEventListener('click', (e) => { if (e.target === $('#explain')) $('#explain').close(); });
  $('#share-btn').addEventListener('click', async () => {
    syncUrl(true);
    const ok = await copyText(location.href);
    const b = $('#share-btn'); b.textContent = ok ? 'Link copied' : 'Copy link';
    setTimeout(() => { b.textContent = 'Copy link'; }, 1800);
  });
  $('#csv-btn').addEventListener('click', () => {
    const list = [app.active, ...app.compare.filter((s) => s.id !== app.active.id)];
    const csv = windowCsv(list.map((site) => ({ site, analysis: analysisFor(site) })));
    const slug = app.active.id === 'custom' ? 'custom-point' : app.active.id;
    download(`rimlight-${slug}-${app.windowStart.toISOString().slice(0, 10)}-30days.csv`, csv);
  });
  document.querySelectorAll('.dock-tab').forEach((b) => b.addEventListener('click', () => setDockView(b.dataset.dock)));
  $('#compare-list').addEventListener('click', (e) => {
    const c = e.target.closest('.cmp-card');
    if (c && c.dataset.id !== app.active.id) setSite(app.byId.get(c.dataset.id));
  });
  $('#dates-best').addEventListener('click', (e) => { const b = e.target.closest('.day-chip'); if (b) setDate(new Date(+b.dataset.t)); });
  $('#speed').addEventListener('change', (e) => { app.speed = +e.target.value; });
  $('#back-day').addEventListener('click', () => setDate(new Date(app.date - DAY)));
  $('#fwd-day').addEventListener('click', () => setDate(new Date(+app.date + DAY)));
  $('#date').addEventListener('change', (e) => { const d = new Date(e.target.value + 'Z'); if (!isNaN(d)) setDate(d); });
  $('#today').addEventListener('click', () => setDate(new Date()));
  $('#eye').addEventListener('click', () => {
    scene.setEyeLevel(!scene.eye, stateAt(app.active, app.active.horizon, app.date).sun.az);
    syncEye();
    syncUrl(true);
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
  const help = $('#help');
  const openHelp = () => { dismissHint(); if (!help.open) help.showModal(); };
  $('#help-btn').addEventListener('click', openHelp);
  $('#help-close').addEventListener('click', () => help.close());
  help.addEventListener('click', (e) => { if (e.target === help) help.close(); }); // click outside the panel
  $('#hint-close').addEventListener('click', dismissHint);

  // Floating panels sit above the time dock; keep them clear of it whatever its height.
  new ResizeObserver(([e]) => {
    const h = Math.ceil(e.borderBoxSize[0].blockSize);
    document.documentElement.style.setProperty('--dock-h', `${h}px`);
    scene.setInsetBottom(matchMedia('(max-width: 900px)').matches || document.body.classList.contains('clean') ? 0 : h + 16);
  }).observe($('#bottom'));

  window.addEventListener('keydown', (e) => {
    if (help.open || $('#explain').open) return; // dialogs handle their own Esc
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === '?' || e.key === 'h') openHelp();
    else if (e.key === ' ') { e.preventDefault(); setPlaying(!app.playing); }
    else if (e.key === 'ArrowRight') setDate(new Date(+app.date + (e.shiftKey ? DAY : HOUR)));
    else if (e.key === 'ArrowLeft') setDate(new Date(app.date - (e.shiftKey ? DAY : HOUR)));
    else if (e.key === 'PageDown' || (e.key === 'n' && story.active)) story.next();
    else if (e.key === 'PageUp' || (e.key === 'p' && story.active)) story.prev();
    else if (e.key === 'Escape' && story.active) story.stop();
    else if (e.key === 'f') toggleFocus();
  });
}

let last = performance.now();
function tick(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (app.playing && app.speed) setDate(new Date(+app.date + dt * app.speed * HOUR));
  requestAnimationFrame(tick);
}

// First-visit tip pointing at the help. Shown once per browser; skipped in tour/deep-link mode
// so it never pops up during a presentation.
const HINT_KEY = 'rimlight.hintSeen';
function showHintOnce() {
  try { if (localStorage.getItem(HINT_KEY)) return; } catch { /* storage blocked: still show */ }
  $('#hint').hidden = false;
  setTimeout(dismissHint, 12000);
}
function dismissHint() {
  $('#hint').hidden = true;
  try { localStorage.setItem(HINT_KEY, '1'); } catch { /* ignore */ }
}

// ---------------- helpers ----------------
function set(sel, v) { const el = $(sel); if (el.textContent !== v) el.textContent = v; }
function dur(ms) {
  // While playing, whole hours only (no ticking minutes); exact again when paused.
  if (app.playing && ms >= 3600e3) { const h = Math.round(ms / 3600e3); return h < 48 ? `${h}\u00a0h` : `${Math.floor(h / 24)}\u00a0d ${h % 24}\u00a0h`; }
  const min = Math.max(1, Math.round(ms / 60e3));
  const nb = '\u00a0'; // keep each number on the same line as its unit
  if (min < 60) return `${min}${nb}min`;
  if (min < 48 * 60) return `${Math.floor(min / 60)}${nb}h ${min % 60}${nb}min`;
  const h = Math.floor(min / 60);
  return `${Math.floor(h / 24)}${nb}d ${h % 24}${nb}h`;
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
  if (q.get('cmp')) app.compare = q.get('cmp').split(',').map((id) => app.byId.get(id)).filter(Boolean).slice(0, 4);
  syncCompareButtons();
  const lat = parseFloat(q.get('lat')), lon = parseFloat(q.get('lon'));
  if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) { const c = customSite(lat, lon); app.byId.set('custom', c); await setSite(c); }
  else await setSite(app.byId.get(q.get('site')) || app.byId.get('shackleton-ridge'));
  if (q.get('t')) setDate(new Date(q.get('t') + (q.get('t').endsWith('Z') ? '' : 'Z')));
  // ?eye=1 stands on the surface facing the Sun, or ?face=<azimuth> (e.g. towards Earth).
  if (q.get('eye') === '1') { scene.setEyeLevel(true, q.get('face') ? +q.get('face') : stateAt(app.active, app.active.horizon, app.date).sun.az); syncEye(); }
  // ?clean=1: just the Moon, no interface (for hero images and film captures).
  if (q.get('clean') === '1') { document.body.classList.add('clean'); scene.setInsetBottom(0); scene.setDecor(false); }
  if (q.get('dock') === 'year') setDockView('year');
  if (q.get('pin')) { app.pinned = new Date(q.get('pin') + (q.get('pin').endsWith('Z') ? '' : 'Z')); $('#pin-btn').textContent = 'Unpin'; renderDvd(); }
  if (q.get('explain') === 'evm') $('#evm-btn').click(); // direct links for demos and videos
  if (q.get('explain') === 'lib') $('#lib-btn').click();
  if (q.get('tour')) await story.goTo(+q.get('tour') - 1);
  else if (!q.toString()) showHintOnce();
  if (q.get('help') === '1') $('#help-btn').click(); // deep link straight to the help panel
  document.body.classList.add('ready');
  requestAnimationFrame(tick);
})();
