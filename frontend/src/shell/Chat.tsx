import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar, Icon } from '../lib/ui';

type Msg = { id: number; sender: string; body: string; created: number };
type Conv = { id: string; name: string; avatar: string; unread: number; last: Msg | null };

const time = (t: number) => {
  const d = new Date(t * 1000);
  return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const useChatList = (open: boolean) => useQuery({ queryKey: ['chat'], queryFn: () => api<{ conversations: Conv[]; unread: number }>('/chat'), refetchInterval: open ? 5000 : 15000 });

/** Chat button in the top bar, next to the notifications. */
export function ChatButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const unread = useChatList(open).data?.unread || 0;
  useEffect(() => { document.title = unread ? `(${unread}) Moonshine` : 'Moonshine'; }, [unread]);
  return <button className={`icon-btn top-chat ${open ? 'active' : ''}`} onClick={onToggle} aria-expanded={open}
    aria-label={open ? 'Chat sluiten' : unread ? `Chat openen, ${unread} ongelezen` : 'Chat openen'}>
    <Icon name="chat" />{unread && !open ? <span className="chat-badge">{unread > 9 ? '9+' : unread}</span> : null}</button>;
}

/** Team chat panel, opened from the top bar; it never covers the page until you open it. */
export function ChatWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [active, setActive] = useState<Conv | null>(null);
  const list = useChatList(open);
  if (!user || !open) return null;
  const setOpen = (v: boolean) => { if (!v) onClose(); };
  return <div className="chat-dock">
    {open ? <section className="chat-panel" aria-label="Chat">
      {active ? <Thread conv={active} onBack={() => setActive(null)} /> : <>
        <header className="chat-head"><strong>Chat</strong><button className="icon-btn ghost" onClick={() => setOpen(false)} aria-label="Chat sluiten"><Icon name="close" /></button></header>
        <ul className="chat-list">{(list.data?.conversations || []).map((c) => <li key={c.id}><button onClick={() => setActive(c)}>
          {c.id === 'team' ? <span className="avatar chat-team" aria-hidden="true"><Icon name="users" /></span> : <Avatar user={c} />}
          <span className="chat-meta"><strong>{c.name}</strong><small>{c.last ? c.last.body : c.id === 'team' ? 'Iedereen in Moonshine' : 'Nog geen berichten'}</small></span>
          {c.unread ? <span className="chat-unread">{c.unread}</span> : c.last ? <small className="chat-time">{time(c.last.created)}</small> : null}
        </button></li>)}</ul>
      </>}
    </section> : null}
  </div>;
}

function Thread({ conv, onBack }: { conv: Conv; onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState('');
  const last = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const people = qc.getQueryData<{ conversations: Conv[] }>(['chat'])?.conversations || [];
  useEffect(() => {
    let alive = true;
    last.current = 0;
    setMessages([]);
    async function poll() {
      try {
        const r = await api<{ messages: Msg[] }>(`/chat/${conv.id}?after=${last.current}`);
        if (!alive || !r.messages.length) return;
        last.current = r.messages[r.messages.length - 1].id;
        setMessages((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
        qc.invalidateQueries({ queryKey: ['chat'] });
      } catch (e) { if (alive) setError((e as Error).message); }
    }
    poll();
    const timer = window.setInterval(poll, 3000);
    input.current?.focus();
    return () => { alive = false; window.clearInterval(timer); };
  }, [conv.id, qc]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.current!.value.trim();
    if (!text) return;
    try {
      const m = await api<Msg>(`/chat/${conv.id}`, { method: 'POST', body: { body: text } });
      input.current!.value = '';
      last.current = Math.max(last.current, m.id);
      setMessages((list) => [...list, m]);
      setError('');
    } catch (err) { setError((err as Error).message); }
  }
  const key = (e: KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const nameOf = (id: string) => id === user?.id ? 'Jij' : people.find((p) => p.id === id)?.name || 'Onbekend';
  return <>
    <header className="chat-head"><button className="icon-btn ghost" onClick={onBack} aria-label="Terug"><Icon name="back" /></button><strong>{conv.name}</strong></header>
    <div className="chat-messages" aria-live="polite">
      {messages.length ? messages.map((m, i) => {
        const mine = m.sender === user?.id;
        const showName = conv.id === 'team' && !mine && messages[i - 1]?.sender !== m.sender;
        return <div key={m.id} className={`chat-msg ${mine ? 'mine' : ''}`}>{showName ? <small>{nameOf(m.sender)}</small> : null}<p>{m.body}</p><time>{time(m.created)}</time></div>;
      }) : <p className="helper chat-empty">Nog geen berichten. Zeg hallo!</p>}
      <div ref={end} />
    </div>
    {error ? <div className="error-box chat-error">{error}</div> : null}
    <form className="chat-compose" onSubmit={send}><label className="visually-hidden" htmlFor="chat-input">Bericht</label>
      <textarea id="chat-input" ref={input} rows={1} placeholder="Typ een bericht…" onKeyDown={key} maxLength={4000} />
      <button className="primary icon-btn" type="submit" aria-label="Versturen"><Icon name="send" /></button></form>
  </>;
}
