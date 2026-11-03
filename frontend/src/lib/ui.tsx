/* Shared UI pieces. Class names match the existing stylesheets, so the
   design carries over unchanged. */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Icon } from './icons';

export { Icon };

export function Badge({ children, color = '' }: { children: ReactNode; color?: string }) {
  return <span className={`badge ${color}`}>{children}</span>;
}

export function PageTitle({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="page-title">
      <div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
      <div className="row-actions">{actions}</div>
    </header>
  );
}

export function Empty({ title, sub, action, icon = 'folder' }: { title: string; sub?: ReactNode; action?: ReactNode; icon?: string }) {
  return <div className="empty"><span className="empty-icon"><Icon name={icon} /></span><div className="empty-text"><strong>{title}</strong>{sub ? <p>{sub}</p> : null}</div>{action ? <div className="empty-action">{action}</div> : null}</div>;
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

type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';

/** A plain spinner for loading and busy buttons. (Name kept from the old animated orb; the props are ignored.) */
export function Orb({ size = 20, label }: { state?: OrbState; size?: 20 | 32 | 64; tone?: string; paused?: boolean; label?: string }) {
  return <span className="spin" style={{ width: Math.min(size, 24), height: Math.min(size, 24) }} role="status" aria-label={label || 'Bezig'} />;
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

/** Profile photo, or initials when there is none. */
export function Avatar({ user, size = 36 }: { user: { name: string; avatar?: string }; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.36 };
  return user.avatar ? <img className="avatar avatar-img" src={user.avatar} alt="" style={style} /> : <span className="avatar" aria-hidden="true" style={style}>{user.name.slice(0, 2).toUpperCase()}</span>;
}


export type MenuItem = { label: string; icon?: string; onSelect: () => void; danger?: boolean; confirm?: { title: string; body: ReactNode; action: string } };

/** "⋯" menu for less common and dangerous actions; a dangerous one always asks first. */
export function MoreMenu({ items, label = 'Meer acties' }: { items: (MenuItem | null | false)[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState<MenuItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const list = items.filter(Boolean) as MenuItem[];
  if (!list.length) return null;
  return <div className="more-menu" ref={ref}>
    <button className="icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen(!open)}><Icon name="more" /></button>
    {open ? <div className="more-pop" role="menu">{list.map((i) => <button key={i.label} role="menuitem" className={i.danger ? 'danger-item' : ''}
      onClick={() => { setOpen(false); if (i.confirm) setAsk(i); else i.onSelect(); }}>{i.icon ? <Icon name={i.icon} /> : null}{i.label}</button>)}</div> : null}
    <Modal title={ask?.confirm?.title || ''} open={!!ask} onClose={() => setAsk(null)} footer={<>
      <button onClick={() => setAsk(null)}>Annuleren</button>
      <button className="danger" onClick={() => { const a = ask; setAsk(null); a?.onSelect(); }}>{ask?.confirm?.action}</button></>}>
      <p>{ask?.confirm?.body}</p>
    </Modal>
  </div>;
}
