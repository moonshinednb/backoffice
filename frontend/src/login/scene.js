/* Moonshine login scene: chrome logo on lunar regolith in front of a dark
   planet with a red rim. Real SVG extrusion, PBR metal, everything local.

   Design constraints (see REVIEW history):
   - No continuous loop. Frames are drawn for the intro push-in and while the
     pointer parallax eases; the rest of the time nothing renders.
   - One post pass only: a depth-of-field gather that keeps the logo and
     foreground sharp and softens everything behind it. It runs only when a
     frame is drawn, and doubles as the tone-mapping/output step.
   - dispose() must force context loss. Browsers cap live WebGL contexts at
     roughly 8-16 and silently drop the oldest.
   - The page never waits on this scene: the stage shows a CSS approximation
     of the same composition until the first frame lands.
*/
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { logoShapes, extrudeLogo } from './geometry.js';

let cleanup = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Integer hash noise: tileable, deterministic, no Math.sin in hot loops.
function hash(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function valueNoise(x, y, period = 0, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let u = x - ix, v = y - iy;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  const wrap = n => period ? ((n % period) + period) % period : n;
  const x0 = wrap(ix), x1 = wrap(ix + 1), y0 = wrap(iy), y1 = wrap(iy + 1);
  return (hash(x0, y0, seed) * (1 - u) + hash(x1, y0, seed) * u) * (1 - v) + (hash(x0, y1, seed) * (1 - u) + hash(x1, y1, seed) * u) * v;
}

/* Regolith detail: fine grain with clumps, pits and the odd bright speck.
   Used as both colour and bump map, tiled across the ground. */
function regolith(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const data = image.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const clump = valueNoise(x / 32, y / 32, size / 32, 1);
      const grain = valueNoise(x / 6, y / 6, size / 6, 2);
      const white = hash(x, y, 3);
      let v = clump * 0.42 + grain * 0.33 + white * 0.25;
      if (white > 0.992) v += 0.35;
      else if (white < 0.03) v -= 0.25;
      const g = Math.max(0, Math.min(255, 28 + v * 92));
      const o = (y * size + x) * 4;
      data[o] = g; data[o + 1] = g; data[o + 2] = g + 1; data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const planetVertex = /* glsl */`
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vHeight;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vHeight = world.y;
    vec4 view = viewMatrix * world;
    vViewDir = normalize(-view.xyz);
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * view;
  }`;

const noiseChunk = /* glsl */`
  float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise3(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise3(p); p *= 2.03; a *= 0.5; } return s; }`;

const planetFragment = /* glsl */`
  uniform vec3 uKey;
  uniform vec2 uRimSide;
  uniform vec3 uRimColor;
  uniform float uHorizon;
  uniform float uFade;
  uniform float uRim;
  uniform vec3 uHaze;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vHeight;
  ${noiseChunk}
  void main() {
    vec3 n = normalize(vNormalView);
    float ndv = clamp(dot(n, normalize(vViewDir)), 0.0, 1.0);
    vec3 p = normalize(vLocal);
    float maria = fbm(p * 2.2);
    float dust = fbm(p * 14.0);
    float tone = maria * 0.7 + dust * 0.3;
    vec3 albedo = mix(vec3(0.016), vec3(0.042), smoothstep(0.3, 0.75, tone));
    float key = max(dot(n, uKey), 0.0);
    vec3 color = albedo * (0.35 + 1.3 * key);
    // Back light from upper right: wide atmospheric wash plus a thin limb.
    float side = smoothstep(0.2, 1.0, dot(normalize(n.xy + 1e-4), uRimSide));
    float limb = 1.0 - ndv;
    color += uRimColor * (pow(limb, 4.0) * 0.6 + pow(limb, 22.0) * 4.5) * side * uRim;
    color = mix(uHaze, color, smoothstep(uHorizon, uHorizon + uFade, vHeight));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const haloFragment = /* glsl */`
  uniform vec2 uRimSide;
  uniform vec3 uRimColor;
  uniform float uInner;
  uniform float uHorizon;
  uniform float uFade;
  uniform float uRim;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vHeight;
  void main() {
    vec3 n = normalize(vNormalView);
    float t = clamp(-dot(n, normalize(vViewDir)) / uInner, 0.0, 1.0);
    float side = smoothstep(0.05, 1.0, dot(normalize(n.xy + 1e-4), uRimSide));
    float glow = (pow(t, 3.0) * 0.22 + pow(t, 8.0) * 0.9) * side * uRim;
    glow *= smoothstep(uHorizon, uHorizon + uFade, vHeight);
    gl_FragColor = vec4(uRimColor * glow * 0.6, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

async function start(canvas) {
  const stage = canvas.closest('.brand-stage') || canvas.parentElement;
  const narrow = () => innerWidth < 760;
  const light = narrow() || (navigator.hardwareConcurrency || 8) <= 4;

  let alive = true, renderer, observer, frame = 0, envTarget, pmrem;
  const resources = new Set();
  const keep = (r) => (resources.add(r), r);
  let mx = 0, my = 0, px = 0, py = 0, width = 0, height = 0, ready = false;
  let introStart = 0;
  const INTRO = reduced.matches ? 0 : 3400;
  let render = () => {};

  function dispose() {
    alive = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    removeEventListener('pointermove', move);
    document.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', visibility);
    for (const r of resources) r.dispose?.();
    envTarget?.dispose();
    pmrem?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    renderer = null;
  }
  cleanup = dispose;

  function request() {
    if (alive && ready && !frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  function move(e) {
    if (reduced.matches) return;
    mx = e.clientX / innerWidth - 0.5;
    my = 0.5 - e.clientY / innerHeight;
    request();
  }
  function leave() { mx = my = 0; request(); }
  function visibility() { if (!document.hidden) request(); }

  try {
    const pixelRatio = Math.min(devicePixelRatio || 1, light ? 1.5 : 2);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor('#040405');

    const scene = new THREE.Scene();
    // Faint haze behind the planet so the sky is not a flat black card.
    const sky = document.createElement('canvas');
    sky.width = sky.height = 256;
    const skyCtx = sky.getContext('2d');
    const skyGradient = skyCtx.createRadialGradient(100, 70, 0, 110, 90, 230);
    skyGradient.addColorStop(0, '#18181b'); skyGradient.addColorStop(0.6, '#0b0b0d'); skyGradient.addColorStop(1, '#060607');
    skyCtx.fillStyle = skyGradient; skyCtx.fillRect(0, 0, 256, 256);
    const skyMap = keep(new THREE.CanvasTexture(sky));
    skyMap.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyMap;
    scene.fog = new THREE.FogExp2('#0a0a0c', 0.062);

    /* Studio environment for the metal: black room, a soft white key top
       left, a dim graded wall behind the camera for the front faces and red
       strips back right that paint the logo's right-hand edges. */
    const environment = new THREE.Scene();
    environment.background = new THREE.Color('#020203');
    const softCanvas = document.createElement('canvas');
    softCanvas.width = softCanvas.height = 128;
    const softCtx = softCanvas.getContext('2d');
    const soft = softCtx.createRadialGradient(64, 64, 6, 64, 64, 64);
    soft.addColorStop(0, '#fff'); soft.addColorStop(0.55, '#bbb'); soft.addColorStop(1, '#000');
    softCtx.fillStyle = soft; softCtx.fillRect(0, 0, 128, 128);
    const softMap = keep(new THREE.CanvasTexture(softCanvas));
    softMap.colorSpace = THREE.SRGBColorSpace;
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 4; wallCanvas.height = 256;
    const wallCtx = wallCanvas.getContext('2d');
    const wall = wallCtx.createLinearGradient(0, 0, 0, 256);
    wall.addColorStop(0, '#f2f2f2'); wall.addColorStop(0.3, '#bcbcbc'); wall.addColorStop(0.46, '#7a7a7a'); wall.addColorStop(0.53, '#4a4a4a'); wall.addColorStop(0.64, '#545454'); wall.addColorStop(0.84, '#5a5a5a'); wall.addColorStop(1, '#141414');
    wallCtx.fillStyle = wall; wallCtx.fillRect(0, 0, 4, 256);
    const wallMap = keep(new THREE.CanvasTexture(wallCanvas));
    wallMap.colorSpace = THREE.SRGBColorSpace;
    function panel(w, h, pos, intensity, color = '#ffffff', map = softMap) {
      const material = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), map, side: THREE.DoubleSide }));
      const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), material);
      mesh.position.set(...pos);
      mesh.lookAt(0, 0, 0);
      environment.add(mesh);
    }
    panel(7, 3.5, [-5, 7, 3], 14);
    panel(2.2, 7, [-7, 2.5, 2], 2.4);
    // PMREM samples from the origin, so this wall sits at eye level there: the
    // flat front caps reflect its top-bright to bottom-dark sweep.
    panel(26, 14, [0, 0.3, 10], 2.5, '#ffffff', wallMap);
    panel(12, 2.2, [0, 8, 3.5], 18);
    panel(1.8, 7, [-8.5, 1.5, 4], 12);
    panel(10, 8, [-10, 0, -2], 0.5, '#ffffff', wallMap);
    panel(10, 1.2, [0, 6, -6], 7);
    panel(1.2, 6, [-3, 1, 10], 6);
    panel(3, 8, [7.5, 1.5, -2], 13, '#ff1630');
    panel(5, 4, [5, 4, -7], 4, '#d3112b');
    panel(30, 30, [0, -3, 0], 0.12, '#ffffff', wallMap);
    pmrem = new THREE.PMREMGenerator(renderer);
    envTarget = pmrem.fromScene(environment, 0.04);

    // Logo first: everything else is framed around its real size.
    const response = await fetch('/assets/moonshine-logo.svg');
    if (!response.ok) throw new Error('Logo unavailable');
    const svg = await response.text();
    if (!alive) return;

    const face = keep(new THREE.MeshPhysicalMaterial({ color: '#e2e4e8', metalness: 1, roughness: 0.22, envMap: envTarget.texture, envMapIntensity: 1.2, clearcoat: 0.35, clearcoatRoughness: 0.22 }));
    const bevel = keep(new THREE.MeshPhysicalMaterial({ color: '#b4b7bd', metalness: 1, roughness: 0.14, envMap: envTarget.texture, envMapIntensity: 1.25, clearcoat: 0.25, clearcoatRoughness: 0.18 }));
    const logo = new THREE.Group();
    for (const shape of logoShapes(new SVGLoader().parse(svg).paths)) {
      const mesh = new THREE.Mesh(keep(extrudeLogo(shape)), [face, bevel]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      logo.add(mesh);
    }
    const box = new THREE.Box3().setFromObject(logo);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    /* The flat front caps would each reflect a single colour. Tilting their
       normals with position makes the whole face read as gently convex
       chrome: the top picks up the bright sky, the middle the dark horizon,
       the bottom the ground. Linear in position, so it interpolates exactly
       across the outline-only cap triangles. */
    for (const mesh of logo.children) {
      const position = mesh.geometry.attributes.position;
      const normal = mesh.geometry.attributes.normal;
      for (let i = 0; i < position.count; i++) {
        if (normal.getZ(i) < 0.99) continue;
        const nx = (position.getX(i) - center.x) / size.x * 0.5;
        const ny = (position.getY(i) - center.y) / size.y * 0.9;
        const length = Math.hypot(nx, ny, 1);
        normal.setXYZ(i, nx / length, ny / length, 1 / length);
      }
      normal.needsUpdate = true;
    }
    const LOGO_WIDTH = 5;
    const scale = LOGO_WIDTH / size.x;
    // Centre the geometry on the origin, base on the ground, then turn it so
    // the M side comes forward the way the reference frames it.
    for (const mesh of logo.children) mesh.position.set(-center.x, -box.min.y, -center.z);
    const sculpture = new THREE.Group();
    sculpture.add(logo);
    sculpture.scale.setScalar(scale);
    sculpture.rotation.y = 0.13;
    sculpture.position.y = -0.07;
    scene.add(sculpture);
    const logoHeight = size.y * scale;
    const target = new THREE.Vector3(0, logoHeight * 0.5, 0);

    // Lights. Key from the upper left, red back light from behind right.
    const key = new THREE.DirectionalLight('#eef1f8', 3);
    key.position.set(-6, 7.5, 6.5);
    key.castShadow = true;
    key.shadow.mapSize.set(light ? 1024 : 2048, light ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 5, bottom: -4, near: 1, far: 26 });
    key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
    scene.add(key);
    // A narrow red spot behind the logo instead of a red directional light:
    // the latter tinted every pebble on the ground.
    const rim = new THREE.SpotLight('#ff2440', 60, 14, 0.32, 0.8, 1.6);
    rim.position.set(6.5, 2.2, -5.5);
    rim.target.position.set(0.5, 1.4, 0);
    scene.add(rim, rim.target);
        // Low raking light from the left so the regolith grain reads.
    const graze = new THREE.DirectionalLight('#e8e6e2', 1.6);
    graze.position.set(-9, 1.1, 4);
    scene.add(graze);
    const fill = new THREE.DirectionalLight('#9aa4b8', 0.25);
    fill.position.set(4, 3, 8);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight('#3a3d46', '#060606', 0.35));

    /* Ground: a wide displaced plane with tiled regolith, vertex-colour
       mottling and a gentle rise behind the logo. */
    const detail = regolith(light ? 256 : 512);
    const groundMap = keep(new THREE.CanvasTexture(detail));
    groundMap.colorSpace = THREE.SRGBColorSpace;
    groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping;
    groundMap.repeat.set(26, 22);
    groundMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpMap = keep(new THREE.CanvasTexture(detail));
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.copy(groundMap.repeat);
    bumpMap.anisotropy = groundMap.anisotropy;
    const groundHeight = (x, z) => {
      const nearLogo = Math.exp(-(x * x * 0.08 + z * z * 0.35));
      const dunes = (valueNoise(x * 0.22 + 7, z * 0.22, 0, 4) - 0.5) * 0.9;
      const clods = (valueNoise(x * 1.6, z * 1.6, 0, 5) - 0.5) * 0.12 + (valueNoise(x * 4.5, z * 4.5, 0, 6) - 0.5) * 0.045;
      const ridge = Math.max(0, -z - 3) * 0.06;
      return (dunes + ridge) * (1 - nearLogo * 0.85) + clods * (1 - nearLogo * 0.6);
    };
    const groundGeometry = keep(new THREE.PlaneGeometry(44, 36, light ? 180 : 320, light ? 150 : 270));
    groundGeometry.rotateX(-Math.PI / 2);
    groundGeometry.translate(0, 0, -9);
    const gp = groundGeometry.attributes.position;
    const colors = new Float32Array(gp.count * 3);
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), z = gp.getZ(i);
      gp.setY(i, groundHeight(x, z));
      const tone = 0.62 + valueNoise(x * 0.7, z * 0.7, 0, 7) * 0.38 + (valueNoise(x * 3, z * 3, 0, 8) - 0.5) * 0.12;
      colors[i * 3] = colors[i * 3 + 1] = tone; colors[i * 3 + 2] = tone * 1.01;
    }
    groundGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeometry.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeometry, keep(new THREE.MeshStandardMaterial({
      color: '#b8b8bd', map: groundMap, bumpMap, bumpScale: 2.6, roughness: 0.94, metalness: 0, vertexColors: true, envMap: envTarget.texture, envMapIntensity: 0.12,
    })));
    ground.receiveShadow = true;
    scene.add(ground);

    // Pebbles and grit, denser towards the camera where they read.
    const rand = (i, k) => hash(i, k, 11);
    function scatter(count, detailLevel, sizeFn, xRange, zRange, shadeBase) {
      const geometry = keep(new THREE.IcosahedronGeometry(1, detailLevel));
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const f = 0.72 + hash(Math.round(p.getX(i) * 97), Math.round(p.getY(i) * 89) + Math.round(p.getZ(i) * 83) * 131, 12) * 0.5;
        p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
      }
      geometry.computeVertexNormals();
      const mesh = new THREE.InstancedMesh(geometry, keep(new THREE.MeshStandardMaterial({ color: '#77777b', roughness: 0.92, metalness: 0, envMap: envTarget.texture, envMapIntensity: 0.15 })), count);
      const dummy = new THREE.Object3D();
      const tint = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const zr = Math.pow(rand(i, 1), 0.6);
        const z = zRange[0] + zr * (zRange[1] - zRange[0]);
        const spread = xRange * (0.55 + zr * 0.45);
        const x = (rand(i, 0) * 2 - 1) * spread;
        if (Math.abs(x) < 2.7 && Math.abs(z) < 0.7) { dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); continue; }
        const r = sizeFn(rand(i, 2));
        dummy.position.set(x, groundHeight(x, z) + r * 0.15, z);
        dummy.rotation.set(rand(i, 3) * 6.3, rand(i, 4) * 6.3, rand(i, 5) * 6.3);
        dummy.scale.set(r, r * (0.45 + rand(i, 6) * 0.35), r * (0.7 + rand(i, 7) * 0.4));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const shade = shadeBase + rand(i, 8) * 0.55;
        mesh.setColorAt(i, tint.setRGB(shade, shade, shade * 1.01));
      }
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }
    scatter(light ? 700 : 1600, 1, r => 0.01 + Math.pow(r, 6) * 0.07, 9, [-6, 12], 0.3);
    scatter(light ? 9000 : 26000, 0, r => 0.004 + Math.pow(r, 2) * 0.012, 8, [-3, 12.5], 0.35);

    // Glints: fine specular sparkle in the lit foreground.
    const glintCount = narrow() ? 1200 : light ? 3000 : 7000;
    const glintPositions = new Float32Array(glintCount * 3);
    const glintColors = new Float32Array(glintCount * 3);
    for (let i = 0; i < glintCount; i++) {
      const z = -2.5 + Math.pow(rand(i, 21), 0.55) * 15;
      const x = (rand(i, 20) * 2 - 1) * (3 + (z + 2.5) * 0.5);
      glintPositions.set([x, groundHeight(x, z) + 0.006, z], i * 3);
      const b = Math.pow(rand(i, 22), 3) * 0.9;
      glintColors.set([b, b, b * 1.05], i * 3);
    }
    const glintGeometry = keep(new THREE.BufferGeometry());
    glintGeometry.setAttribute('position', new THREE.BufferAttribute(glintPositions, 3));
    glintGeometry.setAttribute('color', new THREE.BufferAttribute(glintColors, 3));
    scene.add(new THREE.Points(glintGeometry, keep(new THREE.PointsMaterial({ size: (narrow() ? 0.9 : 1.6) * pixelRatio, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))));

    // Soft contact shadow so the logo sits in the sand.
    const oc = document.createElement('canvas');
    oc.width = oc.height = 128;
    const ocx = oc.getContext('2d');
    const contactGradient = ocx.createRadialGradient(64, 64, 4, 64, 64, 63);
    contactGradient.addColorStop(0, 'rgba(0,0,0,.85)');
    contactGradient.addColorStop(0.45, 'rgba(0,0,0,.5)');
    contactGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ocx.fillStyle = contactGradient; ocx.fillRect(0, 0, 128, 128);
    const contact = new THREE.Mesh(keep(new THREE.PlaneGeometry(LOGO_WIDTH * 1.25, 1.6)), keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(oc)), transparent: true, depthWrite: false })));
    contact.rotation.x = -Math.PI / 2;
    contact.rotation.z = 0.2;
    contact.position.set(0, 0.02, 0.05);
    scene.add(contact);

    /* Planet. Placed along the camera's view so its screen position and size
       follow the logo: radius ~0.88 logo widths, centred just right of and
       below the logo, sunk into the haze behind the horizon. */
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    const base = new THREE.Vector3(-0.5, 1.45, 15);
    const planetUniforms = {
      uKey: { value: new THREE.Vector3(-0.55, 0.7, 0.45).normalize() },
      uRimSide: { value: new THREE.Vector2(0.93, 0.36).normalize() },
      uRimColor: { value: new THREE.Color('#ff1834') },
      uHorizon: { value: -2 },
      uFade: { value: 9 },
      uRim: { value: 1 },
      uHaze: { value: new THREE.Color('#0a0a0c') },
      uInner: { value: 0.5 },
    };
    const PLANET_DEPTH = 62;
    camera.position.copy(base);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const logoDepth = base.distanceTo(target);
    const toPlanet = PLANET_DEPTH / logoDepth;
    const apparentWidth = LOGO_WIDTH * Math.cos(sculpture.rotation.y);
    const radius = apparentWidth * 0.84 * toPlanet;
    const planetCenter = base.clone()
      .addScaledVector(forward, PLANET_DEPTH)
      .addScaledVector(right, apparentWidth * 0.18 * toPlanet)
      .addScaledVector(up, -apparentWidth * 0.3 * toPlanet);
    const planet = new THREE.Mesh(keep(new THREE.SphereGeometry(radius, 128, 96)), keep(new THREE.ShaderMaterial({ uniforms: planetUniforms, vertexShader: planetVertex, fragmentShader: planetFragment, fog: false })));
    planet.position.copy(planetCenter);
    planet.rotation.set(0.4, -0.8, 0.1);
    scene.add(planet);
    const haloScale = 1.13;
    planetUniforms.uInner.value = Math.sqrt(1 - 1 / (haloScale * haloScale));
    const halo = new THREE.Mesh(keep(new THREE.SphereGeometry(radius * haloScale, 96, 64)), keep(new THREE.ShaderMaterial({ uniforms: planetUniforms, vertexShader: planetVertex, fragmentShader: haloFragment, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
    halo.position.copy(planetCenter);
    scene.add(halo);
    planetUniforms.uHorizon.value = planetCenter.y + radius * 0.06;
    planetUniforms.uFade.value = radius * 0.5;

    /* Depth of field. The scene renders linear HDR into a multisampled
       target with depth; one fullscreen gather pass blurs by distance behind
       the logo, then tone maps. Sharp samples never spread into the blur, so
       the logo keeps a clean edge against the soft planet. */
    const frameTarget = keep(new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: light ? 0 : 4, depthTexture: new THREE.DepthTexture(1, 1) }));
    const dof = keep(new THREE.ShaderMaterial({
      defines: { TAPS: light ? 16 : 36 },
      uniforms: {
        tColor: { value: frameTarget.texture },
        tDepth: { value: frameTarget.depthTexture },
        uNear: { value: camera.near },
        uFar: { value: camera.far },
        uFocus: { value: logoDepth + 1.2 },
        uRange: { value: 15 },
        uMaxBlur: { value: (light ? 5 : 7) * pixelRatio },
        uTexel: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform float uNear, uFar, uFocus, uRange, uMaxBlur;
        uniform vec2 uTexel;
        varying vec2 vUv;
        float blurAt(vec2 uv) {
          float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
          float dist = 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
          return smoothstep(uFocus, uFocus + uRange, dist) * uMaxBlur;
        }
        void main() {
          float radius = blurAt(vUv);
          vec3 color = texture2D(tColor, vUv).rgb;
          if (radius > 0.6) {
            float spin = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
            vec3 sum = color;
            float total = 1.0;
            for (int i = 0; i < TAPS; i++) {
              float fi = float(i) + 0.5;
              float r = sqrt(fi / float(TAPS)) * radius;
              float a = fi * 2.39996323 + spin;
              vec2 uv = vUv + vec2(cos(a), sin(a)) * r * uTexel;
              float w = clamp(blurAt(uv) - r + 1.0, 0.0, 1.0);
              sum += texture2D(tColor, uv).rgb * w;
              total += w;
            }
            color = sum / total;
          }
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false,
      depthWrite: false,
    }));
    const post = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    post.add(new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), dof));

    // Frame: logo ~35% of the width at 34% from the left on desktop; centred
    // in the upper part of the stage on phones.
    function frameCamera(w, h) {
      const aspect = w / h;
      const phone = narrow();
      const fraction = phone ? 0.56 : Math.min(0.35, 0.68 / aspect);
      const visibleWidth = apparentWidth / fraction;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(visibleWidth / aspect / 2 / logoDepth));
      camera.aspect = aspect;
      const cx = phone ? 0.5 : 0.345, cy = phone ? 0.28 : 0.5;
      camera.setViewOffset(w, h, (0.5 - cx) * w, (0.5 - cy) * h, w, h);
      camera.updateProjectionMatrix();
    }

    const ease = t => 1 - Math.pow(1 - t, 3);
    const dolly = new THREE.Vector3();
    render = (now) => {
      frame = 0;
      if (!alive || !canvas.isConnected || document.hidden) return;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) { ready = false; return; }
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w !== width || h !== height) {
        width = w; height = h;
        renderer.setSize(w, h, false);
        frameCamera(w, h);
        frameTarget.setSize(Math.round(w * pixelRatio), Math.round(h * pixelRatio));
        dof.uniforms.uTexel.value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
      }
      if (!introStart) introStart = now;
      const t = INTRO ? Math.min(1, (now - introStart) / INTRO) : 1;
      const e = ease(t);
      px += (mx - px) * 0.06;
      py += (my - py) * 0.06;
      // Push in from a slightly higher, wider position.
      dolly.set(0.9 * (1 - e) + px * 0.5, 0.55 * (1 - e) + py * 0.22, 3.2 * (1 - e));
      camera.position.copy(base).add(dolly);
      camera.lookAt(target);
      renderer.toneMappingExposure = 0.55 + 0.5 * ease(Math.min(1, t * 1.6));
      planetUniforms.uRim.value = 0.35 + 0.65 * ease(Math.min(1, Math.max(0, t * 1.4 - 0.15)));
      renderer.setRenderTarget(frameTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(post, postCamera);
      if (!stage.classList.contains('scene-ready')) stage.classList.add('scene-ready');
      if (t < 1 || Math.abs(mx - px) + Math.abs(my - py) > 0.0008) request();
    };

    ready = true;
    observer = new ResizeObserver(() => { ready = true; request(); });
    observer.observe(canvas);
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    // Compile shaders before the first visible frame so the push-in does not
    // start with a stall.
    renderer.compile(scene, camera);
    renderer.compile(post, postCamera);
    request();
  } catch (error) {
    dispose();
    stage.classList.add('scene-failed');
    canvas.dataset.fallback = 'true';
    console.info('Moonshine 3D unavailable; the original SVG is shown.', error.message);
  }
}

/** Start the scene on a canvas; returns a function that disposes it. The
    canvas must sit inside the .brand-stage element. */
export function mountScene(canvas) {
  cleanup?.();
  cleanup = null;
  start(canvas);
  return () => { cleanup?.(); cleanup = null; };
}
