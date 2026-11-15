// Presenter mode: a guided sequence of scenes you click through while talking.
// Each chapter sets the site, comparison set, time, camera and playback, then gets out of the way.
// Arrow keys (or the buttons) move between chapters.

export const chapters = [
  {
    title: 'On the Moon, a day lasts a month',
    text: 'Apollo 11, at the equator. The Sun takes two weeks to cross the sky, and Earth never leaves it.',
    site: 'apollo11', compare: [], at: (app) => app.peakSun('apollo11'), eye: false, speed: 6, play: true,
  },
  {
    title: 'Head south and the Sun stays low',
    text: 'Chandrayaan-3, at 69°S. One lunar day of power, then the two-week night. It never woke up.',
    site: 'chandrayaan3', compare: [], at: (app) => app.peakSun('chandrayaan3'), eye: false, speed: 12, play: true,
  },
  {
    title: 'Some craters never see the Sun',
    text: "Shackleton's floor: the wall stands 20° high, the Sun never tops 2°. 0% sunlight, cold enough to keep water ice.",
    site: 'shackleton-floor', compare: [], at: (app) => app.peakSun('shackleton-ridge'), eye: true, faceAway: true, speed: 24, play: true,
  },
  {
    title: '…and a few ridges almost never go dark',
    text: '20 km away on the ridge, the Sun circles the horizon: 89% sunlight all year.',
    site: 'shackleton-ridge', compare: ['shackleton-floor'], at: (app) => app.peakSun('shackleton-ridge'), eye: true, speed: 24, play: true,
  },
  {
    title: 'Earth decides when you can talk',
    text: 'Earth bobs along the horizon. Malapert sees it 80% of the time, the ridge about half. Power or comms: pick one.',
    site: 'malapert', compare: ['shackleton-ridge'], at: (app) => app.windowStart(), eye: false, speed: 24, play: true,
  },
  {
    title: 'The launch just slipped',
    text: 'IM-2 lands at sunrise. Press Shift + → to slip it a day at a time: every day late is a day of mission lost.',
    site: 'im2', compare: [], at: (app) => app.nextSunrise('im2', 3), eye: false, speed: 0, play: false,
  },
  {
    title: 'The far side has no line to Earth',
    text: "Chang'e 4 and 6, on the far side. Earth never rises, so every message needs a relay satellite.",
    site: 'change4', compare: ['change6', 'apollo11'], at: (app) => app.peakSun('change4'), eye: false, speed: 12, play: true,
  },
  {
    title: 'Compare candidates in seconds',
    text: 'Four candidates, one month, side by side: gold is power, blue is contact with Earth. Change the date and it all recalculates.',
    site: 'shackleton-ridge', compare: ['malapert', 'im2', 'im1'], at: (app) => app.windowStart(), eye: false, speed: 24, play: false,
  },
  {
    title: 'Rimlight found a better spot',
    text: 'We searched the whole pole with NASA maps. Pick 1 has power and Earth at once 60% of the year, more than any official candidate. Best landing: Sep 8, 2027.',
    site: 'pick-earthrise', compare: ['shackleton-ridge', 'malapert'], at: () => new Date('2027-09-08T13:00:00Z'), eye: false, speed: 12, play: true,
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
