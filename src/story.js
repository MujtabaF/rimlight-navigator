// Presenter mode: a guided sequence of scenes you click through while talking.
// Each chapter sets the site, comparison set, time, camera and playback, then gets out of the way.
// Arrow keys (or the buttons) move between chapters.

export const chapters = [
  {
    title: 'On the Moon, a day lasts a month',
    text: 'Apollo 11, near the equator. The Sun climbs almost straight overhead and takes about two weeks to cross the sky. Earth barely moves, so the crew could always talk to Houston.',
    site: 'apollo11', compare: [], at: (app) => app.peakSun('apollo11'), eye: false, speed: 6, play: true,
  },
  {
    title: 'Head south and the Sun stays low',
    text: 'Chandrayaan-3 landed at 69°S. Its Sun never climbed above about 22°. It got one lunar day of power, then the two-week night came and it never woke up.',
    site: 'chandrayaan3', compare: [], at: (app) => app.peakSun('chandrayaan3'), eye: false, speed: 12, play: true,
  },
  {
    title: 'Some craters never see the Sun',
    text: 'Shackleton crater floor, 2.8 km below the rim. The Sun never gets more than about 2° above the horizon here, and the crater wall stands 20° high. That means 0% sunlight all year, which keeps it cold enough to trap water ice.',
    site: 'shackleton-floor', compare: [], at: (app) => app.peakSun('shackleton-ridge'), eye: true, speed: 24, play: true,
  },
  {
    title: '…and a few ridges almost never go dark',
    text: 'About 20 km away, on the ridge that connects Shackleton and de Gerlache, the Sun circles the whole horizon. This spot is sunlit about 89% of 2027, by far the best power on the Moon.',
    site: 'shackleton-ridge', compare: ['shackleton-floor'], at: (app) => app.peakSun('shackleton-ridge'), eye: true, speed: 24, play: true,
  },
  {
    title: 'Earth decides when you can talk',
    text: 'At the pole, Earth bobs up and down along the horizon. The 5 km-high Malapert Massif can see Earth about 80% of the time. The Shackleton ridge manages about half. One site gives you power, the other gives you comms.',
    site: 'malapert', compare: ['shackleton-ridge'], at: (app) => app.windowStart(), eye: false, speed: 24, play: true,
  },
  {
    title: 'The launch just slipped',
    text: 'Plans change. Here is IM-2 at Mons Mouton, landing right after sunrise. Press Shift + → to slip the landing a day at a time and watch the countdown to sunset shrink. Every day of delay is a day of mission you lose.',
    site: 'im2', compare: [], at: (app) => app.nextSunrise('im2', 3), eye: false, speed: 0, play: false,
  },
  {
    title: 'The far side has no line to Earth',
    text: "Chang'e 4 and 6 landed on the far side. The Sun rises and sets normally, but Earth never comes up, so every byte has to go through a relay satellite.",
    site: 'change4', compare: ['change6', 'apollo11'], at: (app) => app.peakSun('change4'), eye: false, speed: 12, play: true,
  },
  {
    title: 'Compare candidates in seconds',
    text: 'Four candidate sites, one month, shown side by side. The gold bars are hours of power and the blue bars are hours of direct contact with Earth. Change the date and every bar recalculates from NASA terrain data.',
    site: 'shackleton-ridge', compare: ['malapert', 'im2', 'im1'], at: (app) => app.windowStart(), eye: false, speed: 24, play: false,
  },
];

export function createStory(app, el) {
  let i = -1;
  const title = el.querySelector('.story-title');
  const text = el.querySelector('.story-text');
  const count = el.querySelector('.story-count');

  async function go(k) {
    i = Math.max(0, Math.min(chapters.length - 1, k));
    const c = chapters[i];
    el.hidden = false;
    title.textContent = c.title;
    text.textContent = c.text;
    count.textContent = `${i + 1} of ${chapters.length}`;
    await app.applyChapter(c);
  }

  el.querySelector('.story-next').addEventListener('click', () => go(i + 1));
  el.querySelector('.story-prev').addEventListener('click', () => go(i - 1));
  el.querySelector('.story-close').addEventListener('click', () => stop());

  function stop() { el.hidden = true; i = -1; app.storyStopped?.(); }

  return {
    start: () => go(0),
    goTo: (k) => go(k),
    stop,
    next: () => go(i + 1),
    prev: () => go(i - 1),
    get active() { return i >= 0; },
  };
}
