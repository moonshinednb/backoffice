import { ChangeEvent, useState } from 'react';
import { api } from '../lib/api';
import { User, useAuth } from '../lib/auth';
import { ROLE } from '../lib/format';
import { Avatar, Icon, Modal, Orb, formValues, useToast } from '../lib/ui';

/** My profile: photo, name, contact details and language. */
export function ProfileDialog({ open, onClose, onPassword }: { open: boolean; onClose: () => void; onPassword: () => void }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  async function photo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    setBusy(true);
    try { setUser((await api<{ user: User }>('/profile/avatar', { method: 'POST', body })).user); setError(''); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function removePhoto() {
    try { setUser((await api<{ user: User }>('/profile/avatar', { method: 'DELETE' })).user); } catch (err) { setError((err as Error).message); }
  }
  async function save(form: HTMLFormElement) {
    setBusy(true);
    try {
      setUser((await api<{ user: User }>('/profile', { method: 'PATCH', body: formValues(form) })).user);
      toast(form.language.value === 'en' ? 'Profile saved.' : 'Profiel opgeslagen.');
      onClose();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <Modal title="Mijn profiel" open={open} onClose={onClose} error={error}
      footer={<><button className="ghost" onClick={onPassword}><Icon name="lock" /> Wachtwoord wijzigen</button><button className="primary" type="submit" form="profile-form" disabled={busy}>Opslaan</button></>}>
      <div className="profile-detail">
        <Avatar user={user} size={72} />
        <div><h3>{user.name}</h3><p>@{user.username} · {ROLE[user.role]}</p>
          <div className="row-actions">
            <label className="small-btn">{busy ? <Orb state="weaving" /> : <Icon name="upload" />} Foto kiezen<input type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={photo} /></label>
            {user.avatar ? <button type="button" className="small ghost" onClick={removePhoto}>Foto verwijderen</button> : null}
          </div></div>
      </div>
      <form id="profile-form" key={user.id + user.language} onSubmit={(e) => { e.preventDefault(); save(e.currentTarget); }}>
        <div className="form-grid">
          <div className="field"><label htmlFor="p-name">Naam</label><input id="p-name" name="name" defaultValue={user.name} required /></div>
          <div className="field"><label htmlFor="p-title">Functie</label><input id="p-title" name="job_title" defaultValue={user.job_title} placeholder="Bijv. Productie" /></div>
          <div className="field"><label htmlFor="p-email">E-mail</label><input id="p-email" name="email" type="email" defaultValue={user.email} /></div>
          <div className="field"><label htmlFor="p-phone">Telefoon</label><input id="p-phone" name="phone" type="tel" defaultValue={user.phone} /></div>
          <div className="field"><label htmlFor="p-lang">Taal / Language</label><select id="p-lang" name="language" defaultValue={user.language}><option value="en">English</option><option value="nl">Nederlands</option></select></div>
        </div>
      </form>
    </Modal>
  );
}
