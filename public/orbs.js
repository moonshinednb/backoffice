/* <moon-orb>: animated dotted orbs for loading and status.

   Drawn by the thinking-orbs engine (MIT, vendored, no React): pure 2D
   canvas, no WebGL. One shared clock and one animation frame loop drive
   every orb on the page, so ten orbs cost one rAF and stay in phase.
   Off-screen orbs, hidden tabs and paused orbs do not draw; with reduced
   motion each orb shows a single still frame.

     <moon-orb state="working" size="20" tone="ok" label="Bezig met opslaan">

   state  working | searching | solving | listening | connecting | weaving |
          composing | breathing | shaping            (default: working)
   size   20 (inline) | 32 | 64 (loading screens)     (default: 20)
   tone   ink | ok | warn | accent                    (default: ink)
   paused freeze on the current frame
*/
import { MODE_FRAMES, resolvePreset, paintFrame } from './vendor/thinking-orbs-0.3.2/engine.es.js';

const TONES = {
  ink: undefined,
  ok: { r: 169, g: 150, b: 232 },
  warn: { r: 240, g: 179, b: 90 },
  accent: { r: 236, g: 72, b: 96 },
};
const LABELS = {
  working: 'Bezig', searching: 'Zoeken', solving: 'Verwerken', listening: 'Live', connecting: 'Verbinden',
  weaving: 'Synchroniseren', composing: 'Samenstellen', breathing: 'Actief', shaping: 'Voorbereiden',
};
const SIZES = new Set([20, 32, 64]);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const live = new Set();
let raf = 0;

function tick() {
  raf = 0;
  if (document.hidden) return;
  const t = performance.now() / 1000;
  for (const orb of live) orb.draw(t);
  if (live.size) raf = requestAnimationFrame(tick);
}
function wake() {
  if (!raf && live.size && !document.hidden && !reduced.matches) raf = requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', wake);

const watcher = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  for (const entry of entries) entry.target.visible(entry.isIntersecting);
}) : null;

class MoonOrb extends HTMLElement {
  static get observedAttributes() { return ['state', 'size', 'tone', 'paused', 'label']; }

  connectedCallback() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.append(this.canvas);
    }
    this.setAttribute('role', 'img');
    this.onScreen = !watcher;
    this.configure();
    watcher?.observe(this);
  }

  disconnectedCallback() {
    watcher?.unobserve(this);
    live.delete(this);
  }

  attributeChangedCallback() {
    if (this.canvas) this.configure();
  }

  visible(on) {
    this.onScreen = on;
    this.schedule();
  }

  configure() {
    const state = stateOf(this.getAttribute('state'));
    const requested = Number(this.getAttribute('size')) || 20;
    const size = SIZES.has(requested) ? requested : 20;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { mode, speed, opts } = resolvePreset(state, size);
    this.frame = MODE_FRAMES[mode];
    this.opts = opts;
    this.speed = speed;
    this.size = size;
    this.dpr = dpr;
    this.tint = TONES[this.getAttribute('tone')];
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);
    this.canvas.style.width = this.canvas.style.height = size + 'px';
    this.ctx = this.canvas.getContext('2d');
    this.setAttribute('aria-label', this.getAttribute('label') || LABELS[state]);
    this.draw(reduced.matches ? 0.6 : performance.now() / 1000);
    this.schedule();
  }

  schedule() {
    const animate = this.isConnected && this.onScreen && !this.hasAttribute('paused') && !reduced.matches;
    if (animate) { live.add(this); wake(); } else live.delete(this);
  }

  draw(seconds) {
    if (!this.ctx) return;
    const { ctx, size, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    // The backoffice is dark: light ink, optionally tinted by status.
    paintFrame(ctx, this.frame(size, seconds * this.speed, this.opts), true, this.tint);
  }
}

function stateOf(value) {
  return value && value in LABELS ? value : 'working';
}

reduced.addEventListener?.('change', () => document.querySelectorAll('moon-orb').forEach((orb) => orb.configure()));
if (!customElements.get('moon-orb')) customElements.define('moon-orb', MoonOrb);
