import { locale } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { can, useAuth } from '../lib/auth';
import { ROLE } from '../lib/format';
import { Avatar, Icon, Modal } from '../lib/ui';
import { ChatButton, ChatWidget } from './Chat';
import { NotificationBell } from './Notifications';
import { ProfileDialog } from './Profile';
import { PasswordDialog } from './PasswordDialog';
import { installSteps } from './pwa';
import { FeatureRequestDialog } from './FeatureRequest';
import { Theme, setTheme, storedTheme } from '../lib/theme';

type Item = [path: string, label: string, icon: string];
const FINANCE = ['/invoices', '/odoo', '/bank', '/vat', '/documents'];

export function sections(role: string): [string, Item[]][] {
  const all: [string, Item[]][] = [
    ['Werkplek', [['/', 'Overzicht', 'dashboard'], ['/calendar', 'Agenda', 'calendar'], ['/tasks', 'Taken', 'tasks'], ['/meetings', 'Meetings', 'users']]],
    ['Productie', [['/events', 'Evenementen', 'calendar'], ['/artists', 'Artists', 'user'], ['/voyages', 'Voyages', 'plane'], ['/label', 'Label', 'music']]],
    ['Financiën', [['/invoices', 'Financiën', 'wallet']]],
    ['Beheer', [['/admin', 'Admin', 'settings']]],
  ];
  return all.filter(([name]) => !(name === 'Beheer' && role !== 'admin'));
}

export function Layout() {
  const { user, logout, version } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  const [password, setPassword] = useState(false);
  const [install, setInstall] = useState(false);
  const [me, setMe] = useState(false);
  const [wish, setWish] = useState(false);
  const [chat, setChat] = useState(false);
  const [theme, setThemeState] = useState<Theme>(storedTheme());
  const docs = useQuery({ queryKey: ['review-count'], queryFn: () => api<{ documents: { status: string }[] }>('/documents?limit=2000'), enabled: can.finance(user), refetchInterval: 30000 });
  const review = docs.data?.documents.filter((d) => d.status === 'review').length || 0;
  useEffect(() => { setMenu(false); setProfile(false); }, [location.pathname]);
  if (!user) return null;
  const nav = sections(user.role);
  const path = location.pathname;
  const current = nav.flatMap(([section, items]) => items.map((i) => [section, ...i] as const))
    .filter(([, p]) => p === '/' ? path === '/' : path.startsWith(p)).sort((a, b) => b[1].length - a[1].length)[0];

  return (
    <div className="layout">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <Link className="brand" to="/"><img src="/assets/moonshine-logo.svg" alt="Moonshine" /><div><div className="brand-name">Backoffice</div></div></Link>
        {nav.map(([section, items]) => (
          <div key={section}>
            <div className="nav-label">{section}</div>
            <nav className="nav" aria-label={section}>
              {items.map(([path, label, icon]) => (
                <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => (isActive || (path === '/invoices' && FINANCE.some((f) => location.pathname.startsWith(f))) ? 'active' : '')}>
                  <Icon name={icon} />{label}{path === '/invoices' && review ? <span className="nav-count">{review}</span> : null}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
        <div className="side-bottom">
          <button className="feature-btn" onClick={() => { setMenu(false); setWish(true); }}><Icon name="spark" /><span><strong>Feature request</strong><small>Iets missen of anders willen?</small></span></button>
          <div className="connection-mini"><Icon name="lock" /> Besloten Moonshine-omgeving{version ? <span className="app-version">{version}</span> : null}</div></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu icon-btn" onClick={() => setMenu(!menu)} aria-label="Menu openen" aria-expanded={menu}><Icon name="menu" /></button>
          <div className="breadcrumb">{current ? current[0] : 'Werkplek'} <span>/ {current ? current[2] : 'Overzicht'}</span></div>
          <div className="top-actions">
            <span className="top-date">{new Date().toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long' })}</span>
            <ChatButton open={chat} onToggle={() => setChat(!chat)} />
            <NotificationBell />
            <div className="profile-control">
              <button className="profile-trigger" onClick={() => setProfile(!profile)} aria-expanded={profile} aria-label={`Profielmenu van ${user.name}`}>
                <Avatar user={user} /><Icon name="chevron" />
              </button>
              {profile ? (
                <div className="profile-menu">
                  <div className="profile-summary"><strong>{user.name}</strong><span>@{user.username} · {ROLE[user.role]}</span></div>
                  <div className="profile-options" role="group" aria-label="Accountopties">
                    <button onClick={() => { setProfile(false); setMe(true); }}><Icon name="user" /> Mijn profiel</button>
                    <button onClick={() => { setProfile(false); setPassword(true); }}><Icon name="lock" /> Wachtwoord wijzigen</button>
                    <button onClick={() => { setProfile(false); setInstall(true); }}><Icon name="download" /> Installeer als app</button>
                    <div className="theme-pick" role="group" aria-label="Weergave">{([['dark', 'Nacht'], ['light', 'Dag'], ['system', 'Systeem']] as [Theme, string][]).map(([k, l]) =>
                      <button key={k} className={theme === k ? 'active' : ''} aria-pressed={theme === k} onClick={() => { setTheme(k); setThemeState(k); }}>{l}</button>)}</div>
                    {user.role === 'admin' ? <button onClick={() => navigate('/admin/instellingen')}><Icon name="settings" /> Werkplekinstellingen</button> : null}
                  </div>
                  <div className="profile-signout"><button onClick={logout}><Icon name="logout" /> Uitloggen</button></div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="content" id="content"><Outlet /></div>
      </main>
      <PasswordDialog open={password} onClose={() => setPassword(false)} />
      <ProfileDialog open={me} onClose={() => setMe(false)} onPassword={() => { setMe(false); setPassword(true); }} />
      <ChatWidget open={chat} onClose={() => setChat(false)} />
      <FeatureRequestDialog open={wish} onClose={() => setWish(false)} />
      <Modal title="Moonshine als app" open={install} onClose={() => setInstall(false)} footer={<button onClick={() => setInstall(false)}>Sluiten</button>}>
        {installSteps()}
      </Modal>
    </div>
  );
}
