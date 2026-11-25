// The 3D LixTeam mark in the home page hero.
//
// A lime glass tile with the L and T cut in obsidian, lit by a studio
// environment, a lime key light and a cool rim light, floating inside two thin
// rings and a few specks of dust. It turns slowly and leans toward the pointer.
//
// Loaded only when the hero is on screen (see index.astro). It pauses when the
// tab is hidden or the hero scrolls away, renders a single still frame when the
// visitor prefers reduced motion, and quietly does nothing if WebGL is missing,
// in which case the flat logo behind it stays visible.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const LIME = 0xa3e635;

function roundedRect(w, h, r) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function solid(shape, depth, bevel) {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 24,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

// A rounded bar between two points that share an x or a y (the logo is made of
// horizontal and vertical strokes only). Points are in the logo's 32 unit grid.
function stroke(x1, y1, x2, y2, width, k) {
  const horizontal = y1 === y2;
  const len = Math.abs(horizontal ? x2 - x1 : y2 - y1);
  const w = width * k;
  const l = (len + width) * k;
  const shape = horizontal ? roundedRect(l, w, w / 2) : roundedRect(w, l, w / 2);
  const cx = (((x1 + x2) / 2 - 16) * k);
  const cy = ((16 - (y1 + y2) / 2) * k);
  return { shape, cx, cy };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(163,230,53,0.55)');
  grad.addColorStop(0.35, 'rgba(163,230,53,0.16)');
  grad.addColorStop(1, 'rgba(163,230,53,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function initHero3D(host) {
  const canvas = host.querySelector('canvas');
  if (!canvas) return;

  const reduce = document.documentElement.classList.contains('rm');

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // no WebGL: the flat logo stays
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 11.2);

  // ── The mark ──
  const mark = new Group();
  scene.add(mark);

  const k = 2.9 / 32; // logo grid unit -> world units
  const depth = 0.46;

  const tileMat = new MeshPhysicalMaterial({
    color: new Color(LIME),
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    envMapIntensity: 1.15,
  });
  const tile = new Mesh(solid(roundedRect(2.9 - 0.2, 2.9 - 0.2, 0.74), depth, 0.1), tileMat);
  mark.add(tile);

  const glyphMat = new MeshPhysicalMaterial({
    color: new Color(0x0a0b0c),
    metalness: 0.55,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.3,
  });
  const strokes = [
    stroke(9.5, 8.5, 9.5, 23.5, 3.2, k), // L, vertical
    stroke(9.5, 23.5, 16.5, 23.5, 3.2, k), // L, foot
    stroke(15.5, 8.5, 23.5, 8.5, 3.2, k), // T, bar
    stroke(19.5, 8.5, 19.5, 23.5, 3.2, k), // T, stem
  ];
  strokes.forEach((s, i) => {
    const m = new Mesh(solid(s.shape, 0.16 + i * 0.002, 0.035), glyphMat);
    m.position.set(s.cx, s.cy, depth / 2 + 0.1 + 0.035 + i * 0.001);
    mark.add(m);
  });

  mark.rotation.set(0.12, -0.38, 0);

  // ── Rings and dust ──
  const ringA = new Mesh(new TorusGeometry(2.6, 0.007, 8, 220), new MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.55 }));
  const ringB = new Mesh(new TorusGeometry(3.0, 0.006, 8, 220), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
  ringA.rotation.set(1.18, 0.2, 0);
  ringB.rotation.set(0.62, -0.4, 0.5);
  scene.add(ringA, ringB);

  const count = 90;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.6 + Math.random() * 2.6;
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(b) * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(b) - 0.5;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const dust = new Points(dustGeo, new PointsMaterial({ color: 0xe9ffc2, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);

  const glow = new Sprite(new SpriteMaterial({ map: glowTexture(), transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }));
  glow.scale.set(6.4, 6.4, 1);
  glow.position.z = -1.6;
  scene.add(glow);

  // ── Lights ──
  const key = new DirectionalLight(0xffffff, 2.1);
  key.position.set(3.5, 4.5, 6);
  scene.add(key);
  const limeLight = new PointLight(LIME, 38, 14, 2);
  limeLight.position.set(-3.6, -2.6, 3.2);
  scene.add(limeLight);
  const rim = new PointLight(0xe6edff, 20, 14, 2);
  rim.position.set(4.2, 1.6, -1.4);
  scene.add(rim);

  // ── Size ──
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole mark in view on tall, narrow hosts too.
    camera.position.z = camera.aspect < 0.9 ? 11.2 / Math.max(camera.aspect, 0.62) * 0.92 : 11.2;
    camera.updateProjectionMatrix();
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);

  // ── Pointer ──
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // ── Loop ──
  let raf = 0;
  let visible = true;
  let last = performance.now();
  let t = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    cur.x += (target.x - cur.x) * Math.min(dt * 3, 1);
    cur.y += (target.y - cur.y) * Math.min(dt * 3, 1);

    // Scrolling away from the hero turns the mark and shrinks it a little.
    const s = Math.min(window.scrollY / window.innerHeight, 1.2);
    mark.rotation.y = -0.38 + Math.sin(t * 0.45) * 0.28 + cur.x * 0.5 + s * 1.7;
    mark.rotation.x = 0.12 + Math.sin(t * 0.33) * 0.07 - cur.y * 0.32 + s * 0.25;
    mark.position.y = Math.sin(t * 0.8) * 0.1;
    mark.scale.setScalar(1 - s * 0.14);
    ringA.rotation.z += dt * 0.12;
    ringB.rotation.z -= dt * 0.07;
    dust.rotation.y += dt * 0.03;

    renderer.render(scene, camera);
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  }

  function play() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  // The first frame is drawn right away so the fade-in has something to show.
  renderer.render(scene, camera);
  host.classList.add('ready');

  if (reduce) return; // one still frame is enough

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) play();
    }).observe(host);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) play(); });
  play();
}
