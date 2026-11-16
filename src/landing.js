// Landing page: fonts, styles, and three motions that each show something real:
//  1. the hero becomes the live simulator (Sun sliding along the ridge horizon),
//  2. the ridge's skyline animates 30 days of Sun and Earth (computed by our physics),
//  3. "89% and 0%" counts up when it scrolls into view.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz.css';
import './landing.css';

// ?shot=1: fixed-height hero and no smooth scrolling, for full-page screenshots.
const params = new URLSearchParams(location.search);
if (params.has('shot')) document.documentElement.classList.add('shot');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ?film=1: 15 seconds on the hero (the live Sun fades in), then the navigator's self-playing tour.
// ?film=30: the 30-second cut starts in the navigator straight away.
if (params.get('film') === '1') {
  document.documentElement.style.cursor = 'none';
  setTimeout(() => { location.href = 'app.html?film=1'; }, 15000);
} else if (params.get('film') === '30') location.replace('app.html?film=30');
const $ = (s) => document.querySelector(s);

// 1. Live hero: only on larger screens and without reduced motion (the still render stays otherwise).
const live = $('.hero-live');
if (!reduce && matchMedia('(min-width: 861px)').matches && !params.has('still')) {
  live.addEventListener('load', () => setTimeout(() => document.body.classList.add('hero-on'), 2200));
  live.src = 'app.html?clean=1&site=shackleton-ridge&t=2027-01-11T15:00&eye=1&play=1&speed=1.5&follow=1';
} else live.remove();

// 2. Skyline animation, loaded when the section is near.
const sky = $('#sky');
new IntersectionObserver(([e], obs) => {
  if (!e.isIntersecting) return;
  obs.disconnect();
  import('./landing-sky.js').then(({ startSky }) => startSky(sky, { lampSun: $('#lamp-sun'), lampEarth: $('#lamp-earth'), dateEl: $('#sky-date'), reduce }));
}, { rootMargin: '300px' }).observe(sky);

// 3. Count-up for the 89% / 0% fact.
const counts = document.querySelectorAll('.count');
new IntersectionObserver((entries, obs) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  obs.disconnect();
  counts.forEach((el) => {
    const to = +el.dataset.to, t0 = performance.now(), ms = 1400;
    if (reduce || to === 0) { el.textContent = to; return; }
    const step = (t) => { const f = Math.min(1, (t - t0) / ms), e = 1 - (1 - f) ** 3; el.textContent = Math.round(to * e); if (f < 1) requestAnimationFrame(step); };
    el.textContent = '0';
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 }).observe($('.fact-big'));
