// 3D surface view: real LOLA terrain patch (60 x 60 km), Sun-driven shadows, sky dome with
// Sun / Earth placed at their true azimuth & elevation, and their tracks over the analysis window.
// Units: kilometres. +X = east, -Z = north, +Y = up.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as Astronomy from 'astronomy-engine';

const DOME = 38;
const MOON_R_KM = 1737.4;
const SUN_EXAG = 6;
const EARTH_EXAG = 3;
const COLORS = { sun: 0xffb547, earth: 0x4fa3ff, terrain: 0x75716a };
const SUN_INTENSITY = 4.2;

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
  renderer.toneMappingExposure = 1.05;
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

  // Lighting, as on the real Moon: no air, so no sky light. The Sun is the main light and shadows
  // are near-black. Earthshine (sunlight bounced off Earth, bluish) comes from Earth's actual
  // direction and grows with Earth's phase. A faint floor keeps shadowed ground readable on video.
  const sunLight = new THREE.DirectionalLight(0xfff6ea, SUN_INTENSITY);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  Object.assign(sunLight.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 200 });
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.04;
  scene.add(sunLight, sunLight.target);
  const earthshine = new THREE.DirectionalLight(0xa9c4ff, 0);
  scene.add(earthshine, earthshine.target);
  // Faint scattered light. Stronger when you stand in shadow at eye level: there the ground is lit
  // by sunlight bouncing off sunlit crater walls (how NASA's ShadowCam images shadowed craters).
  const scattered = new THREE.AmbientLight(0x9aa3b2, 0.11);
  const bounce = new THREE.DirectionalLight(0xc2cad8, 0); // from the sunlit rim, no shadows
  scene.add(scattered, bounce, bounce.target);

  scene.add(makeStars());
  const compass = makeCompass();
  scene.add(compass);

  // Sun & Earth bodies
  // The Sun sprite is brighter than white (HDR) so only it triggers the bloom glow.
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), depthWrite: false, fog: false }));
  sun.material.color.setRGB(7, 5.6, 3.8);
  scene.add(sun);
  const earth = makeEarth();
  scene.add(earth);
  const sunLabel = label('', 'body-label sun');
  const earthLabel = label('', 'body-label earth');
  scene.add(sunLabel, earthLabel);

  let terrain = null, siteMarker = null, skyline = null, wall = null;
  let decor = true; // guide lines (compass, skyline, tracks, site pin); off for clean renders
  const tracks = new THREE.Group();
  scene.add(tracks);

  function setSite(site, patch) {
    if (terrain) { scene.remove(terrain); terrain.geometry.dispose(); }
    if (siteMarker) {
      scene.remove(siteMarker);
      siteMarker.traverse((o) => o.element?.remove()); // CSS2D labels live in the DOM, not the scene
    }
    if (skyline) scene.remove(skyline);
    if (wall) { scene.remove(wall); wall.geometry.dispose(); }
    if (!eye && terrain) startFly();
    terrain = makeTerrain(site, patch);
    scene.add(terrain);
    siteMarker = makeMarker(site.name);
    siteMarker.visible = !eye;
    scene.add(siteMarker);
    skyline = makeSkyline(site.horizon);
    skyline.visible = decor;
    siteMarker.visible = !eye && decor;
    scene.add(skyline);
    wall = makeHorizonWall(site.horizon);
    wall.visible = eye;
    scene.add(wall);
  }

  function setTracks(analysis) {
    tracks.clear();
    if (!analysis) return;
    tracks.add(trackLine(analysis.series, 'sun', COLORS.sun), trackLine(analysis.series, 'earth', COLORS.earth));
    tracks.visible = decor;
  }

  function setState(state, date) {
    const { sun: s, earth: e } = state;
    const sp = azElToVec(s.az, s.el);
    sun.position.copy(sp);
    const sr = DOME * Math.tan((s.radiusDeg * SUN_EXAG * Math.PI) / 180) * 4;
    sun.scale.set(sr, sr, 1);
    sun.material.opacity = 0.35 + 0.65 * s.visible;
    sunLight.position.copy(azElToVec(s.az, s.el, 120));
    // The Sun keeps lighting the landscape whenever it's above the flat horizon; terrain shadows
    // (and the horizon wall) decide what's dark. Hiding it from the landing spot alone would
    // also wrongly black out the sunlit crater walls and peaks around it.
    sunLight.intensity = SUN_INTENSITY * THREE.MathUtils.smoothstep(s.el, -1.5, 0.5);
    siteLit = s.visible;
    bounce.position.copy(azElToVec(s.az, 16, 120));
    const ep = azElToVec(e.az, e.el, DOME * 0.98);
    earth.position.copy(ep);
    earth.scale.setScalar(DOME * Math.tan((e.radiusDeg * EARTH_EXAG * Math.PI) / 180));
    // Earth's day side faces the real Sun direction, so its phase is correct automatically.
    const sunDir = azElToVec(s.az, s.el, 1).normalize();
    earth.material.uniforms.sunDir.value.copy(sunDir);
    earth.material.uniforms.opacity.value = 0.25 + 0.75 * e.visible;
    if (date) earth.rotation.y = earthSpin(date, ep);
    // Earthshine: brightest at "full Earth" (Sun and Earth on opposite sides of the sky).
    const earthDir = ep.clone().normalize();
    const fullness = (1 - sunDir.dot(earthDir)) / 2;
    earthshine.position.copy(earthDir).multiplyScalar(120);
    earthshine.intensity = 0.55 * fullness * e.visible;
    sunLabel.position.copy(sp).multiplyScalar(1.04);
    earthLabel.position.copy(ep).multiplyScalar(1.06);
    sunLabel.element.textContent = `Sun ${s.el.toFixed(1)}°`;
    earthLabel.element.textContent = `Earth ${e.el.toFixed(1)}°`;
    sunLabel.element.classList.toggle('hidden-body', s.visible < 0.5);
    earthLabel.element.classList.toggle('hidden-body', e.visible < 0.5);
  }

  let eye = false;
  const saved = { pos: camera.position.clone(), target: new THREE.Vector3() };
  controls.addEventListener('start', () => { if (fly) { camera.position.copy(fly.end); fly = null; } });
  function setEyeLevel(on, faceAz = 0) {
    if (fly) { camera.position.copy(fly.end); fly = null; }
    eye = on;
    if (on) {
      saved.pos.copy(camera.position); saved.target.copy(controls.target);
      const h = 0.004 + (terrain?.userData.centerY ?? 0);
      const dir = azElToVec(faceAz, 0, 1);
      controls.target.set(dir.x * 0.01, h, dir.z * 0.01);
      camera.position.set(-dir.x * 0.001, h, -dir.z * 0.001);
      Object.assign(controls, { minDistance: 0.0005, maxDistance: 0.02, enablePan: false, enableZoom: false, maxPolarAngle: Math.PI * 0.75 });
      camera.fov = 70;
      if (wall) wall.visible = true;
    } else {
      camera.position.copy(saved.pos); controls.target.copy(saved.target);
      Object.assign(controls, { minDistance: 3, maxDistance: 120, enablePan: true, enableZoom: true, maxPolarAngle: Math.PI * 0.495 });
      camera.fov = 50;
      if (wall) wall.visible = false;
    }
    camera.updateProjectionMatrix();
    siteMarker.visible = !on && decor;
  }
  // Turn the eye-level view to face an azimuth (used to follow the Sun in the landing-page hero).
  function faceAz(az) {
    if (!eye) return;
    const dir = azElToVec(az, 0, 1);
    controls.target.set(camera.position.x + dir.x * 0.01, camera.position.y, camera.position.z + dir.z * 0.01);
  }
  function setDecor(on) {
    decor = on;
    compass.visible = tracks.visible = on;
    if (skyline) skyline.visible = on;
    if (siteMarker) siteMarker.visible = on && !eye;
  }

  // The interface floats over the bottom of the view. Shift the picture up by half that
  // height so the scene is centred in the part you can actually see.
  // Post-processing: multisampled HDR render, a gentle bloom that only the Sun is bright enough
  // to trigger, then tone mapping in OutputPass.
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.6, 1.8);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let insetBottom = 0;
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    if (insetBottom > 0 && insetBottom < h) camera.setViewOffset(w, h, 0, insetBottom / 2, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function setInsetBottom(px) { if (px !== insetBottom) { insetBottom = px; resize(); } }
  new ResizeObserver(resize).observe(container);
  resize();

  // Auto-exposure, like a real camera: standing in shadow at eye level, open up so the dark
  // surroundings (lit only by faint scattered light) stay visible. Eased so it never pops.
  let siteLit = 1;
  const BASE_EXPOSURE = renderer.toneMappingExposure;
  // Arrival move when the site changes: the camera sweeps in from further out and the view fades up.
  let fly = null;
  function startFly() {
    const end = fly ? fly.end.clone() : camera.position.clone(); // switching again mid-flight keeps the same resting view
    const dir = end.clone().sub(controls.target);
    const start = controls.target.clone().add(dir.multiplyScalar(1.9)).add(new THREE.Vector3(0, 10, 0));
    fly = { t0: performance.now(), start, end };
    camera.position.copy(start);
    renderer.domElement.style.transition = 'none';
    renderer.domElement.style.opacity = '0.15';
    requestAnimationFrame(() => { renderer.domElement.style.transition = 'opacity 0.9s ease'; renderer.domElement.style.opacity = '1'; });
  }
  renderer.setAnimationLoop(() => {
    const dark = eye && siteLit < 0.5;
    const target = dark ? BASE_EXPOSURE * 3.2 : BASE_EXPOSURE;
    renderer.toneMappingExposure += (target - renderer.toneMappingExposure) * 0.12;
    scattered.intensity += ((dark ? 0.22 : 0.11) - scattered.intensity) * 0.12;
    bounce.intensity += ((dark ? 1.5 : 0) - bounce.intensity) * 0.12;
    if (fly) {
      const f = Math.min(1, (performance.now() - fly.t0) / 1600), e = 1 - (1 - f) ** 3;
      camera.position.lerpVectors(fly.start, fly.end, e);
      if (f >= 1) fly = null;
    }
    controls.update();
    composer.render();
    labels.render(scene, camera);
  });

  return { setSite, setState, setTracks, setEyeLevel, setInsetBottom, setDecor, faceAz, get eye() { return eye; } };
}

// ---------- builders ----------

function makeTerrain(site, patch) {
  const n = patch ? patch.n : 257;
  const size = patch ? (patch.halfSizeM * 2) / 1000 : 60;
  const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
  geo.rotateX(-Math.PI / 2); // row 0 -> north (-Z), col 0 -> west (-X)
  const pos = geo.attributes.position;
  // Precomputed patches use a non-uniform grid, dense at the landing spot (scripts/build_horizons.py).
  const warp = patch?.warp;
  if (warp) {
    const half = size / 2, w = (u) => half * (warp * u + (1 - warp) * u ** 3);
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, w(-1 + (2 * (i % n)) / (n - 1)));
      pos.setZ(i, w(-1 + (2 * Math.floor(i / n)) / (n - 1)));
    }
  }
  // Texture coordinates in kilometres, so surface detail has a true size wherever the grid is dense.
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), -pos.getZ(i));
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
  const { albedo, bump } = regolithTextures();
  const mat = new THREE.MeshStandardMaterial({ color: COLORS.terrain, roughness: 1, metalness: 0, map: albedo, bumpMap: bump, bumpScale: 0.9 });
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
  for (let az = 0; az <= 360; az += 0.5) pts.push(azElToVec(az, horizon.elAt(az), DOME * 0.96));
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

// Distant mountains for the surface view: a wall whose top follows the real horizon mask, just
// inside the sky dome. The Sun and Earth sit behind it, so they're clipped exactly where the
// numbers say they are. Lit by the Sun like terrain; never casts shadows.
function makeHorizonWall(horizon) {
  const pos = [], idx = [], R = DOME * 0.965;
  for (let k = 0; k <= 720; k++) {
    const az = k * 0.5;
    const top = azElToVec(az, horizon.elAt(az), R), bottom = azElToVec(az, -12, R);
    pos.push(bottom.x, bottom.y, bottom.z, top.x, top.y, top.z);
    if (k < 720) { const a = 2 * k; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5f5b55, roughness: 1, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = false;
  return mesh;
}

// Earth from NASA's SVS Blue Marble map (with clouds). Custom shader: day side lit by the true
// Sun direction (so the phase is right), dark night side, thin blue atmosphere at the rim.
function makeEarth() {
  const tex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}textures/earth-nasa-svs-2k.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, sunDir: { value: new THREE.Vector3(1, 0, 0) }, opacity: { value: 1 } },
    transparent: true,
    vertexShader: `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv; varying vec3 vN; varying vec3 vView;
      void main() {
        vUv = uv;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform sampler2D map; uniform vec3 sunDir; uniform float opacity;
      varying vec2 vUv; varying vec3 vN; varying vec3 vView;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 n = normalize(vN);
        float day = smoothstep(-0.06, 0.18, dot(n, sunDir));
        vec3 c = texture2D(map, vUv).rgb * day * 1.5;
        float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 2.5);
        c += vec3(0.3, 0.55, 1.0) * rim * (0.08 + 0.9 * day);
        gl_FragColor = vec4(c, opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
}

// Turn Earth so the hemisphere that really faces the Moon at this moment faces the viewer:
// the sub-lunar longitude is the Moon's right ascension minus Greenwich sidereal time.
// (Earth's axis is drawn upright; tilt is not modelled.)
function earthSpin(date, earthPos) {
  const t = Astronomy.MakeTime(date);
  const ra = Astronomy.EquatorFromVector(Astronomy.GeoMoon(t)).ra;
  const subLon = (ra - Astronomy.SiderealTime(t)) * 15;
  const phi = ((subLon + 180) * Math.PI) / 180; // SphereGeometry: u = phi / 2pi, u = 0 at lon -180
  const facing = Math.atan2(-earthPos.x, -earthPos.z);
  return facing - Math.atan2(-Math.cos(phi), Math.sin(phi));
}

// Procedural regolith (generated once): a gentle albedo mottle tiled every 3 km, and a fine
// bump map of dust ripples and small craters tiled every ~40 m. Both respond to the moving Sun.
let regolith = null;
function regolithTextures() {
  if (regolith) return regolith;
  const make = (n, fn) => {
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), im = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = Math.max(0, Math.min(255, fn(x, y)));
      const i = (y * n + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  const rand = mulberry(42);
  const lattice = (L) => { const a = new Float32Array(L * L); for (let i = 0; i < a.length; i++) a[i] = rand(); return a; };
  const tileNoise = (n, octaves) => { // tileable value noise, fBm
    const layers = octaves.map((L) => ({ L, a: lattice(L) }));
    return (x, y) => {
      let v = 0, amp = 0.5, sum = 0;
      for (const { L, a } of layers) {
        const fx = (x / n) * L, fy = (y / n) * L, x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const at = (i, j) => a[((j % L + L) % L) * L + ((i % L + L) % L)];
        v += amp * ((at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy);
        sum += amp; amp *= 0.5;
      }
      return v / sum;
    };
  };
  const mottle = tileNoise(256, [4, 8, 16, 32]);
  const albedo = make(256, (x, y) => 200 + (mottle(x, y) - 0.5) * 60);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.repeat.set(1 / 3, 1 / 3);

  const N = 512, ripple = tileNoise(N, [8, 16, 32, 64, 128]);
  const craters = Array.from({ length: 320 }, () => ({ x: rand() * N, y: rand() * N, r: 1.5 + rand() ** 4 * 16 }));
  const bump = make(N, (x, y) => {
    let h = ripple(x, y) * 1.1;
    for (const c of craters) {
      let dx = Math.abs(x - c.x), dy = Math.abs(y - c.y);
      dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy); // wrap so the tile repeats seamlessly
      const d = Math.hypot(dx, dy) / c.r;
      if (d < 1) h -= 0.32 * (1 - d * d); else if (d < 1.4) h += 0.08 * (1 - (d - 1) / 0.4) ** 2;
    }
    return 128 + h * 90;
  });
  bump.repeat.set(24, 24);
  regolith = { albedo, bump };
  return regolith;
}

function label(text, cls) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  return new CSS2DObject(el);
}

function hash(s) { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
