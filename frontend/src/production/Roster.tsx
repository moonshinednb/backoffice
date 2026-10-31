import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { fullDate } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, PageTitle } from '../lib/ui';

type Row = { id: string; name: string; full_name: string; photo: string; socials: Record<string, string>; city: string; genres: string; epk_folder: string;
  agency: string; instagram: string; email: string; releases: number; latest_release: string; upcoming_shows: number; has_rider: boolean; has_bio: boolean };
export const SOCIAL_LABEL: Record<string, string> = { spotify: 'Spotify', soundcloud: 'SoundCloud', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', beatport: 'Beatport', bandcamp: 'Bandcamp', website: 'Website' };

/** The Moonshine artists (marked "Artiest van het Moonshine-label"). */
export function RosterPage() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['roster'], queryFn: () => api<{ artists: Row[] }>('/roster') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  return <>
    <PageTitle eyebrow="Productie" title="Artists" sub="De Moonshine-artiesten: profiel, foto, socials, EPK, releases en komende shows." />
    {q.data.artists.length ? <div className="roster-grid">{q.data.artists.map((a) => {
      const missing = [!a.photo && 'foto', !a.has_bio && 'bio', !a.epk_folder && 'EPK', !a.has_rider && 'rider', !Object.keys(a.socials).length && 'socials'].filter(Boolean);
      return <article key={a.id} className="card roster-card" tabIndex={0} onClick={() => navigate(`/artists/${a.id}`)} onKeyDown={(k) => k.key === 'Enter' && navigate(`/artists/${a.id}`)}>
        <div className="roster-photo">{a.photo ? <img src={a.photo} alt="" loading="lazy" /> : <span>{a.name.slice(0, 2).toUpperCase()}</span>}</div>
        <div className="roster-body">
          <h3>{a.name}</h3>
          <p className="helper">{[a.genres, a.city].filter(Boolean).join(' · ') || 'Genre en plaats nog invullen'}</p>
          <div className="roster-socials">{Object.entries(a.socials).map(([k, url]) => <a key={k} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{SOCIAL_LABEL[k] || k}</a>)}
            {a.epk_folder ? <a href={a.epk_folder} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="folder" /> EPK</a> : null}</div>
          <div className="roster-stats"><span><b>{a.releases}</b> releases{a.latest_release ? ` · laatste ${fullDate(a.latest_release)}` : ''}</span><span><b>{a.upcoming_shows}</b> komende shows</span></div>
          {missing.length ? <Badge color="amber">{`Nog nodig: ${missing.join(', ')}`}</Badge> : <Badge color="lime">Profiel compleet</Badge>}
        </div>
      </article>; })}</div>
      : <Empty title="Nog geen Moonshine-artiesten" sub="Open een artiest (Evenementen → Artiesten) en vink “Artiest van het Moonshine-label” aan." icon="user" />}
  </>;
}
