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
import { BankPage, DocumentsPage, InvoicesPage, OdooPage, VatPage } from './pages/Finance';
import { ActivityPage, AdminHome, AdminLayout, IntegrationsPage, KeysPage, SettingsPage, UsersPage } from './pages/Admin';
import { Events } from './production/Events';
import { EventPage } from './production/Event';
import { BookingPage } from './production/Booking';
import { ArtistPage, Artists } from './production/Artists';
import { Label } from './production/Label';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10000, refetchOnWindowFocus: true, retry: 1 } } });

function NoAccess() {
  return <PageTitle title="Geen toegang" sub="Deze pagina is niet beschikbaar voor jouw rol." />;
}

/** Route guard per area; the server enforces the same rules. */
function Area({ area }: { area: 'finance' | 'admin' }) {
  const { user } = useAuth();
  return (area === 'admin' ? can.admin(user) : can.finance(user)) ? <Outlet /> : <NoAccess />;
}

/** Login gate: no session → login; temporary password → choose your own first. */
function Gate() {
  const { user, ready } = useAuth();
  if (location.pathname === '/wachtwoord-herstellen') return <ResetPassword />;
  if (!ready) return <div className="loading"><div><Orb state="working" size={64} label="Moonshine openen" />Moonshine openen…</div></div>;
  if (!user) return <Login />;
  if (user.must_change_password) return <div className="forced-password"><PasswordDialog open forced onClose={() => {}} /></div>;
  return <Layout />;
}

const router = createBrowserRouter([{
  element: <Gate />,
  children: [
    { index: true, element: <DashboardPage /> },
    { path: 'taken', element: <TasksPage /> },
    { path: 'evenementen', element: <Events /> },
    { path: 'evenementen/afgelopen', element: <Events past /> },
    { path: 'evenementen/:id', element: <EventPage /> },
    { path: 'evenementen/:id/timetable', element: <EventPage tab="timetable" /> },
    { path: 'evenementen/:id/venue', element: <EventPage tab="venue" /> },
    { path: 'evenementen/:id/notities', element: <EventPage tab="notes" /> },
    { path: 'evenementen/:id/gegevens', element: <EventPage tab="info" /> },
    { path: 'evenementen/:id/artiest/:booking', element: <BookingPage /> },
    { path: 'evenementen/:id/artiest/:booking/vlucht', element: <BookingPage sub="flight" /> },
    { path: 'evenementen/:id/artiest/:booking/hotel', element: <BookingPage sub="hotel" /> },
    { path: 'evenementen/:id/artiest/:booking/vervoer', element: <BookingPage sub="ground" /> },
    { path: 'evenementen/artiesten', element: <Artists /> },
    { path: 'artiesten', element: <Navigate to="/evenementen/artiesten" replace /> },
    { path: 'artiesten/:id', element: <ArtistPage /> },
    { path: 'artiesten/:id/tech', element: <ArtistPage tab="tech" /> },
    { path: 'artiesten/:id/hospitality', element: <ArtistPage tab="hospitality" /> },
    { path: 'artiesten/:id/bestanden', element: <ArtistPage tab="files" /> },
    { path: 'artiesten/:id/optredens', element: <ArtistPage tab="shows" /> },
    { path: 'label', element: <Label tab="releases" /> },
    { path: 'label/planning', element: <Label tab="planning" /> },
    { path: 'label/taken', element: <Label tab="tasks" /> },
    { path: 'label/artiesten', element: <Label tab="artists" /> },
    { path: 'label/afrekeningen', element: <Label tab="statements" /> },
    { element: <Area area="finance" />, children: [
      { path: 'facturen', element: <InvoicesPage /> },
      { path: 'odoo', element: <OdooPage /> },
      { path: 'bank', element: <BankPage /> },
      { path: 'btw', element: <VatPage /> },
      { path: 'documenten', element: <DocumentsPage /> },
    ] },
    { element: <Area area="admin" />, children: [{ path: 'beheer', element: <AdminLayout />, children: [
      { index: true, element: <AdminHome /> },
      { path: 'koppelingen', element: <IntegrationsPage /> },
      { path: 'sleutels', element: <KeysPage /> },
      { path: 'gebruikers', element: <UsersPage /> },
      { path: 'activiteit', element: <ActivityPage /> },
      { path: 'instellingen', element: <SettingsPage /> },
    ] }] },
    { path: '*', element: <Navigate to="/" replace /> },
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
