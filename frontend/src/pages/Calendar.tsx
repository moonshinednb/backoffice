import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { locale } from '../lib/i18n';
import { Icon, Loading, Modal, PageTitle, formValues, useAction, useToast } from '../lib/ui';
import { FormDialog, useCanEdit } from '../production/common';

type Item = { id: string; source: string; source_id: string; title: string; start: string; end: string; all_day: boolean; link: string; detail: string; location: string; editable?: boolean };
export type Content = { id: string; event_id: string | null; event: string; release_id: string | null; release: string; title: string; kind: string; platforms: string[];
  date: string; time: string; caption: string; status: string; assignee: string; file_url: string; notes: string };
const SOURCES: [string, string][] = [['outlook', 'Outlook'], ['event', 'Events'], ['content', 'Posts'], ['voyage', 'Voyages'], ['release', 'Releases'], ['step', 'Releasestappen'], ['meeting', 'Meetings'], ['task', 'Taken']];
export const KINDS: [string, string][] = [['post', 'Post'], ['reel', 'Reel'], ['tiktok', 'TikTok'], ['story', 'Story'], ['announcement', 'Announcement'], ['video', 'Video'], ['other', 'Overig']];
export const CONTENT_STATUS: [string, string][] = [['idea', 'Idee'], ['making', 'In de maak'], ['review', 'Ter review'], ['ready', 'Klaar om te posten'], ['posted', 'Gepost']];
const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'youtube', 'soundcloud', 'x', 'spotify'];
const iso = (d: Date) => d.toLocaleDateString('sv-SE');

/** Plan or edit a post. Opens with a preset event or release. */
export function ContentDialog({ item, preset, open, onClose }: { item?: Content | null; preset?: { event_id?: string; release_id?: string; date?: string }; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const events = useQuery({ queryKey: ['events'], queryFn: () => api<{ events: { id: string; name: string; date: string }[] }>('/events'), enabled: open });
  const releases = useQuery({ queryKey: ['releases'], queryFn: () => api<{ releases: { id: string; title: string; catalog: string }[] }>('/releases'), enabled: open });
  const c = item || null;
  return <FormDialog id="content-form" title={c ? 'Post bewerken' : 'Post plannen'} open={open} onClose={onClose} submit={async (form) => {
    const v = formValues(form);
    const platforms = PLATFORMS.filter((p) => (form.elements.namedItem('pf_' + p) as HTMLInputElement)?.checked);
    await api(c ? `/content/${c.id}` : '/content', { method: c ? 'PATCH' : 'POST', body: { ...v, platforms } });
    ['calendar', 'content'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    toast(c ? 'Post bijgewerkt.' : 'Post gepland; hij komt ook in de Outlook-agenda.'); onClose();
  }}><div key={c?.id || 'new'}>
    <div className="field"><label htmlFor="ct-title">Wat</label><input id="ct-title" name="title" required defaultValue={c?.title} placeholder="Bijv. line-up reveal, artist announcement Dwonji" /></div>
    <div className="form-grid">
      <div className="field"><label htmlFor="ct-kind">Soort</label><select id="ct-kind" name="kind" defaultValue={c?.kind || 'post'}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="field"><label htmlFor="ct-status">Status</label><select id="ct-status" name="status" defaultValue={c?.status || 'idea'}>{CONTENT_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div className="field"><label htmlFor="ct-date">Postdatum</label><input id="ct-date" name="date" type="date" defaultValue={c?.date || preset?.date} /></div>
      <div className="field"><label htmlFor="ct-time">Tijd</label><input id="ct-time" name="time" type="time" defaultValue={c?.time} /></div>
      <div className="field"><label htmlFor="ct-event">Event</label><select id="ct-event" name="event_id" defaultValue={c?.event_id || preset?.event_id || ''}><option value="">Geen</option>{(events.data?.events || []).map((e) => <option key={e.id} value={e.id}>{e.date} {e.name}</option>)}</select></div>
      <div className="field"><label htmlFor="ct-release">Release</label><select id="ct-release" name="release_id" defaultValue={c?.release_id || preset?.release_id || ''}><option value="">Geen</option>{(releases.data?.releases || []).map((r) => <option key={r.id} value={r.id}>{[r.catalog, r.title].filter(Boolean).join(' – ')}</option>)}</select></div>
      <div className="field"><label htmlFor="ct-who">Wie maakt/post het</label><select id="ct-who" name="assignee" defaultValue={c?.assignee || ''}><option value="">Nog niemand</option><option value="peppy">Pepijn</option><option value="bram">Bram</option><option value="shoroy">Shoroy</option></select></div>
      <div className="field"><label htmlFor="ct-file">Bestand op OneDrive (link)</label><input id="ct-file" name="file_url" type="url" defaultValue={c?.file_url} placeholder="https://…sharepoint.com/…" /></div>
    </div>
    <fieldset className="check-group"><legend>Platforms</legend>{PLATFORMS.map((p) => <label key={p}><input type="checkbox" name={'pf_' + p} defaultChecked={c ? c.platforms.includes(p) : p === 'instagram'} /> {p}</label>)}</fieldset>
    <div className="field"><label htmlFor="ct-caption">Caption</label><textarea id="ct-caption" name="caption" rows={4} defaultValue={c?.caption} /></div>
  </div></FormDialog>;
}

export function CalendarPage() {
  const edit = useCanEdit();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [hidden, setHidden] = useState<string[]>(['step', 'task']);
  const [content, setContent] = useState<Content | null | undefined>(undefined);
  const [presetDate, setPresetDate] = useState('');
  const [appt, setAppt] = useState<Item | null | undefined>(undefined);
  const first = new Date(month); first.setDate(1 - ((month.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(first); d.setDate(first.getDate() + i); return d; });
  const range = { start: iso(days[0]), end: iso(days[41]) };
  const q = useQuery({ queryKey: ['calendar', range.start], queryFn: () => api<{ items: Item[]; outlook_error: string; mailbox: string; sync: boolean }>(`/calendar?start=${range.start}&end=${range.end}`) });
  const allContent = useQuery({ queryKey: ['content'], queryFn: () => api<{ content: Content[] }>('/content') });
  const byDay = useMemo(() => {
    const m: Record<string, Item[]> = {};
    for (const it of q.data?.items || []) {
      if (hidden.includes(it.source)) continue;
      const s = new Date(it.start.slice(0, 10) + 'T12:00:00'), e = new Date(it.end.slice(0, 10) + 'T12:00:00');
      for (let d = new Date(s); d <= e && (+d - +s) < 40 * 864e5; d.setDate(d.getDate() + 1)) (m[iso(d)] ||= []).push(it);
    }
    Object.values(m).forEach((l) => l.sort((a, b) => (a.all_day === b.all_day ? a.start.localeCompare(b.start) : a.all_day ? -1 : 1)));
    return m;
  }, [q.data, hidden]);
  function open(it: Item) {
    if (it.source === 'content') { setContent((allContent.data?.content || []).find((c) => c.id === it.source_id) || null); return; }
    if (it.source === 'outlook') { setAppt(it); return; }
    if (it.link.startsWith('/')) navigate(it.link.split('?')[0]);
  }
  const today = iso(new Date());
  const title = month.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  return <>
    <PageTitle title="Agenda" sub={q.data ? `Outlook-agenda van ${q.data.mailbox} plus onze planning: events, posts, voyages, releases en meetings.` : 'Onze planning en de Outlook-agenda.'}
      actions={edit ? <><button className="ghost" onClick={() => setAppt(null)}><Icon name="calendar" /> Afspraak</button><button className="primary" onClick={() => { setPresetDate(''); setContent(null); }}><Icon name="plus" /> Post plannen</button></> : null} />
    {q.data?.outlook_error ? <div className="notice"><Icon name="warn" /> {q.data.outlook_error}</div> : null}
    {q.data && !q.data.sync ? <div className="notice"><Icon name="info" /> Synchronisatie naar Outlook staat uit. Zet hem aan bij Admin → Koppelingen → Agenda zodra de app agenda-rechten heeft.</div> : null}
    <div className="toolbar cal-toolbar">
      <div className="row-actions"><button className="icon-btn ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Vorige maand"><Icon name="back" /></button>
        <strong className="cal-title">{title}</strong>
        <button className="icon-btn ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Volgende maand"><Icon name="chevron" /></button>
        <button className="small ghost" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Vandaag</button></div>
      <div className="cal-filters">{SOURCES.map(([k, l]) => <label key={k} className={`cal-chip src-${k} ${hidden.includes(k) ? 'off' : ''}`}><input type="checkbox" className="visually-hidden" checked={!hidden.includes(k)} onChange={() => setHidden(hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k])} />{l}</label>)}</div>
    </div>
    {q.isPending ? <Loading /> : <div className="cal-grid" role="grid">
      {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => <div key={d} className="cal-head">{d}</div>)}
      {days.map((d) => { const key = iso(d); const items = byDay[key] || []; return <div key={key} className={`cal-day ${d.getMonth() !== month.getMonth() ? 'other' : ''} ${key === today ? 'today' : ''}`}
        onDoubleClick={() => { if (edit) { setPresetDate(key); setContent(null); } }}>
        <span className="cal-num">{d.getDate()}</span>
        {items.slice(0, 5).map((it) => <button key={it.id + key} className={`cal-item src-${it.source}`} onClick={() => open(it)} title={[it.title, it.detail, it.location].filter(Boolean).join(' · ')}>
          {!it.all_day && it.start.slice(0, 10) === key ? <b>{it.start.slice(11, 16)}</b> : null} {it.title}</button>)}
        {items.length > 5 ? <small className="cal-more">+{items.length - 5} meer</small> : null}
      </div>; })}
    </div>}
    <p className="helper">Dubbelklik op een dag om daar een post te plannen. Items uit de backoffice komen in Outlook met de categorie “Moonshine”; afspraken die je in Outlook maakt, verschijnen hier en kun je hier bewerken.</p>
    <ContentDialog item={content || null} preset={{ date: presetDate }} open={content !== undefined} onClose={() => setContent(undefined)} />
    <AppointmentDialog item={appt} onClose={() => setAppt(undefined)} onDelete={(id) => run(async () => { await api(`/calendar/outlook/${encodeURIComponent(id)}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['calendar'] }); setAppt(undefined); toast('Afspraak verwijderd.'); })} />
  </>;
}

function AppointmentDialog({ item, onClose, onDelete }: { item: Item | null | undefined; onClose: () => void; onDelete: (id: string) => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const edit = useCanEdit();
  if (item === undefined) return null;
  const a = item;
  if (a && !edit) return <Modal title={a.title} open onClose={onClose}><p>{a.start.replace('T', ' ')} – {a.end.replace('T', ' ')}</p>{a.location ? <p>{a.location}</p> : null}<p className="helper">{a.detail}</p></Modal>;
  return <FormDialog id="appt-form" title={a ? 'Afspraak bewerken' : 'Nieuwe afspraak in Outlook'} open onClose={onClose} submit={async (form) => {
    const v = formValues(form);
    const allDay = 'all_day' in v;
    const body = { title: v.title, location: v.location, detail: v.detail, all_day: allDay, start: allDay ? v.date : `${v.date}T${v.from || '09:00'}`, end: allDay ? (v.date_end || v.date) : `${v.date_end || v.date}T${v.to || v.from || '10:00'}` };
    await api(a ? `/calendar/outlook/${encodeURIComponent(a.source_id)}` : '/calendar/outlook', { method: a ? 'PATCH' : 'POST', body });
    qc.invalidateQueries({ queryKey: ['calendar'] }); toast('Opgeslagen in Outlook.'); onClose();
  }}><div key={a?.id || 'new'}>
    <div className="field"><label htmlFor="ap-title">Titel</label><input id="ap-title" name="title" required defaultValue={a?.title} /></div>
    <div className="form-grid">
      <div className="field"><label htmlFor="ap-date">Datum</label><input id="ap-date" name="date" type="date" required defaultValue={a?.start.slice(0, 10)} /></div>
      <div className="field"><label htmlFor="ap-date2">Tot en met</label><input id="ap-date2" name="date_end" type="date" defaultValue={a?.end.slice(0, 10)} /></div>
      <div className="field"><label htmlFor="ap-from">Van</label><input id="ap-from" name="from" type="time" defaultValue={a && !a.all_day ? a.start.slice(11, 16) : ''} /></div>
      <div className="field"><label htmlFor="ap-to">Tot</label><input id="ap-to" name="to" type="time" defaultValue={a && !a.all_day ? a.end.slice(11, 16) : ''} /></div>
    </div>
    <label><input type="checkbox" name="all_day" defaultChecked={a ? a.all_day : false} /> Hele dag</label>
    <div className="field"><label htmlFor="ap-loc">Locatie</label><input id="ap-loc" name="location" defaultValue={a?.location} /></div>
    <div className="field"><label htmlFor="ap-detail">Notitie</label><textarea id="ap-detail" name="detail" rows={3} defaultValue={a?.detail} /></div>
    {a ? <button type="button" className="text-link" onClick={() => confirm('Afspraak uit Outlook verwijderen?') && onDelete(a.source_id)}>Afspraak verwijderen</button> : null}
  </div></FormDialog>;
}
