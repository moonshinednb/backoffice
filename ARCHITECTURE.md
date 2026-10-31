# Projectkaart Moonshine Backoffice

Lees dit eerst; dan hoef je niet de hele code door. Houd het bij als er iets structureels verandert.

## Stack
- **backend/**: Django 5.2 + Django Ninja (`/api`), PostgreSQL in productie (sqlite lokaal), sessie-auth + CSRF (`X-CSRFToken`).
- **worker**: `manage.py run_worker` (jobs/queue.py): takenwachtrij (`Job`) + periodieke taken (`Schedule`).
- **frontend/**: React 19 + Vite + TS, React Router 7, TanStack Query. Gebouwd naar `frontend/dist`, door Django geserveerd (config/spa.py).
- **Docker**: `docker-compose.yml` met `backoffice` (gunicorn), `worker`, `db` (postgres, volume `pgdata`). Data/bestanden in `/data` = `~/apps/backoffice-data`.

## Backend-apps
| App | Inhoud |
|---|---|
| `config/` | settings (env-gestuurd), urls (api, SPA, JSON-404/CSRF), api.py (routers + foutafhandeling `{"error"}`) |
| `core/` | `User` (role `admin`/`staff`, must_change_password, language, avatar), Setting, AuditLog, Task (`release` = release-id), Notification, ChatMessage/ChatRead, PasswordReset, LoginAttempt |
| `core/views.py` | auth, gebruikers (admin), taken, instellingen + sleutels (`secrets.json`, nooit naar frontend), koppelingen, audit, dashboard (+`admin`-blok) |
| `core/chat.py` | profiel + foto (`DATA/avatars`), teamchat (`team` of user-id) |
| `core/reset.py` | wachtwoord vergeten via Resend (token-hash, 30 min, eenmalig) |
| `core/notify.py` | meldingen: `done()` naar betrokkenen (actors in AuditLog voor de entity), `assigned()`, `deadlines()` (periodiek) |
| `core/access.py` | `require(request, area, write)`: area `admin` = alleen role admin; staff mag verder alles |
| `finance/` | Document (facturen), Transaction, boeken in Odoo, bank/SumUp, btw, export |
| `production/` | Event, Act, Booking (+showday_contact/phone), Artist (+contact_via agency/self, on_label), Asset (OneDrive-sync), ChecklistItem, Send (venue-mail via Graph), Release + ReleaseStep (planning, auto 7 stappen), LabelStatement, Contract |
| `production/drive.py` | OneDrive-mappenbomen: event (`2. Events/<datum>[ <naam>]/01 Finance, 02 EPKs, 03 Riders, 04 Artwork, 05 Content, 06 Productie, 07 Na afloop`), artiest in line-up (`02 EPKs/<artiest>`), release (`4. Releases/<MSxxx> - <artiest> - <titel>/…`); sjablonen als instellingen `drive_*`; worker-jobs `drive_event/booking/release`; hernoemt bij naamswijziging; `archive_past` (dagelijks) zet eventmappen een week na de datum in `_Past Events`; `event_files` voor de tab Bestanden; `event_base` = huidige plek van de eventmap. Uploads (`services.asset_drive_path`): riders → `03 Riders/<artiest> - <bestand>`, EPK-materiaal → `02 EPKs/<artiest>/`, eigen artiesten → `Artists/<naam>/`, overige artiesten → `2. Events/_Artiesten/<naam>/`. Event-finance (01 Finance) loopt via Luxor, los van de finance-module |
| `production/steps.py` | Teamchecklist per event (`EventStep`): fases prep/promo/production/after, eigenaar via rollen (`event_roles`, standaard bookings+artwork peppy, advancing shoroy, promo anne, juridisch bram, boekhouding niels), deadline = eventdatum + offset; `auto` = OneDrive-map die het punt afvinkt (`auto_check`), advancingmail vinkt 'advancing_sent'; alleen voor komende events; worker 'Eventchecklist bijwerken' (elk uur); herinneringen in `core/notify.deadlines` |
| `production/people.py` | Crewlist (`CrewMember`: naam, rol, act, auto's) en guestlist (`Guest`: naam, +1s, backstage, relatie, gezet door) per event; export = Excel met twee tabbladen in het teamformat → `06 Productie/CREWLIST + GUESTLIST dd-mm-jj.xlsx` (worker-job `event_lists`, 20 s na een wijziging); import uit bestaande Excel in de eventmap; core crew overnemen van vorig event of `ASSETS/TEMPLATE CREWLIST + GUESTLIST.xlsx`; bij venuemail-item 'guestlist' gaat de Excel mee |
| `production/drive_tidy.py` + `manage.py tidy_event_folders` | Oude eventmappen in de standaardboom zetten: alleen hernoemen/verplaatsen, logboek in `DATA_DIR/drive-moves/`, `--undo <log>` draait terug; koppelt datummappen aan events |
| `production/rules.py` | pure regels: validatie, `missing_items` (advancing compleet?), `contact_via`, `needs_id`, pdf's |
| `production/voyages.py` | Voyages: outbound shows (Voyage + VoyageNote contactlog), OneDrive-map `2. Events/_Voyages/…` |
| `feedback/` | Track feedback: Track, Review (per persoon productie/compositie 1–10, oordeel, feedback), TrackLog; audio op OneDrive `3. Scouting/Demo's/<artiest>/` + stream-redirect; import `manage.py import_track_feedback` (TRACK FEEDBACK.xlsx + Feedback Files/<n>.docx + Track options + V2) |
| `meetings/` | Meeting (tekst van de Word-notulen op OneDrive `1. Vergaderingen/<jaar>/<maand>/…`) + Action (actiepunt per persoon); AI-extractie via `integrations/claude.complete_json` met fallback; nieuw = sjabloon kopiëren naar OneDrive; worker leest recente notulen elke 30 min; import `manage.py import_meetings` |
| `planning/` | ContentItem (posts/reels per event of release) + OutlookLink; `/calendar` voegt onze planning en de Outlook-agenda samen; worker schrijft onze items naar Outlook (categorie Moonshine, vereist Calendars.ReadWrite) |
| `promo/` | Contact, Template, Campaign, Recipient; import Excel (openpyxl), verzenden via Graph `send_mail` in worker-job `promo_send` |
| `integrations/` | http.py (veilige HTTPS), graph.py (Microsoft), odoo.py, claude.py (AI-factuurlezer met aanbieder-keuze: Claude, Gemini, OpenAI-compatibel; instellingen `ai_*`), providers.py (LabelGrid, OpenSign, To Do), resend.py, checks.py (verbinding testen) |
| `jobs/` | Job/Schedule, queue.py (handlers + periodic) |

Meldingen-hooks zitten in: core/views.py (taken), production/services.py (`booking_update`, `step_save`), finance/services.py (`post_document`), promo/services.py (`send_batch`).

## API (alle onder /api)
auth: `/auth/{login,logout,me,password,forgot,reset}` · profiel: `/profile`, `/profile/avatar`, `/avatars/{id}` · `/users` · `/tasks` · `/settings` · `/connections`, `/connections/test` · `/audit` · `/dashboard` · `/notifications`, `/notifications/read` · `/chat`, `/chat/{conv}`
financiën: `/documents…`, `/transactions…`, `/sumup/settle`, `/vat`, `/odoo/overview`, `/export`
productie: `/events…` (overview, bookings, acts, checklist, notes, files, steps, steps/check, advancing.pdf, send-preview, send), `/event-steps/{id}[/task]`, `/my-event-steps`, `/event-roles`, `/events/{id}/people[.xlsx|/import]`, `/events/{id}/crew[/copy]`, `/events/{id}/guests`, `/crew/{id}`, `/guests/{id}`, `/bookings/{id}`, `/acts/{id}`, `/checklist/{id}`, `/artists…` (rider.pdf), `/assets…`, `/releases…`, `/releases/{id}/steps`, `/release-steps/{id}`, `/label/artists`, `/label/pull`, `/contracts`
promo: `/promo/contacts…`, `/promo/import`, `/promo/templates…`, `/promo/campaigns…` (recipients, preview, test, send), `/promo/recipients/{id}/dm`
webhooks: `/webhooks/{bank,outlook,opensign}`

## Frontend (frontend/src)
- `main.tsx`: routes + Gate (login / verplicht wachtwoord / herstelpagina `/wachtwoord-herstellen`).
- `shell/`: Layout (zijbalk: Werkplek=Overzicht+Agenda+Taken+Meetings, Productie=Evenementen+Artists (Moonshine-roster, `/roster`)+Voyages+Label, Financiën (één kopje met tabs), Beheer=Admin alleen voor admins), Chat (zwevend), Notifications (bel), Profile, PasswordDialog, pwa.
- `lib/`: api.ts (fetch + CSRF + nette fouten), auth.tsx, ui.tsx (Modal, Tabs, Orb, Avatar, toasts), format.ts, icons.tsx, **i18n.ts** (UI is in het Nederlands geschreven; Engels = standaard, vertaald via woordenboek + MutationObserver. Nieuwe teksten: voeg NL→EN toe aan `D` of een patroon aan `P`).
- `pages/`: Work (dashboard, taken, TaskDialog), Finance, Admin (koppelingen, sleutels, gebruikers, activiteit, instellingen), shared.
- `production/`: Events (+tabs incl. Artiesten), Event, Booking (+reis), Artists, Label (releases, planning, taken, promo, artiesten, afrekeningen), Promo, common (Field, ContactBlock, TravelId, AssetGroups, FormDialog, useDirty).
- Routes (Engels; oude Nederlandse adressen worden doorgestuurd via `LegacyRedirect` in main.tsx): `/events[/past|/artists|/:id[/advancing|timetable|venue|crew|guests|files|content|notes|details]` (`/events/:id` = checklist)|/:id/artist/:booking[/flight|hotel|transport]]`, `/artists/:id[/tech|hospitality|files|shows]`, `/label[/planning|tasks|promo[/contacts|/:id]|artists|statements]`, `/invoices`, `/odoo`, `/bank`, `/vat`, `/documents`, `/tasks`, `/admin[/integrations|keys|users|activity|settings]`, `/reset-password`. Django-admin staat op `/django-admin/`.
- Styling: bestaande css in `styles/` + `styles/app.css` voor nieuwe stukken.

## Afspraken
- Tests: `cd backend && python manage.py test` (core, production, promo). Frontend: `npx tsc --noEmit -p . && npm run build`.
- Migraties per app; datamigraties waar bestaande data moet meekomen.
- Gebruikers: peppy + luc = admin, de rest staff. Tijdelijke wachtwoorden → `must_change_password`.
- Nieuwe koppeling: sleutel in `SECRET_KEYS`, instelling in `SETTING_KEYS` (core/views.py), provider in `connections()`, test in integrations/checks.py, formulier in pages/Admin.tsx (`PROVIDERS`, `TEXT`, `KEYS`).
- Lokaal draaien: `MOONSHINE_DATA=<map> python manage.py runserver`, frontend `npm run build` (of `npm run dev` met proxy).
