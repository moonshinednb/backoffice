import { StrictMode } from 'react';
import './lib/i18n';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/style.css';
import './styles/luxury.css';
import './styles/studio.css';
import './styles/events.css';
import './styles/print.css';
import './styles/app.css';
import { AuthProvider, can, useAuth } from './lib/auth';
import { Orb, PageTitle, ToastProvider } from './lib/ui';
import { Layout } from './shell/Layout';
import { PasswordDialog } from './shell/PasswordDialog';
import './shell/pwa';
import { Login } from './login/Login';
import { ResetPassword } from './login/Reset';
import { DashboardPage, TasksPage } from './pages/Work';
import { MeetingPage, MeetingsPage } from './pages/Meetings';
import { CalendarPage } from './pages/Calendar';
import { BankPage, DocumentsPage, FinanceLayout, InvoicesPage, OdooPage, VatPage } from './pages/Finance';
import { ActivityPage, AdminHome, AdminLayout, IntegrationsPage, KeysPage, SettingsPage, UsersPage } from './pages/Admin';
import { Events } from './production/Events';
import { EventPage } from './production/Event';
import { BookingPage } from './production/Booking';
import { ArtistPage, Artists } from './production/Artists';
import { Label } from './production/Label';
import { VoyagePage, VoyagesPage } from './production/Voyages';
import { RosterPage } from './production/Roster';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10000, refetchOnWindowFocus: true, retry: 1 } } });

function NoAccess() {
  return <PageTitle title="Geen toegang" sub="Deze pagina is niet beschikbaar voor jouw rol." />;
}

/** Route guard per area; the server enforces the same rules. */
function Area({ area }: { area: 'finance' | 'admin' }) {
  const { user } = useAuth();
  return (area === 'admin' ? can.admin(user) : can.finance(user)) ? <Outlet /> : <NoAccess />;
}

const LEGACY: Record<string, string> = { 'wachtwoord-herstellen': 'reset-password', evenementen: 'events', afgelopen: 'past', artiesten: 'artists', artiest: 'artist', notities: 'notes',
  gegevens: 'details', vlucht: 'flight', vervoer: 'transport', bestanden: 'files', optredens: 'shows', taken: 'tasks', afrekeningen: 'statements', contacten: 'contacts',
  facturen: 'invoices', btw: 'vat', documenten: 'documents', koppelingen: 'integrations', sleutels: 'keys', gebruikers: 'users', activiteit: 'activity', instellingen: 'settings', beheer: 'admin' };

/** Old Dutch addresses keep working: translate each part and redirect. */
function LegacyRedirect() {
  const parts = location.pathname.split('/').filter(Boolean);
  const next = '/' + parts.map((p) => LEGACY[p] || p).join('/');
  return <Navigate to={parts.some((p) => LEGACY[p]) ? next + location.search : '/'} replace />;
}

/** Login gate: no session → login; temporary password → choose your own first. */
function Gate() {
  const { user, ready } = useAuth();
  if (location.pathname === '/reset-password') return <ResetPassword />;
  if (!ready) return <div className="loading"><div><Orb state="working" size={64} label="Moonshine openen" />Moonshine openen…</div></div>;
  if (!user) return <Login />;
  if (user.must_change_password) return <div className="forced-password"><PasswordDialog open forced onClose={() => {}} /></div>;
  return <Layout />;
}

const router = createBrowserRouter([{
  element: <Gate />,
  children: [
    { index: true, element: <DashboardPage /> },
    { path: 'tasks', element: <TasksPage /> },
    { path: 'calendar', element: <CalendarPage /> },
    { path: 'meetings', element: <MeetingsPage /> },
    { path: 'meetings/:id', element: <MeetingPage /> },
    { path: 'events', element: <Events /> },
    { path: 'events/past', element: <Events past /> },
    { path: 'events/:id', element: <EventPage /> },
    { path: 'events/:id/timetable', element: <EventPage tab="timetable" /> },
    { path: 'events/:id/venue', element: <EventPage tab="venue" /> },
    { path: 'events/:id/notes', element: <EventPage tab="notes" /> },
    { path: 'events/:id/content', element: <EventPage tab="content" /> },
    { path: 'events/:id/details', element: <EventPage tab="info" /> },
    { path: 'events/:id/artist/:booking', element: <BookingPage /> },
    { path: 'events/:id/artist/:booking/flight', element: <BookingPage sub="flight" /> },
    { path: 'events/:id/artist/:booking/hotel', element: <BookingPage sub="hotel" /> },
    { path: 'events/:id/artist/:booking/transport', element: <BookingPage sub="ground" /> },
    { path: 'events/artists', element: <Artists /> },
    { path: 'artists', element: <RosterPage /> },
    { path: 'artists/:id', element: <ArtistPage /> },
    { path: 'artists/:id/tech', element: <ArtistPage tab="tech" /> },
    { path: 'artists/:id/hospitality', element: <ArtistPage tab="hospitality" /> },
    { path: 'artists/:id/files', element: <ArtistPage tab="files" /> },
    { path: 'artists/:id/shows', element: <ArtistPage tab="shows" /> },
    { path: 'voyages', element: <VoyagesPage /> },
    { path: 'voyages/:id', element: <VoyagePage /> },
    { path: 'label', element: <Label tab="releases" /> },
    { path: 'label/planning', element: <Label tab="planning" /> },
    { path: 'label/tasks', element: <Label tab="tasks" /> },
    { path: 'label/artists', element: <Label tab="artists" /> },
    { path: 'label/feedback', element: <Label tab="feedback" /> },
    { path: 'label/feedback/:id', element: <Label tab="feedback-track" /> },
    { path: 'label/promo', element: <Label tab="promo" /> },
    { path: 'label/promo/contacts', element: <Label tab="promo-contacts" /> },
    { path: 'label/promo/:id', element: <Label tab="promo-campaign" /> },
    { path: 'label/statements', element: <Label tab="statements" /> },
    { element: <Area area="finance" />, children: [{ element: <FinanceLayout />, children: [
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'odoo', element: <OdooPage /> },
      { path: 'bank', element: <BankPage /> },
      { path: 'vat', element: <VatPage /> },
      { path: 'documents', element: <DocumentsPage /> },
    ] }] },
    { element: <Area area="admin" />, children: [{ path: 'admin', element: <AdminLayout />, children: [
      { index: true, element: <AdminHome /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'keys', element: <KeysPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ] }] },
    { path: '*', element: <LegacyRedirect /> },
  ],
}]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
