/* Moonshine SVG sculpture. Real vector extrusion, PBR metal, studio
   environment. All code and assets are served locally.

   Design constraints (see REVIEW history):
   - Rendering is on demand, never a continuous loop. One frame per state
     change, idle the rest of the time.
   - No postprocessing chain. Bokeh + UnrealBloom cost ~30 MB of framebuffers
     and ~14 KB of source to soften a logo nobody inspects. ACES tone mapping
     on the renderer is enough.
   - pixelRatio is set identically on renderer and composer. A mismatch
     renders the chain at one resolution and upscales to another, which is
     permanently soft output.
   - dispose() must force context loss. Browsers cap live WebGL contexts at
     roughly 8-16 and silently drop the oldest. Every failed login renders a
     new canvas, so without this the login page goes black after ~16 attempts.
*/
let cleanup = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function noise(x, y) {
  const h = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  const ix = Math.floor(x), iy = Math.floor(y);
  let u = x - ix, v = y - iy;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  return (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) + (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v;
}

/* Concrete ground texture. The previous version generated 512x512 pixels in
   a JS double loop (~5.2M Math.sin calls) and blocked the main thread for
   hundreds of milliseconds before the login form became interactive.
   This draws the same value-noise field with a handful of canvas gradients
   plus a much smaller loop, which is orders of magnitude cheaper. */
function concrete(THREE) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const wash = ctx.createLinearGradient(0, 0, size, size);
  wash.addColorStop(0, '#6a6a6c');
  wash.addColorStop(0.5, '#58585a');
  wash.addColorStop(1, '#4a4a4c');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);

  // Sparse pore speckle: cheap, and at 4 octaves the eye reads it as concrete.
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const x = i % size, y = (i / size) | 0;
    const n = noise(x / 34, y / 34) * 0.5 + noise(x / 6, y / 6) * 0.5;
    const shade = (n - 0.5) * 26;
    const o = i * 4;
    image.data[o] = 128 + shade;
    image.data[o + 1] = 128 + shade;
    image.data[o + 2] = 130 + shade;
    image.data[o + 3] = 255;
  }
  const detail = document.createElement('canvas');
  detail.width = detail.height = size;
  detail.getContext('2d').putImageData(image, 0, 0);
  ctx.globalAlpha = 0.35;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(detail, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.Texture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(15, 15);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

async function start(canvas) {
  // Three is ~700 KB. Only pull it when the scene is actually going to be
  // seen: never on a phone, never when the user asked for reduced motion.
  // Small viewports and reduced-motion users get the static SVG immediately.
  const wide = matchMedia('(min-width: 760px)').matches;
  if (!wide || reduced.matches) { canvas.dataset.fallback = 'true'; return; }

  let alive = true, renderer, scene, observer, frame = 0, envTarget, pmrem, camera, sculpture, orb, contact, sculptureSize = 0, sculptureScale = 1, sculptureCenterX = 0;
  const resources = new Set();
  const keep = (r) => (resources.add(r), r);
  let mx = 0, my = 0, px = 0, py = 0, ready = false, width = 0, height = 0;
  let render = () => {};

  function dispose() {
    alive = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', visibility);
    for (const r of resources) r.dispose?.();
    envTarget?.dispose();
    pmrem?.dispose();
    // Without this the browser keeps the context alive until GC, and past
    // its context cap it force-loses the oldest one - which is this canvas.
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
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = 0.5 - (e.clientY - r.top) / r.height;
    request();
  }
  function leave() { mx = my = 0; request(); }
  function visibility() { if (!document.hidden) request(); }

  try {
    const THREE = await import('./vendor/three/three.module.min.js');
    const { SVGLoader } = await import('./vendor/three/SVGLoader.js');
    const { logoShapes, extrudeLogo } = await import('./logo-geometry.js');
    if (!alive) return;
    // Three exists only in this scope, after its lazy import has completed.
    const box = new THREE.Box3();
    const sizeVec = new THREE.Vector3();
    const centerVec = new THREE.Vector3();

    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();

    const backdrop = document.createElement('canvas');
    backdrop.width = backdrop.height = 512;
    const backdropCtx = backdrop.getContext('2d');
    const backdropLight = backdropCtx.createRadialGradient(160, 20, 0, 230, 200, 480);
    backdropLight.addColorStop(0, '#222224');
    backdropLight.addColorStop(0.65, '#0d0d0e');
    backdropLight.addColorStop(1, '#050506');
    backdropCtx.fillStyle = backdropLight;
    backdropCtx.fillRect(0, 0, 512, 512);
    const backdropMap = keep(new THREE.CanvasTexture(backdrop));
    backdropMap.colorSpace = THREE.SRGBColorSpace;
    scene.background = backdropMap;
    scene.fog = new THREE.FogExp2('#070809', 0.055);

    const environment = new THREE.Scene();
    environment.background = new THREE.Color('#090a0b');
    const room = new THREE.Mesh(keep(new THREE.BoxGeometry(25, 20, 25)), keep(new THREE.MeshBasicMaterial({ color: '#38383b', side: THREE.BackSide })));
    environment.add(room);
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = lightCanvas.height = 256;
    const lightCtx = lightCanvas.getContext('2d');
    const lightGradient = lightCtx.createRadialGradient(128, 128, 20, 128, 128, 170);
    lightGradient.addColorStop(0, '#ffffff');
    lightGradient.addColorStop(0.6, '#aaaaaa');
    lightGradient.addColorStop(1, '#000000');
    lightCtx.fillStyle = lightGradient;
    lightCtx.fillRect(0, 0, 256, 256);
    const lightMap = keep(new THREE.CanvasTexture(lightCanvas));
    lightMap.colorSpace = THREE.SRGBColorSpace;

    function softbox(w, h, pos, intensity, color = '#ffffff') {
      const material = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), map: lightMap, side: THREE.DoubleSide }));
      const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), material);
      mesh.position.set(...pos);
      mesh.lookAt(0, 1, 0);
      environment.add(mesh);
    }
    softbox(2, 6, [-4, 3, 6], 5);
    softbox(6, 0.8, [-1.4, 5, 5], 4);
    softbox(1.4, 5, [3.8, 1.8, 6], 3);
    softbox(6, 1, [0, 7, 0], 4);
    softbox(2, 5, [-5, 2, -4], 3);
    softbox(0.5, 5, [5, 2, -1], 1.4, '#c5213d');

    pmrem = new THREE.PMREMGenerator(renderer);
    envTarget = pmrem.fromScene(environment, 0.035);
    scene.environment = envTarget.texture;

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 70);
    const key = new THREE.DirectionalLight('#e9edf5', 2);
    key.position.set(-5, 6, 4);
    key.castShadow = true;
    // 2048 is overkill for a logo behind a login panel; 1024 is
    // indistinguishable here and quarters the shadow memory.
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -7; key.shadow.camera.right = 7;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.1; key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; key.shadow.radius = 5;
    scene.add(key); keep(key.shadow);

    scene.add(new THREE.HemisphereLight('#c0c9d8', '#121114', 0.1));
    const fill = new THREE.DirectionalLight('#c31c38', 0.12);
    fill.position.set(3, 3, -3); scene.add(fill);
    const edge = new THREE.DirectionalLight('#ed2348', 1.1);
    edge.position.set(5, 4, -5); scene.add(edge);
    const rim = new THREE.DirectionalLight('#dad5d3', 1.5);
    rim.position.set(-5, 5, -5);scene.add(rim);
    const graze = new THREE.DirectionalLight('#f1ede9', 2);
    graze.position.set(-4, 1.3, 4);
    graze.target.position.set(-1.5, 0, 0);
    scene.add(graze, graze.target);

    const map = keep(concrete(THREE));
    const floorMaterial = keep(new THREE.MeshStandardMaterial({ color: '#707073', roughness: 0.95, metalness: 0, map, bumpMap: map, bumpScale: 0.18, envMapIntensity: 0.25 }));
    function groundHeight(x, z) {
      const flat = 1 - Math.exp(-((x + 1.5) * (x + 1.5) + z * z) * 0.4);
      const ridge = Math.pow(Math.abs(noise(x * 3, z * 3) * 2 - 1), 2);
      return (noise(x * 1.9, z * 1.9) * 0.15 + ridge * 0.09 + noise(x * 13, z * 13) * 0.035 - 0.1375) * flat - 0.025;
    }
    // 360x360 was 130k vertices and a full normal recompute for a surface
    // that reads as flat under this lighting. 120x120 is enough.
    const terrain = keep(new THREE.PlaneGeometry(30, 30, 120, 120));
    terrain.rotateX(-Math.PI / 2);
    const verts = terrain.attributes.position;
    for (let i = 0; i < verts.count; i++) verts.setY(i, groundHeight(verts.getX(i), verts.getZ(i)));
    terrain.computeVertexNormals();
    const floor = new THREE.Mesh(terrain, floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);

    const grit = new THREE.InstancedMesh(keep(new THREE.IcosahedronGeometry(1, 0)), keep(new THREE.MeshStandardMaterial({ color: '#303033', roughness: 1, metalness: 0, envMapIntensity: 0.15 })), 18000);
    const grain = new THREE.Object3D();
    const rand = (i, k) => { const n = Math.sin(i * 91.7 + k * 127.3) * 43758.5453; return n - Math.floor(n); };
    for (let i = 0; i < grit.count; i++) {
      const x = rand(i, 0) * 16 - 8, z = rand(i, 1) * 12 - 4;
      const edgeFade = Math.min(1, Math.max(0, (8 - Math.abs(x)) / 2), Math.max(0, (z + 4) / 2), Math.max(0, (8 - z) / 2));
      const r = (0.007 + Math.pow(rand(i, 2), 2) * 0.014) * edgeFade;
      grain.position.set(x, groundHeight(x, z) + r * 0.16, z);
      grain.rotation.set(rand(i, 3) * 3, rand(i, 4) * 6, rand(i, 5) * 3);
      grain.scale.set(r, r * 0.48, r * 0.8);
      grain.updateMatrix();
      grit.setMatrixAt(i, grain.matrix);
      const shade = 0.48 + rand(i, 6) * 0.5;
      grit.setColorAt(i, new THREE.Color(shade, shade, shade));
    }
    grit.receiveShadow = true;
    scene.add(grit); keep(grit);

    orb = new THREE.Mesh(keep(new THREE.SphereGeometry(3.9, 96, 64)), keep(new THREE.MeshPhysicalMaterial({ color: '#161617', metalness: 0.35, roughness: 0.57, envMapIntensity: 0.3, clearcoat: 0.08, clearcoatRoughness: 0.5 })));
    orb.position.set(-0.8, 0.9, -4.6);
    scene.add(orb);

    const response = await fetch('/assets/moonshine-logo.svg');
    if (!response.ok) throw new Error('Logo unavailable');
    const svg = await response.text();
    if (!alive) return;

    const metal = keep(new THREE.MeshPhysicalMaterial({ color: '#dadbdd', metalness: 1, roughness: 0.23, envMapIntensity: 1.7, clearcoat: 0.1, clearcoatRoughness: 0.18 }));
    const edgeMetal = keep(new THREE.MeshPhysicalMaterial({ color: '#a5a7aa', metalness: 1, roughness: 0.2, envMapIntensity: 1.1, clearcoat: 0.08, clearcoatRoughness: 0.25 }));
    const paths = new SVGLoader().parse(svg).paths;
    sculpture = new THREE.Group();
    for (const shape of logoShapes(paths)) {
      const mesh = new THREE.Mesh(keep(extrudeLogo(shape)), [metal, edgeMetal]);
      mesh.castShadow = true;
      sculpture.add(mesh);
    }
    sculpture.rotation.y = -0.24;
    sculpture.rotation.z = -0.12;
    box.setFromObject(sculpture);
    box.getSize(sizeVec);
    sculptureSize = sizeVec.x;
    sculptureScale = 4.6 / sculptureSize;
    sculpture.scale.setScalar(sculptureScale);
    box.setFromObject(sculpture);
    box.getCenter(centerVec);
    sculptureCenterX = centerVec.x;
    sculpture.position.set(-sculptureCenterX - 2.1, -box.min.y + 0.018, -centerVec.z);
    scene.add(sculpture);

    const oc = document.createElement('canvas');
    oc.width = oc.height = 128;
    const ocx = oc.getContext('2d');
    const gradient = ocx.createRadialGradient(64, 64, 3, 64, 64, 63);
    gradient.addColorStop(0, 'rgba(0,0,0,.42)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,.22)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ocx.fillStyle = gradient; ocx.fillRect(0, 0, 128, 128);
    contact = new THREE.Mesh(keep(new THREE.PlaneGeometry(5.2, 1.7)), keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(oc)), transparent: true, depthWrite: false })));
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(-1.5, 0.001, 0);
    scene.add(contact);

    // Direct render, no EffectComposer. One frame, same pixels, ~30 MB less.
    render = () => {
      frame = 0;
      if (!alive || !canvas.isConnected || document.hidden) return;
      px += (mx - px) * 0.1;
      py += (my - py) * 0.1;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) { ready = false; return; }
      const w = Math.round(r.width), h = Math.round(r.height);
      // Only touch projection/resize when the box actually changed.
      const resized = w !== width || h !== height;
      if (resized) {
        width = w; height = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      camera.position.set(0.55 + px * 0.3, 2.5 + py * 0.15, 9.8);
      camera.lookAt(0.3, 1.55, 0);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      canvas.parentElement.classList.add('scene-ready');
      // Keep animating only while the pointer is still easing to its target.
      if (Math.abs(mx - px) + Math.abs(my - py) > 0.001) request();
    };

    ready = true;
    observer = new ResizeObserver(() => { ready = true; request(); });
    observer.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true });
    canvas.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    request();
  } catch (error) {
    dispose();
    // The static SVG underneath stays visible; no console noise for a
    // cosmetic scene that is allowed to fail.
    canvas.dataset.fallback = 'true';
    console.info('Moonshine 3D unavailable; the original SVG is shown.', error.message);
  }
}

function mount() {
  const canvas = document.querySelector('.logo-scene');
  if (!canvas) { cleanup?.(); cleanup = null; return; }
  if (canvas.dataset.mounted) return;
  canvas.dataset.mounted = 'true';
  cleanup?.();
  cleanup = null;
  start(canvas);
}

new MutationObserver(mount).observe(document.getElementById('app'), { childList: true });
mount();
