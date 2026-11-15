// Landing page: fonts and styles only (no 3D here, so it loads instantly).
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz.css';
import './landing.css';

// ?shot=1: fixed-height hero and no smooth scrolling, for full-page screenshots.
if (new URLSearchParams(location.search).has('shot')) document.documentElement.classList.add('shot');
