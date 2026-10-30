/* Shared UI pieces. Class names match the existing stylesheets, so the
   design carries over unchanged. */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { ThinkingOrb } from 'thinking-orbs';
import { Icon } from './icons';

export { Icon };

export function Badge({ children, color = '' }: { children: ReactNode; color?: string }) {
  return <span className={`badge ${color}`}>{children}</span>;
}

export function PageTitle({ title, sub, actions, eyebrow = 'Moonshine backoffice' }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="page-title">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
      <div className="row-actions">{actions}</div>
    </header>
  );
}

export function Empty({ title, sub, action, icon = 'folder' }: { title: string; sub?: ReactNode; action?: ReactNode; icon?: string }) {
  return <div className="empty"><Icon name={icon} /><strong>{title}</strong>{sub ? <p>{sub}</p> : null}{action ? <div>{action}</div> : null}</div>;
}

export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub: ReactNode; icon: string }) {
  return <article className="stat"><div className="stat-top">{label}<Icon name={icon} /></div><strong>{value}</strong><small>{sub}</small></article>;
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="back-link" to={to}><Icon name="back" /> {children}</Link>;
}

export function Tabs({ items }: { items: { to: string; label: ReactNode; end?: boolean }[] }) {
  return (
    <nav className="seg-tabs" aria-label="Onderdelen">
      {items.map((t) => <NavLink key={t.to} to={t.to} end={t.end ?? true} className={({ isActive }) => (isActive ? 'active' : '')}>{t.label}</NavLink>)}
    </nav>
  );
}

const TONES: Record<string, string | undefined> = { ink: undefined, ok: '#a996e8', warn: '#f0b35a', accent: '#ec4860' };
type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';

/** Dotted thought-orb (thinking-orbs) for loading and live status. */
export function Orb({ state = 'working', size = 20, tone = 'ink', paused, label }: { state?: OrbState; size?: 20 | 32 | 64; tone?: string; paused?: boolean; label?: string }) {
  return <span className="moon-orb"><ThinkingOrb state={state} size={size} theme="dark" color={TONES[tone]} paused={paused} aria-label={label} /></span>;
}

export function Loading({ text = 'Laden…', state = 'working' as OrbState }) {
  return <div className="empty orb-loading"><Orb state={state} size={32} />{text}</div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  return <div className="error-box">{error instanceof Error ? error.message : String(error)}</div>;
}

/* --- Dialog -------------------------------------------------------------- */

export function Modal({ title, open, onClose, children, footer, error }: { title: string; open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode; error?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }} aria-label={title}>
      {open ? <>
        <div className="dialog-head"><h2>{title}</h2><button className="icon-btn ghost" onClick={onClose} aria-label="Sluiten"><Icon name="close" /></button></div>
        <div className="dialog-body"><div className="dialog-error error-box" role="alert" aria-live="assertive">{error}</div>{children}</div>
        {footer ? <div className="dialog-foot">{footer}</div> : null}
      </> : null}
    </dialog>
  );
}

/* --- Toasts --------------------------------------------------------------- */

const ToastContext = createContext<(text: string, error?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((text: string, error = false) => {
    setMessage({ text, error });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 4500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div id="toast" role="status" aria-live="polite" className={message ? 'show' + (message.error ? ' error' : '') : ''}>{message?.text}</div>
    </ToastContext.Provider>
  );
}

/** Run an async action and report failures as a toast. */
export function useAction() {
  const toast = useToast();
  return useCallback(async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) toast(success);
      return true;
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), true);
      return false;
    }
  }, [toast]);
}

export function formValues(form: HTMLFormElement) {
  const out: Record<string, string> = {};
  for (const [key, value] of new FormData(form)) if (typeof value === 'string') out[key] = value;
  return out;
}
