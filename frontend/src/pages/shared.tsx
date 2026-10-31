/* Shared finance and workspace data: documents, uploads, tasks. */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DragEvent, KeyboardEvent, useState } from 'react';
import { api } from '../lib/api';
import { can, useAuth, User } from '../lib/auth';
import { Badge, Icon, Orb, useToast } from '../lib/ui';

export type Doc = { id: string; name: string; mime: string; size: number; source: string; status: string; odoo_id: number | null; error: string | null; created: number; updated: number;
  details: { supplier?: string; number?: string; date?: string; total?: number; currency?: string; confidence?: number; onedrive_url?: string; [k: string]: any } };
export type Task = { id: string; title: string; description: string; assignee: string | null; assignees: string[]; due: string | null; priority: string; done: boolean; release?: string };
export type Connection = { id: string; name: string; status: string; checked: number | null; error?: string; message?: string };

export const useDocuments = (enabled = true) => useQuery({ queryKey: ['documents'], queryFn: () => api<{ documents: Doc[] }>('/documents?limit=2000'), enabled, refetchInterval: 20000 });
export const useTasks = () => useQuery({ queryKey: ['tasks'], queryFn: () => api<{ tasks: Task[] }>('/tasks'), refetchInterval: 30000 });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: () => api<{ users: User[] }>('/users') });
export const useConnections = () => useQuery({ queryKey: ['connections'], queryFn: () => api<{ connections: Connection[] }>('/connections') });

const STATUS: Record<string, [string, string]> = { posted: ['Geboekt', 'lime'], review: ['Controle nodig', 'amber'], awaiting_ai: ['Wacht op AI', 'purple'], processing: ['Wordt verwerkt', 'blue'] };

export function DocumentBadge({ d }: { d: Doc }) {
  const [label, color] = STATUS[d.status] || [d.status, ''];
  const badge = <Badge color={color}>{label}</Badge>;
  if (d.status === 'processing' || d.status === 'awaiting_ai') return <span className="status-orb"><Orb state={d.status === 'processing' ? 'solving' : 'working'} label={label} />{badge}</span>;
  return badge;
}

export function ConnectionBadge({ c }: { c?: Connection }) {
  if (!c) return null;
  return c.status === 'verified' ? <Badge color="lime">Geverifieerd</Badge> : c.status === 'failed' ? <Badge color="red">Werkt niet</Badge> : c.status === 'configured' ? <Badge color="amber">Nog testen</Badge> : <Badge>Niet gekoppeld</Badge>;
}

/** Upload invoices: file picker or dropped files, one at a time. */
export function useUpload() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function upload(files?: FileList | null) {
    if (!can.write(user)) return toast('Je hebt alleen leesrechten.', true);
    if (!files) {
      const el = document.createElement('input');
      el.type = 'file'; el.multiple = true; el.accept = '.pdf,.jpg,.jpeg,.png,.webp';
      el.onchange = () => upload(el.files);
      el.click();
      return;
    }
    if (busy) return toast('Er loopt al een upload.');
    setBusy(true);
    let added = 0, duplicates = 0;
    try {
      for (const f of Array.from(files)) {
        if (f.size > 15 * 1024 * 1024) throw new Error(`${f.name}: maximaal 15 MB.`);
        const fd = new FormData();
        fd.append('files', f);
        toast('Uploaden: ' + f.name);
        const r = await api<{ files: { duplicate: boolean }[] }>('/documents/upload', { method: 'POST', body: fd });
        for (const item of r.files) item.duplicate ? duplicates++ : added++;
      }
      toast(`${added} bestand(en) opgeslagen${duplicates ? ` · ${duplicates} al aanwezig` : ''}.`);
    } catch (e) {
      toast((added ? `${added} bestand(en) opgeslagen. ` : '') + (e as Error).message, true);
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['review-count'] });
    }
  }
  return { upload, busy };
}

export function UploadZone() {
  const { upload, busy } = useUpload();
  const [drag, setDrag] = useState(false);
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); upload(); } };
  const drop = (e: DragEvent) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); };
  return (
    <div className={`upload-zone ${drag ? 'dragging' : ''}`} tabIndex={0} role="button" aria-label="Factuur uploaden" onKeyDown={key} onClick={() => upload()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={drop}>
      <div className="upload-symbol">{busy ? <Orb state="weaving" size={32} /> : <Icon name="upload" />}</div>
      <h3>Factuur uploaden</h3><p>Sleep een factuur of bon naar dit venster.<br />PDF of afbeelding · maximaal 15 MB</p>
      <button className="small" type="button">Bestand kiezen</button>
    </div>
  );
}
