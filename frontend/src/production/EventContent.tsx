import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { fullDate } from '../lib/format';
import { Badge, Empty, Icon, Loading } from '../lib/ui';
import { CONTENT_STATUS, Content, ContentDialog, KINDS } from '../pages/Calendar';
import { useTeam } from '../pages/shared';
import { useCanEdit } from './common';

const STATUS_COLOR: Record<string, string> = { idea: '', making: 'blue', review: 'amber', ready: 'lime', posted: 'purple' };

/** Promo planning for one event or release: what gets posted, when, by whom. */
export function ContentPlan({ eventId, releaseId }: { eventId?: string; releaseId?: string }) {
  const edit = useCanEdit();
  const [item, setItem] = useState<Content | null | undefined>(undefined);
  const q = useQuery({ queryKey: ['content', eventId || releaseId], queryFn: () => api<{ content: Content[] }>(`/content?${eventId ? 'event_id=' + eventId : 'release_id=' + releaseId}`) });
  const kinds = Object.fromEntries(KINDS), statuses = Object.fromEntries(CONTENT_STATUS);
  const NAMES = Object.fromEntries(useTeam());
  const button = edit ? <button className="small" onClick={() => setItem(null)}><Icon name="plus" /> Post plannen</button> : null;
  return <section className="card">
    <div className="card-head"><div><h2>Promo en content</h2><p>Reels, TikToks, announcements en posts. Staan ook in de agenda en in Outlook.</p></div>{button}</div>
    {q.isPending ? <Loading /> : q.data?.content.length ? <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Wat</th><th>Platforms</th><th>Wie</th><th>Status</th><th /></tr></thead><tbody>
      {q.data.content.map((c) => <tr key={c.id} className="clickable" onClick={() => setItem(c)}>
        <td className="nowrap">{c.date ? fullDate(c.date) : 'Nog geen datum'}{c.time ? ' ' + c.time : ''}</td>
        <td><strong>{c.title}</strong><small className="block">{kinds[c.kind]}</small></td><td>{c.platforms.join(', ') || '—'}</td><td>{NAMES[c.assignee] || '—'}</td>
        <td><Badge color={STATUS_COLOR[c.status]}>{statuses[c.status]}</Badge></td><td>{c.file_url ? <a href={c.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="folder" /></a> : null}</td></tr>)}
    </tbody></table></div> : <Empty title="Nog geen posts gepland" sub="Plan de artist announcements, line-up, reels en after-posts; zo ziet iedereen wat er wanneer online moet." action={button} icon="calendar" />}
    <ContentDialog item={item || null} preset={{ event_id: eventId, release_id: releaseId }} open={item !== undefined} onClose={() => setItem(undefined)} />
  </section>;
}
