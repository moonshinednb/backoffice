/* Theme: 'dark' (Nacht, default), 'light' (Dag) or 'system'. Stored per device. */
export type Theme = 'dark' | 'light' | 'system';
const KEY = 'moonshine-theme';

export function storedTheme(): Theme {
  try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'system' ? t : 'dark'; } catch { return 'dark'; }
}

export function applyTheme(t: Theme = storedTheme()) {
  const light = t === 'light' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg);
}

export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch { /* private mode: only for this visit */ }
  applyTheme(t);
}

window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => { if (storedTheme() === 'system') applyTheme(); });
