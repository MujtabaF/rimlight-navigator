// 3D surface view: real LOLA terrain patch (60 x 60 km), Sun-driven shadows, sky dome with
// Sun / Earth placed at their true azimuth & elevation, and their tracks over the analysis window.
// Units: kilometres. +X = east, -Z = north, +Y = up.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const DOME = 38;
const MOON_R_KM = 1737.4;
const SUN_EXAG = 6;
const EARTH_EXAG = 3;
const COLORS = { sun: 0xffb547, earth: 0x4fa3ff, terrain: 0x8f8b84 };

export function azElToVec(az, el, r = DOME) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(e) * Math.sin(a), r * Math.sin(e), -r * Math.cos(e) * Math.cos(a));
}

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 'scene-labels';
  container.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.002, 600);
  camera.position.set(26, 16, 34);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 3;
  controls.maxDistance = 120;

  // Lighting: the Sun is the only real light. A faint fill stands in for earthshine so the
  // shadowed terrain stays readable on a projector.
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 3.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  Object.assign(sunLight.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 200 });
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.04;
  scene.add(sunLight, sunLight.target);
  const fill = new THREE.HemisphereLight(0x8fa6c8, 0x1a1c20, 0.55);
  scene.add(fill);

  scene.add(makeStars());
  const compass = makeCompass();
  scene.add(compass);

  // Sun & Earth bodies
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: COLORS.sun, depthWrite: false, fog: false }));
  scene.add(sun);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32),
    new THREE.MeshStandardMaterial({ color: COLORS.earth, roughness: 0.6, emissive: 0x061a33, emissiveIntensity: 0.4, transparent: true }));
  scene.add(earth);
  const sunLabel = label('', 'body-label sun');
  const earthLabel = label('', 'body-label earth');
  scene.add(sunLabel, earthLabel);

  let terrain = null, siteMarker = null, skyline = null;
  const tracks = new THREE.Group();
  scene.add(tracks);

  function setSite(site, patch) {
    if (terrain) { scene.remove(terrain); terrain.geometry.dispose(); }
    if (siteMarker) {
      scene.remove(siteMarker);
      siteMarker.traverse((o) => o.element?.remove()); // CSS2D labels live in the DOM, not the scene
    }
    if (skyline) scene.remove(skyline);
    terrain = makeTerrain(site, patch);
    scene.add(terrain);
    siteMarker = makeMarker(site.name);
    scene.add(siteMarker);
    skyline = makeSkyline(site.horizon);
    scene.add(skyline);
  }

  function setTracks(analysis) {
    tracks.clear();
    if (!analysis) return;
    tracks.add(trackLine(analysis.series, 'sun', COLORS.sun), trackLine(analysis.series, 'earth', COLORS.earth));
  }

  function setState(state) {
    const { sun: s, earth: e } = state;
    const sp = azElToVec(s.az, s.el);
    sun.position.copy(sp);
    const sr = DOME * Math.tan((s.radiusDeg * SUN_EXAG * Math.PI) / 180) * 4;
    sun.scale.set(sr, sr, 1);
    sun.material.opacity = 0.35 + 0.65 * s.visible;
    sunLight.position.copy(azElToVec(s.az, s.el, 120));
    sunLight.intensity = 3.2 * s.visible;
    const ep = azElToVec(e.az, e.el, DOME * 0.98);
    earth.position.copy(ep);
    earth.scale.setScalar(DOME * Math.tan((e.radiusDeg * EARTH_EXAG * Math.PI) / 180));
    earth.material.opacity = e.visible;
    sunLabel.position.copy(sp).multiplyScalar(1.04);
    earthLabel.position.copy(ep).multiplyScalar(1.06);
    sunLabel.element.textContent = `Sun ${s.el.toFixed(1)}°`;
    earthLabel.element.textContent = `Earth ${e.el.toFixed(1)}°`;
    sunLabel.element.classList.toggle('hidden-body', s.visible < 0.5);
    earthLabel.element.classList.toggle('hidden-body', e.visible < 0.5);
  }

  let eye = false;
  const saved = { pos: camera.position.clone(), target: new THREE.Vector3() };
  function setEyeLevel(on, faceAz = 0) {
    eye = on;
    if (on) {
      saved.pos.copy(camera.position); saved.target.copy(controls.target);
      const h = 0.004 + (terrain?.userData.centerY ?? 0);
      const dir = azElToVec(faceAz, 0, 1);
      controls.target.set(dir.x * 0.01, h, dir.z * 0.01);
      camera.position.set(-dir.x * 0.001, h, -dir.z * 0.001);
      Object.assign(controls, { minDistance: 0.0005, maxDistance: 0.02, enablePan: false, enableZoom: false, maxPolarAngle: Math.PI * 0.75 });
      camera.fov = 70;
    } else {
      camera.position.copy(saved.pos); controls.target.copy(saved.target);
      Object.assign(controls, { minDistance: 3, maxDistance: 120, enablePan: true, enableZoom: true, maxPolarAngle: Math.PI * 0.495 });
      camera.fov = 50;
    }
    camera.updateProjectionMatrix();
    siteMarker.visible = !on;
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  });

  return { setSite, setState, setTracks, setEyeLevel, get eye() { return eye; } };
}

// ---------- builders ----------

function makeTerrain(site, patch) {
  const n = patch ? patch.n : 129;
  const size = patch ? (patch.halfSizeM * 2) / 1000 : 60;
  const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
  geo.rotateX(-Math.PI / 2); // row 0 -> north (-Z), col 0 -> west (-X)
  const pos = geo.attributes.position;
  const rand = mulberry(hash(site.id + site.lat + site.lon));
  const craters = patch ? [] : Array.from({ length: 140 }, () => ({
    x: (rand() - 0.5) * size, z: (rand() - 0.5) * size, r: 0.3 + rand() ** 4 * 7,
  })).filter((c) => Math.hypot(c.x, c.z) > c.r * 1.7); // keep the landing point itself level
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    let h = patch ? patch.heights[i] / 1000 : proceduralHeight(x, z, craters);
    h -= (x * x + z * z) / (2 * MOON_R_KM); // lunar curvature: ~0.26 km drop at the patch corner
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.terrain, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = mesh.receiveShadow = true;
  const mid = Math.floor(n / 2) * n + Math.floor(n / 2);
  mesh.userData.centerY = pos.getY(mid);
  return mesh;
}

// Illustrative terrain for sites outside the polar DEMs: rolling noise + simple crater profiles
// (bowl depth ~0.2 x radius, raised rim). Clearly labelled in the UI as not real topography.
function proceduralHeight(x, z, craters) {
  let h = 0;
  for (let o = 0, f = 0.08, a = 0.12; o < 5; o++, f *= 2.1, a *= 0.5) {
    h += a * Math.sin(x * f + o * 1.7) * Math.cos(z * f * 1.13 + o * 0.9);
  }
  for (const c of craters) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 1) h -= 0.2 * c.r * (1 - d * d) - 0.04 * c.r;
    else if (d < 1.6) h += 0.04 * c.r * (1 - (d - 1) / 0.6) ** 2;
  }
  return h;
}

function makeMarker(name) {
  const g = new THREE.Group();
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  pin.position.y = 0.8;
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  head.position.y = 1.7;
  const l = label(name, 'site-label');
  l.position.y = 2.3;
  g.add(pin, head, l);
  return g;
}

function makeSkyline(horizon) {
  const pts = [];
  for (let az = 0; az <= 360; az += 0.5) pts.push(azElToVec(az, horizon.elAt(az), DOME * 0.995));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
  return line;
}

function makeCompass() {
  const g = new THREE.Group();
  const ring = [];
  for (let az = 0; az <= 360; az += 2) ring.push(azElToVec(az, 0, DOME));
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),
    new THREE.LineBasicMaterial({ color: 0x5a5f66, transparent: true, opacity: 0.6 })));
  for (const [t, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
    const l = label(t, 'compass-label');
    l.position.copy(azElToVec(az, -1.5, DOME * 1.02));
    g.add(l);
  }
  return g;
}

function trackLine(series, key, color) {
  const pts = [], cols = [];
  const c = new THREE.Color(color);
  for (const p of series) {
    pts.push(azElToVec(p[key + 'Az'], p[key + 'El'], DOME * 0.99));
    const k = p[key + 'Vis'] > 0.5 ? 1 : 0.22;
    cols.push(c.r * k, c.g * k, c.b * k);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true }));
}

function makeStars() {
  const n = 2500, arr = new Float32Array(n * 3), rand = mulberry(7);
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1, t = rand() * Math.PI * 2, r = 300;
    const s = Math.sqrt(1 - u * u);
    arr.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function label(text, cls) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  return new CSS2DObject(el);
}

function hash(s) { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
